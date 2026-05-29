<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Movie } from '../types/movie'
import { isFavorite, toggleFavorite } from '../utils/movieStorage'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  movie: Movie
  showRank?: boolean
  rank?: number
}>()

const emit = defineEmits<{
  click: [movie: Movie]
  favoriteChange: [movie: Movie, isFavorited: boolean]
}>()

const favorited = ref(false)

onMounted(() => {
  favorited.value = isFavorite(props.movie.id)
})

function handleFavorite(e: Event) {
  e.stopPropagation()
  favorited.value = toggleFavorite(props.movie)
  emit('favoriteChange', props.movie, favorited.value)
  ElMessage.success(favorited.value ? '已收藏' : '已取消收藏')
}
</script>

<template>
  <div class="movie-card" @click="$emit('click', movie)">
    <div class="movie-poster">
      <img :src="movie.poster" :alt="movie.title" class="poster-image" />
      <div v-if="showRank && rank" class="rank-badge" :class="rank <= 3 ? 'top-three' : ''">
        {{ rank }}
      </div>
      <div class="movie-rating" v-if="movie.rating">
        <span class="rating-icon">⭐</span>
        <span class="rating-value">{{ movie.rating }}</span>
      </div>
      <button class="favorite-btn" :class="{ active: favorited }" @click="handleFavorite">
        <span class="heart-icon">{{ favorited ? '❤️' : '🤍' }}</span>
      </button>
    </div>
    <div class="movie-info">
      <h3 class="movie-title">{{ movie.title }}</h3>
      <div class="movie-meta">
        <span class="movie-year">{{ movie.year }}</span>
        <span v-if="movie.genre" class="movie-genre">{{ movie.genre.split('/')[0].trim() }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.movie-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.movie-card:active {
  transform: scale(0.98);
}

.movie-poster {
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 3;
  background: #f0f0f0;
  overflow: hidden;
}

.rank-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 24px;
  height: 24px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  z-index: 2;
}

.rank-badge.top-three {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
}

.favorite-btn {
  position: absolute;
  bottom: 6px;
  right: 6px;
  width: 18px;
  height: 18px;
  min-width: 18px;
  min-height: 18px;
  background: rgba(255, 255, 255, 0.95);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 2;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  padding: 0;
}

.favorite-btn:active {
  transform: scale(0.9);
}

.favorite-btn.active {
  background: rgba(255, 107, 107, 0.95);
}

.heart-icon {
  font-size: 10px;
  line-height: 1;
}

@media (max-width: 480px) {
  .favorite-btn {
    width: 16px;
    height: 16px;
    min-width: 16px;
    min-height: 16px;
    bottom: 5px;
    right: 5px;
  }
  
  .heart-icon {
    font-size: 9px;
  }
  
  .rank-badge {
    width: 20px;
    height: 20px;
    font-size: 10px;
    top: 6px;
    left: 6px;
  }
  
  .movie-rating {
    padding: 3px 6px;
    font-size: 10px;
    top: 6px;
    right: 6px;
  }
  
  .movie-title {
    font-size: 12px;
  }
  
  .movie-year {
    font-size: 11px;
  }
  
  .movie-genre {
    font-size: 10px;
    padding: 1px 4px;
  }
  
  .movie-info {
    padding: 8px 10px;
  }
}

.poster-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.movie-rating {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: #ffd700;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}

.rating-icon {
  font-size: 12px;
}

.rating-value {
  color: white;
}

.movie-info {
  padding: 10px 12px;
}

.movie-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0 0 6px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.movie-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.movie-year {
  font-size: 12px;
  color: #999;
}

.movie-genre {
  font-size: 11px;
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

@media (min-width: 768px) {
  .movie-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  }

  .movie-title {
    font-size: 15px;
  }
}
</style>
