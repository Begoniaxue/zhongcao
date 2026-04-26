<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useCouponStore } from '../stores/coupon'
import { computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const couponStore = useCouponStore()

const checkoutItems = computed(() => couponStore.checkoutItems)
const checkoutTotal = computed(() => couponStore.checkoutTotal)
const checkoutCount = computed(() => couponStore.checkoutCount)

function goBack() {
  router.back()
}

async function handlePayment() {
  if (checkoutItems.value.length === 0) {
    ElMessage.warning('没有待支付的商品')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要支付吗？\n合计：¥${checkoutTotal.value.toFixed(2)}`,
      '确认支付',
      {
        confirmButtonText: '确认支付',
        cancelButtonText: '取消',
        type: 'info'
      }
    )

    for (const item of checkoutItems.value) {
      if (item.coupon.stock < item.quantity) {
        ElMessage.error(`${item.coupon.title} 库存不足`)
        return
      }
    }

    for (const item of checkoutItems.value) {
      item.coupon.stock -= item.quantity
      item.coupon.soldCount += item.quantity
    }

    const couponIds = checkoutItems.value.map(item => item.coupon.id)
    couponIds.forEach(id => {
      couponStore.removeFromCart(id)
    })

    couponStore.clearCheckout()

    ElMessage.success(`支付成功！共支付 ¥${checkoutTotal.value.toFixed(2)}`)
    router.push('/coupon-list')
  } catch {}
}

onMounted(() => {
  if (checkoutItems.value.length === 0) {
    ElMessage.warning('没有待支付的商品')
    router.back()
  }
})
</script>

<template>
  <div class="checkout-container">
    <div class="header-bar">
      <div class="header-back" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
      </div>
      <div class="header-title">确认订单</div>
      <div class="header-placeholder"></div>
    </div>

    <div class="checkout-content" v-if="checkoutItems.length > 0">
      <div class="section-title">商品列表</div>
      
      <div class="item-list">
        <div
          v-for="item in checkoutItems"
          :key="item.coupon.id"
          class="checkout-item"
        >
          <div class="item-image">
            <img :src="item.coupon.mainImage" :alt="item.coupon.title" />
          </div>
          
          <div class="item-info">
            <h3 class="item-title">{{ item.coupon.title }}</h3>
            <p class="item-subtitle">{{ item.coupon.subtitle }}</p>
            
            <div class="item-bottom">
              <div class="price-row">
                <span class="current-price">¥{{ item.coupon.price }}</span>
                <span class="original-price">¥{{ item.coupon.originalPrice }}</span>
              </div>
              
              <div class="quantity-info">
                x{{ item.quantity }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="summary-section">
        <div class="summary-row">
          <span class="summary-label">商品数量</span>
          <span class="summary-value">{{ checkoutCount }} 件</span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-row total-row">
          <span class="summary-label">应付金额</span>
          <span class="summary-value total-price">¥{{ checkoutTotal.toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <div class="bottom-bar">
      <div class="amount-info">
        <span class="amount-label">应付：</span>
        <span class="amount-value">¥{{ checkoutTotal.toFixed(2) }}</span>
      </div>
      <button 
        class="pay-btn" 
        :disabled="checkoutItems.length === 0"
        @click="handlePayment"
      >
        付款
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { ArrowLeft } from '@element-plus/icons-vue'

export default {
  name: 'CheckoutView',
  components: {
    ArrowLeft
  }
}
</script>

<style scoped>
.checkout-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 80px;
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

.checkout-content {
  padding: 12px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.item-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.checkout-item {
  background: white;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
}

.item-image {
  width: 100px;
  height: 75px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f0f0f0;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.item-subtitle {
  font-size: 12px;
  color: #999;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.current-price {
  font-size: 16px;
  font-weight: 700;
  color: #f5576c;
}

.original-price {
  font-size: 12px;
  color: #bbb;
  text-decoration: line-through;
}

.quantity-info {
  font-size: 14px;
  font-weight: 500;
  color: #666;
}

.summary-section {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
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
  font-weight: 500;
  color: #333;
}

.summary-divider {
  height: 1px;
  background-color: #f0f0f0;
  margin: 12px 0;
}

.total-row {
  padding-top: 4px;
}

.total-row .summary-label {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.total-price {
  font-size: 20px;
  font-weight: 700;
  color: #f5576c;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.08);
  z-index: 100;
}

.amount-info {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.amount-label {
  font-size: 14px;
  color: #666;
}

.amount-value {
  font-size: 22px;
  font-weight: 700;
  color: #f5576c;
}

.pay-btn {
  min-width: 120px;
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

.pay-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.pay-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

@media (min-width: 768px) {
  .checkout-container {
    max-width: 600px;
    margin: 0 auto;
  }

  .header-bar {
    max-width: 600px;
    margin: 0 auto;
    left: 50%;
    transform: translateX(-50%);
  }

  .bottom-bar {
    max-width: 600px;
    margin: 0 auto;
    left: 50%;
    transform: translateX(-50%);
  }

  .item-image {
    width: 120px;
    height: 90px;
  }

  .item-title {
    font-size: 15px;
  }

  .current-price {
    font-size: 18px;
  }

  .total-price {
    font-size: 24px;
  }

  .amount-value {
    font-size: 24px;
  }

  .pay-btn {
    min-width: 140px;
    height: 48px;
    font-size: 16px;
  }
}

@media (max-width: 360px) {
  .item-image {
    width: 80px;
    height: 60px;
  }

  .item-title {
    font-size: 13px;
  }

  .current-price {
    font-size: 14px;
  }

  .total-price {
    font-size: 18px;
  }

  .amount-value {
    font-size: 18px;
  }

  .pay-btn {
    min-width: 100px;
    height: 40px;
    font-size: 14px;
  }
}
</style>
