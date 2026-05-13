<script setup lang="ts">
import { ref, computed, onBeforeUnmount, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { chunkUploader } from '@/utils/chunkUploader'
import type { UploadFile, UploadStatus, UploadOptions, UploadCallbacks } from '@/utils/chunkUploader'

interface Props {
  accept?: string
  chunkSize?: number
  concurrency?: number
  maxRetries?: number
  maxFileSize?: number
  baseURL?: string
  checkChunkUrl?: string
  uploadChunkUrl?: string
  mergeUrl?: string
  showList?: boolean
  drag?: boolean
  multiple?: boolean
  autoStart?: boolean
}

interface Emits {
  (e: 'success', result: any, file: UploadFile): void
  (e: 'error', error: Error, file: UploadFile): void
  (e: 'progress', progress: number, file: UploadFile): void
  (e: 'change', files: UploadFile[]): void
  (e: 'start', file: UploadFile): void
}

const props = withDefaults(defineProps<Props>(), {
  accept: '',
  chunkSize: 5 * 1024 * 1024,
  concurrency: 3,
  maxRetries: 3,
  maxFileSize: 0,
  baseURL: '',
  checkChunkUrl: '',
  uploadChunkUrl: '/api/upload/chunk',
  mergeUrl: '/api/upload/merge',
  showList: true,
  drag: true,
  multiple: true,
  autoStart: true
})

const emit = defineEmits<Emits>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const fileList = ref<UploadFile[]>([])
const isDragging = ref(false)
const isDragOver = ref(false)
const taskMap = new Map<string, UploadFile>()
const fileUploadPromises = new Map<string, Promise<void | UploadFile>>()

const statusColors: Record<UploadStatus, string> = {
  pending: 'color: #909399',
  calculating: 'color: #e6a23c',
  ready: 'color: #409eff',
  uploading: 'color: #409eff',
  paused: 'color: #e6a23c',
  retrying: 'color: #e6a23c',
  network_error: 'color: #f56c6c',
  completed: 'color: #67c23a',
  failed: 'color: #f56c6c'
}

const statusText: Record<UploadStatus, string> = {
  pending: '等待中',
  calculating: '计算文件校验中',
  ready: '准备就绪',
  uploading: '上传中',
  paused: '已暂停',
  retrying: '重试中',
  network_error: '网络错误',
  completed: '已完成',
  failed: '上传失败'
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatSpeed = (bytesPerSecond: number): string => {
  if (bytesPerSecond === 0) return '0 B/s'
  const k = 1024
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s']
  const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k))
  return parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatTime = (seconds: number): string => {
  if (!isFinite(seconds) || seconds <= 0) return '--:--'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const getTaskId = (file: File | UploadFile): string => {
  const f = 'file' in file ? file.file : file
  return f.name + '-' + f.size + '-' + f.lastModified
}

const getRemainingTime = (file: UploadFile): number => {
  if (file.speed <= 0 || file.progress >= 100) return 0
  const remainingBytes = file.size * (1 - file.progress / 100)
  return remainingBytes / file.speed
}

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || [])
  files.forEach((file) => addFile(file))
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = false
  isDragOver.value = false

  const files = Array.from(event.dataTransfer?.files || [])
  files.forEach((file) => addFile(file))
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = true
}

const handleDragLeave = () => {
  isDragOver.value = false
}

