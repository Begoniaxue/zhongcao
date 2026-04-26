<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useCouponStore, type CartItem } from '../stores/coupon'
import { computed, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Minus, Plus, Delete, CircleCheckFilled } from '@element-plus/icons-vue'

const router = useRouter()
const couponStore = useCouponStore()

const selectedItems = ref<Set<number>>(new Set())

const cartItems = computed(() => couponStore.cart)

const isAllSelected = computed(() => {
  if (cartItems.value.length === 0) return false
  return cartItems.value.every(item => selectedItems.value.has(item.coupon.id))
})

const selectedCount = computed(() => {
  let count = 0
  cartItems.value.forEach(item => {
    if (selectedItems.value.has(item.coupon.id)) {
      count += item.quantity
    }
  })
  return count
})

const selectedTotal = computed(() => {
  let total = 0
  cartItems.value.forEach(item => {
    if (selectedItems.value.has(item.coupon.id)) {
      total += item.coupon.price * item.quantity
    }
  })
  return total
})

function goBack() {
  router.back()
}

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedItems.value.clear()
  } else {
    cartItems.value.forEach(item => {
      selectedItems.value.add(item.coupon.id)
    })
  }
}

function toggleSelectItem(couponId: number) {
  if (selectedItems.value.has(couponId)) {
    selectedItems.value.delete(couponId)
  } else {
    selectedItems.value.add(couponId)
  }
}

function decreaseQuantity(item: CartItem) {
  if (item.quantity > 1) {
    couponStore.updateCartItemQuantity(item.coupon.id, item.quantity - 1)
  }
}

function increaseQuantity(item: CartItem) {
  if (item.quantity < item.coupon.stock) {
    couponStore.updateCartItemQuantity(item.coupon.id, item.quantity + 1)
  }
}

function removeItem(couponId: number) {
  ElMessageBox.confirm('确定要从购物车移除该商品吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    couponStore.removeFromCart(couponId)
    selectedItems.value.delete(couponId)
    ElMessage.success('已移除')
  }).catch(() => {})
}

