<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCouponStore, type CartItem } from '../../stores/coupon'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const couponStore = useCouponStore()

const cartItems = computed(() => couponStore.cart)

const selectedItems = ref<Set<number>>(new Set())

const selectedTotal = computed(() => {
  let total = 0
  for (const item of cartItems.value) {
    if (selectedItems.value.has(item.coupon.id)) {
      total += item.coupon.price * item.quantity
    }
  }
  return total
})

const selectedCount = computed(() => {
  let count = 0
  for (const item of cartItems.value) {
    if (selectedItems.value.has(item.coupon.id)) {
      count += item.quantity
    }
  }
  return count
})

const isAllSelected = computed(() => {
  return cartItems.value.length > 0 && cartItems.value.every(item => selectedItems.value.has(item.coupon.id))
})

function toggleSelectItem(item: CartItem) {
  if (selectedItems.value.has(item.coupon.id)) {
    selectedItems.value.delete(item.coupon.id)
  } else {
    selectedItems.value.add(item.coupon.id)
  }
}

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedItems.value.clear()
  } else {
    for (const item of cartItems.value) {
      selectedItems.value.add(item.coupon.id)
    }
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

async function removeItem(item: CartItem) {
  try {
    await ElMessageBox.confirm(`确定要删除"${item.coupon.title}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    couponStore.removeFromCart(item.coupon.id)
    selectedItems.value.delete(item.coupon.id)
    ElMessage.success('已删除')
  } catch {
    // 用户取消
  }
}

function handleCheckout() {
  if (selectedCount.value === 0) {
    ElMessage.warning('请选择要购买的商品')
    return
  }
  
  const itemsToCheckout: CartItem[] = []
  for (const item of cartItems.value) {
    if (selectedItems.value.has(item.coupon.id)) {
      itemsToCheckout.push({ ...item })
    }
  }
  
  couponStore.setCheckoutItems(itemsToCheckout)
  router.push('/checkout')
}

function goBack() {
  router.back()
}

function goToCouponList() {
  router.push('/coupon-list')
}
</script>

<template>
  <div class="cart-container">
    <div class="cart-header">
      <el-button type="text" class="back-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <span class="header-title">购物车</span>
      <div class="header-placeholder"></div>
    </div>

    <div v-if="cartItems.length === 0" class="empty-cart">
      <div class="empty-icon">
        <el-icon size="64"><ShoppingCart /></el-icon>
      </div>
      <p class="empty-text">购物车是空的</p>
      <el-button type="primary" class="go-shopping-btn" @click="goToCouponList">
        去逛逛
      </el-button>
    </div>

    <template v-else>
      <div class="cart-list">
        <div
          v-for="item in cartItems"
          :key="item.coupon.id"
          class="cart-item"
        >
          <div class="item-checkbox" @click="toggleSelectItem(item)">
            <el-checkbox :model-value="selectedItems.has(item.coupon.id)" />
          </div>
          
          <div class="item-image">
            <img :src="item.coupon.mainImage" :alt="item.coupon.title" />
          </div>
          
          <div class="item-info">
            <h3 class="item-title">{{ item.coupon.title }}</h3>
            <p class="item-subtitle">{{ item.coupon.subtitle }}</p>
            <div class="item-footer">
              <div class="price-section">
                <span class="current-price">¥{{ item.coupon.price }}</span>
                <span class="original-price">¥{{ item.coupon.originalPrice }}</span>
              </div>
              <div class="quantity-controls">
                <el-button
                  type="default"
                  size="small"
                  :disabled="item.quantity <= 1"
                  @click="decreaseQuantity(item)"
                >
                  <el-icon><Minus /></el-icon>
                </el-button>
                <span class="quantity-value">{{ item.quantity }}</span>
                <el-button
                  type="default"
                  size="small"
                  :disabled="item.coupon.stock <= item.quantity"
                  @click="increaseQuantity(item)"
                >
                  <el-icon><Plus /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
          
          <el-button
            type="text"
            class="delete-btn"
            @click="removeItem(item)"
          >
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
      </div>

      <div class="bottom-spacer"></div>
    </template>

    <div v-if="cartItems.length > 0" class="fixed-bottom-bar">
      <div class="bottom-content">
        <div class="select-all-section" @click="toggleSelectAll">
          <el-checkbox :model-value="isAllSelected" />
          <span class="select-all-text">全选</span>
        </div>
        
        <div class="summary-section">
          <div class="summary-info">
            <span class="summary-label">合计：</span>
            <span class="summary-price">¥{{ selectedTotal.toFixed(2) }}</span>
          </div>
          <span class="summary-count">共 {{ selectedCount }} 件</span>
        </div>
        
        <el-button
          type="primary"
          class="checkout-btn"
          :class="{ 'has-items': selectedCount > 0 }"
          @click="handleCheckout"
        >
          结算
          <span v-if="selectedCount > 0">({{ selectedCount }})</span>
        </el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ArrowLeft, ShoppingCart, Minus, Plus, Delete } from '@element-plus/icons-vue'

export default {
  components: {
    ArrowLeft,
    ShoppingCart,
    Minus,
    Plus,
    Delete
  }
}
</script>

<style scoped>
.cart-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 70px;
}

.cart-header {
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

.empty-cart {
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
  margin-bottom: 20px;
}

.go-shopping-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.cart-list {
  padding: 12px;
}

.cart-item {
  background: white;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 10px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.item-checkbox {
  padding-top: 4px;
  cursor: pointer;
}

.item-image {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f0f0f0;
  flex-shrink: 0;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
  line-height: 1.4;
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

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.price-section {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.current-price {
  font-size: 16px;
  font-weight: 700;
  color: #ff6b6b;
}

.original-price {
  font-size: 11px;
  color: #999;
  text-decoration: line-through;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.quantity-value {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  min-width: 24px;
  text-align: center;
}

.delete-btn {
  color: #999;
  padding: 4px;
}

.delete-btn:hover {
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
  align-items: center;
  justify-content: space-between;
}

.select-all-section {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.select-all-text {
  font-size: 13px;
  color: #333;
}

.summary-section {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.summary-info {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.summary-label {
  font-size: 13px;
  color: #666;
}

.summary-price {
  font-size: 18px;
  font-weight: 700;
  color: #ff6b6b;
}

.summary-count {
  font-size: 11px;
  color: #999;
}

.checkout-btn {
  background: #ccc;
  border: none;
  font-size: 14px;
  padding: 10px 24px;
  height: auto;
}

.checkout-btn.has-items {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.checkout-btn:hover {
  background: #bbb;
}

.checkout-btn.has-items:hover {
  background: linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%);
}

@media (min-width: 768px) {
  .cart-container {
    max-width: 600px;
    margin: 0 auto;
  }

  .cart-header {
    padding: 12px 24px;
  }

  .cart-list {
    padding: 16px;
  }

  .cart-item {
    padding: 16px;
    margin-bottom: 12px;
  }

  .item-image {
    width: 90px;
    height: 90px;
  }

  .item-title {
    font-size: 15px;
  }

  .current-price {
    font-size: 18px;
  }

  .fixed-bottom-bar {
    padding: 14px 24px;
  }

  .summary-price {
    font-size: 20px;
  }

  .checkout-btn {
    font-size: 15px;
    padding: 12px 28px;
  }
}

@media (max-width: 360px) {
  .cart-header {
    padding: 10px 12px;
  }

  .cart-list {
    padding: 8px;
  }

  .cart-item {
    padding: 10px;
    margin-bottom: 8px;
    gap: 8px;
  }

  .item-image {
    width: 70px;
    height: 70px;
  }

  .item-title {
    font-size: 13px;
  }

  .item-subtitle {
    font-size: 11px;
  }

  .current-price {
    font-size: 14px;
  }

  .fixed-bottom-bar {
    padding: 8px 12px;
  }

  .summary-price {
    font-size: 16px;
  }

  .checkout-btn {
    font-size: 13px;
    padding: 8px 20px;
  }
}
</style>
