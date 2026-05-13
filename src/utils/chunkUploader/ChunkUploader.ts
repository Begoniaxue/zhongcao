import type {
  ChunkItem,
  UploadFile,
  UploadStatus,
  UploadOptions,
  UploadCallbacks,
  NetworkStatus
} from './types'
import {
  DEFAULT_CHUNK_SIZE,
  DEFAULT_CONCURRENCY,
  DEFAULT_MAX_RETRIES,
  DEFAULT_RETRY_DELAY,
  SPEED_UPDATE_INTERVAL
} from './constants'
import { HashCalculator } from './hashCalculator'
import { indexedDBManager } from './indexedDB'
import { networkDetector } from './networkDetector'

type UploadTask = {
  file: UploadFile
  options: UploadOptions
  callbacks: UploadCallbacks
  abortController: AbortController
  isPaused: boolean
  isCancelled: boolean
  activeRequests: Set<Promise<void>>
  retryMap: Map<number, number>
  uploadedBytes: number
  lastUpdateTime: number
  lastUploadedBytes: number
  speedTimer: ReturnType<typeof setInterval> | null
  networkUnsubscribe: (() => void) | null
  queue: ChunkItem[]
  queueIndex: number
  xhrList: Set<XMLHttpRequest>
}

export class ChunkUploader {
  private options: UploadOptions
  private activeTasks: Map<string, UploadTask> = new Map()

  constructor(options: UploadOptions = {}) {
    this.options = {
      chunkSize: DEFAULT_CHUNK_SIZE,
      concurrency: DEFAULT_CONCURRENCY,
      maxRetries: DEFAULT_MAX_RETRIES,
      retryDelay: DEFAULT_RETRY_DELAY,
      ...options
    }

    networkDetector.start()
  }

  destroy(): void {
    networkDetector.stop()
    this.activeTasks.forEach((task) => {
      this.cleanupTask(task)
    })
    this.activeTasks.clear()
  }

  async upload(file: File, callbacks: UploadCallbacks = {}, options: UploadOptions = {}): Promise<UploadFile> {
    const mergedOptions = { ...this.options, ...options }

    const uploadFile: UploadFile = {
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      hash: '',
      status: 'pending',
      chunks: [],
      uploadedChunks: 0,
      totalChunks: 0,
      progress: 0,
      speed: 0
    }

    const task: UploadTask = {
      file: uploadFile,
      options: mergedOptions,
      callbacks,
      abortController: new AbortController(),
      isPaused: false,
      isCancelled: false,
      activeRequests: new Set(),
      retryMap: new Map(),
      uploadedBytes: 0,
      lastUpdateTime: Date.now(),
      lastUploadedBytes: 0,
      speedTimer: null,
      networkUnsubscribe: null,
      queue: [],
      queueIndex: 0,
      xhrList: new Set()
    }

    this.activeTasks.set(this.generateTaskId(file), task)

    try {
      this.updateStatus(task, 'calculating')
      const hash = await HashCalculator.calculate(file, mergedOptions.chunkSize!, (progress) => {
        uploadFile.progress = progress * 5
        callbacks.onProgress?.(uploadFile.progress, uploadFile)
      })
      uploadFile.hash = hash

      this.createChunks(task)

      const savedProgress = await indexedDBManager.getProgress(hash)
      if (savedProgress) {
        savedProgress.uploadedChunks.forEach((index) => {
          const chunk = uploadFile.chunks[index]
          if (chunk) {
            chunk.uploaded = true
            chunk.progress = 100
          }
        })
        uploadFile.uploadedChunks = savedProgress.uploadedChunks.length
        task.uploadedBytes = savedProgress.uploadedChunks.reduce((sum, idx) => {
          const chunk = uploadFile.chunks[idx]
          return sum + (chunk?.size || 0)
        }, 0)
        this.updateProgress(task)
      }

      if (uploadFile.uploadedChunks === uploadFile.totalChunks) {
        await this.mergeChunks(task)
        return uploadFile
      }

      this.updateStatus(task, 'ready')
      await this.startUpload(task)

      return uploadFile
    } catch (error) {
      this.updateStatus(task, 'failed')
      callbacks.onFailed?.(error as Error, uploadFile)
      this.cleanupTask(task)
      throw error
    }
  }

  pause(file: File | string): void {
    const taskId = typeof file === 'string' ? file : this.generateTaskId(file)
    const task = this.activeTasks.get(taskId)

    if (task && (task.file.status === 'uploading' || task.file.status === 'retrying')) {
      task.isPaused = true
      task.abortController.abort()
      
      task.xhrList.forEach((xhr) => {
        try {
          xhr.abort()
        } catch (e) {
        }
      })
      task.xhrList.clear()
      
      this.updateStatus(task, 'paused')
    }
  }

