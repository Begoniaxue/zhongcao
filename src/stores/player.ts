import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Song {
  id: number
  title: string
  artist: string
  album: string
  cover: string
  url: string
  duration: number
}

export interface Playlist {
  id: number
  name: string
  cover: string
  description: string
  playCount: number
  songs: Song[]
}

export interface Artist {
  id: number
  name: string
  avatar: string
  genre: string
  songCount: number
  description: string
}

export interface RankList {
  id: string
  name: string
  cover: string
  description: string
  songs: Song[]
}

export interface CustomPlaylist {
  id: number
  name: string
  cover: string
  createdAt: number
  songIds: number[]
}

export interface PlayHistoryItem {
  id: number
  title: string
  artist: string
  album: string
  cover: string
  url: string
  duration: number
  playedAt: number
}

export interface CachedSong {
  url: string
  blobUrl: string
  expiresAt: number
  size: number
}

const artists = [
  '周杰伦', '林俊杰', '陈奕迅', '王力宏', '陶喆',
  '薛之谦', '李荣浩', '毛不易', '华晨宇', '许嵩',
  '邓紫棋', '张靓颖', '田馥甄', '蔡依林', '孙燕姿',
  'Taylor Swift', 'Ed Sheeran', 'Adele', 'Bruno Mars', 'The Weeknd',
  'Coldplay', 'Imagine Dragons', 'Maroon 5', 'OneRepublic', 'Charlie Puth'
]

const albums = [
  '叶惠美', '魔杰座', '七里香', '我很忙', '十一月的萧邦',
  '范特西', '依然范特西', '跨时代', '惊叹号', '十二新作',
  '哎呦不错哦', '周杰伦的床边故事', '等你下课', '说好不哭', '最伟大的作品',
  '1989', '25', 'Divide', '24K Magic', 'After Hours'
]

const titles = [
  '晴天', '稻香', '七里香', '青花瓷', '夜曲', '简单爱', '搁浅', '听妈妈的话',
  '告白气球', '说好的幸福呢', '烟花易冷', '兰亭序', '红尘客栈', '明明就', '手写的从前',
  '珊瑚海', '发如雪', '退后', '黑色毛衣', '四面楚歌', '枫', '浪漫手机', '逆鳞',
  '麦芽糖', '珊瑚海', '飘移', '一路向北', '不能说的秘密', '彩虹', '蒲公英的约定',
  '无双', '我不配', '扯', '甜甜的', '最长的电影', '龙战骑士', '给我一首歌的时间',
  '蛇舞', '花海', '魔术先生', '说好的幸福呢', '兰亭序', '流浪诗人', '时光机',
  'Shake It Off', 'Blank Space', 'Style', 'Shape of You', 'Perfect', 'Hello',
  'Someone Like You', 'Rolling in the Deep', 'Uptown Funk', 'Blinding Lights',
  'Viva La Vida', 'Believer', 'Sugar', 'Counting Stars', 'Attention'
]

const coverPrompts = [
  'blue sky sunny day', 'rice field countryside warm sunset', 'japanese garden cherry blossom',
  'blue and white porcelain traditional chinese', 'night scene moonlight piano',
  'romantic love heart warm colors', 'ocean beach sunset melancholy', 'family love warm cozy home',
  'city skyline neon lights', 'mountain landscape nature', 'forest autumn golden',
  'abstract art geometric pattern', 'galaxy space stars', 'retro vintage vinyl record',
  'coffee shop cozy interior', 'library books reading', 'rainy day window',
  'summer beach vacation', 'winter snow wonderland', 'spring flowers blooming'
]

const audioUrls = [
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3'
]

const artistGenres = [
  '华语男歌手', '华语男歌手', '华语男歌手', '华语男歌手', '华语男歌手',
  '华语男歌手', '华语男歌手', '华语男歌手', '华语男歌手', '华语男歌手',
  '华语女歌手', '华语女歌手', '华语女歌手', '华语女歌手', '华语女歌手',
  '欧美女歌手', '欧美男歌手', '欧美女歌手', '欧美男歌手', '欧美男歌手',
  '欧美乐队', '欧美乐队', '欧美乐队', '欧美乐队', '欧美男歌手'
]

const genreTags = ['华语', '欧美', '日韩', '流行', '摇滚', '电子', '民谣', '古风']

