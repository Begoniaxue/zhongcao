<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { Movie, Showtime } from '../../types/movie'
import { getMovieDetail } from '../../services/movieApi'

const route = useRoute()
const router = useRouter()

const movieId = computed(() => route.params.id as string)
const movie = ref<Movie | null>(null)
const loading = ref(false)
const notFound = ref(false)

const selectedDate = ref('')
const dates = ref<string[]>([])

const timeFilter = ref('all')
const hallTypeFilter = ref('all')
const selectedShowtimeId = ref('')

const showtimes = ref<Showtime[]>([])

const timeOptions = [
  { label: '全部时段', value: 'all' },
  { label: '上午(09:00-12:00)', value: 'morning' },
  { label: '下午(12:00-18:00)', value: 'afternoon' },
  { label: '晚上(18:00-24:00)', value: 'evening' }
]

const hallTypeOptions = [
  { label: '全部厅型', value: 'all' },
  { label: '巨幕厅', value: 'IMAX' },
  { label: '杜比厅', value: 'Dolby' },
  { label: '普通厅', value: 'Normal' }
]

const filteredShowtimes = computed(() => {
  const isToday = selectedDate.value.includes('今天')
  const now = new Date()
  const currentHour = now.getHours()
  const currentMin = now.getMinutes()

  return showtimes.value.filter(st => {
    if (isToday) {
      const [endH, endM] = st.endTime.split(':').map(Number)
      if (endH < currentHour || (endH === currentHour && endM <= currentMin)) return false
    }
    if (timeFilter.value !== 'all') {
      const hour = parseInt(st.startTime.split(':')[0])
      if (timeFilter.value === 'morning' && (hour < 9 || hour >= 12)) return false
      if (timeFilter.value === 'afternoon' && (hour < 12 || hour >= 18)) return false
      if (timeFilter.value === 'evening' && (hour < 18 || hour >= 24)) return false
    }
    if (hallTypeFilter.value !== 'all' && st.hallType !== hallTypeFilter.value) return false
    return true
  })
})

const groupedShowtimes = computed(() => {
  const groups: Record<string, Showtime[]> = {}
  filteredShowtimes.value.forEach(st => {
    if (!groups[st.cinemaId]) {
      groups[st.cinemaId] = []
    }
    groups[st.cinemaId].push(st)
  })
  return groups
})

const cinemaNames = computed(() => {
  const names: Record<string, string> = {}
  showtimes.value.forEach(st => {
    names[st.cinemaId] = st.cinemaName
  })
  return names
})

function generateDates() {
  const result: string[] = []
  const today = new Date()
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekday = i === 0 ? '今天' : i === 1 ? '明天' : weekdays[date.getDay()]
    result.push(`${month}月${day}日 ${weekday}`)
  }
  return result
}

function generateMockShowtimes(): Showtime[] {
  const cinemas = [
    { id: 'c1', name: '万达影城（CBD店）' },
    { id: 'c2', name: 'CGV影城（万象城店）' },
    { id: 'c3', name: '金逸影城（大悦城店）' },
    { id: 'c4', name: '博纳国际影城（悠唐店）' }
  ]
  const halls = [
    { name: '1号巨幕厅', type: 'IMAX' as const },
    { name: '2号杜比厅', type: 'Dolby' as const },
    { name: '3号普通厅', type: 'Normal' as const },
    { name: '4号普通厅', type: 'Normal' as const }
  ]
  const times = ['09:30', '11:20', '13:10', '15:00', '17:20', '19:10', '21:00', '22:30']
  
  const result: Showtime[] = []
  let id = 1
  
  cinemas.forEach(cinema => {
    halls.forEach(hall => {
      times.forEach(time => {
        if (Math.random() > 0.3) {
          const startHour = parseInt(time.split(':')[0])
          const startMin = parseInt(time.split(':')[1])
          const duration = 128
          const endHour = Math.floor((startHour * 60 + startMin + duration) / 60)
          const endMin = (startHour * 60 + startMin + duration) % 60
          
          result.push({
            id: `st${id++}`,
            cinemaId: cinema.id,
            cinemaName: cinema.name,
            date: selectedDate.value,
            startTime: time,
            endTime: `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`,
            hallName: hall.name,
            hallType: hall.type,
            remainingSeats: Math.floor(Math.random() * 150) + 20,
            price: hall.type === 'IMAX' ? 89.9 : hall.type === 'Dolby' ? 69.5 : 49.9
          })
        }
      })
    })
  })
  
  return result
}

function loadShowtimes() {
  showtimes.value = generateMockShowtimes()
}

function selectDate(date: string) {
  selectedDate.value = date
  selectedShowtimeId.value = ''
  loadShowtimes()
}

function selectShowtime(showtime: Showtime) {
  selectedShowtimeId.value = showtime.id
  ElMessage.success(`已选择 ${showtime.cinemaName} ${showtime.startTime} 场次`)
}

function goToSeatSelection(showtime: Showtime) {
  const showtimeStr = encodeURIComponent(JSON.stringify(showtime))
  const movieStr = encodeURIComponent(JSON.stringify(movie.value))
  router.push({
    path: '/movie/seat-selection',
    query: {
      showtime: showtimeStr,
      movie: movieStr
    }
  })
}

function getHallTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'IMAX': '巨幕',
    'Dolby': '杜比',
    'Normal': '普通'
  }
  return labels[type] || type
}

onMounted(async () => {
  dates.value = generateDates()
  selectedDate.value = dates.value[0]

  const cached = sessionStorage.getItem(`movie_${movieId.value}`)
  if (cached) {
    try {
      movie.value = JSON.parse(cached) as Movie
      loadShowtimes()
      return
    } catch {}
  }

  loading.value = true
  try {
    const data = await getMovieDetail(movieId.value)
    if (data) {
      movie.value = data
      loadShowtimes()
    } else {
      notFound.value = true
    }
  } catch (error) {
    notFound.value = true
    ElMessage.error('加载电影详情失败')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="movie-detail-page" v-if="movie">
    <header class="detail-header">
      <div class="header-content">
        <button class="back-btn" @click="router.back()">
          <span class="back-icon">←</span>
        </button>
        <h1 class="header-title">电影详情</h1>
        <div class="header-right"></div>
      </div>
    </header>

    <main class="detail-main">
      <div class="movie-hero">
        <div class="movie-poster-wrapper">
          <img :src="movie.poster" :alt="movie.title" class="movie-poster" />
        </div>
        <div class="movie-basic-info">
          <h2 class="movie-title">{{ movie.title }}</h2>
          <div class="movie-rating" v-if="movie.rating || movie.imdbRating">
            <span class="rating-star">⭐</span>
            <span class="rating-value">{{ movie.rating || movie.imdbRating }}</span>
          </div>
          <div class="movie-meta-list">
            <div class="meta-item" v-if="movie.genre">
              <span class="meta-label">类型：</span>
              <span class="meta-value">{{ movie.genre }}</span>
            </div>
            <div class="meta-item" v-if="movie.runtime">
              <span class="meta-label">时长：</span>
              <span class="meta-value">{{ movie.runtime }}</span>
            </div>
            <div class="meta-item" v-if="movie.released">
              <span class="meta-label">上映：</span>
              <span class="meta-value">{{ movie.released }}</span>
            </div>
            <div class="meta-item" v-if="movie.country">
              <span class="meta-label">地区：</span>
              <span class="meta-value">{{ movie.country }}</span>
            </div>
          </div>
        </div>
      </div>

      <section class="info-section">
        <h3 class="section-title">剧情简介</h3>
        <p class="plot-text">{{ movie.plot || '暂无简介' }}</p>
      </section>

      <section class="info-section">
        <h3 class="section-title">演员阵容</h3>
        <div class="actors-list">
          <span class="actor-tag" v-for="(actor, index) in (movie.actors || '').split(',').slice(0, 6)" :key="index">
            {{ actor.trim() }}
          </span>
        </div>
      </section>

      <section class="schedule-section">
        <div class="section-header">
          <h3 class="section-title">选择场次</h3>
        </div>
        
        <div class="date-selector">
          <button
            v-for="date in dates"
            :key="date"
            class="date-btn"
            :class="{ active: selectedDate === date }"
            @click="selectDate(date)"
          >
            {{ date }}
          </button>
        </div>

        <div class="filter-bar">
          <div class="filter-group">
            <label class="filter-label">时段：</label>
            <select v-model="timeFilter" class="filter-select">
              <option v-for="opt in timeOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">厅型：</label>
            <select v-model="hallTypeFilter" class="filter-select">
              <option v-for="opt in hallTypeOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
        </div>

        <div class="showtimes-container">
          <div v-if="Object.keys(groupedShowtimes).length === 0" class="no-showtimes">
            <span class="no-showtimes-icon">🎬</span>
            <p>暂无符合条件的场次</p>
          </div>
          
          <div v-for="cinemaId in Object.keys(groupedShowtimes)" :key="cinemaId" class="cinema-group">
            <div class="cinema-name-row">
              <span class="cinema-name">{{ cinemaNames[cinemaId] }}</span>
            </div>
            <div class="showtime-grid">
              <div
                v-for="showtime in groupedShowtimes[cinemaId]"
                :key="showtime.id"
                class="showtime-card"
                :class="{ selected: selectedShowtimeId === showtime.id }"
                @click="selectShowtime(showtime)"
              >
                <div class="showtime-times">
                  <span class="start-time">{{ showtime.startTime }}</span>
                  <span class="time-separator">-</span>
                  <span class="end-time">{{ showtime.endTime }}</span>
                </div>
                <div class="showtime-info">
                  <span class="hall-name">{{ showtime.hallName }}</span>
                  <span class="hall-type-tag" :class="showtime.hallType.toLowerCase()">
                    {{ getHallTypeLabel(showtime.hallType) }}
                  </span>
                </div>
                <div class="showtime-bottom">
                  <span class="remaining-seats">剩余 {{ showtime.remainingSeats }} 座</span>
                  <span class="showtime-price">
                    <span class="price-symbol">¥</span>
                    <span class="price-value">{{ showtime.price.toFixed(2) }}</span>
                  </span>
                </div>
                <button
                  class="select-seat-btn"
                  @click.stop="goToSeatSelection(showtime)"
                >
                  选座
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
  
  <div v-else-if="notFound" class="not-found-container">
    <span class="not-found-icon">🎬</span>
    <p class="not-found-text">未找到该电影信息</p>
    <button class="not-found-btn" @click="router.back()">返回上一页</button>
  </div>

  <div v-else class="loading-container">
    <div class="loading-spinner"></div>
    <span>加载中...</span>
  </div>
</template>

<style scoped>
.movie-detail-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.detail-header {
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
  padding: 0 16px;
  height: 56px;
}

.back-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.2s ease;
}

.back-btn:active {
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
  width: 44px;
}

.detail-main {
  padding-bottom: 24px;
}

.movie-hero {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.movie-poster-wrapper {
  flex-shrink: 0;
}

.movie-poster {
  width: 120px;
  height: 180px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.movie-basic-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.movie-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 8px 0;
  line-height: 1.3;
}

.movie-rating {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
}

.rating-star {
  font-size: 16px;
}

.rating-value {
  font-size: 18px;
  font-weight: 700;
  color: #ffd700;
}

.movie-meta-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.meta-item {
  font-size: 13px;
  opacity: 0.95;
}

.meta-label {
  opacity: 0.8;
}

.info-section {
  background: white;
  margin: 12px 0;
  padding: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
}

.plot-text {
  font-size: 14px;
  color: #666;
  line-height: 1.8;
  margin: 0;
}

.actors-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.actor-tag {
  padding: 6px 12px;
  background: #f5f5f5;
  border-radius: 16px;
  font-size: 13px;
  color: #666;
}

.schedule-section {
  background: white;
  margin-top: 12px;
  padding: 16px 0;
}

.schedule-section .section-header {
  padding: 0 16px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.schedule-section .section-title {
  margin: 0;
}

.date-selector {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  overflow-x: auto;
  border-bottom: 1px solid #f0f0f0;
}

.date-selector::-webkit-scrollbar {
  display: none;
}

.date-btn {
  flex-shrink: 0;
  padding: 8px 16px;
  background: #f5f5f5;
  border: none;
  border-radius: 20px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.date-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.filter-bar {
  display: flex;
  gap: 16px;
  padding: 12px 16px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 13px;
  color: #666;
}

.filter-select {
  padding: 6px 10px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 13px;
  background: white;
  outline: none;
  cursor: pointer;
}

.filter-select:focus {
  border-color: #667eea;
}

.showtimes-container {
  padding: 16px;
}

.no-showtimes {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.no-showtimes-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

.cinema-group {
  margin-bottom: 24px;
}

.cinema-group:last-child {
  margin-bottom: 0;
}

.cinema-name-row {
  margin-bottom: 12px;
}

.cinema-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.showtime-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.showtime-card {
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.showtime-card:active {
  transform: scale(0.98);
}

.showtime-card.selected {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
  border: 2px solid #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15), 0 4px 12px rgba(102, 126, 234, 0.2);
  position: relative;
}

.showtime-card.selected::after {
  content: '✓';
  position: absolute;
  top: 6px;
  right: 8px;
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.showtime-card.selected .start-time {
  color: #667eea;
}

.showtime-card.selected .showtime-bottom {
  border-top-color: rgba(102, 126, 234, 0.15);
}

.select-seat-btn {
  position: absolute;
  top: 6px;
  right: 8px;
  padding: 4px 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 2;
}

.select-seat-btn:active {
  transform: scale(0.95);
}

.showtime-card.selected .select-seat-btn {
  top: 28px;
}

.showtime-times {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 8px;
}

.start-time {
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

.time-separator {
  font-size: 14px;
  color: #999;
}

.end-time {
  font-size: 14px;
  color: #666;
}

.showtime-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.hall-name {
  font-size: 13px;
  color: #666;
}

.hall-type-tag {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
}

.hall-type-tag.imax {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.hall-type-tag.dolby {
  background: rgba(118, 75, 162, 0.1);
  color: #764ba2;
}

.hall-type-tag.normal {
  background: rgba(102, 102, 102, 0.1);
  color: #666;
}

.showtime-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
  border-top: 1px solid #eee;
}

.remaining-seats {
  font-size: 12px;
  color: #999;
}

.showtime-price {
  display: flex;
  align-items: baseline;
}

.showtime-price .price-symbol {
  font-size: 12px;
  color: #ff6b6b;
}

.showtime-price .price-value {
  font-size: 16px;
  font-weight: 700;
  color: #ff6b6b;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  color: #999;
  font-size: 14px;
  gap: 16px;
}

.not-found-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 16px;
}

.not-found-icon {
  font-size: 64px;
  opacity: 0.5;
}

.not-found-text {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.not-found-btn {
  margin-top: 8px;
  padding: 10px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.not-found-btn:active {
  opacity: 0.8;
}

.loading-spinner {
  width: 32px;
  height: 32px;
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

@media (min-width: 768px) {
  .showtime-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .showtime-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

@media (min-width: 1024px) {
  .showtime-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
