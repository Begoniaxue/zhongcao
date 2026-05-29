<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Movie, Showtime, Hall, SelectedSeat, SeatLockInfo, SeatStatus, Seat } from '../../types/movie'
import SeatSelector from '../../components/SeatSelector.vue'

const route = useRoute()
const router = useRouter()
const seatSelectorRef = ref<InstanceType<typeof SeatSelector> | null>(null)

const movie = ref<Movie | null>(null)
const showtime = ref<Showtime | null>(null)
const hall = ref<Hall | null>(null)

const selectedSeats = ref<SelectedSeat[]>([])
const lockInfo = ref<SeatLockInfo>({
  locked: false,
  lockedAt: 0,
  expireAt: 0,
  duration: 15 * 60 * 1000
})

const remainingTime = ref(0)
let countdownTimer: ReturnType<typeof setInterval> | null = null
const hallSeatsSnapshot = ref<Seat[][] | null>(null)

const serviceFeePerTicket = 3.5
const SEAT_SELECTION_STORAGE_KEY = 'seatSelectionState'

function roundPrice(value: number): number {
  return Math.round(value * 100) / 100
}

const priceDetail = computed(() => {
  const ticketCount = selectedSeats.value.length
  const ticketPrice = roundPrice(selectedSeats.value.reduce((sum, s) => roundPrice(sum + s.price), 0))
  const serviceFee = roundPrice(ticketCount * serviceFeePerTicket)
  return {
    ticketPrice,
    ticketCount,
    serviceFee,
    totalPrice: roundPrice(ticketPrice + serviceFee)
  }
})

function generateHallSeats(rows: number, cols: number, basePrice: number): Seat[][] {
  const seats: Seat[][] = []
  const soldRate = 0.35
  const cornerRows = [0, rows - 1]
  const cornerCols = [0, 1, cols - 2, cols - 1]
  
  for (let r = 0; r < rows; r++) {
    const rowSeats: Seat[] = []
    for (let c = 0; c < cols; c++) {
      let status: SeatStatus = 'available'
      
      const isCorner = cornerRows.includes(r) || cornerCols.includes(c)
      const isRandomSold = Math.random() < soldRate
      
      if (isRandomSold) {
        status = 'sold'
      } else if (isCorner && Math.random() < 0.5) {
        status = 'corner'
      }
      
      rowSeats.push({
        id: `seat-${r}-${c}`,
        row: r + 1,
        col: c + 1,
        status,
        price: basePrice
      })
    }
    seats.push(rowSeats)
  }
  
  return seats
}

function generateMockHall(showtimeData: Showtime): Hall {
  const rows = showtimeData.hallType === 'IMAX' ? 10 : showtimeData.hallType === 'Dolby' ? 9 : 8
  const cols = showtimeData.hallType === 'IMAX' ? 16 : showtimeData.hallType === 'Dolby' ? 14 : 12
  
  return {
    id: `hall-${showtimeData.id}`,
    name: showtimeData.hallName,
    type: showtimeData.hallType,
    rows,
    cols,
    seats: generateHallSeats(rows, cols, showtimeData.price)
  }
}

function handleSeatChange(seats: SelectedSeat[]) {
  selectedSeats.value = seats
  
  if (hall.value) {
    const selectedIds = new Set(seats.map(s => s.id))
    hall.value.seats.forEach((row, rowIndex) => {
      row.forEach((seat, colIndex) => {
        const seatId = `seat-${rowIndex}-${colIndex}`
        if (seat.status !== 'sold' && seat.status !== 'corner' && seat.status !== 'locked') {
          seat.status = selectedIds.has(seatId) ? 'selected' : 'available'
        }
      })
    })
  }
  
  if (seats.length > 0 && !lockInfo.value.locked) {
    startSeatLock()
  }
}

function handleLockRequired() {
  if (!lockInfo.value.locked) {
    startSeatLock()
  }
}

function startSeatLock() {
  const now = Date.now()
  lockInfo.value = {
    locked: true,
    lockedAt: now,
    expireAt: now + lockInfo.value.duration,
    duration: lockInfo.value.duration
  }
  remainingTime.value = lockInfo.value.duration
  startCountdown()
}

function startCountdown() {
  if (countdownTimer) clearInterval(countdownTimer)
  
  countdownTimer = setInterval(() => {
    const now = Date.now()
    const remaining = lockInfo.value.expireAt - now
    
    if (remaining <= 0) {
      clearSeatLock()
      ElMessage.warning('选座超时，座位已自动释放')
    } else {
      remainingTime.value = remaining
    }
  }, 1000)
}

function clearSeatLock() {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  lockInfo.value = {
    locked: false,
    lockedAt: 0,
    expireAt: 0,
    duration: 15 * 60 * 1000
  }
  remainingTime.value = 0
  selectedSeats.value = []
  sessionStorage.removeItem(SEAT_SELECTION_STORAGE_KEY)
}

