<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCouponStore, type Coupon } from '../../stores/coupon'
import { ElMessage } from 'element-plus'

const router = useRouter()
const couponStore = useCouponStore()

const allCoupons = computed(() => couponStore.coupons)
const cartCount = computed(() => couponStore.cartCount)

const fabPosition = ref({ x: window.innerWidth - 80, y: window.innerHeight - 180 })
const isDragging = ref(false)
const hasMoved = ref(false)
const dragStartPos = ref({ x: 0, y: 0 })
const fabStartPos = ref({ x: 0, y: 0 })

function goToDetail(id: number) {
  router.push(`/coupon-detail/${id}`)
}

function handleBuyNow(coupon: Coupon, event: Event) {
  event.stopPropagation()
  couponStore.setCheckoutItems([{ coupon, quantity: 1 }])
  router.push('/checkout')
}

function handleAddToCart(coupon: Coupon, event: Event) {
  event.stopPropagation()
  const result = couponStore.addToCart(coupon, 1)
  if (result.success) {
    ElMessage.success(result.message)
  } else {
    ElMessage.error(result.message)
  }
}

function goToCart() {
  router.push('/cart')
}

function getImageUrl(index: number): string {
  const images = [
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=starbucks%20coffee%20cup%20with%20logo%20on%20wooden%20table&image_size=square',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=hotpot%20restaurant%20with%20various%20dishes%20and%20soup%20base&image_size=square',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=clothing%20store%20interior%20with%20modern%20fashion%20display&image_size=square',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=milk%20tea%20and%20fruit%20tea%20with%20ice%20and%20toppings&image_size=square',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cinema%20theater%20with%20seats%20and%20big%20screen&image_size=square',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fried%20chicken%20bucket%20with%20fries%20and%20drinks&image_size=square',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sports%20shoes%20and%20sportswear%20in%20modern%20store&image_size=square',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=pizza%20pasta%20and%20drinks%20on%20restaurant%20table&image_size=square'
  ]
  return images[index % images.length]
}

function handleMouseDown(e: MouseEvent | TouchEvent) {
  isDragging.value = true
  hasMoved.value = false
  
  const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY
  
  dragStartPos.value = { x: clientX, y: clientY }
  fabStartPos.value = { ...fabPosition.value }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  document.addEventListener('touchmove', handleMouseMove, { passive: false })
  document.addEventListener('touchend', handleMouseUp)
}

function handleMouseMove(e: MouseEvent | TouchEvent) {
  if (!isDragging.value) return
  
  const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY
  
  const deltaX = clientX - dragStartPos.value.x
  const deltaY = clientY - dragStartPos.value.y
  
  if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
    hasMoved.value = true
  }
  
  if (hasMoved.value) {
    e.preventDefault()
  }
  
  const newX = fabStartPos.value.x + deltaX
  const newY = fabStartPos.value.y + deltaY
  
  const maxX = window.innerWidth - 60
  const maxY = window.innerHeight - 60
  const minX = 20
  const minY = 20
  
  fabPosition.value.x = Math.max(minX, Math.min(maxX, newX))
  fabPosition.value.y = Math.max(minY, Math.min(maxY, newY))
}

function handleMouseUp() {
  if (isDragging.value && !hasMoved.value) {
    goToCart()
  }
  
  isDragging.value = false
  hasMoved.value = false
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  document.removeEventListener('touchmove', handleMouseMove)
  document.removeEventListener('touchend', handleMouseUp)
}

