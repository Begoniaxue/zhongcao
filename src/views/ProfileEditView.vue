<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Camera } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const nickname = ref(userStore.userInfo.nickname)
const introduction = ref(userStore.userInfo.introduction)
const currentAvatar = ref(userStore.userInfo.avatar)

const showCropper = ref(false)
const originalImage = ref<HTMLImageElement | null>(null)
const cropCanvas = ref<HTMLCanvasElement | null>(null)
const previewCanvas = ref<HTMLCanvasElement | null>(null)

const imageScale = ref(1)
const imageOffsetX = ref(0)
const imageOffsetY = ref(0)
const isDragging = ref(false)
const startX = ref(0)
const startY = ref(0)
const startOffsetX = ref(0)
const startOffsetY = ref(0)

const isPinching = ref(false)
const initialPinchDistance = ref(0)
const initialScale = ref(1)

const imageNaturalWidth = ref(0)
const imageNaturalHeight = ref(0)
const imageLoaded = ref(false)

const previewWidth = ref(0)
const previewHeight = ref(0)
const cropSize = ref(0)

function goBack() {
  router.push('/')
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  
  if (!file) return
  
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件')
    return
  }
  
  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      imageNaturalWidth.value = img.width
      imageNaturalHeight.value = img.height
      originalImage.value = img
      imageLoaded.value = true
      
      nextTick(() => {
        updateCanvasSize()
        resetCropPosition()
        showCropper.value = true
      })
    }
    img.src = e.target?.result as string
  }
  reader.readAsDataURL(file)
  
  input.value = ''
}

function updateCanvasSize() {
  if (!previewCanvas.value) return
  
  const windowWidth = window.innerWidth
  const windowHeight = window.innerHeight
  
  const headerHeight = 56
  const tipsHeight = 60
  const actionsHeight = 80
  const bottomSpace = tipsHeight + actionsHeight
  const availableHeight = windowHeight - headerHeight - bottomSpace
  
  previewWidth.value = windowWidth
  previewHeight.value = availableHeight
  
  cropSize.value = Math.min(windowWidth, availableHeight)
  
  previewCanvas.value.width = previewWidth.value
  previewCanvas.value.height = previewHeight.value
}

function resetCropPosition() {
  if (!imageLoaded.value || cropSize.value === 0) return
  
  const imgWidth = imageNaturalWidth.value
  const imgHeight = imageNaturalHeight.value
  
  const scaleW = cropSize.value / imgWidth
  const scaleH = cropSize.value / imgHeight
  const initialScale = Math.min(scaleW, scaleH)
  
  imageScale.value = initialScale
  imageOffsetX.value = 0
  imageOffsetY.value = 0
  
  drawPreview()
}

function getTouchDistance(touch1: Touch, touch2: Touch) {
  const dx = touch2.clientX - touch1.clientX
  const dy = touch2.clientY - touch1.clientY
  return Math.sqrt(dx * dx + dy * dy)
}

function handlePointerDown(event: PointerEvent) {
  if (!showCropper.value) return
  
  event.preventDefault()
  
  isDragging.value = true
  startX.value = event.clientX
  startY.value = event.clientY
  startOffsetX.value = imageOffsetX.value
  startOffsetY.value = imageOffsetY.value
}

function handlePointerMove(event: PointerEvent) {
  if (!isDragging.value || isPinching.value) return
  
  event.preventDefault()
  
  const dx = event.clientX - startX.value
  const dy = event.clientY - startY.value
  
  imageOffsetX.value = startOffsetX.value + dx
  imageOffsetY.value = startOffsetY.value + dy
  
  drawPreview()
}

function handlePointerUp() {
  isDragging.value = false
}

function handleTouchStart(event: TouchEvent) {
  if (!showCropper.value) return
  
  if (event.touches.length === 2) {
    event.preventDefault()
    isPinching.value = true
    initialPinchDistance.value = getTouchDistance(event.touches[0], event.touches[1])
    initialScale.value = imageScale.value
  } else if (event.touches.length === 1) {
    isDragging.value = true
    startX.value = event.touches[0].clientX
    startY.value = event.touches[0].clientY
    startOffsetX.value = imageOffsetX.value
    startOffsetY.value = imageOffsetY.value
  }
}