  async resume(file: File | string): Promise<void> {
    const taskId = typeof file === 'string' ? file : this.generateTaskId(file)
    const task = this.activeTasks.get(taskId)

    if (task && (task.file.status === 'paused' || task.file.status === 'network_error')) {
      if (task.activeRequests.size > 0) {
        try {
          await Promise.race([
            Promise.all(task.activeRequests),
            new Promise(resolve => setTimeout(resolve, 1000))
          ])
        } catch (e) {
        }
      }
      
      task.activeRequests.clear()
      task.isPaused = false
      task.abortController = new AbortController()
      this.updateStatus(task, 'uploading')
      await this.startUpload(task)
    }
  }

  cancel(file: File | string): void {
    const taskId = typeof file === 'string' ? file : this.generateTaskId(file)
    const task = this.activeTasks.get(taskId)

    if (task) {
      task.isCancelled = true
      task.isPaused = true
      task.abortController.abort()
      
      task.xhrList.forEach((xhr) => {
        try {
          xhr.abort()
        } catch (e) {
        }
      })
      task.xhrList.clear()
      
      this.cleanupTask(task)
      this.activeTasks.delete(taskId)
    }
  }

  getFile(file: File | string): UploadFile | undefined {
    const taskId = typeof file === 'string' ? file : this.generateTaskId(file)
    const task = this.activeTasks.get(taskId)
    return task?.file
  }

  getAllFiles(): UploadFile[] {
    return Array.from(this.activeTasks.values()).map(task => task.file)
  }

  private generateTaskId(file: File): string {
    return `${file.name}-${file.size}-${file.lastModified}`
  }

  private createChunks(task: UploadTask): void {
    const { file, options } = task
    const totalChunks = Math.ceil(file.size / options.chunkSize!)

    file.totalChunks = totalChunks
    file.chunks = []

    for (let i = 0; i < totalChunks; i++) {
      const start = i * options.chunkSize!
      const end = Math.min(start + options.chunkSize!, file.size)

      file.chunks.push({
        index: i,
        start,
        end,
        size: end - start,
        blob: file.file.slice(start, end),
        uploaded: false,
        progress: 0
      })
    }
  }

  private async startUpload(task: UploadTask): Promise<void> {
    if (task.isCancelled) return

    this.updateStatus(task, 'uploading')
    
    if (task.speedTimer) {
      clearInterval(task.speedTimer)
      task.speedTimer = null
    }
    this.startSpeedMonitor(task)
    
    this.setupNetworkWatcher(task)

    task.queue = task.file.chunks.filter((chunk) => !chunk.uploaded)
    task.queueIndex = 0

    const concurrency = task.options.concurrency!
    const workers = Array.from({ length: concurrency }, () => this.uploadWorker(task))

    await Promise.all(workers)

    if (!task.isPaused && !task.isCancelled) {
      if (task.file.uploadedChunks === task.file.totalChunks) {
        await this.mergeChunks(task)
      }
    }
  }

  private async uploadWorker(task: UploadTask): Promise<void> {
    while (task.queueIndex < task.queue.length && !task.isPaused && !task.isCancelled) {
      if (!networkDetector.isOnline()) {
        this.updateStatus(task, 'network_error')
        await this.waitForNetwork(task)
        if (task.isPaused || task.isCancelled) return
        this.updateStatus(task, 'uploading')
      }

      const currentIndex = task.queueIndex
      task.queueIndex++

      const chunk = task.queue[currentIndex]
      if (!chunk || chunk.uploaded) continue

      const request = this.uploadChunkWithRetry(task, chunk)
      task.activeRequests.add(request)

      try {
        await request
      } finally {
        task.activeRequests.delete(request)
      }
    }
  }

