<template>
  <div class="member-center-container">
    <!-- 会员状态卡片 -->
    <el-card class="member-status-card" shadow="hover">
      <div class="member-header">
        <div class="member-avatar">
          <el-avatar :size="80" :src="userAvatar">
            <el-icon :size="40"><User /></el-icon>
          </el-avatar>
        </div>
        <div class="member-info">
          <div class="member-title">
            <span v-if="memberInfo.isMember" :class="'level-badge level-' + memberInfo.level">
              {{ memberInfo.memberLevel }}
            </span>
            <span v-else class="level-badge level-0">普通用户</span>
          </div>
          <div class="member-card" v-if="memberInfo.memberCard">
            会员卡号：{{ memberInfo.memberCard }}
          </div>
          <div class="member-stats">
            <div class="stat-item">
              <span class="stat-value">{{ memberInfo.points || 0 }}</span>
              <span class="stat-label">积分</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ memberInfo.discount ? (memberInfo.discount * 10).toFixed(1) : 10 }}折</span>
              <span class="stat-label">折扣</span>
            </div>
            <div class="stat-item" v-if="memberInfo.isMember">
              <span class="stat-value" :class="{ 'expired': memberInfo.isExpired }">
                {{ memberInfo.isExpired ? '已过期' : (memberInfo.remainDays === -1 ? '永久' : memberInfo.remainDays + '天') }}
              </span>
              <span class="stat-label">剩余时间</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">¥{{ memberInfo.totalConsume || 0 }}</span>
              <span class="stat-label">累计消费</span>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 会员等级选择 -->
    <el-card class="level-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="title">开通/续费会员</span>
        </div>
      </template>
      
      <div class="level-list" v-loading="levelLoading">
        <div 
          v-for="level in memberLevels" 
          :key="level.id" 
          class="level-item"
          :class="{ 'selected': selectedLevel?.id === level.id, ['level-' + level.level]: true }"
          @click="selectLevel(level)"
        >
          <div class="level-icon">
            <el-icon v-if="level.level === 1" :size="32"><Medal /></el-icon>
            <el-icon v-else-if="level.level === 2" :size="32"><Trophy /></el-icon>
            <el-icon v-else :size="32"><Star /></el-icon>
          </div>
          <div class="level-name">{{ level.levelName }}</div>
          <div class="level-discount">{{ (level.discount * 10).toFixed(1) }}折</div>
          <div class="level-desc">{{ level.description }}</div>
        </div>
      </div>

      <!-- 购买类型选择 -->
      <div class="purchase-type" v-if="selectedLevel">
        <div class="type-title">选择购买时长</div>
        <div class="type-list">
          <div 
            class="type-item" 
            :class="{ 'selected': purchaseType === 1 }"
            @click="purchaseType = 1"
          >
            <div class="type-name">月度会员</div>
            <div class="type-price">¥{{ selectedLevel.monthlyPrice }}</div>
            <div class="type-unit">/月</div>
          </div>
          <div 
            class="type-item hot" 
            :class="{ 'selected': purchaseType === 2 }"
            @click="purchaseType = 2"
          >
            <div class="hot-tag">推荐</div>
            <div class="type-name">季度会员</div>
            <div class="type-price">¥{{ selectedLevel.quarterlyPrice }}</div>
            <div class="type-unit">/季</div>
            <div class="type-save">省{{ calculateSave(selectedLevel, 2) }}</div>
          </div>
          <div 
            class="type-item" 
            :class="{ 'selected': purchaseType === 3 }"
            @click="purchaseType = 3"
          >
            <div class="type-name">年度会员</div>
            <div class="type-price">¥{{ selectedLevel.yearlyPrice }}</div>
            <div class="type-unit">/年</div>
            <div class="type-save">省{{ calculateSave(selectedLevel, 3) }}</div>
          </div>
        </div>

        <div class="purchase-action">
          <el-button type="primary" size="large" @click="handlePurchase" :loading="purchasing">
            立即开通 ¥{{ getPrice() }}
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 购买记录 -->
    <el-card class="record-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="title">购买记录</span>
        </div>
      </template>

      <el-table :data="recordList" v-loading="recordLoading" stripe style="width: 100%">
        <el-table-column prop="orderNo" label="订单号" width="200" />
        <el-table-column prop="levelName" label="会员等级" width="120" align="center">
          <template #default="{ row }">
            <span :class="'level-text level-' + row.level">{{ row.levelName }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="purchaseTypeName" label="购买类型" width="120" align="center" />
        <el-table-column prop="payAmount" label="支付金额" width="120" align="center">
          <template #default="{ row }">
            <span class="price-text">¥{{ row.payAmount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="开始时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.startTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="endTime" label="结束时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.endTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="statusName" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ row.statusName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" align="center">
          <template #default="{ row }">
            <el-button v-if="row.status === 0" type="primary" link @click="handlePay(row)">支付</el-button>
            <el-button v-if="row.status === 0" type="danger" link @click="handleCancel(row)">取消</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          :current-page="recordQuery.pageNum"
          :page-size="recordQuery.pageSize"
          :total="recordTotal"
          layout="total, prev, pager, next"
          @current-change="handleRecordPageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, Medal, Trophy, Star } from '@element-plus/icons-vue'
import { 
  getCurrentMemberInfo, 
  getMemberLevels, 
  purchaseMember, 
  payMemberOrder, 
  cancelMemberOrder, 
  getMemberPurchaseRecords 
} from '@/api/shopMember'

// 用户头像
const userAvatar = ref('')

// 会员信息
const memberInfo = ref({
  isMember: false,
  level: 0,
  memberLevel: '普通用户',
  discount: 1,
  points: 0,
  totalConsume: 0,
  isExpired: false,
  remainDays: 0
})

// 会员等级列表
const memberLevels = ref([])
const levelLoading = ref(false)
const selectedLevel = ref(null)
const purchaseType = ref(2) // 默认季度
const purchasing = ref(false)

// 购买记录
const recordList = ref([])
const recordTotal = ref(0)
const recordLoading = ref(false)
const recordQuery = reactive({
  pageNum: 1,
  pageSize: 10
})

// 获取会员信息
const getMemberInfo = async () => {
  try {
    const res = await getCurrentMemberInfo()
    if (res.code === 200) {
      memberInfo.value = res.data
    }
  } catch (error) {
    console.error('获取会员信息失败', error)
  }
}

// 获取会员等级列表
const getLevels = async () => {
  levelLoading.value = true
  try {
    const res = await getMemberLevels()
    if (res.code === 200) {
      memberLevels.value = res.data
      if (res.data.length > 0) {
        // 默认选择与当前等级相同或更高的等级
        const currentLevel = memberInfo.value.level || 0
        const available = res.data.filter(l => l.level >= currentLevel)
        selectedLevel.value = available.length > 0 ? available[0] : res.data[0]
      }
    }
  } finally {
    levelLoading.value = false
  }
}

// 选择等级
const selectLevel = (level) => {
  selectedLevel.value = level
}

// 计算节省金额
const calculateSave = (level, type) => {
  if (!level) return 0
  const monthlyPrice = level.monthlyPrice || 0
  if (type === 2) {
    // 季度：对比3个月
    return (monthlyPrice * 3 - level.quarterlyPrice).toFixed(2)
  } else if (type === 3) {
    // 年度：对比12个月
    return (monthlyPrice * 12 - level.yearlyPrice).toFixed(2)
  }
  return 0
}

// 获取当前价格
const getPrice = () => {
  if (!selectedLevel.value) return 0
  switch (purchaseType.value) {
    case 1: return selectedLevel.value.monthlyPrice
    case 2: return selectedLevel.value.quarterlyPrice
    case 3: return selectedLevel.value.yearlyPrice
    default: return 0
  }
}

// 购买会员
const handlePurchase = async () => {
  if (!selectedLevel.value) {
    ElMessage.warning('请选择会员等级')
    return
  }
  
  purchasing.value = true
  try {
    const res = await purchaseMember({
      levelId: selectedLevel.value.id,
      purchaseType: purchaseType.value,
      payMethod: 1
    })
    if (res.code === 200) {
      ElMessageBox.confirm('订单创建成功，是否立即支付？', '提示', {
        confirmButtonText: '立即支付',
        cancelButtonText: '稍后支付',
        type: 'success'
      }).then(async () => {
        await handlePay(res.data)
      }).catch(() => {
        ElMessage.info('您可以在购买记录中完成支付')
        getRecords()
      })
    }
  } finally {
    purchasing.value = false
  }
}

// 支付订单
const handlePay = async (record) => {
  try {
    const res = await payMemberOrder(record.id)
    if (res.code === 200) {
      ElMessage.success('支付成功！')
      getMemberInfo()
      getRecords()
    }
  } catch (error) {
    console.error('支付失败', error)
  }
}

// 取消订单
const handleCancel = (record) => {
  ElMessageBox.confirm('确认取消此订单吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    const res = await cancelMemberOrder(record.id)
    if (res.code === 200) {
      ElMessage.success('订单已取消')
      getRecords()
    }
  }).catch(() => {})
}

// 获取购买记录
const getRecords = async () => {
  recordLoading.value = true
  try {
    const res = await getMemberPurchaseRecords(recordQuery)
    if (res.code === 200) {
      recordList.value = res.data.records
      recordTotal.value = res.data.total
    }
  } finally {
    recordLoading.value = false
  }
}

// 记录分页
const handleRecordPageChange = (page) => {
  recordQuery.pageNum = page
  getRecords()
}

// 获取状态标签类型
const getStatusType = (status) => {
  const types = { 0: 'warning', 1: 'success', 2: 'info' }
  return types[status] || 'info'
}

// 格式化日期时间
const formatDateTime = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

onMounted(async () => {
  await getMemberInfo()
  await getLevels()
  getRecords()
})
</script>

<style scoped>
.member-center-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 会员状态卡片 */
.member-status-card {
  margin-bottom: 20px;
  border-radius: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.member-status-card :deep(.el-card__body) {
  padding: 30px;
}

.member-header {
  display: flex;
  align-items: center;
  color: white;
}

.member-avatar {
  margin-right: 30px;
}

.member-avatar :deep(.el-avatar) {
  border: 3px solid rgba(255, 255, 255, 0.5);
}

.member-info {
  flex: 1;
}

.member-title {
  margin-bottom: 10px;
}

.level-badge {
  display: inline-block;
  padding: 4px 16px;
  border-radius: 20px;
  font-size: 16px;
  font-weight: 600;
}

.level-badge.level-0 {
  background: rgba(255, 255, 255, 0.2);
}

.level-badge.level-1 {
  background: linear-gradient(135deg, #cd7f32, #b87333);
}

.level-badge.level-2 {
  background: linear-gradient(135deg, #c0c0c0, #a8a8a8);
}

.level-badge.level-3 {
  background: linear-gradient(135deg, #ffd700, #ffb800);
  color: #333;
}

.member-card {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 15px;
}

.member-stats {
  display: flex;
  gap: 40px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
}

.stat-value.expired {
  color: #f56c6c;
}

.stat-label {
  font-size: 12px;
  opacity: 0.8;
}

/* 等级卡片 */
.level-card {
  margin-bottom: 20px;
  border-radius: 16px;
}

.card-header .title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.level-list {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
}

.level-item {
  flex: 1;
  padding: 25px;
  border: 2px solid #e4e7ed;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.level-item:hover {
  border-color: #667eea;
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.2);
}

.level-item.selected {
  border-color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
}

.level-item.level-1 .level-icon {
  color: #cd7f32;
}

.level-item.level-2 .level-icon {
  color: #c0c0c0;
}

.level-item.level-3 .level-icon {
  color: #ffd700;
}

.level-icon {
  margin-bottom: 10px;
}

.level-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 5px;
}

.level-discount {
  font-size: 24px;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 10px;
}

.level-desc {
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}

/* 购买类型选择 */
.purchase-type {
  border-top: 1px solid #ebeef5;
  padding-top: 25px;
}

.type-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 15px;
}

.type-list {
  display: flex;
  gap: 20px;
  margin-bottom: 25px;
}

.type-item {
  flex: 1;
  padding: 20px;
  border: 2px solid #e4e7ed;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  position: relative;
  transition: all 0.3s;
}

.type-item:hover {
  border-color: #667eea;
}

.type-item.selected {
  border-color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
}

.type-item.hot .hot-tag {
  position: absolute;
  top: -12px;
  right: 10px;
  background: linear-gradient(135deg, #f56c6c, #e6a23c);
  color: white;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
}

.type-name {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}

.type-price {
  font-size: 28px;
  font-weight: 700;
  color: #f56c6c;
}

.type-unit {
  font-size: 12px;
  color: #909399;
}

.type-save {
  margin-top: 8px;
  font-size: 12px;
  color: #67c23a;
}

.purchase-action {
  text-align: center;
}

.purchase-action .el-button {
  width: 300px;
  height: 50px;
  font-size: 18px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 25px;
}

/* 记录卡片 */
.record-card {
  border-radius: 16px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.level-text.level-1 {
  color: #cd7f32;
  font-weight: 600;
}

.level-text.level-2 {
  color: #909399;
  font-weight: 600;
}

.level-text.level-3 {
  color: #e6a23c;
  font-weight: 600;
}

.price-text {
  color: #f56c6c;
  font-weight: 600;
}
</style>
