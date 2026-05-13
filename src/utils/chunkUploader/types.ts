export interface ChunkItem {
  index: number
  start: number
  end: number
  size: number
  blob: Blob
  uploaded: boolean
  progress: number
}

export interface UploadFile {
  file: File
  name: string
  size: number
  type: string
  hash: string
  status: UploadStatus
  chunks: ChunkItem[]
  uploadedChunks: number
  totalChunks: number
  progress: number
  speed: number
}

export type UploadStatus = 
  | 'pending'
  | 'calculating'
  | 'ready'
  | 'uploading'
  | 'paused'
  | 'retrying'
  | 'network_error'
  | 'completed'
  | 'failed'

export interface UploadOptions {
  chunkSize?: number
  concurrency?: number
  maxRetries?: number
  retryDelay?: number
  baseURL?: string
  checkChunkUrl?: string
  uploadChunkUrl?: string
  mergeUrl?: string
}

export interface UploadCallbacks {
  onProgress?: (progress: number, file: UploadFile) => void
  onStatusChange?: (status: UploadStatus, file: UploadFile) => void
  onCompleted?: (result: any, file: UploadFile) => void
  onFailed?: (error: Error, file: UploadFile) => void
  onChunkComplete?: (chunkIndex: number, file: UploadFile) => void
}

export interface IndexedDBFileRecord {
  fileHash: string
  fileName: string
  fileSize: number
  fileType: string
  uploadedChunks: number[]
  lastModified: number
}

export interface NetworkStatus {
  online: boolean
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g' | '5g'
  downlink?: number
}
