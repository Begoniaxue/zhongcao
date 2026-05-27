<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePlayerStore } from '../../stores/player'
import NavBar from '../../components/NavBar.vue'

const router = useRouter()
const playerStore = usePlayerStore()

const isSearchMode = computed(() => playerStore.searchKeyword.trim() !== '')
const displaySongs = computed(() => {
  if (isSearchMode.value) {
    return playerStore.searchResults
  }
  return playerStore.recommendedSongs
})

function playSong(song: typeof playerStore.recommendedSongs[0]) {
  if (isSearchMode.value) {
    playerStore.playSong(song, playerStore.searchResults)
  } else {
    playerStore.playSong(song)
  }
}

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
  <div class="music-home">
    <NavBar />

    <main class="main-content">
      <template v-if="!isSearchMode">
        <section class="section">
          <div class="section-header">
            <h2 class="section-title">🔥 热门推荐</h2>
            <span class="section-more" @click="router.push('/music/playlists')">查看更多 →</span>
          </div>
          <div class="playlist-grid">
            <div
              v-for="playlist in playerStore.playlists.slice(0, 6)"
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
              </div>
            </div>
          </div>
        </section>

        <section class="section">
          <div class="section-header">
            <h2 class="section-title">🎵 推荐歌曲</h2>
          </div>
          <div class="song-list">
            <div
              v-for="(song, index) in displaySongs"
              :key="song.id"
              class="song-item"
              :class="{ active: playerStore.currentSong?.id === song.id }"
              @click="playSong(song)"
            >
              <div class="song-index">
                <span v-if="playerStore.currentSong?.id !== song.id || !playerStore.isPlaying">
                  {{ index + 1 }}
                </span>
                <span v-else class="playing-icon">🎶</span>
              </div>
              <div class="song-cover">
                <img :src="song.cover" :alt="song.title" />
              </div>
              <div class="song-info">
                <h4 class="song-title">{{ song.title }}</h4>
                <p class="song-artist">{{ song.artist }}</p>
              </div>
              <div class="song-album">{{ song.album }}</div>
              <div class="song-duration">{{ playerStore.formatTime(song.duration) }}</div>
              <div class="song-actions">
                <button class="action-btn" @click.stop="playSong(song)">
                  {{ playerStore.currentSong?.id === song.id && playerStore.isPlaying ? '⏸️' : '▶️' }}
                </button>
              </div>
            </div>
          </div>
        </section>
      </template>

      <template v-else>
        <section class="section search-section">
          <div class="section-header">
            <h2 class="section-title">
              🔍 搜索结果："{{ playerStore.searchKeyword }}"
              <span class="result-count">({{ displaySongs.length }} 首)</span>
            </h2>
          </div>

          <div v-if="displaySongs.length === 0" class="no-results">
            <div class="no-results-icon">🎵</div>
            <p class="no-results-text">未找到相关歌曲</p>
            <p class="no-results-hint">试试其他关键词吧</p>
          </div>

          <div v-else class="song-list">
            <div
              v-for="(song, index) in displaySongs"
              :key="song.id"
              class="song-item"
              :class="{ active: playerStore.currentSong?.id === song.id }"
              @click="playSong(song)"
            >
              <div class="song-index">
                <span v-if="playerStore.currentSong?.id !== song.id || !playerStore.isPlaying">
                  {{ index + 1 }}
                </span>
                <span v-else class="playing-icon">🎶</span>
              </div>
              <div class="song-cover">
                <img :src="song.cover" :alt="song.title" />
              </div>
              <div class="song-info">
                <h4 class="song-title">{{ song.title }}</h4>
                <p class="song-artist">{{ song.artist }}</p>
              </div>
              <div class="song-album">{{ song.album }}</div>
              <div class="song-duration">{{ playerStore.formatTime(song.duration) }}</div>
              <div class="song-actions">
                <button class="action-btn" @click.stop="playSong(song)">
                  {{ playerStore.currentSong?.id === song.id && playerStore.isPlaying ? '⏸️' : '▶️' }}
                </button>
              </div>
            </div>
          </div>
        </section>
      </template>
    </main>
  </div>
</template>

<style scoped>
.music-home {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8f9ff 0%, #f0f2f8 100%);
  padding-bottom: 100px;
}

