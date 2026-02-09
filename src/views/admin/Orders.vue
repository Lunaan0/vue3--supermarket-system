<template>
  <div class="orders">
    <div class="page-header">
      <h2>订单管理</h2>
      <div class="header-actions">
        <el-input
          v-model="searchText"
          placeholder="搜索订单号或客户"
          style="width: 200px; margin-right: 10px;"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary">刷新</el-button>
      </div>
    </div>
    
    <el-card>
      <el-table :data="filteredOrders" style="width: 100%">
        <el-table-column prop="id" label="订单号" width="120" />
        <el-table-column prop="customer" label="客户" />
        <el-table-column prop="phone" label="联系电话" />
        <el-table-column prop="amount" label="金额">
          <template #default="scope">
            <span style="color: #f56c6c; font-weight: bold;">¥{{ scope.row.amount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="下单时间" width="180" />
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button size="small" @click="viewOrder(scope.row)">查看</el-button>
            <el-button 
              size="small" 
              type="success" 
              v-if="scope.row.status === '待发货'"
              @click="shipOrder(scope.row)"
            >
              发货
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              v-if="scope.row.status === '待发货'"
              @click="cancelOrder(scope.row)"
            >
              取消
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalOrders"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>
    </el-card>
    
    <!-- 订单详情对话框 -->
    <el-dialog title="订单详情" v-model="detailDialogVisible" width="600px">
      <div class="order-detail" v-if="selectedOrder">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单号">{{ selectedOrder.id }}</el-descriptions-item>
          <el-descriptions-item label="客户">{{ selectedOrder.customer }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ selectedOrder.phone }}</el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <el-tag :type="getStatusType(selectedOrder.status)">
              {{ selectedOrder.status }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="订单金额">¥{{ selectedOrder.amount }}</el-descriptions-item>
          <el-descriptions-item label="下单时间">{{ selectedOrder.createTime }}</el-descriptions-item>
          <el-descriptions-item label="收货地址" :span="2">{{ selectedOrder.address }}</el-descriptions-item>
        </el-descriptions>
        
        <h4 style="margin-top: 20px;">商品清单</h4>
        <el-table :data="selectedOrder.items" style="width: 100%">
          <el-table-column prop="name" label="商品名称" />
          <el-table-column prop="price" label="单价" />
          <el-table-column prop="quantity" label="数量" />
          <el-table-column prop="subtotal" label="小计" />
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'

const orders = ref([
  {
    id: '#2024001',
    customer: '张三',
    phone: '13800138001',
    amount: '256.00',
    status: '已完成',
    createTime: '2024-01-30 10:30:00',
    address: '北京市朝阳区某某街道123号',
    items: [
      { name: '红富士苹果', price: '12.80', quantity: 2, subtotal: '25.60' },
      { name: '纯牛奶', price: '18.50', quantity: 3, subtotal: '55.50' },
      { name: '全麦面包', price: '8.90', quantity: 2, subtotal: '17.80' }
    ]
  },
  {
    id: '#2024002',
    customer: '李四',
    phone: '13800138002',
    amount: '189.50',
    status: '处理中',
    createTime: '2024-01-30 11:15:00',
    address: '北京市海淀区某某小区456号',
    items: [
      { name: '新鲜鸡蛋', price: '15.60', quantity: 1, subtotal: '15.60' },
      { name: '红富士苹果', price: '12.80', quantity: 3, subtotal: '38.40' }
    ]
  },
  {
    id: '#2024003',
    customer: '王五',
    phone: '13800138003',
    amount: '423.80',
    status: '待发货',
    createTime: '2024-01-29 15:20:00',
    address: '北京市西城区某某大楼789号',
    items: [
      { name: '纯牛奶', price: '18.50', quantity: 5, subtotal: '92.50' },
      { name: '全麦面包', price: '8.90', quantity: 4, subtotal: '35.60' }
    ]
  }
])

const searchText = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const detailDialogVisible = ref(false)
const selectedOrder = ref(null)

const filteredOrders = computed(() => {
  if (!searchText.value) return orders.value
  
  return orders.value.filter(order => 
    order.id.includes(searchText.value) || 
    order.customer.includes(searchText.value)
  )
})

const totalOrders = computed(() => filteredOrders.value.length)

const getStatusType = (status) => {
  const statusMap = {
    '已完成': 'success',
    '处理中': 'warning',
    '待发货': 'info',
    '已取消': 'danger'
  }
  return statusMap[status] || 'info'
}

const viewOrder = (order) => {
  selectedOrder.value = order
  detailDialogVisible.value = true
}

const shipOrder = (order) => {
  ElMessageBox.confirm('确定要发货这个订单吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    order.status = '处理中'
    ElMessage.success('订单已发货')
  })
}

const cancelOrder = (order) => {
  ElMessageBox.confirm('确定要取消这个订单吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    order.status = '已取消'
    ElMessage.success('订单已取消')
  })
}
</script>

<style scoped>
.orders {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #333;
}

.header-actions {
  display: flex;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.order-detail {
  padding: 10px 0;
}
</style>