function handleTouchMove(event: TouchEvent) {
  if (event.touches.length === 2 && isPinching.value) {
    event.preventDefault()
    
    const currentDistance = getTouchDistance(event.touches[0], event.touches[1])
    const scaleFactor = currentDistance / initialPinchDistance.value
    
    let newScale = initialScale.value * scaleFactor
    newScale = Math.max(0.5, Math.min(5, newScale))
    
    imageScale.value = newScale
    drawPreview()
  } else if (event.touches.length === 1 && isDragging.value && !isPinching.value) {
    const dx = event.touches[0].clientX - startX.value
    const dy = event.touches[0].clientY - startY.value
    
    imageOffsetX.value = startOffsetX.value + dx
    imageOffsetY.value = startOffsetY.value + dy
    drawPreview()
  }
}

function handleTouchEnd() {
  isPinching.value = false
  isDragging.value = false
}

function handleWheel(event: WheelEvent) {
  if (!showCropper.value) return
  
  event.preventDefault()
  
  const delta = event.deltaY > 0 ? 0.9 : 1.1
  let newScale = imageScale.value * delta
  
  newScale = Math.max(0.5, Math.min(5, newScale))
  
  imageScale.value = newScale
  drawPreview()
}

function drawPreview() {
  if (!previewCanvas.value || !imageLoaded.value || !originalImage.value) return
  if (previewWidth.value === 0 || previewHeight.value === 0 || cropSize.value === 0) return
  
  const ctx = previewCanvas.value.getContext('2d')
  if (!ctx) return
  
  const canvas = previewCanvas.value
  const canvasW = canvas.width
  const canvasH = canvas.height
  
  ctx.clearRect(0, 0, canvasW, canvasH)
  
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, canvasW, canvasH)
  
  const imgWidth = imageNaturalWidth.value
  const imgHeight = imageNaturalHeight.value
  const scale = imageScale.value
  const offsetX = imageOffsetX.value
  const offsetY = imageOffsetY.value
  
  const drawWidth = imgWidth * scale
  const drawHeight = imgHeight * scale
  
  const centerX = canvasW / 2 + offsetX
  const centerY = canvasH / 2 + offsetY
  
  const x = centerX - drawWidth / 2
  const y = centerY - drawHeight / 2
  
  ctx.drawImage(originalImage.value, x, y, drawWidth, drawHeight)
  
  const cropX = (canvasW - cropSize.value) / 2
  const cropY = (canvasH - cropSize.value) / 2
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
  
  ctx.fillRect(0, 0, canvasW, cropY)
  
  ctx.fillRect(0, cropY + cropSize.value, canvasW, canvasH - cropY - cropSize.value)
  
  ctx.fillRect(0, cropY, cropX, cropSize.value)
  
  ctx.fillRect(cropX + cropSize.value, cropY, canvasW - cropX - cropSize.value, cropSize.value)
  
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.lineWidth = 2
  ctx.strokeRect(cropX, cropY, cropSize.value, cropSize.value)
  
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
  ctx.lineWidth = 1
  
  const gridStep = cropSize.value / 3
  
  for (let i = 1; i < 3; i++) {
    const lineY = cropY + gridStep * i
    ctx.beginPath()
    ctx.moveTo(cropX, lineY)
    ctx.lineTo(cropX + cropSize.value, lineY)
    ctx.stroke()
    
    const lineX = cropX + gridStep * i
    ctx.beginPath()
    ctx.moveTo(lineX, cropY)
    ctx.lineTo(lineX, cropY + cropSize.value)
    ctx.stroke()
  }
}