const addFile = async (file: File) => {
  if (props.maxFileSize > 0 && file.size > props.maxFileSize) {
    ElMessage.error('文件大小超过限制，最大支持 ' + formatFileSize(props.maxFileSize))
    return
  }

  const taskId = getTaskId(file)

  if (taskMap.has(taskId)) {
    ElMessage.warning('该文件已在上传列表中')
    return
  }

  const uploadOptions: UploadOptions = {
    chunkSize: props.chunkSize,
    concurrency: props.concurrency,
    maxRetries: props.maxRetries,
    uploadChunkUrl: props.uploadChunkUrl,
    mergeUrl: props.mergeUrl
  }

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

  taskMap.set(taskId, uploadFile)
  fileList.value.push(uploadFile)
  emit('change', fileList.value)

  const callbacks: UploadCallbacks = {
    onProgress: (progress: number, f: UploadFile) => {
      emit('progress', progress, f)
    },
    onStatusChange: (_status: UploadStatus, f: UploadFile) => {
      const index = fileList.value.findIndex((item: UploadFile) => item.file === f.file)
      if (index !== -1) {
        fileList.value[index] = { ...f }
      }
      emit('change', fileList.value)
    },
    onCompleted: (result: any, f: UploadFile) => {
      emit('success', result, f)
      ElMessage.success(f.name + ' 上传完成')
    },
    onFailed: (error: Error, f: UploadFile) => {
      emit('error', error, f)
      ElMessage.error(f.name + ' 上传失败: ' + error.message)
    },
    onChunkComplete: (_chunkIndex: number, f: UploadFile) => {
      const index = fileList.value.findIndex((item: UploadFile) => item.file === f.file)
      if (index !== -1) {
        fileList.value[index] = { ...f }
      }
    }
  }

  if (props.autoStart) {
    emit('start', uploadFile)
    const uploadPromise = chunkUploader.upload(file, callbacks, uploadOptions).catch((error) => {
      console.error('Upload failed:', error)
    })
    fileUploadPromises.set(taskId, uploadPromise)
  }
}

const triggerFileDialog = () => {
  fileInputRef.value?.click()
}

const startUpload = (uploadFile: UploadFile) => {
  const taskId = getTaskId(uploadFile)
  
  if (uploadFile.status === 'pending' || uploadFile.status === 'ready') {
    const uploadOptions: UploadOptions = {
      chunkSize: props.chunkSize,
      concurrency: props.concurrency,
      maxRetries: props.maxRetries,
      uploadChunkUrl: props.uploadChunkUrl,
      mergeUrl: props.mergeUrl
    }

    const callbacks: UploadCallbacks = {
      onProgress: (progress: number, f: UploadFile) => {
        emit('progress', progress, f)
      },
      onStatusChange: (_status: UploadStatus, f: UploadFile) => {
        const index = fileList.value.findIndex((item: UploadFile) => item.file === f.file)
        if (index !== -1) {
          fileList.value[index] = { ...f }
        }
        emit('change', fileList.value)
      },
      onCompleted: (result: any, f: UploadFile) => {
        emit('success', result, f)
        ElMessage.success(f.name + ' 上传完成')
      },
      onFailed: (error: Error, f: UploadFile) => {
        emit('error', error, f)
        ElMessage.error(f.name + ' 上传失败: ' + error.message)
      },
      onChunkComplete: (_chunkIndex: number, f: UploadFile) => {
        const index = fileList.value.findIndex((item: UploadFile) => item.file === f.file)
        if (index !== -1) {
          fileList.value[index] = { ...f }
        }
      }
    }

    emit('start', uploadFile)
    const uploadPromise = chunkUploader.upload(uploadFile.file, callbacks, uploadOptions).catch((error) => {
      console.error('Upload failed:', error)
    })
    fileUploadPromises.set(taskId, uploadPromise)
  }
}

const togglePause = async (uploadFile: UploadFile) => {
  const taskId = getTaskId(uploadFile)
  
  if (uploadFile.status === 'uploading' || uploadFile.status === 'retrying') {
    chunkUploader.pause(taskId)
  } else if (uploadFile.status === 'paused' || uploadFile.status === 'network_error') {
    await chunkUploader.resume(taskId)
  }
}

const retryUpload = async (uploadFile: UploadFile) => {
  const taskId = getTaskId(uploadFile)
  
  if (uploadFile.status === 'failed') {
    chunkUploader.cancel(taskId)
    taskMap.delete(taskId)
    
    const index = fileList.value.findIndex((item: UploadFile) => item.file === uploadFile.file)
    if (index !== -1) {
      fileList.value.splice(index, 1)
    }
    
    await nextTick()
    addFile(uploadFile.file)
  }
}