  private async uploadChunkWithRetry(task: UploadTask, chunk: ChunkItem): Promise<void> {
    const maxRetries = task.options.maxRetries!
    const retryDelay = task.options.retryDelay!

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (task.isPaused || task.isCancelled) return

      try {
        await this.uploadChunk(task, chunk)
        return
      } catch (error: any) {
        if (task.isPaused || task.isCancelled) return
        
        if (error?.message === 'Upload aborted') {
          return
        }

        if (attempt === maxRetries) {
          throw error
        }

        const currentRetries = (task.retryMap.get(chunk.index) || 0) + 1
        task.retryMap.set(chunk.index, currentRetries)

        this.updateStatus(task, 'retrying')
        await this.delay(retryDelay * Math.pow(2, currentRetries - 1))

        if (task.isPaused || task.isCancelled) return
        this.updateStatus(task, 'uploading')
      }
    }
  }

  private async uploadChunk(task: UploadTask, chunk: ChunkItem): Promise<void> {
    const { file, options, callbacks } = task
    const formData = new FormData()

    formData.append('file', chunk.blob)
    formData.append('hash', file.hash)
    formData.append('index', chunk.index.toString())
    formData.append('total', file.totalChunks.toString())
    formData.append('fileName', file.name)
    formData.append('fileSize', file.size.toString())

    const xhr = new XMLHttpRequest()
    task.xhrList.add(xhr)

    return new Promise((resolve, reject) => {
      const cleanup = () => {
        xhr.onload = null
        xhr.onerror = null
        xhr.onabort = null
        xhr.upload.onprogress = null
        task.xhrList.delete(xhr)
      }

      xhr.open('POST', options.uploadChunkUrl || '/api/upload/chunk', true)

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && !task.isPaused && !task.isCancelled) {
          chunk.progress = (e.loaded / e.total) * 100
          this.updateProgress(task)
        }
      }

      xhr.onload = async () => {
        cleanup()

        if (xhr.status >= 200 && xhr.status < 300) {
          if (task.isPaused || task.isCancelled) {
            reject(new Error('Upload aborted'))
            return
          }
          
          chunk.uploaded = true
          chunk.progress = 100
          file.uploadedChunks++
          task.uploadedBytes += chunk.size

          await this.saveProgress(task)

          this.updateProgress(task)
          callbacks.onChunkComplete?.(chunk.index, file)

          resolve()
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`))
        }
      }

      xhr.onerror = () => {
        cleanup()
        reject(new Error('Network error'))
      }

      xhr.onabort = () => {
        cleanup()
        reject(new Error('Upload aborted'))
      }

      if (task.abortController.signal.aborted || task.isPaused || task.isCancelled) {
        cleanup()
        reject(new Error('Upload aborted'))
        return
      }

      const abortHandler = () => {
        try {
          xhr.abort()
        } catch (e) {
        }
      }
      
      const signal = task.abortController.signal
      signal.addEventListener('abort', abortHandler, { once: true })

      try {
        xhr.send(formData)
      } catch (e) {
        cleanup()
        signal.removeEventListener('abort', abortHandler)
        reject(e)
      }
    })
  }

  private async mergeChunks(task: UploadTask): Promise<void> {
    const { file, options, callbacks } = task

    const response = await fetch(options.mergeUrl || '/api/upload/merge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        hash: file.hash,
        fileName: file.name,
        total: file.totalChunks,
        fileSize: file.size
      })
    })

    if (!response.ok) {
      throw new Error('Merge failed')
    }

    const result = await response.json()

    this.updateStatus(task, 'completed')
    file.progress = 100
    callbacks.onProgress?.(100, file)
    callbacks.onCompleted?.(result, file)

    await indexedDBManager.deleteProgress(file.hash)
    this.cleanupTask(task)
  }

  private async saveProgress(task: UploadTask): Promise<void> {
    const { file } = task
    const uploadedChunks = file.chunks
      .filter((chunk) => chunk.uploaded)
      .map((chunk) => chunk.index)

    await indexedDBManager.saveProgress({
      fileHash: file.hash,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadedChunks,
      lastModified: Date.now()
    })
  }

  private updateStatus(task: UploadTask, status: UploadStatus): void {
    task.file.status = status
    task.callbacks.onStatusChange?.(status, task.file)
  }

  private updateProgress(task: UploadTask): void {
    const { file, callbacks } = task
    const totalSize = file.size
    let uploadedSize = 0

    file.chunks.forEach((chunk) => {
      if (chunk.uploaded) {
        uploadedSize += chunk.size
      } else {
        uploadedSize += (chunk.progress / 100) * chunk.size
      }
    })

    file.progress = totalSize > 0 ? (uploadedSize / totalSize) * 100 : 0
    callbacks.onProgress?.(file.progress, file)
  }

  private startSpeedMonitor(task: UploadTask): void {
    task.lastUpdateTime = Date.now()
    task.lastUploadedBytes = task.uploadedBytes
    
    task.speedTimer = setInterval(() => {
      if (task.isPaused || task.isCancelled) {
        return
      }
      
      const now = Date.now()
      const elapsed = (now - task.lastUpdateTime) / 1000

      if (elapsed > 0) {
        const deltaBytes = task.uploadedBytes - task.lastUploadedBytes
        task.file.speed = deltaBytes / elapsed
        task.lastUploadedBytes = task.uploadedBytes
        task.lastUpdateTime = now
      }
    }, SPEED_UPDATE_INTERVAL)
  }

  private setupNetworkWatcher(task: UploadTask): void {
    if (task.networkUnsubscribe) return

    task.networkUnsubscribe = networkDetector.subscribe((status: NetworkStatus) => {
      if (!status.online && task.file.status === 'uploading') {
        task.abortController.abort()
        this.updateStatus(task, 'network_error')
      } else if (status.online && task.file.status === 'network_error') {
        task.abortController = new AbortController()
        this.startUpload(task)
      }
    })
  }

  private async waitForNetwork(_task: UploadTask): Promise<void> {
    return new Promise((resolve) => {
      const unsubscribe = networkDetector.subscribe((status: NetworkStatus) => {
        if (status.online) {
          unsubscribe()
          resolve()
        }
      })
    })
  }

  private cleanupTask(task: UploadTask): void {
    if (task.speedTimer) {
      clearInterval(task.speedTimer)
      task.speedTimer = null
    }

    if (task.networkUnsubscribe) {
      task.networkUnsubscribe()
      task.networkUnsubscribe = null
    }

    task.xhrList.forEach((xhr) => {
      try {
        xhr.abort()
      } catch (e) {
      }
    })
    task.xhrList.clear()

    if (!task.abortController.signal.aborted) {
      task.abortController.abort()
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

export const chunkUploader = new ChunkUploader()
