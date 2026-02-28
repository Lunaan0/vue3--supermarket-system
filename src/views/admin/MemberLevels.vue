<template>
  <div class="member-level-container">
    <!-- 搜索区域 -->
    <el-card class="search-card" shadow="hover">
      <el-form :model="queryParams" :inline="true" class="search-form">
        <el-form-item label="等级名称">
          <el-input v-model="queryParams.levelName" placeholder="请输入等级名称" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="等级">
          <el-select v-model="queryParams.level" placeholder="请选择等级" clearable style="width: 150px">
            <el-option label="青铜会员" :value="1" />
            <el-option label="白银会员" :value="2" />
            <el-option label="黄金会员" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 120px">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleQuery">搜索</el-button>
          <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作区域 -->
    <el-card class="table-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="title">会员等级列表</span>
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增等级</el-button>
        </div>
      </template>

      <!-- 数据表格 -->
      <el-table :data="levelList" v-loading="loading" stripe border style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="level" label="等级" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getLevelTagType(row.level)">{{ row.level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="levelName" label="等级名称" width="120" align="center">
          <template #default="{ row }">
            <span :class="'level-name level-' + row.level">{{ row.levelName }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="discount" label="折扣" width="100" align="center">
          <template #default="{ row }">
            <span class="discount-text">{{ (row.discount * 10).toFixed(1) }}折</span>
          </template>
        </el-table-column>
        <el-table-column prop="monthlyPrice" label="月度价格" width="120" align="center">
          <template #default="{ row }">
            <span class="price-text">¥{{ row.monthlyPrice }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="quarterlyPrice" label="季度价格" width="120" align="center">
          <template #default="{ row }">
            <span class="price-text">¥{{ row.quarterlyPrice }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="yearlyPrice" label="年度价格" width="120" align="center">
          <template #default="{ row }">
            <span class="price-text">¥{{ row.yearlyPrice }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="sort" label="排序" width="80" align="center" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          :current-page="queryParams.pageNum"
          :page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="等级数值" prop="level">
          <el-select v-model="form.level" placeholder="请选择等级" :disabled="isEdit" style="width: 100%">
            <el-option label="1 - 青铜" :value="1" />
            <el-option label="2 - 白银" :value="2" />
            <el-option label="3 - 黄金" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="等级名称" prop="levelName">
          <el-input v-model="form.levelName" placeholder="请输入等级名称" />
        </el-form-item>
        <el-form-item label="折扣" prop="discount">
          <el-input-number v-model="form.discount" :min="0.01" :max="1" :step="0.01" :precision="2" style="width: 100%" />
          <span class="form-tip">请输入0-1之间的数字，如0.9表示9折</span>
        </el-form-item>
        <el-form-item label="月度价格" prop="monthlyPrice">
          <el-input-number v-model="form.monthlyPrice" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="季度价格" prop="quarterlyPrice">
          <el-input-number v-model="form.quarterlyPrice" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="年度价格" prop="yearlyPrice">
          <el-input-number v-model="form.yearlyPrice" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="等级描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入等级描述" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import { getMemberLevelPage, addMemberLevel, updateMemberLevel, deleteMemberLevel } from '@/api/memberLevel'

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  levelName: '',
  level: null,
  status: null
})

// 数据列表
const levelList = ref([])
const total = ref(0)
const loading = ref(false)

// 对话框
const dialogVisible = ref(false)
const dialogTitle = computed(() => isEdit.value ? '编辑会员等级' : '新增会员等级')
const isEdit = ref(false)
const submitLoading = ref(false)
const formRef = ref(null)

// 表单数据
const form = reactive({
  id: null,
  level: null,
  levelName: '',
  discount: 1,
  monthlyPrice: null,
  quarterlyPrice: null,
  yearlyPrice: null,
  description: '',
  sort: 0,
  status: 1
})

// 表单校验规则
const rules = {
  level: [{ required: true, message: '请选择等级数值', trigger: 'change' }],
  levelName: [{ required: true, message: '请输入等级名称', trigger: 'blur' }],
  discount: [{ required: true, message: '请输入折扣', trigger: 'blur' }]
}

// 获取等级标签类型
const getLevelTagType = (level) => {
  const types = { 1: 'warning', 2: '', 3: 'success' }
  return types[level] || 'info'
}

// 查询列表
const getList = async () => {
  loading.value = true
  try {
    const res = await getMemberLevelPage(queryParams)
    if (res.code === 200) {
      levelList.value = res.data.records
      total.value = res.data.total
    }
  } finally {
    loading.value = false
  }
}

// 搜索
const handleQuery = () => {
  queryParams.pageNum = 1
  getList()
}

// 重置
const resetQuery = () => {
  queryParams.levelName = ''
  queryParams.level = null
  queryParams.status = null
  handleQuery()
}

// 分页处理
const handleSizeChange = (size) => {
  queryParams.pageSize = size
  getList()
}

const handleCurrentChange = (page) => {
  queryParams.pageNum = page
  getList()
}

// 重置表单
const resetForm = () => {
  form.id = null
  form.level = null
  form.levelName = ''
  form.discount = 1
  form.monthlyPrice = null
  form.quarterlyPrice = null
  form.yearlyPrice = null
  form.description = ''
  form.sort = 0
  form.status = 1
}

// 新增
const handleAdd = () => {
  resetForm()
  isEdit.value = false
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row) => {
  resetForm()
  isEdit.value = true
  Object.assign(form, row)
  dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  await formRef.value.validate()
  submitLoading.value = true
  try {
    if (isEdit.value) {
      await updateMemberLevel(form)
      ElMessage.success('修改成功')
    } else {
      await addMemberLevel(form)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    getList()
  } finally {
    submitLoading.value = false
  }
}

// 删除
const handleDelete = (row) => {
  ElMessageBox.confirm(`确认删除会员等级"${row.levelName}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await deleteMemberLevel(row.id)
    ElMessage.success('删除成功')
    getList()
  }).catch(() => {})
}

onMounted(() => {
  getList()
})
</script>

<style scoped>
.member-level-container {
  padding: 20px;
}

.search-card {
  margin-bottom: 20px;
  border-radius: 12px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.table-card {
  border-radius: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header .title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.level-name {
  font-weight: 600;
}

.level-name.level-1 {
  color: #cd7f32;
}

.level-name.level-2 {
  color: #c0c0c0;
}

.level-name.level-3 {
  color: #ffd700;
}

.price-text {
  color: #f56c6c;
  font-weight: 600;
}

.discount-text {
  color: #67c23a;
  font-weight: 600;
}

.form-tip {
  color: #909399;
  font-size: 12px;
  margin-left: 10px;
}

:deep(.el-card__body) {
  padding: 20px;
}
</style>
