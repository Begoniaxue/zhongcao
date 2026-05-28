<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElDialog, ElMessage } from 'element-plus'
import type { Movie, MovieDetail } from '../types/movie'
import { getMovieDetail } from '../services/movieApi'
import { isFavorite, toggleFavorite, addHistory } from '../utils/movieStorage'

const props = defineProps<{
  visible: boolean
  movie: Movie | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const detail = ref<MovieDetail | null>(null)
const loading = ref(false)
const favorited = ref(false)

watch(() => [props.visible, props.movie] as const, async ([visible, movie]) => {
  if (visible && movie) {
    loading.value = true
    detail.value = null
    favorited.value = isFavorite(movie.id)
    addHistory(movie)
    try {
      const result = await getMovieDetail(movie.id)
      detail.value = result
    } finally {
      loading.value = false
    }
  }
}, { immediate: true })

function handleFavorite() {
  if (!props.movie) return
  favorited.value = toggleFavorite(props.movie)
  ElMessage.success(favorited.value ? '已收藏' : '已取消收藏')
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="emit('update:visible', $event)"
    class="movie-detail-dialog"
    width="90%"
    :fullscreen="false"
    align-center
    :close-on-click-modal="true"
  >
    <div class="movie-detail" v-if="movie">
      <div class="detail-header">
        <div class="detail-poster">
          <img :src="movie.poster" :alt="movie.title" />
        </div>
        <div class="detail-basic">
          <div class="detail-title-row">
            <h2 class="detail-title">{{ movie.title }}</h2>
            <button class="favorite-btn" :class="{ active: favorited }" @click="handleFavorite">
              <span class="heart-icon">{{ favorited ? '❤️' : '🤍' }}</span>
            </button>
          </div>
          <div class="detail-rating" v-if="detail?.imdbRating">
            <span class="rating-star">⭐</span>
            <span class="rating-score">{{ detail.imdbRating }}</span>
            <span class="rating-max">/10</span>
            <span class="rating-votes" v-if="detail?.imdbVotes">({{ detail.imdbVotes }} 投票)</span>
          </div>
          <div class="detail-meta">
            <span v-if="detail?.Released" class="meta-item">
              <span class="meta-label">上映时间：</span>
              <span class="meta-value">{{ detail.Released }}</span>
            </span>
            <span v-if="detail?.Runtime" class="meta-item">
              <span class="meta-label">时长：</span>
              <span class="meta-value">{{ detail.Runtime }}</span>
            </span>
            <span v-if="detail?.Genre" class="meta-item">
              <span class="meta-label">类型：</span>
              <span class="meta-value">{{ detail.Genre }}</span>
            </span>
          </div>
        </div>
      </div>

      <div class="detail-body" v-if="loading">
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <span>加载中...</span>
        </div>
      </div>

      <div class="detail-body" v-else-if="detail">
        <div class="detail-section">
          <h3 class="section-label">简介</h3>
          <p class="section-content">{{ detail.Plot || '暂无简介' }}</p>
        </div>

        <div class="detail-section" v-if="detail.Director && detail.Director !== 'N/A'">
          <h3 class="section-label">导演</h3>
          <p class="section-content">{{ detail.Director }}</p>
        </div>

        <div class="detail-section" v-if="detail.Writer && detail.Writer !== 'N/A'">
          <h3 class="section-label">编剧</h3>
          <p class="section-content">{{ detail.Writer }}</p>
        </div>

        <div class="detail-section" v-if="detail.Actors && detail.Actors !== 'N/A'">
          <h3 class="section-label">主演</h3>
          <p class="section-content">{{ detail.Actors }}</p>
        </div>

        <div class="detail-grid">
          <div class="detail-grid-item" v-if="detail.Language && detail.Language !== 'N/A'">
            <h4 class="grid-label">语言</h4>
            <span class="grid-value">{{ detail.Language }}</span>
          </div>
          <div class="detail-grid-item" v-if="detail.Country && detail.Country !== 'N/A'">
            <h4 class="grid-label">国家/地区</h4>
            <span class="grid-value">{{ detail.Country }}</span>
          </div>
          <div class="detail-grid-item" v-if="detail.Awards && detail.Awards !== 'N/A'">
            <h4 class="grid-label">奖项</h4>
            <span class="grid-value">{{ detail.Awards }}</span>
          </div>
        </div>
      </div>

      <div class="detail-body" v-else>
        <div class="error-state">
          <span>无法加载电影详情</span>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<style scoped>
.movie-detail-dialog :deep(.el-dialog__body) {
  padding: 0;
  max-height: 80vh;
  overflow-y: auto;
}

.movie-detail {
  background: white;
}

.detail-header {
  display: flex;
  gap: 20px;
  padding: 24px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: white;
}

.detail-poster {
  width: 120px;
  flex-shrink: 0;
}

.detail-poster img {
  width: 100%;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.detail-basic {
  flex: 1;
  min-width: 0;
}

.detail-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.detail-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
  color: white;
  flex: 1;
}

.detail-basic .favorite-btn {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.detail-basic .favorite-btn:active {
  transform: scale(0.9);
}

.detail-basic .favorite-btn.active {
  background: rgba(255, 107, 107, 0.9);
}

.detail-basic .heart-icon {
  font-size: 20px;
}

.detail-rating {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;
}

.rating-star {
  font-size: 18px;
}

.rating-score {
  font-size: 24px;
  font-weight: 700;
  color: #ffd700;
}

.rating-max {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.rating-votes {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-left: 8px;
}

.detail-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.meta-item {
  display: flex;
  align-items: center;
  font-size: 13px;
}

.meta-label {
  color: rgba(255, 255, 255, 0.6);
}

.meta-value {
  color: white;
}

.detail-body {
  padding: 20px 24px;
}

.loading-state,
.error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #999;
  font-size: 14px;
  gap: 12px;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #f0f0f0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.detail-section {
  margin-bottom: 20px;
}

.section-label {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin: 0 0 10px 0;
}

.section-content {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin: 0;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
  margin-top: 8px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.detail-grid-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.grid-label {
  font-size: 12px;
  color: #999;
  margin: 0;
  font-weight: 500;
}

.grid-value {
  font-size: 13px;
  color: #333;
}

@media (max-width: 768px) {
  .detail-header {
    flex-direction: column;
    padding: 16px;
  }

  .detail-poster {
    width: 100px;
    margin: 0 auto;
  }

  .detail-basic {
    text-align: center;
  }

  .detail-title-row {
    justify-content: center;
  }

  .detail-title {
    font-size: 18px;
  }

  .detail-basic .favorite-btn {
    width: 36px;
    height: 36px;
  }

  .detail-basic .heart-icon {
    font-size: 18px;
  }

  .detail-rating {
    justify-content: center;
  }

  .detail-meta {
    align-items: center;
  }

  .detail-body {
    padding: 16px;
  }

  .detail-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .detail-header {
    padding: 14px;
  }

  .detail-poster {
    width: 90px;
  }

  .detail-title {
    font-size: 17px;
  }

  .detail-basic .favorite-btn {
    width: 34px;
    height: 34px;
  }

  .detail-basic .heart-icon {
    font-size: 17px;
  }

  .detail-rating {
    margin-bottom: 12px;
  }

  .rating-score {
    font-size: 22px;
  }

  .rating-star {
    font-size: 16px;
  }

  .section-label {
    font-size: 14px;
  }

  .section-content {
    font-size: 13px;
  }
}

@media (max-width: 360px) {
  .detail-header {
    padding: 12px;
  }

  .detail-poster {
    width: 80px;
  }

  .detail-title {
    font-size: 16px;
  }

  .detail-basic .favorite-btn {
    width: 32px;
    height: 32px;
  }

  .detail-basic .heart-icon {
    font-size: 16px;
  }

  .rating-score {
    font-size: 20px;
  }

  .detail-body {
    padding: 14px;
  }

  .section-label {
    font-size: 13px;
    margin-bottom: 8px;
  }

  .section-content {
    font-size: 12px;
  }

  .grid-label {
    font-size: 11px;
  }

  .grid-value {
    font-size: 12px;
  }
}
</style>