function cropImage(): string | null {
  if (!cropCanvas.value || !imageLoaded.value || !originalImage.value) return null
  if (previewWidth.value === 0 || previewHeight.value === 0 || cropSize.value === 0) return null
  
  const canvas = cropCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  
  const imgWidth = imageNaturalWidth.value
  const imgHeight = imageNaturalHeight.value
  const scale = imageScale.value
  const offsetX = imageOffsetX.value
  const offsetY = imageOffsetY.value
  
  const outputSize = 400
  canvas.width = outputSize
  canvas.height = outputSize
  
  ctx.clearRect(0, 0, outputSize, outputSize)
  
  const drawWidth = imgWidth * scale
  const drawHeight = imgHeight * scale
  
  const previewCenterX = previewWidth.value / 2 + offsetX
  const previewCenterY = previewHeight.value / 2 + offsetY
  
  const cropX = (previewWidth.value - cropSize.value) / 2
  const cropY = (previewHeight.value - cropSize.value) / 2
  
  const srcCropX = (cropX - (previewCenterX - drawWidth / 2)) / scale
  const srcCropY = (cropY - (previewCenterY - drawHeight / 2)) / scale
  const srcCropSize = cropSize.value / scale
  
  ctx.drawImage(
    originalImage.value,
    srcCropX, srcCropY, srcCropSize, srcCropSize,
    0, 0, outputSize, outputSize
  )
  
  return canvas.toDataURL('image/jpeg', 0.9)
}

function confirmCrop() {
  const croppedImage = cropImage()
  if (croppedImage) {
    currentAvatar.value = croppedImage
  }
  showCropper.value = false
}

function cancelCrop() {
  showCropper.value = false
}

function saveProfile() {
  if (!nickname.value.trim()) {
    ElMessage.error('昵称不能为空')
    return
  }
  
  userStore.updateUserInfo({
    avatar: currentAvatar.value,
    nickname: nickname.value.trim(),
    introduction: introduction.value.trim()
  })
  
  ElMessage.success('保存成功')
  router.push('/')
}

function handleResize() {
  if (showCropper.value) {
    updateCanvasSize()
    drawPreview()
  }
}

watch(showCropper, (val) => {
  if (val && imageLoaded.value) {
    nextTick(() => {
      updateCanvasSize()
      resetCropPosition()
    })
  }
})