function generateMockSongs(count: number): Song[] {
  const songs: Song[] = []
  for (let i = 1; i <= count; i++) {
    const titleIndex = (i - 1) % titles.length
    const artistIndex = Math.floor((i - 1) / titles.length) % artists.length
    const albumIndex = Math.floor((i - 1) / (titles.length * 2)) % albums.length
    const coverIndex = (i - 1) % coverPrompts.length
    const urlIndex = (i - 1) % audioUrls.length

    songs.push({
      id: i,
      title: `${titles[titleIndex]} (No.${i})`,
      artist: artists[artistIndex],
      album: albums[albumIndex],
      cover: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=album%20cover%20art%20${encodeURIComponent(coverPrompts[coverIndex])}&image_size=square`,
      url: audioUrls[urlIndex],
      duration: 180 + Math.floor(Math.random() * 240)
    })
  }
  return songs
}

function generateArtists(): Artist[] {
  return artists.map((name, idx) => ({
    id: idx + 1,
    name,
    avatar: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=artist%20portrait%20${encodeURIComponent(name)}&image_size=square`,
    genre: artistGenres[idx] || '流行',
    songCount: 10 + Math.floor(Math.random() * 90),
    description: `${name}的作品集`
  }))
}

const demoSongs: Song[] = generateMockSongs(1000)

const demoPlaylists: Playlist[] = [
  {
    id: 1,
    name: '华语经典金曲 1000首',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=playlist%20cover%20chinese%20classic%20music%20golden%20oldies%20retro&image_size=square',
    description: '精选华语乐坛经典金曲1000首，测试大量数据下的列表滑动和播放性能',
    playCount: 125680,
    songs: demoSongs.slice(0, 1000)
  },
  {
    id: 2,
    name: '热门歌曲 Top 500',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=playlist%20cover%20hot%20trending%20music%20fire%20popular&image_size=square',
    description: '当下最热门的500首歌曲，滚动测试流畅度',
    playCount: 89340,
    songs: demoSongs.slice(0, 500)
  },
  {
    id: 3,
    name: '新歌速递 Top 200',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=playlist%20cover%20new%20music%20latest%20release&image_size=square',
    description: '最新上线的200首新歌',
    playCount: 67230,
    songs: demoSongs.slice(0, 200)
  },
  {
    id: 4,
    name: '运动健身歌单',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=playlist%20cover%20fitness%20gym%20workout%20energy%20sports&image_size=square',
    description: '高能量运动音乐，让健身更有动力',
    playCount: 156780,
    songs: demoSongs.slice(0, 100)
  }
]

const demoArtists: Artist[] = generateArtists()

const demoRankLists: RankList[] = [
  {
    id: 'hot',
    name: '热歌榜',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=music%20ranking%20hot%20fire%20trending%20top%20chart&image_size=square',
    description: '本周最热门单曲排行',
    songs: [...demoSongs].sort(() => Math.random() - 0.5).slice(0, 30)
  },
  {
    id: 'new',
    name: '新歌榜',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=music%20ranking%20new%20release%20fresh%20latest&image_size=square',
    description: '最新上线新歌速递',
    songs: [...demoSongs].sort(() => Math.random() - 0.5).slice(0, 30)
  },
  {
    id: 'original',
    name: '原创榜',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=music%20ranking%20original%20indie%20creative&image_size=square',
    description: '优秀原创音乐人作品',
    songs: [...demoSongs].sort(() => Math.random() - 0.5).slice(0, 30)
  }
]

const STORAGE_KEYS = {
  FAVORITES: 'music_favorites_v1',
  CUSTOM_PLAYLISTS: 'music_custom_playlists_v1',
  HISTORY: 'music_history_v1',
  CACHE_INDEX: 'music_cache_index_v1'
}

const MAX_HISTORY = 200
const CACHE_TTL = 1000 * 60 * 60 * 24 * 7
const MAX_CACHE_SIZE = 200 * 1024 * 1024

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