function handleResize() {
  const maxX = window.innerWidth - 60
  const maxY = window.innerHeight - 60
  
  fabPosition.value.x = Math.min(fabPosition.value.x, maxX)
  fabPosition.value.y = Math.min(fabPosition.value.y, maxY)
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="coupon-list-container">
    <div class="page-header">
      <h1 class="page-title">卡券中心</h1>
      <p class="page-subtitle">精选优惠，限时抢购</p>
    </div>

    <div class="coupon-grid">
      <div
        v-for="(coupon, index) in allCoupons"
        :key="coupon.id"
        class="coupon-card"
        @click="goToDetail(coupon.id)"
      >
        <div class="coupon-image">
          <img :src="getImageUrl(index)" :alt="coupon.title" />
          <div class="discount-badge">{{ coupon.discount }}</div>
          <div v-if="coupon.stock < 20" class="stock-warning">
            仅剩 {{ coupon.stock }} 张
          </div>
        </div>
        <div class="coupon-info">
          <h3 class="coupon-title">{{ coupon.title }}</h3>
          <p class="coupon-subtitle">{{ coupon.subtitle }}</p>
          <div class="coupon-footer">
            <div class="price-section">
              <span class="current-price">¥{{ coupon.price }}</span>
              <span class="original-price">¥{{ coupon.originalPrice }}</span>
            </div>
            <div class="action-buttons">
              <el-button
                type="primary"
                size="small"
                class="buy-btn"
                @click="handleBuyNow(coupon, $event)"
              >
                立即购买
              </el-button>
              <el-button
                type="default"
                size="small"
                class="add-cart-btn"
                @click="handleAddToCart(coupon, $event)"
              >
                加购
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      class="draggable-fab"
      :style="{ left: fabPosition.x + 'px', top: fabPosition.y + 'px' }"
      @mousedown="handleMouseDown"
      @touchstart="handleMouseDown"
    >
      <el-button type="primary" circle size="large" class="fab-button">
        <el-icon><ShoppingCart /></el-icon>
        <span v-if="cartCount > 0" class="cart-badge">{{ cartCount }}</span>
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { ShoppingCart } from '@element-plus/icons-vue'

export default {
  components: {
    ShoppingCart
  }
}
</script>

<style scoped>
.coupon-list-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 16px;
  padding-bottom: 80px;
}

.page-header {
  margin-bottom: 16px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin: 0 0 4px 0;
}

.page-subtitle {
  font-size: 13px;
  color: #999;
  margin: 0;
}

.coupon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.coupon-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.coupon-card:active {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.coupon-image {
  width: 100%;
  aspect-ratio: 1;
  background-color: #f0f0f0;
  position: relative;
  overflow: hidden;
}

.coupon-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.discount-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%);
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(255, 107, 107, 0.3);
}

.stock-warning {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.6);
  color: #ffd700;
  font-size: 10px;
  padding: 3px 6px;
  border-radius: 4px;
}

.coupon-info {
  padding: 10px;
}

.coupon-title {
  font-size: 13px;
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
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.coupon-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 8px;
}

.price-section {
  display: flex;
  align-items: baseline;
  gap: 4px;
  flex-shrink: 1;
  min-width: 0;
}

.current-price {
  font-size: 18px;
  font-weight: 700;
  color: #ff6b6b;
  white-space: nowrap;
}

.original-price {
  font-size: 11px;
  color: #ccc;
  text-decoration: line-through;
  white-space: nowrap;
}

.action-buttons {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.buy-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  font-size: 11px;
  padding: 6px 8px;
  height: auto;
  white-space: nowrap;
}

.buy-btn:hover {
  background: linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%);
}

.add-cart-btn {
  font-size: 11px;
  padding: 6px 8px;
  height: auto;
  white-space: nowrap;
}

.draggable-fab {
  position: fixed;
  z-index: 1000;
  touch-action: none;
}

.fab-button {
  width: 56px;
  height: 56px;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.fab-button:active {
  transform: scale(0.95);
}

.cart-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ff6b6b;
  color: white;
  font-size: 11px;
  font-weight: 600;
  min-width: 18px;
  height: 18px;
  line-height: 18px;
  text-align: center;
  border-radius: 9px;
  padding: 0 4px;
  box-shadow: 0 2px 4px rgba(255, 107, 107, 0.4);
}

@media (min-width: 768px) {
  .coupon-list-container {
    padding: 24px;
    padding-bottom: 100px;
  }

  .page-title {
    font-size: 28px;
  }

  .coupon-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
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
    padding: 14px;
  }

  .coupon-title {
    font-size: 14px;
  }

  .current-price {
    font-size: 20px;
  }

  .buy-btn,
  .add-cart-btn {
    font-size: 12px;
    padding: 8px 14px;
  }

  .fab-button {
    width: 64px;
    height: 64px;
  }

  .cart-badge {
    font-size: 12px;
    min-width: 20px;
    height: 20px;
    line-height: 20px;
    top: -2px;
    right: -2px;
  }
}

@media (max-width: 360px) {
  .coupon-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .coupon-info {
    padding: 8px;
  }

  .coupon-title {
    font-size: 12px;
  }

  .coupon-subtitle {
    font-size: 10px;
  }

  .current-price {
    font-size: 14px;
  }

  .original-price {
    display: none;
  }

  .buy-btn,
  .add-cart-btn {
    font-size: 10px;
    padding: 4px 6px;
  }

  .fab-button {
    width: 48px;
    height: 48px;
  }
}
</style>
