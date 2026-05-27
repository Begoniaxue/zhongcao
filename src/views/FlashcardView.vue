<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Rating,
  RATING_LABELS,
  SchedulingData,
  createInitialScheduling,
  calculateNextReview,
  isDueToday,
  getIntervalDescription
} from '../utils/sm2'

interface Flashcard {
  id: number
  front: string
  back: string
  scheduling: SchedulingData
}

const STORAGE_KEY = 'flashcard_progress'

const defaultFlashcards: Omit<Flashcard, 'scheduling'>[] = [
  { id: 1, front: 'Vue 3 中如何创建响应式数据？', back: '使用 ref() 或 reactive() 函数' },
  { id: 2, front: 'ref 和 reactive 的区别是什么？', back: 'ref 用于基本类型，reactive 用于对象/数组；ref 需要通过 .value 访问' },
  { id: 3, front: '什么是组合式 API (Composition API)？', back: 'Vue 3 中使用 setup 函数组织逻辑的方式，相比选项式 API 更灵活' },
  { id: 4, front: 'computed 和 watch 的区别？', back: 'computed 是计算属性，有缓存；watch 是监听器，用于响应数据变化执行副作用' },
  { id: 5, front: '如何在 Vue 3 中定义组件的 props？', back: '使用 defineProps() 宏，如：const props = defineProps<{ msg: string }>()' },
  { id: 6, front: 'v-model 在 Vue 3 中的变化？', back: '默认名为 modelValue，可自定义多个 v-model，修饰符通过 modelModifiers 访问' },
  { id: 7, front: '什么是 Teleport 组件？', back: '用于将组件的一部分 DOM 渲染到 DOM 树的其他位置，如模态框' },
  { id: 8, front: 'Suspense 组件的作用是什么？', back: '用于处理异步组件，显示加载状态，等待子组件就绪' },
  { id: 9, front: 'Pinia 是什么？', back: 'Vue 3 的官方状态管理库，替代 Vuex，提供更简洁的 API 和 TypeScript 支持' },
  { id: 10, front: 'defineExpose 的作用是什么？', back: '在 script setup 中暴露子组件的属性或方法给父组件访问' },
  { id: 11, front: 'CSS 中 transform-style: preserve-3d 的作用？', back: '让子元素保留在 3D 空间中，是实现 3D 翻转效果的关键属性' },
  { id: 12, front: '什么是 Vue 的单向数据流？', back: 'props 从父组件流向子组件，子组件不能直接修改 props，需通过 emit 通知父组件' },
  { id: 13, front: 'provide 和 inject 的使用场景？', back: '跨层级组件通信，祖先组件提供数据，后代组件注入使用' },
  { id: 14, front: 'Vue 3 的虚拟 DOM 有什么优化？', back: 'PatchFlag 标记动态节点，hoistStatic 提升静态节点，cacheHandlers 缓存事件处理函数' },
  { id: 15, front: '什么是作用域插槽 (Scoped Slots)？', back: '让父组件能够访问子组件的数据来自定义插槽内容的渲染方式' }
]

const flashcards = ref<Flashcard[]>([])
const isFlipped = ref(false)
const currentCardIndex = ref(0)
const reviewQueue = ref<Flashcard[]>([])
const sessionReviews = ref<{ card: Flashcard; rating: Rating; nextInterval: number }[]>([])
const isSessionComplete = ref(false)

const ratings = Object.values(Rating).filter(r => typeof r === 'number') as Rating[]

function loadProgress() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved) as Record<number, SchedulingData>
    }
  } catch (e) {
    console.error('Failed to load progress:', e)
  }
  return {}
}

