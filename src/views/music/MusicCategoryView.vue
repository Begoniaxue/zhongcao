<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePlayerStore, type Song } from '../../stores/player'
import NavBar from '../../components/NavBar.vue'

const router = useRouter()
const playerStore = usePlayerStore()

const activeGenre = ref('全部')
const activeArtist = ref<string | null>(null)
const activeRankId = ref<string | null>(null)

const genreTags = ['全部', '华语', '欧美', '日韩', '流行', '摇滚', '民谣', '古风']

const filteredArtists = computed(() => {
  if (activeGenre.value === '全部') return playerStore.artists
  return playerStore.artists.filter(a => a.genre.includes(activeGenre.value))
})

const activeSongs = computed<Song[]>(() => {
  if (activeRankId.value) {
    const rl = playerStore.getRankListById(activeRankId.value)
    return rl ? rl.songs : []
  }
  if (activeArtist.value) {
    return playerStore.getSongsByArtist(activeArtist.value)
  }
  return []
})

const activeTitle = computed(() => {
  if (activeRankId.value) {
    return playerStore.getRankListById(activeRankId.value)?.name || ''
  }
  if (activeArtist.value) return activeArtist.value
  return ''
})

function selectGenre(tag: string) {
  activeGenre.value = tag
  activeArtist.value = null
  activeRankId.value = null
}

function selectArtist(name: string) {
  activeArtist.value = name
  activeRankId.value = null
}

function selectRank(id: string) {
  activeRankId.value = id
  activeArtist.value = null
}

function playSong(song: Song) {
  playerStore.playSong(song, activeSongs.value)
}

function goBack() {
  activeArtist.value = null
  activeRankId.value = null
}
</script>

<template>
  <div class="category-view">
    <NavBar />

    <main class="main-content">
      <template v-if="!activeArtist && !activeRankId">
        <section class="section">
          <h2 class="section-title">🔥 热门排行榜</h2>
          <div class="rank-grid">
            <div
              v-for="rank in playerStore.rankLists"
              :key="rank.id"
              class="rank-card"
              @click="selectRank(rank.id)"
            >
              <div class="rank-cover">
                <img :src="rank.cover" :alt="rank.name" />
                <div class="rank-badge">TOP</div>
              </div>
              <div class="rank-info">
                <h3>{{ rank.name }}</h3>
                <p>{{ rank.description }}</p>
              </div>
            </div>
          </div>
        </section>

        <section class="section">
          <h2 class="section-title">🎤 歌手分类</h2>
          <div class="genre-tags">
            <div
              v-for="tag in genreTags"
              :key="tag"
              class="genre-tag"
              :class="{ active: activeGenre === tag }"
              @click="selectGenre(tag)"
            >
              {{ tag }}
            </div>
          </div>

          <div class="artist-grid">
            <div
              v-for="artist in filteredArtists"
              :key="artist.id"
              class="artist-card"
              @click="selectArtist(artist.name)"
            >
              <div class="artist-avatar">
                <img :src="artist.avatar" :alt="artist.name" />
              </div>
              <div class="artist-name">{{ artist.name }}</div>
              <div class="artist-genre">{{ artist.genre }}</div>
            </div>
          </div>
        </section>
      </template>

      <template v-else>
        <button class="back-btn" @click="goBack">← 返回分类</button>
        <div class="detail-header">
          <h2 class="detail-title">{{ activeTitle }}</h2>
          <span class="detail-count">{{ activeSongs.length }} 首歌曲</span>
        </div>

        <div class="song-list">
          <div
            v-for="(song, index) in activeSongs"
            :key="song.id"
            class="song-item"
            :class="{ active: playerStore.currentSong?.id === song.id }"
            @click="playSong(song)"
          >
            <div class="song-index">
              <span v-if="activeRankId && index < 3" class="rank-top">{{ index + 1 }}</span>
              <span v-else>{{ index + 1 }}</span>
            </div>
            <div class="song-cover">
              <img :src="song.cover" :alt="song.title" />
            </div>
            <div class="song-info">
              <h4>{{ song.title }}</h4>
              <p>{{ song.artist }}</p>
            </div>
            <div class="song-album">{{ song.album }}</div>
            <div class="song-duration">{{ playerStore.formatTime(song.duration) }}</div>
            <button class="action-btn" @click.stop="playSong(song)">
              {{ playerStore.currentSong?.id === song.id && playerStore.isPlaying ? '⏸️' : '▶️' }}
            </button>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>

<style scoped>
.category-view {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8f9ff 0%, #f0f2f8 100%);
  padding-bottom: 100px;
}

@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .category-view {
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

.section-title {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 20px 0;
}

.rank-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 24px;
}

.rank-card {
  cursor: pointer;
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease;
}

.rank-card:hover {
  transform: translateY(-4px);
}

.rank-cover {
  position: relative;
  width: 100%;
  padding-top: 56%;
}

.rank-cover img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.rank-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 10px;
  font-weight: 600;
}

.rank-info {
  padding: 16px;
}

.rank-info h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 6px 0;
}

.rank-info p {
  font-size: 12px;
  color: #999;
  margin: 0;
}

.genre-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 24px;
}

.genre-tag {
  padding: 8px 20px;
  background: #fff;
  border-radius: 20px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.genre-tag:hover {
  color: #667eea;
}

.genre-tag.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.artist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 20px;
}

.artist-card {
  cursor: pointer;
  text-align: center;
  transition: transform 0.3s ease;
}

.artist-card:hover {
  transform: translateY(-4px);
}

.artist-avatar {
  width: 100%;
  padding-top: 100%;
  position: relative;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 10px;
}

.artist-avatar img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.artist-name {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.artist-genre {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.back-btn {
  background: transparent;
  border: none;
  color: #667eea;
  font-size: 14px;
  cursor: pointer;
  padding: 8px 0;
  margin-bottom: 16px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.detail-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
}

.detail-count {
  font-size: 14px;
  color: #999;
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

.song-index {
  width: 30px;
  text-align: center;
  font-size: 14px;
  color: #999;
}

.song-index .rank-top {
  display: inline-block;
  color: #667eea;
  font-weight: 700;
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
  .category-view {
    padding-bottom: calc(68px + 60px + env(safe-area-inset-bottom));
  }

  .main-content {
    padding: 16px;
  }

  .section {
    margin-bottom: 28px;
  }

  .section-title {
    font-size: 20px;
    margin-bottom: 14px;
  }

  .rank-grid {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .rank-card:active {
    transform: scale(0.98);
  }

  .genre-tags {
    gap: 8px;
    margin-bottom: 18px;
  }

  .genre-tag {
    padding: 7px 14px;
    font-size: 13px;
  }

  .artist-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
  }

  .artist-name {
    font-size: 13px;
  }

  .artist-genre {
    font-size: 11px;
  }

  .song-album {
    display: none;
  }

  .song-duration {
    display: none;
  }

  .action-btn {
    opacity: 1;
  }

  .detail-header {
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 14px;
  }

  .detail-title {
    font-size: 22px;
  }

  .detail-count {
    font-size: 13px;
  }

  .song-list {
    border-radius: 10px;
  }

  .song-item {
    padding: 12px 14px;
    gap: 12px;
    min-height: 60px;
  }

  .song-index {
    width: 24px;
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
    margin-bottom: 12px;
  }
}
</style>
