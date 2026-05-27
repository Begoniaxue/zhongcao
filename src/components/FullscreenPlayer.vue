<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { usePlayerStore, type Song } from '../stores/player'

const props = defineProps<{
  song: Song | null
}>()

const playerStore = usePlayerStore()
const emit = defineEmits<{
  (e: 'close'): void
}>()

const showSpectrum = ref(true)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)
let audioCtx: AudioContext | null = null
let analyser: AnalyserNode | null = null
let sourceNode: MediaElementAudioSourceNode | null = null
let animationId: number | null = null
let spectrumData: Uint8Array | null = null
let freqData: Uint8Array | null = null
let initialized = false
let touchStartY = 0
let touchStartX = 0
let isDragging = false
let startY = 0

onMounted(() => {
  if (props.song) {
    nextTick(() => initSpectrum())
  }
  if (containerRef.value) {
    containerRef.value.addEventListener('touchstart', handleTouchStart, { passive: true })
    containerRef.value.addEventListener('touchmove', handleTouchMove, { passive: true })
    containerRef.value.addEventListener('touchend', handleTouchEnd, { passive: true })
  }
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  destroySpectrum()
  if (audioCtx) {
    try {
      audioCtx.close()
    } catch {}
    audioCtx = null
  }
  if (containerRef.value) {
    containerRef.value.removeEventListener('touchstart', handleTouchStart)
    containerRef.value.removeEventListener('touchmove', handleTouchMove)
    containerRef.value.removeEventListener('touchend', handleTouchEnd)
  }
  window.removeEventListener('resize', handleResize)
})

function handleTouchStart(e: TouchEvent) {
  if (e.touches.length === 1) {
    touchStartY = e.touches[0].clientY
    touchStartX = e.touches[0].clientX
    startY = e.touches[0].clientY
  }
}

function handleTouchMove(e: TouchEvent) {
  if (!isDragging && touchStartY !== 0) {
    const deltaY = e.touches[0].clientY - touchStartY
    const deltaX = Math.abs(e.touches[0].clientX - touchStartX)
    if (deltaY > 50 && deltaY > deltaX * 1.5) {
      isDragging = true
    }
  }
  if (isDragging && containerRef.value) {
    const currentY = e.touches[0].clientY
    const diff = currentY - startY
    if (diff > 0) {
      containerRef.value.style.transform = `translateY(${diff}px)`
      containerRef.value.style.opacity = `${1 - diff / 400}`
    }
  }
}

function handleTouchEnd(e: TouchEvent) {
  if (isDragging && containerRef.value) {
    const currentY = e.changedTouches[0].clientY
    const diff = currentY - startY
    if (diff > 150) {
      emit('close')
    } else {
      containerRef.value.style.transform = ''
      containerRef.value.style.opacity = ''
    }
  }
  isDragging = false
  touchStartY = 0
  touchStartX = 0
  startY = 0
}

function handleResize() {
  if (canvasRef.value && analyser) {
    resizeCanvas()
  }
}

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
  if (playerStore.isMuted || playerStore.volume === 0) return '🔇'
  if (playerStore.volume < 0.5) return '🔉'
  return '🔊'
})

const currentVolume = computed(() =>
  playerStore.isMuted ? 0 : playerStore.volume * 100
)

function onVolumeInput(e: Event) {
  const target = e.target as HTMLInputElement
  playerStore.setVolume(Number(target.value) / 100)
}

function onProgressInput(e: Event) {
  const target = e.target as HTMLInputElement
  playerStore.seek((Number(target.value) / 100) * playerStore.duration)
}

watch(() => props.song?.id, () => {
  if (props.song && showSpectrum.value) {
    nextTick(() => initSpectrum())
  }
})

function initSpectrum() {
  if (!props.song || !canvasRef.value || initialized) return
  const audio = playerStore.audioElement
  if (!audio) return
  if (!audioCtx) {
    try {
      const AC = (window as any).AudioContext || (window as any).webkitAudioContext
      if (!AC) return
      audioCtx = new AC()
      analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      spectrumData = new Uint8Array(analyser.frequencyBinCount)
      freqData = new Uint8Array(analyser.frequencyBinCount)
      sourceNode = audioCtx.createMediaElementSource(audio)
      sourceNode.connect(analyser)
      analyser.connect(audioCtx.destination)
      initialized = true
    } catch (err) {
      console.warn('Spectrum init failed:', err)
      return
    }
  }
  if (audioCtx?.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }
  drawSpectrum()
}

function resizeCanvas() {
  if (!canvasRef.value) return
  const canvas = canvasRef.value
  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  const ctx = canvas.getContext('2d')
  if (ctx) ctx.scale(dpr, dpr)
  canvas.width = rect.width
  canvas.height = rect.height
}

