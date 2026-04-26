<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useCouponStore, type Coupon } from '../stores/coupon'
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const couponStore = useCouponStore()

const couponId = computed(() => {
  const id = route.params.id
  return typeof id === 'string' ? parseInt(id, 10) : Array.isArray(id) ? parseInt(id[0], 10) : 0
})

const coupon = ref<Coupon | undefined>(undefined)

function loadCoupon() {
  const found = couponStore.getCouponById(couponId.value)
  if (found) {
    coupon.value = found
  } else {
    ElMessage.error('卡券不存在')
    router.push('/coupon-list')
  }
}

function goBack() {
  router.back()
}

function goToCart() {
  router.push('/cart')
}

async function handleAddToCart() {
  if (!coupon.value) return
  
  const result = couponStore.addToCart(coupon.value, 1)
  if (result.success) {
    ElMessage.success(result.message)
  } else {
    ElMessage.error(result.message)
  }
}

function handleBuy() {
  if (!coupon.value) return
  
  couponStore.setCheckoutItems([
    {
      coupon: coupon.value,
      quantity: 1
    }
  ])
  
  router.push('/checkout')
}

onMounted(() => {
  loadCoupon()
})

watch(couponId, () => {
  loadCoupon()
})
</script>

<template>
  <div class="coupon-detail-container" v-if="coupon">
    <div class="header-bar">
      <div class="header-back" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
      </div>
      <div class="header-title">卡券详情</div>
      <div class="header-placeholder"></div>
    </div>

    <div class="coupon-main-image">
      <img :src="coupon.mainImage" :alt="coupon.title" />
      <div class="discount-label">
        <span class="discount-value">{{ coupon.discount }}</span>
      </div>
    </div>

    <div class="coupon-info-section">
      <div class="price-row">
        <span class="current-price">¥{{ coupon.price }}</span>
        <span class="original-price">¥{{ coupon.originalPrice }}</span>
        <span class="discount-badge">{{ coupon.discount }}</span>
      </div>
      
      <h1 class="coupon-title">{{ coupon.title }}</h1>
      <p class="coupon-subtitle">{{ coupon.subtitle }}</p>
      
      <div class="coupon-stats">
        <div class="stat-item">
          <span class="stat-label">已售</span>
          <span class="stat-value">{{ coupon.soldCount }}</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-label">库存</span>
          <span class="stat-value" :class="{ 'low-stock': coupon.stock < 20 }">{{ coupon.stock }}</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-label">有效期</span>
          <span class="stat-value">{{ coupon.validFrom }} 至 {{ coupon.validTo }}</span>
        </div>
      </div>
    </div>

    <div class="details-section">
      <h2 class="section-title">卡券详情</h2>
      
      <div class="description-box">
        <p class="description-text">{{ coupon.description }}</p>
      </div>
      
      <div class="details-list">
        <div 
          v-for="(detail, index) in coupon.details" 
          :key="index" 
          class="detail-item"
        >
          <div class="detail-icon">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <span class="detail-text">{{ detail }}</span>
        </div>
      </div>
    </div>

    <div class="cart-fab-container" @click="goToCart">
      <div class="cart-fab">
        <el-icon><ShoppingCart /></el-icon>
        <span v-if="couponStore.cartCount > 0" class="cart-badge">{{ couponStore.cartCount }}</span>
      </div>
    </div>

    <div class="bottom-action-bar">
      <div class="cart-btn" @click="handleAddToCart">
        <el-icon><ShoppingCart /></el-icon>
        <span class="btn-text">加入购物车</span>
      </div>
      <button 
        class="buy-now-btn" 
        :disabled="coupon.stock <= 0"
        @click="handleBuy"
      >
        {{ coupon.stock > 0 ? '立即购买' : '已售罄' }}
      </button>
    </div>
  </div>

  <div v-else class="loading-page">
    <span class="loading-text">加载中...</span>
  </div>
</template>

<script lang="ts">
import { ArrowLeft, CircleCheck, ShoppingCart } from '@element-plus/icons-vue'

export default {
  name: 'CouponDetailView',
  components: {
    ArrowLeft,
    CircleCheck,
    ShoppingCart
  }
}
</script>

<style scoped>
.coupon-detail-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 80px;
}

