<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePlayerStore, type Song, type CustomPlaylist } from '../../stores/player'
import NavBar from '../../components/NavBar.vue'

const playerStore = usePlayerStore()

const activeTab = ref<'favorites' | 'playlists'>('favorites')
const selectedPlaylistId = ref<number | null>(null)
const showCreateDialog = ref(false)
const newPlaylistName = ref('')
const showAddToPlaylist = ref<number | null>(null)

const selectedPlaylist = computed<CustomPlaylist | null>(() => {
  if (!selectedPlaylistId.value) return null
  return playerStore.getCustomPlaylistById(selectedPlaylistId.value) || null
})

const selectedPlaylistSongs = computed<Song[]>(() => {
  if (!selectedPlaylistId.value) return []
  return playerStore.getCustomPlaylistSongs(selectedPlaylistId.value)
})

function playSong(song: Song, list?: Song[]) {
  playerStore.playSong(song, list)
}

function toggleFavorite(song: Song) {
  playerStore.toggleFavorite(song.id)
}

function openCreateDialog() {
  newPlaylistName.value = ''
  showCreateDialog.value = true
}

function createPlaylist() {
  if (!newPlaylistName.value.trim()) return
  const pl = playerStore.createCustomPlaylist(newPlaylistName.value.trim())
  selectedPlaylistId.value = pl.id
  activeTab.value = 'playlists'
  showCreateDialog.value = false
  newPlaylistName.value = ''
}

function selectPlaylist(id: number) {
  selectedPlaylistId.value = id
}

function backToLibrary() {
  selectedPlaylistId.value = null
  showAddToPlaylist.value = null
}

function deletePlaylist(id: number) {
  if (!confirm('确定删除此歌单吗？')) return
  playerStore.deleteCustomPlaylist(id)
  if (selectedPlaylistId.value === id) {
    selectedPlaylistId.value = null
  }
}

function removeFromPlaylist(playlistId: number, songId: number) {
  playerStore.removeSongFromCustomPlaylist(playlistId, songId)
}

function toggleAddToPlaylist(songId: number) {
  showAddToPlaylist.value = showAddToPlaylist.value === songId ? null : songId
}

function addSongToPlaylist(playlistId: number, songId: number) {
  playerStore.addSongToCustomPlaylist(playlistId, songId)
  showAddToPlaylist.value = null
}

function playPlaylist(playlistId: number) {
  const songs = playerStore.getCustomPlaylistSongs(playlistId)
  if (songs.length > 0) {
    playerStore.playSong(songs[0], songs)
  }
}

function formatDate(ts: number) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
</script>