function saveProgress() {
  const progress: Record<number, SchedulingData> = {}
  flashcards.value.forEach(card => {
    progress[card.id] = card.scheduling
  })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

function initializeFlashcards() {
  const savedProgress = loadProgress()
  flashcards.value = defaultFlashcards.map(card => ({
    ...card,
    scheduling: savedProgress[card.id] || createInitialScheduling()
  }))
}

function buildReviewQueue() {
  const dueCards = flashcards.value.filter(card => isDueToday(card.scheduling.dueDate))
  reviewQueue.value = shuffleArray(dueCards)
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

const currentCard = computed(() => reviewQueue.value[currentCardIndex.value] || null)
const totalCards = computed(() => flashcards.value.length)
const dueCount = computed(() => flashcards.value.filter(c => isDueToday(c.scheduling.dueDate)).length)
const masteredCount = computed(() => flashcards.value.filter(c => c.scheduling.repetition > 0 && c.scheduling.interval >= 7).length)

const progressPercent = computed(() => {
  if (reviewQueue.value.length === 0) return 0
  return Math.round((sessionReviews.value.length / reviewQueue.value.length) * 100)
})

function flipCard() {
  isFlipped.value = !isFlipped.value
}

function getNextIntervalPreview(rating: Rating): string {
  if (!currentCard.value) return ''
  const nextScheduling = calculateNextReview(currentCard.value.scheduling, rating)
  return getIntervalDescription(nextScheduling.interval)
}

function handleRating(rating: Rating) {
  if (!currentCard.value) return

  const card = currentCard.value
  const newScheduling = calculateNextReview(card.scheduling, rating)
  
  card.scheduling = newScheduling
  
  sessionReviews.value.push({
    card: { ...card },
    rating,
    nextInterval: newScheduling.interval
  })

  saveProgress()

  if (currentCardIndex.value >= reviewQueue.value.length - 1) {
    isSessionComplete.value = true
  } else {
    currentCardIndex.value++
    isFlipped.value = false
  }
}

function restart() {
  currentCardIndex.value = 0
  sessionReviews.value = []
  isSessionComplete.value = false
  isFlipped.value = false
  buildReviewQueue()
}

function forceReview() {
  currentCardIndex.value = 0
  sessionReviews.value = []
  isSessionComplete.value = false
  isFlipped.value = false
  reviewQueue.value = shuffleArray([...flashcards.value])
}

function resetAll() {
  localStorage.removeItem(STORAGE_KEY)
  initializeFlashcards()
  restart()
}

onMounted(() => {
  initializeFlashcards()
  buildReviewQueue()
})
</script>

<template>
  <div class="flashcard-view">
    <header class="app-header">
      <h1 class="app-title">🎴 抽认卡</h1>
      <button class="reset-btn" @click="resetAll" title="重置所有进度">
        🔄
      </button>
    </header>
    
    <main class="main-content">
      <div v-if="reviewQueue.length === 0" class="no-due-container">
        <div class="no-due-card">
          <div class="no-due-icon">🎉</div>
          <h2 class="no-due-title">今日学习完成！</h2>
          <p class="no-due-text">没有需要复习的卡片</p>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">{{ totalCards }}</div>
              <div class="stat-label">总卡片数</div>
            </div>
            <div class="stat-item">
              <div class="stat-value mastered">{{ masteredCount }}</div>
              <div class="stat-label">已掌握</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ dueCount }}</div>
              <div class="stat-label">待复习</div>
            </div>
          </div>
          <div class="action-buttons">
            <button class="restart-btn" @click="restart">
              <span class="restart-icon">🔄</span>
              检查到期卡片
            </button>
            <button class="force-btn" @click="forceReview">
              <span class="force-icon">📚</span>
              提前复习全部
            </button>
          </div>
        </div>
      </div>
      
      <div v-else-if="!isSessionComplete" class="flashcard-container">
        <div class="progress-header">
          <div class="progress-info">
            <span class="progress-text">
              本轮进度：{{ sessionReviews.length }} / {{ reviewQueue.length }}
            </span>
            <span class="progress-percent">{{ progressPercent }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
        </div>
        
        <div class="card-info">
          <span class="card-interval" v-if="currentCard">
            📅 上次间隔：{{ getIntervalDescription(currentCard.scheduling.interval) }}
          </span>
        </div>
        
        <div class="card-wrapper" @click="flipCard">
          <div class="card" :class="{ flipped: isFlipped }">
            <div class="card-face card-front">
              <div class="card-icon">❓</div>
              <p class="card-content">{{ currentCard?.front }}</p>
              <div class="card-hint">点击卡片查看答案</div>
            </div>
            <div class="card-face card-back">
              <div class="card-icon">💡</div>
              <p class="card-content">{{ currentCard?.back }}</p>
              <div class="card-hint">点击卡片返回问题</div>
            </div>
          </div>
        </div>
        
        <div v-if="isFlipped" class="card-actions">
          <button
            v-for="rating in ratings"
            :key="rating"
            class="action-btn"
            :class="`btn-${rating}`"
            @click.stop="handleRating(rating)"
          >
            <span class="btn-icon">{{ RATING_LABELS[rating].icon }}</span>
            <span class="btn-text">{{ RATING_LABELS[rating].label }}</span>
            <span class="btn-interval">{{ getNextIntervalPreview(rating) }}</span>
          </button>
        </div>
        
        <div v-else class="hint-text">
          👆 点击卡片查看答案后进行评分
        </div>
        
        <div class="card-counter">
          {{ currentCardIndex + 1 }} / {{ reviewQueue.length }}
        </div>
      </div>
      
      <div v-else class="finish-container">
        <div class="finish-card">
          <div class="finish-icon">🎉</div>
          <h2 class="finish-title">本轮学习完成！</h2>
          
          <div class="finish-stats">
            <div class="stat-item">
              <div class="stat-value reviewed">{{ sessionReviews.length }}</div>
              <div class="stat-label">已复习</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <div class="stat-value total">{{ totalCards }}</div>
              <div class="stat-label">总卡片</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <div class="stat-value mastered">{{ masteredCount }}</div>
              <div class="stat-label">已掌握</div>
            </div>
          </div>
          
          <div class="rating-summary">
            <h3 class="review-title">本轮评分统计</h3>
            <div class="rating-bars">
              <div v-for="rating in ratings" :key="rating" class="rating-bar-item">
                <span class="rating-label">
                  {{ RATING_LABELS[rating].icon }} {{ RATING_LABELS[rating].label }}
                </span>
                <div class="rating-bar-container">
                  <div
                    class="rating-bar-fill"
                    :class="`bar-${rating}`"
                    :style="{
                      width: `${sessionReviews.filter(r => r.rating === rating).length / Math.max(sessionReviews.length, 1) * 100}%`
                    }"
                  ></div>
                </div>
                <span class="rating-count">
                  {{ sessionReviews.filter(r => r.rating === rating).length }}
                </span>
              </div>
            </div>
          </div>
          
          <div class="review-section">
            <h3 class="review-title">本轮复习</h3>
            <div class="review-list">
              <div
                v-for="(item, index) in sessionReviews"
                :key="item.card.id"
                class="review-item"
                :class="`rating-${item.rating}`"
              >
                <span class="review-index">{{ index + 1 }}</span>
                <span class="review-front">{{ item.card.front }}</span>
                <span class="review-status">
                  {{ RATING_LABELS[item.rating].icon }}
                </span>
                <span class="review-next">{{ getIntervalDescription(item.nextInterval) }}</span>
              </div>
            </div>
          </div>
          
          <button class="restart-btn" @click="restart">
            <span class="restart-icon">🔄</span>
            开始新一轮
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.flashcard-view {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8f9ff 0%, #f0f2f8 100%);
  padding-bottom: 40px;
}

