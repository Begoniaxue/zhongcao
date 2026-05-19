<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'

interface ImageItem {
  id: string
  url: string
  file?: File
  compressedSize?: number
}

interface Props {
  modelValue: string[]
  maxCount?: number
  maxSize?: number
  compressQuality?: number
  cropAspectRatio?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxCount: 6,
  maxSize: 5 * 1024 * 1024,
  compressQuality: 0.8,
  cropAspectRatio: 1
})

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
  'change': [files: File[]]
}>()

const images = ref<ImageItem[]>([])
const fileInputRef = ref<HTMLInputElement | null>(null)
const showCropDialog = ref(false)
const currentCropImage = ref<HTMLImageElement | null>(null)
const currentCropFile = ref<File | null>(null)
const cropStartX = ref(0)
const cropStartY = ref(0)
const cropBoxWidth = ref(200)
const cropBoxHeight = ref(200)
const isDraggingCrop = ref(false)
const isResizingCrop = ref(false)
const dragStartX = ref(0)
const dragStartY = ref(0)
const cropBoxStartX = ref(0)
const cropBoxStartY = ref(0)
const cropCanvasRef = ref<HTMLCanvasElement | null>(null)
const imageScale = ref(1)

const dragIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

const showPreview = ref(false)
const previewIndex = ref(0)

const pendingCropQueue = ref<File[]>([])
const croppedResults = ref<ImageItem[]>([])
const currentCropIndex = ref(0)
const totalCropCount = ref(0)

const remainingSlots = computed(() => props.maxCount - images.value.length)
const showAddButton = computed(() => images.value.length < props.maxCount)

watch(() => props.modelValue, (newVal) => {
  if (newVal && newVal.length !== images.value.length) {
    images.value = newVal.map((url, index) => ({
      id: `img-${Date.now()}-${index}`,
      url
    }))
  }
}, { immediate: true })

