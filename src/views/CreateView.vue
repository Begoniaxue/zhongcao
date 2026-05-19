<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useArticleStore, type LinkedEntity } from '../stores/article'
import { useEntityStore, type EntityType, type Project, type Shop as ShopType } from '../stores/entity'
import ImageUploader from '../components/ImageUploader.vue'

const router = useRouter()
const route = useRoute()
const articleStore = useArticleStore()
const entityStore = useEntityStore()

const title = ref('')
const content = ref('')
const images = ref<string[]>([])

const linkedEntity = ref<LinkedEntity | null>(null)

const showEntitySelectDialog = ref(false)

const searchKeyword = ref('')
const dialogSelectedId = ref<number | null>(null)
const dialogSelectedType = ref<EntityType | null>(null)
const expandedProjectIds = ref<Set<number>>(new Set())

interface ProjectWithShops extends Project {
  shops: ShopType[]
}

const maxImages = 6

const projectGroups = computed((): ProjectWithShops[] => {
  const projects = entityStore.accessibleProjects
  const shops = entityStore.accessibleShops
  
  return projects.map(project => ({
    ...project,
    shops: shops.filter(shop => shop.projectId === project.id)
  }))
})

const filteredProjectGroups = computed((): ProjectWithShops[] => {
  if (!searchKeyword.value.trim()) {
    return projectGroups.value
  }
  
  const keyword = searchKeyword.value.toLowerCase().trim()
  
  return projectGroups.value
    .map(group => {
      const projectMatches = group.name.toLowerCase().includes(keyword) ||
                            group.category.toLowerCase().includes(keyword) ||
                            group.description.toLowerCase().includes(keyword)
      
      const matchedShops = group.shops.filter(shop =>
        shop.name.toLowerCase().includes(keyword) ||
        shop.category.toLowerCase().includes(keyword)
      )
      
      if (projectMatches || matchedShops.length > 0) {
        return {
          ...group,
          shops: matchedShops
        }
      }
      return null
    })
    .filter((group): group is ProjectWithShops => group !== null)
})

onMounted(() => {
  const selectedType = route.query.selectedType as EntityType | undefined
  const selectedId = route.query.selectedId ? Number(route.query.selectedId) : null
  const selectedName = route.query.selectedName as string | undefined
  const selectedLogo = route.query.selectedLogo as string | undefined

  if (selectedType && selectedId && selectedName) {
    linkedEntity.value = {
      type: selectedType,
      id: selectedId,
      name: selectedName,
      logo: selectedLogo
    }
  }
})

function goBack() {
  router.back()
}


function closeEntitySelectDialog() {
  showEntitySelectDialog.value = false
}

function isExpanded(projectId: number): boolean {
  return expandedProjectIds.value.has(projectId)
}

function toggleExpand(projectId: number, event: Event) {
  event.stopPropagation()
  if (expandedProjectIds.value.has(projectId)) {
    expandedProjectIds.value.delete(projectId)
  } else {
    expandedProjectIds.value.add(projectId)
  }
}

function isSelected(entityType: EntityType, id: number): boolean {
  return dialogSelectedId.value === id && dialogSelectedType.value === entityType
}

function selectEntity(entityType: EntityType, id: number) {
  dialogSelectedId.value = id
  dialogSelectedType.value = entityType
}

function confirmEntitySelection() {
  if (dialogSelectedId.value !== null && dialogSelectedType.value !== null) {
    let entityName = ''
    let entityLogo = ''
    
    if (dialogSelectedType.value === 'project') {
      const project = entityStore.getProjectById(dialogSelectedId.value)
      if (project) {
        entityName = project.name
        entityLogo = project.logo
      }
    } else {
      const shop = entityStore.getShopById(dialogSelectedId.value)
      if (shop) {
        entityName = shop.name
        entityLogo = shop.logo
      }
    }
    
    linkedEntity.value = {
      type: dialogSelectedType.value,
      id: dialogSelectedId.value,
      name: entityName,
      logo: entityLogo
    }
    
    closeEntitySelectDialog()
  } else {
    ElMessage.warning('请选择关联的项目或店铺')
  }
}

