<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Movie, Showtime, SelectedSeat, PriceDetail, MovieOrder } from '../../types/movie'

const router = useRouter()

const movie = ref<Movie | null>(null)
const showtime = ref<Showtime | null>(null)
const selectedSeats = ref<SelectedSeat[]>([])
const priceDetail = ref<PriceDetail | null>(null)

const remainingTime = ref(0)
let countdownTimer: ReturnType<typeof setInterval> | null = null
const expireDuration = 15 * 60 * 1000

const order = ref<MovieOrder | null>(null)
const paying = ref(false)
const paySuccess = ref(false)

const seatLabels = computed(() => {
  return selectedSeats.value.map(s => s.seatLabel).join('、')
})

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

function generateOrderId(): string {
  const now = new Date()
  const timestamp = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0') +
    now.getHours().toString().padStart(2, '0') +
    now.getMinutes().toString().padStart(2, '0') +
    now.getSeconds().toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `MO${timestamp}${random}`
}

function createOrder() {
  if (!movie.value || !showtime.value || !priceDetail.value) return
  
  const now = Date.now()
  order.value = {
    id: generateOrderId(),
    movieId: movie.value.id,
    movieTitle: movie.value.title,
    moviePoster: movie.value.poster,
    cinemaId: showtime.value.cinemaId,
    cinemaName: showtime.value.cinemaName,
    hallId: showtime.value.id,
    hallName: showtime.value.hallName,
    showtimeId: showtime.value.id,
    showDate: showtime.value.date,
    startTime: showtime.value.startTime,
    endTime: showtime.value.endTime,
    seats: selectedSeats.value,
    totalPrice: priceDetail.value.ticketPrice,
    serviceFee: priceDetail.value.serviceFee,
    finalPrice: priceDetail.value.totalPrice,
    status: 'pending',
    createdAt: now,
    expireAt: now + expireDuration
  }
}

function startCountdown(expireAt: number) {
  if (countdownTimer) clearInterval(countdownTimer)
  
  countdownTimer = setInterval(() => {
    const now = Date.now()
    const remaining = expireAt - now
    
    if (remaining <= 0) {
      clearInterval(countdownTimer!)
      if (order.value && order.value.status === 'pending') {
        order.value.status = 'expired'
        ElMessage.error('订单已超时，请重新选座')
        setTimeout(() => {
          router.back()
        }, 2000)
      }
    } else {
      remainingTime.value = remaining
    }
  }, 1000)
}

async function handlePay() {
  if (!order.value) return
  
  try {
    await ElMessageBox.confirm(
      `确定支付 ¥${order.value.finalPrice} 吗？`,
      '确认支付',
      {
        confirmButtonText: '确认支付',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    
    paying.value = true
    
    setTimeout(() => {
      paying.value = false
      paySuccess.value = true
      if (order.value) {
        order.value.status = 'paid'
      }
      ElMessage.success('支付成功！')
      
      sessionStorage.removeItem('pendingOrder')
      sessionStorage.removeItem('seatSelectionState')
    }, 2000)
  } catch {
  }
}

function handleBackToHome() {
  router.push('/movie')
}

function handleViewOrder() {
  ElMessage.info('订单列表功能开发中...')
}

onMounted(() => {
  const pendingOrderData = sessionStorage.getItem('pendingOrder')
  
  if (!pendingOrderData) {
    ElMessage.error('未找到订单信息，请重新选座')
    router.back()
    return
  }
  
  try {
    const data = JSON.parse(pendingOrderData)
    movie.value = data.movie
    showtime.value = data.showtime
    selectedSeats.value = data.selectedSeats
    priceDetail.value = data.priceDetail
    
    createOrder()
    
    if (order.value) {
      remainingTime.value = expireDuration
      startCountdown(order.value.expireAt)
    }
  } catch (error) {
    ElMessage.error('订单信息解析失败')
    router.back()
  }
})

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})
</script>