const removeFile = async (uploadFile: UploadFile, index: number) => {
  try {
    await ElMessageBox.confirm('确定要删除该文件吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const taskId = getTaskId(uploadFile)
    chunkUploader.cancel(taskId)
    taskMap.delete(taskId)
    fileUploadPromises.delete(taskId)
    fileList.value.splice(index, 1)
    emit('change', fileList.value)
  } catch {
  }
}

const canStart = computed(() => (status: UploadStatus) => {
  return status === 'pending' || status === 'ready'
})

const canPause = computed(() => (status: UploadStatus) => {
  return ['uploading', 'retrying'].includes(status)
})

const canResume = computed(() => (status: UploadStatus) => {
  return ['paused', 'network_error'].includes(status)
})

const canRetry = computed(() => (status: UploadStatus) => {
  return status === 'failed'
})

const canRemove = computed(() => (_status: UploadStatus) => {
  return true
})

const clearCompleted = () => {
  const completedFiles = fileList.value.filter((f) => f.status === 'completed')
  completedFiles.forEach((f) => {
    const taskId = getTaskId(f)
    const index = fileList.value.findIndex((item) => item.file === f.file)
    if (index !== -1) {
      taskMap.delete(taskId)
      fileList.value.splice(index, 1)
    }
  })
  emit('change', fileList.value)
}

const hasCompletedFiles = computed(() => {
  return fileList.value.some((f) => f.status === 'completed')
})

const totalProgress = computed(() => {
  if (fileList.value.length === 0) return 0
  const totalSize = fileList.value.reduce((sum, f) => sum + f.size, 0)
  const uploadedSize = fileList.value.reduce((sum, f) => sum + (f.size * f.progress / 100), 0)
  return totalSize > 0 ? (uploadedSize / totalSize) * 100 : 0
})

watch(fileList, (newList) => {
  emit('change', newList)
})

onBeforeUnmount(() => {
  fileList.value.forEach((file: UploadFile) => {
    const taskId = getTaskId(file)
    chunkUploader.cancel(taskId)
  })
})
</script>

<template>
  <div class="chunk-uploader">
    <div
      class="upload-area"
      :class="{ 
        'is-dragover': isDragOver,
        'is-disabled': false 
      }"
      @click="triggerFileDialog"
      @drop="handleDrop"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
    >
      <input
        ref="fileInputRef"
        type="file"
        :accept="accept"
        :multiple="multiple"
        class="file-input"
        @change="handleFileSelect"
      />
      <div class="upload-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
      </div>
      <div class="upload-text">
        <span>点击或将文件拖拽到这里上传</span>
        <p class="upload-hint">支持 GB 级大文件分片上传，支持暂停/继续、断点续传</p>
      </div>
    </div>

    <div v-if="fileList.length > 0" class="upload-summary" v-show="showList">
      <div class="summary-info">
        <span>共 {{ fileList.length }} 个文件，总进度: {{ totalProgress.toFixed(1) }}%</span>
        <button
          v-if="hasCompletedFiles"
          class="clear-btn"
          @click.stop="clearCompleted"
        >
          清除已完成
        </button>
      </div>
      <div class="progress-bar summary-progress">
        <div
          class="progress-fill"
          :style="{ width: totalProgress + '%' }"
        />
      </div>
    </div>

    <div v-if="showList" class="file-list">
      <div
        v-for="(file, index) in fileList"
        :key="file.name + '-' + file.size + '-' + file.file.lastModified"
        class="file-item"
        :class="{ 'is-completed': file.status === 'completed' }"
      >
        <div class="file-info">
          <div class="file-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div class="file-details">
            <div class="file-name" :title="file.name">{{ file.name }}</div>
            <div class="file-meta">
              <span class="file-size">{{ formatFileSize(file.size) }}</span>
              <span v-if="file.totalChunks > 0" class="chunk-info">
                {{ file.uploadedChunks }}/{{ file.totalChunks }} 分片
              </span>
              <span v-if="file.speed > 0" class="file-speed">
                {{ formatSpeed(file.speed) }}
              </span>
              <span 
                v-if="file.status === 'uploading' && file.speed > 0" 
                class="file-time"
              >
                剩余 {{ formatTime(getRemainingTime(file)) }}
              </span>
              <span class="file-status" :style="statusColors[file.status]">
                {{ statusText[file.status] }}
              </span>
            </div>
          </div>
        </div>

        <div class="progress-container">
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: file.progress + '%' }"
              :class="{
                'is-paused': file.status === 'paused',
                'is-error': file.status === 'failed' || file.status === 'network_error',
                'is-success': file.status === 'completed',
                'is-calculating': file.status === 'calculating'
              }"
            />
          </div>
          <div class="progress-info">
            <span class="progress-percent">{{ file.progress.toFixed(1) }}%</span>
          </div>
        </div>

        <div class="file-actions">
          <button
            v-if="!autoStart && canStart(file.status)"
            class="action-btn action-start"
            @click.stop="startUpload(file)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            开始
          </button>
          <button
            v-if="canPause(file.status)"
            class="action-btn action-pause"
            @click.stop="togglePause(file)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="6" y="4" width="4" height="16"/>
              <rect x="14" y="4" width="4" height="16"/>
            </svg>
            暂停
          </button>
          <button
            v-else-if="canResume(file.status)"
            class="action-btn action-resume"
            @click.stop="togglePause(file)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            继续
          </button>
          <button
            v-if="canRetry(file.status)"
            class="action-btn action-retry"
            @click.stop="retryUpload(file)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            重试
          </button>
          <button
            v-if="canRemove(file.status)"
            class="action-btn action-remove"
            @click.stop="removeFile(file, index)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            {{ file.status === 'completed' ? '删除' : '取消' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chunk-uploader {
  width: 100%;
}

