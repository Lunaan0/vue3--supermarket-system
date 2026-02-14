<template>
  <div class="orders">
    <div class="page-header">
      <h2>订单管理</h2>
      <div class="header-actions">
        <el-input
          v-model="queryParams.orderNo"
          placeholder="搜索订单号"
          style="width: 180px; margin-right: 10px;"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select 
          v-model="queryParams.orderStatus" 
          placeholder="订单状态" 
          clearable 
          style="width: 120px; margin-right: 10px;">
          <el-option label="待支付" :value="0" />
          <el-option label="已支付" :value="1" />
          <el-option label="已完成" :value="2" />
          <el-option label="已取消" :value="3" />
        </el-select>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </div>
    
    <el-card>
      <el-table :data="orderList" style="width: 100%" v-loading="loading">
        <el-table-column prop="orderNo" label="订单号" width="200" />
        <el-table-column prop="userId" label="用户ID" width="100" />
        <el-table-column prop="orderAmount" label="订单金额" width="120">
          <template #default="{ row }">
            <span style="color: #333;">¥{{ row.orderAmount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="payAmount" label="实付金额" width="120">
          <template #default="{ row }">
            <span style="color: #f56c6c; font-weight: bold;">¥{{ row.payAmount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="订单状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.orderStatus)">
              {{ getStatusText(row.orderStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="支付状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.payStatus === 1 ? 'success' : 'info'">
              {{ row.payStatus === 1 ? '已支付' : '未支付' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="支付方式" width="100">
          <template #default="{ row }">
            {{ getPayTypeText(row.payType) }}
          </template>
        </el-table-column>
        <el-table-column label="下单时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="viewOrder(row)">查看</el-button>
            <el-button 
              size="small" 
              type="success" 
              v-if="row.orderStatus === 1"
              @click="completeOrder(row)"
            >
              完成
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              v-if="row.orderStatus === 0 || row.orderStatus === 1"
              @click="cancelOrder(row)"
            >
              取消
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination">
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadOrders"
          @current-change="loadOrders"
        />
      </div>
    </el-card>
    
    <!-- 订单详情对话框 -->
    <el-dialog title="订单详情" v-model="detailDialogVisible" width="700px">
      <div class="order-detail" v-if="selectedOrder">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单号">{{ selectedOrder.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="用户ID">{{ selectedOrder.userId }}</el-descriptions-item>
          <el-descriptions-item label="订单金额">¥{{ selectedOrder.orderAmount }}</el-descriptions-item>
          <el-descriptions-item label="实付金额">
            <span style="color: #f56c6c; font-weight: bold;">¥{{ selectedOrder.payAmount }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <el-tag :type="getStatusType(selectedOrder.orderStatus)">
              {{ selectedOrder.orderStatusText || getStatusText(selectedOrder.orderStatus) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="支付方式">
            {{ selectedOrder.payTypeText || getPayTypeText(selectedOrder.payType) }}
          </el-descriptions-item>
          <el-descriptions-item label="下单时间">{{ formatDate(selectedOrder.createTime) }}</el-descriptions-item>
          <el-descriptions-item label="支付时间" v-if="selectedOrder.payTime">
            {{ formatDate(selectedOrder.payTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="备注" :span="2" v-if="selectedOrder.remark">
            {{ selectedOrder.remark }}
          </el-descriptions-item>
        </el-descriptions>
        
        <h4 style="margin-top: 20px;">商品清单</h4>
        <el-table :data="selectedOrder.items || []" style="width: 100%">
          <el-table-column label="商品" min-width="200">
            <template #default="{ row }">
              <div class="product-info">
                <img :src="getImageUrl(row.productImg)" :alt="row.productName" />
                <span>{{ row.productName }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="sellingPrice" label="单价" width="100">
            <template #default="{ row }">
              ¥{{ row.sellingPrice }}
            </template>
          </el-table-column>
          <el-table-column prop="buyQuantity" label="数量" width="80" />
          <el-table-column label="小计" width="120">
            <template #default="{ row }">
              ¥{{ row.discountAmount }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { getAdminOrderPage, getAdminOrderDetail, completeOrder as completeOrderApi, cancelAdminOrder } from '@/api/order'

const loading = ref(false)
const orderList = ref([])
const total = ref(0)
const detailDialogVisible = ref(false)
const selectedOrder = ref(null)

const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  orderNo: '',
  orderStatus: null,
  payStatus: null
})

// 获取图片URL
const getImageUrl = (imagePath) => {
  if (!imagePath) return ''
  return `/api${imagePath}`
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}

// 获取订单状态类型
const getStatusType = (status) => {
  const types = {
    0: 'warning',
    1: 'primary',
    2: 'success',
    3: 'info'
  }
  return types[status] || 'info'
}

// 获取订单状态文本
const getStatusText = (status) => {
  const texts = {
    0: '待支付',
    1: '已支付',
    2: '已完成',
    3: '已取消'
  }
  return texts[status] || '未知'
}

// 获取支付方式文本
const getPayTypeText = (payType) => {
  const texts = {
    0: '现金',
    1: '微信',
    2: '支付宝',
    3: '银行卡'
  }
  return texts[payType] || '-'
}

// 加载订单列表
const loadOrders = async () => {
  loading.value = true
  try {
    const res = await getAdminOrderPage(queryParams.value)
    if (res.code === 200) {
      orderList.value = res.data.records || []
      total.value = res.data.total || 0
    }
  } catch (error) {
    console.error('加载订单失败:', error)
    ElMessage.error('加载订单失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  queryParams.value.pageNum = 1
  loadOrders()
}

// 重置
const handleReset = () => {
  queryParams.value = {
    pageNum: 1,
    pageSize: 10,
    orderNo: '',
    orderStatus: null,
    payStatus: null
  }
  loadOrders()
}

// 查看订单详情
const viewOrder = async (order) => {
  try {
    const res = await getAdminOrderDetail(order.id)
    if (res.code === 200) {
      selectedOrder.value = res.data
      detailDialogVisible.value = true
    }
  } catch (error) {
    ElMessage.error('获取订单详情失败')
  }
}

// 完成订单
const completeOrder = (order) => {
  ElMessageBox.confirm('确定将此订单标记为已完成吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await completeOrderApi(order.id)
      if (res.code === 200) {
        ElMessage.success('订单已完成')
        loadOrders()
      } else {
        ElMessage.error(res.msg || '操作失败')
      }
    } catch (error) {
      ElMessage.error('操作失败')
    }
  }).catch(() => {})
}

// 取消订单
const cancelOrder = (order) => {
  ElMessageBox.confirm('确定要取消这个订单吗？库存将会恢复', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await cancelAdminOrder(order.id)
      if (res.code === 200) {
        ElMessage.success('订单已取消')
        loadOrders()
      } else {
        ElMessage.error(res.msg || '操作失败')
      }
    } catch (error) {
      ElMessage.error('操作失败')
    }
  }).catch(() => {})
}

onMounted(() => {
  loadOrders()
})
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

.product-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.product-info img {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
}
</style>
