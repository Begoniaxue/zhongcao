<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { Seat, SelectedSeat, Hall } from '../types/movie'

const props = defineProps<{
  hall: Hall
  maxSeats?: number
  basePrice: number
}>()

const emit = defineEmits<{
  seatChange: [seats: SelectedSeat[]]
  lockRequired: []
}>()

const maxSeats = computed(() => props.maxSeats || 6)
const seatGrid = ref<Seat[][]>([])
const hoveredSeat = ref<string | null>(null)

watch(() => props.hall, () => {
  if (props.hall?.seats) {
    seatGrid.value = JSON.parse(JSON.stringify(props.hall.seats))
  }
}, { immediate: true, deep: true })

const selectedSeats = computed<SelectedSeat[]>(() => {
  const seats: SelectedSeat[] = []
  seatGrid.value.forEach((row, rowIndex) => {
    row.forEach((seat, colIndex) => {
      if (seat.status === 'selected') {
        seats.push({
          id: seat.id,
          row: rowIndex + 1,
          col: colIndex + 1,
          seatLabel: `${String.fromCharCode(65 + rowIndex)}${colIndex + 1}`,
          price: seat.price
        })
      }
    })
  })
  return seats.sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row
    return a.col - b.col
  })
})

watch(selectedSeats, (newVal) => {
  emit('seatChange', newVal)
}, { immediate: true })

function getSeatClass(seat: Seat): string {
  const classes = ['seat']
  classes.push(`seat-${seat.status}`)
  if (seat.isCouple) classes.push('seat-couple')
  if (hoveredSeat.value === seat.id) classes.push('seat-hover')
  return classes.join(' ')
}

function isAdjacentBlocked(row: number, col: number): boolean {
  const leftSeat = seatGrid.value[row]?.[col - 1]
  const rightSeat = seatGrid.value[row]?.[col + 1]
  
  if (leftSeat?.status === 'selected' && rightSeat?.status === 'selected') {
    return false
  }
  
  if (leftSeat?.status === 'selected') {
    const leftLeftSeat = seatGrid.value[row]?.[col - 2]
    if (!leftLeftSeat || leftLeftSeat.status === 'sold' || leftLeftSeat.status === 'selected') {
      return false
    }
  }
  
  if (rightSeat?.status === 'selected') {
    const rightRightSeat = seatGrid.value[row]?.[col + 2]
    if (!rightRightSeat || rightRightSeat.status === 'sold' || rightRightSeat.status === 'selected') {
      return false
    }
  }
  
  return false
}

function handleSeatClick(seat: Seat, rowIndex: number, colIndex: number) {
  if (seat.status === 'sold' || seat.status === 'locked') {
    if (seat.status === 'sold') {
      ElMessage.error('该座位已售出')
    } else {
      ElMessage.error('该座位已被锁定')
    }
    return
  }
  
  if (seat.status === 'corner') {
    ElMessage.warning('该位置为死角位，不推荐选择')
  }
  
  if (seat.status === 'selected') {
    seat.status = 'available'
  } else {
    if (selectedSeats.value.length >= maxSeats.value) {
      ElMessage.warning(`最多只能选择 ${maxSeats.value} 个座位`)
      return
    }
    
    if (isAdjacentBlocked(rowIndex, colIndex)) {
      ElMessage.warning('为了避免单人入座，请选择相邻座位或留出空位')
      return
    }
    
    seat.status = 'selected'
    emit('lockRequired')
  }
}

function handleSeatHover(seatId: string, isHover: boolean) {
  hoveredSeat.value = isHover ? seatId : null
}

const rowLabels = computed(() => {
  return seatGrid.value.map((_, index) => String.fromCharCode(65 + index))
})

function getSeatsSnapshot(): Seat[][] {
  return JSON.parse(JSON.stringify(seatGrid.value))
}

defineExpose({
  getSeatsSnapshot
})
</script>