function generateId() {
  return `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function triggerFileInput() {
  fileInputRef.value?.click()
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const files = input.files

  if (!files || files.length === 0) return

  const remaining = props.maxCount - images.value.length
  const filesToProcess = Array.from(files).slice(0, remaining)

  const validFiles: File[] = []
  for (const file of filesToProcess) {
    if (!file.type.startsWith('image/')) {
      ElMessage.warning('只能上传图片文件')
      continue
    }

    if (file.size > props.maxSize) {
      try {
        const compressedFile = await compressImage(file)
        validFiles.push(compressedFile)
      } catch {
        ElMessage.warning('图片压缩失败')
      }
    } else {
      validFiles.push(file)
    }
  }

  if (validFiles.length > 0) {
    pendingCropQueue.value = validFiles
    croppedResults.value = []
    currentCropIndex.value = 0
    totalCropCount.value = validFiles.length
    processNextCrop()
  }

  if (input) {
    input.value = ''
  }
}

function compressImage(file: File, quality: number = props.compressQuality): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        const maxWidth = 1920
        const maxHeight = 1920

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('无法创建画布上下文'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              })
              resolve(compressedFile)
            } else {
              resolve(file)
            }
          },
          'image/jpeg',
          quality
        )
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function openCropDialog(file: File) {
  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      currentCropImage.value = img
      currentCropFile.value = file
      showCropDialog.value = true

      setTimeout(() => {
        initCropBox(img)
      }, 100)
    }
    img.src = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

function initCropBox(img: HTMLImageElement) {
  const canvas = cropCanvasRef.value
  if (!canvas) return

  const containerWidth = canvas.parentElement?.clientWidth || 300
  const containerHeight = 300

  const imgRatio = img.width / img.height
  const containerRatio = containerWidth / containerHeight

  let displayWidth, displayHeight
  if (imgRatio > containerRatio) {
    displayWidth = containerWidth
    displayHeight = containerWidth / imgRatio
  } else {
    displayHeight = containerHeight
    displayWidth = containerHeight * imgRatio
  }

  imageScale.value = img.width / displayWidth

  const minSize = Math.min(displayWidth, displayHeight) * 0.6
  cropBoxWidth.value = minSize
  cropBoxHeight.value = minSize / props.cropAspectRatio

  cropStartX.value = (displayWidth - cropBoxWidth.value) / 2
  cropStartY.value = (displayHeight - cropBoxHeight.value) / 2

  drawCropCanvas()
}

function drawCropCanvas() {
  const canvas = cropCanvasRef.value
  const ctx = canvas?.getContext('2d')
  const img = currentCropImage.value
  if (!canvas || !ctx || !img) return

  const containerWidth = canvas.parentElement?.clientWidth || 300
  const containerHeight = 300

  canvas.width = containerWidth
  canvas.height = containerHeight

  const imgRatio = img.width / img.height
  const containerRatio = containerWidth / containerHeight

  let displayWidth, displayHeight, offsetX, offsetY
  if (imgRatio > containerRatio) {
    displayWidth = containerWidth
    displayHeight = containerWidth / imgRatio
    offsetX = 0
    offsetY = (containerHeight - displayHeight) / 2
  } else {
    displayHeight = containerHeight
    displayWidth = containerHeight * imgRatio
    offsetX = (containerWidth - displayWidth) / 2
    offsetY = 0
  }

  ctx.clearRect(0, 0, containerWidth, containerHeight)
  ctx.drawImage(img, offsetX, offsetY, displayWidth, displayHeight)

  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
  ctx.fillRect(0, 0, containerWidth, containerHeight)

  ctx.save()
  ctx.beginPath()
  ctx.rect(
    offsetX + cropStartX.value,
    offsetY + cropStartY.value,
    cropBoxWidth.value,
    cropBoxHeight.value
  )
  ctx.clip()
  ctx.drawImage(img, offsetX, offsetY, displayWidth, displayHeight)
  ctx.restore()

  ctx.strokeStyle = '#409eff'
  ctx.lineWidth = 2
  ctx.strokeRect(
    offsetX + cropStartX.value,
    offsetY + cropStartY.value,
    cropBoxWidth.value,
    cropBoxHeight.value
  )

  const handleSize = 16
  ctx.fillStyle = '#409eff'
  const corners = [
    [offsetX + cropStartX.value, offsetY + cropStartY.value],
    [offsetX + cropStartX.value + cropBoxWidth.value, offsetY + cropStartY.value],
    [offsetX + cropStartX.value, offsetY + cropStartY.value + cropBoxHeight.value],
    [offsetX + cropStartX.value + cropBoxWidth.value, offsetY + cropStartY.value + cropBoxHeight.value]
  ]
  corners.forEach(([x, y], index) => {
    ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize)
    if (index === 3) {
      ctx.fillStyle = 'rgba(64, 158, 255, 0.2)'
      ctx.fillRect(x - 30, y - 30, 30, 30)
      ctx.fillStyle = '#409eff'
    }
  })
}

function onCropMouseDown(e: MouseEvent) {
  const canvas = cropCanvasRef.value
  if (!canvas || !currentCropImage.value) return

  const rect = canvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  const containerWidth = canvas.parentElement?.clientWidth || 300
  const containerHeight = 300
  const imgRatio = currentCropImage.value.width / currentCropImage.value.height
  const containerRatio = containerWidth / containerHeight

  let offsetX, offsetY
  if (imgRatio > containerRatio) {
    offsetX = 0
    offsetY = (containerHeight - containerWidth / imgRatio) / 2
  } else {
    offsetY = 0
    offsetX = (containerWidth - containerHeight * imgRatio) / 2
  }

  const boxLeft = offsetX + cropStartX.value
  const boxTop = offsetY + cropStartY.value
  const boxRight = boxLeft + cropBoxWidth.value
  const boxBottom = boxTop + cropBoxHeight.value

  const handleSize = 40
  const resizeZoneRight = boxRight - handleSize
  const resizeZoneBottom = boxBottom - handleSize

  if (x >= resizeZoneRight && y >= resizeZoneBottom) {
    e.preventDefault()
    e.stopPropagation()
    isResizingCrop.value = true
    dragStartX.value = x
    dragStartY.value = y
    cropBoxStartX.value = cropBoxWidth.value
    cropBoxStartY.value = cropBoxHeight.value
  } else if (x >= boxLeft && x <= boxRight && y >= boxTop && y <= boxBottom) {
    isDraggingCrop.value = true
    dragStartX.value = x
    dragStartY.value = y
    cropBoxStartX.value = cropStartX.value
    cropBoxStartY.value = cropStartY.value
  }
}

function onCropMouseMove(e: MouseEvent) {
  const canvas = cropCanvasRef.value
  if (!canvas || !currentCropImage.value) return

  const rect = canvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  const containerWidth = canvas.parentElement?.clientWidth || 300
  const containerHeight = 300
  const imgRatio = currentCropImage.value.width / currentCropImage.value.height
  const containerRatio = containerWidth / containerHeight

  let displayWidth, displayHeight
  if (imgRatio > containerRatio) {
    displayWidth = containerWidth
    displayHeight = containerWidth / imgRatio
  } else {
    displayHeight = containerHeight
    displayWidth = containerHeight * imgRatio
  }

  if (isDraggingCrop.value) {
    const deltaX = x - dragStartX.value
    const deltaY = y - dragStartY.value

    let newX = cropBoxStartX.value + deltaX
    let newY = cropBoxStartY.value + deltaY

    newX = Math.max(0, Math.min(newX, displayWidth - cropBoxWidth.value))
    newY = Math.max(0, Math.min(newY, displayHeight - cropBoxHeight.value))

    cropStartX.value = newX
    cropStartY.value = newY
    drawCropCanvas()
  } else if (isResizingCrop.value) {
    const deltaX = x - dragStartX.value

    let newWidth = cropBoxStartX.value + deltaX
    const minSize = 50

    newWidth = Math.max(minSize, newWidth)

    const maxWidth = displayWidth - cropStartX.value
    const maxHeight = displayHeight - cropStartY.value
    const maxWidthByHeight = maxHeight * props.cropAspectRatio

    newWidth = Math.min(newWidth, maxWidth, maxWidthByHeight)

    const newHeight = newWidth / props.cropAspectRatio

    cropBoxWidth.value = newWidth
    cropBoxHeight.value = newHeight
    drawCropCanvas()
  }
}

function onCropMouseUp() {
  isDraggingCrop.value = false
  isResizingCrop.value = false
}

function processNextCrop() {
  if (pendingCropQueue.value.length === 0) {
    if (croppedResults.value.length > 0) {
      images.value.push(...croppedResults.value)
      emitUpdate()
      croppedResults.value = []
    }
    return
  }

  const nextFile = pendingCropQueue.value.shift()
  if (nextFile) {
    openCropDialog(nextFile)
  }
}

function confirmCrop() {
  const img = currentCropImage.value
  if (!img) return

  const canvas = document.createElement('canvas')
  const actualCropX = cropStartX.value * imageScale.value
  const actualCropY = cropStartY.value * imageScale.value
  const actualCropWidth = cropBoxWidth.value * imageScale.value
  const actualCropHeight = cropBoxHeight.value * imageScale.value

  canvas.width = actualCropWidth
  canvas.height = actualCropHeight

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.drawImage(
    img,
    actualCropX,
    actualCropY,
    actualCropWidth,
    actualCropHeight,
    0,
    0,
    actualCropWidth,
    actualCropHeight
  )

  canvas.toBlob(
    (blob) => {
      if (blob) {
        const croppedFile = new File([blob], `cropped_${Date.now()}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now()
        })

        const reader = new FileReader()
        reader.onload = (e) => {
          const imageItem: ImageItem = {
            id: generateId(),
            url: e.target?.result as string,
            file: croppedFile,
            compressedSize: blob.size
          }
          croppedResults.value.push(imageItem)
          currentCropIndex.value++
          closeCropDialog()
          processNextCrop()
        }
        reader.readAsDataURL(croppedFile)
      }
    },
    'image/jpeg',
    props.compressQuality
  )
}

