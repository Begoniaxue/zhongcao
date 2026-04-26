<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import { ElCard, ElRow, ElCol, ElTable, ElTableColumn, ElRadioGroup, ElRadioButton } from 'element-plus'

interface ShopData {
  id: number
  name: string
  dailySales: number
  monthlySales: number
  pingEffect: number
  customerFlow: number
  realTimeFlow: number
  category: string
}

interface TrendData {
  time: string
  customerFlow: number
  sales: number
}

const shopData = ref<ShopData[]>([
  { id: 1, name: '优衣库', dailySales: 12580, monthlySales: 389600, pingEffect: 2850, customerFlow: 1560, realTimeFlow: 45, category: '服装' },
  { id: 2, name: '星巴克', dailySales: 8920, monthlySales: 267600, pingEffect: 3560, customerFlow: 890, realTimeFlow: 28, category: '餐饮' },
  { id: 3, name: '海底捞', dailySales: 15600, monthlySales: 468000, pingEffect: 4200, customerFlow: 680, realTimeFlow: 52, category: '餐饮' },
  { id: 4, name: '苹果专卖放开局势阿萨斯大神带带阿萨德合法的还是地哦啊死哦的阿萨德阿萨德阿萨德店', dailySales: 45800, monthlySales: 1374000, pingEffect: 9500, customerFlow: 420, realTimeFlow: 18, category: '电子' },
  { id: 5, name: '无印良品', dailySales: 9200, monthlySales: 276000, pingEffect: 2100, customerFlow: 1120, realTimeFlow: 35, category: '家居' },
  { id: 6, name: '华为体验店', dailySales: 28500, monthlySales: 855000, pingEffect: 6800, customerFlow: 560, realTimeFlow: 22, category: '电子' },
  { id: 7, name: '喜茶', dailySales: 6800, monthlySales: 204000, pingEffect: 3200, customerFlow: 980, realTimeFlow: 41, category: '餐饮' },
  { id: 8, name: 'ZARA', dailySales: 18900, monthlySales: 567000, pingEffect: 3100, customerFlow: 1350, realTimeFlow: 38, category: '服装' }
])

const trendData = ref<TrendData[]>([
  { time: '09:00', customerFlow: 120, sales: 5800 },
  { time: '10:00', customerFlow: 280, sales: 12500 },
  { time: '11:00', customerFlow: 450, sales: 18900 },
  { time: '12:00', customerFlow: 680, sales: 25600 },
  { time: '13:00', customerFlow: 520, sales: 21200 },
  { time: '14:00', customerFlow: 380, sales: 16800 },
  { time: '15:00', customerFlow: 420, sales: 18500 },
  { time: '16:00', customerFlow: 560, sales: 22800 },
  { time: '17:00', customerFlow: 720, sales: 28500 },
  { time: '18:00', customerFlow: 890, sales: 35200 },
  { time: '19:00', customerFlow: 950, sales: 38900 },
  { time: '20:00', customerFlow: 820, sales: 32600 },
  { time: '21:00', customerFlow: 650, sales: 26800 }
])

const totalDailySales = computed(() => shopData.value.reduce((sum, shop) => sum + shop.dailySales, 0))
const totalMonthlySales = computed(() => shopData.value.reduce((sum, shop) => sum + shop.monthlySales, 0))
const totalCustomerFlow = computed(() => shopData.value.reduce((sum, shop) => sum + shop.customerFlow, 0))
const totalRealTimeFlow = computed(() => shopData.value.reduce((sum, shop) => sum + shop.realTimeFlow, 0))
const avgPingEffect = computed(() => Math.round(shopData.value.reduce((sum, shop) => sum + shop.pingEffect, 0) / shopData.value.length))

const pieChartRef = ref<HTMLDivElement | null>(null)
const lineChartRef = ref<HTMLDivElement | null>(null)
let pieChart: echarts.ECharts | null = null
let lineChart: echarts.ECharts | null = null

type ChartType = 'line' | 'bar'
const lineChartType = ref<ChartType>('line')

watch(lineChartType, () => {
  updateLineChart()
})

