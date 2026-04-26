<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useEntityStore, type EntityType, type Project, type Shop } from '../stores/entity'
import { ArrowLeft, Search, OfficeBuilding, Shop as ShopIcon, Check, ArrowDown, ArrowRight } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const entityStore = useEntityStore()

const searchKeyword = ref('')
const selectedId = ref<number | null>(null)
const selectedType = ref<EntityType | null>(null)
const expandedProjectIds = ref<Set<number>>(new Set())

const preSelectedId = route.query.selectedId ? Number(route.query.selectedId) : null
const preSelectedType = route.query.selectedType as EntityType | undefined

if (preSelectedId && preSelectedType) {
  selectedId.value = preSelectedId
  selectedType.value = preSelectedType
}

interface ProjectWithShops extends Project {
  shops: Shop[]
}

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
  return selectedId.value === id && selectedType.value === entityType
}

function selectEntity(entityType: EntityType, id: number) {
  selectedId.value = id
  selectedType.value = entityType
}

function confirmSelection() {
  if (selectedId.value !== null && selectedType.value !== null) {
    let entityName = ''
    let entityLogo = ''
    
    if (selectedType.value === 'project') {
      const project = entityStore.getProjectById(selectedId.value)
      if (project) {
        entityName = project.name
        entityLogo = project.logo
      }
    } else {
      const shop = entityStore.getShopById(selectedId.value)
      if (shop) {
        entityName = shop.name
        entityLogo = shop.logo
      }
    }
    
    router.push({
      path: '/create',
      query: {
        selectedType: selectedType.value,
        selectedId: selectedId.value.toString(),
        selectedName: entityName,
        selectedLogo: entityLogo
      }
    })
  }
}

function goBack() {
  router.back()
}

function clearSelection() {
  selectedId.value = null
  selectedType.value = null
}
</script>

<template>
  <div class="entity-select-container">
    <div class="header">
      <div class="header-left" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>取消</span>
      </div>
      <div class="header-title">选择关联</div>
      <div class="header-right">
        <el-button 
          type="primary" 
          size="small" 
          @click="confirmSelection"
          :disabled="selectedId === null"
        >
          确定
        </el-button>
      </div>
    </div>

    <div class="search-section">
      <div class="search-input-wrapper">
        <el-icon class="search-icon"><Search /></el-icon>
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="搜索项目或店铺"
          class="search-input"
        />
      </div>
    </div>

    <div class="tips-section">
      <span class="tips-text">
        提示：点击项目可展开查看下属店铺，可选择项目或店铺进行关联
      </span>
    </div>

    <div class="content-section">
      <div v-if="filteredProjectGroups.length === 0" class="empty-state">
        <el-icon class="empty-icon"><Search /></el-icon>
        <p class="empty-text">暂无搜索结果</p>
      </div>

      <template v-else>
        <div 
          v-for="group in filteredProjectGroups" 
          :key="group.id" 
          class="project-group"
        >
          <div 
            class="project-item"
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
            class="shop-list"
          >
            <div
              v-for="shop in group.shops"
              :key="shop.id"
              class="shop-item"
              :class="{ selected: isSelected('shop', shop.id) }"
              @click="selectEntity('shop', shop.id)"
            >
              <div class="shop-indent"></div>
              
              <div class="entity-avatar shop-avatar-small">
                <img :src="shop.logo" :alt="shop.name" />
                <div class="entity-type-badge shop">
                  <el-icon><ShopIcon /></el-icon>
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
            class="no-shops-hint"
          >
            <span class="no-shops-text">该项目暂无关联店铺</span>
          </div>
        </div>
      </template>
    </div>

    <div v-if="selectedId !== null" class="bottom-action">
      <div class="selected-preview">
        <span class="selected-label">已选择：</span>
        <span class="selected-name">
          {{ 
            selectedType === 'project' 
              ? entityStore.getProjectById(selectedId)?.name
              : entityStore.getShopById(selectedId)?.name
          }}
        </span>
        <span class="clear-btn" @click="clearSelection">清除</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.entity-select-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
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

