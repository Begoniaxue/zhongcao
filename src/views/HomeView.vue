<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCouponStore } from '../stores/coupon'
import { ElCarousel, ElCarouselItem } from 'element-plus'

const router = useRouter()
const couponStore = useCouponStore()

const carouselItems = ref([
  {
    id: 1,
    title: '夏日特惠',
    subtitle: '全场卡券低至5折',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=summer%20sale%20banner%20with%20vibrant%20colors%20and%20discount%20tags&image_size=landscape_16_9',
    link: '/coupon-list'
  },
  {
    id: 2,
    title: '音乐新发现',
    subtitle: '精选歌单每日更新',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=music%20festival%20banner%20with%20headphones%20and%20sound%20waves&image_size=landscape_16_9',
    link: '/music'
  },
  {
    id: 3,
    title: '种草社区',
    subtitle: '分享美好生活',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=social%20media%20community%20banner%20with%20people%20sharing%20content&image_size=landscape_16_9',
    link: '/community'
  }
])

const functionEntries = ref([
  {
    id: 1,
    name: '种草社区',
    icon: '🌱',
    color: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
    path: '/community'
  },
  {
    id: 2,
    name: '音乐',
    icon: '🎵',
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    path: '/music'
  },
  {
    id: 3,
    name: '电影',
    icon: '🎬',
    color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    path: '/movie'
  },
  {
    id: 4,
    name: '卡券',
    icon: '🎫',
    color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    path: '/coupon-list'
  },
  {
    id: 5,
    name: '数据驾驶舱',
    icon: '📊',
    color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    path: '/mall-dashboard'
  }
])

const recommendedCoupons = computed(() => {
  return couponStore.coupons.slice(0, 4)
})

function goToPage(path: string) {
  router.push(path)
}

function goToCouponDetail(id: number) {
  router.push(`/coupon-detail/${id}`)
}
</script>

<template>
  <div class="home-page">
    <div class="carousel-section">
      <el-carousel height="160px" :autoplay="true" :interval="4000">
        <el-carousel-item v-for="item in carouselItems" :key="item.id">
          <div class="carousel-item" @click="goToPage(item.link)">
            <img :src="item.image" :alt="item.title" class="carousel-image" />
            <div class="carousel-overlay">
              <div class="carousel-title">{{ item.title }}</div>
              <div class="carousel-subtitle">{{ item.subtitle }}</div>
            </div>
          </div>
        </el-carousel-item>
      </el-carousel>
    </div>

    <div class="function-section">
      <div class="section-title">功能入口</div>
      <div class="function-grid">
        <div
          v-for="entry in functionEntries"
          :key="entry.id"
          class="function-card"
          @click="goToPage(entry.path)"
        >
          <div class="function-icon" :style="{ background: entry.color }">
            <span>{{ entry.icon }}</span>
          </div>
          <div class="function-name">{{ entry.name }}</div>
        </div>
      </div>
    </div>

    <div class="coupon-section">
      <div class="section-header">
        <div class="section-title">推荐卡券</div>
        <div class="see-more" @click="goToPage('/coupon-list')">
          查看更多
          <span class="arrow">›</span>
        </div>
      </div>
      <div class="coupon-grid">
        <div
          v-for="coupon in recommendedCoupons"
          :key="coupon.id"
          class="coupon-card"
          @click="goToCouponDetail(coupon.id)"
        >
          <div class="coupon-image">
            <img :src="coupon.mainImage" :alt="coupon.title" />
            <div class="coupon-discount">{{ coupon.discount }}</div>
          </div>
          <div class="coupon-info">
            <div class="coupon-title">{{ coupon.title }}</div>
            <div class="coupon-subtitle">{{ coupon.subtitle }}</div>
            <div class="coupon-price-row">
              <div class="coupon-price">
                <span class="currency">¥</span>
                <span class="amount">{{ coupon.price }}</span>
              </div>
              <div class="coupon-original-price">¥{{ coupon.originalPrice }}</div>
            </div>
            <div class="coupon-sold">已售 {{ coupon.soldCount }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 90px;
}

.carousel-section {
  padding: 12px;
}

.carousel-section :deep(.el-carousel) {
  border-radius: 12px;
  overflow: hidden;
}

.carousel-section :deep(.el-carousel__indicators) {
  position: absolute;
  bottom: 8px;
  left: 0;
  right: 0;
  margin: 0;
  height: auto;
  line-height: 1;
}

.carousel-section :deep(.el-carousel__indicator) {
  padding: 4px 2px;
}

.carousel-section :deep(.el-carousel__button) {
  width: 16px;
  height: 3px;
  border-radius: 2px;
  opacity: 0.6;
  background-color: rgba(255, 255, 255, 0.8);
}

.carousel-section :deep(.is-active .el-carousel__button) {
  opacity: 1;
  background-color: #fff;
}

.carousel-item {
  width: 100%;
  height: 100%;
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
}

.carousel-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.carousel-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px 16px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
  color: white;
}

.carousel-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 4px;
}

.carousel-subtitle {
  font-size: 13px;
  opacity: 0.9;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.function-section {
  padding: 0 12px 16px;
}

.function-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  background: white;
  padding: 16px;
  border-radius: 12px;
}

.function-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s;
}

.function-card:active {
  transform: scale(0.95);
}

.function-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.function-icon span {
  font-size: 26px;
}

.function-name {
  font-size: 12px;
  color: #333;
  font-weight: 500;
  text-align: center;
}

.coupon-section {
  padding: 0 12px 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.see-more {
  font-size: 13px;
  color: #667eea;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 2px;
}

.arrow {
  font-size: 16px;
  font-weight: 500;
}

.coupon-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.coupon-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s, box-shadow 0.2s;
}

.coupon-card:active {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.coupon-image {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  background-color: #f0f0f0;
}

.coupon-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.coupon-discount {
  position: absolute;
  top: 8px;
  right: 8px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}

.coupon-info {
  padding: 10px;
}

.coupon-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.coupon-subtitle {
  font-size: 11px;
  color: #999;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.coupon-price-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 4px;
}

.coupon-price {
  display: flex;
  align-items: baseline;
  color: #f5576c;
}

.currency {
  font-size: 12px;
  font-weight: 500;
}

.amount {
  font-size: 18px;
  font-weight: 700;
}

.coupon-original-price {
  font-size: 11px;
  color: #bbb;
  text-decoration: line-through;
}

.coupon-sold {
  font-size: 10px;
  color: #bbb;
}

@media (min-width: 768px) {
  .home-page {
    max-width: 800px;
    margin: 0 auto;
  }

  .carousel-section {
    padding: 16px 24px;
  }

  :deep(.el-carousel) {
    border-radius: 16px;
    overflow: hidden;
  }

  .function-section {
    padding: 0 24px 20px;
  }

  .function-grid {
    padding: 20px;
    gap: 16px;
  }

  .function-icon {
    width: 64px;
    height: 64px;
    border-radius: 16px;
  }

  .function-icon span {
    font-size: 32px;
  }

  .function-name {
    font-size: 13px;
  }

  .coupon-section {
    padding: 0 24px 24px;
  }

  .coupon-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }

  .coupon-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  }
}

@media (max-width: 360px) {
  .function-grid {
    gap: 8px;
    padding: 12px;
  }

  .function-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
  }

  .function-icon span {
    font-size: 20px;
  }

  .function-name {
    font-size: 10px;
  }

  .coupon-grid {
    gap: 8px;
  }

  .coupon-info {
    padding: 8px;
  }

  .coupon-title {
    font-size: 12px;
  }

  .amount {
    font-size: 16px;
  }
}
</style>
