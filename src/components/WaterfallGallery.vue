<template>
  <div class="waterfall-gallery" ref="galleryRef">
    <div class="gallery-header">
      <h2>图片画廊</h2>
      <div class="category-filters">
        <button
          v-for="cat in categories"
          :key="cat.value"
          :class="{ active: activeCategory === cat.value }"
          @click="changeCategory(cat.value)"
          :disabled="loading"
        >
          {{ cat.label }}
        </button>
      </div>
    </div>

    <div v-if="error" class="error-message">
      <span>{{ error }}</span>
      <button @click="retry">重试</button>
    </div>

    <div 
      class="waterfall-container"
      :style="{ 
        display: 'grid',
        gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
        gap: `${gap}px`
      }"
    >
      <div
        v-for="item in images"
        :key="item.id"
        class="gallery-item"
      >
        <div class="image-card">
          <LazyImage
            :src="item.thumbnailUrl"
            :alt="item.title"
            :width="item.width"
            :height="item.height"
            :loading="getLoadingStrategy(item.id)"
          />
          <div class="image-info">
            <h3 class="image-title">{{ item.title }}</h3>
            <div class="image-meta">
              <span class="author">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                {{ item.author }}
              </span>
              <span class="likes">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {{ formatLikes(item.likes) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="load-more-section">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <span>加载中...</span>
      </div>
      <div v-else-if="!hasMore && images.length > 0" class="no-more">
        <span>已加载全部内容 (共 {{ images.length }} 张图片)</span>
      </div>
      <div v-else-if="images.length === 0 && !loading" class="empty-state">
        <span>暂无图片</span>
      </div>
    </div>

    <div ref="sentinelRef" class="scroll-sentinel"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import LazyImage from './LazyImage.vue'
import { getImages, ImageItem, cancelAllRequests } from '../services/imageApi'

interface Category {
  label: string
  value: string | null
}

const SCROLL_THRESHOLD = 150
const PRELOAD_COUNT = 10
const SCROLL_DEBOUNCE_MS = 100
const INITIAL_PAGE_COUNT = 4

const galleryRef = ref<HTMLElement | null>(null)
const sentinelRef = ref<HTMLElement | null>(null)

const images = ref<ImageItem[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const hasMore = ref(true)
const currentPage = ref(1)
const activeCategory = ref<string | null>(null)
const gap = ref(16)
const columnCount = ref(4)
const isFirstLoad = ref(true)

const categories: Category[] = [
  { label: '全部', value: null },
  { label: '自然', value: 'nature' },
  { label: '城市', value: 'city' },
  { label: '美食', value: 'food' },
  { label: '人物', value: 'people' },
  { label: '动物', value: 'animals' },
  { label: '建筑', value: 'architecture' },
  { label: '旅行', value: 'travel' },
  { label: '艺术', value: 'art' }
]

let sentinelObserver: IntersectionObserver | null = null
let resizeObserver: ResizeObserver | null = null
let requestId: number | null = null
let lastScrollTime = 0

const formatLikes = (likes: number): string => {
  if (likes >= 10000) {
    return (likes / 10000).toFixed(1) + 'w'
  } else if (likes >= 1000) {
    return (likes / 1000).toFixed(1) + 'k'
  }
  return String(likes)
}

const getLoadingStrategy = (imageId: number): 'lazy' | 'eager' => {
  return imageId <= PRELOAD_COUNT ? 'eager' : 'lazy'
}

const updateColumnCount = () => {
  const width = window.innerWidth
  if (width < 480) {
    columnCount.value = 2
  } else if (width < 768) {
    columnCount.value = 3
  } else if (width < 1200) {
    columnCount.value = 4
  } else if (width < 1600) {
    columnCount.value = 5
  } else {
    columnCount.value = 6
  }
}

const getDocumentHeight = (): number => {
  return Math.max(
    document.body.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.clientHeight,
    document.documentElement.scrollHeight,
    document.documentElement.offsetHeight
  )
}

const fetchImages = async (reset: boolean = false) => {
  if (loading.value || (!hasMore.value && !reset)) return
  
  if (reset) {
    currentPage.value = 1
    hasMore.value = true
    images.value = []
    error.value = null
  }

  loading.value = true
  error.value = null

  try {
    const response = await getImages(currentPage.value, 12, activeCategory.value || undefined)
    
    images.value = [...images.value, ...response.data.items]
    
    hasMore.value = response.data.pagination.hasNext
    currentPage.value++
    
    await nextTick()
  } catch (err) {
    if ((err as Error).name !== 'AbortError') {
      error.value = err instanceof Error ? err.message : '加载失败'
    }
  } finally {
    loading.value = false
  }
}

const loadInitialData = async () => {
  for (let i = 0; i < INITIAL_PAGE_COUNT; i++) {
    if (!hasMore.value) break
    await fetchImages(false)
  }
}

const changeCategory = (category: string | null) => {
  if (category === activeCategory.value) return
  
  activeCategory.value = category
  currentPage.value = 1
  hasMore.value = true
  images.value = []
  error.value = null
  
  fetchImages(true).then(() => {
    loadInitialData()
  })
}

const retry = () => {
  fetchImages(false)
}

const handleScroll = () => {
  const now = Date.now()
  if (now - lastScrollTime < SCROLL_DEBOUNCE_MS) return
  lastScrollTime = now
  
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const windowHeight = window.innerHeight
  const documentHeight = getDocumentHeight()
  
  if (scrollTop + windowHeight >= documentHeight - SCROLL_THRESHOLD) {
    if (!loading.value && hasMore.value) {
      fetchImages(false)
    }
  }
}

const setupSentinelObserver = () => {
  if (sentinelObserver) {
    sentinelObserver.disconnect()
  }

  sentinelObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !loading.value && hasMore.value) {
          fetchImages(false)
        }
      })
    },
    {
      root: null,
      rootMargin: `${SCROLL_THRESHOLD}px 0px`,
      threshold: 0.0
    }
  )

  if (sentinelRef.value) {
    sentinelObserver.observe(sentinelRef.value)
  }
}

