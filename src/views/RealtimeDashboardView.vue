<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import {
  BarChart,
  LineChart,
  GaugeChart
} from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
} from 'echarts/components'
import { useRealtimeDataStore } from '../stores/realtimeData'

use([
  CanvasRenderer,
  BarChart,
  LineChart,
  GaugeChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
])

const store = useRealtimeDataStore()

const lineChartRef = ref<HTMLElement | null>(null)
const gaugeChartRef = ref<HTMLElement | null>(null)
const barChartRef = ref<HTMLElement | null>(null)

let lineChartInstance: echarts.ECharts | null = null
let gaugeChartInstance: echarts.ECharts | null = null
let barChartInstance: echarts.ECharts | null = null

let animationFrameId: number | null = null
let lastUpdateTime = 0
const UPDATE_THRESHOLD = 16

const wsUrl = ref('ws://localhost:8080/realtime')
const isConnected = computed(() => store.connectionStatus === 'connected')
const isPaused = computed(() => store.isPaused)

const getLineChartOption = (): echarts.EChartsOption => {
  const data = store.lineChartData
  return {
    title: {
      text: '实时数据趋势',
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: 14,
        color: '#333'
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const point = params[0]
        return `<div style="font-size: 12px;">
          <div>时间: ${point.data.formattedTime || point.name}</div>
          <div>值: <span style="color: #667eea; font-weight: bold;">${point.value?.[1] ?? point.value}</span></div>
        </div>`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: 60,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map(d => d.formattedTime),
      axisLabel: {
        rotate: 45,
        fontSize: 10,
        interval: Math.floor(data.length / 6) || 0
      }
    },
    yAxis: {
      type: 'value',
      min: 'dataMin',
      max: 'dataMax',
      axisLabel: {
        formatter: '{value}'
      }
    },
    series: [
      {
        name: '实时值',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        sampling: 'lttb',
        data: data.map(d => [d.formattedTime, d.value]),
        lineStyle: {
          color: '#667eea',
          width: 2
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(102, 126, 234, 0.3)' },
            { offset: 1, color: 'rgba(102, 126, 234, 0.05)' }
          ])
        },
        itemStyle: {
          color: '#667eea'
        }
      }
    ],
    animationDuration: 300,
    animationEasing: 'cubicOut'
  }
}

const getGaugeChartOption = (): echarts.EChartsOption => {
  const data = store.gaugeData
  const value = data.currentValue
  const min = 0
  const max = 100

  return {
    title: {
      text: '当前实时值',
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: 14,
        color: '#333'
      }
    },
    series: [
      {
        type: 'gauge',
        startAngle: 225,
        endAngle: -45,
        min: min,
        max: max,
        splitNumber: 10,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#67c23a' },
            { offset: 0.5, color: '#e6a23c' },
            { offset: 1, color: '#f56c6c' }
          ])
        },
        progress: {
          show: true,
          width: 18
        },
        pointer: {
          show: true,
          length: '60%',
          width: 6
        },
        axisLine: {
          lineStyle: {
            width: 18,
            color: [
              [0.3, '#67c23a'],
              [0.7, '#e6a23c'],
              [1, '#f56c6c']
            ]
          }
        },
        axisTick: {
          show: false
        },
        splitLine: {
          length: 12,
          lineStyle: {
            width: 2,
            color: '#999'
          }
        },
        axisLabel: {
          distance: 25,
          color: '#666',
          fontSize: 10,
          formatter: '{value}'
        },
        detail: {
          valueAnimation: false,
          formatter: '{value}',
          color: '#333',
          fontSize: 24,
          fontWeight: 'bold',
          offsetCenter: [0, '40%']
        },
        data: [
          {
            value: value,
            name: '实时值'
          }
        ]
      }
    ],
    animation: false,
    animationDuration: 0,
    animationDurationUpdate: 0
  }
}

const getBarChartOption = (): echarts.EChartsOption => {
  const data = store.barChartData
  const categories = data.map(d => d.category)
  const values = data.map(d => d.value)

  return {
    title: {
      text: '累积统计',
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: 14,
        color: '#333'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: 60,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: {
        rotate: 45,
        fontSize: 10
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '{value}'
      }
    },
    series: [
      {
        name: '累积值',
        type: 'bar',
        data: values,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#667eea' },
            { offset: 1, color: '#764ba2' }
          ]),
          borderRadius: [4, 4, 0, 0]
        },
        emphasis: {
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#764ba2' },
              { offset: 1, color: '#667eea' }
            ])
          }
        }
      }
    ],
    animationDuration: 500,
    animationEasing: 'cubicOut'
  }
}

