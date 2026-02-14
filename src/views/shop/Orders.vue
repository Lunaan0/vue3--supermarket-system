<template>
  <div class="shop-orders">
    <!-- 顶部导航栏 -->
    <div class="top-bar">
      <div class="container">
        <div class="logo" @click="goToHome">超市商城</div>
        <div class="nav-links">
          <el-button text @click="goToHome">首页</el-button>
          <el-button text @click="goToProducts">商品</el-button>
          <el-button text @click="goToCart">购物车</el-button>
          <el-button text type="primary">我的订单</el-button>
        </div>
        <div class="user-info">
          <span>欢迎, {{ userStore.user?.username || '游客' }}</span>
        </div>
      </div>
    </div>

    <!-- 订单内容 -->
    <div class="orders-content">
      <div class="container">
        <h2 class="page-title">我的订单</h2>

        <!-- 订单状态筛选 -->
        <div class="order-tabs">
          <el-tabs v-model="activeTab" @tab-change="handleTabChange">
            <el-tab-pane label="全部" name="all" />
            <el-tab-pane label="待支付" name="0" />
            <el-tab-pane label="已支付" name="1" />
            <el-tab-pane label="已完成" name="2" />
            <el-tab-pane label="已取消" name="3" />
          </el-tabs>
        </div>

        <!-- 订单列表 -->
        <div v-loading="loading" class="order-list">
          <div 
            v-for="order in orderList" 
            :key="order.id" 
            class="order-card">
            <div class="order-header">
              <div class="order-info">
                <span class="order-no">订单号: {{ order.orderNo }}</span>
                <span class="order-time">{{ formatDate(order.createTime) }}</span>
              </div>
              <el-tag :type="getStatusType(order.orderStatus)">
                {{ order.orderStatusText }}
              </el-tag>
            </div>

            <div class="order-items" @click="viewOrderDetail(order)">
              <div 
                v-for="item in order.items" 
                :key="item.id" 
                class="order-item">
                <img :src="getImageUrl(item.productImg)" :alt="item.productName" />
                <div class="item-info">
                  <div class="item-name">{{ item.productName }}</div>
                  <div class="item-spec">{{ item.productSpec }}</div>
                </div>
                <div class="item-price">
                  <span>¥{{ item.sellingPrice }}</span>
                  <span class="quantity">x{{ item.buyQuantity }}</span>
                </div>
              </div>
            </div>

            <div class="order-footer">
              <div class="order-total">
                <span>共 {{ getTotalQuantity(order) }} 件商品，</span>
                <span>实付款：</span>
                <span class="pay-amount">¥{{ order.payAmount }}</span>
              </div>
              <div class="order-actions">
                <el-button 
                  v-if="order.orderStatus === 0"
                  type="primary"
                  size="small"
                  @click="handlePay(order)">
                  立即支付
                </el-button>
                <el-button 
                  v-if="order.orderStatus === 0"
                  size="small"
                  @click="handleCancel(order)">
                  取消订单
                </el-button>
                <el-button 
                  size="small"
                  @click="viewOrderDetail(order)">
                  查看详情
                </el-button>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <el-empty 
            v-if="!loading && orderList.length === 0" 
            description="暂无订单"
            :image-size="200">
            <el-button type="primary" @click="goToProducts">去购物</el-button>
          </el-empty>

          <!-- 分页 -->
          <div class="pagination-container" v-if="total > 0">
            <el-pagination
              :current-page="queryParams.pageNum"
              :page-size="queryParams.pageSize"
              :total="total"
              layout="total, prev, pager, next"
              @current-change="handlePageChange" />
          </div>
        </div>
      </div>
    </div>

    <!-- 订单详情弹窗 -->
    <el-dialog 
      v-model="detailDialogVisible" 
      title="订单详情" 
      width="700px">
      <div v-if="currentOrder" class="order-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单号">{{ currentOrder.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="下单时间">{{ formatDate(currentOrder.createTime) }}</el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <el-tag :type="getStatusType(currentOrder.orderStatus)">
              {{ currentOrder.orderStatusText }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="支付方式">{{ currentOrder.payTypeText }}</el-descriptions-item>
          <el-descriptions-item label="订单金额">¥{{ currentOrder.orderAmount }}</el-descriptions-item>
          <el-descriptions-item label="实付金额">
            <span class="pay-amount">¥{{ currentOrder.payAmount }}</span>
          </el-descriptions-item>
          <el-descriptions-item v-if="currentOrder.payTime" label="支付时间" :span="2">
            {{ formatDate(currentOrder.payTime) }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentOrder.remark" label="备注" :span="2">
            {{ currentOrder.remark }}
          </el-descriptions-item>
        </el-descriptions>

        <h4 style="margin-top: 20px;">商品清单</h4>
        <el-table :data="currentOrder.items" style="width: 100%">
          <el-table-column label="商品" min-width="200">
            <template #default="{ row }">
              <div class="detail-item">
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

    <!-- 支付弹窗 -->
    <el-dialog 
      v-model="payDialogVisible" 
      title="选择支付方式" 
      width="400px">
      <div class="pay-dialog">
        <div class="pay-amount-info">
          <span>支付金额：</span>
          <span class="amount">¥{{ payOrder?.payAmount }}</span>
        </div>
        <div class="pay-methods">
          <div 
            v-for="method in payMethods" 
            :key="method.value"
            class="pay-method"
            :class="{ active: selectedPayType === method.value }"
            @click="selectedPayType = method.value">
            <el-icon :size="24"><component :is="method.icon" /></el-icon>
            <span>{{ method.label }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="payDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmPay">确认支付</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Money, CreditCard, Wallet } from '@element-plus/icons-vue'
import { getOrderPage, getOrderDetail, payOrder as payOrderApi, cancelOrder as cancelOrderApi } from '@/api/order'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const userStore = useAuthStore()

const loading = ref(false)
const activeTab = ref('all')
const orderList = ref([])
const total = ref(0)
const detailDialogVisible = ref(false)
const currentOrder = ref(null)
const payDialogVisible = ref(false)
const payOrderData = ref(null)
const selectedPayType = ref(1)

const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  orderStatus: null
})

const payMethods = [
  { value: 0, label: '现金', icon: shallowRef(Money) },
  { value: 1, label: '微信支付', icon: shallowRef(Wallet) },
  { value: 2, label: '支付宝', icon: shallowRef(CreditCard) },
  { value: 3, label: '银行卡', icon: shallowRef(CreditCard) }
]

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

// 计算订单总数量
const getTotalQuantity = (order) => {
  if (!order.items) return 0
  return order.items.reduce((sum, item) => sum + item.buyQuantity, 0)
}

// 加载订单列表
const loadOrders = async () => {
  loading.value = true
  try {
    const res = await getOrderPage(queryParams.value)
    if (res.code === 200) {
      // 为每个订单加载详情
      const orders = res.data.records || []
      for (let order of orders) {
        const detailRes = await getOrderDetail(order.id)
        if (detailRes.code === 200) {
          order.items = detailRes.data.items || []
        }
      }
      orderList.value = orders
      total.value = res.data.total || 0
    }
  } catch (error) {
    console.error('加载订单失败:', error)
    ElMessage.error('加载订单失败')
  } finally {
    loading.value = false
  }
}

// 切换标签
const handleTabChange = (tab) => {
  queryParams.value.orderStatus = tab === 'all' ? null : parseInt(tab)
  queryParams.value.pageNum = 1
  loadOrders()
}

// 分页变化
const handlePageChange = (page) => {
  queryParams.value.pageNum = page
  loadOrders()
}

// 查看订单详情
const viewOrderDetail = async (order) => {
  try {
    const res = await getOrderDetail(order.id)
    if (res.code === 200) {
      currentOrder.value = res.data
      detailDialogVisible.value = true
    }
  } catch (error) {
    ElMessage.error('获取订单详情失败')
  }
}

// 支付订单
const handlePay = (order) => {
  payOrderData.value = order
  selectedPayType.value = 1
  payDialogVisible.value = true
}

// 确认支付
const confirmPay = async () => {
  try {
    const res = await payOrderApi(payOrderData.value.id, selectedPayType.value)
    if (res.code === 200) {
      ElMessage.success('支付成功!')
      payDialogVisible.value = false
      loadOrders()
    } else {
      ElMessage.error(res.msg || '支付失败')
    }
  } catch (error) {
    ElMessage.error('支付失败')
  }
}

// 取消订单
const handleCancel = async (order) => {
  try {
    await ElMessageBox.confirm('确定要取消该订单吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const res = await cancelOrderApi(order.id)
    if (res.code === 200) {
      ElMessage.success('订单已取消')
      loadOrders()
    } else {
      ElMessage.error(res.msg || '取消失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('取消失败')
    }
  }
}

// 跳转到首页
const goToHome = () => {
  router.push('/shop/home')
}

// 跳转到商品页
const goToProducts = () => {
  router.push('/shop/products')
}

// 跳转到购物车
const goToCart = () => {
  router.push('/shop/cart')
}

onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.shop-orders {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 顶部导航栏 */
.top-bar {
  background: linear-gradient(135deg, #ff9a56 0%, #ff7730 100%);
  color: white;
  padding: 15px 0;
  box-shadow: 0 2px 8px rgba(255, 119, 48, 0.2);
}

.top-bar .container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-size: 24px;
  font-weight: bold;
  letter-spacing: 2px;
  cursor: pointer;
}

.nav-links {
  flex: 1;
  margin-left: 40px;
}

.nav-links .el-button {
  color: white;
  font-size: 16px;
}

.user-info {
  font-size: 14px;
}

/* 订单内容 */
.orders-content {
  padding: 30px 0;
}

.page-title {
  font-size: 28px;
  margin: 0 0 20px 0;
  color: #333;
}

/* 订单标签 */
.order-tabs {
  background: white;
  padding: 10px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

/* 订单列表 */
.order-list {
  min-height: 300px;
}

.order-card {
  background: white;
  border-radius: 8px;
  margin-bottom: 20px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #f9f9f9;
  border-bottom: 1px solid #e0e0e0;
}

.order-info {
  display: flex;
  gap: 20px;
}

.order-no {
  font-weight: bold;
  color: #333;
}

.order-time {
  color: #999;
  font-size: 14px;
}

.order-items {
  padding: 15px 20px;
  cursor: pointer;
}

.order-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px dashed #e0e0e0;
}

.order-item:last-child {
  border-bottom: none;
}

.order-item img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
  margin-right: 15px;
}

.item-info {
  flex: 1;
}

.item-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 5px;
}

.item-spec {
  font-size: 12px;
  color: #999;
}

.item-price {
  text-align: right;
}

.item-price span {
  display: block;
}

.quantity {
  color: #999;
  font-size: 12px;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #f9f9f9;
  border-top: 1px solid #e0e0e0;
}

.order-total {
  color: #666;
}

.pay-amount {
  font-size: 20px;
  color: #ff7730;
  font-weight: bold;
}

.order-actions {
  display: flex;
  gap: 10px;
}

/* 分页 */
.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* 订单详情 */
.detail-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.detail-item img {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
}

/* 支付弹窗 */
.pay-dialog {
  padding: 20px 0;
}

.pay-amount-info {
  text-align: center;
  margin-bottom: 30px;
}

.pay-amount-info .amount {
  font-size: 32px;
  color: #ff7730;
  font-weight: bold;
}

.pay-methods {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.pay-method {
  width: 100px;
  height: 80px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pay-method:hover {
  border-color: #ff7730;
}

.pay-method.active {
  border-color: #ff7730;
  background-color: rgba(255, 119, 48, 0.1);
}

.pay-method span {
  margin-top: 8px;
  font-size: 12px;
}
</style>
