<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCouponStore } from '../../stores/coupon'
import { ElMessage } from 'element-plus'

const router = useRouter()
const couponStore = useCouponStore()

const checkoutItems = computed(() => couponStore.checkoutItems)
const checkoutTotal = computed(() => couponStore.checkoutTotal)
const checkoutCount = computed(() => couponStore.checkoutCount)

const isSubmitting = ref(false)
let submitTimer: number | null = null

function goBack() {
  router.back()
}

async function handleSubmitOrder() {
  if (isSubmitting.value) return
  
  if (checkoutItems.value.length === 0) {
    ElMessage.warning('没有要购买的商品')
    return
  }
  
  for (const item of checkoutItems.value) {
    if (item.coupon.stock < item.quantity) {
      ElMessage.error(`${item.coupon.title} 库存不足`)
      return
    }
  }
  
  isSubmitting.value = true
  
  if (submitTimer) {
    clearTimeout(submitTimer)
  }
  
  submitTimer = window.setTimeout(async () => {
    try {
      for (const item of checkoutItems.value) {
        item.coupon.stock -= item.quantity
        item.coupon.soldCount += item.quantity
        
        couponStore.removeFromCart(item.coupon.id)
      }
      
      router.push({
        path: '/order',
        query: {
          total: checkoutTotal.value.toString(),
          count: checkoutCount.value.toString()
        }
      })
    } catch (error) {
      ElMessage.error('订单提交失败，请重试')
    } finally {
      isSubmitting.value = false
    }
  }, 300)
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
</script>

<template>
  <div class="checkout-container">
    <div class="checkout-header">
      <el-button type="text" class="back-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <span class="header-title">确认订单</span>
      <div class="header-placeholder"></div>
    </div>

    <div v-if="checkoutItems.length === 0" class="empty-checkout">
      <div class="empty-icon">
        <el-icon size="64"><Document /></el-icon>
      </div>
      <p class="empty-text">没有要购买的商品</p>
    </div>

    <template v-else>
      <div class="checkout-section">
        <div class="section-header">
          <h3 class="section-title">商品清单</h3>
          <span class="item-count">共 {{ checkoutCount }} 件</span>
        </div>
        
        <div class="goods-list">
          <div
            v-for="(item, index) in checkoutItems"
            :key="item.coupon.id"
            class="goods-item"
          >
            <div class="goods-image">
              <img :src="getImageUrl(index)" :alt="item.coupon.title" />
            </div>
            <div class="goods-info">
              <h4 class="goods-title">{{ item.coupon.title }}</h4>
              <p class="goods-subtitle">{{ item.coupon.subtitle }}</p>
              <div class="goods-footer">
                <span class="goods-price">¥{{ item.coupon.price }}</span>
                <span class="goods-quantity">x {{ item.quantity }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="checkout-section">
        <div class="section-header">
          <h3 class="section-title">订单摘要</h3>
        </div>
        
        <div class="summary-list">
          <div class="summary-row">
            <span class="summary-label">商品数量</span>
            <span class="summary-value">{{ checkoutCount }} 件</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">商品金额</span>
            <span class="summary-value">¥{{ checkoutTotal.toFixed(2) }}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">优惠金额</span>
            <span class="summary-value discount">- ¥0.00</span>
          </div>
          <div class="summary-row total-row">
            <span class="summary-label">实付金额</span>
            <span class="summary-value total">¥{{ checkoutTotal.toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <div class="bottom-spacer"></div>
    </template>

    <div v-if="checkoutItems.length > 0" class="fixed-bottom-bar">
      <div class="bottom-content">
        <div class="price-summary">
          <span class="summary-label">实付：</span>
          <span class="summary-price">¥{{ checkoutTotal.toFixed(2) }}</span>
        </div>
        <el-button
          type="primary"
          class="submit-btn"
          :loading="isSubmitting"
          @click="handleSubmitOrder"
        >
          {{ isSubmitting ? '提交中...' : '提交订单' }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ArrowLeft, Document } from '@element-plus/icons-vue'

export default {
  components: {
    ArrowLeft,
    Document
  }
}
</script>

<style scoped>
.checkout-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 70px;
}

.checkout-header {
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

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.header-placeholder {
  width: 32px;
}

.empty-checkout {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 0;
}

.empty-icon {
  color: #ddd;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 14px;
  color: #999;
}

.checkout-section {
  background: white;
  margin: 12px;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.item-count {
  font-size: 12px;
  color: #999;
}

.goods-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.goods-item {
  display: flex;
  gap: 12px;
  padding: 8px 0;
}

.goods-image {
  width: 70px;
  height: 70px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f0f0f0;
  flex-shrink: 0;
}

.goods-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.goods-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.goods-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin: 0 0 4px 0;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.goods-subtitle {
  font-size: 12px;
  color: #999;
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.goods-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.goods-price {
  font-size: 16px;
  font-weight: 700;
  color: #ff6b6b;
}

.goods-quantity {
  font-size: 13px;
  color: #999;
}

.summary-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-label {
  font-size: 14px;
  color: #666;
}

.summary-value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.summary-value.discount {
  color: #67c23a;
}

.total-row {
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  margin-top: 4px;
}

.summary-value.total {
  font-size: 18px;
  font-weight: 700;
  color: #ff6b6b;
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
}

.price-summary {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.summary-label {
  font-size: 14px;
  color: #666;
}

.summary-price {
  font-size: 20px;
  font-weight: 700;
  color: #ff6b6b;
}

.submit-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  font-size: 15px;
  font-weight: 500;
  padding: 12px 28px;
  height: auto;
}

.submit-btn:hover {
  background: linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%);
}

.submit-btn:disabled {
  opacity: 0.8;
}

@media (min-width: 768px) {
  .checkout-container {
    max-width: 600px;
    margin: 0 auto;
  }

  .checkout-header {
    padding: 12px 24px;
  }

  .checkout-section {
    margin: 16px 24px;
    padding: 20px;
  }

  .goods-item {
    gap: 16px;
  }

  .goods-image {
    width: 80px;
    height: 80px;
  }

  .goods-title {
    font-size: 15px;
  }

  .fixed-bottom-bar {
    padding: 14px 24px;
  }

  .summary-price {
    font-size: 22px;
  }

  .submit-btn {
    font-size: 16px;
    padding: 14px 36px;
  }
}

@media (max-width: 360px) {
  .checkout-header {
    padding: 10px 12px;
  }

  .checkout-section {
    margin: 8px;
    padding: 12px;
  }

  .goods-item {
    gap: 10px;
  }

  .goods-image {
    width: 60px;
    height: 60px;
  }

  .goods-title {
    font-size: 13px;
  }

  .goods-price {
    font-size: 14px;
  }

  .fixed-bottom-bar {
    padding: 8px 12px;
  }

  .summary-price {
    font-size: 18px;
  }

  .submit-btn {
    font-size: 14px;
    padding: 10px 24px;
  }
}
</style>