const setupResizeObserver = () => {
  resizeObserver = new ResizeObserver(() => {
    if (requestId) {
      cancelAnimationFrame(requestId)
    }
    requestId = requestAnimationFrame(() => {
      updateColumnCount()
    })
  })

  if (document.documentElement) {
    resizeObserver.observe(document.documentElement)
  }
}

onMounted(() => {
  updateColumnCount()
  setupResizeObserver()
  setupSentinelObserver()
  window.addEventListener('scroll', handleScroll, { passive: true })
  
  fetchImages(true).then(() => {
    loadInitialData()
  })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  if (sentinelObserver) {
    sentinelObserver.disconnect()
  }
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
  if (requestId) {
    cancelAnimationFrame(requestId)
  }
  cancelAllRequests()
})
</script>

<style scoped>
.waterfall-gallery {
  max-width: 1600px;
  margin: 0 auto;
  padding: 24px;
}

.gallery-header {
  margin-bottom: 24px;
}

.gallery-header h2 {
  margin: 0 0 16px 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.category-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.category-filters button {
  padding: 8px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  background: #fff;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.category-filters button:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.category-filters button.active {
  background: #1890ff;
  border-color: #1890ff;
  color: #fff;
}

.category-filters button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 8px;
  margin-bottom: 16px;
  color: #ff4d4f;
}

.error-message button {
  padding: 4px 12px;
  border: none;
  border-radius: 4px;
  background: #1890ff;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}

.waterfall-container {
  width: 100%;
}

.gallery-item {
  break-inside: avoid;
  page-break-inside: avoid;
}

.image-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.image-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.image-info {
  padding: 12px;
}

.image-title {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #999;
}

.image-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.load-more-section {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60px;
  padding: 24px;
}

.loading {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 14px;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f0f0f0;
  border-top: 2px solid #1890ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.no-more {
  color: #999;
  font-size: 14px;
}

.empty-state {
  color: #999;
  font-size: 14px;
}

.scroll-sentinel {
  height: 1px;
  margin-top: -1px;
  pointer-events: none;
}

@media (max-width: 768px) {
  .waterfall-gallery {
    padding: 16px;
  }

  .gallery-header h2 {
    font-size: 20px;
  }

  .category-filters button {
    padding: 6px 12px;
    font-size: 13px;
  }
}
</style>
