<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Movie } from '../../types/movie'
import { getFavorites, removeFavorite, clearAllFavorites } from '../../utils/movieStorage'
import MovieCard from '../../components/MovieCard.vue'
import MovieDetailModal from '../../components/MovieDetailModal.vue'

const favorites = ref<Movie[]>([])
const showDetail = ref(false)
const selectedMovie = ref<Movie | null>(null)

function loadFavorites() {
  favorites.value = getFavorites()
}

function openMovieDetail(movie: Movie) {
  selectedMovie.value = movie
  showDetail.value = true
}

function handleFavoriteChange(_movie: Movie, isFavorited: boolean) {
  if (!isFavorited) {
    loadFavorites()
  }
}

async function handleRemove(movie: Movie, e: Event) {
  e.stopPropagation()
  try {
    await ElMessageBox.confirm(`确定要删除《${movie.title}》吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    removeFavorite(movie.id)
    loadFavorites()
    ElMessage.success('已取消收藏')
  } catch {
  }
}

async function handleClearAll() {
  if (favorites.value.length === 0) {
    ElMessage.info('暂无收藏')
    return
  }
  try {
    await ElMessageBox.confirm('确定要清空所有收藏吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    clearAllFavorites()
    loadFavorites()
    ElMessage.success('已清空所有收藏')
  } catch {
  }
}

onMounted(() => {
  loadFavorites()
})
</script>

<template>
  <div class="favorites-page">
    <header class="page-header">
      <div class="header-content">
        <div class="header-left" @click="() => $router.push('/movie')">
          <span class="back-icon">←</span>
        </div>
        <h1 class="header-title">我的收藏</h1>
        <div class="header-right">
          <button v-if="favorites.length > 0" class="clear-btn" @click="handleClearAll">
            清空
          </button>
        </div>
      </div>
    </header>

    <main class="page-main">
      <div v-if="favorites.length === 0" class="empty-state">
        <div class="empty-icon">❤️</div>
        <p class="empty-text">暂无收藏</p>
        <p class="empty-hint">去发现喜欢的电影吧</p>
        <button class="go-btn" @click="() => $router.push('/movie')">
          去逛逛
        </button>
      </div>

      <div v-else class="favorites-list">
        <div class="list-header">
          <span class="list-count">共 {{ favorites.length }} 部收藏</span>
        </div>
        <div class="movie-grid">
          <div v-for="movie in favorites" :key="movie.id" class="movie-item">
            <MovieCard
              :movie="movie"
              @click="openMovieDetail"
              @favorite-change="handleFavoriteChange"
            />
            <button class="remove-btn" @click="handleRemove(movie, $event)">
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
.favorites-page {
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

.favorites-list {
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
