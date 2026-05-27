<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePlayerStore } from '../stores/player'

const route = useRoute()
const router = useRouter()
const playerStore = usePlayerStore()

const activeMenu = ref(route.name as string)
const searchInput = ref(playerStore.searchKeyword)
const isMobileSearchOpen = ref(false)
const mobileSearchInput = ref<HTMLInputElement | null>(null)
const isMobile = ref(false)

const menuItems = [
  { name: 'musicHome', label: '首页', icon: '🏠', path: '/music' },
  { name: 'playlistList', label: '歌单', icon: '📚', path: '/music/playlists' },
  { name: 'musicCategory', label: '分类', icon: '🏷️', path: '/music/category' },
  { name: 'musicLibrary', label: '我的', icon: '⭐', path: '/music/library' },
  { name: 'playHistory', label: '历史', icon: '⏳', path: '/music/history' }
]

function handleMenuClick(item: typeof menuItems[0]) {
  activeMenu.value = item.name
  playerStore.clearSearch()
  searchInput.value = ''
  isMobileSearchOpen.value = false
  router.push(item.path)
}

function checkMobile() {
  isMobile.value = window.innerWidth <= 768
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

watch(searchInput, (val) => {
  playerStore.setSearchKeyword(val)
})

function clearSearch() {
  searchInput.value = ''
  playerStore.clearSearch()
}

function openMobileSearch() {
  isMobileSearchOpen.value = true
  searchInput.value = playerStore.searchKeyword
  nextTick(() => {
    mobileSearchInput.value?.focus()
  })
}

function closeMobileSearch() {
  isMobileSearchOpen.value = false
  if (!playerStore.searchKeyword.trim()) {
    searchInput.value = ''
  }
}

function handleMobileSearchEnter() {
  router.push('/music')
}

function handleLogoClick() {
  playerStore.clearSearch()
  searchInput.value = ''
  isMobileSearchOpen.value = false
  router.push('/music')
}
</script>

<template>
  <div class="navbar-wrapper">
    <nav class="navbar">
      <div class="nav-container">
        <div class="nav-logo" @click="handleLogoClick">
          <span class="logo-icon">🎵</span>
          <span class="logo-text">音乐播放器</span>
        </div>

        <div class="nav-menu">
          <div
            v-for="item in menuItems"
            :key="item.name"
            class="nav-item"
            :class="{ active: activeMenu === item.name || route.name === item.name }"
            @click="handleMenuClick(item)"
          >
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-label">{{ item.label }}</span>
          </div>
        </div>

        <div class="nav-right">
          <div class="search-box desktop-search">
            <span class="search-icon">🔍</span>
            <input
              type="text"
              v-model="searchInput"
              placeholder="搜索音乐、歌手"
              @keyup.enter="() => router.push('/music')"
            />
            <span
              v-if="searchInput"
              class="clear-btn"
              @click="clearSearch"
            >
              ✕
            </span>
          </div>

          <button
            class="mobile-search-btn"
            @click="openMobileSearch"
          >
            🔍
          </button>

          <div class="user-avatar">
            <span>👤</span>
          </div>
        </div>
      </div>

      <div v-if="isMobileSearchOpen" class="mobile-search-overlay">
        <div class="mobile-search-container">
          <div class="mobile-search-box">
            <span class="search-icon">🔍</span>
            <input
              ref="mobileSearchInput"
              type="text"
              v-model="searchInput"
              placeholder="搜索音乐、歌手"
              @keyup.enter="handleMobileSearchEnter"
            />
            <span
              v-if="searchInput"
              class="clear-btn"
              @click="clearSearch"
            >
              ✕
            </span>
          </div>
          <button class="mobile-search-cancel" @click="closeMobileSearch">
            取消
          </button>
        </div>
      </div>
    </nav>

    <nav v-if="isMobile" class="bottom-nav">
      <div
        v-for="item in menuItems"
        :key="item.name"
        class="bottom-nav-item"
        :class="{ active: activeMenu === item.name || route.name === item.name }"
        @click="handleMenuClick(item)"
      >
        <span class="bottom-nav-icon">{{ item.icon }}</span>
        <span class="bottom-nav-label">{{ item.label }}</span>
      </div>
    </nav>
  </div>
</template>

<style scoped>
.navbar-wrapper {
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.navbar {
  height: 64px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.nav-container {
  max-width: 1400px;
  height: 100%;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: 32px;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  flex-shrink: 0;
}

.logo-icon {
  font-size: 28px;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-menu {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #666;
  font-size: 14px;
  min-height: 44px;
  min-width: 44px;
  justify-content: center;
}

.nav-item:hover {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.nav-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.nav-icon {
  font-size: 16px;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f5f5f5;
  padding: 10px 16px;
  border-radius: 20px;
  width: 280px;
  transition: all 0.2s ease;
  min-height: 44px;
}

.search-box:focus-within {
  background: #fff;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.3);
}

.search-icon {
  font-size: 14px;
  color: #999;
  flex-shrink: 0;
}

.search-box input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  width: 100%;
  color: #333;
}

.search-box input::placeholder {
  color: #999;
}

.clear-btn {
  font-size: 14px;
  color: #999;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 50%;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  min-width: 24px;
  min-height: 24px;
}

.clear-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #666;
}

.mobile-search-btn {
  display: none;
  background: transparent;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.2s ease;
  min-width: 44px;
  min-height: 44px;
}

.mobile-search-btn:hover {
  background: rgba(102, 126, 234, 0.1);
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 18px;
  flex-shrink: 0;
  min-width: 44px;
  min-height: 44px;
}

.mobile-search-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  z-index: 200;
  padding: 12px 16px;
  padding-top: calc(env(safe-area-inset-top) + 12px);
}

.mobile-search-container {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 8px;
}

.mobile-search-box {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f5f5f5;
  padding: 12px 16px;
  border-radius: 24px;
  transition: all 0.2s ease;
  min-height: 48px;
}

.mobile-search-box:focus-within {
  background: #fff;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.3);
}

.mobile-search-box input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 16px;
  width: 100%;
  color: #333;
}

.mobile-search-box input::placeholder {
  color: #999;
}

.mobile-search-cancel {
  background: transparent;
  border: none;
  color: #667eea;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  padding: 8px 4px;
  flex-shrink: 0;
  min-width: 56px;
  min-height: 44px;
}

.bottom-nav {
  display: flex;
  position: fixed;
  bottom: 68px;
  left: 0;
  right: 0;
  height: 60px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.08);
  z-index: 99;
  padding-bottom: env(safe-area-inset-bottom);
  border-top: 1px solid #f0f0f0;
}

@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .bottom-nav {
    bottom: calc(68px + env(safe-area-inset-bottom));
  }
}

.bottom-nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #999;
  min-height: 44px;
  padding: 4px;
}

.bottom-nav-item.active {
  color: #667eea;
}

.bottom-nav-icon {
  font-size: 20px;
  line-height: 1;
}

.bottom-nav-label {
  font-size: 11px;
  font-weight: 500;
}

@media (max-width: 768px) {
  .navbar {
    height: 56px;
  }

  .nav-container {
    padding: 0 16px;
    gap: 12px;
  }

  .nav-menu {
    display: none;
  }

  .desktop-search {
    display: none;
  }

  .mobile-search-btn {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .logo-text {
    font-size: 18px;
  }

  .user-avatar {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }
}

@media (min-width: 769px) {
  .mobile-search-overlay {
    display: none !important;
  }

  .bottom-nav {
    display: none !important;
  }
}
</style>