@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .flashcard-view {
    padding-bottom: calc(40px + env(safe-area-inset-bottom));
  }
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.app-title {
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.reset-btn {
  background: transparent;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.2s ease;
  min-width: 44px;
  min-height: 44px;
}

.reset-btn:hover {
  background: rgba(102, 126, 234, 0.1);
}

.main-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

.no-due-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 70vh;
}

.no-due-card {
  background: white;
  border-radius: 24px;
  padding: 48px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
}

.no-due-icon {
  font-size: 72px;
  margin-bottom: 16px;
}

.no-due-title {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 8px 0;
}

.no-due-text {
  font-size: 16px;
  color: #666;
  margin: 0 0 32px 0;
}

.stats-grid {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-bottom: 32px;
  padding: 24px;
  background: #f8f9ff;
  border-radius: 16px;
}

.flashcard-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 20px;
}

.progress-header {
  width: 100%;
  margin-bottom: 20px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-text {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
}

.progress-percent {
  font-size: 14px;
  color: #667eea;
  font-weight: 600;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e8eaf0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.card-info {
  margin-bottom: 16px;
}

.card-interval {
  font-size: 13px;
  color: #666;
  background: #f8f9ff;
  padding: 6px 12px;
  border-radius: 12px;
}

.card-wrapper {
  perspective: 1500px;
  margin-bottom: 32px;
  cursor: pointer;
}

.card {
  width: 500px;
  height: 320px;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.card.flipped {
  transform: rotateY(180deg);
}

.card-face {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 20px;
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.card-front {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
  border: 2px solid #e8eaf0;
}

.card-back {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transform: rotateY(180deg);
}

.card-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.card-content {
  font-size: 22px;
  font-weight: 600;
  line-height: 1.6;
  margin: 0;
}

.card-front .card-content {
  color: #1a1a2e;
}

.card-back .card-content {
  color: #ffffff;
}

.card-hint {
  margin-top: 24px;
  font-size: 13px;
  opacity: 0.6;
}

.card-front .card-hint {
  color: #999;
}

.card-back .card-hint {
  color: rgba(255, 255, 255, 0.8);
}

.card-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  justify-content: center;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 80px;
  min-height: auto;
}

.action-btn:hover {
  transform: translateY(-2px);
}

.action-btn:active {
  transform: translateY(0);
}

.btn-icon {
  font-size: 24px;
}

.btn-text {
  font-size: 14px;
}

.btn-interval {
  font-size: 11px;
  opacity: 0.8;
}

.btn-0 {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
}

.btn-1 {
  background: linear-gradient(135deg, #ffa502 0%, #ff7f50 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(255, 165, 2, 0.4);
}

.btn-2 {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(17, 153, 142, 0.4);
}

.btn-3 {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.hint-text {
  font-size: 14px;
  color: #999;
  margin-bottom: 20px;
}

.card-counter {
  font-size: 14px;
  color: #999;
  font-weight: 500;
}

.finish-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 70vh;
  padding-top: 20px;
}

.finish-card {
  background: white;
  border-radius: 24px;
  padding: 48px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  width: 100%;
}

.finish-icon {
  font-size: 72px;
  margin-bottom: 16px;
}

.finish-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 32px 0;
}

.finish-stats {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 32px;
  margin-bottom: 32px;
  padding: 24px;
  background: #f8f9ff;
  border-radius: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
}

.stat-value.reviewed {
  color: #667eea;
}

.stat-value.total {
  color: #1a1a2e;
}

.stat-value.mastered {
  color: #11998e;
}

.stat-label {
  font-size: 13px;
  color: #666;
}

.stat-divider {
  width: 1px;
  height: 48px;
  background: #e8eaf0;
}

.rating-summary {
  margin-bottom: 32px;
  text-align: left;
}

.review-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 16px 0;
}

.rating-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rating-bar-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rating-label {
  width: 80px;
  font-size: 13px;
  color: #666;
  flex-shrink: 0;
}

.rating-bar-container {
  flex: 1;
  height: 8px;
  background: #e8eaf0;
  border-radius: 4px;
  overflow: hidden;
}

.rating-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.rating-bar-fill.bar-0 {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
}

.rating-bar-fill.bar-1 {
  background: linear-gradient(135deg, #ffa502 0%, #ff7f50 100%);
}

.rating-bar-fill.bar-2 {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.rating-bar-fill.bar-3 {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.rating-count {
  width: 30px;
  font-size: 13px;
  color: #666;
  font-weight: 600;
  text-align: right;
}

.review-section {
  text-align: left;
  margin-bottom: 32px;
}

.review-list {
  max-height: 240px;
  overflow-y: auto;
  border: 1px solid #e8eaf0;
  border-radius: 12px;
}

.review-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
  transition: background 0.2s ease;
}

.review-item:last-child {
  border-bottom: none;
}

.review-item.rating-0 {
  background: rgba(255, 107, 107, 0.05);
}

.review-item.rating-1 {
  background: rgba(255, 165, 2, 0.05);
}

.review-item.rating-2 {
  background: rgba(17, 153, 142, 0.05);
}

.review-item.rating-3 {
  background: rgba(102, 126, 234, 0.05);
}

.review-index {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
  background: #e8eaf0;
  color: #666;
}

.review-front {
  flex: 1;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.review-status {
  font-size: 14px;
  flex-shrink: 0;
}

.review-next {
  font-size: 11px;
  color: #999;
  flex-shrink: 0;
}

.restart-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 16px 48px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
}

.restart-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.restart-btn:active {
  transform: translateY(0);
}

.restart-icon {
  font-size: 18px;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.force-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 32px;
  border: 2px solid #667eea;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  background: transparent;
  color: #667eea;
  transition: all 0.3s ease;
}

.force-btn:hover {
  background: rgba(102, 126, 234, 0.1);
  transform: translateY(-2px);
}

.force-btn:active {
  transform: translateY(0);
}

.force-icon {
  font-size: 16px;
}

@media (max-width: 768px) {
  .flashcard-view {
    padding-bottom: calc(24px + env(safe-area-inset-bottom));
  }

  .app-header {
    height: 56px;
    padding: 0 16px;
  }

  .app-title {
    font-size: 18px;
  }

  .main-content {
    padding: 16px;
  }

  .card {
    width: 100%;
    max-width: 340px;
    height: 280px;
  }

  .card-face {
    padding: 24px;
  }

  .card-icon {
    font-size: 36px;
    margin-bottom: 16px;
  }

  .card-content {
    font-size: 18px;
  }

  .card-actions {
    gap: 8px;
    max-width: 340px;
  }

  .action-btn {
    flex: 1;
    min-width: 0;
    padding: 10px 8px;
  }

  .btn-icon {
    font-size: 20px;
  }

  .btn-text {
    font-size: 12px;
  }

  .finish-card {
    padding: 32px 20px;
  }

  .finish-icon {
    font-size: 56px;
  }

  .finish-title {
    font-size: 24px;
  }

  .finish-stats {
    flex-direction: column;
    gap: 16px;
    padding: 20px;
  }

  .stat-divider {
    width: 80px;
    height: 1px;
  }

  .stat-value {
    font-size: 24px;
  }

  .no-due-card {
    padding: 32px 20px;
  }

  .stats-grid {
    gap: 16px;
    padding: 16px;
  }

  .action-buttons {
    width: 100%;
  }

  .restart-btn,
  .force-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