.loading-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.loading-text {
  font-size: 14px;
  color: #999;
}

.header-bar {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 12px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #f0f0f0;
}

.header-back {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #333;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.header-placeholder {
  width: 36px;
}

.coupon-main-image {
  width: 100%;
  aspect-ratio: 16 / 10;
  background-color: #f0f0f0;
  position: relative;
  overflow: hidden;
}

.coupon-main-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.discount-label {
  position: absolute;
  bottom: 12px;
  right: 12px;
  background: linear-gradient(135deg, #f5576c 0%, #f093fb 100%);
  padding: 6px 16px;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(245, 87, 108, 0.3);
}

.discount-value {
  font-size: 14px;
  font-weight: 700;
  color: white;
}

.coupon-info-section {
  background: white;
  padding: 16px;
  margin-bottom: 8px;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 12px;
}

.current-price {
  font-size: 28px;
  font-weight: 700;
  color: #f5576c;
}

.original-price {
  font-size: 14px;
  color: #bbb;
  text-decoration: line-through;
}

.discount-badge {
  font-size: 12px;
  color: #f5576c;
  background: rgba(245, 87, 108, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
}

.coupon-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 6px 0;
  line-height: 1.4;
}

.coupon-subtitle {
  font-size: 13px;
  color: #999;
  margin: 0 0 16px 0;
}

.coupon-stats {
  display: flex;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.stat-label {
  font-size: 11px;
  color: #bbb;
}

.stat-value {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.stat-value.low-stock {
  color: #f5576c;
}

.stat-divider {
  width: 1px;
  height: 24px;
  background-color: #f0f0f0;
  margin: 0 16px;
}

.details-section {
  background: white;
  padding: 16px;
  margin-bottom: 8px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
}

.description-box {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.description-text {
  font-size: 13px;
  color: #666;
  line-height: 1.6;
  margin: 0;
}

.details-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.detail-icon {
  color: #667eea;
  font-size: 16px;
  flex-shrink: 0;
  margin-top: 1px;
}

.detail-text {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}

.bottom-action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: white;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.08);
  z-index: 100;
}

.cart-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4px 16px;
  cursor: pointer;
  color: #666;
  position: relative;
  transition: color 0.2s;
}

.cart-btn:hover {
  color: #667eea;
}

.cart-btn .el-icon {
  font-size: 20px;
}

.btn-text {
  font-size: 11px;
  margin-top: 2px;
}

.cart-badge {
  position: absolute;
  top: 0;
  right: 8px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background: #f5576c;
  color: white;
  font-size: 10px;
  font-weight: 600;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.buy-now-btn {
  flex: 1;
  margin-left: 16px;
  height: 44px;
  border: none;
  border-radius: 22px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.buy-now-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.buy-now-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.cart-fab-container {
  position: fixed;
  bottom: 80px;
  right: 20px;
  z-index: 100;
  cursor: pointer;
}

.cart-fab {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
  position: relative;
  transition: transform 0.2s, box-shadow 0.2s;
}

.cart-fab:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.cart-fab:active {
  transform: scale(0.95);
}

.cart-fab .el-icon {
  font-size: 24px;
  color: white;
}

.cart-fab .cart-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: #f5576c;
  color: white;
  font-size: 11px;
  font-weight: 600;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (min-width: 768px) {
  .coupon-detail-container {
    max-width: 600px;
    margin: 0 auto;
  }

  .header-bar {
    max-width: 600px;
    margin: 0 auto;
    left: 50%;
    transform: translateX(-50%);
  }

  .bottom-action-bar {
    max-width: 600px;
    margin: 0 auto;
    left: 50%;
    transform: translateX(-50%);
  }

  .coupon-main-image {
    border-radius: 0 0 16px 16px;
  }

  .current-price {
    font-size: 32px;
  }

  .coupon-title {
    font-size: 20px;
  }

  .buy-now-btn {
    height: 48px;
    font-size: 16px;
  }
}

@media (max-width: 360px) {
  .current-price {
    font-size: 24px;
  }

  .coupon-title {
    font-size: 16px;
  }

  .coupon-subtitle {
    font-size: 12px;
  }

  .stat-value {
    font-size: 12px;
  }
}
</style>
