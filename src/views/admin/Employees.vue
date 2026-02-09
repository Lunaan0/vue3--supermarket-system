<template>
  <div class="employees">
    <div class="page-header">
      <h2>员工管理</h2>
      <el-button type="primary" @click="showAddDialog">
        <el-icon><Plus /></el-icon>
        添加员工
      </el-button>
    </div>

    <el-card>
      <div class="filter-bar">
        <el-input v-model="query.username" placeholder="用户名" style="width: 160px; margin-right: 10px;" clearable />
        <el-input v-model="query.realName" placeholder="真实姓名" style="width: 160px; margin-right: 10px;" clearable />
        <el-input v-model="query.phone" placeholder="手机号" style="width: 160px; margin-right: 10px;" clearable />
        <el-select v-model="query.status" placeholder="状态" style="width: 120px; margin-right: 10px;" clearable>
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
        <el-button type="primary" @click="handleSearch"><el-icon><Search /></el-icon>搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <el-table :data="list" style="width: 100%; margin-top: 20px;" v-loading="loading">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="username" label="用户名" min-width="140" />
        <el-table-column prop="realName" label="真实姓名" min-width="140" />
        <el-table-column prop="phone" label="手机号" min-width="140" />
        <el-table-column prop="roleName" label="角色" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">{{ scope.row.status === 1 ? '启用' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="viewDetail(scope.row)">详情</el-button>
            <el-button link type="primary" size="small" @click="showEditDialog(scope.row)">编辑</el-button>
            <el-button link type="warning" size="small" @click="showPasswordDialog(scope.row)">修改密码</el-button>
            <el-button link :type="scope.row.status === 1 ? 'warning' : 'success'" size="small" @click="toggleStatus(scope.row)">
              {{ scope.row.status === 1 ? '禁用' : '启用' }}
            </el-button>
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

    <!-- 添加/编辑对话框 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="form.realName" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item v-if="!isEdit" label="密码" prop="password">
          <el-input v-model="form.password" type="password" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saveLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog title="员工详情" v-model="detailDialogVisible" width="600px">
      <el-descriptions :column="2" border v-if="detail">
        <el-descriptions-item label="用户ID">{{ detail.id }}</el-descriptions-item>
        <el-descriptions-item label="用户名">{{ detail.username }}</el-descriptions-item>
        <el-descriptions-item label="真实姓名">{{ detail.realName }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ detail.phone }}</el-descriptions-item>
        <el-descriptions-item label="角色">{{ detail.roleName }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="detail.status === 1 ? 'success' : 'danger'">{{ detail.status === 1 ? '启用' : '禁用' }}</el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 修改密码对话框 -->
    <el-dialog title="修改密码" v-model="passwordDialogVisible" width="500px">
      <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="100px">
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handlePasswordSave" :loading="saveLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { getUserPage, createUser, updateUser, deleteUser, getUserDetail, updateUserStatus, updateUserPassword } from '@/api/userManage'

// 查询参数，固定 roleId=2（员工）
const query = reactive({
  pageNum: 1,
  pageSize: 10,
  username: '',
  realName: '',
  phone: '',
  status: null,
  roleId: 2
})

const list = ref([])
const total = ref(0)
const loading = ref(false)

const dialogVisible = ref(false)
const dialogTitle = ref('添加员工')
const formRef = ref()
const isEdit = ref(false)
const saveLoading = ref(false)

const detailDialogVisible = ref(false)
const detail = ref(null)

const passwordDialogVisible = ref(false)
const passwordFormRef = ref()
const passwordForm = reactive({
  userId: null,
  newPassword: '',
  confirmPassword: ''
})

const validatePass2 = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入密码不一致!'))
  } else {
    callback()
  }
}

const passwordRules = {
  newPassword: [{ required: true, message: '请输入新密码', trigger: 'blur' }],
  confirmPassword: [{ required: true, validator: validatePass2, trigger: 'blur' }]
}

const form = reactive({
  id: null,
  username: '',
  password: '',
  realName: '',
  phone: '',
  status: 1,
  roleId: 2
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  ...(isEdit.value ? {} : { password: [{ required: true, message: '请输入密码', trigger: 'blur' }] })
}

const getList = async () => {
  loading.value = true
  try {
    const res = await getUserPage(query)
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
  query.username = ''
  query.realName = ''
  query.phone = ''
  query.status = null
  query.pageNum = 1
  getList()
}

const showAddDialog = () => {
  dialogTitle.value = '添加员工'
  isEdit.value = false
  Object.assign(form, { id: null, username: '', password: '', realName: '', phone: '', status: 1, roleId: 2 })
  dialogVisible.value = true
}

const showEditDialog = (row) => {
  dialogTitle.value = '编辑员工'
  isEdit.value = true
  Object.assign(form, { id: row.id, username: row.username, password: '', realName: row.realName, phone: row.phone, status: row.status, roleId: 2 })
  dialogVisible.value = true
}

const handleSave = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    saveLoading.value = true
    const api = isEdit.value ? updateUser : createUser
    const res = await api(form)
    if (res.code === 200) {
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
      dialogVisible.value = false
      getList()
    } else {
      ElMessage.error(res.msg || '保存失败')
    }
  } catch (e) {
    console.error(e)
  } finally {
    saveLoading.value = false
  }
}

const viewDetail = async (row) => {
  const res = await getUserDetail(row.id)
  if (res.code === 200) {
    detail.value = res.data
    detailDialogVisible.value = true
  }
}

const toggleStatus = async (row) => {
  const newStatus = row.status === 1 ? 0 : 1
  const text = newStatus === 1 ? '启用' : '禁用'
  try {
    await ElMessageBox.confirm(`确定要${text}该员工吗？`, '提示', { type: 'warning' })
    const res = await updateUserStatus(row.id, newStatus)
    if (res.code === 200) {
      ElMessage.success(`${text}成功`)
      getList()
    }
  } catch {}
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该员工吗？', '提示', { type: 'warning' })
    const res = await deleteUser(row.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      getList()
    }
  } catch {}
}

const showPasswordDialog = (row) => {
  passwordForm.userId = row.id
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  passwordDialogVisible.value = true
}

const handlePasswordSave = async () => {
  if (!passwordFormRef.value) return
  try {
    await passwordFormRef.value.validate()
    saveLoading.value = true
    const res = await updateUserPassword(passwordForm.userId, passwordForm.newPassword)
    if (res.code === 200) {
      ElMessage.success('密码修改成功')
      passwordDialogVisible.value = false
    } else {
      ElMessage.error(res.msg || '密码修改失败')
    }
  } catch (e) {
    console.error(e)
  } finally {
    saveLoading.value = false
  }
}

onMounted(() => {
  getList()
})
</script>

<style scoped>
.employees {
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
</style>