.upload-area {
  position: relative;
  border: 2px dashed #dcdfe6;
  border-radius: 6px;
  background-color: #fafafa;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-area:hover,
.upload-area.is-dragover {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.file-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
}

.upload-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  color: #c0c4cc;
  transition: color 0.3s;
}

.upload-area:hover .upload-icon,
.upload-area.is-dragover .upload-icon {
  color: #409eff;
}

.upload-icon svg {
  width: 100%;
  height: 100%;
}

.upload-text {
  color: #606266;
}

.upload-text span {
  font-size: 14px;
}

.upload-hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: #909399;
}

.upload-summary {
  margin: 20px 0;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.summary-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 13px;
  color: #606266;
}

.clear-btn {
  padding: 4px 12px;
  border: none;
  background: none;
  color: #409eff;
  cursor: pointer;
  font-size: 12px;
  transition: color 0.3s;
}

.clear-btn:hover {
  color: #66b1ff;
}

.summary-progress {
  height: 4px;
}

.file-list {
  margin-top: 20px;
}

.file-item {
  display: flex;
  flex-direction: column;
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  margin-bottom: 12px;
  background-color: #fff;
  transition: border-color 0.3s;
}

.file-item.is-completed {
  border-color: #67c23a;
  background-color: #f0f9eb;
}

.file-item:last-child {
  margin-bottom: 0;
}

.file-info {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.file-icon {
  width: 40px;
  height: 40px;
  margin-right: 12px;
  color: #409eff;
  flex-shrink: 0;
}

.file-icon svg {
  width: 100%;
  height: 100%;
}

.file-details {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
  gap: 12px;
}

.file-status {
  font-weight: 500;
}

.progress-container {
  margin-bottom: 12px;
}

.progress-bar {
  height: 6px;
  background-color: #ebeef5;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #409eff;
  border-radius: 3px;
  transition: width 0.3s;
}

.progress-fill.is-paused {
  background-color: #e6a23c;
}

.progress-fill.is-error {
  background-color: #f56c6c;
}

.progress-fill.is-success {
  background-color: #67c23a;
}

.progress-fill.is-calculating {
  background-color: #909399;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 12px;
  color: #909399;
}

.file-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.action-btn svg {
  width: 14px;
  height: 14px;
}

.action-start {
  background-color: #f0f9eb;
  color: #67c23a;
}

.action-start:hover {
  background-color: #e1f3d8;
}

.action-pause {
  background-color: #fdf6ec;
  color: #e6a23c;
}

.action-pause:hover {
  background-color: #faecd8;
}

.action-resume {
  background-color: #ecf5ff;
  color: #409eff;
}

.action-resume:hover {
  background-color: #d9ecff;
}

.action-retry {
  background-color: #f4f4f5;
  color: #909399;
}

.action-retry:hover {
  background-color: #e4e7ed;
}

.action-remove {
  background-color: #fef0f0;
  color: #f56c6c;
}

.action-remove:hover {
  background-color: #fde2e2;
}
</style>