function removeSelected() {
  if (selectedItems.value.size === 0) {
    ElMessage.warning('请先选择要移除的商品')
    return
  }

  ElMessageBox.confirm(`确定要移除选中的 ${selectedCount.value} 件商品吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    selectedItems.value.forEach(couponId => {
      couponStore.removeFromCart(couponId)
    })
    selectedItems.value.clear()
    ElMessage.success('已移除选中商品')
  }).catch(() => {})
}

function handleCheckout() {
  if (selectedItems.value.size === 0) {
    ElMessage.warning('请先选择要购买的商品')
    return
  }

  const itemsToCheckout = cartItems.value.filter(item => 
    selectedItems.value.has(item.coupon.id)
  )

  couponStore.setCheckoutItems(itemsToCheckout)
  router.push('/checkout')
}

watch(cartItems, (newItems) => {
  const currentIds = new Set(newItems.map(item => item.coupon.id))
  selectedItems.value.forEach(id => {
    if (!currentIds.has(id)) {
      selectedItems.value.delete(id)
    }
  })
}, { deep: true })
</script>

<template>
  <div class="cart-container">
    <div class="header-bar">
      <div class="header-back" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
      </div>
      <div class="header-title">购物车</div>
      <div class="header-action" v-if="cartItems.length > 0" @click="removeSelected">
        删除
      </div>
    </div>

    <div class="cart-content" v-if="cartItems.length > 0">
      <div class="cart-list">
        <div
          v-for="item in cartItems"
          :key="item.coupon.id"
          class="cart-item"
          :class="{ 'is-selected': selectedItems.has(item.coupon.id) }"
        >
          <div class="item-checkbox" @click="toggleSelectItem(item.coupon.id)">
            <el-icon v-if="selectedItems.has(item.coupon.id)" class="checked-icon"><CircleCheckFilled /></el-icon>
            <div v-else class="unchecked-box"></div>
          </div>

          <div class="item-image" @click="router.push(`/coupon-detail/${item.coupon.id}`)">
            <img :src="item.coupon.mainImage" :alt="item.coupon.title" />
            <div v-if="item.coupon.stock < 20" class="stock-tag">
              仅剩{{ item.coupon.stock }}张
            </div>
          </div>

          <div class="item-info">
            <h3 class="item-title">{{ item.coupon.title }}</h3>
            <p class="item-subtitle">{{ item.coupon.subtitle }}</p>
            
            <div class="item-bottom">
              <div class="price-row">
                <span class="current-price">¥{{ item.coupon.price }}</span>
                <span class="original-price">¥{{ item.coupon.originalPrice }}</span>
              </div>

              <div class="quantity-control">
                <button 
                  class="quantity-btn" 
                  :disabled="item.quantity <= 1"
                  @click="decreaseQuantity(item)"
                >
                  <el-icon><Minus /></el-icon>
                </button>
                <span class="quantity-value">{{ item.quantity }}</span>
                <button 
                  class="quantity-btn" 
                  :disabled="item.quantity >= item.coupon.stock"
                  @click="increaseQuantity(item)"
                >
                  <el-icon><Plus /></el-icon>
                </button>
              </div>
            </div>
          </div>

          <div class="item-remove" @click="removeItem(item.coupon.id)">
            <el-icon><Delete /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <div class="empty-cart" v-else>
      <div class="empty-icon"></div>
      <p class="empty-text">购物车是空的</p>
      <el-button type="primary" class="go-shop-btn" @click="router.push('/coupon-list')">
        去逛逛
      </el-button>
    </div>

    <div class="bottom-bar" v-if="cartItems.length > 0">
      <div class="select-all" @click="toggleSelectAll">
        <div class="checkbox-wrapper">
          <el-icon v-if="isAllSelected" class="checked-icon"><CircleCheckFilled /></el-icon>
          <div v-else class="unchecked-box"></div>
        </div>
        <span class="select-all-text">全选</span>
      </div>

      <div class="summary-section">
        <div class="summary-text">
          <span>合计：</span>
          <span class="total-price">¥{{ selectedTotal.toFixed(2) }}</span>
        </div>
        <div class="selected-info">
          已选 {{ selectedCount }} 件
        </div>
      </div>

      <button 
        class="checkout-btn" 
        :disabled="selectedCount === 0"
        @click="handleCheckout"
      >
        去结算
      </button>
    </div>
  </div>
</template>

<style scoped>
.cart-container {
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

.header-action {
  width: 36px;
  font-size: 14px;
  color: #667eea;
  cursor: pointer;
  text-align: right;
}

.cart-content {
  padding: 12px;
}

.cart-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cart-item {
  background: white;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
  transition: all 0.2s;
}

.cart-item.is-selected {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  border: 1px solid rgba(102, 126, 234, 0.2);
}

.item-checkbox {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-top: 2px;
}

.checked-icon {
  font-size: 24px;
  color: #667eea;
}

.unchecked-box {
  width: 20px;
  height: 20px;
  border: 2px solid #ddd;
  border-radius: 50%;
}

.item-image {
  width: 100px;
  height: 75px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  background-color: #f0f0f0;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.stock-tag {
  position: absolute;
  bottom: 4px;
  left: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.6);
  color: #ffd700;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  text-align: center;
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
  font-weight: 500;
  color: #333;
  margin: 0;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.item-subtitle {
  font-size: 11px;
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
  font-size: 11px;
  color: #bbb;
  text-decoration: line-through;
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.quantity-btn {
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 50%;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
  padding: 0;
}

.quantity-btn:hover:not(:disabled) {
  background: #667eea;
  color: white;
}

.quantity-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.quantity-value {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  min-width: 24px;
  text-align: center;
}

.item-remove {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #999;
  transition: color 0.2s;
}

.item-remove:hover {
  color: #f5576c;
}

.empty-cart {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
}

.empty-icon {
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, #f0f0f0 0%, #e8e8e8 100%);
  border-radius: 50%;
  margin-bottom: 20px;
  position: relative;
}

.empty-icon::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 50px;
  height: 40px;
  border: 3px solid #ccc;
  border-radius: 6px;
}

.empty-icon::after {
  content: '';
  position: absolute;
  top: 30px;
  left: 35px;
  width: 16px;
  height: 16px;
  border: 3px solid #ccc;
  border-radius: 50%;
}

.empty-text {
  font-size: 15px;
  color: #999;
  margin-bottom: 24px;
}

.go-shop-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  padding: 10px 32px;
  border-radius: 20px;
  font-size: 14px;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 10px 16px;
  background: white;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.08);
  z-index: 100;
}

.select-all {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.select-all-text {
  font-size: 14px;
  color: #333;
}

.summary-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-right: 12px;
}

.summary-text {
  font-size: 13px;
  color: #666;
}

.total-price {
  font-size: 20px;
  font-weight: 700;
  color: #f5576c;
}

.selected-info {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}

.checkout-btn {
  height: 40px;
  padding: 0 24px;
  border: none;
  border-radius: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.checkout-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.checkout-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

@media (min-width: 768px) {
  .header-bar {
    max-width: 600px;
    margin: 0 auto;
    left: 50%;
    transform: translateX(-50%);
  }

  .cart-content {
    max-width: 600px;
    margin: 0 auto;
    padding: 16px 24px;
  }

  .bottom-bar {
    max-width: 600px;
    margin: 0 auto;
    left: 50%;
    transform: translateX(-50%);
  }

  .cart-item {
    padding: 16px;
    gap: 16px;
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

  .checkout-btn {
    height: 44px;
    padding: 0 32px;
    font-size: 15px;
  }
}

@media (max-width: 360px) {
  .cart-item {
    padding: 10px;
    gap: 10px;
  }

  .item-image {
    width: 80px;
    height: 60px;
  }

  .item-title {
    font-size: 12px;
  }

  .item-subtitle {
    font-size: 10px;
  }

  .current-price {
    font-size: 14px;
  }

  .quantity-btn {
    width: 22px;
    height: 22px;
  }

  .quantity-value {
    font-size: 12px;
    min-width: 20px;
  }

  .total-price {
    font-size: 18px;
  }

  .checkout-btn {
    height: 36px;
    padding: 0 16px;
    font-size: 13px;
  }
}
</style>
