<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { usePlayerStore } from '../stores/player'

const playerStore = usePlayerStore()
const showPlaylist = ref(false)
const isDragging = ref(false)
const dragProgress = ref(0)
const isMobile = ref(false)

const emit = defineEmits<{
  (e: 'openFullscreen'): void
}>()

const playModeIcon = computed(() => {
  switch (playerStore.playMode) {
    case 'sequence':
      return '🔁'
    case 'loop':
      return '🔂'
    case 'random':
      return '🔀'
    default:
      return '🔁'
  }
})

const playModeText = computed(() => {
  switch (playerStore.playMode) {
    case 'sequence':
      return '顺序播放'
    case 'loop':
      return '单曲循环'
    case 'random':
      return '随机播放'
    default:
      return '顺序播放'
  }
})

const volumeIcon = computed(() => {
  if (playerStore.isMuted || playerStore.volume === 0) {
    return '🔇'
  } else if (playerStore.volume < 0.5) {
    return '🔉'
  } else {
    return '🔊'
  }
})

const displayProgress = computed(() => {
  if (isDragging.value) {
    return dragProgress.value
  }
  return playerStore.progressPercent
})

const currentVolume = computed(() => {
  return playerStore.isMuted ? 0 : playerStore.volume * 100
})

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

function onProgressInput(e: Event) {
  const target = e.target as HTMLInputElement
  dragProgress.value = Number(target.value)
  isDragging.value = true
  playerStore.seek((dragProgress.value / 100) * playerStore.duration)
}

function onProgressChange(e: Event) {
  const target = e.target as HTMLInputElement
  const val = Number(target.value)
  playerStore.seek((val / 100) * playerStore.duration)
  isDragging.value = false
}

function onVolumeInput(e: Event) {
  const target = e.target as HTMLInputElement
  const val = Number(target.value)
  playerStore.setVolume(val / 100)
}