.search-section {
  background-color: white;
  padding: 12px;
  border-bottom: 1px solid #eee;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 10px 12px;
}

.search-icon {
  color: #999;
  font-size: 16px;
  margin-right: 8px;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  outline: none;
  color: #333;
}

.search-input::placeholder {
  color: #999;
}

.tips-section {
  background-color: #f0f5ff;
  padding: 10px 12px;
  border-bottom: 1px solid #d6e4ff;
}

.tips-text {
  font-size: 12px;
  color: #667eea;
}

.content-section {
  flex: 1;
  padding: 12px;
  padding-bottom: 80px;
  overflow-y: auto;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  color: #ccc;
}

.empty-text {
  font-size: 14px;
  color: #999;
}

.project-group {
  margin-bottom: 12px;
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
}

.project-item {
  display: flex;
  align-items: center;
  padding: 14px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
}

.project-item:active {
  background-color: #f5f5f5;
}

.project-item.selected {
  background-color: #f5f7ff;
}

.expand-btn {
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

.expand-btn:active {
  background-color: #e8e8e8;
}

.expand-btn.expanded {
  background-color: #f0f5ff;
  color: #667eea;
}

.expand-btn .el-icon {
  font-size: 14px;
  color: #666;
  transition: transform 0.2s;
}

.expand-btn.expanded .el-icon {
  color: #667eea;
}

.entity-content {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.entity-avatar {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  background-color: #f0f0f0;
  margin-left: 10px;
}

.entity-avatar-small {
  width: 40px;
  height: 40px;
  border-radius: 8px;
}

.entity-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.entity-type-badge {
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

.entity-type-badge.project {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.entity-type-badge.shop {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.entity-type-badge .el-icon {
  font-size: 10px;
  color: white;
}

.entity-info {
  flex: 1;
  margin-left: 10px;
  min-width: 0;
}

.entity-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.entity-subtitle {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.entity-check {
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

.entity-check .el-icon {
  font-size: 14px;
  color: white;
}

.shop-list {
  background-color: #fafafa;
  border-top: 1px solid #f0f0f0;
}

.shop-item {
  display: flex;
  align-items: center;
  padding: 12px 12px;
  padding-left: 0;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
}

.shop-item:active {
  background-color: #f5f5f5;
}

.shop-item.selected {
  background-color: #f5f7ff;
}

.shop-indent {
  width: 54px;
  flex-shrink: 0;
}

.no-shops-hint {
  padding: 16px;
  text-align: center;
  background-color: #fafafa;
  border-top: 1px solid #f0f0f0;
}

.no-shops-text {
  font-size: 13px;
  color: #999;
}

.bottom-action {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: white;
  padding: 12px 16px;
  border-top: 1px solid #eee;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  z-index: 10;
}

.selected-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.selected-label {
  font-size: 13px;
  color: #666;
}

.selected-name {
  font-size: 14px;
  font-weight: 500;
  color: #667eea;
  flex: 1;
  margin-left: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.clear-btn {
  font-size: 13px;
  color: #f5576c;
  cursor: pointer;
  margin-left: 8px;
}

.clear-btn:active {
  color: #d63031;
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

  .search-section {
    padding: 16px 24px;
  }

  .tips-section {
    padding: 12px 24px;
  }

  .content-section {
    padding: 16px 24px;
    padding-bottom: 90px;
    max-width: 600px;
    margin: 0 auto;
    width: 100%;
  }

  .project-item {
    padding: 16px;
  }

  .project-item:hover {
    background-color: #f9f9f9;
  }

  .project-item.selected:hover {
    background-color: #f5f7ff;
  }

  .shop-item {
    padding: 14px 16px;
    padding-left: 0;
  }

  .shop-item:hover {
    background-color: #f5f5f5;
  }

  .shop-item.selected:hover {
    background-color: #f5f7ff;
  }

  .bottom-action {
    padding: 16px 24px;
  }
}
</style>
