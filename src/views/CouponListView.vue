<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useCouponStore, type Coupon } from '../stores/coupon'
import { computed, ref, onMounted, onUnmounted } from 'vue'

const router = useRouter()
const couponStore = useCouponStore()

const allCoupons = computed(() => couponStore.coupons)
const pageSize = 4
const currentPage = ref(1)
const loading = ref(false)
const hasMore = ref(true)
const visibleCoupons = ref<Coupon[]>([])

function loadMore() {
  if (loading.value || !hasMore.value) return

  loading.value = true

  setTimeout(() => {
    const start = 0
    const end = currentPage.value * pageSize
    const newVisible = allCoupons.value.slice(start, end)

    visibleCoupons.value = newVisible

    if (end >= allCoupons.value.length) {
      hasMore.value = false
    } else {
      currentPage.value++
    }

    loading.value = false
  }, 300)
}

function goToDetail(couponId: number) {
  router.push(`/coupon-detail/${couponId}`)
}

function goToCart() {
  router.push('/cart')
}

function handleBuy(coupon: Coupon, event: Event) {
  event.stopPropagation()
  
  couponStore.setCheckoutItems([
    {
      coupon,
      quantity: 1
    }
  ])
  
  router.push('/checkout')
}

function handleScroll() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight

  if (scrollTop + windowHeight >= documentHeight - 100) {
    loadMore()
  }
}

onMounted(() => {
  loadMore()
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

const leftColumnCoupons = computed(() =>
  visibleCoupons.value.filter((_, index) => index % 2 === 0)
)

const rightColumnCoupons = computed(() =>
  visibleCoupons.value.filter((_, index) => index % 2 === 1)
)
</script>

<template>
  <div class="coupon-list-container">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">卡券商城</h1>
        <p class="page-subtitle">精选优惠，超值兑换</p>
      </div>
    </div>

    <div class="coupon-list">
      <div class="waterfall">
        <div class="column">
          <div
            v-for="coupon in leftColumnCoupons"
            :key="coupon.id"
            class="coupon-card"
            @click="goToDetail(coupon.id)"
          >
            <div class="coupon-image-wrapper">
              <div class="coupon-image">
                <img :src="coupon.mainImage" :alt="coupon.title" />
              </div>
              <div class="discount-badge">
                <span class="discount-text">{{ coupon.discount }}</span>
              </div>
              <div v-if="coupon.stock < 20" class="stock-badge">
                <span class="stock-text">仅剩{{ coupon.stock }}张</span>
              </div>
            </div>
            
            <div class="coupon-info">
              <h3 class="coupon-title">{{ coupon.title }}</h3>
              <p class="coupon-subtitle">{{ coupon.subtitle }}</p>
              
              <div class="coupon-meta">
                <span class="sold-count">已售 {{ coupon.soldCount }}</span>
                <span class="valid-period">{{ coupon.validFrom }} 至 {{ coupon.validTo }}</span>
              </div>
            </div>
            
            <div class="coupon-footer">
              <div class="price-section">
                <span class="current-price">¥{{ coupon.price }}</span>
                <span class="original-price">¥{{ coupon.originalPrice }}</span>
              </div>
              <el-button
                type="primary"
                size="small"
                class="buy-btn"
                :disabled="coupon.stock <= 0"
                @click="handleBuy(coupon, $event)"
              >
                {{ coupon.stock > 0 ? '立即购买' : '已售罄' }}
              </el-button>
            </div>
          </div>
        </div>
        
        <div class="column">
          <div
            v-for="coupon in rightColumnCoupons"
            :key="coupon.id"
            class="coupon-card"
            @click="goToDetail(coupon.id)"
          >
            <div class="coupon-image-wrapper">
              <div class="coupon-image">
                <img :src="coupon.mainImage" :alt="coupon.title" />
              </div>
              <div class="discount-badge">
                <span class="discount-text">{{ coupon.discount }}</span>
              </div>
              <div v-if="coupon.stock < 20" class="stock-badge">
                <span class="stock-text">仅剩{{ coupon.stock }}张</span>
              </div>
            </div>
            
            <div class="coupon-info">
              <h3 class="coupon-title">{{ coupon.title }}</h3>
              <p class="coupon-subtitle">{{ coupon.subtitle }}</p>
              
              <div class="coupon-meta">
                <span class="sold-count">已售 {{ coupon.soldCount }}</span>
                <span class="valid-period">{{ coupon.validFrom }} 至 {{ coupon.validTo }}</span>
              </div>
            </div>
            
            <div class="coupon-footer">
              <div class="price-section">
                <span class="current-price">¥{{ coupon.price }}</span>
                <span class="original-price">¥{{ coupon.originalPrice }}</span>
              </div>
              <el-button
                type="primary"
                size="small"
                class="buy-btn"
                :disabled="coupon.stock <= 0"
                @click="handleBuy(coupon, $event)"
              >
                {{ coupon.stock > 0 ? '立即购买' : '已售罄' }}
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="loading" class="loading-container">
        <span class="loading-text">加载中...</span>
      </div>
      <div v-if="!hasMore && visibleCoupons.length > 0" class="no-more">
        <span class="no-more-text">没有更多了</span>
      </div>
    </div>

    <div class="cart-fab-container" @click="goToCart">
      <div class="cart-fab">
        <el-icon><ShoppingCart /></el-icon>
        <span v-if="couponStore.cartCount > 0" class="cart-badge">{{ couponStore.cartCount }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ShoppingCart } from '@element-plus/icons-vue'

export default {
  name: 'CouponListView',
  components: {
    ShoppingCart
  }
}
</script>

<style scoped>
.coupon-list-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 20px;
}

.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.header-content {
  max-width: 600px;
  margin: 0 auto;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: white;
  margin: 0 0 4px 0;
}

.page-subtitle {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
}

.coupon-list {
  padding: 12px;
}

.waterfall {
  display: flex;
  gap: 10px;
}

.column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.coupon-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.coupon-card:active {
  transform: translateY(-1px);
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.1);
}