<template>
  <div class="order-confirm-page">
    <header class="page-header">
      <div class="header-content">
        <button class="back-btn" @click="router.back()">
          <span class="back-icon">←</span>
        </button>
        <h1 class="header-title">确认订单</h1>
        <div class="header-right"></div>
      </div>
    </header>

    <main class="page-main">
      <div v-if="paySuccess" class="success-section">
        <div class="success-icon">✓</div>
        <h2 class="success-title">支付成功</h2>
        <p class="success-desc">您的电影票已购买成功</p>
        
        <div class="ticket-preview">
          <div class="ticket-header">
            <span class="ticket-label">电影票</span>
            <span class="ticket-status">已支付</span>
          </div>
          <div class="ticket-content" v-if="order">
            <div class="movie-info">
              <img :src="order.moviePoster" :alt="order.movieTitle" class="ticket-poster" />
              <div class="ticket-movie-info">
                <h3 class="ticket-movie-title">{{ order.movieTitle }}</h3>
                <p class="ticket-cinema">{{ order.cinemaName }}</p>
              </div>
            </div>
            <div class="ticket-details">
              <div class="detail-row">
                <span class="detail-label">场次</span>
                <span class="detail-value">{{ order.showDate }} {{ order.startTime }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">影厅</span>
                <span class="detail-value">{{ order.hallName }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">座位</span>
                <span class="detail-value">{{ seatLabels }}</span>
              </div>
            </div>
            <div class="ticket-footer">
              <span class="ticket-id">订单号：{{ order.id }}</span>
            </div>
          </div>
        </div>

        <div class="success-actions">
          <button class="action-btn secondary" @click="handleViewOrder">查看订单</button>
          <button class="action-btn primary" @click="handleBackToHome">返回首页</button>
        </div>
      </div>

      <div v-else>
        <div v-if="order && order.status === 'pending'" class="order-countdown">
          <div class="countdown-icon">⏱️</div>
          <div class="countdown-text">
            <span>请在</span>
            <span class="countdown-time">{{ formatTime(remainingTime) }}</span>
            <span>内完成支付</span>
          </div>
        </div>

        <div v-if="movie" class="movie-section">
          <div class="movie-card">
            <img :src="movie.poster" :alt="movie.title" class="movie-poster" />
            <div class="movie-info">
              <h3 class="movie-title">{{ movie.title }}</h3>
              <p class="movie-rating" v-if="movie.rating">⭐ {{ movie.rating }}</p>
            </div>
          </div>
        </div>

        <div v-if="showtime" class="showtime-section">
          <h3 class="section-title">观影信息</h3>
          <div class="info-list">
            <div class="info-item">
              <span class="info-label">影院</span>
              <span class="info-value">{{ showtime.cinemaName }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">场次</span>
              <span class="info-value">{{ showtime.date }} {{ showtime.startTime }}-{{ showtime.endTime }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">影厅</span>
              <span class="info-value">{{ showtime.hallName }}</span>
            </div>
          </div>
        </div>

        <div class="seats-section">
          <h3 class="section-title">已选座位</h3>
          <div class="seats-list">
            <div class="seat-tag" v-for="seat in selectedSeats" :key="seat.id">
              {{ seat.seatLabel }}
            </div>
          </div>
        </div>

        <div class="price-section">
          <h3 class="section-title">票价明细</h3>
          <div class="price-list" v-if="priceDetail">
            <div class="price-item">
              <span class="price-label">电影票 ×{{ priceDetail.ticketCount }}</span>
              <span class="price-value">¥{{ priceDetail.ticketPrice.toFixed(2) }}</span>
            </div>
            <div class="price-item">
              <span class="price-label">服务费</span>
              <span class="price-value">¥{{ priceDetail.serviceFee.toFixed(2) }}</span>
            </div>
            <div class="price-item total">
              <span class="price-label">合计</span>
              <span class="price-value">¥{{ priceDetail.totalPrice.toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <div v-if="order" class="order-id-section">
          <span class="order-id-label">订单号：</span>
          <span class="order-id-value">{{ order.id }}</span>
        </div>
      </div>
    </main>

    <footer v-if="!paySuccess" class="page-footer">
      <div class="footer-content">
        <div class="footer-price" v-if="priceDetail">
          <span class="footer-price-label">应付：</span>
          <span class="footer-price-value">
            <span class="currency">¥</span>
            {{ priceDetail.totalPrice.toFixed(2) }}
          </span>
        </div>
        <button
          class="pay-btn"
          :class="{ loading: paying }"
          :disabled="paying"
          @click="handlePay"
        >
          <span v-if="paying" class="loading-spinner"></span>
          <span v-else>立即支付</span>
        </button>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.order-confirm-page {
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

.success-section {
  text-align: center;
  padding: 40px 20px;
}

.success-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  border-radius: 50%;
  color: white;
  font-size: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(76, 175, 80, 0.4);
}

.success-title {
  font-size: 22px;
  font-weight: 700;
  color: #333;
  margin: 0 0 8px 0;
}

.success-desc {
  font-size: 14px;
  color: #666;
  margin: 0 0 30px 0;
}

.ticket-preview {
  background: white;
  border-radius: 16px;
  margin: 0 auto 30px;
  max-width: 400px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.ticket-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.ticket-label {
  font-size: 14px;
  font-weight: 500;
}

.ticket-status {
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  font-size: 12px;
}

.ticket-content {
  padding: 20px;
}

.movie-info {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.ticket-poster {
  width: 60px;
  height: 90px;
  object-fit: cover;
  border-radius: 6px;
}

.ticket-movie-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: left;
}

.ticket-movie-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 6px 0;
}

.ticket-cinema {
  font-size: 13px;
  color: #666;
  margin: 0;
}

.ticket-details {
  border-top: 1px dashed #e0e0e0;
  padding-top: 16px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  text-align: left;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-label {
  font-size: 13px;
  color: #999;
}

.detail-value {
  font-size: 13px;
  color: #333;
  font-weight: 500;
}

.ticket-footer {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  text-align: left;
}

.ticket-id {
  font-size: 12px;
  color: #999;
}

.success-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.action-btn {
  padding: 12px 28px;
  border: none;
  border-radius: 24px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.action-btn.secondary {
  background: #f5f5f5;
  color: #666;
}

.action-btn:active {
  transform: scale(0.98);
}

.order-countdown {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  border-radius: 12px;
  margin-bottom: 12px;
}

.countdown-icon {
  font-size: 20px;
}

.countdown-text {
  flex: 1;
  font-size: 13px;
  color: #333;
}

.countdown-time {
  font-weight: 700;
  color: #ff9800;
  font-size: 16px;
  margin: 0 4px;
}

.movie-section {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.movie-card {
  display: flex;
  gap: 12px;
}

.movie-poster {
  width: 80px;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
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
  margin: 0 0 8px 0;
}

.movie-rating {
  font-size: 14px;
  color: #ff9800;
  margin: 0;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
}

.showtime-section,
.seats-section,
.price-section {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
}

.info-label {
  font-size: 14px;
  color: #999;
}

.info-value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.seats-list {
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

.price-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.price-item {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.price-label {
  color: #666;
}

.price-value {
  color: #333;
}

.price-item.total {
  padding-top: 12px;
  margin-top: 4px;
  border-top: 1px solid #f0f0f0;
}

.price-item.total .price-label {
  font-weight: 600;
  color: #333;
}

.price-item.total .price-value {
  font-size: 18px;
  font-weight: 700;
  color: #ff6b6b;
}

.order-id-section {
  background: white;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  margin-bottom: 12px;
}

.order-id-label {
  font-size: 13px;
  color: #999;
}

.order-id-value {
  font-size: 13px;
  color: #666;
  font-family: monospace;
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

.pay-btn {
  padding: 12px 32px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
  color: white;
  border: none;
  border-radius: 24px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.pay-btn:active {
  transform: scale(0.98);
}

.pay-btn.loading {
  opacity: 0.8;
  cursor: not-allowed;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
