<template>
  <div class="members">
    <div class="page-header">
      <h2>会员管理</h2>
      <el-button type="primary" @click="showAddDialog">
        <el-icon><Plus /></el-icon>
        添加会员
      </el-button>
    </div>

    <el-card>
      <div class="filter-bar">
        <el-input v-model="query.memberCard" placeholder="会员卡号" style="width: 160px; margin-right: 10px;" clearable />
        <el-select v-model="query.level" placeholder="会员等级" style="width: 140px; margin-right: 10px;" clearable>
          <el-option label="普通会员" :value="1" />
          <el-option label="银卡会员" :value="2" />
          <el-option label="金卡会员" :value="3" />
        </el-select>
        <el-button type="primary" @click="handleSearch"><el-icon><Search /></el-icon>搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <el-table :data="list" style="width: 100%; margin-top: 20px;" v-loading="loading">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="memberCard" label="会员卡号" min-width="140" />
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="realName" label="真实姓名" min-width="120" />
        <el-table-column prop="phone" label="手机号" min-width="140" />
        <el-table-column prop="memberLevel" label="会员等级" width="120">
          <template #default="scope">
            <el-tag :type="getLevelType(scope.row.level)">{{ scope.row.memberLevel }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="points" label="积分" width="100" />
        <el-table-column prop="totalConsume" label="累计消费" width="120">
          <template #default="scope">
            <span class="price">¥{{ scope.row.totalConsume || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="discount" label="折扣" width="100">
          <template #default="scope">
            {{ scope.row.discount ? (scope.row.discount * 100).toFixed(1) + '%' : '无' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="viewDetail(scope.row)">详情</el-button>
            <el-button link type="primary" size="small" @click="showLevelDialog(scope.row)">调整等级</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="query.pageNum"
          v-model:page-size="query.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="getList"
          @current-change="getList"
        />
      </div>
    </el-card>

    <!-- 添加会员对话框 -->
    <el-dialog title="添加会员" v-model="addDialogVisible" width="600px">
      <el-form :model="addForm" :rules="addRules" ref="addFormRef" label-width="100px">
        <el-form-item label="选择用户" prop="userId">
          <el-select v-model="addForm.userId" placeholder="请选择普通用户" style="width: 100%" filterable>
            <el-option 
              v-for="user in normalUsers" 
              :key="user.id" 
              :label="`${user.username} (${user.realName})`" 
              :value="user.id" 
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAdd" :loading="saveLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 调整等级对话框 -->
    <el-dialog title="修改" v-model="levelDialogVisible" width="600px">
      <el-form :model="levelForm" :rules="levelRules" ref="levelFormRef" label-width="100px">
        <el-form-item label="会员等级" prop="level">
          <el-select v-model="levelForm.level" placeholder="请选择等级" style="width: 100%" @change="handleLevelChange">
            <el-option label="普通会员" :value="1" />
            <el-option label="银卡会员" :value="2" />
            <el-option label="金卡会员" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="会员折扣" prop="discount">
          <el-input-number v-model="levelForm.discount" :precision="2" :step="0.05" :min="0" :max="1" style="width: 100%" />
          <span style="margin-left: 10px; color: #909399;">0-1之间，如0.95=95折</span>
        </el-form-item>
        <el-form-item label="积分" prop="points">
          <el-input-number v-model="levelForm.points" :min="0" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="levelDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleUpdateLevel" :loading="saveLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog title="会员详情" v-model="detailDialogVisible" width="700px">
      <el-descriptions :column="2" border v-if="detail">
        <el-descriptions-item label="会员ID">{{ detail.id }}</el-descriptions-item>
        <el-descriptions-item label="会员卡号">{{ detail.memberCard }}</el-descriptions-item>
        <el-descriptions-item label="用户名">{{ detail.username }}</el-descriptions-item>
        <el-descriptions-item label="真实姓名">{{ detail.realName }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ detail.phone }}</el-descriptions-item>
        <el-descriptions-item label="会员等级">
          <el-tag :type="getLevelType(detail.level)">{{ detail.memberLevel }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="当前积分">{{ detail.points || 0 }}</el-descriptions-item>
        <el-descriptions-item label="累计消费">
          <span class="price">¥{{ detail.totalConsume || 0 }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="会员折扣">
          {{ detail.discount ? (detail.discount * 10).toFixed(1) + '折' : '无' }}
        </el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ detail.registerTime }}</el-descriptions-item>
        <el-descriptions-item label="过期时间">{{ detail.expireTime || '永久有效' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { getMemberPage, addMember, updateMemberLevel, getMemberDetail, deleteMember } from '@/api/member'
import { getUserPage } from '@/api/userManage'

const query = reactive({
  pageNum: 1,
  pageSize: 10,
  memberCard: '',
  level: null
})

const list = ref([])
const total = ref(0)
const loading = ref(false)

const addDialogVisible = ref(false)
const levelDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const saveLoading = ref(false)
const detail = ref(null)
const normalUsers = ref([])

const addFormRef = ref()
const levelFormRef = ref()

const addForm = reactive({
  userId: null
})

const levelForm = reactive({
  id: null,
  level: null,
  memberLevel: '',
  discount: null,
  points: null
})

const addRules = {
  userId: [{ required: true, message: '请选择用户', trigger: 'change' }]
}

const levelRules = {
  level: [{ required: true, message: '请选择会员等级', trigger: 'change' }],
  discount: [{ required: true, message: '请输入会员折扣', trigger: 'blur' }]
}

const getLevelType = (level) => {
  const map = { 1: 'info', 2: 'warning', 3: 'success' }
  return map[level] || 'info'
}

const getList = async () => {
  loading.value = true
  try {
    const res = await getMemberPage(query)
    if (res.code === 200) {
      list.value = res.data.records || []
      total.value = res.data.total || 0
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  query.pageNum = 1
  getList()
}

const handleReset = () => {
  query.memberCard = ''
  query.level = null
  query.pageNum = 1
  getList()
}

const showAddDialog = async () => {
  // 加载角色为3的普通用户
  try {
    const res = await getUserPage({ pageNum: 1, pageSize: 1000, roleId: 3 })
    if (res.code === 200) {
      normalUsers.value = res.data.records || []
      addForm.userId = null
      addDialogVisible.value = true
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('加载用户列表失败')
  }
}

const handleAdd = async () => {
  if (!addFormRef.value) return
  try {
    await addFormRef.value.validate()
    saveLoading.value = true
    const res = await addMember(addForm)
    if (res.code === 200) {
      ElMessage.success('添加成功')
      addDialogVisible.value = false
      getList()
    } else {
      ElMessage.error(res.msg || '添加失败')
    }
  } catch (e) {
    console.error(e)
  } finally {
    saveLoading.value = false
  }
}

const showLevelDialog = (row) => {
  Object.assign(levelForm, {
    id: row.id,
    level: row.level,
    memberLevel: row.memberLevel,
    discount: row.discount,
    points: row.points
  })
  levelDialogVisible.value = true
}

const handleLevelChange = (val) => {
  const levelMap = {
    1: { name: '普通会员', discount: 1.0 },
    2: { name: '银卡会员', discount: 0.95 },
    3: { name: '金卡会员', discount: 0.9 }
  }
  levelForm.memberLevel = levelMap[val].name
  levelForm.discount = levelMap[val].discount
  levelForm.points = levelMap[val].points
}

const handleUpdateLevel = async () => {
  if (!levelFormRef.value) return
  try {
    await levelFormRef.value.validate()
    saveLoading.value = true
    const res = await updateMemberLevel(levelForm)
    if (res.code === 200) {
      ElMessage.success('调整成功')
      levelDialogVisible.value = false
      getList()
    } else {
      ElMessage.error(res.msg || '调整失败')
    }
  } catch (e) {
    console.error(e)
  } finally {
    saveLoading.value = false
  }
}

const viewDetail = async (row) => {
  const res = await getMemberDetail(row.id)
  if (res.code === 200) {
    detail.value = res.data
    detailDialogVisible.value = true
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该会员吗？', '提示', { type: 'warning' })
    const res = await deleteMember(row.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      getList()
    }
  } catch {}
}

onMounted(() => {
  getList()
})
</script>

<style scoped>
.members {
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

.filter-bar {
  display: flex;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.price {
  color: #f56c6c;
  font-weight: bold;
}
</style>
