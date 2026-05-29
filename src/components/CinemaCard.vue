<script setup lang="ts">
import type { Cinema } from '../types/movie'

defineProps<{
  cinema: Cinema
}>()

defineEmits<{
  click: [cinema: Cinema]
}>()

function getHallTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'IMAX': '巨幕',
    'Dolby': '杜比',
    'Normal': '普通'
  }
  return labels[type] || type
}

function formatDistance(distance: number): string {
  if (distance < 1000) {
    return `${distance}m`
  }
  return `${(distance / 1000).toFixed(1)}km`
}
</script>

<template>
  <div class="cinema-card" @click="$emit('click', cinema)">
    <div class="cinema-header">
      <h3 class="cinema-name">{{ cinema.name }}</h3>
      <div class="cinema-price">
        <span class="price-symbol">¥</span>
        <span class="price-value">{{ cinema.minPrice }}</span>
        <span class="price-unit">起</span>
      </div>
    </div>
    <div class="cinema-info">
      <div class="info-row">
        <span class="info-icon">📍</span>
        <span class="info-text">{{ cinema.address }}</span>
      </div>
      <div class="info-row">
        <span class="info-icon">📞</span>
        <span class="info-text">{{ cinema.phone }}</span>
      </div>
      <div class="info-row">
        <span class="info-icon">🕐</span>
        <span class="info-text">{{ cinema.businessHours }}</span>
      </div>
    </div>
    <div class="cinema-footer">
      <div class="hall-types">
        <span
          v-for="type in cinema.hallTypes"
          :key="type"
          class="hall-tag"
          :class="type.toLowerCase()"
        >
          {{ getHallTypeLabel(type) }}
        </span>
      </div>
      <div class="cinema-meta">
        <span class="distance">{{ formatDistance(cinema.distance) }}</span>
        <span class="popularity">热度 {{ cinema.popularity }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cinema-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.2s ease;
}

.cinema-card:active {
  transform: scale(0.98);
  background: #f8f9ff;
}

.cinema-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.cinema-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
  flex: 1;
  padding-right: 12px;
  line-height: 1.4;
}

.cinema-price {
  display: flex;
  align-items: baseline;
  white-space: nowrap;
}

.price-symbol {
  font-size: 12px;
  color: #ff6b6b;
  font-weight: 500;
}

.price-value {
  font-size: 18px;
  color: #ff6b6b;
  font-weight: 700;
}

.price-unit {
  font-size: 12px;
  color: #999;
  margin-left: 2px;
}

.cinema-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.info-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}

.info-icon {
  font-size: 14px;
  flex-shrink: 0;
  margin-top: 1px;
}

.info-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.cinema-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.hall-types {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.hall-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.hall-tag.imax {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.hall-tag.dolby {
  background: rgba(118, 75, 162, 0.1);
  color: #764ba2;
}

.hall-tag.normal {
  background: rgba(102, 102, 102, 0.1);
  color: #666;
}

.cinema-meta {
  display: flex;
  gap: 10px;
  font-size: 12px;
  color: #999;
}

.distance {
  color: #667eea;
}

@media (min-width: 768px) {
  .cinema-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  }
}
</style>