function skipCrop() {
  const file = currentCropFile.value
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const imageItem: ImageItem = {
      id: generateId(),
      url: e.target?.result as string,
      file
    }
    croppedResults.value.push(imageItem)
    currentCropIndex.value++
    closeCropDialog()
    processNextCrop()
  }
  reader.readAsDataURL(file)
}

function closeCropDialog() {
  showCropDialog.value = false
  currentCropImage.value = null
  currentCropFile.value = null
  isDraggingCrop.value = false
  isResizingCrop.value = false
}

function cancelCrop() {
  pendingCropQueue.value = []
  croppedResults.value = []
  currentCropIndex.value = 0
  totalCropCount.value = 0
  closeCropDialog()
}

function removeImage(index: number) {
  images.value.splice(index, 1)
  emitUpdate()
}

function emitUpdate() {
  const urls = images.value.map((img) => img.url)
  emit('update:modelValue', urls)
  const files = images.value.map((img) => img.file).filter((f): f is File => f !== undefined)
  emit('change', files)
}

function onDragStart(index: number) {
  dragIndex.value = index
}

function onDragOver(e: DragEvent, index: number) {
  e.preventDefault()
  dragOverIndex.value = index
}

function onDrop(index: number) {
  if (dragIndex.value === null || dragIndex.value === index) {
    dragIndex.value = null
    dragOverIndex.value = null
    return
  }

  const draggedItem = images.value[dragIndex.value]
  images.value.splice(dragIndex.value, 1)
  images.value.splice(index, 0, draggedItem)

  dragIndex.value = null
  dragOverIndex.value = null
  emitUpdate()
}

