<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { usePlayerStore } from './stores/player'
import PlayerBar from './components/PlayerBar.vue'
import FullscreenPlayer from './components/FullscreenPlayer.vue'

const route = useRoute()
const playerStore = usePlayerStore()
const audioRef = ref<HTMLAudioElement | null>(null)
const showFullscreen = ref(false)

const musicRouteNames = ['musicHome', 'playlistList', 'playlistDetail', 'musicCategory', 'musicLibrary', 'playHistory']

const showPlayer = computed(() => {
  return musicRouteNames.includes(route.name as string)
})

onMounted(() => {
  if (audioRef.value) {
    playerStore.initAudio(audioRef.value)
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

function handleVisibilityChange() {
  if (document.visibilityState === 'visible' && playerStore.currentSong) {
    if (audioRef.value && playerStore.isPlaying) {
      audioRef.value.play().catch(() => {})
    }
  }
}

function openFullscreen() {
  if (playerStore.currentSong) {
    showFullscreen.value = true
  }
}

function closeFullscreen() {
  showFullscreen.value = false
}
</script>

<template>
  <div class="app">
    <router-view />
    <PlayerBar v-if="showPlayer" @openFullscreen="openFullscreen" />
    <FullscreenPlayer
      v-if="showFullscreen && showPlayer"
      :song="playerStore.currentSong"
      @close="closeFullscreen"
    />
    <audio ref="audioRef" preload="metadata" />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app {
  min-height: 100vh;
}
</style>
