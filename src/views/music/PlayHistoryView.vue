<script setup lang="ts">
import { computed } from 'vue'
import { usePlayerStore, type PlayHistoryItem } from '../../stores/player'
import NavBar from '../../components/NavBar.vue'

const playerStore = usePlayerStore()

const groupedHistory = computed(() => {
  const groups: Record<string, PlayHistoryItem[]> = {}
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`
  const yesterday = new Date(today.getTime() - 86400000)
  const yesterdayStr = `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}`

  playerStore.playHistory.forEach(item => {
    const d = new Date(item.playedAt)
    const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
    let label: string
    if (key === todayStr) label = '今天'
    else if (key === yesterdayStr) label = '昨天'
    else label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

    if (!groups[label]) groups[label] = []
    groups[label].push(item)
  })
  return groups
})

function playItem(item: PlayHistoryItem) {
  playerStore.playSong(
    {
      id: item.id,
      title: item.title,
      artist: item.artist,
      album: item.album,
      cover: item.cover,
      url: item.url,
      duration: item.duration
    },
    playerStore.playHistory.map(h => ({
      id: h.id,
      title: h.title,
      artist: h.artist,
      album: h.album,
      cover: h.cover,
      url: h.url,
      duration: h.duration
    }))
  )
}

function clearAll() {
  if (!confirm('确定清空所有播放记录吗？')) return
  playerStore.clearHistory()
}

function formatTime(ts: number) {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<template>
  <div class="history-view">
    <NavBar />

    <main class="main-content">
      <div class="page-header">
        <div>
          <h1 class="page-title">⏳ 播放历史</h1>
          <p class="page-subtitle">共 {{ playerStore.playHistory.length }} 首歌曲</p>
        </div>
        <button
          v-if="playerStore.playHistory.length > 0"
          class="clear-btn"
          @click="clearAll"
        >
          🗑️ 清空记录
        </button>
      </div>

      <div v-if="playerStore.playHistory.length === 0" class="empty-state">
        <div class="empty-icon">🎵</div>
        <p class="empty-text">暂无播放记录</p>
        <p class="empty-hint">去首页发现好听的音乐吧</p>
      </div>

      <template v-else>
        <div
          v-for="(items, label) in groupedHistory"
          :key="label"
          class="history-group"
        >
          <h2 class="group-title">{{ label }}</h2>
          <div class="song-list">
            <div
              v-for="item in items"
              :key="item.id + '-' + item.playedAt"
              class="song-item"
              :class="{ active: playerStore.currentSong?.id === item.id }"
              @click="playItem(item)"
            >
              <div class="song-cover">
                <img :src="item.cover" :alt="item.title" />
              </div>
              <div class="song-info">
                <h4>{{ item.title }}</h4>
                <p>{{ item.artist }} · {{ item.album }}</p>
              </div>
              <div class="song-time">{{ formatTime(item.playedAt) }}</div>
              <button class="action-btn" @click.stop="playItem(item)">
                {{ playerStore.currentSong?.id === item.id && playerStore.isPlaying ? '⏸️' : '▶️' }}
              </button>
            </div>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>

<style scoped>
.history-view {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8f9ff 0%, #f0f2f8 100%);
  padding-bottom: 100px;
}

@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .history-view {
    padding-bottom: calc(100px + 60px + env(safe-area-inset-bottom));
  }
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 16px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 4px 0;
}

.page-subtitle {
  font-size: 14px;
  color: #999;
  margin: 0;
}

.clear-btn {
  padding: 8px 16px;
  background: #fff;
  border: 1px solid #ff6b6b;
  color: #ff6b6b;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-btn:hover {
  background: #ff6b6b;
  color: #fff;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 18px;
  color: #666;
  margin: 0 0 8px 0;
}

.empty-hint {
  font-size: 14px;
  color: #999;
  margin: 0;
}

.history-group {
  margin-bottom: 24px;
}

.group-title {
  font-size: 14px;
  font-weight: 600;
  color: #999;
  margin: 0 0 12px 8px;
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

.song-item.active .song-info h4 {
  color: #667eea;
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

.song-info h4 {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a2e;
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.song-info p {
  font-size: 12px;
  color: #999;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.song-time {
  font-size: 12px;
  color: #999;
  min-width: 50px;
  text-align: right;
}

.action-btn {
  background: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  opacity: 0;
  transition: all 0.2s ease;
}

.song-item:hover .action-btn {
  opacity: 1;
}

.action-btn:hover {
  background: rgba(102, 126, 234, 0.1);
  transform: scale(1.1);
}

@media (max-width: 768px) {
  .history-view {
    padding-bottom: calc(68px + 60px + env(safe-area-inset-bottom));
  }

  .main-content {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 20px;
  }

  .page-title {
    font-size: 22px;
  }

  .page-subtitle {
    font-size: 13px;
  }

  .clear-btn {
    align-self: flex-start;
    font-size: 13px;
    padding: 8px 14px;
  }

  .history-group {
    margin-bottom: 20px;
  }

  .group-title {
    font-size: 13px;
    margin-bottom: 10px;
  }

  .song-list {
    border-radius: 10px;
  }

  .song-item {
    padding: 12px 14px;
    gap: 12px;
    min-height: 60px;
  }

  .song-cover {
    width: 44px;
    height: 44px;
  }

  .song-info h4 {
    font-size: 14px;
  }

  .song-info p {
    font-size: 12px;
  }

  .song-time {
    font-size: 11px;
    min-width: 40px;
  }

  .action-btn {
    opacity: 1;
    font-size: 20px;
  }

  .empty-state {
    padding: 60px 16px;
  }

  .empty-icon {
    font-size: 52px;
  }

  .empty-text {
    font-size: 16px;
  }

  .empty-hint {
    font-size: 13px;
  }
}
</style>