function saveSeatSelectionState() {
  if (!showtime.value || !hall.value) return
  
  let latestSeats = hall.value.seats
  if (seatSelectorRef.value?.getSeatsSnapshot) {
    latestSeats = seatSelectorRef.value.getSeatsSnapshot()
  }
  
  const hallToSave = {
    ...hall.value,
    seats: latestSeats
  }
  
  const state = {
    showtimeId: showtime.value.id,
    movieId: movie.value?.id,
    hall: hallToSave,
    selectedSeats: selectedSeats.value,
    lockInfo: lockInfo.value,
    remainingTime: remainingTime.value,
    savedAt: Date.now()
  }
  
  sessionStorage.setItem(SEAT_SELECTION_STORAGE_KEY, JSON.stringify(state))
}

function restoreSeatSelectionState(): boolean {
  const savedState = sessionStorage.getItem(SEAT_SELECTION_STORAGE_KEY)
  if (!savedState) return false
  
  try {
    const state = JSON.parse(savedState)
    
    if (!showtime.value || state.showtimeId !== showtime.value.id) {
      sessionStorage.removeItem(SEAT_SELECTION_STORAGE_KEY)
      return false
    }
    
    if (state.lockInfo.locked && Date.now() > state.lockInfo.expireAt) {
      sessionStorage.removeItem(SEAT_SELECTION_STORAGE_KEY)
      return false
    }
    
    if (state.hall && state.hall.seats) {
      hall.value = state.hall
      hallSeatsSnapshot.value = JSON.parse(JSON.stringify(state.hall.seats))
    }
    
    if (state.lockInfo) {
      lockInfo.value = state.lockInfo
    }
    
    if (state.remainingTime) {
      remainingTime.value = state.remainingTime
    }
    
    if (state.lockInfo.locked) {
      startCountdown()
    }
    
    return true
  } catch {
    sessionStorage.removeItem(SEAT_SELECTION_STORAGE_KEY)
    return false
  }
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

async function handleConfirmSeats() {
  if (selectedSeats.value.length === 0) {
    ElMessage.warning('请先选择座位')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `已选择 ${selectedSeats.value.length} 个座位，确定提交订单吗？`,
      '确认选座',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    
    saveSeatSelectionState()
    
    const orderData = {
      movie: movie.value,
      showtime: showtime.value,
      hall: hall.value,
      selectedSeats: selectedSeats.value,
      priceDetail: priceDetail.value,
      lockInfo: lockInfo.value
    }
    
    sessionStorage.setItem('pendingOrder', JSON.stringify(orderData))
    router.push('/movie/order-confirm')
  } catch {
  }
}

onMounted(() => {
  const showtimeData = route.query.showtime
  const movieData = route.query.movie
  
  if (showtimeData) {
    showtime.value = JSON.parse(decodeURIComponent(showtimeData as string))
  }
  
  if (movieData) {
    movie.value = JSON.parse(decodeURIComponent(movieData as string))
  }
  
  if (!showtime.value || !movie.value) {
    ElMessage.error('参数错误，请重新选择场次')
    router.back()
    return
  }
  
  const restored = restoreSeatSelectionState()
  if (!restored) {
    hall.value = generateMockHall(showtime.value)
  } else {
    nextTick(() => {
      if (selectedSeats.value.length > 0) {
        ElMessage.success(`已恢复 ${selectedSeats.value.length} 个已选座位`)
      }
    })
  }
})

watch(selectedSeats, () => {
  if (lockInfo.value.locked) {
    saveSeatSelectionState()
  }
}, { deep: true })

watch(remainingTime, () => {
  if (lockInfo.value.locked) {
    saveSeatSelectionState()
  }
})

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
  if (lockInfo.value.locked && selectedSeats.value.length > 0) {
    saveSeatSelectionState()
  }
})
</script>