const updateLineChart = () => {
  if (!lineChartRef.value || !lineChart) return
  
  const times = trendData.value.map(item => item.time)
  const customerFlows = trendData.value.map(item => item.customerFlow)
  const sales = trendData.value.map(item => item.sales)
  
  const isLine = lineChartType.value === 'line'
  
  lineChart.clear()
  
  const baseOption: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: isLine ? 'cross' : 'shadow'
      }
    },
    legend: {
      data: ['客流', '销售额'],
      top: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: !isLine,
      data: times,
      axisLabel: {
        fontSize: 11
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '客流',
        position: 'left',
        axisLabel: {
          formatter: '{value} 人'
        }
      },
      {
        type: 'value',
        name: '销售额',
        position: 'right',
        axisLabel: {
          formatter: '{value} 元'
        }
      }
    ]
  }
  
  const lineSeries: echarts.SeriesOption = {
    name: '客流',
    type: 'line',
    smooth: true,
    symbol: 'circle',
    symbolSize: 6,
    lineStyle: {
      width: 3,
      color: '#667eea'
    },
    itemStyle: {
      color: '#667eea'
    },
    areaStyle: {
      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: 'rgba(102, 126, 234, 0.3)' },
        { offset: 1, color: 'rgba(102, 126, 234, 0.05)' }
      ])
    },
    data: customerFlows
  }
  
  const barSeries: echarts.SeriesOption = {
    name: '客流',
    type: 'bar',
    barGap: '0%',
    barCategoryGap: '20%',
    itemStyle: {
      color: '#667eea',
      borderRadius: [4, 4, 0, 0]
    },
    data: customerFlows
  }
  
  const lineSeries2: echarts.SeriesOption = {
    name: '销售额',
    type: 'line',
    smooth: true,
    symbol: 'circle',
    symbolSize: 6,
    lineStyle: {
      width: 3,
      color: '#f5576c'
    },
    itemStyle: {
      color: '#f5576c'
    },
    areaStyle: {
      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: 'rgba(245, 87, 108, 0.3)' },
        { offset: 1, color: 'rgba(245, 87, 108, 0.05)' }
      ])
    },
    data: sales
  }
  
  const barSeries2: echarts.SeriesOption = {
    name: '销售额',
    type: 'bar',
    itemStyle: {
      color: '#f5576c',
      borderRadius: [4, 4, 0, 0]
    },
    data: sales
  }
  
  const option: echarts.EChartsOption = {
    ...baseOption,
    series: isLine ? [lineSeries, lineSeries2] : [barSeries, barSeries2]
  }
  
  lineChart.setOption(option)
}

const formatCurrency = (value: number): string => {
  if (value >= 10000) {
    return (value / 10000).toFixed(2) + '万'
  }
  return value.toLocaleString()
}

const truncateText = (text: string, maxLength: number = 10): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

const initPieChart = () => {
  if (!pieChartRef.value) return
  
  pieChart = echarts.init(pieChartRef.value)
  
  const pieData = shopData.value.map(shop => ({
    name: shop.name,
    value: shop.dailySales
  }))
  
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ¥{c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      textStyle: {
        fontSize: 12
      },
      formatter: (name: string) => truncateText(name, 8)
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['40%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
            formatter: (params: any) => truncateText(params.name, 6)
          }
        },
        labelLine: {
          show: false
        },
        data: pieData,
        color: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7']
      }
    ]
  }
  
  pieChart.setOption(option)
}

const initLineChart = () => {
  if (!lineChartRef.value) return
  
  lineChart = echarts.init(lineChartRef.value)
  updateLineChart()
}

const handleResize = () => {
  pieChart?.resize()
  lineChart?.resize()
}