.coupon-image-wrapper {
  position: relative;
}

.coupon-image {
  width: 100%;
  aspect-ratio: 4 / 3;
  background-color: #f0f0f0;
  overflow: hidden;
}

.coupon-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.discount-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: linear-gradient(135deg, #f5576c 0%, #f093fb 100%);
  padding: 4px 10px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(245, 87, 108, 0.3);
}

.discount-text {
  font-size: 12px;
  font-weight: 600;
  color: white;
}

.stock-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.6);
  padding: 3px 8px;
  border-radius: 4px;
}

.stock-text {
  font-size: 11px;
  color: #ffd700;
}

.coupon-info {
  padding: 10px 10px 0;
}

.coupon-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0 0 4px 0;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.coupon-subtitle {
  font-size: 11px;
  color: #999;
  margin: 0 0 6px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.coupon-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 10px;
  color: #bbb;
}

.coupon-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px 10px;
  border-top: 1px solid #f0f0f0;
  margin-top: 8px;
}

.price-section {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.current-price {
  font-size: 18px;
  font-weight: 700;
  color: #f5576c;
}

.original-price {
  font-size: 12px;
  color: #bbb;
  text-decoration: line-through;
}

.buy-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  padding: 6px 14px;
  font-size: 12px;
  border-radius: 16px;
  height: auto;
}

.buy-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%);
}

.buy-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 0;
}

.loading-text {
  font-size: 13px;
  color: #999;
}

.no-more {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 0;
}

.no-more-text {
  font-size: 12px;
  color: #bbb;
}

@media (min-width: 768px) {
  .page-header {
    padding: 24px 32px;
  }

  .header-content {
    max-width: 700px;
  }

  .page-title {
    font-size: 26px;
  }

  .page-subtitle {
    font-size: 14px;
  }

  .coupon-list {
    padding: 16px 24px;
    max-width: 700px;
    margin: 0 auto;
  }

  .waterfall {
    gap: 16px;
  }

  .column {
    gap: 16px;
  }

  .coupon-card {
    border-radius: 16px;
  }

  .coupon-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }

  .coupon-info {
    padding: 12px 12px 0;
  }

  .coupon-title {
    font-size: 15px;
  }

  .coupon-subtitle {
    font-size: 12px;
  }

  .coupon-footer {
    padding: 10px 12px 12px;
  }

  .current-price {
    font-size: 20px;
  }

  .buy-btn {
    padding: 8px 16px;
    font-size: 13px;
  }
}

@media (max-width: 360px) {
  .page-header {
    padding: 16px 12px;
  }

  .page-title {
    font-size: 18px;
  }

  .page-subtitle {
    font-size: 12px;
  }

  .coupon-list {
    padding: 8px;
  }

  .waterfall {
    gap: 8px;
  }

  .column {
    gap: 8px;
  }

  .coupon-card {
    border-radius: 10px;
  }

  .coupon-info {
    padding: 8px 8px 0;
  }

  .coupon-title {
    font-size: 12px;
  }

  .coupon-subtitle {
    font-size: 10px;
  }

  .coupon-footer {
    padding: 6px 8px 8px;
  }

  .current-price {
    font-size: 16px;
  }

  .original-price {
    font-size: 11px;
  }

  .buy-btn {
    padding: 4px 10px;
    font-size: 11px;
  }
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

.cart-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: #f5576c;
  color: white;
  font-size: 12px;
  font-weight: 700;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(245, 87, 108, 0.3);
}

@media (min-width: 768px) {
  .cart-fab-container {
    bottom: 30px;
    right: 30px;
  }

  .cart-fab {
    width: 60px;
    height: 60px;
  }

  .cart-fab .el-icon {
    font-size: 26px;
  }
}

@media (max-width: 360px) {
  .cart-fab-container {
    bottom: 70px;
    right: 16px;
  }

  .cart-fab {
    width: 50px;
    height: 50px;
  }

  .cart-fab .el-icon {
    font-size: 22px;
  }

  .cart-badge {
    min-width: 18px;
    height: 18px;
    font-size: 11px;
    padding: 0 5px;
  }
}
</style>