<template>
  <div class="seat-selector">
    <div class="screen-area">
      <div class="screen">银幕</div>
      <div class="screen-shadow"></div>
    </div>

    <div class="seat-legend">
      <div class="legend-item">
        <div class="legend-seat seat-available"></div>
        <span>可选</span>
      </div>
      <div class="legend-item">
        <div class="legend-seat seat-selected"></div>
        <span>已选</span>
      </div>
      <div class="legend-item">
        <div class="legend-seat seat-sold"></div>
        <span>已售</span>
      </div>
      <div class="legend-item">
        <div class="legend-seat seat-corner"></div>
        <span>死角位</span>
      </div>
    </div>

    <div class="seat-container">
      <div class="row-labels">
        <div class="row-label" v-for="label in rowLabels" :key="label">{{ label }}</div>
      </div>

      <div class="seat-grid">
        <div class="seat-row" v-for="(row, rowIndex) in seatGrid" :key="rowIndex">
          <div
            v-for="(seat, colIndex) in row"
            :key="seat.id"
            :class="getSeatClass(seat)"
            @click="handleSeatClick(seat, rowIndex, colIndex)"
            @mouseenter="handleSeatHover(seat.id, true)"
            @mouseleave="handleSeatHover(seat.id, false)"
          >
            <span class="seat-number">{{ colIndex + 1 }}</span>
          </div>
        </div>
      </div>

      <div class="row-labels">
        <div class="row-label" v-for="label in rowLabels" :key="label">{{ label }}</div>
      </div>
    </div>

    <div class="center-indicator">
      <div class="center-line"></div>
      <span class="center-text">中央</span>
    </div>
  </div>
</template>

<style scoped>
.seat-selector {
  padding: 20px 10px;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 16px;
}

.screen-area {
  text-align: center;
  margin-bottom: 40px;
}

.screen {
  width: 70%;
  height: 30px;
  margin: 0 auto;
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  border-radius: 50% 50% 0 0 / 100% 100% 0 0;
  color: white;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: 8px;
  transform: perspective(200px) rotateX(-20deg);
}

.screen-shadow {
  width: 60%;
  height: 20px;
  margin: 5px auto 0;
  background: radial-gradient(ellipse at center, rgba(79, 172, 254, 0.3) 0%, transparent 70%);
}

.seat-legend {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 24px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #999;
}

.legend-seat {
  width: 20px;
  height: 18px;
  border-radius: 4px 4px 2px 2px;
}

.seat-container {
  display: flex;
  justify-content: center;
  gap: 10px;
  overflow-x: auto;
  padding: 0 10px;
}

.seat-container::-webkit-scrollbar {
  display: none;
}

.row-labels {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 0;
}

.row-label {
  width: 20px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #666;
}

.seat-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.seat-row {
  display: flex;
  gap: 4px;
}

.seat {
  width: 24px;
  height: 24px;
  border-radius: 6px 6px 2px 2px;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.seat-number {
  font-size: 8px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
}

.seat-available {
  background: linear-gradient(145deg, #4a5568 0%, #2d3748 100%);
  border: 1px solid #4a5568;
}

.seat-available:hover {
  background: linear-gradient(145deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
  transform: scale(1.1);
}

.seat-selected {
  background: linear-gradient(145deg, #48bb78 0%, #38a169 100%);
  border: 1px solid #48bb78;
  box-shadow: 0 0 10px rgba(72, 187, 120, 0.5);
}

.seat-selected .seat-number {
  color: white;
}

.seat-sold {
  background: #1a1a2e;
  border: 1px solid #2d3748;
  cursor: not-allowed;
  opacity: 0.6;
}

.seat-sold .seat-number {
  display: none;
}

.seat-locked {
  background: linear-gradient(145deg, #ed8936 0%, #dd6b20 100%);
  border: 1px solid #ed8936;
  cursor: not-allowed;
}

.seat-corner {
  background: linear-gradient(145deg, #553c9a 0%, #44337a 100%);
  border: 1px solid #553c9a;
}

.seat-corner::after {
  content: '!';
  position: absolute;
  top: -2px;
  right: -2px;
  width: 10px;
  height: 10px;
  background: #f56565;
  border-radius: 50%;
  font-size: 7px;
  font-weight: 700;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  z-index: 1;
}

.seat-hover {
  transform: scale(1.1);
}

.center-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 16px;
  gap: 8px;
}

.center-line {
  width: 40%;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%);
}

.center-text {
  font-size: 10px;
  color: #666;
}

@media (min-width: 768px) {
  .seat {
    width: 32px;
    height: 32px;
  }
  
  .seat-number {
    font-size: 10px;
  }
  
  .seat-row {
    gap: 6px;
  }
  
  .seat-corner::after {
    width: 12px;
    height: 12px;
    font-size: 8px;
    top: -3px;
    right: -3px;
  }
}
</style>