function onDragEnd() {
  dragIndex.value = null
  dragOverIndex.value = null
}

function openPreview(index: number) {
  previewIndex.value = index
  showPreview.value = true
}

function closePreview() {
  showPreview.value = false
}

function prevImage() {
  if (previewIndex.value > 0) {
    previewIndex.value--
  }
}

function nextImage() {
  if (previewIndex.value < images.value.length - 1) {
    previewIndex.value++
  }
}

defineExpose({
  getFiles: () => images.value.map((img) => img.file).filter((f): f is File => f !== undefined),
  clear: () => {
    images.value = []
    emitUpdate()
  }
})
</script>

<template>
  <div class="image-uploader">
    <div class="image-grid">
      <div
        v-for="(image, index) in images"
        :key="image.id"
        class="image-item"
        :class="{ 'drag-over': dragOverIndex === index, 'dragging': dragIndex === index }"
        draggable="true"
        @dragstart="onDragStart(index)"
        @dragover="onDragOver($event, index)"
        @drop="onDrop(index)"
        @dragend="onDragEnd"
      >
        <img :src="image.url" alt="图片" @click="openPreview(index)" />
        <div class="image-remove" @click.stop="removeImage(index)">
          <el-icon><Close /></el-icon>
        </div>
        <div class="image-drag-handle" @click.stop>
          <el-icon><Rank /></el-icon>
        </div>
      </div>
      <div
        v-if="showAddButton"
        class="image-add"
        @click="triggerFileInput"
      >
        <el-icon class="add-icon"><Plus /></el-icon>
        <span class="add-text">添加图片</span>
        <span class="add-remaining">还可添加 {{ remainingSlots }} 张</span>
      </div>
    </div>
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      multiple
      class="file-input"
      @change="handleFileChange"
    />

    <div v-if="showCropDialog" class="crop-dialog-overlay" @click.self="cancelCrop">
      <div class="crop-dialog-container">
        <div class="crop-dialog-header">
          <span class="crop-dialog-title">
            裁剪图片
            <span v-if="totalCropCount > 1" class="crop-progress">
              ({{ currentCropIndex + 1 }} / {{ totalCropCount }})
            </span>
          </span>
          <div class="crop-dialog-actions">
            <el-button size="small" @click="skipCrop">跳过</el-button>
            <el-button type="primary" size="small" @click="confirmCrop">
              {{ totalCropCount > 1 && currentCropIndex < totalCropCount - 1 ? '下一张' : '确认裁剪' }}
            </el-button>
          </div>
        </div>
        <div class="crop-dialog-content">
          <canvas
            ref="cropCanvasRef"
            class="crop-canvas"
            @mousedown="onCropMouseDown"
            @mousemove="onCropMouseMove"
            @mouseup="onCropMouseUp"
            @mouseleave="onCropMouseUp"
          />
        </div>
        <div class="crop-dialog-footer">
          <span class="crop-tip">拖动选框选择区域，拖动右下角可调整大小</span>
        </div>
      </div>
    </div>

    <div v-if="showPreview" class="preview-overlay" @click.self="closePreview">
      <div class="preview-container">
        <div class="preview-header">
          <span class="preview-counter">{{ previewIndex + 1 }} / {{ images.length }}</span>
          <div class="preview-close" @click="closePreview">
            <el-icon><Close /></el-icon>
          </div>
        </div>
        <div class="preview-content">
          <img :src="images[previewIndex]?.url" alt="预览图片" class="preview-image" />
        </div>
        <div class="preview-nav" v-if="images.length > 1">
          <button
            class="nav-btn nav-prev"
            @click="prevImage"
            :disabled="previewIndex === 0"
          >
            <el-icon><ArrowLeft /></el-icon>
          </button>
          <button
            class="nav-btn nav-next"
            @click="nextImage"
            :disabled="previewIndex === images.length - 1"
          >
            <el-icon><ArrowRight /></el-icon>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.image-uploader {
  width: 100%;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.image-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f0f0f0;
  cursor: move;
  transition: transform 0.2s, opacity 0.2s;
}