@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .music-home {
    padding-bottom: calc(100px + 60px + env(safe-area-inset-bottom));
  }
}

.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

.section {
  margin-bottom: 40px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
}

.result-count {
  font-size: 16px;
  font-weight: 400;
  color: #999;
  margin-left: 8px;
}

.no-results {
  text-align: center;
  padding: 80px 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.no-results-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.no-results-text {
  font-size: 18px;
  color: #666;
  margin: 0 0 8px 0;
}

.no-results-hint {
  font-size: 14px;
  color: #999;
  margin: 0;
}

.section-more {
  font-size: 14px;
  color: #667eea;
  cursor: pointer;
  transition: color 0.2s ease;
}

.section-more:hover {
  color: #764ba2;
}

.playlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 24px;
}

.playlist-card {
  cursor: pointer;
  transition: transform 0.3s ease;
}

.playlist-card:hover {
  transform: translateY(-4px);
}

.playlist-cover {
  position: relative;
  width: 100%;
  padding-top: 100%;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
  background: rgba(0, 0, 0, 0.3);
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
  font-size: 48px;
  color: #fff;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
}

.play-count {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.playlist-info {
  padding: 12px 4px;
}

.playlist-name {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 6px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.playlist-desc {
  font-size: 12px;
  color: #666;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.song-list {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.song-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  gap: 16px;
  cursor: pointer;
  transition: background 0.2s ease;
  border-bottom: 1px solid #f0f0f0;
}

.song-item:last-child {
  border-bottom: none;
}

.song-item:hover {
  background: #f8f9ff;
}

.song-item.active {
  background: rgba(102, 126, 234, 0.08);
}

.song-item.active .song-title {
  color: #667eea;
}

.song-index {
  width: 24px;
  text-align: center;
  font-size: 14px;
  color: #999;
  font-weight: 500;
}

.playing-icon {
  color: #667eea;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.song-cover {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
}

.song-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.song-info {
  flex: 1;
  min-width: 0;
}

.song-title {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a2e;
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.song-artist {
  font-size: 12px;
  color: #999;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.song-album {
  width: 200px;
  font-size: 13px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.song-duration {
  width: 50px;
  text-align: right;
  font-size: 13px;
  color: #999;
}

.song-actions {
  width: 40px;
  display: flex;
  justify-content: center;
}

.action-btn {
  background: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.2s ease;
  opacity: 0;
}

.song-item:hover .action-btn {
  opacity: 1;
}

.action-btn:hover {
  background: rgba(102, 126, 234, 0.1);
  transform: scale(1.1);
}

@media (max-width: 768px) {
  .music-home {
    padding-bottom: calc(68px + 60px + env(safe-area-inset-bottom));
  }

  .main-content {
    padding: 16px;
  }

  .section {
    margin-bottom: 28px;
  }

  .section-header {
    margin-bottom: 16px;
  }

  .section-title {
    font-size: 20px;
  }

  .playlist-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
  }

  .playlist-card:active {
    transform: scale(0.98);
  }

  .playlist-cover {
    border-radius: 10px;
  }

  .play-overlay {
    opacity: 1;
    background: rgba(0, 0, 0, 0.2);
  }

  .play-icon {
    font-size: 36px;
  }

  .playlist-name {
    font-size: 13px;
  }

  .playlist-desc {
    font-size: 11px;
    -webkit-line-clamp: 1;
  }

  .song-item {
    padding: 12px 14px;
    gap: 12px;
    min-height: 60px;
  }

  .song-index {
    width: 20px;
    font-size: 13px;
  }

  .song-cover {
    width: 44px;
    height: 44px;
  }

  .song-title {
    font-size: 14px;
  }

  .song-artist {
    font-size: 12px;
  }

  .song-album {
    display: none;
  }

  .song-duration {
    display: none;
  }

  .action-btn {
    opacity: 1;
    font-size: 20px;
  }

  .no-results {
    padding: 60px 16px;
  }

  .search-section .section-title {
    font-size: 18px;
    line-height: 1.4;
  }

  .result-count {
    font-size: 14px;
    display: block;
    margin-left: 0;
    margin-top: 4px;
  }
}
</style>
