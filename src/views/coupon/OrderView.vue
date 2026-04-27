<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCouponStore } from '../../stores/coupon'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const couponStore = useCouponStore()

const paymentAmount = ref(0)
const itemCount = ref(0)
const selectedPayment = ref<'alipay' | 'wechat'>('alipay')
const isPaying = ref(false)

onMounted(() => {
  const total = route.query.total
  const count = route.query.count
  
  if (total) {
    paymentAmount.value = parseFloat(total as string)
  }
  if (count) {
    itemCount.value = parseInt(count as string)
  }
  
  if (paymentAmount.value === 0 && couponStore.checkoutTotal > 0) {
    paymentAmount.value = couponStore.checkoutTotal
    itemCount.value = couponStore.checkoutCount
  }
})

function selectPayment(method: 'alipay' | 'wechat') {
  selectedPayment.value = method
}

async function handlePayment() {
  if (isPaying.value) return
  
  isPaying.value = true
  
  try {
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    couponStore.clearCheckout()
    
    const paymentMethod = selectedPayment.value === 'alipay' ? '支付宝' : '微信支付'
    ElMessage.success(`${paymentMethod}支付成功！`)
    
    setTimeout(() => {
      router.push('/coupon-list')
    }, 1500)
  } catch (error) {
    ElMessage.error('支付失败，请重试')
  } finally {
    isPaying.value = false
  }
}

function goBack() {
  router.back()
}
</script>

<template>
  <div class="order-container">
    <div class="order-header">
      <el-button type="text" class="back-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <span class="header-title">订单支付</span>
      <div class="header-placeholder"></div>
    </div>

    <div class="payment-amount-section">
      <div class="amount-label">支付金额</div>
      <div class="amount-value">
        <span class="currency-symbol">¥</span>
        <span class="amount">{{ paymentAmount.toFixed(2) }}</span>
      </div>
      <div class="amount-desc">共 {{ itemCount }} 件商品</div>
    </div>

    <div class="payment-method-section">
      <div class="section-title">选择支付方式</div>
      
      <div
        :class="['payment-option', { selected: selectedPayment === 'alipay' }]"
        @click="selectPayment('alipay')"
      >
        <div class="payment-icon alipay-icon">
          <el-icon size="28"><Wallet /></el-icon>
        </div>
        <div class="payment-info">
          <div class="payment-name">支付宝</div>
          <div class="payment-desc">推荐使用，安全便捷</div>
        </div>
        <div class="payment-radio">
          <el-radio :model-value="selectedPayment === 'alipay'" />
        </div>
      </div>

      <div
        :class="['payment-option', { selected: selectedPayment === 'wechat' }]"
        @click="selectPayment('wechat')"
      >
        <div class="payment-icon wechat-icon">
          <el-icon size="28"><ChatDotRound /></el-icon>
        </div>
        <div class="payment-info">
          <div class="payment-name">微信支付</div>
          <div class="payment-desc">微信扫码支付</div>
        </div>
        <div class="payment-radio">
          <el-radio :model-value="selectedPayment === 'wechat'" />
        </div>
      </div>
    </div>

    <div class="order-info-section">
      <div class="section-title">订单信息</div>
      <div class="info-list">
        <div class="info-row">
          <span class="info-label">订单编号</span>
          <span class="info-value">{{ Date.now() }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">创建时间</span>
          <span class="info-value">{{ new Date().toLocaleString() }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">支付方式</span>
          <span class="info-value">{{ selectedPayment === 'alipay' ? '支付宝' : '微信支付' }}</span>
        </div>
      </div>
    </div>

    <div class="bottom-spacer"></div>

    <div class="fixed-bottom-bar">
      <div class="bottom-content">
        <div class="price-summary">
          <span class="summary-label">实付：</span>
          <span class="summary-price">¥{{ paymentAmount.toFixed(2) }}</span>
        </div>
        <el-button
          type="primary"
          class="pay-btn"
          :loading="isPaying"
          @click="handlePayment"
        >
          {{ isPaying ? '支付中...' : '立即支付' }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ArrowLeft, Wallet, ChatDotRound } from '@element-plus/icons-vue'

export default {
  components: {
    ArrowLeft,
    Wallet,
    ChatDotRound
  }
}
</script>

<style scoped>
.order-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 70px;
}

.order-header {
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

.payment-amount-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 30px 20px;
  text-align: center;
}

.amount-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 8px;
}

.amount-value {
  display: flex;
  justify-content: center;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 8px;
}

.currency-symbol {
  font-size: 20px;
  color: white;
  font-weight: 600;
}

.amount {
  font-size: 40px;
  color: white;
  font-weight: 700;
}

.amount-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
}

.payment-method-section {
  background: white;
  margin: 12px;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px 0;
}

.payment-option {
  display: flex;
  align-items: center;
  padding: 14px 12px;
  border: 2px solid #f0f0f0;
  border-radius: 10px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.payment-option:last-child {
  margin-bottom: 0;
}

.payment-option.selected {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

.payment-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.alipay-icon {
  background: linear-gradient(135deg, #1677ff 0%, #0a5ccc 100%);
  color: white;
}

.wechat-icon {
  background: linear-gradient(135deg, #07c160 0%, #059e50 100%);
  color: white;
}

.payment-info {
  flex: 1;
}

.payment-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}

.payment-desc {
  font-size: 12px;
  color: #999;
}

.payment-radio {
  padding-left: 8px;
}

.order-info-section {
  background: white;
  margin: 12px;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: 14px;
  color: #666;
}

.info-value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
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

.pay-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  font-size: 15px;
  font-weight: 500;
  padding: 12px 36px;
  height: auto;
}

.pay-btn:hover {
  background: linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%);
}

.pay-btn:disabled {
  opacity: 0.8;
}

@media (min-width: 768px) {
  .order-container {
    max-width: 600px;
    margin: 0 auto;
  }

  .order-header {
    padding: 12px 24px;
  }

  .payment-amount-section {
    padding: 40px 24px;
  }

  .amount {
    font-size: 48px;
  }

  .payment-method-section,
  .order-info-section {
    margin: 16px 24px;
    padding: 20px;
  }

  .payment-option {
    padding: 16px;
  }

  .fixed-bottom-bar {
    padding: 14px 24px;
  }

  .summary-price {
    font-size: 22px;
  }

  .pay-btn {
    font-size: 16px;
    padding: 14px 48px;
  }
}

@media (max-width: 360px) {
  .order-header {
    padding: 10px 12px;
  }

  .payment-amount-section {
    padding: 24px 16px;
  }

  .amount {
    font-size: 32px;
  }

  .payment-method-section,
  .order-info-section {
    margin: 8px;
    padding: 12px;
  }

  .payment-option {
    padding: 12px;
  }

  .payment-icon {
    width: 40px;
    height: 40px;
  }

  .fixed-bottom-bar {
    padding: 8px 12px;
  }

  .summary-price {
    font-size: 18px;
  }

  .pay-btn {
    font-size: 14px;
    padding: 10px 28px;
  }
}
</style>