.image-item.dragging {
  opacity: 0.5;
  transform: scale(0.95);
}

.image-item.drag-over {
  transform: scale(1.05);
  box-shadow: 0 0 0 2px #409eff;
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 22px;
  height: 22px;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  font-size: 12px;
  z-index: 2;
}

.image-remove:active {
  background-color: rgba(0, 0, 0, 0.7);
}

.image-drag-handle {
  position: absolute;
  bottom: 4px;
  left: 4px;
  width: 22px;
  height: 22px;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: move;
  color: white;
  font-size: 12px;
  z-index: 2;
}

.image-add {
  aspect-ratio: 1;
  border-radius: 8px;
  border: 2px dashed #ddd;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  background-color: #fafafa;
}

.image-add:active {
  border-color: #667eea;
  background-color: #f5f7ff;
}

.add-icon {
  font-size: 26px;
  color: #999;
  margin-bottom: 4px;
}

.image-add:active .add-icon {
  color: #667eea;
}

.add-text {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

.add-remaining {
  font-size: 10px;
  color: #999;
}

.file-input {
  display: none;
}

.crop-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.crop-dialog-container {
  background-color: white;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.crop-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.crop-dialog-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.crop-progress {
  font-size: 14px;
  font-weight: 400;
  color: #667eea;
  margin-left: 8px;
}

.crop-dialog-content {
  flex: 1;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  min-height: 300px;
}

.crop-canvas {
  max-width: 100%;
  max-height: 400px;
  cursor: move;
  background-color: #333;
}

.crop-dialog-footer {
  padding: 12px 20px;
  border-top: 1px solid #eee;
  text-align: center;
}

.crop-tip {
  font-size: 12px;
  color: #999;
}

@media (min-width: 768px) {
  .image-grid {
    gap: 12px;
  }

  .image-remove {
    width: 24px;
    height: 24px;
    font-size: 14px;
  }

  .image-add:hover {
    border-color: #667eea;
    background-color: #f5f7ff;
  }

  .image-add:hover .add-icon {
    color: #667eea;
  }

  .add-icon {
    font-size: 28px;
  }

  .add-text {
    font-size: 13px;
  }

  .add-remaining {
    font-size: 11px;
  }
}

@media (max-width: 360px) {
  .image-grid {
    gap: 8px;
  }

  .image-remove {
    width: 20px;
    height: 20px;
    font-size: 11px;
  }

  .add-icon {
    font-size: 22px;
  }

  .add-text {
    font-size: 11px;
  }

  .add-remaining {
    font-size: 9px;
  }
}

.preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  color: white;
  flex-shrink: 0;
}

.preview-counter {
  font-size: 16px;
  font-weight: 500;
}

.preview-close {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.preview-close:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.preview-close .el-icon {
  font-size: 20px;
  color: white;
}

.preview-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: hidden;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
}

.preview-nav {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  display: flex;
  justify-content: space-between;
  padding: 0 20px;
  pointer-events: none;
}

.nav-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  pointer-events: auto;
}

.nav-btn:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.nav-btn .el-icon {
  font-size: 24px;
  color: white;
}

@media (min-width: 768px) {
  .preview-container {
    max-width: 900px;
    max-height: 90vh;
  }

  .preview-nav {
    padding: 0 40px;
  }

  .nav-btn {
    width: 56px;
    height: 56px;
  }

  .nav-btn .el-icon {
    font-size: 28px;
  }
}
</style>
