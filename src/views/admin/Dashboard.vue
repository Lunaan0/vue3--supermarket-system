<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon sales">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <h3>今日销售额</h3>
              <p class="stat-number">¥12,345</p>
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
              <h3>今日订单</h3>
              <p class="stat-number">156</p>
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
              <p class="stat-number">2,456</p>
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
              <p class="stat-number">3,789</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card>
          <template #header>
            <h3>销售趋势</h3>
          </template>
          <div class="chart-placeholder">
            <p>销售趋势图表区域</p>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card>
          <template #header>
            <h3>商品分类统计</h3>
          </template>
          <div class="chart-placeholder">
            <p>商品分类统计图表区域</p>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row style="margin-top: 20px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <h3>最近订单</h3>
          </template>
          <el-table :data="recentOrders" style="width: 100%">
            <el-table-column prop="id" label="订单号" width="120" />
            <el-table-column prop="customer" label="客户" />
            <el-table-column prop="amount" label="金额" />
            <el-table-column prop="status" label="状态">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)">
                  {{ scope.row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="date" label="日期" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { TrendCharts, Document, Goods, UserFilled } from '@element-plus/icons-vue'

const recentOrders = ref([
  {
    id: '#2024001',
    customer: '张三',
    amount: '¥256.00',
    status: '已完成',
    date: '2024-01-30'
  },
  {
    id: '#2024002',
    customer: '李四',
    amount: '¥189.50',
    status: '处理中',
    date: '2024-01-30'
  },
  {
    id: '#2024003',
    customer: '王五',
    amount: '¥423.80',
    status: '待发货',
    date: '2024-01-29'
  }
])

const getStatusType = (status) => {
  const statusMap = {
    '已完成': 'success',
    '处理中': 'warning',
    '待发货': 'info',
    '已取消': 'danger'
  }
  return statusMap[status] || 'info'
}
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

.chart-placeholder {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f9f9f9;
  border-radius: 4px;
  color: #999;
}
</style>
