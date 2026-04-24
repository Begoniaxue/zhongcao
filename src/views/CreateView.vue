<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useArticleStore } from '../stores/article'

const router = useRouter()
const articleStore = useArticleStore()

const title = ref('')
const content = ref('')
const images = ref<string[]>([])
const fileInputRef = ref<HTMLInputElement | null>(null)

const maxImages = 6

const remainingSlots = computed(() => maxImages - images.value.length)

const showAddButton = computed(() => images.value.length < maxImages)

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const files = input.files

  if (!files || files.length === 0) return

  const remaining = maxImages - images.value.length
  const filesToProcess = Array.from(files).slice(0, remaining)

  filesToProcess.forEach((file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      images.value.push(result)
    }
    reader.readAsDataURL(file)
  })

  if (input) {
    input.value = ''
  }
}

function removeImage(index: number) {
  images.value.splice(index, 1)
}

function triggerFileInput() {
  fileInputRef.value?.click()
}

function goBack() {
  router.back()
}

function submitArticle() {
  if (!title.value.trim()) {
    ElMessage.warning('请输入文章标题')
    return
  }

  if (!content.value.trim()) {
    ElMessage.warning('请输入文章内容')
    return
  }

  articleStore.addArticle(
    title.value.trim(),
    content.value.trim(),
    images.value.length > 0
      ? images.value
      : [
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20lifestyle%20scenery%20sunset&image_size=square'
        ]
  )

  ElMessage.success('发布成功！')
  router.push('/')
}
</script>

<template>
  <div class="create-container">
    <div class="header">
      <div class="header-left" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>取消</span>
      </div>
      <div class="header-title">发布文章</div>
      <div class="header-right">
        <el-button type="primary" size="small" @click="submitArticle">
          发布
        </el-button>
      </div>
    </div>

    <div class="form-content">
      <div class="form-item">
        <el-input
          v-model="title"
          placeholder="请输入文章标题"
          class="title-input"
          :maxlength="50"
          show-word-limit
        />
      </div>

      <div class="form-item">
        <el-input
          v-model="content"
          type="textarea"
          :rows="8"
          placeholder="分享你的种草心得..."
          class="content-textarea"
          resize="none"
        />
      </div>

      <div class="form-item">
        <div class="image-section">
          <div class="image-header">
            <span class="image-title">添加图片</span>
            <span class="image-count">({{ images.length }}/{{ maxImages }})</span>
          </div>
          <div class="image-grid">
            <div
              v-for="(image, index) in images"
              :key="index"
              class="image-item"
            >
              <img :src="image" alt="图片" />
              <div class="image-remove" @click="removeImage(index)">
                <el-icon><Close /></el-icon>
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
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ArrowLeft, Plus, Close } from '@element-plus/icons-vue'

export default {
  components: {
    ArrowLeft,
    Plus,
    Close
  }
}
</script>

<style scoped>
.create-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  background-color: white;
  padding: 0 12px;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #666;
  font-size: 14px;
}

.header-left:active {
  color: #333;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.header-right {
  min-width: 56px;
  display: flex;
  justify-content: flex-end;
}

.form-content {
  padding: 12px;
}

.form-item {
  margin-bottom: 12px;
}

.title-input {
  font-size: 17px;
  font-weight: 500;
}

.title-input :deep(.el-input__wrapper) {
  border: none;
  box-shadow: none;
  background-color: white;
  border-radius: 10px;
  padding: 14px 12px;
}

.content-textarea :deep(.el-textarea__inner) {
  border: none;
  box-shadow: none;
  background-color: white;
  border-radius: 10px;
  padding: 12px;
  font-size: 14px;
  line-height: 1.8;
}

.image-section {
  background-color: white;
  border-radius: 10px;
  padding: 12px;
}

.image-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.image-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.image-count {
  font-size: 13px;
  color: #999;
  margin-left: 4px;
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
}

.image-remove:active {
  background-color: rgba(0, 0, 0, 0.7);
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

@media (min-width: 768px) {
  .header {
    height: 56px;
    padding: 0 24px;
  }

  .header-left {
    font-size: 15px;
  }

  .header-title {
    font-size: 17px;
  }

  .form-content {
    padding: 16px 24px;
    max-width: 600px;
    margin: 0 auto;
  }

  .form-item {
    margin-bottom: 16px;
  }

  .title-input {
    font-size: 18px;
  }

  .title-input :deep(.el-input__wrapper) {
    border-radius: 12px;
    padding: 16px;
  }

  .content-textarea :deep(.el-textarea__inner) {
    border-radius: 12px;
    padding: 16px;
    font-size: 15px;
  }

  .image-section {
    border-radius: 12px;
    padding: 16px;
  }

  .image-header {
    margin-bottom: 16px;
  }

  .image-title {
    font-size: 16px;
  }

  .image-count {
    font-size: 14px;
  }

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
  .header {
    height: 48px;
  }

  .header-left {
    font-size: 13px;
  }

  .header-title {
    font-size: 15px;
  }

  .title-input {
    font-size: 16px;
  }

  .title-input :deep(.el-input__wrapper) {
    padding: 12px 10px;
  }

  .content-textarea :deep(.el-textarea__inner) {
    padding: 10px;
    font-size: 13px;
  }

  .image-section {
    padding: 10px;
  }

  .image-header {
    margin-bottom: 10px;
  }

  .image-title {
    font-size: 14px;
  }

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
</style>
