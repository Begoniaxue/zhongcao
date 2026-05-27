<script setup lang="ts">
import { useRouter } from 'vue-router'
import { usePlayerStore } from '../../stores/player'
import NavBar from '../../components/NavBar.vue'

const router = useRouter()
const playerStore = usePlayerStore()

function goToPlaylist(playlistId: number) {
  router.push(`/music/playlist/${playlistId}`)
}

function formatPlayCount(count: number): string {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}万`
  }
  return count.toString()
}
</script>

<template>
  <div class="playlist-list">
    <NavBar />

    <main class="main-content">
      <div class="page-header">
        <h1 class="page-title">📚 歌单广场</h1>
        <p class="page-subtitle">发现更多精彩音乐</p>
      </div>

      <div class="playlist-grid">
        <div
          v-for="playlist in playerStore.playlists"
          :key="playlist.id"
          class="playlist-card"
          @click="goToPlaylist(playlist.id)"
        >
          <div class="playlist-cover">
            <img :src="playlist.cover" :alt="playlist.name" />
            <div class="play-overlay">
              <span class="play-icon">▶️</span>
            </div>
            <div class="play-count">
              <span>👁️</span>
              <span>{{ formatPlayCount(playlist.playCount) }}</span>
            </div>
          </div>
          <div class="playlist-info">
            <h3 class="playlist-name">{{ playlist.name }}</h3>
            <p class="playlist-desc">{{ playlist.description }}</p>
            <div class="playlist-meta">
              <span class="song-count">🎵 {{ playlist.songs.length }} 首</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.playlist-list {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8f9ff 0%, #f0f2f8 100%);
  padding-bottom: 100px;
}

@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .playlist-list {
    padding-bottom: calc(100px + 60px + env(safe-area-inset-bottom));
  }
}

.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

.page-header {
  margin-bottom: 32px;
  text-align: center;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.playlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 32px;
}

.playlist-card {
  cursor: pointer;
  transition: transform 0.3s ease;
}

.playlist-card:hover {
  transform: translateY(-6px);
}

.playlist-cover {
  position: relative;
  width: 100%;
  padding-top: 100%;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.playlist-cover img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.playlist-card:hover .play-overlay {
  opacity: 1;
}

.play-icon {
  font-size: 56px;
  color: #fff;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
}

.play-count {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  backdrop-filter: blur(4px);
}

.playlist-info {
  padding: 16px 4px;
}

.playlist-name {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.playlist-desc {
  font-size: 13px;
  color: #666;
  margin: 0 0 12px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
}

.playlist-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.song-count {
  font-size: 12px;
  color: #999;
}

@media (max-width: 768px) {
  .playlist-list {
    padding-bottom: calc(68px + 60px + env(safe-area-inset-bottom));
  }

  .main-content {
    padding: 16px;
  }

  .page-header {
    margin-bottom: 24px;
  }

  .page-title {
    font-size: 24px;
  }

  .page-subtitle {
    font-size: 14px;
  }

  .playlist-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
  }

  .playlist-card:active {
    transform: scale(0.98);
  }

  .playlist-cover {
    border-radius: 12px;
  }

  .play-overlay {
    opacity: 1;
    background: rgba(0, 0, 0, 0.2);
  }

  .play-icon {
    font-size: 44px;
  }

  .playlist-name {
    font-size: 14px;
  }

  .playlist-desc {
    font-size: 12px;
    -webkit-line-clamp: 1;
    margin-bottom: 8px;
  }

  .song-count {
    font-size: 11px;
  }
}
</style>