function clearDialogSelection() {
  dialogSelectedId.value = null
  dialogSelectedType.value = null
}

function clearLinkedEntity() {
  linkedEntity.value = null
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

  if (!linkedEntity.value) {
    ElMessage.warning('请选择关联的项目或店铺')
    return
  }

  articleStore.addArticle(
    title.value.trim(),
    content.value.trim(),
    images.value.length > 0
      ? images.value
      : [
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20lifestyle%20scenery%20sunset&image_size=square'
        ],
    linkedEntity.value || undefined
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
        <div class="link-section" @click="showEntitySelectDialog = true">
          <div class="link-header">
            <div class="link-title">关联店铺<span class="required-mark">*</span></div>
            <el-icon class="link-arrow"><ArrowRight /></el-icon>
          </div>
          
          <template v-if="linkedEntity">
            <div class="linked-preview">
              <div class="linked-avatar">
                <img :src="linkedEntity.logo" :alt="linkedEntity.name" />
                <div class="linked-type-badge" :class="linkedEntity.type">
                  <el-icon v-if="linkedEntity.type === 'project'"><OfficeBuilding /></el-icon>
                  <el-icon v-else><Shop /></el-icon>
                </div>
              </div>
              <div class="linked-info">
                <div class="linked-name">{{ linkedEntity.name }}</div>
                <div class="linked-type-text">
                  {{ linkedEntity.type === 'project' ? '项目' : '店铺' }}
                </div>
              </div>
              <div class="linked-clear" @click.stop="clearLinkedEntity">
                <el-icon><Close /></el-icon>
              </div>
            </div>
          </template>
          
          <template v-else>
            <div class="link-placeholder">
              <el-icon class="placeholder-icon"><OfficeBuilding /></el-icon>
              <span class="placeholder-text">请选择关联的项目或店铺</span>
            </div>
          </template>
        </div>
      </div>

      <div class="form-item">
        <div class="image-section">
          <div class="image-header">
            <span class="image-title">添加图片</span>
            <span class="image-count">({{ images.length }}/{{ maxImages }})</span>
          </div>
          <ImageUploader
            v-model="images"
            :max-count="maxImages"
            :compress-quality="0.8"
            :crop-aspect-ratio="1"
          />
        </div>
      </div>
    </div>
  </div>

  <div v-if="showEntitySelectDialog" class="dialog-overlay" @click.self="closeEntitySelectDialog">
    <div class="dialog-container" @click.stop>
      <div class="dialog-header">
        <div class="dialog-header-left" @click="closeEntitySelectDialog">
          <span>取消</span>
        </div>
        <div class="dialog-header-title">选择关联</div>
        <div class="dialog-header-right">
          <el-button 
            type="primary" 
            size="small" 
            @click="confirmEntitySelection"
            :disabled="dialogSelectedId === null"
          >
            确定
          </el-button>
        </div>
      </div>

      <div class="dialog-search-section">
        <div class="dialog-search-input-wrapper">
          <el-icon class="search-icon"><Search /></el-icon>
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="搜索项目或店铺"
            class="search-input"
          />
        </div>
      </div>

      <div class="dialog-tips-section">
        <span class="tips-text">
          提示：点击项目可展开查看下属店铺，可选择项目或店铺进行关联
        </span>
      </div>

      <div class="dialog-content-section">
        <div v-if="filteredProjectGroups.length === 0" class="dialog-empty-state">
          <el-icon class="empty-icon"><Search /></el-icon>
          <p class="empty-text">暂无搜索结果</p>
        </div>

        <template v-else>
          <div 
            v-for="group in filteredProjectGroups" 
            :key="group.id" 
            class="dialog-project-group"
          >
            <div 
              class="dialog-project-item"
              :class="{ selected: isSelected('project', group.id) }"
            >
              <div 
                class="expand-btn" 
                @click="toggleExpand(group.id, $event)"
                :class="{ expanded: isExpanded(group.id) }"
              >
                <el-icon v-if="isExpanded(group.id)"><ArrowDown /></el-icon>
                <el-icon v-else><ArrowRight /></el-icon>
              </div>
              
              <div 
                class="entity-content"
                @click="selectEntity('project', group.id)"
              >
                <div class="entity-avatar">
                  <img :src="group.logo" :alt="group.name" />
                  <div class="entity-type-badge project">
                    <el-icon><OfficeBuilding /></el-icon>
                  </div>
                </div>
                <div class="entity-info">
                  <div class="entity-name">{{ group.name }}</div>
                  <div class="entity-subtitle">
                    {{ group.category }} · {{ group.shops.length }} 家店铺
                  </div>
                </div>
              </div>
              
              <div class="entity-check" v-if="isSelected('project', group.id)">
                <el-icon><Check /></el-icon>
              </div>
            </div>

            <div 
              v-if="isExpanded(group.id) && group.shops.length > 0" 
              class="dialog-shop-list"
            >
              <div
                v-for="shop in group.shops"
                :key="shop.id"
                class="dialog-shop-item"
                :class="{ selected: isSelected('shop', shop.id) }"
                @click="selectEntity('shop', shop.id)"
              >
                <div class="shop-indent"></div>
                
                <div class="entity-avatar shop-avatar-small">
                  <img :src="shop.logo" :alt="shop.name" />
                  <div class="entity-type-badge shop">
                    <el-icon><Shop /></el-icon>
                  </div>
                </div>
                <div class="entity-info">
                  <div class="entity-name">{{ shop.name }}</div>
                  <div class="entity-subtitle">{{ shop.category }}</div>
                </div>
                
                <div class="entity-check" v-if="isSelected('shop', shop.id)">
                  <el-icon><Check /></el-icon>
                </div>
              </div>
            </div>

            <div 
              v-if="isExpanded(group.id) && group.shops.length === 0" 
              class="dialog-no-shops-hint"
            >
              <span class="no-shops-text">该项目暂无关联店铺</span>
            </div>
          </div>
        </template>
      </div>

      <div v-if="dialogSelectedId !== null" class="dialog-bottom-action">
        <div class="selected-preview">
          <span class="selected-label">已选择：</span>
          <span class="selected-name">
            {{ 
              dialogSelectedType === 'project' 
                ? entityStore.getProjectById(dialogSelectedId)?.name
                : entityStore.getShopById(dialogSelectedId)?.name
            }}
          </span>
          <span class="clear-btn" @click="clearDialogSelection">清除</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ArrowLeft, ArrowRight, Close, OfficeBuilding, Shop, Search, ArrowDown, Check } from '@element-plus/icons-vue'

export default {
  components: {
    ArrowLeft,
    ArrowRight,
    Close,
    OfficeBuilding,
    Shop,
    Search,
    ArrowDown,
    Check
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

.link-section {
  background-color: white;
  border-radius: 10px;
  padding: 14px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.link-section:active {
  background-color: #f9f9f9;
}

.link-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.link-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.required-mark {
  color: #f5576c;
  margin-left: 2px;
}

.link-arrow {
  font-size: 14px;
  color: #999;
}

.link-placeholder {
  display: flex;
  align-items: center;
  padding: 10px 0;
  color: #999;
}

.placeholder-icon {
  font-size: 18px;
  margin-right: 8px;
  color: #ccc;
}

.placeholder-text {
  font-size: 14px;
  color: #999;
}

.linked-preview {
  display: flex;
  align-items: center;
  padding: 8px 0;
}

.linked-avatar {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  background-color: #f0f0f0;
}

.linked-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.linked-type-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
}

.linked-type-badge.project {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.linked-type-badge.shop {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.linked-type-badge .el-icon {
  font-size: 10px;
  color: white;
}

.linked-info {
  flex: 1;
  margin-left: 10px;
  min-width: 0;
}

.linked-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.linked-type-text {
  font-size: 12px;
  color: #999;
}

.linked-clear {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
  flex-shrink: 0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.linked-clear:active {
  background-color: #e0e0e0;
}

.linked-clear .el-icon {
  font-size: 12px;
  color: #999;
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

  .link-section {
    border-radius: 12px;
    padding: 16px;
  }

  .link-section:hover {
    background-color: #f9f9f9;
  }

  .link-title {
    font-size: 16px;
  }

  .placeholder-text {
    font-size: 15px;
  }

  .linked-avatar {
    width: 48px;
    height: 48px;
    border-radius: 10px;
  }

  .linked-type-badge {
    width: 20px;
    height: 20px;
  }

  .linked-type-badge .el-icon {
    font-size: 12px;
  }

  .linked-name {
    font-size: 15px;
  }

  .linked-clear:hover {
    background-color: #e8e8e8;
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
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #f5f5f5;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.dialog-container {
  width: 100%;
  height: 100%;
  background-color: #f5f5f5;
  border-radius: 0;
  display: flex;
  flex-direction: column;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  background-color: white;
  padding: 0 12px;
  border-bottom: 1px solid #eee;
  border-radius: 0;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.dialog-header-left {
  min-width: 56px;
  cursor: pointer;
  color: #666;
  font-size: 14px;
}

.dialog-header-left:active {
  color: #333;
}

.dialog-header-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.dialog-header-right {
  min-width: 56px;
  display: flex;
  justify-content: flex-end;
}

.dialog-search-section {
  background-color: white;
  padding: 12px;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}

.dialog-search-input-wrapper {
  display: flex;
  align-items: center;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 10px 12px;
}

.dialog-search-input-wrapper .search-icon {
  color: #999;
  font-size: 16px;
  margin-right: 8px;
}

.dialog-search-input-wrapper .search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  outline: none;
  color: #333;
}

.dialog-search-input-wrapper .search-input::placeholder {
  color: #999;
}

.dialog-tips-section {
  background-color: #f0f5ff;
  padding: 10px 12px;
  border-bottom: 1px solid #d6e4ff;
  flex-shrink: 0;
}

.dialog-tips-section .tips-text {
  font-size: 12px;
  color: #667eea;
}

.dialog-content-section {
  flex: 1;
  padding: 12px;
  padding-bottom: 80px;
  overflow-y: auto;
}

.dialog-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #999;
}

.dialog-empty-state .empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  color: #ccc;
}

.dialog-empty-state .empty-text {
  font-size: 14px;
  color: #999;
}

.dialog-project-group {
  margin-bottom: 12px;
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
}

.dialog-project-item {
  display: flex;
  align-items: center;
  padding: 14px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
}

.dialog-project-item:active {
  background-color: #f5f5f5;
}

.dialog-project-item.selected {
  background-color: #f5f7ff;
}

.dialog-project-item .expand-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.dialog-project-item .expand-btn:active {
  background-color: #e8e8e8;
}

.dialog-project-item .expand-btn.expanded {
  background-color: #f0f5ff;
  color: #667eea;
}

.dialog-project-item .expand-btn .el-icon {
  font-size: 14px;
  color: #666;
  transition: transform 0.2s;
}

.dialog-project-item .expand-btn.expanded .el-icon {
  color: #667eea;
}

.dialog-project-item .entity-content,
.dialog-shop-item .entity-content {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.dialog-project-item .entity-avatar,
.dialog-shop-item .entity-avatar {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  background-color: #f0f0f0;
  margin-left: 10px;
}

.dialog-project-item .entity-avatar img,
.dialog-shop-item .entity-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dialog-project-item .entity-avatar.shop-avatar-small,
.dialog-shop-item .entity-avatar.shop-avatar-small {
  width: 40px;
  height: 40px;
  border-radius: 8px;
}

.dialog-project-item .entity-type-badge,
.dialog-shop-item .entity-type-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
}

.dialog-project-item .entity-type-badge.project,
.dialog-shop-item .entity-type-badge.project {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.dialog-project-item .entity-type-badge.shop,
.dialog-shop-item .entity-type-badge.shop {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.dialog-project-item .entity-type-badge .el-icon,
.dialog-shop-item .entity-type-badge .el-icon {
  font-size: 10px;
  color: white;
}

.dialog-project-item .entity-info,
.dialog-shop-item .entity-info {
  flex: 1;
  margin-left: 10px;
  min-width: 0;
}

.dialog-project-item .entity-name,
.dialog-shop-item .entity-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dialog-project-item .entity-subtitle,
.dialog-shop-item .entity-subtitle {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dialog-project-item .entity-check,
.dialog-shop-item .entity-check {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 12px;
  flex-shrink: 0;
}

.dialog-project-item .entity-check .el-icon,
.dialog-shop-item .entity-check .el-icon {
  font-size: 14px;
  color: white;
}

.dialog-shop-list {
  background-color: #fafafa;
  border-top: 1px solid #f0f0f0;
}

.dialog-shop-item {
  display: flex;
  align-items: center;
  padding: 12px 12px;
  padding-left: 0;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
}

.dialog-shop-item:active {
  background-color: #f5f5f5;
}

.dialog-shop-item.selected {
  background-color: #f5f7ff;
}

.dialog-shop-item .shop-indent {
  width: 54px;
  flex-shrink: 0;
}

.dialog-no-shops-hint {
  padding: 16px;
  text-align: center;
  background-color: #fafafa;
  border-top: 1px solid #f0f0f0;
}

.dialog-no-shops-hint .no-shops-text {
  font-size: 13px;
  color: #999;
}

.dialog-bottom-action {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: white;
  padding: 12px 16px;
  border-top: 1px solid #eee;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  z-index: 10;
}

.dialog-bottom-action .selected-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dialog-bottom-action .selected-label {
  font-size: 13px;
  color: #666;
}

.dialog-bottom-action .selected-name {
  font-size: 14px;
  font-weight: 500;
  color: #667eea;
  flex: 1;
  margin-left: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dialog-bottom-action .clear-btn {
  font-size: 13px;
  color: #f5576c;
  cursor: pointer;
  margin-left: 8px;
}

.dialog-bottom-action .clear-btn:active {
  color: #d63031;
}

@media (min-width: 768px) {
  .dialog-overlay {
    flex-direction: column;
    padding: 0;
  }

  .dialog-container {
    width: 100%;
    max-width: 600px;
    height: 100%;
    border-radius: 0;
    margin: 0 auto;
  }

  .dialog-header {
    height: 56px;
    padding: 0 20px;
    border-radius: 0;
  }

  .dialog-header-left {
    font-size: 15px;
  }

  .dialog-header-title {
    font-size: 17px;
  }

  .dialog-search-section {
    padding: 16px 20px;
  }

  .dialog-tips-section {
    padding: 12px 20px;
  }

  .dialog-content-section {
    padding: 16px 20px;
    padding-bottom: 90px;
  }

  .dialog-project-item {
    padding: 16px;
  }

  .dialog-project-item:hover {
    background-color: #f9f9f9;
  }

  .dialog-project-item.selected:hover {
    background-color: #f5f7ff;
  }

  .dialog-shop-item {
    padding: 14px 16px;
    padding-left: 0;
  }

  .dialog-shop-item:hover {
    background-color: #f5f5f5;
  }

  .dialog-shop-item.selected:hover {
    background-color: #f5f7ff;
  }

  .dialog-bottom-action {
    padding: 16px 20px;
  }
}
</style>
