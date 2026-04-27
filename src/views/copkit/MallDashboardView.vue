<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import * as echarts from 'echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import {
  BarChart,
  LineChart,
} from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
} from 'echarts/components'

use([
  CanvasRenderer,
  BarChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
])

const chartType = ref<'bar' | 'line'>('bar')
const chartRef = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null

const timeSlots = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
]

const trafficData = [120, 180, 240, 320, 280, 350, 420, 500, 480, 550, 620, 580, 450]
const salesData = [2.5, 3.8, 5.2, 7.5, 6.8, 8.2, 10.5, 12.8, 11.2, 15.5, 18.2, 16.8, 12.5]

const getChartOption = (type: 'bar' | 'line'): echarts.EChartsOption => {
  const series: echarts.SeriesOption[] = []
  
  if (type === 'bar') {
    series.push(
      {
        name: '客流',
        type: 'bar',
        data: trafficData,
        yAxisIndex: 0,
        itemStyle: {
          color: '#667eea'
        }
      },
      {
        name: '销售额(万)',
        type: 'bar',
        data: salesData,
        yAxisIndex: 1,
        itemStyle: {
          color: '#764ba2'
        }
      }
    )
  } else {
    series.push(
      {
        name: '客流',
        type: 'line',
        data: trafficData,
        yAxisIndex: 0,
        smooth: true,
        lineStyle: {
          color: '#667eea',
          width: 3
        },
        itemStyle: {
          color: '#667eea'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(102, 126, 234, 0.3)' },
            { offset: 1, color: 'rgba(102, 126, 234, 0.05)' }
          ])
        }
      },
      {
        name: '销售额(万)',
        type: 'line',
        data: salesData,
        yAxisIndex: 1,
        smooth: true,
        lineStyle: {
          color: '#764ba2',
          width: 3
        },
        itemStyle: {
          color: '#764ba2'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(118, 75, 162, 0.3)' },
            { offset: 1, color: 'rgba(118, 75, 162, 0.05)' }
          ])
        }
      }
    )
  }

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: type === 'bar' ? 'shadow' : 'cross'
      }
    },
    legend: {
      data: ['客流', '销售额(万)'],
      top: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 50,
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        data: timeSlots,
        axisLabel: {
          rotate: 45,
          fontSize: 10
        }
      }
    ],
    yAxis: [
      {
        type: 'value',
        name: '客流',
        position: 'left',
        axisLabel: {
          formatter: '{value}'
        }
      },
      {
        type: 'value',
        name: '销售额(万)',
        position: 'right',
        axisLabel: {
          formatter: '{value}万'
        }
      }
    ],
    series
  }
}

const initChart = () => {
  if (chartRef.value) {
    chartInstance = echarts.init(chartRef.value)
    updateChart()
  }
}

const updateChart = () => {
  if (chartInstance) {
    chartInstance.setOption(getChartOption(chartType.value), true)
  }
}

const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
  updateVirtualScrollParams()
}

const switchChartType = (type: 'bar' | 'line') => {
  chartType.value = type
  updateChart()
}

interface ShopData {
  id: number
  name: string
  dailySales: number
  monthlySales: number
  efficiency: number
  traffic: number
  realTimeTraffic: number
}

const allShopData: ShopData[] = Array.from({ length: 1000 }, (_, index) => ({
  id: index + 1,
  name: `店铺${String(index + 1).padStart(3, '0')}`,
  dailySales: Math.floor(Math.random() * 50000) + 10000,
  monthlySales: Math.floor(Math.random() * 1500000) + 300000,
  efficiency: parseFloat((Math.random() * 3 + 1).toFixed(2)),
  traffic: Math.floor(Math.random() * 2000) + 500,
  realTimeTraffic: Math.floor(Math.random() * 100) + 20
}))

const ROW_HEIGHT = 49
const BUFFER_ROWS = 5

const tableContainerRef = ref<HTMLElement | null>(null)
const tableBodyRef = ref<HTMLElement | null>(null)

const scrollTop = ref(0)
const containerHeight = ref(0)
const visibleRowCount = ref(0)
const startIndex = ref(0)
const endIndex = ref(0)

const totalHeight = computed(() => allShopData.length * ROW_HEIGHT)

const updateVirtualScrollParams = () => {
  if (!tableContainerRef.value) return
  
  const container = tableContainerRef.value
  containerHeight.value = container.clientHeight - 48
  
  visibleRowCount.value = Math.ceil(containerHeight.value / ROW_HEIGHT) + BUFFER_ROWS * 2
  
  updateVisibleRange()
}

const updateVisibleRange = () => {
  const start = Math.max(0, Math.floor(scrollTop.value / ROW_HEIGHT) - BUFFER_ROWS)
  const end = Math.min(
    allShopData.length,
    start + visibleRowCount.value + BUFFER_ROWS * 2
  )
  
  startIndex.value = start
  endIndex.value = end
}

const handleTableScroll = (event: Event) => {
  const target = event.target as HTMLElement
  scrollTop.value = target.scrollTop
  updateVisibleRange()
}

const visibleShops = computed(() => {
  return allShopData.slice(startIndex.value, endIndex.value)
})

const offsetTop = computed(() => {
  return startIndex.value * ROW_HEIGHT
})

