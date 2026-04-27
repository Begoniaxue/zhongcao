<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCouponStore, type Coupon } from '../../stores/coupon'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const couponStore = useCouponStore()

const couponId = computed(() => Number(route.params.id))
const coupon = ref<Coupon | undefined>(undefined)
const currentSlide = ref(0)
const quantity = ref(1)
const isLoading = ref(true)

function getCarouselImages(): string[] {
  const baseImages = [
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=close%20up%20of%20coffee%20latte%20with%20heart%20art&image_size=square',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cafe%20interior%20with%20warm%20lighting%20and%20cozy%20atmosphere&image_size=square',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=food%20and%20drinks%20on%20wooden%20table%20in%20restaurant&image_size=square'
  ]
  return baseImages
}

function prevSlide() {
  if (!coupon.value) return
  const images = getCarouselImages()
  currentSlide.value = (currentSlide.value - 1 + images.length) % images.length
}

function nextSlide() {
  if (!coupon.value) return
  const images = getCarouselImages()
  currentSlide.value = (currentSlide.value + 1) % images.length
}

function goToSlide(index: number) {
  currentSlide.value = index
}

function decreaseQuantity() {
  if (quantity.value > 1) {
    quantity.value--
  }
}

function increaseQuantity() {
  if (coupon.value && quantity.value < coupon.value.stock) {
    quantity.value++
  }
}

function handleAddToCart() {
  if (!coupon.value) return
  
  const result = couponStore.addToCart(coupon.value, quantity.value)
  if (result.success) {
    ElMessage.success(`${result.message}，共 ${quantity.value} 张`)
  } else {
    ElMessage.error(result.message)
  }
}

async function handleBuyNow() {
  if (!coupon.value) return
  
  if (coupon.value.stock < quantity.value) {
    ElMessage.error('库存不足')
    return
  }
  
  couponStore.setCheckoutItems([{ coupon: coupon.value, quantity: quantity.value }])
  router.push('/checkout')
}

function goBack() {
  router.back()
}

onMounted(() => {
  setTimeout(() => {
    coupon.value = couponStore.getCouponById(couponId.value)
    isLoading.value = false
  }, 100)
})
</script>

<template>
  <div class="coupon-detail-container">
    <div class="detail-header">
      <el-button
        type="text"
        class="back-btn"
        @click="goBack"
      >
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <span class="header-title">卡券详情</span>
      <div class="header-placeholder"></div>
    </div>

    <div v-if="isLoading" class="loading-container">
      <span class="loading-text">加载中...</span>
    </div>

    <div v-else-if="!coupon" class="empty-container">
      <span class="empty-text">卡券不存在</span>
    </div>

    <template v-else>
      <div class="carousel-section">
        <div class="carousel-container">
          <div class="carousel-wrapper" :style="{ transform: `translateX(-${currentSlide * 100}%)` }">
            <div
              v-for="(image, index) in getCarouselImages()"
              :key="index"
              class="carousel-slide"
            >
              <img :src="image" :alt="`${coupon.title} 图片 ${index + 1}`" />
            </div>
          </div>
          
          <button class="carousel-btn prev-btn" @click="prevSlide">
            <el-icon><ArrowLeft /></el-icon>
          </button>
          <button class="carousel-btn next-btn" @click="nextSlide">
            <el-icon><ArrowRight /></el-icon>
          </button>
          
          <div class="carousel-indicators">
            <button
              v-for="(_, index) in getCarouselImages()"
              :key="index"
              :class="['indicator', { active: currentSlide === index }]"
              @click="goToSlide(index)"
            ></button>
          </div>
          
          <div class="carousel-counter">
            {{ currentSlide + 1 }} / {{ getCarouselImages().length }}
          </div>
        </div>
      </div>

      <div class="info-section">
        <div class="price-row">
          <span class="current-price">¥{{ coupon.price }}</span>
          <span class="original-price">¥{{ coupon.originalPrice }}</span>
          <span class="discount-tag">{{ coupon.discount }}</span>
        </div>
        
        <h1 class="coupon-title">{{ coupon.title }}</h1>
        <p class="coupon-subtitle">{{ coupon.subtitle }}</p>
        
        <div class="meta-row">
          <div class="meta-item">
            <span class="meta-label">销量</span>
            <span class="meta-value">{{ coupon.soldCount }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">库存</span>
            <span class="meta-value" :class="{ 'low-stock': coupon.stock < 20 }">
              {{ coupon.stock }}
            </span>
          </div>
          <div class="meta-item">
            <span class="meta-label">有效期</span>
            <span class="meta-value">{{ coupon.validFrom.slice(5) }} 至 {{ coupon.validTo.slice(5) }}</span>
          </div>
        </div>
      </div>

      <div class="quantity-section">
        <span class="quantity-label">购买数量</span>
        <div class="quantity-controls">
          <el-button
            type="default"
            :disabled="quantity <= 1"
            @click="decreaseQuantity"
          >
            <el-icon><Minus /></el-icon>
          </el-button>
          <span class="quantity-value">{{ quantity }}</span>
          <el-button
            type="default"
            :disabled="coupon.stock <= quantity"
            @click="increaseQuantity"
          >
            <el-icon><Plus /></el-icon>
          </el-button>
        </div>
      </div>

      <div class="details-section">
        <h3 class="section-title">卡券详情</h3>
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
              <el-icon><Check /></el-icon>
            </div>
            <span class="detail-text">{{ detail }}</span>
          </div>
        </div>
      </div>

      <div class="bottom-spacer"></div>
    </template>

    <div v-if="coupon" class="fixed-bottom-bar">
      <div class="bottom-content">
        <div class="price-summary">
          <span class="summary-label">合计</span>
          <span class="summary-price">¥{{ (coupon.price * quantity).toFixed(2) }}</span>
          <span class="summary-count">共 {{ quantity }} 张</span>
        </div>
        <div class="action-buttons">
          <el-button
            type="default"
            class="add-cart-btn"
            @click="handleAddToCart"
          >
            加入购物车
          </el-button>
          <el-button
            type="primary"
            class="buy-btn"
            @click="handleBuyNow"
          >
            立即购买
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ArrowLeft, ArrowRight, Minus, Plus, Check } from '@element-plus/icons-vue'