function formatDuration(duration: number): string {
  const mins = Math.floor(duration / 60)
  const secs = Math.floor(duration % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function handleCoverClick() {
  if (playerStore.currentSong) {
    emit('openFullscreen')
  }
}
</script>

<template>
  <div class="player-bar" :class="{ 'is-mobile': isMobile }">
    <div class="mobile-progress">
      <input
        type="range"
        class="range-slider touch-progress"
        :value="displayProgress"
        :disabled="!playerStore.currentSong"
        min="0"
        max="100"
        step="0.1"
        @input="onProgressInput"
        @change="onProgressChange"
      />
      <div class="progress-track-bg">
        <div class="progress-fill" :style="{ width: displayProgress + '%' }"></div>
      </div>
    </div>

    <div class="player-main">
      <div class="player-info" @click="handleCoverClick">
        <img
          v-if="playerStore.currentSong"
          :src="playerStore.currentSong.cover"
          :alt="playerStore.currentSong.title"
          class="player-cover"
        />
        <div v-else class="player-cover placeholder">
          <span>🎵</span>
        </div>
        <div class="player-song-info">
          <div class="song-title">
            {{ playerStore.currentSong?.title || '暂无播放' }}
          </div>
          <div class="song-artist">
            {{ playerStore.currentSong?.artist || '---' }}
          </div>
        </div>
        <button v-if="!isMobile" class="control-btn fullscreen-btn desktop-only" title="全屏播放" :disabled="!playerStore.currentSong" @click.stop="emit('openFullscreen')">
          🔊
        </button>
      </div>

      <div class="player-controls">
        <div class="control-buttons">
          <button v-if="!isMobile" class="control-btn mode-btn" :title="playModeText" @click="playerStore.togglePlayMode()">
            {{ playModeIcon }}
          </button>
          <button
            class="control-btn prev-btn"
            :disabled="!playerStore.currentSong"
            @click="playerStore.playPrev()"
          >
            ⏮️
          </button>
          <button
            class="control-btn play-btn"
            :disabled="!playerStore.currentSong"
            @click="playerStore.togglePlay()"
          >
            {{ playerStore.isPlaying ? '⏸️' : '▶️' }}
          </button>
          <button
            class="control-btn next-btn"
            :disabled="!playerStore.currentSong"
            @click="playerStore.playNext()"
          >
            ⏭️
          </button>
          <button
            v-if="isMobile"
            class="control-btn playlist-btn"
            :class="{ active: showPlaylist }"
            title="播放列表"
            @click="showPlaylist = !showPlaylist"
          >
            📋
          </button>
          <button v-if="!isMobile" class="control-btn fullscreen-btn" title="全屏播放" :disabled="!playerStore.currentSong" @click="emit('openFullscreen')">
            🔊
          </button>
          <div
            v-if="!isMobile"
            class="control-btn playlist-btn"
            :class="{ active: showPlaylist }"
            title="播放列表"
            @click="showPlaylist = !showPlaylist"
          >
            📋
          </div>
        </div>

        <div v-if="!isMobile" class="progress-container">
          <span class="time">{{ playerStore.formattedCurrentTime }}</span>
          <div class="progress-bar">
            <input
              type="range"
              class="range-slider"
              :value="displayProgress"
              :disabled="!playerStore.currentSong"
              min="0"
              max="100"
              step="0.1"
              @input="onProgressInput"
              @change="onProgressChange"
            />
            <div class="progress-track">
              <div class="progress-fill" :style="{ width: displayProgress + '%' }"></div>
            </div>
          </div>
          <span class="time">{{ playerStore.formattedDuration }}</span>
        </div>
      </div>

      <div v-if="!isMobile" class="player-volume">
        <button class="control-btn" @click="playerStore.toggleMute()">
          {{ volumeIcon }}
        </button>
        <div class="volume-slider">
          <input
            type="range"
            class="range-slider"
            :value="currentVolume"
            min="0"
            max="100"
            step="1"
            @input="onVolumeInput"
          />
          <div class="progress-track">
            <div class="progress-fill volume-fill" :style="{ width: currentVolume + '%' }"></div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showPlaylist" class="playlist-panel" :class="{ 'mobile-panel': isMobile }">
      <div class="playlist-header">
        <span>播放列表</span>
        <div class="header-actions">
          <span class="playlist-count">{{ playerStore.playlist.length }} 首</span>
          <button v-if="isMobile" class="close-btn" @click="showPlaylist = false">✕</button>
        </div>
      </div>
      <div class="playlist-content">
        <div
          v-for="(song, index) in playerStore.playlist"
          :key="song.id"
          class="playlist-item"
          :class="{ active: playerStore.currentSong?.id === song.id }"
          @click="playerStore.playSong(song)"
        >
          <span class="item-index">{{ index + 1 }}</span>
          <div class="item-info">
            <span class="item-title">{{ song.title }}</span>
            <span class="item-artist">{{ song.artist }}</span>
          </div>
          <span class="item-duration">{{ formatDuration(song.duration) }}</span>
        </div>
      </div>
    </div>

    <div v-if="showPlaylist && isMobile" class="playlist-overlay" @click="showPlaylist = false"></div>
  </div>
</template>

<style scoped>
.player-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
  z-index: 1000;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  min-height: 80px;
}

.mobile-progress {
  position: relative;
  width: 100%;
  height: 4px;
  display: none;
}

.mobile-progress .touch-progress {
  position: absolute;
  inset: -12px 0;
  width: 100%;
  height: 28px;
  opacity: 0;
  cursor: pointer;
  z-index: 3;
  margin: 0;
}

.mobile-progress .progress-track-bg {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.mobile-progress .progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.1s ease;
}

.player-main {
  display: flex;
  align-items: center;
  padding: 12px 24px;
  gap: 24px;
}

.player-info {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 280px;
  cursor: pointer;
}

.player-cover {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.player-cover.placeholder {
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.player-song-info {
  overflow: hidden;
  flex: 1;
  min-width: 0;
}

.song-title {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-artist {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-controls {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.control-buttons {
  display: flex;
  align-items: center;
  gap: 16px;
}

.control-btn {
  background: transparent;
  border: none;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  padding: 10px;
  border-radius: 50%;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  -webkit-tap-highlight-color: transparent;
}

.control-btn:active:not(:disabled) {
  transform: scale(0.95);
  background: rgba(255, 255, 255, 0.15);
}

.control-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
}

.control-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.control-btn.play-btn {
  font-size: 26px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  width: 48px;
  height: 48px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.control-btn.play-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.control-btn.mode-btn,
.control-btn.playlist-btn,
.control-btn.fullscreen-btn {
  font-size: 18px;
}

.control-btn.playlist-btn.active {
  background: rgba(102, 126, 234, 0.3);
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 600px;
}

.time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  min-width: 45px;
  text-align: center;
  flex-shrink: 0;
}

.progress-bar {
  flex: 1;
  position: relative;
  height: 20px;
  display: flex;
  align-items: center;
  min-width: 0;
}

.range-slider {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 2;
  margin: 0;
  padding: 0;
  -webkit-appearance: none;
}

.range-slider:disabled {
  cursor: not-allowed;
}

.progress-track {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  position: relative;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
  transition: width 0.1s ease;
}

.progress-fill.volume-fill {
  background: rgba(255, 255, 255, 0.8);
}

.player-volume {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 180px;
  flex-shrink: 0;
}

.volume-slider {
  width: 100px;
  position: relative;
  height: 20px;
  display: flex;
  align-items: center;
}

.playlist-panel {
  position: absolute;
  bottom: 100%;
  right: 24px;
  width: 380px;
  max-height: 45vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 12px 12px 0 0;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transform-origin: bottom right;
  animation: slideUp 0.2s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.playlist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-weight: 500;
  flex-shrink: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.playlist-count {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.close-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  min-height: 32px;
}

.playlist-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
  -webkit-overflow-scrolling: touch;
}

.playlist-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  cursor: pointer;
  transition: background 0.2s ease;
  min-height: 48px;
}

.playlist-item:active {
  background: rgba(255, 255, 255, 0.1);
}

.playlist-item.active {
  background: rgba(102, 126, 234, 0.2);
}

.playlist-item.active .item-index,
.playlist-item.active .item-title {
  color: #667eea;
}

.item-index {
  width: 24px;
  text-align: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-title {
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-artist {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-duration {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  min-width: 40px;
  text-align: right;
  flex-shrink: 0;
}

.playlist-content::-webkit-scrollbar {
  width: 6px;
}

.playlist-content::-webkit-scrollbar-track {
  background: transparent;
}

.playlist-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.playlist-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.4);
}

.desktop-only {
  display: flex;
}

.playlist-overlay {
  display: none;
}

@media (max-width: 768px) {
  .player-bar {
    min-height: 68px;
    padding-bottom: env(safe-area-inset-bottom);
  }

  .mobile-progress {
    display: block;
  }

  .player-main {
    padding: 8px 12px;
    gap: 8px;
  }

  .player-info {
    min-width: 0;
    flex: 1;
    gap: 8px;
  }

  .player-cover {
    width: 48px;
    height: 48px;
    border-radius: 6px;
  }

  .player-song-info {
    max-width: calc(100vw - 280px);
  }

  .song-title {
    font-size: 13px;
  }

  .song-artist {
    font-size: 11px;
  }

  .player-controls {
    flex: initial;
    flex-direction: row;
    gap: 0;
  }

  .control-buttons {
    gap: 2px;
  }

  .control-btn {
    padding: 6px;
    font-size: 18px;
    min-width: 40px;
    min-height: 40px;
  }

  .control-btn.play-btn {
    font-size: 22px;
    width: 40px;
    height: 40px;
  }

  .control-btn.prev-btn,
  .control-btn.next-btn {
    font-size: 16px;
  }

  .desktop-only {
    display: none !important;
  }

  .playlist-panel.mobile-panel {
    position: fixed;
    top: 80px;
    left: 0;
    right: 0;
    bottom: 68px;
    width: 100%;
    max-height: none;
    border-radius: 0;
    right: 0;
    padding-bottom: env(safe-area-inset-bottom);
    animation: slideUpMobile 0.3s ease;
  }

  @keyframes slideUpMobile {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }

  .playlist-overlay {
    display: block;
    position: fixed;
    top: 56px;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: -1;
  }

  .playlist-item {
    padding: 14px 16px;
  }
}

@media (min-width: 769px) {
  .player-bar.is-mobile .mobile-progress {
    display: none;
  }
}
</style>
