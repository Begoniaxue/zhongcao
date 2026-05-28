<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { HistoryItem } from '../../utils/movieStorage'
import { getHistory, removeHistory, clearAllHistory } from '../../utils/movieStorage'
import MovieCard from '../../components/MovieCard.vue'
import MovieDetailModal from '../../components/MovieDetailModal.vue'

const history = ref<HistoryItem[]>([])
const showDetail = ref(false)
const selectedMovie = ref<HistoryItem | null>(null)

function loadHistory() {
  history.value = getHistory()
}

function openMovieDetail(movie: HistoryItem) {
  selectedMovie.value = movie
  showDetail.value = true
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

async function handleRemove(movie: HistoryItem, e: Event) {
  e.stopPropagation()
  try {
    await ElMessageBox.confirm(`确定要删除《${movie.title}》的浏览记录吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    removeHistory(movie.id)
    loadHistory()
    ElMessage.success('已删除')
  } catch {
  }
}

async function handleClearAll() {
  if (history.value.length === 0) {
    ElMessage.info('暂无浏览记录')
    return
  }
  try {
    await ElMessageBox.confirm('确定要清空所有浏览记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    clearAllHistory()
    loadHistory()
    ElMessage.success('已清空所有浏览记录')
  } catch {
  }
}

onMounted(() => {
  loadHistory()
})
</script>

<template>
  <div class="history-page">
    <header class="page-header">
      <div class="header-content">
        <div class="header-left" @click="() => $router.push('/movie')">
          <span class="back-icon">←</span>
        </div>
        <h1 class="header-title">浏览历史</h1>
        <div class="header-right">
          <button v-if="history.length > 0" class="clear-btn" @click="handleClearAll">
            清空
          </button>
        </div>
      </div>
    </header>

    <main class="page-main">
      <div v-if="history.length === 0" class="empty-state">
        <div class="empty-icon">🕐</div>
        <p class="empty-text">暂无浏览记录</p>
        <p class="empty-hint">去发现更多精彩内容吧</p>
        <button class="go-btn" @click="() => $router.push('/movie')">
          去逛逛
        </button>
      </div>

      <div v-else class="history-list">
        <div class="list-header">
          <span class="list-count">共 {{ history.length }} 条记录（最多保存50条）</span>
        </div>
        <div class="movie-grid">
          <div v-for="item in history" :key="item.id" class="movie-item">
            <div class="time-tag">{{ formatTime(item.browseTime) }}</div>
            <MovieCard
              :movie="item"
              @click="openMovieDetail(item)"
            />
            <button class="remove-btn" @click="handleRemove(item, $event)">
              删除
            </button>
          </div>
        </div>
      </div>
    </main>

    <MovieDetailModal
      v-model:visible="showDetail"
      :movie="selectedMovie"
    />
  </div>
</template>

<style scoped>
.history-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8f9ff 0%, #f0f2f8 100%);
}

.page-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  height: 56px;
}

.header-left {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
  transition: background 0.2s ease;
}

.header-left:active {
  background: rgba(0, 0, 0, 0.05);
}

.back-icon {
  font-size: 20px;
  color: #333;
}

.header-title {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
}

.header-right {
  min-width: 44px;
  display: flex;
  justify-content: flex-end;
}

.clear-btn {
  padding: 6px 14px;
  background: rgba(255, 107, 107, 0.1);
  border: none;
  border-radius: 16px;
  color: #ff6b6b;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-btn:active {
  background: rgba(255, 107, 107, 0.2);
}

.page-main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 16px;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 18px;
  color: #333;
  margin: 0 0 8px 0;
  font-weight: 600;
}

.empty-hint {
  font-size: 14px;
  color: #999;
  margin: 0 0 24px 0;
}

.go-btn {
  padding: 12px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 24px;
  color: white;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.go-btn:active {
  opacity: 0.8;
}

.history-list {
  padding-top: 8px;
}

.list-header {
  margin-bottom: 16px;
}

.list-count {
  font-size: 14px;
  color: #999;
}

.movie-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.movie-item {
  position: relative;
}

.time-tag {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 12px;
  color: white;
  font-size: 10px;
  z-index: 10;
}

.remove-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 10px;
  background: rgba(255, 107, 107, 0.9);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 11px;
  cursor: pointer;
  z-index: 10;
  transition: all 0.2s ease;
}

.remove-btn:active {
  transform: scale(0.95);
  background: rgba(255, 107, 107, 1);
}

.empty-state {
  width: 100%;
  box-sizing: border-box;
}

.empty-icon {
  line-height: 1;
}

.empty-text,
.empty-hint {
  line-height: 1.5;
}

@media (max-width: 480px) {
  .page-main {
    padding: 12px;
  }

  .movie-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .remove-btn {
    padding: 3px 8px;
    font-size: 10px;
    top: 6px;
    right: 6px;
  }

  .time-tag {
    padding: 3px 6px;
    font-size: 9px;
    top: 6px;
    left: 6px;
  }

  .empty-state {
    padding: 60px 16px;
  }

  .empty-icon {
    font-size: 56px;
  }

  .empty-text {
    font-size: 16px;
  }

  .empty-hint {
    font-size: 13px;
  }

  .go-btn {
    padding: 10px 28px;
    font-size: 14px;
  }

  .list-count {
    font-size: 13px;
  }

  .list-header {
    margin-bottom: 12px;
  }

  .clear-btn {
    padding: 5px 12px;
    font-size: 12px;
  }
}

@media (max-width: 360px) {
  .movie-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .remove-btn {
    padding: 2px 6px;
    font-size: 9px;
  }

  .time-tag {
    padding: 2px 5px;
    font-size: 8px;
  }

  .empty-state {
    padding: 50px 12px;
  }

  .empty-icon {
    font-size: 48px;
  }

  .empty-text {
    font-size: 15px;
  }

  .empty-hint {
    font-size: 12px;
  }

  .section-title {
    font-size: 16px;
  }
}

@media (min-width: 768px) {
  .page-main {
    padding: 24px;
  }

  .movie-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }
}

@media (min-width: 1024px) {
  .movie-grid {
    grid-template-columns: repeat(6, 1fr);
    gap: 24px;
  }
}
</style>