<template>
  <div class="library-view">
    <NavBar />

    <main class="main-content">
      <template v-if="!selectedPlaylistId">
        <div class="page-header">
          <h1 class="page-title">🎵 我的音乐</h1>
          <div class="tabs">
            <div
              class="tab"
              :class="{ active: activeTab === 'favorites' }"
              @click="activeTab = 'favorites'"
            >
              ⭐ 我的收藏
              <span class="tab-count">{{ playerStore.favoritesCount }}</span>
            </div>
            <div
              class="tab"
              :class="{ active: activeTab === 'playlists' }"
              @click="activeTab = 'playlists'"
            >
              📁 我的歌单
              <span class="tab-count">{{ playerStore.customPlaylists.length }}</span>
            </div>
          </div>
        </div>

        <template v-if="activeTab === 'favorites'">
          <div v-if="playerStore.favoriteSongs.length === 0" class="empty-state">
            <div class="empty-icon">⭐</div>
            <p class="empty-text">还没有收藏歌曲</p>
            <p class="empty-hint">去首页发现好听的音乐吧</p>
          </div>

          <div v-else class="song-list">
            <div
              v-for="(song, index) in playerStore.favoriteSongs"
              :key="song.id"
              class="song-item"
              :class="{ active: playerStore.currentSong?.id === song.id }"
              @click="playSong(song, playerStore.favoriteSongs)"
            >
              <div class="song-index">{{ index + 1 }}</div>
              <div class="song-cover">
                <img :src="song.cover" :alt="song.title" />
              </div>
              <div class="song-info">
                <h4>{{ song.title }}</h4>
                <p>{{ song.artist }}</p>
              </div>
              <div class="song-album">{{ song.album }}</div>
              <div class="song-duration">{{ playerStore.formatTime(song.duration) }}</div>
              <div class="song-actions">
                <button class="action-btn" title="添加到歌单" @click.stop="toggleAddToPlaylist(song.id)">
                  📁
                </button>
                <button class="action-btn favorite" title="取消收藏" @click.stop="toggleFavorite(song)">
                  ⭐
                </button>
                <button class="action-btn" title="播放" @click.stop="playSong(song, playerStore.favoriteSongs)">
                  {{ playerStore.currentSong?.id === song.id && playerStore.isPlaying ? '⏸️' : '▶️' }}
                </button>
              </div>

              <div v-if="showAddToPlaylist === song.id" class="add-menu">
                <div
                  v-for="pl in playerStore.customPlaylists"
                  :key="pl.id"
                  class="add-menu-item"
                  @click.stop="addSongToPlaylist(pl.id, song.id)"
                >
                  {{ pl.name }}
                </div>
              </div>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="playlists-toolbar">
            <button class="create-btn" @click="openCreateDialog">
              ＋ 创建歌单
            </button>
          </div>

          <div class="playlist-grid">
            <div
              v-for="playlist in playerStore.customPlaylists"
              :key="playlist.id"
              class="playlist-card"
              @click="selectPlaylist(playlist.id)"
            >
              <div class="playlist-cover">
                <img :src="playlist.cover" :alt="playlist.name" />
                <div class="play-overlay">
                  <span class="play-icon" @click.stop="playPlaylist(playlist.id)">▶️</span>
                </div>
              </div>
              <div class="playlist-info">
                <h3 class="playlist-name">{{ playlist.name }}</h3>
                <p class="playlist-meta">{{ playlist.songIds.length }} 首 · {{ formatDate(playlist.createdAt) }}</p>
                <button class="delete-btn" @click.stop="deletePlaylist(playlist.id)">删除</button>
              </div>
            </div>
          </div>
        </template>
      </template>

      <template v-else>
        <button class="back-btn" @click="backToLibrary">← 返回我的音乐</button>
        <div v-if="selectedPlaylist" class="playlist-detail">
          <div class="detail-header">
            <div class="detail-cover">
              <img :src="selectedPlaylist.cover" :alt="selectedPlaylist.name" />
            </div>
            <div class="detail-info">
              <span class="detail-tag">歌单</span>
              <h1 class="detail-name">{{ selectedPlaylist.name }}</h1>
              <p class="detail-meta">{{ selectedPlaylist.songIds.length }} 首歌曲</p>
              <button
                v-if="selectedPlaylist.songIds.length > 0"
                class="play-btn"
                @click="playPlaylist(selectedPlaylist.id)"
              >
                ▶️ 播放全部
              </button>
            </div>
          </div>

          <div v-if="selectedPlaylist.songIds.length === 0" class="empty-state">
            <div class="empty-icon">🎵</div>
            <p class="empty-text">歌单还没有歌曲</p>
          </div>

          <div v-else class="song-list">
            <div
              v-for="(song, index) in selectedPlaylistSongs"
              :key="song.id"
              class="song-item"
              :class="{ active: playerStore.currentSong?.id === song.id }"
              @click="playSong(song, selectedPlaylistSongs)"
            >
              <div class="song-index">{{ index + 1 }}</div>
              <div class="song-cover">
                <img :src="song.cover" :alt="song.title" />
              </div>
              <div class="song-info">
                <h4>{{ song.title }}</h4>
                <p>{{ song.artist }}</p>
              </div>
              <div class="song-album">{{ song.album }}</div>
              <div class="song-duration">{{ playerStore.formatTime(song.duration) }}</div>
              <div class="song-actions">
                <button class="action-btn favorite" @click.stop="toggleFavorite(song)">
                  {{ playerStore.isFavorite(song.id) ? '⭐' : '☆' }}
                </button>
                <button class="action-btn" title="从歌单移除" @click.stop="removeFromPlaylist(selectedPlaylist.id, song.id)">
                  🗑️
                </button>
                <button class="action-btn" @click.stop="playSong(song, selectedPlaylistSongs)">
                  {{ playerStore.currentSong?.id === song.id && playerStore.isPlaying ? '⏸️' : '▶️' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </main>

    <div v-if="showCreateDialog" class="dialog-overlay" @click.self="showCreateDialog = false">
      <div class="dialog">
        <h3 class="dialog-title">新建歌单</h3>
        <input
          type="text"
          v-model="newPlaylistName"
          class="dialog-input"
          placeholder="请输入歌单名称"
          @keyup.enter="createPlaylist"
        />
        <div class="dialog-actions">
          <button class="dialog-btn cancel" @click="showCreateDialog = false">取消</button>
          <button class="dialog-btn confirm" @click="createPlaylist">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.library-view {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8f9ff 0%, #f0f2f8 100%);
  padding-bottom: 100px;
}

@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .library-view {
    padding-bottom: calc(100px + 60px + env(safe-area-inset-bottom));
  }
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.page-header {
  margin-bottom: 32px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 16px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.tabs {
  display: flex;
  gap: 12px;
}

.tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #fff;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.tab.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.tab-count {
  font-size: 12px;
  opacity: 0.8;
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
  position: relative;
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

.song-index {
  width: 30px;
  text-align: center;
  font-size: 14px;
  color: #999;
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
  display: flex;
  gap: 8px;
}

.action-btn {
  background: transparent;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 50%;
  transition: all 0.2s ease;
  opacity: 0.5;
}

.action-btn:hover {
  background: rgba(102, 126, 234, 0.1);
  opacity: 1;
  transform: scale(1.1);
}

.action-btn.favorite {
  opacity: 1;
  color: #ffb800;
}

.add-menu {
  position: absolute;
  right: 20px;
  top: 100%;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  z-index: 10;
  min-width: 160px;
  overflow: hidden;
}

.add-menu-item {
  padding: 10px 16px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  transition: background 0.2s ease;
}

.add-menu-item:hover {
  background: #f8f9ff;
  color: #667eea;
}

.playlists-toolbar {
  margin-bottom: 20px;
}

.create-btn {
  padding: 10px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
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

.playlist-info {
  padding: 12px 4px;
}

.playlist-name {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.playlist-meta {
  font-size: 12px;
  color: #999;
  margin: 0 0 8px 0;
}

.delete-btn {
  background: transparent;
  border: 1px solid #ddd;
  color: #999;
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.delete-btn:hover {
  border-color: #ff6b6b;
  color: #ff6b6b;
}

.back-btn {
  background: transparent;
  border: none;
  color: #667eea;
  font-size: 14px;
  cursor: pointer;
  padding: 8px 0;
  margin-bottom: 20px;
}

.detail-header {
  display: flex;
  gap: 32px;
  padding: 24px;
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  border-radius: 20px;
  margin-bottom: 24px;
}

.detail-cover {
  width: 180px;
  height: 180px;
  border-radius: 16px;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 12px 32px rgba(102, 126, 234, 0.2);
}

.detail-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.detail-tag {
  display: inline-block;
  padding: 4px 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 12px;
  border-radius: 12px;
  margin-bottom: 12px;
  align-self: flex-start;
}

.detail-name {
  font-size: 32px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 8px 0;
}

.detail-meta {
  font-size: 14px;
  color: #999;
  margin: 0 0 20px 0;
}

.play-btn {
  align-self: flex-start;
  padding: 12px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 24px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.play-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  width: 90%;
  max-width: 400px;
}

.dialog-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 20px 0;
}

.dialog-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  margin-bottom: 20px;
  box-sizing: border-box;
}

.dialog-input:focus {
  border-color: #667eea;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.dialog-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dialog-btn.cancel {
  background: #f5f5f5;
  color: #666;
}

.dialog-btn.confirm {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

@media (max-width: 768px) {
  .library-view {
    padding-bottom: calc(68px + 60px + env(safe-area-inset-bottom));
  }

  .main-content {
    padding: 16px;
  }

  .page-header {
    margin-bottom: 20px;
  }

  .page-title {
    font-size: 24px;
  }

  .tabs {
    gap: 8px;
  }

  .tab {
    padding: 8px 14px;
    font-size: 13px;
  }

  .tab-count {
    font-size: 11px;
  }

  .playlists-toolbar {
    margin-bottom: 16px;
  }

  .create-btn {
    padding: 10px 20px;
    font-size: 13px;
  }

  .playlist-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
  }

  .playlist-name {
    font-size: 13px;
  }

  .playlist-meta {
    font-size: 11px;
  }

  .song-album {
    display: none;
  }

  .song-duration {
    display: none;
  }

  .detail-header {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }

  .detail-cover {
    width: 120px;
    height: 120px;
  }

  .detail-info {
    text-align: center;
    align-items: center;
  }

  .detail-tag,
  .play-btn {
    align-self: center;
  }

  .detail-name {
    font-size: 22px;
  }

  .detail-meta {
    font-size: 13px;
  }

  .play-btn {
    padding: 10px 28px;
    font-size: 14px;
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

  .back-btn {
    font-size: 14px;
    padding: 6px 0;
    margin-bottom: 14px;
  }

  .dialog {
    padding: 24px 20px;
    width: calc(100% - 40px);
    max-width: 360px;
  }

  .dialog-title {
    font-size: 17px;
  }

  .song-actions {
    gap: 4px;
  }

  .action-btn {
    font-size: 18px;
    padding: 6px;
    opacity: 1;
  }

  .add-menu {
    right: 8px;
    min-width: 140px;
    border-radius: 10px;
  }

  .add-menu-item {
    padding: 12px 14px;
    font-size: 14px;
  }
}
</style>
