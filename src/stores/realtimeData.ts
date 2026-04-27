import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { RealtimeData, AccumulatedData } from '../services/websocket'
import { websocketService } from '../services/websocket'

export interface LineChartDataPoint {
  timestamp: number
  value: number
  formattedTime: string
}

export interface GaugeData {
  currentValue: number
  minValue: number
  maxValue: number
  timestamp: number
}

export interface BarChartItem {
  category: string
  value: number
}

export const useRealtimeDataStore = defineStore('realtimeData', () => {
  const MAX_LINE_DATA_POINTS = 100

  const lineChartData = ref<LineChartDataPoint[]>([])
  const gaugeData = ref<GaugeData>({
    currentValue: 0,
    minValue: 0,
    maxValue: 100,
    timestamp: Date.now()
  })
  const barChartData = ref<BarChartItem[]>([])
  const accumulatedData = ref<AccumulatedData>({})

  const connectionStatus = ref<'connected' | 'disconnected' | 'error'>('disconnected')
  const isPaused = ref(false)
  const lastUpdateTime = ref(0)

  const lineChartDataLength = computed(() => lineChartData.value.length)
  const currentValue = computed(() => gaugeData.value.currentValue)
  const barChartCategories = computed(() => barChartData.value.map(item => item.category))
  const barChartValues = computed(() => barChartData.value.map(item => item.value))

  let unsubscribeData: (() => void) | null = null
  let unsubscribeConnection: (() => void) | null = null

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp)
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}.${date.getMilliseconds().toString().padStart(3, '0')}`
  }

  const isRealtimeData = (data: RealtimeData | AccumulatedData): data is RealtimeData => {
    return 'timestamp' in data && 'value' in data && 'category' in data
  }

  const addLineChartPoint = (data: RealtimeData): void => {
    const point: LineChartDataPoint = {
      timestamp: data.timestamp,
      value: data.value,
      formattedTime: formatTime(data.timestamp)
    }

    lineChartData.value.push(point)

    while (lineChartData.value.length > MAX_LINE_DATA_POINTS) {
      lineChartData.value.shift()
    }

    lastUpdateTime.value = Date.now()
  }

  const updateGaugeData = (data: RealtimeData): void => {
    gaugeData.value = {
      ...gaugeData.value,
      currentValue: data.value,
      timestamp: data.timestamp
    }
  }

  const updateAccumulatedData = (data: AccumulatedData): void => {
    accumulatedData.value = {
      ...accumulatedData.value,
      ...data
    }

    barChartData.value = Object.entries(accumulatedData.value).map(([category, value]) => ({
      category,
      value
    }))

    lastUpdateTime.value = Date.now()
  }

  const handleDataReceived = (data: RealtimeData | AccumulatedData): void => {
    if (isRealtimeData(data)) {
      addLineChartPoint(data)
      updateGaugeData(data)
    } else {
      updateAccumulatedData(data)
    }
  }

  const handleConnectionStatus = (status: 'connected' | 'disconnected' | 'error'): void => {
    connectionStatus.value = status
  }

  const connect = (url: string, useBinary: boolean = false): void => {
    if (unsubscribeData) {
      unsubscribeData()
    }
    if (unsubscribeConnection) {
      unsubscribeConnection()
    }

    unsubscribeData = websocketService.subscribeToData(handleDataReceived)
    unsubscribeConnection = websocketService.subscribeToConnection(handleConnectionStatus)

    websocketService.connect(url, useBinary)
  }

  const disconnect = (): void => {
    websocketService.disconnect()

    if (unsubscribeData) {
      unsubscribeData()
      unsubscribeData = null
    }
    if (unsubscribeConnection) {
      unsubscribeConnection()
      unsubscribeConnection = null
    }
  }

  const pause = (): void => {
    isPaused.value = true
    websocketService.pause()
  }

  const resume = (): void => {
    isPaused.value = false
    websocketService.resume()
  }

  const togglePause = (): void => {
    if (isPaused.value) {
      resume()
    } else {
      pause()
    }
  }

  const clearAllData = (): void => {
    lineChartData.value = []
    gaugeData.value = {
      currentValue: 0,
      minValue: 0,
      maxValue: 100,
      timestamp: Date.now()
    }
    barChartData.value = []
    accumulatedData.value = {}
    lastUpdateTime.value = 0
  }

  const resetGaugeRange = (min: number, max: number): void => {
    gaugeData.value.minValue = min
    gaugeData.value.maxValue = max
  }

  return {
    lineChartData,
    gaugeData,
    barChartData,
    accumulatedData,
    connectionStatus,
    isPaused,
    lastUpdateTime,
    lineChartDataLength,
    currentValue,
    barChartCategories,
    barChartValues,
    MAX_LINE_DATA_POINTS,
    connect,
    disconnect,
    pause,
    resume,
    togglePause,
    clearAllData,
    resetGaugeRange,
    formatTime,
    handleDataReceived
  }
})