function drawSpectrum() {
  if (!canvasRef.value || !analyser || !spectrumData || !freqData || !audioCtx) return
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  resizeCanvas()

  function animate() {
    if (!canvasRef.value || !analyser || !spectrumData || !freqData) return
    animationId = requestAnimationFrame(animate)

    analyser.getByteFrequencyData(freqData)
    const bars = 64
    const barWidth = canvas.width / bars
    const barStep = Math.floor(freqData.length / bars)

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (let i = 0; i < bars; i++) {
      let sum = 0
      for (let j = 0; j < barStep; j++) {
        sum += freqData[i * barStep + j]
      }
      const value = sum / barStep
      const barHeight = (value / 255) * canvas.height * 0.9
      const x = i * barWidth
      const y = canvas.height - barHeight

      const gradient = ctx.createLinearGradient(0, y, 0, canvas.height)
      gradient.addColorStop(0, '#667eea')
      gradient.addColorStop(1, '#764ba2')
      ctx.fillStyle = gradient
      ctx.fillRect(x + 1, y, barWidth - 2, barHeight)
    }

    analyser.getByteTimeDomainData(spectrumData)

    ctx.lineWidth = 2
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'
    ctx.beginPath()

    for (let i = 0; i < spectrumData.length; i++) {
      const v = spectrumData[i] / 128.0
      const x = (i / spectrumData.length) * canvas.width
      const y = (v * canvas.height) / 2
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.stroke()
  }
  animate()
}

function destroySpectrum() {
  if (animationId !== null) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
}

function toggleSpectrum() {
  showSpectrum.value = !showSpectrum.value
  if (showSpectrum.value) {
    nextTick(() => initSpectrum())
  } else {
    destroySpectrum()
  }
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <div class="fullscreen-player" v-if="song" ref="containerRef">
    <div class="bg-layer">
      <img :src="song.cover" :alt="song.title" class="bg-cover" />
      <div class="bg-mask"></div>
    </div>

    <div class="fs-content">
      <div class="fs-top">
        <button class="fs-back" @click="handleClose">
          ↓
        </button>
        <div class="fs-title">
          <h1 class="fs-song-title">{{ song.title }}</h1>
          <p class="fs-song-artist">{{ song.artist }}</p>
        </div>
        <button
          class="fs-icon-btn"
          :title="playerStore.isFavorite(song.id) ? '取消收藏' : '收藏'"
          @click="playerStore.toggleFavorite(song.id)"
        >
          {{ playerStore.isFavorite(song.id) ? '⭐' : '☆' }}
        </button>
      </div>

      <div class="fs-center">
        <div class="fs-cover-wrapper">
          <div class="fs-cover" :class="{ rotating: playerStore.isPlaying }">
            <img :src="song.cover" :alt="song.title" />
          </div>
        </div>
      </div>

      <div class="fs-bottom">
        <div class="fs-progress">
          <span class="fs-time">{{ playerStore.formattedCurrentTime }}</span>
          <div class="fs-progress-bar">
            <input
              type="range"
              class="fs-range"
              :value="playerStore.progressPercent"
              min="0"
              max="100"
              step="0.1"
              @input="onProgressInput"
            />
            <div class="fs-progress-track">
              <div class="fs-progress-fill" :style="{ width: playerStore.progressPercent + '%' }"></div>
            </div>
          </div>
          <span class="fs-time">{{ playerStore.formattedDuration }}</span>
        </div>

        <div class="fs-controls">
          <button
            class="fs-control"
            :title="playModeText"
            @click="playerStore.togglePlayMode()"
          >
            {{ playModeIcon }}
          </button>
          <button class="fs-control prev-btn" @click="playerStore.playPrev()">⏮️</button>
          <button class="fs-play-btn" @click="playerStore.togglePlay()">
            {{ playerStore.isPlaying ? '⏸️' : '▶️' }}
          </button>
          <button class="fs-control next-btn" @click="playerStore.playNext()">⏭️</button>
          <button
            class="fs-control"
            :class="{ active: !showSpectrum }"
            title="频谱"
            @click="toggleSpectrum"
          >
            🎵
          </button>
        </div>

        <div class="fs-volume">
          <button class="fs-control" @click="playerStore.toggleMute()">
            {{ volumeIcon }}
          </button>
          <div class="fs-volume-track">
            <input
              type="range"
              class="fs-volume-slider"
              :value="currentVolume"
              min="0"
              max="100"
              step="1"
              @input="onVolumeInput"
            />
            <div class="fs-volume-bg">
              <div class="fs-volume-fill" :style="{ width: currentVolume + '%' }"></div>
            </div>
          </div>
        </div>

        <div v-if="showSpectrum" class="fs-spectrum">
          <canvas ref="canvasRef" class="spectrum-canvas"></canvas>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fullscreen-player {
  position: fixed;
  inset: 0;
  z-index: 2000;
  color: #fff;
  overflow: hidden;
  background: #000;
  touch-action: none;
  transition: transform 0.3s ease, opacity 0.3s ease;
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

.bg-layer {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.bg-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(40px) brightness(0.5);
  transform: scale(1.3);
}

.bg-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%);
}

.fs-content {
  position: relative;
  z-index: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 24px;
  padding-top: calc(24px + env(safe-area-inset-top));
  padding-bottom: calc(24px + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.fs-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
}

.fs-back {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #fff;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  font-size: 22px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.1s ease;
  flex-shrink: 0;
}

.fs-back:active {
  transform: scale(0.95);
  background: rgba(255, 255, 255, 0.25);
}

.fs-title {
  flex: 1;
  text-align: center;
  overflow: hidden;
  min-width: 0;
}

.fs-song-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fs-song-artist {
  font-size: 13px;
  opacity: 0.7;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fs-icon-btn {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #fff;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.1s ease;
  flex-shrink: 0;
}

.fs-icon-btn:active {
  transform: scale(0.95);
  background: rgba(255, 255, 255, 0.25);
}

.fs-center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  padding: 20px 0;
}

.fs-cover-wrapper {
  width: min(60vw, 340px);
  aspect-ratio: 1;
  max-height: 50vh;
}

.fs-cover {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 0 60px rgba(102, 126, 234, 0.5);
  animation: none;
}

.fs-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.fs-cover.rotating {
  animation: rotate 20s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.fs-bottom {
  flex-shrink: 0;
  padding-top: 16px;
}

.fs-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.fs-time {
  font-size: 12px;
  opacity: 0.7;
  min-width: 44px;
  text-align: center;
  flex-shrink: 0;
}

.fs-progress-bar {
  flex: 1;
  position: relative;
  height: 28px;
  display: flex;
  align-items: center;
  min-width: 0;
}

.fs-range {
  position: absolute;
  inset: -8px 0;
  width: 100%;
  height: 44px;
  opacity: 0;
  cursor: pointer;
  z-index: 2;
  margin: 0;
  padding: 0;
  -webkit-appearance: none;
}

.fs-progress-track {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
}

.fs-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
}

.fs-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.fs-control {
  background: transparent;
  border: none;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  padding: 12px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.9;
  transition: transform 0.1s ease, background 0.1s ease;
  -webkit-tap-highlight-color: transparent;
  min-width: 48px;
  min-height: 48px;
  flex-shrink: 0;
}

.fs-control:active {
  transform: scale(0.95);
  background: rgba(255, 255, 255, 0.15);
}

.fs-control.active {
  opacity: 1;
  color: #667eea;
}

.fs-play-btn {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 30px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
  transition: transform 0.1s ease;
  -webkit-tap-highlight-color: transparent;
  flex-shrink: 0;
  min-width: 64px;
  min-height: 64px;
}

.fs-play-btn:active {
  transform: scale(0.95);
}

.fs-volume {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
}

.fs-volume-track {
  width: 160px;
  position: relative;
  height: 28px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.fs-volume-slider {
  position: absolute;
  inset: -8px 0;
  width: 100%;
  height: 44px;
  opacity: 0;
  cursor: pointer;
  z-index: 2;
  margin: 0;
  padding: 0;
  -webkit-appearance: none;
}

.fs-volume-bg {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
}

.fs-volume-fill {
  height: 100%;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 2px;
}

.fs-spectrum {
  height: 100px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  overflow: hidden;
  touch-action: none;
}

.spectrum-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

@media (max-width: 768px) {
  .fs-content {
    padding: 16px;
    padding-top: calc(16px + env(safe-area-inset-top));
    padding-bottom: calc(16px + env(safe-area-inset-bottom));
  }

  .fs-top {
    gap: 8px;
  }

  .fs-back,
  .fs-icon-btn {
    width: 44px;
    height: 44px;
    min-width: 44px;
    min-height: 44px;
    font-size: 20px;
  }

  .fs-song-title {
    font-size: 16px;
  }

  .fs-song-artist {
    font-size: 12px;
  }

  .fs-center {
    padding: 10px 0;
  }

  .fs-cover-wrapper {
    width: 72vw;
  }

  .fs-controls {
    gap: 6px;
    margin-bottom: 16px;
  }

  .fs-control {
    padding: 8px;
    font-size: 22px;
    min-width: 44px;
    min-height: 44px;
  }

  .fs-control.prev-btn,
  .fs-control.next-btn {
    font-size: 22px;
  }

  .fs-play-btn {
    width: 58px;
    height: 58px;
    min-width: 58px;
    min-height: 58px;
    font-size: 26px;
  }

  .fs-volume {
    gap: 8px;
    margin-bottom: 12px;
  }

  .fs-volume-track {
    width: 140px;
  }

  .fs-progress {
    margin-bottom: 20px;
    gap: 8px;
  }

  .fs-time {
    font-size: 11px;
    min-width: 38px;
  }

  .fs-spectrum {
    height: 80px;
    border-radius: 10px;
  }
}

@media (max-width: 380px) {
  .fs-cover-wrapper {
    width: 68vw;
  }

  .fs-controls {
    gap: 2px;
  }

  .fs-control {
    min-width: 40px;
    min-height: 40px;
    padding: 6px;
    font-size: 20px;
  }

  .fs-play-btn {
    width: 54px;
    height: 54px;
    min-width: 54px;
    min-height: 54px;
  }

  .fs-volume-track {
    width: 120px;
  }
}
</style>
