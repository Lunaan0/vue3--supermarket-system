<template>
  <div class="dashboard" v-loading="loading">
    <!-- 统计卡片 -->
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon sales">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <h3>今日销售额</h3>
              <p class="stat-number">¥{{ formatMoney(statistics.todaySales) }}</p>
              <p class="stat-sub">今日订单 {{ statistics.todayOrderCount || 0 }} 笔</p>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon orders">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <h3>本月销售额</h3>
              <p class="stat-number">¥{{ formatMoney(statistics.monthSales) }}</p>
              <p class="stat-sub">本月订单 {{ statistics.monthOrderCount || 0 }} 笔</p>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon products">
              <el-icon><Goods /></el-icon>
            </div>
            <div class="stat-info">
              <h3>商品总数</h3>
              <p class="stat-number">{{ statistics.productCount || 0 }}</p>
              <p class="stat-sub warning" v-if="statistics.lowStockCount > 0">
                <el-icon><Warning /></el-icon>
                {{ statistics.lowStockCount }} 种库存不足
              </p>
              <p class="stat-sub" v-else>库存充足</p>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon members">
              <el-icon><UserFilled /></el-icon>
            </div>
            <div class="stat-info">
              <h3>会员总数</h3>
              <p class="stat-number">{{ statistics.memberCount || 0 }}</p>
              <p class="stat-sub">累计销售 ¥{{ formatMoney(statistics.totalSales) }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 图表区域 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <h3>近7天销售趋势</h3>
            </div>
          </template>
          <div ref="salesTrendChart" class="chart-container"></div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <h3>商品分类销售占比</h3>
            </div>
          </template>
          <div ref="categoryPieChart" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 销量排行 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <h3>商品销量TOP10</h3>
            </div>
          </template>
          <div ref="topProductsChart" class="chart-container"></div>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <h3>销量排行榜</h3>
            </div>
          </template>
          <el-table :data="statistics.topProducts || []" style="width: 100%" max-height="300">
            <el-table-column type="index" label="排名" width="60">
              <template #default="{ $index }">
                <span :class="getRankClass($index)">{{ $index + 1 }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="productName" label="商品名称" show-overflow-tooltip />
            <el-table-column prop="sales" label="销量" width="100">
              <template #default="{ row }">
                {{ row.sales || 0 }}
              </template>
            </el-table-column>
            <el-table-column label="销售额" width="120">
              <template #default="{ row }">
                <span class="sales-amount">¥{{ formatMoney(row.salesAmount) }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { TrendCharts, Document, Goods, UserFilled, Warning } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getSalesStatistics } from '@/api/statistics'

const loading = ref(false)
const statistics = ref({})

// 图表引用
const salesTrendChart = ref(null)
const categoryPieChart = ref(null)
const topProductsChart = ref(null)

// 图表实例
let salesChart = null
let pieChart = null
let barChart = null

// 格式化金额
const formatMoney = (value) => {
  if (!value) return '0.00'
  return Number(value).toFixed(2)
}

// 获取排名样式
const getRankClass = (index) => {
  if (index === 0) return 'rank-1'
  if (index === 1) return 'rank-2'
  if (index === 2) return 'rank-3'
  return ''
}

// 加载统计数据
const loadStatistics = async () => {
  loading.value = true
  try {
    const res = await getSalesStatistics()
    if (res.code === 200) {
      statistics.value = res.data
      await nextTick()
      initCharts()
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 初始化图表
const initCharts = () => {
  initSalesTrendChart()
  initCategoryPieChart()
  initTopProductsChart()
}

// 销售趋势图
const initSalesTrendChart = () => {
  if (!salesTrendChart.value) return
  
  if (salesChart) {
    salesChart.dispose()
  }
  salesChart = echarts.init(salesTrendChart.value)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['销售额', '订单数']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: statistics.value.salesTrendDates || [],
      axisLine: { lineStyle: { color: '#ddd' } },
      axisLabel: { color: '#666' }
    },
    yAxis: [
      {
        type: 'value',
        name: '销售额(元)',
        axisLine: { lineStyle: { color: '#667eea' } },
        axisLabel: { color: '#666' }
      },
      {
        type: 'value',
        name: '订单数',
        axisLine: { lineStyle: { color: '#f5576c' } },
        axisLabel: { color: '#666' }
      }
    ],
    series: [
      {
        name: '销售额',
        type: 'line',
        smooth: true,
        data: statistics.value.salesTrendAmounts || [],
        itemStyle: { color: '#667eea' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(102, 126, 234, 0.3)' },
              { offset: 1, color: 'rgba(102, 126, 234, 0)' }
            ]
          }
        }
      },
      {
        name: '订单数',
        type: 'bar',
        yAxisIndex: 1,
        data: statistics.value.orderTrendCounts || [],
        itemStyle: { color: '#f5576c' }
      }
    ]
  }
  
  salesChart.setOption(option)
}

// 分类销售饼图
const initCategoryPieChart = () => {
  if (!categoryPieChart.value) return
  
  if (pieChart) {
    pieChart.dispose()
  }
  pieChart = echarts.init(categoryPieChart.value)
  
  const categorySales = statistics.value.categorySales || []
  const pieData = categorySales.map(item => ({
    name: item.categoryName || '未分类',
    value: Number(item.salesAmount) || 0
  }))
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ¥{c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'center'
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
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
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        data: pieData.length > 0 ? pieData : [{ name: '暂无数据', value: 0 }]
      }
    ],
    color: ['#667eea', '#f5576c', '#4facfe', '#43e97b', '#f093fb', '#ffecd2', '#a8edea']
  }
  
  pieChart.setOption(option)
}