<template>
  <div class="seat-selection-page">
    <header class="page-header">
      <div class="header-content">
        <button class="back-btn" @click="router.back()">
          <span class="back-icon">←</span>
        </button>
        <h1 class="header-title">选择座位</h1>
        <div class="header-right"></div>
      </div>
    </header>

    <main class="page-main">
      <div v-if="movie && showtime" class="movie-info-bar">
        <div class="movie-poster-small">
          <img :src="movie.poster" :alt="movie.title" />
        </div>
        <div class="movie-info">
          <h3 class="movie-title">{{ movie.title }}</h3>
          <p class="showtime-info">
            {{ showtime.date }} {{ showtime.startTime }}-{{ showtime.endTime }}
          </p>
          <p class="hall-info">
            {{ showtime.cinemaName }} · {{ showtime.hallName }}
          </p>
        </div>
      </div>

      <div v-if="lockInfo.locked" class="lock-timer-bar" :class="{ warning: remainingTime < 5 * 60 * 1000 }">
        <div class="timer-icon">⏱️</div>
        <div class="timer-text">
          <span>座位已锁定，请在</span>
          <span class="timer-countdown">{{ formatTime(remainingTime) }}</span>
          <span>内完成支付</span>
        </div>
      </div>

      <div v-if="hall" class="seat-section">
        <SeatSelector
          ref="seatSelectorRef"
          :hall="hall"
          :max-seats="6"
          :base-price="showtime?.price || 49"
          @seat-change="handleSeatChange"
          @lock-required="handleLockRequired"
        />
      </div>

      <div class="selected-seats-section">
        <div class="section-header">
          <h3 class="section-title">已选座位</h3>
          <span class="seat-count">{{ selectedSeats.length }}/6座</span>
        </div>
        
        <div class="selected-seats-list" v-if="selectedSeats.length > 0">
          <div class="seat-tag" v-for="seat in selectedSeats" :key="seat.id">
            {{ seat.seatLabel }}
          </div>
        </div>
        <div v-else class="no-seats">
          <span>请点击座位进行选择</span>
        </div>
      </div>

      <div class="price-detail-section">
        <h3 class="section-title">票价明细</h3>
        <div class="price-list">
          <div class="price-item">
            <span class="price-label">电影票 ×{{ priceDetail.ticketCount }}</span>
            <span class="price-value">¥{{ priceDetail.ticketPrice.toFixed(2) }}</span>
          </div>
          <div class="price-item">
            <span class="price-label">服务费 ×{{ priceDetail.ticketCount }}</span>
            <span class="price-value">¥{{ priceDetail.serviceFee.toFixed(2) }}</span>
          </div>
        </div>
        <div class="price-total">
          <span class="total-label">合计</span>
          <span class="total-value">
            <span class="currency">¥</span>
            {{ priceDetail.totalPrice.toFixed(2) }}
          </span>
        </div>
      </div>
    </main>

    <footer class="page-footer">
      <div class="footer-content">
        <div class="footer-price">
          <span class="footer-price-label">应付：</span>
          <span class="footer-price-value">
            <span class="currency">¥</span>
            {{ priceDetail.totalPrice.toFixed(2) }}
          </span>
        </div>
        <button
          class="confirm-btn"
          :class="{ disabled: selectedSeats.length === 0 }"
          :disabled="selectedSeats.length === 0"
          @click="handleConfirmSeats"
        >
          确认选座
        </button>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.seat-selection-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 80px;
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

.page-main {
  padding: 12px;
}

.movie-info-bar {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  margin-bottom: 12px;
}

.movie-poster-small {
  flex-shrink: 0;
}

.movie-poster-small img {
  width: 60px;
  height: 90px;
  object-fit: cover;
  border-radius: 6px;
}

.movie-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.movie-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 6px 0;
}

.showtime-info {
  font-size: 13px;
  color: #666;
  margin: 0 0 4px 0;
}

.hall-info {
  font-size: 12px;
  color: #999;
  margin: 0;
}

.lock-timer-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border-radius: 12px;
  margin-bottom: 12px;
}

.lock-timer-bar.warning {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
}

.timer-icon {
  font-size: 20px;
}

.timer-text {
  flex: 1;
  font-size: 13px;
  color: #333;
}

.timer-countdown {
  font-weight: 700;
  color: #4caf50;
  font-size: 15px;
  margin: 0 4px;
}

.lock-timer-bar.warning .timer-countdown {
  color: #ff9800;
}

.seat-section {
  background: white;
  border-radius: 12px;
  padding: 16px 8px;
  margin-bottom: 12px;
}

.selected-seats-section {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.seat-count {
  font-size: 13px;
  color: #667eea;
}

.selected-seats-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.seat-tag {
  padding: 6px 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
}

.no-seats {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 13px;
}

.price-detail-section {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.price-list {
  margin-top: 12px;
}

.price-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
}

.price-label {
  color: #666;
}

.price-value {
  color: #333;
}

.price-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.total-label {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.total-value {
  font-size: 20px;
  font-weight: 700;
  color: #ff6b6b;
}

.total-value .currency {
  font-size: 14px;
}

.page-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #f0f0f0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  z-index: 100;
}

.footer-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
}

.footer-price {
  display: flex;
  align-items: baseline;
}

.footer-price-label {
  font-size: 14px;
  color: #666;
}

.footer-price-value {
  font-size: 24px;
  font-weight: 700;
  color: #ff6b6b;
}

.footer-price-value .currency {
  font-size: 16px;
}

.confirm-btn {
  padding: 12px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 24px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.confirm-btn:active {
  transform: scale(0.98);
}

.confirm-btn.disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