export const usePlayerStore = defineStore('player', () => {
  const currentSong = ref<Song | null>(null)
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const volume = ref(0.7)
  const isMuted = ref(false)
  const playMode = ref<'sequence' | 'loop' | 'random'>('sequence')
  const playlist = ref<Song[]>(demoSongs)
  const currentIndex = ref(-1)
  const playlists = ref<Playlist[]>(demoPlaylists)
  const audioElement = ref<HTMLAudioElement | null>(null)
  const searchKeyword = ref('')

  const artists = ref<Artist[]>(demoArtists)
  const rankLists = ref<RankList[]>(demoRankLists)

  const favoriteIds = ref<Set<number>>(
    new Set<number>(loadFromStorage<number[]>(STORAGE_KEYS.FAVORITES, []))
  )

  const customPlaylists = ref<CustomPlaylist[]>(
    loadFromStorage<CustomPlaylist[]>(STORAGE_KEYS.CUSTOM_PLAYLISTS, [
      {
        id: 1001,
        name: '我喜欢',
        cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=music%20playlist%20heart%20love%20favorite%20warm&image_size=square',
        createdAt: Date.now(),
        songIds: []
      }
    ])
  )

  const playHistory = ref<PlayHistoryItem[]>(
    loadFromStorage<PlayHistoryItem[]>(STORAGE_KEYS.HISTORY, [])
  )

  const cacheIndex = ref<Map<string, CachedSong>>(
    new Map<string, CachedSong>(loadFromStorage<[string, CachedSong][]>(STORAGE_KEYS.CACHE_INDEX, []))
  )

  const isCacheEnabled = ref(true)

  const recommendedSongs = computed(() => demoSongs.slice(0, 100))

  const searchResults = computed(() => {
    if (!searchKeyword.value.trim()) {
      return []
    }
    const keyword = searchKeyword.value.toLowerCase().trim()
    return demoSongs.filter(
      song =>
        song.title.toLowerCase().includes(keyword) ||
        song.artist.toLowerCase().includes(keyword)
    )
  })

  const formattedCurrentTime = computed(() => formatTime(currentTime.value))
  const formattedDuration = computed(() => formatTime(duration.value))

  const progressPercent = computed(() => {
    if (duration.value === 0) return 0
    return (currentTime.value / duration.value) * 100
  })

  const favoriteSongs = computed(() =>
    demoSongs.filter(s => favoriteIds.value.has(s.id))
  )

  const favoritesCount = computed(() => favoriteIds.value.size)

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  function initAudio(audio: HTMLAudioElement) {
    audioElement.value = audio
    audio.volume = volume.value

    audio.addEventListener('timeupdate', () => {
      currentTime.value = audio.currentTime
    })

    audio.addEventListener('loadedmetadata', () => {
      duration.value = audio.duration
    })

    audio.addEventListener('ended', () => {
      handleSongEnd()
    })

    audio.addEventListener('play', () => {
      isPlaying.value = true
    })

    audio.addEventListener('pause', () => {
      isPlaying.value = false
    })

    audio.addEventListener('error', () => {
      console.warn('Audio playback error, trying fallback')
    })

    setupAudioContextCompatibility(audio)
    setupBackgroundPlayback(audio)

    if ('mediaSession' in navigator) {
      const ms = (navigator as any).mediaSession
      if (ms) {
        try {
          ms.setActionHandler('play', () => {
            togglePlay()
          })
          ms.setActionHandler('pause', () => {
            togglePlay()
          })
          ms.setActionHandler('previoustrack', () => {
            playPrev()
          })
          ms.setActionHandler('nexttrack', () => {
            playNext()
          })
        } catch {}
      }
    }
  }

  function setupAudioContextCompatibility(audio: HTMLAudioElement) {
    try {
      if (!audio.crossOrigin) {
        audio.crossOrigin = 'anonymous'
      }
    } catch {}
  }

  function setupBackgroundPlayback(audio: HTMLAudioElement) {
    try {
      audio.setAttribute('playsinline', 'true')
      audio.setAttribute('webkit-playsinline', 'true')
      audio.setAttribute('x5-playsinline', 'true')
      audio.setAttribute('x5-video-player-type', 'h5')
      audio.setAttribute('x5-video-player-fullscreen', 'false')
      audio.setAttribute('x5-video-orientation', 'portrait')
    } catch {}
  }

  function updateMediaSession() {
    if (!('mediaSession' in navigator) || !currentSong.value) return
    const ms = (navigator as any).mediaSession
    if (!ms) return

    try {
      if ((window as any).MediaMetadata) {
        ms.metadata = new (window as any).MediaMetadata({
          title: currentSong.value.title,
          artist: currentSong.value.artist,
          album: currentSong.value.album,
          artwork: [
            {
              src: currentSong.value.cover,
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        })
      }
    } catch {}
  }

  function addToHistory(song: Song) {
    const item: PlayHistoryItem = {
      id: song.id,
      title: song.title,
      artist: song.artist,
      album: song.album,
      cover: song.cover,
      url: song.url,
      duration: song.duration,
      playedAt: Date.now()
    }

    playHistory.value = playHistory.value.filter(h => h.id !== song.id)
    playHistory.value.unshift(item)

    if (playHistory.value.length > MAX_HISTORY) {
      playHistory.value = playHistory.value.slice(0, MAX_HISTORY)
    }
    saveToStorage(STORAGE_KEYS.HISTORY, playHistory.value)
  }

  function clearHistory() {
    playHistory.value = []
    saveToStorage(STORAGE_KEYS.HISTORY, [])
  }

  async function playSong(song: Song, songList?: Song[]) {
    if (songList) {
      playlist.value = songList
    }
    const index = playlist.value.findIndex(s => s.id === song.id)
    currentIndex.value = index >= 0 ? index : 0
    currentSong.value = song
    currentTime.value = 0

    if (audioElement.value) {
      const playUrl = await resolvePlayUrl(song)
      audioElement.value.src = playUrl
      audioElement.value.load()
      audioElement.value.play().catch(err => {
        console.warn('Play failed:', err)
      })
      addToHistory(song)
      updateMediaSession()
    }
  }

  function togglePlay() {
    if (!audioElement.value || !currentSong.value) return

    if (isPlaying.value) {
      audioElement.value.pause()
    } else {
      audioElement.value.play().catch(() => {})
    }
  }

  function playNext() {
    if (playlist.value.length === 0) return

    let nextIndex: number
    if (playMode.value === 'random') {
      nextIndex = Math.floor(Math.random() * playlist.value.length)
    } else {
      nextIndex = (currentIndex.value + 1) % playlist.value.length
    }
    playSong(playlist.value[nextIndex])
  }

  function playPrev() {
    if (playlist.value.length === 0) return

    let prevIndex: number
    if (playMode.value === 'random') {
      prevIndex = Math.floor(Math.random() * playlist.value.length)
    } else {
      prevIndex = currentIndex.value <= 0 ? playlist.value.length - 1 : currentIndex.value - 1
    }
    playSong(playlist.value[prevIndex])
  }

  function handleSongEnd() {
    if (playMode.value === 'loop') {
      if (audioElement.value) {
        audioElement.value.currentTime = 0
        audioElement.value.play().catch(() => {})
      }
    } else {
      playNext()
    }
  }

  function seek(time: number) {
    if (audioElement.value) {
      audioElement.value.currentTime = time
      currentTime.value = time
    }
  }

  function setVolume(value: number) {
    volume.value = value
    if (audioElement.value) {
      audioElement.value.volume = value
    }
    if (value > 0) {
      isMuted.value = false
    }
  }

  function toggleMute() {
    isMuted.value = !isMuted.value
    if (audioElement.value) {
      audioElement.value.volume = isMuted.value ? 0 : volume.value
    }
  }

  function togglePlayMode() {
    const modes: ('sequence' | 'loop' | 'random')[] = ['sequence', 'loop', 'random']
    const currentModeIndex = modes.indexOf(playMode.value)
    playMode.value = modes[(currentModeIndex + 1) % modes.length]
  }

  function getPlaylistById(id: number): Playlist | undefined {
    return playlists.value.find(p => p.id === id)
  }

  function setSearchKeyword(keyword: string) {
    searchKeyword.value = keyword
  }

  function clearSearch() {
    searchKeyword.value = ''
  }

  function toggleFavorite(songId: number) {
    if (favoriteIds.value.has(songId)) {
      favoriteIds.value.delete(songId)
    } else {
      favoriteIds.value.add(songId)
    }
    saveToStorage(STORAGE_KEYS.FAVORITES, Array.from(favoriteIds.value))
  }

  function isFavorite(songId: number): boolean {
    return favoriteIds.value.has(songId)
  }

  function createCustomPlaylist(name: string, cover?: string) {
    const newPlaylist: CustomPlaylist = {
      id: Date.now(),
      name: name || '新歌单',
      cover:
        cover ||
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=music%20playlist%20cover%20abstract%20colorful&image_size=square',
      createdAt: Date.now(),
      songIds: []
    }
    customPlaylists.value.push(newPlaylist)
    persistCustomPlaylists()
    return newPlaylist
  }

  function deleteCustomPlaylist(id: number) {
    customPlaylists.value = customPlaylists.value.filter(p => p.id !== id)
    persistCustomPlaylists()
  }

  function renameCustomPlaylist(id: number, name: string) {
    const pl = customPlaylists.value.find(p => p.id === id)
    if (pl) {
      pl.name = name
      persistCustomPlaylists()
    }
  }

  function addSongToCustomPlaylist(playlistId: number, songId: number) {
    const pl = customPlaylists.value.find(p => p.id === playlistId)
    if (pl && !pl.songIds.includes(songId)) {
      pl.songIds.push(songId)
      persistCustomPlaylists()
    }
  }

  function removeSongFromCustomPlaylist(playlistId: number, songId: number) {
    const pl = customPlaylists.value.find(p => p.id === playlistId)
    if (pl) {
      pl.songIds = pl.songIds.filter(id => id !== songId)
      persistCustomPlaylists()
    }
  }

  function getCustomPlaylistById(id: number): CustomPlaylist | undefined {
    return customPlaylists.value.find(p => p.id === id)
  }

  function getCustomPlaylistSongs(playlistId: number): Song[] {
    const pl = customPlaylists.value.find(p => p.id === playlistId)
    if (!pl) return []
    return pl.songIds
      .map(id => demoSongs.find(s => s.id === id))
      .filter((s): s is Song => !!s)
  }

  function persistCustomPlaylists() {
    saveToStorage(STORAGE_KEYS.CUSTOM_PLAYLISTS, customPlaylists.value)
  }

  function getSongsByArtist(artistName: string): Song[] {
    return demoSongs.filter(s => s.artist === artistName)
  }

  function getArtistsByGenre(genre: string): Artist[] {
    if (genre === '全部' || !genre) return artists.value
    return artists.value.filter(a => a.genre.includes(genre))
  }

  function getRankListById(id: string): RankList | undefined {
    return rankLists.value.find(r => r.id === id)
  }

  async function resolvePlayUrl(song: Song): Promise<string> {
    if (!isCacheEnabled.value) return song.url

    const cached = cacheIndex.value.get(song.url)
    if (cached && cached.expiresAt > Date.now()) {
      return cached.blobUrl
    }

    return song.url
  }

  async function cacheSong(song: Song): Promise<boolean> {
    if (!isCacheEnabled.value) return false
    try {
      if (cacheIndex.value.has(song.url)) return true
      if (!('caches' in window)) return false

      const resp = await fetch(song.url)
      if (!resp.ok) return false
      const blob = await resp.blob()
      if (blob.size > MAX_CACHE_SIZE / 5) return false

      const blobUrl = URL.createObjectURL(blob)
      const cached: CachedSong = {
        url: song.url,
        blobUrl,
        expiresAt: Date.now() + CACHE_TTL,
        size: blob.size
      }
      cacheIndex.value.set(song.url, cached)
      saveToStorage(
        STORAGE_KEYS.CACHE_INDEX,
        Array.from(cacheIndex.value.entries())
      )
      return true
    } catch (err) {
      console.warn('Cache failed:', err)
      return false
    }
  }

  function clearCache() {
    cacheIndex.value.forEach(v => {
      try {
        URL.revokeObjectURL(v.blobUrl)
      } catch {}
    })
    cacheIndex.value.clear()
    saveToStorage(STORAGE_KEYS.CACHE_INDEX, [])
  }

  function getCacheSize(): number {
    return Array.from(cacheIndex.value.values()).reduce((sum, v) => sum + v.size, 0)
  }

  function setCacheEnabled(enabled: boolean) {
    isCacheEnabled.value = enabled
  }

  return {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playMode,
    playlist,
    currentIndex,
    playlists,
    recommendedSongs,
    searchKeyword,
    searchResults,
    formattedCurrentTime,
    formattedDuration,
    progressPercent,
    artists,
    rankLists,
    favoriteIds,
    favoriteSongs,
    favoritesCount,
    customPlaylists,
    playHistory,
    cacheIndex,
    isCacheEnabled,
    initAudio,
    playSong,
    togglePlay,
    playNext,
    playPrev,
    seek,
    setVolume,
    toggleMute,
    togglePlayMode,
    getPlaylistById,
    setSearchKeyword,
    clearSearch,
    toggleFavorite,
    isFavorite,
    createCustomPlaylist,
    deleteCustomPlaylist,
    renameCustomPlaylist,
    addSongToCustomPlaylist,
    removeSongFromCustomPlaylist,
    getCustomPlaylistById,
    getCustomPlaylistSongs,
    getSongsByArtist,
    getArtistsByGenre,
    getRankListById,
    cacheSong,
    clearCache,
    getCacheSize,
    setCacheEnabled,
    clearHistory,
    formatTime
  }
})
