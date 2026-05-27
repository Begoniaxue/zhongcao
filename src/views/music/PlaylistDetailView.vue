<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePlayerStore, type Song } from '../../stores/player'
import NavBar from '../../components/NavBar.vue'

const route = useRoute()
const router = useRouter()
const playerStore = usePlayerStore()

const playlistId = computed(() => Number(route.params.id))
const playlist = computed(() => playerStore.getPlaylistById(playlistId.value))

function playSong(song: Song) {
  if (playlist.value) {
    playerStore.playSong(song, playlist.value.songs)
  }
}

function playAll() {
  if (playlist.value && playlist.value.songs.length > 0) {
    playerStore.playSong(playlist.value.songs[0], playlist.value.songs)
  }
}

function formatPlayCount(count: number): string {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}万`
  }
  return count.toString()
}

function goBack() {
  router.back()
}
</script>

<template>
  <div class="playlist-detail" v-if="playlist">
    <NavBar />

    <main class="main-content">
      <button class="back-btn" @click="goBack">← 返回</button>

      <div class="playlist-header">
        <div class="playlist-cover">
          <img :src="playlist.cover" :alt="playlist.name" />
        </div>
        <div class="playlist-info">
          <span class="playlist-tag">歌单</span>
          <h1 class="playlist-name">{{ playlist.name }}</h1>
          <p class="playlist-desc">{{ playlist.description }}</p>
          <div class="playlist-stats">
            <span>👁️ {{ formatPlayCount(playlist.playCount) }}</span>
            <span>🎵 {{ playlist.songs.length }} 首</span>
          </div>
          <div class="playlist-actions">
            <button class="play-btn" @click="playAll">
              <span>▶️</span>
              <span>播放全部</span>
            </button>
          </div>
        </div>
      </div>

      <div class="song-list-header">
        <div class="col-index">#</div>
        <div class="col-title">歌曲</div>
        <div class="col-album">专辑</div>
        <div class="col-duration">时长</div>
      </div>

      <div class="song-list">
        <div
          v-for="(song, index) in playlist.songs"
          :key="song.id"
          class="song-item"
          :class="{ active: playerStore.currentSong?.id === song.id }"
          @click="playSong(song)"
        >
          <div class="col-index">
            <span v-if="playerStore.currentSong?.id !== song.id || !playerStore.isPlaying">
              {{ index + 1 }}
            </span>
            <span v-else class="playing-icon">🎶</span>
          </div>
          <div class="col-title">
            <div class="song-info">
              <img :src="song.cover" :alt="song.title" class="song-cover" />
              <div>
                <h4 class="song-title">{{ song.title }}</h4>
                <p class="song-artist">{{ song.artist }}</p>
              </div>
            </div>
          </div>
          <div class="col-album">{{ song.album }}</div>
          <div class="col-duration">{{ playerStore.formatTime(song.duration) }}</div>
          <div class="col-actions">
            <button class="action-btn" @click.stop="playSong(song)">
              {{ playerStore.currentSong?.id === song.id && playerStore.isPlaying ? '⏸️' : '▶️' }}
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>

  <div class="not-found" v-else>
    <NavBar />
    <div class="not-found-content">
      <h2>歌单不存在</h2>
      <button @click="router.push('/music/playlists')">返回歌单列表</button>
    </div>
  </div>
</template>

<style scoped>
.playlist-detail {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8f9ff 0%, #f0f2f8 100%);
  padding-bottom: 100px;
}

@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .playlist-detail {
    padding-bottom: calc(100px + 60px + env(safe-area-inset-bottom));
  }
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.back-btn:hover {
  color: #764ba2;
}

.playlist-header {
  display: flex;
  gap: 40px;
  padding: 32px;
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  border-radius: 20px;
  margin-bottom: 32px;
}

.playlist-cover {
  width: 240px;
  height: 240px;
  border-radius: 16px;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 12px 32px rgba(102, 126, 234, 0.2);
}

.playlist-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.playlist-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.playlist-tag {
  display: inline-block;
  padding: 4px 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 12px;
  border-radius: 12px;
  margin-bottom: 16px;
  align-self: flex-start;
}

.playlist-name {
  font-size: 36px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 12px 0;
}

.playlist-desc {
  font-size: 15px;
  color: #666;
  line-height: 1.6;
  margin: 0 0 20px 0;
}

.playlist-stats {
  display: flex;
  gap: 24px;
  font-size: 14px;
  color: #999;
  margin-bottom: 24px;
}

.playlist-actions {
  display: flex;
  gap: 16px;
}

.play-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.song-list-header {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  background: #f5f7ff;
  border-radius: 8px;
  font-size: 13px;
  color: #999;
  font-weight: 500;
  margin-bottom: 8px;
}

.col-index {
  width: 40px;
  text-align: center;
}

.col-title {
  flex: 1;
  padding-left: 16px;
}

.col-album {
  width: 200px;
}

.col-duration {
  width: 80px;
  text-align: right;
}

.col-actions {
  width: 50px;
  text-align: center;
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

.song-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.song-cover {
  width: 44px;
  height: 44px;
  border-radius: 6px;
  object-fit: cover;
}

.song-title {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a2e;
  margin: 0 0 4px 0;
}

.song-artist {
  font-size: 12px;
  color: #999;
  margin: 0;
}

.col-album {
  font-size: 13px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-duration {
  font-size: 13px;
  color: #999;
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
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.song-item:hover .action-btn {
  opacity: 1;
}

.action-btn:hover {
  background: rgba(102, 126, 234, 0.1);
  transform: scale(1.1);
}

.play-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 24px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  min-height: 48px;
  min-width: 120px;
}

.back-btn {
  background: transparent;
  border: none;
  color: #667eea;
  font-size: 14px;
  cursor: pointer;
  padding: 8px 0;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 0.2s ease;
  min-height: 44px;
  min-width: 80px;
}

.not-found {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8f9ff 0%, #f0f2f8 100%);
}

.not-found-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 100px 24px;
  text-align: center;
}

.not-found-content h2 {
  font-size: 24px;
  color: #666;
  margin-bottom: 24px;
}

.not-found-content button {
  padding: 12px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 24px;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.not-found-content button:hover {
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .playlist-detail {
    padding-bottom: calc(68px + 60px + env(safe-area-inset-bottom));
  }

  .main-content {
    padding: 12px;
  }

  .playlist-header {
    flex-direction: column;
    gap: 20px;
    padding: 20px;
    margin-bottom: 20px;
    border-radius: 16px;
  }

  .playlist-cover {
    width: 160px;
    height: 160px;
    margin: 0 auto;
    border-radius: 12px;
  }

  .playlist-info {
    text-align: center;
  }

  .playlist-tag {
    align-self: center;
    margin-bottom: 12px;
  }

  .playlist-name {
    font-size: 22px;
    margin-bottom: 8px;
  }

  .playlist-desc {
    font-size: 13px;
    margin-bottom: 16px;
  }

  .playlist-stats {
    justify-content: center;
    gap: 16px;
    font-size: 12px;
    margin-bottom: 20px;
  }

  .playlist-actions {
    justify-content: center;
  }

  .play-btn {
    width: 100%;
    justify-content: center;
    min-height: 52px;
  }

  .play-btn:active {
    transform: scale(0.98);
  }

  .song-list-header {
    padding: 10px 12px;
  }

  .col-album {
    display: none;
  }

  .col-duration {
    width: 60px;
    font-size: 12px;
  }

  .col-index {
    width: 32px;
    font-size: 12px;
  }

  .col-title {
    padding-left: 8px;
  }

  .col-actions {
    width: 44px;
  }

  .song-item {
    padding: 10px 12px;
    min-height: 64px;
  }

  .song-item:active {
    background: #f0f2ff;
  }

  .song-cover {
    width: 40px;
    height: 40px;
  }

  .song-title {
    font-size: 14px;
    margin-bottom: 2px;
  }

  .song-artist {
    font-size: 11px;
  }

  .action-btn {
    opacity: 1;
    min-width: 40px;
    min-height: 40px;
    font-size: 16px;
  }

  .not-found-content {
    padding: 60px 20px;
  }

  .not-found-content h2 {
    font-size: 20px;
  }

  .not-found-content button {
    min-height: 48px;
    min-width: 160px;
  }
}

@media (max-width: 380px) {
  .playlist-cover {
    width: 140px;
    height: 140px;
  }

  .playlist-name {
    font-size: 18px;
  }

  .song-item {
    padding: 8px 10px;
  }

  .song-cover {
    width: 36px;
    height: 36px;
  }

  .song-title {
    font-size: 13px;
  }
}
</style>
