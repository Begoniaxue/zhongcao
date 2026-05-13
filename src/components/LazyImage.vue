<template>
  <div 
    class="lazy-image-wrapper" 
    ref="wrapperRef"
    :style="{ aspectRatio: `${width} / ${height}` }"
  >
    <div v-if="!isLoaded && !hasError" class="placeholder">
      <svg class="placeholder-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    </div>
    <div v-if="hasError" class="error">
      <svg class="error-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span>加载失败</span>
    </div>
    <img
      v-show="isLoaded"
      :src="src"
      :alt="alt"
      :loading="loading"
      :class="{ 'is-loaded': isLoaded }"
      @load="onLoad"
      @error="onError"
      class="lazy-image"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

interface Props {
  src: string
  alt?: string
  width: number
  height: number
  loading?: 'lazy' | 'eager'
  threshold?: number
}

const props = withDefaults(defineProps<Props>(), {
  alt: '',
  loading: 'lazy',
  threshold: 0.1
})

const wrapperRef = ref<HTMLElement | null>(null)
const isLoaded = ref(false)
const hasError = ref(false)
const isVisible = ref(false)

let observer: IntersectionObserver | null = null

const onLoad = () => {
  isLoaded.value = true
}

const onError = () => {
  hasError.value = true
  isLoaded.value = false
}

const setupObserver = () => {
  if (props.loading === 'eager') {
    isVisible.value = true
    return
  }

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          isVisible.value = true
          if (observer && wrapperRef.value) {
            observer.unobserve(wrapperRef.value)
          }
        }
      })
    },
    {
      root: null,
      rootMargin: '200px 0px',
      threshold: props.threshold
    }
  )

  if (wrapperRef.value) {
    observer.observe(wrapperRef.value)
  }
}

watch([() => props.src], () => {
  isLoaded.value = false
  hasError.value = false
})

onMounted(() => {
  setupObserver()
})

onUnmounted(() => {
  if (observer && wrapperRef.value) {
    observer.unobserve(wrapperRef.value)
  }
  if (observer) {
    observer.disconnect()
  }
})
</script>

<style scoped>
.lazy-image-wrapper {
  position: relative;
  width: 100%;
  overflow: hidden;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.placeholder, .error {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #ccc;
  z-index: 1;
}

.placeholder-svg, .error-svg {
  width: 48px;
  height: 48px;
  opacity: 0.5;
}

.error span {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}

.lazy-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.lazy-image.is-loaded {
  opacity: 1;
}
</style>
