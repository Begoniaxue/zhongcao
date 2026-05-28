<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { Movie } from '../../types/movie'
import { getHotMoviesList, getHotSeriesList, getTopRatedList, filterMovies, searchMovies, type FilterOptions } from '../../services/movieApi'
import { isFavorite, toggleFavorite } from '../../utils/movieStorage'
import MovieCard from '../../components/MovieCard.vue'
import MovieDetailModal from '../../components/MovieDetailModal.vue'

const router = useRouter()

const searchKeyword = ref('')
const searchInput = ref('')
const hotMovies = ref<Movie[]>([])
const hotSeries = ref<Movie[]>([])
const topRated = ref<Movie[]>([])
const searchResults = ref<Movie[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const currentPage = ref(1)
const totalResults = ref(0)
const showDetail = ref(false)
const selectedMovie = ref<Movie | null>(null)
const browseAllMovies = ref<Movie[]>([])
const isBrowseAllMode = ref(false)
const browseAllTotal = ref(0)
const loadingRankings = ref(false)

const showFilter = ref(false)
const filterOptions = ref<FilterOptions>({
  genre: 'all',
  yearRange: 'all',
  minRating: 'all',
  category: 'all'
})
const isFilterMode = ref(false)

const genreOptions = [
  { label: '全部类型', value: 'all' },
  { label: '动作', value: '动作' },
  { label: '喜剧', value: '喜剧' },
  { label: '科幻', value: '科幻' },
  { label: '悬疑', value: '悬疑' },
  { label: '动画', value: '动画' },
  { label: '爱情', value: '爱情' },
  { label: '剧情', value: '剧情' },
]

const yearOptions: { label: string; value: 'all' | '1year' | '3years' }[] = [
  { label: '全部年份', value: 'all' },
  { label: '近1年', value: '1year' },
  { label: '近3年', value: '3years' },
]

const ratingOptions: { label: string; value: 'all' | '7' | '8' }[] = [
  { label: '全部评分', value: 'all' },
  { label: '8分以上', value: '8' },
  { label: '7分以上', value: '7' },
]

const categoryOptions: { label: string; value: 'all' | 'movie' | 'series' }[] = [
  { label: '全部', value: 'all' },
  { label: '仅电影', value: 'movie' },
  { label: '仅剧集', value: 'series' },
]

const hasActiveFilters = computed(() => {
  return filterOptions.value.genre !== 'all' ||
    filterOptions.value.yearRange !== 'all' ||
    filterOptions.value.minRating !== 'all' ||
    filterOptions.value.category !== 'all'
})

const isSearchMode = computed(() => searchKeyword.value.trim() !== '')
const hasMoreResults = computed(() => {
  if (isFilterMode.value || isBrowseAllMode.value) {
    return browseAllMovies.value.length < browseAllTotal.value
  }
  if (!isSearchMode.value) return false
  return searchResults.value.length < totalResults.value
})

async function loadRankings() {
  loadingRankings.value = true
  try {
    const [movies, series, top] = await Promise.all([
      getHotMoviesList(),
      getHotSeriesList(),
      getTopRatedList()
    ])
    hotMovies.value = movies
    hotSeries.value = series
    topRated.value = top
  } catch (error) {
    ElMessage.error('加载榜单失败')
  } finally {
    loadingRankings.value = false
  }
}

async function loadFilteredMovies(page: number = 1) {
  loadingMore.value = page > 1
  
  try {
    const result = await filterMovies(filterOptions.value, page)
    if (page === 1) {
      browseAllMovies.value = result.Search
    } else {
      browseAllMovies.value.push(...result.Search)
    }
    browseAllTotal.value = parseInt(result.totalResults, 10)
  } catch (error) {
    ElMessage.error('加载电影失败')
  } finally {
    loadingMore.value = false
  }
}

async function applyFilters() {
  isFilterMode.value = true
  isBrowseAllMode.value = true
  searchKeyword.value = ''
  searchInput.value = ''
  searchResults.value = []
  showFilter.value = false
  currentPage.value = 1
  await loadFilteredMovies(1)
}

function clearFilters() {
  filterOptions.value = {
    genre: 'all',
    yearRange: 'all',
    minRating: 'all',
    category: 'all'
  }
  isFilterMode.value = false
  exitBrowseAllMode()
}

function enterBrowseAllMode() {
  isBrowseAllMode.value = true
  isFilterMode.value = false
  searchKeyword.value = ''
  searchInput.value = ''
  searchResults.value = []
  filterOptions.value = {
    genre: 'all',
    yearRange: 'all',
    minRating: 'all',
    category: 'all'
  }
  loadAllMovies(1)
}

function exitBrowseAllMode() {
  isBrowseAllMode.value = false
  isFilterMode.value = false
  browseAllMovies.value = []
  browseAllTotal.value = 0
}

async function loadAllMovies(page: number = 1) {
  loadingMore.value = page > 1
  
  try {
    const result = await searchMovies('', page)
    if (page === 1) {
      browseAllMovies.value = result.Search
    } else {
      browseAllMovies.value.push(...result.Search)
    }
    browseAllTotal.value = parseInt(result.totalResults, 10)
  } catch (error) {
    ElMessage.error('加载电影失败')
  } finally {
    loadingMore.value = false
  }
}

async function loadMore() {
  if (loadingMore.value || !hasMoreResults.value) return

  loadingMore.value = true
  
  if (isFilterMode.value) {
    const nextPage = Math.ceil(browseAllMovies.value.length / 20) + 1
    try {
      const result = await filterMovies(filterOptions.value, nextPage)
      browseAllMovies.value.push(...result.Search)
    } catch (error) {
      ElMessage.error('加载更多失败')
    } finally {
      loadingMore.value = false
    }
  } else if (isBrowseAllMode.value) {
    const nextPage = Math.ceil(browseAllMovies.value.length / 20) + 1
    try {
      const result = await searchMovies('', nextPage)
      browseAllMovies.value.push(...result.Search)
    } catch (error) {
      ElMessage.error('加载更多失败')
    } finally {
      loadingMore.value = false
    }
  } else {
    currentPage.value += 1
    try {
      const result = await searchMovies(searchKeyword.value, currentPage.value)
      searchResults.value.push(...result.Search)
    } catch (error) {
      ElMessage.error('加载更多失败')
      currentPage.value -= 1
    } finally {
      loadingMore.value = false
    }
  }
}

function handleSearch() {
  exitBrowseAllMode()
  isFilterMode.value = false
  handleSearchImpl()
}

async function handleSearchImpl() {
  const keyword = searchInput.value.trim()
  if (!keyword) {
    searchKeyword.value = ''
    searchResults.value = []
    return
  }

  searchKeyword.value = keyword
  currentPage.value = 1
  loading.value = true
  searchResults.value = []
  isFilterMode.value = false
  isBrowseAllMode.value = false

  try {
    const result = await searchMovies(keyword, 1)
    searchResults.value = result.Search
    totalResults.value = parseInt(result.totalResults, 10)

    if (result.Response === 'False') {
      ElMessage.info('未找到相关电影')
    }
  } catch (error) {
    ElMessage.error('搜索失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

function openMovieDetail(movie: Movie) {
  selectedMovie.value = movie
  showDetail.value = true
}

function clearSearch() {
  searchInput.value = ''
  searchKeyword.value = ''
  searchResults.value = []
  currentPage.value = 1
  totalResults.value = 0
  exitBrowseAllMode()
}

function goToFavorites() {
  router.push('/movie/favorites')
}

function goToHistory() {
  router.push('/movie/history')
}

function isMovieFavorite(movieId: string): boolean {
  return isFavorite(movieId)
}

function toggleMovieFavorite(movie: Movie) {
  toggleFavorite(movie)
  ElMessage.success(isFavorite(movie.id) ? '已收藏' : '已取消收藏')
}

onMounted(() => {
  loadRankings()
})
</script>

<template>
  <div class="movie-page">
    <header class="movie-header">
      <div class="header-content">
        <div class="header-left" @click="() => router.push('/')">
          <span class="back-icon">←</span>
        </div>
        <h1 class="header-title">电影</h1>
        <div class="header-right">
          <button class="icon-btn" @click="goToHistory" title="浏览历史">
            🕐
          </button>
          <button class="icon-btn" @click="goToFavorites" title="我的收藏">
            ❤️
          </button>
        </div>
      </div>
      <div class="search-section">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            v-model="searchInput"
            placeholder="搜索电影、类型、年份"
            class="search-input"
            @keyup.enter="handleSearch"
          />
          <button v-if="searchInput" class="clear-btn" @click="clearSearch">
            ✕
          </button>
          <button class="search-btn" @click="handleSearch">搜索</button>
        </div>
        <button class="filter-toggle" @click="showFilter = !showFilter" :class="{ active: showFilter || hasActiveFilters }">
          <span class="filter-icon">⚙️</span>
          <span v-if="hasActiveFilters" class="filter-dot"></span>
        </button>
      </div>
      
      <div v-if="showFilter" class="filter-panel">
        <div class="filter-section">
          <label class="filter-label">类型</label>
          <div class="filter-chips">
            <button
              v-for="option in genreOptions"
              :key="option.value"
              class="filter-chip"
              :class="{ active: filterOptions.genre === option.value }"
              @click="filterOptions.genre = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
        <div class="filter-section">
          <label class="filter-label">年份</label>
          <div class="filter-chips">
            <button
              v-for="option in yearOptions"
              :key="option.value"
              class="filter-chip"
              :class="{ active: filterOptions.yearRange === option.value }"
              @click="filterOptions.yearRange = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
        <div class="filter-section">
          <label class="filter-label">评分</label>
          <div class="filter-chips">
            <button
              v-for="option in ratingOptions"
              :key="option.value"
              class="filter-chip"
              :class="{ active: filterOptions.minRating === option.value }"
              @click="filterOptions.minRating = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
        <div class="filter-section">
          <label class="filter-label">类别</label>
          <div class="filter-chips">
            <button
              v-for="option in categoryOptions"
              :key="option.value"
              class="filter-chip"
              :class="{ active: filterOptions.category === option.value }"
              @click="filterOptions.category = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
        <div class="filter-actions">
          <button class="filter-clear" @click="clearFilters">清空筛选</button>
          <button class="filter-apply" @click="applyFilters">应用筛选</button>
        </div>
      </div>
    </header>

    <main class="movie-main">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <span>加载中...</span>
      </div>

      <template v-else-if="isSearchMode">
        <section class="section search-section">
          <div class="section-header">
            <h2 class="section-title">
              🔍 搜索结果："{{ searchKeyword }}"
              <span class="result-count">({{ totalResults }} 部)</span>
            </h2>
          </div>

          <div v-if="searchResults.length === 0" class="no-results">
            <div class="no-results-icon">🎬</div>
            <p class="no-results-text">未找到相关电影</p>
            <p class="no-results-hint">试试其他关键词吧</p>
          </div>

          <div v-else class="search-list">
            <div
              v-for="movie in searchResults"
              :key="movie.id"
              class="search-item"
              @click="openMovieDetail(movie)"
            >
              <img :src="movie.poster" :alt="movie.title" class="search-poster" />
              <div class="search-info">
                <h3 class="search-title">{{ movie.title }}</h3>
                <div class="search-meta">
                  <span class="search-year">{{ movie.year }}</span>
                  <span class="search-rating" v-if="movie.rating">⭐ {{ movie.rating }}</span>
                </div>
                <div class="search-genres" v-if="movie.genre">
                  <span class="genre-tag">{{ movie.genre.split('/')[0].trim() }}</span>
                </div>
              </div>
              <button class="search-favorite" :class="{ active: isMovieFavorite(movie.id) }" @click.stop="toggleMovieFavorite(movie)">
                {{ isMovieFavorite(movie.id) ? '❤️' : '🤍' }}
              </button>
            </div>
          </div>

          <div v-if="hasMoreResults" class="load-more" @click="loadMore">
            <span v-if="!loadingMore">加载更多</span>
            <span v-else class="loading-more">
              <span class="loading-spinner small"></span>
              加载中...
            </span>
          </div>
        </section>
      </template>

      <template v-else-if="isFilterMode">
        <section class="section">
          <div class="section-header">
            <h2 class="section-title">
              🔍 筛选结果
              <span class="result-count">({{ browseAllTotal }} 部)</span>
            </h2>
            <div class="back-btn" @click="clearFilters">
              清空筛选
            </div>
          </div>
          <div class="movie-grid">
            <MovieCard
              v-for="movie in browseAllMovies"
              :key="movie.id"
              :movie="movie"
              @click="openMovieDetail"
            />
          </div>
          <div v-if="hasMoreResults" class="load-more" @click="loadMore">
            <span v-if="!loadingMore">加载更多</span>
            <span v-else class="loading-more">
              <span class="loading-spinner small"></span>
              加载中...
            </span>
          </div>
          <div v-else class="no-more" v-if="browseAllMovies.length > 0">
            已加载全部 {{ browseAllTotal }} 部影片
          </div>
        </section>
      </template>

      <template v-else-if="isBrowseAllMode">
        <section class="section">
          <div class="section-header">
            <h2 class="section-title">
              📚 全部电影
              <span class="result-count">({{ browseAllTotal }} 部)</span>
            </h2>
            <div class="back-btn" @click="exitBrowseAllMode">
              ← 返回
            </div>
          </div>
          <div class="movie-grid">
            <MovieCard
              v-for="movie in browseAllMovies"
              :key="movie.id"
              :movie="movie"
              @click="openMovieDetail"
            />
          </div>
          <div v-if="hasMoreResults" class="load-more" @click="loadMore">
            <span v-if="!loadingMore">加载更多</span>
            <span v-else class="loading-more">
              <span class="loading-spinner small"></span>
              加载中...
            </span>
          </div>
          <div v-else class="no-more" v-if="browseAllMovies.length > 0">
            已加载全部 {{ browseAllTotal }} 部电影
          </div>
        </section>
      </template>

      <template v-else>
        <div v-if="loadingRankings" class="loading-state">
          <div class="loading-spinner"></div>
          <span>加载中...</span>
        </div>
        
        <template v-else>
          <section class="ranking-section">
            <div class="section-header">
              <h2 class="section-title">🔥 热门电影榜</h2>
              <div class="browse-all-btn" @click="enterBrowseAllMode">
                浏览全部 →
              </div>
            </div>
            <div class="ranking-grid">
              <MovieCard
                v-for="(movie, index) in hotMovies.slice(0, 6)"
                :key="movie.id"
                :movie="movie"
                :show-rank="true"
                :rank="index + 1"
                @click="openMovieDetail"
              />
            </div>
          </section>

          <section class="ranking-section">
            <div class="section-header">
              <h2 class="section-title">📺 热门剧集榜</h2>
            </div>
            <div class="ranking-grid">
              <MovieCard
                v-for="(movie, index) in hotSeries.slice(0, 6)"
                :key="movie.id"
                :movie="movie"
                :show-rank="true"
                :rank="index + 1"
                @click="openMovieDetail"
              />
            </div>
          </section>

          <section class="ranking-section">
            <div class="section-header">
              <h2 class="section-title">🏆 高分口碑榜</h2>
            </div>
            <div class="ranking-grid">
              <MovieCard
                v-for="(movie, index) in topRated.slice(0, 6)"
                :key="movie.id"
                :movie="movie"
                :show-rank="true"
                :rank="index + 1"
                @click="openMovieDetail"
              />
            </div>
          </section>
        </template>
      </template>
    </main>

    <MovieDetailModal
      v-model:visible="showDetail"
      :movie="selectedMovie"
    />
  </div>
</template>

<style scoped>
.movie-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8f9ff 0%, #f0f2f8 100%);
}

.movie-header {
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
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  transition: background 0.2s ease;
}

.icon-btn:active {
  background: rgba(0, 0, 0, 0.05);
}

.search-section {
  padding: 0 16px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
  min-width: 0;
}

.search-box {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f5f5f5;
  padding: 6px 10px;
  border-radius: 24px;
  transition: all 0.2s ease;
  min-width: 0;
}

.search-box:focus-within {
  background: #fff;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.3);
}

.search-icon {
  font-size: 14px;
  color: #999;
  flex-shrink: 0;
}

.search-input {
  flex: 1 1 auto;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  color: #333;
  min-width: 0;
  width: 0;
}

.search-input::placeholder {
  color: #999;
}

.clear-btn {
  background: transparent;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 2px;
  font-size: 12px;
  min-width: 20px;
  min-height: 20px;
  border-radius: 50%;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.clear-btn:active {
  background: rgba(0, 0, 0, 0.1);
}

.search-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  padding: 5px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  min-height: 28px;
  transition: opacity 0.2s ease;
  flex-shrink: 0;
  white-space: nowrap;
}

.search-btn:active {
  opacity: 0.8;
}

.filter-toggle {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.filter-toggle.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.filter-icon {
  font-size: 18px;
}

.filter-dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  background: #ff6b6b;
  border-radius: 50%;
}

.filter-panel {
  padding: 12px 16px 16px;
  background: white;
  border-top: 1px solid #f0f0f0;
}

.filter-section {
  margin-bottom: 16px;
}

.filter-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-chip {
  padding: 6px 14px;
  background: #f5f5f5;
  border: none;
  border-radius: 16px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-chip.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.filter-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.filter-clear {
  flex: 1;
  padding: 10px;
  background: #f5f5f5;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-apply {
  flex: 1;
  padding: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-clear:active,
.filter-apply:active {
  opacity: 0.8;
}

.movie-main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 16px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: #999;
  font-size: 14px;
  gap: 16px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f0f0f0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-spinner.small {
  width: 16px;
  height: 16px;
  border-width: 2px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.section {
  margin-bottom: 32px;
}

.ranking-section {
  margin-bottom: 28px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
}

.result-count {
  font-size: 13px;
  font-weight: 400;
  color: #999;
  margin-left: 6px;
}

.ranking-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.movie-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.search-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.2s ease;
}

.search-item:active {
  transform: scale(0.98);
  background: #f8f9ff;
}

.search-poster {
  width: 60px;
  height: 90px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}

.search-info {
  flex: 1;
  min-width: 0;
}

.search-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin: 0 0 6px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.search-year {
  font-size: 12px;
  color: #999;
}

.search-rating {
  font-size: 12px;
  color: #ff9500;
  font-weight: 600;
}

.search-genres {
  display: flex;
  gap: 6px;
}

.search-genres .genre-tag {
  font-size: 10px;
  padding: 2px 8px;
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  border-radius: 4px;
}

.search-favorite {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.2s ease;
  flex-shrink: 0;
  padding: 0;
  line-height: 1;
}

.search-favorite:active {
  transform: scale(0.9);
}

.search-favorite.active {
  background: rgba(255, 107, 107, 0.15);
}

.search-section {
  display: flex;
  flex-direction: column;
}

.search-section .section-header {
  order: 1;
}

.search-section .no-results,
.search-section .search-list,
.search-section .load-more {
  order: 2;
}

.no-results {
  text-align: center;
  padding: 60px 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  width: 100%;
  box-sizing: border-box;
}

.no-results-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
  line-height: 1;
}

.no-results-text {
  font-size: 16px;
  color: #666;
  margin: 0 0 6px 0;
  line-height: 1.5;
}

.no-results-hint {
  font-size: 13px;
  color: #999;
  margin: 0;
  line-height: 1.5;
}

.load-more {
  text-align: center;
  padding: 20px;
  margin-top: 16px;
  color: #667eea;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.load-more:active {
  opacity: 0.7;
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #999;
}

.back-btn {
  font-size: 13px;
  color: #667eea;
  cursor: pointer;
  padding: 4px 12px;
  border-radius: 16px;
  background: rgba(102, 126, 234, 0.1);
  transition: all 0.2s ease;
}

.back-btn:active {
  background: rgba(102, 126, 234, 0.2);
}

.browse-all-btn {
  font-size: 13px;
  color: #667eea;
  cursor: pointer;
  padding: 6px 14px;
  border-radius: 16px;
  background: rgba(102, 126, 234, 0.1);
  transition: all 0.2s ease;
  font-weight: 500;
}

.browse-all-btn:active {
  background: rgba(102, 126, 234, 0.2);
}

.no-more {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 13px;
}

@media (max-width: 480px) {
  .movie-grid,
  .ranking-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .search-section {
    padding: 0 12px 10px;
    gap: 6px;
  }

  .search-box {
    padding: 5px 8px;
    gap: 4px;
  }

  .search-icon {
    font-size: 13px;
  }

  .search-input {
    font-size: 13px;
  }

  .clear-btn {
    font-size: 11px;
    min-width: 18px;
    min-height: 18px;
  }

  .search-btn {
    padding: 4px 10px;
    font-size: 11px;
    min-height: 26px;
  }

  .filter-toggle {
    width: 38px;
    height: 38px;
  }

  .filter-icon {
    font-size: 16px;
  }

  .search-list {
    gap: 10px;
  }

  .search-item {
    padding: 10px;
    gap: 10px;
  }

  .search-poster {
    width: 54px;
    height: 81px;
  }

  .search-title {
    font-size: 14px;
  }

  .search-year,
  .search-rating {
    font-size: 11px;
  }

  .search-genres .genre-tag {
    font-size: 9px;
    padding: 2px 6px;
  }

  .search-favorite {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }

  .section-title {
    font-size: 16px;
  }

  .filter-panel {
    padding: 10px 12px 12px;
  }

  .filter-section {
    margin-bottom: 12px;
  }

  .filter-label {
    font-size: 12px;
    margin-bottom: 6px;
  }

  .filter-chips {
    gap: 6px;
  }

  .filter-chip {
    padding: 5px 12px;
    font-size: 12px;
  }

  .filter-actions {
    gap: 8px;
    margin-top: 12px;
  }

  .filter-clear,
  .filter-apply {
    padding: 10px;
    font-size: 13px;
  }

  .no-results {
    padding: 40px 16px;
  }

  .no-results-icon {
    font-size: 40px;
  }

  .no-results-text {
    font-size: 15px;
  }

  .no-results-hint {
    font-size: 12px;
  }

  .search-section {
    padding: 0 12px 10px;
  }

  .movie-main {
    padding: 12px;
  }

  .section {
    margin-bottom: 24px;
  }

  .ranking-section {
    margin-bottom: 20px;
  }
}

@media (max-width: 360px) {
  .movie-grid,
  .ranking-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .section-title {
    font-size: 15px;
  }

  .search-btn {
    padding: 6px 12px;
    font-size: 12px;
  }

  .filter-toggle {
    width: 40px;
    height: 40px;
  }

  .icon-btn {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }
}

@media (min-width: 768px) {
  .movie-main {
    padding: 24px;
  }

  .movie-grid,
  .ranking-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }

  .section-title {
    font-size: 20px;
  }
}

@media (min-width: 1024px) {
  .movie-grid,
  .ranking-grid {
    grid-template-columns: repeat(6, 1fr);
    gap: 24px;
  }
}
</style>