const handleRowClick = (shop: ShopData) => {
  console.log('Clicked shop:', shop.name)
}

onMounted(() => {
  initChart()
  nextTick(() => {
    updateVirtualScrollParams()
  })
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
  }
  window.removeEventListener('resize', handleResize)
})

const formatNumber = (num: number): string => {
  return num.toLocaleString()
}

const formatCurrency = (num: number): string => {
  return '¥' + num.toLocaleString()
}
</script>

<template>
  <div class="dashboard-container">
    <div class="section-header">
      <h2 class="section-title">今日客流与销售额趋势</h2>
      <div class="chart-tabs">
        <button
          :class="['tab-btn', { active: chartType === 'bar' }]"
          @click="switchChartType('bar')"
        >
          柱状图
        </button>
        <button
          :class="['tab-btn', { active: chartType === 'line' }]"
          @click="switchChartType('line')"
        >
          折线图
        </button>
      </div>
    </div>
    
    <div class="chart-section">
      <div ref="chartRef" class="chart-container"></div>
    </div>

    <div class="section-header">
      <h2 class="section-title">各店铺经营数据</h2>
      <div class="table-stats">
        <span class="stat-item">共 {{ allShopData.length }} 家店铺</span>
        <span class="stat-item">可视范围: {{ startIndex + 1 }} - {{ endIndex }}</span>
      </div>
    </div>

    <div 
      ref="tableContainerRef"
      class="table-section"
      @scroll="handleTableScroll"
    >
      <table class="shop-table table-header">
        <thead>
          <tr>
            <th>店铺名</th>
            <th>日营业额</th>
            <th>月营业额</th>
            <th>坪效</th>
            <th>客流</th>
            <th>实时客流</th>
          </tr>
        </thead>
      </table>
      
      <div 
        class="virtual-scroll-body"
        :style="{ height: totalHeight + 'px' }"
      >
        <table 
          ref="tableBodyRef"
          class="shop-table shop-table-body"
          :style="{ 
            transform: `translateY(${offsetTop}px)` 
          }"
        >
          <tbody>
            <tr 
              v-for="shop in visibleShops" 
              :key="shop.id"
              class="table-row"
              :style="{ height: ROW_HEIGHT + 'px' }"
              @click="handleRowClick(shop)"
            >
              <td class="shop-name">{{ shop.name }}</td>
              <td>{{ formatCurrency(shop.dailySales) }}</td>
              <td>{{ formatCurrency(shop.monthlySales) }}</td>
              <td :class="{ 'high-efficiency': shop.efficiency >= 2.5 }">
                {{ shop.efficiency }}
              </td>
              <td>{{ formatNumber(shop.traffic) }}</td>
              <td>
                <span class="realtime-traffic">{{ shop.realTimeTraffic }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="allShopData.length === 0" class="table-empty">
        <span>暂无数据</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.chart-tabs {
  display: flex;
  gap: 8px;
}

.tab-btn {
  padding: 6px 16px;
  border: 1px solid #ddd;
  background-color: #fff;
  border-radius: 4px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
}

.tab-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.tab-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-color: transparent;
}

.chart-section {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.chart-container {
  width: 100%;
  height: 350px;
}

.table-stats {
  font-size: 12px;
  color: #999;
  display: flex;
  gap: 8px;
}

.stat-item {
  background: rgba(102, 126, 234, 0.1);
  padding: 4px 12px;
  border-radius: 4px;
  color: #667eea;
}

.table-section {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  max-height: calc(100vh - 500px);
  min-height: 300px;
  overflow-y: auto;
  overflow-x: hidden;
}

.shop-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  table-layout: fixed;
}

.table-header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: #fff;
}

.shop-table th {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 14px 12px;
  text-align: left;
  font-weight: 500;
  font-size: 12px;
  white-space: nowrap;
  width: 16.666%;
}

.shop-table td {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  color: #333;
  vertical-align: middle;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 16.666%;
}

.shop-table tbody tr:hover {
  background-color: #fafafa;
}

.shop-table-body {
  position: relative;
}

.virtual-scroll-body {
  position: relative;
  width: 100%;
}

.table-row {
  cursor: pointer;
  transition: background-color 0.2s;
}

.table-row:hover {
  background-color: #f0f7ff !important;
}

.shop-name {
  font-weight: 500;
  color: #667eea !important;
}

.high-efficiency {
  color: #67c23a !important;
  font-weight: 500;
}

.realtime-traffic {
  display: inline-block;
  background: rgba(103, 194, 58, 0.1);
  color: #67c23a;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.table-loading,
.table-no-more,
.table-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #999;
  font-size: 13px;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #f0f0f0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 12px;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .chart-tabs {
    width: 100%;
  }

  .tab-btn {
    flex: 1;
    text-align: center;
  }

  .chart-container {
    height: 280px;
  }

  .table-section {
    max-height: calc(100vh - 450px);
  }

  .shop-table {
    font-size: 11px;
  }

  .shop-table th,
  .shop-table td {
    padding: 10px 8px;
  }
}

@media (max-width: 480px) {
  .table-section {
    overflow-x: auto;
  }
  
  .shop-table {
    min-width: 600px;
  }
}
</style>