onMounted(() => {
  window.addEventListener('pointermove', handlePointerMove)
  window.addEventListener('pointerup', handlePointerUp)
  window.addEventListener('touchmove', handleTouchMove, { passive: false })
  window.addEventListener('touchend', handleTouchEnd)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerup', handlePointerUp)
  window.removeEventListener('touchmove', handleTouchMove)
  window.removeEventListener('touchend', handleTouchEnd)
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="profile-edit-container">
    <div class="header">
      <el-button text class="back-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <span class="title">编辑资料</span>
      <el-button type="primary" text class="save-btn" @click="saveProfile">
        保存
      </el-button>
    </div>
    
    <div class="content">
      <div class="avatar-section">
        <div class="avatar-wrapper" @click="$refs.avatarInput?.click()">
          <img :src="currentAvatar" alt="头像" class="avatar" />
          <div class="avatar-overlay">
            <el-icon><Camera /></el-icon>
            <span>更换头像</span>
          </div>
        </div>
        <input 
          ref="avatarInput"
          type="file" 
          accept="image/*" 
          class="hidden-input"
          @change="handleFileSelect"
        />
      </div>
      
      <div class="form-section">
        <div class="form-item">
          <label class="form-label">昵称</label>
          <el-input
            v-model="nickname"
            placeholder="请输入昵称"
            maxlength="20"
            show-word-limit
            class="form-input"
          />
        </div>
        
        <div class="form-item">
          <label class="form-label">个人介绍</label>
          <el-input
            v-model="introduction"
            type="textarea"
            placeholder="介绍一下自己吧"
            maxlength="100"
            show-word-limit
            :rows="4"
            class="form-textarea"
          />
        </div>
      </div>
    </div>
    
    <el-dialog
      v-model="showCropper"
      title="裁剪头像"
      width="100%"
      fullscreen
      :show-close="false"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      class="cropper-dialog"
    >
      <div class="cropper-content">
        <div class="canvas-wrapper">
          <canvas
            ref="previewCanvas"
            class="preview-canvas"
            @pointerdown="handlePointerDown"
            @touchstart="handleTouchStart"
            @wheel="handleWheel"
          ></canvas>
        </div>
        
        <div class="crop-tips">
          <span>拖动调整位置</span>
          <span>双指缩放或滚轮缩放</span>
        </div>
        
        <div class="crop-actions">
          <el-button @click="cancelCrop">取消</el-button>
          <el-button type="primary" @click="confirmCrop">确定</el-button>
        </div>
      </div>
      <canvas ref="cropCanvas" class="hidden-canvas"></canvas>
    </el-dialog>
  </div>
</template>

<style scoped>
.profile-edit-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.header {
  position: sticky;
  top: 0;
  z-index: 100;
  height: 56px;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.back-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
}

.title {
  font-size: 17px;
  font-weight: 600;
  color: #333;
}

.save-btn {
  font-size: 15px;
  font-weight: 500;
  padding: 0 8px;
}

.content {
  padding: 20px 16px;
}

.avatar-section {
  display: flex;
  justify-content: center;
  margin-bottom: 32px;
}

.avatar-wrapper {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  border: 3px solid #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  opacity: 0;
  transition: opacity 0.2s;
}

.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.avatar-overlay .el-icon {
  font-size: 28px;
  margin-bottom: 4px;
}

.avatar-overlay span {
  font-size: 12px;
}

.hidden-input {
  display: none;
}

.form-section {
  background-color: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
}

.form-item {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.form-item:last-child {
  border-bottom: none;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.form-input {
  --el-input-bg-color: #fafafa;
}

.form-textarea {
  --el-textarea-bg-color: #fafafa;
}



@media (min-width: 768px) {
  .profile-edit-container {
    max-width: 480px;
    margin: 0 auto;
    background-color: #fff;
    min-height: 100vh;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.05);
  }
  
  .header {
    max-width: 480px;
    margin: 0 auto;
  }
  
  .content {
    padding: 24px;
  }
  
  .avatar-wrapper {
    width: 120px;
    height: 120px;
  }
}
</style>

<style>
.el-overlay {
  background-color: #000 !important;
}

.el-overlay-dialog {
  margin: 0 !important;
  padding: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  height: 100vh !important;
}

.el-dialog.cropper-dialog {
  margin: 0 !important;
  padding: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  height: 100vh !important;
  border-radius: 0 !important;
  background-color: #000 !important;
  overflow: hidden !important;
  box-shadow: none !important;
}

.el-dialog.cropper-dialog .el-dialog__header {
  background-color: #000;
  padding: 12px 16px;
  margin: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.el-dialog.cropper-dialog .el-dialog__title {
  color: #fff;
  font-size: 16px;
}

.el-dialog.cropper-dialog .el-dialog__headerbtn {
  display: none;
}

.el-dialog.cropper-dialog .el-dialog__body {
  padding: 0 !important;
  margin: 0 !important;
  background-color: #000;
  height: calc(100vh - 56px);
  overflow: hidden;
}

.el-dialog.cropper-dialog .cropper-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #000;
}

.el-dialog.cropper-dialog .canvas-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
  flex: 1;
  width: 100%;
}

.el-dialog.cropper-dialog .preview-canvas {
  display: block;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.el-dialog.cropper-dialog .crop-tips {
  padding: 16px 0;
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  line-height: 1.6;
  background-color: #000;
}

.el-dialog.cropper-dialog .crop-tips span {
  display: block;
}

.el-dialog.cropper-dialog .crop-actions {
  display: flex;
  justify-content: center;
  gap: 40px;
  padding: 16px 20px 32px;
  background-color: #000;
}

.el-dialog.cropper-dialog .crop-actions .el-button {
  min-width: 100px;
}

.el-dialog.cropper-dialog .hidden-canvas {
  display: none;
}

@media (min-width: 768px) {
  .el-overlay-dialog {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .el-dialog.cropper-dialog {
    width: 480px !important;
    max-width: 480px !important;
    height: 100vh !important;
  }
}
</style>