onMounted(() => {
  setTimeout(() => {
    initPieChart()
    initLineChart()
  }, 100)
  
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  pieChart?.dispose()
  lineChart?.dispose()
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <h1 class="title">商场数据驾驶舱</h1>
      <p class="subtitle">实时监控各店铺运营数据</p>
    </div>
    
    <div class="stats-grid">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <span class="icon-text">¥</span>
          </div>
          <div class="stat-info">
            <div class="stat-label">日营业额</div>
            <div class="stat-value">¥{{ formatCurrency(totalDailySales) }}</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
            <span class="icon-text">月</span>
          </div>
          <div class="stat-info">
            <div class="stat-label">月营业额</div>
            <div class="stat-value">¥{{ formatCurrency(totalMonthlySales) }}</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
            <span class="icon-text">坪</span>
          </div>
          <div class="stat-info">
            <div class="stat-label">平均坪效</div>
            <div class="stat-value">{{ formatCurrency(avgPingEffect) }} 元/㎡</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
            <span class="icon-text">人</span>
          </div>
          <div class="stat-info">
            <div class="stat-label">今日客流</div>
            <div class="stat-value">{{ totalCustomerFlow.toLocaleString() }} 人</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
            <span class="icon-text">实</span>
          </div>
          <div class="stat-info">
            <div class="stat-label">实时客流</div>
            <div class="stat-value">{{ totalRealTimeFlow }} 人</div>
          </div>
        </div>
      </el-card>
    </div>
    
    <el-row :gutter="20" class="charts-row">
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">各店铺日营业额占比</span>
            </div>
          </template>
          <div ref="pieChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">今日客流与销售额趋势</span>
              <ElRadioGroup v-model="lineChartType" size="small" class="chart-type-tabs">
                <ElRadioButton value="line">折线图</ElRadioButton>
                <ElRadioButton value="bar">柱状图</ElRadioButton>
              </ElRadioGroup>
            </div>
          </template>
          <div ref="lineChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">各店铺详细数据</span>
        </div>
      </template>
      <ElTable :data="shopData" stripe style="width: 100%" :default-sort="{ prop: 'dailySales', order: 'descending' }">
        <ElTableColumn prop="id" label="序号" width="80" align="center" />
        <ElTableColumn prop="name" label="店铺名称" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="shop-name">{{ row.name }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="category" label="品类" width="100" align="center" />
        <ElTableColumn prop="dailySales" label="日营业额" width="120" align="center" sortable>
          <template #default="{ row }">
            <span style="color: #667eea; font-weight: 600;">¥{{ row.dailySales.toLocaleString() }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="monthlySales" label="月营业额" width="130" align="center" sortable>
          <template #default="{ row }">
            <span style="color: #764ba2; font-weight: 600;">¥{{ row.monthlySales.toLocaleString() }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="pingEffect" label="坪效 (元/㎡)" width="130" align="center" sortable>
          <template #default="{ row }">
            <span style="color: #f5576c; font-weight: 600;">{{ row.pingEffect.toLocaleString() }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="customerFlow" label="今日客流" width="110" align="center">
          <template #default="{ row }">
            <span style="color: #43e97b; font-weight: 600;">{{ row.customerFlow }} 人</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="realTimeFlow" label="实时客流" width="110" align="center">
          <template #default="{ row }">
            <span style="color: #fa709a; font-weight: 600;">{{ row.realTimeFlow }} 人</span>
          </template>
        </ElTableColumn>
      </ElTable>
    </el-card>
  </div>
</template>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 20px;
}

.dashboard-header {
  text-align: center;
  margin-bottom: 30px;
}

.dashboard-header .title {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.dashboard-header .subtitle {
  font-size: 14px;
  color: #999;
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  border: none;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-text {
  font-size: 24px;
  font-weight: 700;
  color: white;
}

.stat-info {
  flex: 1;
  min-width: 0;
}

.stat-label {
  font-size: 13px;
  color: #999;
  margin-bottom: 6px;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.charts-row {
  margin-bottom: 30px;
}

.chart-card {
  border: none;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.chart-type-tabs {
  margin-left: 12px;
}

.chart-type-tabs :deep(.el-radio-button__inner) {
  border-radius: 6px;
  border: none;
  background-color: #f5f7fa;
  color: #666;
  padding: 6px 16px;
  font-size: 13px;
  transition: all 0.2s;
}

.chart-type-tabs :deep(.el-radio-button__inner:hover) {
  color: #667eea;
  background-color: #f0f2ff;
}

.chart-type-tabs :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.chart-type-tabs :deep(.el-radio-button:first-child .el-radio-button__inner) {
  border-radius: 6px 0 0 6px;
}

.chart-type-tabs :deep(.el-radio-button:last-child .el-radio-button__inner) {
  border-radius: 0 6px 6px 0;
}

.chart-container {
  width: 100%;
  height: 350px;
}

.shop-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  max-width: 100%;
}

.table-card {
  border: none;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

@media (max-width: 1200px) {
  .charts-row .el-col {
    margin-bottom: 20px;
  }
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 15px;
  }
  
  .dashboard-header .title {
    font-size: 22px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .chart-container {
    height: 300px;
  }
}
</style>