const initCharts = () => {
  if (lineChartRef.value) {
    lineChartInstance = echarts.init(lineChartRef.value)
    lineChartInstance.setOption(getLineChartOption())
  }

  if (gaugeChartRef.value) {
    gaugeChartInstance = echarts.init(gaugeChartRef.value)
    gaugeChartInstance.setOption(getGaugeChartOption())
  }

  if (barChartRef.value) {
    barChartInstance = echarts.init(barChartRef.value)
    barChartInstance.setOption(getBarChartOption())
  }
}

const updateLineChart = () => {
  if (lineChartInstance) {
    const data = store.lineChartData
    if (data.length === 0) return

    const categories = data.map(d => d.formattedTime)
    const values = data.map(d => [d.formattedTime, d.value])

    lineChartInstance.setOption({
      xAxis: {
        data: categories,
        axisLabel: {
          interval: Math.floor(data.length / 6) || 0
        }
      },
      yAxis: {
        min: 'dataMin',
        max: 'dataMax'
      },
      series: [{
        data: values
      }]
    }, false)
  }
}

const updateGaugeChart = () => {
  if (gaugeChartInstance) {
    const value = store.gaugeData.currentValue
    gaugeChartInstance.setOption({
      series: [{
        data: [{ value: value, name: '实时值' }]
      }]
    })
  }
}

const updateBarChart = () => {
  if (barChartInstance) {
    const data = store.barChartData
    if (data.length === 0) return

    barChartInstance.setOption({
      xAxis: {
        data: data.map(d => d.category)
      },
      series: [{
        data: data.map(d => d.value)
      }]
    }, false)
  }
}

const updateCharts = () => {
  updateLineChart()
  updateGaugeChart()
  updateBarChart()
}

const startAnimationLoop = () => {
  const animate = () => {
    const now = Date.now()
    
    if (now - lastUpdateTime >= UPDATE_THRESHOLD && store.lastUpdateTime > lastUpdateTime) {
      lastUpdateTime = now
      updateCharts()
    }

    animationFrameId = requestAnimationFrame(animate)
  }

  animationFrameId = requestAnimationFrame(animate)
}

const stopAnimationLoop = () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
}

const handleResize = () => {
  lineChartInstance?.resize()
  gaugeChartInstance?.resize()
  barChartInstance?.resize()
}

const connectToWebSocket = () => {
  store.connect(wsUrl.value, false)
}

const disconnectFromWebSocket = () => {
  store.disconnect()
}

const togglePause = () => {
  store.togglePause()
}

const simulateData = () => {
  let value = 50
  const categories = ['A类', 'B类', 'C类', 'D类', 'E类']
  const accumulated: { [key: string]: number } = {
    'A类': 0,
    'B类': 0,
    'C类': 0,
    'D类': 0,
    'E类': 0
  }

  const interval = setInterval(() => {
    if (isPaused.value) return

    value = Math.max(0, Math.min(100, value + (Math.random() - 0.5) * 10))
    const randomCategory = categories[Math.floor(Math.random() * categories.length)]
    accumulated[randomCategory] = (accumulated[randomCategory] || 0) + Math.floor(Math.random() * 10) + 1

    const realtimeData = {
      timestamp: Date.now(),
      value: parseFloat(value.toFixed(2)),
      category: randomCategory
    }

    store.handleDataReceived?.(realtimeData)

    if (Math.random() > 0.8) {
      store.handleDataReceived?.({ ...accumulated })
    }
  }, 100)

  return interval
}

let simulationInterval: number | null = null

const startSimulation = () => {
  if (simulationInterval) return
  store.clearAllData()
  simulationInterval = simulateData()
}

const stopSimulation = () => {
  if (simulationInterval) {
    clearInterval(simulationInterval)
    simulationInterval = null
  }
}

watch(() => store.lastUpdateTime, () => {
})

onMounted(() => {
  nextTick(() => {
    initCharts()
    startAnimationLoop()
    window.addEventListener('resize', handleResize)
  })
})

onUnmounted(() => {
  stopAnimationLoop()
  stopSimulation()
  store.disconnect()
  window.removeEventListener('resize', handleResize)
  
  lineChartInstance?.dispose()
  gaugeChartInstance?.dispose()
  barChartInstance?.dispose()
})
</script>