// 商品销量TOP10柱状图
const initTopProductsChart = () => {
  if (!topProductsChart.value) return
  
  if (barChart) {
    barChart.dispose()
  }
  barChart = echarts.init(topProductsChart.value)
  
  const topProducts = statistics.value.topProducts || []
  const productNames = topProducts.map(p => p.productName).reverse()
  const productSales = topProducts.map(p => p.sales || 0).reverse()
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '10%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      axisLabel: { color: '#666' }
    },
    yAxis: {
      type: 'category',
      data: productNames,
      axisLabel: { 
        color: '#666',
        width: 80,
        overflow: 'truncate'
      }
    },
    series: [
      {
        type: 'bar',
        data: productSales,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#667eea' },
              { offset: 1, color: '#764ba2' }
            ]
          },
          borderRadius: [0, 4, 4, 0]
        },
        label: {
          show: true,
          position: 'right',
          formatter: '{c}'
        }
      }
    ]
  }
  
  barChart.setOption(option)
}

// 窗口大小变化时调整图表
const handleResize = () => {
  salesChart && salesChart.resize()
  pieChart && pieChart.resize()
  barChart && barChart.resize()
}

onMounted(() => {
  loadStatistics()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  salesChart && salesChart.dispose()
  pieChart && pieChart.dispose()
  barChart && barChart.dispose()
})
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.stat-card {
  margin-bottom: 20px;
}

.stat-content {
  display: flex;
  align-items: center;
  padding: 10px 0;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  font-size: 24px;
  color: white;
}

.stat-icon.sales {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.orders {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.products {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.members {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-info h3 {
  margin: 0 0 5px 0;
  color: #666;
  font-size: 14px;
  font-weight: normal;
}

.stat-number {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.stat-sub {
  margin: 5px 0 0 0;
  font-size: 12px;
  color: #999;
}

.stat-sub.warning {
  color: #E6A23C;
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.chart-container {
  height: 300px;
}

.rank-1, .rank-2, .rank-3 {
  display: inline-block;
  width: 20px;
  height: 20px;
  line-height: 20px;
  text-align: center;
  border-radius: 50%;
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.rank-1 {
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
}

.rank-2 {
  background: linear-gradient(135deg, #C0C0C0 0%, #A0A0A0 100%);
}

.rank-3 {
  background: linear-gradient(135deg, #CD7F32 0%, #B87333 100%);
}

.sales-amount {
  color: #f56c6c;
  font-weight: bold;
}
</style>
