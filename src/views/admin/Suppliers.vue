<template>
  <div class="suppliers">
    <div class="page-header">
      <h2>供应商管理</h2>
    </div>
    
    <el-card>
      <!-- 搜索栏和添加按钮 -->
      <div class="toolbar">
        <div class="search-bar">
          <el-input
            v-model="queryParams.supplierName"
            placeholder="供应商名称"
            style="width: 180px;"
            clearable
            @keyup.enter="handleSearch"
          />
          <el-input
            v-model="queryParams.contactPerson"
            placeholder="联系人"
            style="width: 150px;"
            clearable
            @keyup.enter="handleSearch"
          />
          <el-input
            v-model="queryParams.phone"
            placeholder="联系电话"
            style="width: 150px;"
            clearable
            @keyup.enter="handleSearch"
          />
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetSearch">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </div>
        <div class="action-bar">
          <el-button type="primary" @click="showAddDialog">
            <el-icon><Plus /></el-icon>
            添加供应商
          </el-button>
        </div>
      </div>

      <el-table :data="suppliers" style="width: 100%; margin-top: 15px;" v-loading="loading" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="序号" type="index" align="center" width="60" />
        <el-table-column prop="supplierName" label="供应商名称" min-width="150" />
        <el-table-column prop="contactPerson" label="联系人" width="100" />
        <el-table-column prop="phone" label="联系电话" width="130" />
        <el-table-column prop="email" label="邮箱" width="200" show-overflow-tooltip/>
        <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
        <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.status === 0 ? 'danger' : 'success'">
              {{ scope.row.status === 0 ? '停用' : '正常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button size="small" link type="primary" @click="editSupplier(scope.row)">编辑</el-button>
            <el-button size="small" link type="danger" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 添加/编辑对话框 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="550px">
      <el-form :model="supplierForm" :rules="rules" ref="supplierFormRef" label-width="100px">
        <el-form-item label="供应商名称" prop="supplierName">
          <el-input v-model="supplierForm.supplierName" placeholder="请输入供应商名称" />
        </el-form-item>
        <el-form-item label="联系人" prop="contactPerson">
          <el-input v-model="supplierForm.contactPerson" placeholder="请输入联系人" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="supplierForm.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="supplierForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="supplierForm.address" type="textarea" :rows="2" placeholder="请输入地址" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="supplierForm.remark" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="supplierForm.status" style="width: 100%">
            <el-option label="正常" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveSupplier" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh } from '@element-plus/icons-vue'
import { getSupplierList, addSupplier, updateSupplier, deleteSupplier } from '@/api/supplier'

// 加载状态
const loading = ref(false)
const submitLoading = ref(false)

// 供应商列表
const suppliers = ref([])
const total = ref(0)
const selectedRows = ref([]) // 选中的行

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  supplierName: '',
  contactPerson: '',
  phone: ''
})

// 对话框相关
const dialogVisible = ref(false)
const dialogTitle = ref('添加供应商')
const supplierFormRef = ref()
const isEdit = ref(false)

// 表单数据
const supplierForm = reactive({
  id: null,
  supplierName: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  remark: '',
  status: 1  // 默认正常状态
})

// 表单验证规则
const rules = {
  supplierName: [{ required: true, message: '请输入供应商名称', trigger: 'blur' }],
  contactPerson: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}

// 获取供应商列表
const fetchSupplierList = async () => {
  loading.value = true
  try {
    const res = await getSupplierList(queryParams)
    if (res.code === 200) {
      suppliers.value = res.data.records || []
      total.value = res.data.total || 0
    }
  } catch (error) {
    console.error('获取供应商列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  queryParams.pageNum = 1
  fetchSupplierList()
}

// 重置搜索
const resetSearch = () => {
  queryParams.pageNum = 1
  queryParams.supplierName = ''
  queryParams.contactPerson = ''
  queryParams.phone = ''
  fetchSupplierList()
}

// 表格选择变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 分页大小改变
const handleSizeChange = (size) => {
  queryParams.pageSize = size
  queryParams.pageNum = 1
  fetchSupplierList()
}

// 页码改变
const handleCurrentChange = (page) => {
  queryParams.pageNum = page
  fetchSupplierList()
}

// 显示添加对话框
const showAddDialog = () => {
  dialogTitle.value = '添加供应商'
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

// 编辑供应商
const editSupplier = (row) => {
  dialogTitle.value = '编辑供应商'
  isEdit.value = true
  Object.assign(supplierForm, {
    id: row.id,
    supplierName: row.supplierName,
    contactPerson: row.contactPerson,
    phone: row.phone,
    email: row.email || '',
    address: row.address || '',
    remark: row.remark || '',
    status: row.status ?? 1  // 默认为1（正常）
  })
  dialogVisible.value = true
}

// 保存供应商
const saveSupplier = async () => {
  if (!supplierFormRef.value) return
  
  try {
    await supplierFormRef.value.validate()
    submitLoading.value = true
    
    const submitData = {
      supplierName: supplierForm.supplierName,
      contactPerson: supplierForm.contactPerson,
      phone: supplierForm.phone,
      email: supplierForm.email,
      address: supplierForm.address,
      remark: supplierForm.remark,
      status: supplierForm.status
    }
    
    if (isEdit.value) {
      submitData.id = supplierForm.id
      const res = await updateSupplier(submitData)
      if (res.code === 200) {
        ElMessage.success('供应商更新成功')
        dialogVisible.value = false
        fetchSupplierList()
      }
    } else {
      const res = await addSupplier(submitData)
      if (res.code === 200) {
        ElMessage.success('供应商添加成功')
        dialogVisible.value = false
        fetchSupplierList()
      }
    }
  } catch (error) {
    console.error('保存供应商失败:', error)
  } finally {
    submitLoading.value = false
  }
}

// 删除供应商
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除供应商"${row.supplierName}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await deleteSupplier(row.id)
      if (res.code === 200) {
        ElMessage.success('删除成功')
        fetchSupplierList()
      }
    } catch (error) {
      console.error('删除供应商失败:', error)
    }
  }).catch(() => {})
}

// 重置表单
const resetForm = () => {
  Object.assign(supplierForm, {
    id: null,
    supplierName: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    remark: '',
    status: 1  // 默认正常状态
  })
  if (supplierFormRef.value) {
    supplierFormRef.value.resetFields()
  }
}

// 页面加载时获取数据
onMounted(() => {
  fetchSupplierList()
})
</script>

<style scoped>
.suppliers {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #333;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.search-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.action-bar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