export default {
  components: {
    ArrowLeft,
    ArrowRight,
    Minus,
    Plus,
    Check
  }
}
</script>

<style scoped>
.coupon-detail-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 70px;
}

.detail-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  height: 50px;
}

.back-btn {
  color: white;
  padding: 4px;
}

.back-btn:hover {
  color: rgba(255, 255, 255, 0.8);
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.header-placeholder {
  width: 32px;
}

.loading-container,
.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 100px 0;
}

.loading-text,
.empty-text {
  font-size: 14px;
  color: #999;
}

.carousel-section {
  background: white;
}

.carousel-container {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  background-color: #f0f0f0;
}

.carousel-wrapper {
  display: flex;
  width: 100%;
  height: 100%;
  transition: transform 0.3s ease;
}

.carousel-slide {
  flex-shrink: 0;
  width: 100%;
  height: 100%;
}

.carousel-slide img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.carousel-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.3);
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}

.carousel-btn:hover {
  background: rgba(0, 0, 0, 0.5);
}

.prev-btn {
  left: 12px;
}

.next-btn {
  right: 12px;
}

.carousel-indicators {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
}

.indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
}

.indicator.active {
  width: 18px;
  border-radius: 3px;
  background: white;
}

.carousel-counter {
  position: absolute;
  bottom: 12px;
  right: 12px;
  background: rgba(0, 0, 0, 0.4);
  color: white;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 10px;
}

.info-section {
  background: white;
  padding: 16px;
  margin-bottom: 8px;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 8px;
}

.current-price {
  font-size: 24px;
  font-weight: 700;
  color: #ff6b6b;
}

.original-price {
  font-size: 13px;
  color: #999;
  text-decoration: line-through;
}

.discount-tag {
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%);
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
}

.coupon-title {
  font-size: 17px;
  font-weight: 600;
  color: #333;
  margin: 0 0 6px 0;
  line-height: 1.4;
}

.coupon-subtitle {
  font-size: 13px;
  color: #666;
  margin: 0 0 12px 0;
}

.meta-row {
  display: flex;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.meta-label {
  font-size: 11px;
  color: #999;
}

.meta-value {
  font-size: 13px;
  color: #333;
  font-weight: 500;
}

.meta-value.low-stock {
  color: #ff6b6b;
}

.quantity-section {
  background: white;
  padding: 16px;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quantity-label {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.quantity-value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  min-width: 30px;
  text-align: center;
}

.details-section {
  background: white;
  padding: 16px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
}

.description-box {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
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
  gap: 10px;
}

.detail-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.detail-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  flex-shrink: 0;
  margin-top: 2px;
}

.detail-text {
  font-size: 13px;
  color: #333;
  line-height: 1.6;
}

.bottom-spacer {
  height: 20px;
}

.fixed-bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: white;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.08);
  padding: 10px 16px;
  padding-bottom: max(10px, env(safe-area-inset-bottom));
}

.bottom-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.price-summary {
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex: 1 1 auto;
  min-width: fit-content;
}

.summary-label {
  font-size: 13px;
  color: #666;
  white-space: nowrap;
}

.summary-price {
  font-size: 20px;
  font-weight: 700;
  color: #ff6b6b;
  white-space: nowrap;
}

.summary-count {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
}

.action-buttons {
  display: flex;
  gap: 10px;
  flex: 0 0 auto;
  min-width: fit-content;
}

.add-cart-btn {
  border-color: #667eea;
  color: #667eea;
  font-size: 13px;
  padding: 8px 14px;
  height: auto;
  white-space: nowrap;
}

.add-cart-btn:hover {
  border-color: #5a6fd6;
  color: #5a6fd6;
}

.buy-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  font-size: 13px;
  padding: 8px 18px;
  height: auto;
  white-space: nowrap;
}

.buy-btn:hover {
  background: linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%);
}

@media (min-width: 768px) {
  .coupon-detail-container {
    max-width: 600px;
    margin: 0 auto;
  }

  .detail-header {
    padding: 12px 24px;
  }

  .info-section,
  .quantity-section,
  .details-section {
    padding: 20px 24px;
  }

  .current-price {
    font-size: 28px;
  }

  .coupon-title {
    font-size: 18px;
  }

  .fixed-bottom-bar {
    padding: 14px 24px;
  }

  .summary-price {
    font-size: 22px;
  }

  .add-cart-btn,
  .buy-btn {
    font-size: 14px;
    padding: 12px 28px;
  }
}

@media (max-width: 360px) {
  .detail-header {
    padding: 10px 12px;
  }

  .info-section,
  .quantity-section,
  .details-section {
    padding: 12px;
  }

  .current-price {
    font-size: 20px;
  }

  .coupon-title {
    font-size: 15px;
  }

  .meta-row {
    flex-wrap: wrap;
    gap: 12px;
  }

  .fixed-bottom-bar {
    padding: 8px 12px;
  }

  .summary-price {
    font-size: 18px;
  }

  .add-cart-btn,
  .buy-btn {
    font-size: 12px;
    padding: 8px 16px;
  }
}
</style>
