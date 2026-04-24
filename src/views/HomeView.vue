<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useArticleStore } from '../stores/article'
import { computed, ref, onMounted, onUnmounted } from 'vue'

const router = useRouter()
const articleStore = useArticleStore()

const allArticles = computed(() => articleStore.articles)
const pageSize = 6
const currentPage = ref(1)
const loading = ref(false)
const hasMore = ref(true)
const visibleArticles = ref<typeof allArticles.value>([])

function loadMore() {
  if (loading.value || !hasMore.value) return

  loading.value = true

  setTimeout(() => {
    const start = 0
    const end = currentPage.value * pageSize
    const newVisible = allArticles.value.slice(start, end)

    visibleArticles.value = newVisible

    if (end >= allArticles.value.length) {
      hasMore.value = false
    } else {
      currentPage.value++
    }

    loading.value = false
  }, 300)
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

const leftColumnArticles = computed(() =>
  visibleArticles.value.filter((_, index) => index % 2 === 0)
)

const rightColumnArticles = computed(() =>
  visibleArticles.value.filter((_, index) => index % 2 === 1)
)

const userInfo = {
  avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20young%20woman%20portrait%20professional%20headshot&image_size=square',
  nickname: '种草达人',
  introduction: '热爱生活，分享美好，记录每一天的小确幸 ✨'
}

function goToCreate() {
  router.push('/create')
}
</script>

<template>
  <div class="home-container">
    <div class="user-header">
      <div class="avatar">
        <img :src="userInfo.avatar" alt="用户头像" />
      </div>
      <div class="user-info">
        <div class="nickname">{{ userInfo.nickname }}</div>
        <div class="introduction">{{ userInfo.introduction }}</div>
      </div>
    </div>

    <div class="article-list">
      <div class="waterfall">
        <div class="column">
          <div
            v-for="article in leftColumnArticles"
            :key="article.id"
            class="article-card"
          >
            <div class="article-image">
              <img
                v-if="article.images.length > 0"
                :src="article.images[0]"
                :alt="article.title"
              />
            </div>
            <div class="article-title">{{ article.title }}</div>
          </div>
        </div>
        <div class="column">
          <div
            v-for="article in rightColumnArticles"
            :key="article.id"
            class="article-card"
          >
            <div class="article-image">
              <img
                v-if="article.images.length > 0"
                :src="article.images[0]"
                :alt="article.title"
              />
            </div>
            <div class="article-title">{{ article.title }}</div>
          </div>
        </div>
      </div>

      <div v-if="loading" class="loading-container">
        <span class="loading-text">加载中...</span>
      </div>
      <div v-if="!hasMore && visibleArticles.length > 0" class="no-more">
        <span class="no-more-text">没有更多了</span>
      </div>
    </div>

    <div class="fab-container">
      <el-button
        type="primary"
        circle
        size="large"
        class="create-fab"
        @click="goToCreate"
      >
        <el-icon><Plus /></el-icon>
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Plus } from '@element-plus/icons-vue'

export default {
  components: {
    Plus
  }
}
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 90px;
}

.user-header {
  height: 100px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  padding: 0 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info {
  margin-left: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1;
  min-width: 0;
}

.nickname {
  font-size: 17px;
  font-weight: 600;
  color: white;
  margin-bottom: 4px;
}

.introduction {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.article-list {
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

.article-card {
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s, box-shadow 0.2s;
}

.article-card:active {
  transform: translateY(-1px);
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.1);
}

.article-image {
  width: 100%;
  aspect-ratio: 4 / 5;
  background-color: #f0f0f0;
}

.article-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.article-title {
  padding: 10px;
  font-size: 13px;
  font-weight: 500;
  color: #333;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
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

.fab-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 100;
}

.create-fab {
  width: 52px;
  height: 52px;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
}

.create-fab:active {
  transform: scale(0.95);
}

@media (min-width: 768px) {
  .user-header {
    padding: 0 24px;
  }

  .avatar {
    width: 70px;
    height: 70px;
    border-width: 3px;
  }

  .user-info {
    margin-left: 16px;
  }

  .nickname {
    font-size: 18px;
  }

  .introduction {
    font-size: 13px;
  }

  .article-list {
    padding: 16px 24px;
    max-width: 600px;
    margin: 0 auto;
  }

  .waterfall {
    gap: 12px;
  }

  .column {
    gap: 12px;
  }

  .article-card {
    border-radius: 12px;
  }

  .article-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  }

  .article-title {
    padding: 12px;
    font-size: 14px;
  }

  .fab-container {
    bottom: 30px;
    right: 30px;
  }

  .create-fab {
    width: 56px;
    height: 56px;
  }

  .create-fab:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
  }
}

@media (max-width: 360px) {
  .user-header {
    height: 88px;
  }

  .avatar {
    width: 56px;
    height: 56px;
  }

  .nickname {
    font-size: 15px;
  }

  .introduction {
    font-size: 11px;
  }

  .article-title {
    padding: 8px;
    font-size: 12px;
  }

  .fab-container {
    bottom: 16px;
    right: 16px;
  }

  .create-fab {
    width: 48px;
    height: 48px;
  }
}
</style>