<template>
  <div class="realtime-dashboard">
    <div class="dashboard-header">
      <h1 class="dashboard-title">实时数据仪表盘</h1>
      <div class="dashboard-controls">
        <div class="connection-status" :class="isConnected ? 'connected' : 'disconnected'">
          <span class="status-dot"></span>
          <span>{{ isConnected ? '已连接' : '未连接' }}</span>
        </div>
        
        <div class="control-group">
          <input
            v-model="wsUrl"
            type="text"
            placeholder="WebSocket URL"
            class="url-input"
          />
          <button 
            v-if="!isConnected"
            @click="connectToWebSocket"
            class="control-btn primary"
          >
            连接
          </button>
          <button 
            v-else
            @click="disconnectFromWebSocket"
            class="control-btn danger"
          >
            断开
          </button>
        </div>

        <div class="control-group">
          <button 
            @click="startSimulation"
            class="control-btn success"
          >
            模拟数据
          </button>
          <button 
            @click="togglePause"
            :class="['control-btn', isPaused ? 'warning' : 'secondary']"
          >
            {{ isPaused ? '恢复' : '暂停' }}
          </button>
        </div>
      </div>
    </div>

    <div class="charts-grid">
      <div class="chart-card large">
        <div ref="lineChartRef" class="chart-container"></div>
        <div class="chart-info">
          <span>数据点数量: {{ store.lineChartData.length }} / {{ store.MAX_LINE_DATA_POINTS }}</span>
        </div>
      </div>

      <div class="chart-card">
        <div ref="gaugeChartRef" class="chart-container"></div>
        <div class="chart-info">
          <span>当前值: {{ store.gaugeData.currentValue.toFixed(2) }}</span>
          <span>范围: [{{ store.gaugeData.minValue }}, {{ store.gaugeData.maxValue }}]</span>
        </div>
      </div>

      <div class="chart-card">
        <div ref="barChartRef" class="chart-container"></div>
        <div class="chart-info">
          <span>类别数量: {{ store.barChartData.length }}</span>
        </div>
      </div>
    </div>

    <div class="tech-info">
      <h3>技术实现说明</h3>
      <ul>
        <li>📊 <strong>图表库:</strong> ECharts 6.0 + Canvas Renderer</li>
        <li>🔌 <strong>数据传输:</strong> WebSocket (支持 JSON 或二进制 Protobuf 格式)</li>
        <li>⚡ <strong>更新机制:</strong> requestAnimationFrame + 差量更新 (16ms 阈值)</li>
        <li>📈 <strong>折线图:</strong> 每 100ms 追加数据，保留最近 100 点</li>
        <li>⏸️ <strong>暂停/恢复:</strong> 暂停时缓冲数据，恢复时批量处理</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.realtime-dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.dashboard-title {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.dashboard-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #fff;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.connection-status.connected .status-dot {
  background: #67c23a;
  animation: pulse 2s infinite;
}

.connection-status.disconnected .status-dot {
  background: #f56c6c;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.control-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.url-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  width: 200px;
  transition: all 0.3s;
}

.url-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.control-btn {
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.control-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.control-btn.primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.control-btn.danger {
  background: linear-gradient(135deg, #f56c6c 0%, #e64c4c 100%);
  color: #fff;
}

.control-btn.danger:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.4);
}

.control-btn.success {
  background: linear-gradient(135deg, #67c23a 0%, #5db22f 100%);
  color: #fff;
}

.control-btn.success:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.4);
}

.control-btn.warning {
  background: linear-gradient(135deg, #e6a23c 0%, #d19128 100%);
  color: #fff;
}

.control-btn.warning:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(230, 162, 60, 0.4);
}

.control-btn.secondary {
  background: #fff;
  color: #666;
  border: 1px solid #ddd;
}

.control-btn.secondary:hover {
  border-color: #667eea;
  color: #667eea;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.chart-card {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
}

.chart-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.chart-card.large {
  grid-column: span 2;
}

.chart-container {
  width: 100%;
  height: 300px;
}

.chart-info {
  display: flex;
  justify-content: space-between;
  padding: 12px 8px 0;
  font-size: 12px;
  color: #666;
  border-top: 1px solid #f0f0f0;
  margin-top: 12px;
}

.tech-info {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.tech-info h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
}

.tech-info ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 10px;
}

.tech-info li {
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 8px;
  font-size: 13px;
  color: #666;
}

.tech-info li strong {
  color: #333;
}

@media (max-width: 1200px) {
  .charts-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .chart-card.large {
    grid-column: span 2;
  }
}

@media (max-width: 768px) {
  .realtime-dashboard {
    padding: 12px;
  }
  
  .dashboard-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .dashboard-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .control-group {
    width: 100%;
  }
  
  .url-input {
    flex: 1;
    width: auto;
  }
  
  .charts-grid {
    grid-template-columns: 1fr;
  }
  
  .chart-card.large {
    grid-column: span 1;
  }
  
  .chart-container {
    height: 250px;
  }
  
  .tech-info ul {
    grid-template-columns: 1fr;
  }
}
</style>
