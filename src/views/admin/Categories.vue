<template>
  <div class="categories">
    <div class="page-header">
      <h2>商品分类管理</h2>
      <el-button type="primary" @click="showAddDialog">
        <el-icon><Plus /></el-icon>
        添加分类
      </el-button>
    </div>
    
    <el-card>
      <!-- 搜索区域 -->
      <div class="search-area">
        <el-form :inline="true" :model="queryParams" class="search-form">
          <el-form-item label="分类名称">
            <el-input v-model="queryParams.categoryName" placeholder="请输入分类名称" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 120px">
              <el-option label="启用" :value="1" />
              <el-option label="禁用" :value="0" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleQuery">
              <el-icon><Search /></el-icon>
              搜索
            </el-button>
            <el-button @click="resetQuery">
              <el-icon><Refresh /></el-icon>
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 表格区域 - 树形结构展示 -->
      <el-table 
        :data="categories" 
        style="width: 100%" 
        row-key="id" 
        v-loading="loading" 
        border
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      >
        <el-table-column label="序号" width="80">
          <template #default="scope">
            {{ getRowIndex(scope.row) }}
          </template>
        </el-table-column>
        <el-table-column prop="categoryName" label="分类名称" min-width="150" />
        <el-table-column prop="level" label="层级" width="80">
          <template #default="scope">
            <el-tag :type="getLevelTagType(scope.row.level)" size="small">
              {{ scope.row.level }}级
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="childrenCount" label="子分类数" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
              {{ scope.row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" link @click="showChildrenDialog(scope.row)">
              <el-icon><FolderOpened /></el-icon>
              子分类
            </el-button>
            <el-button size="small" type="primary" link @click="editCategory(scope.row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button size="small" type="danger" link @click="handleDelete(scope.row)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-area">
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
    
    <!-- 添加/编辑对话框 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="500px" @close="resetForm">
      <el-form :model="categoryForm" :rules="rules" ref="categoryFormRef" label-width="100px">
        <el-form-item label="分类名称" prop="categoryName">
          <el-input v-model="categoryForm.categoryName" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="父级分类" prop="parentId">
          <el-cascader
            v-model="categoryForm.parentIdPath"
            :options="categoryTreeOptionsForForm"
            :props="{ checkStrictly: true, value: 'id', label: 'categoryName', children: 'children', emitPath: false }"
            placeholder="请选择父级分类（不选则为顶级分类）"
            clearable
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="categoryForm.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCategory" :loading="saveLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 子分类对话框 -->
    <el-dialog :title="childrenDialogTitle" v-model="childrenDialogVisible" width="800px">
      <el-table :data="childrenList" style="width: 100%" v-loading="childrenLoading" border>
        <el-table-column type="index" label="序号" width="80" />
        <el-table-column prop="categoryName" label="分类名称" min-width="150" />
        <el-table-column prop="childrenCount" label="子分类数" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
              {{ scope.row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button size="small" type="primary" link @click="editCategory(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" link @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button type="primary" @click="showAddDialogWithParent(currentParentId)">
          <el-icon><Plus /></el-icon>
          添加子分类
        </el-button>
        <el-button @click="childrenDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, Edit, Delete, FolderOpened } from '@element-plus/icons-vue'
import { getCategoryTree, getCategoryPage, addCategory, updateCategory, deleteCategory as deleteCategoryApi, getChildrenByParentId } from '@/api/category'

// 列表数据
const categories = ref([])
const total = ref(0)
const loading = ref(false)
const saveLoading = ref(false)

// 分类树选项
const categoryTreeOptionsForForm = ref([])

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  categoryName: '',
  status: null
})

// 对话框相关
const dialogVisible = ref(false)
const dialogTitle = ref('添加分类')
const categoryFormRef = ref()
const isEdit = ref(false)

// 表单数据
const categoryForm = reactive({
  id: null,
  categoryName: '',
  parentId: 0,
  parentIdPath: null,
  status: 1
})

// 表单验证规则
const rules = {
  categoryName: [{ required: true, message: '请输入分类名称', trigger: 'blur' }]
}

// 子分类对话框
const childrenDialogVisible = ref(false)
const childrenDialogTitle = ref('')
const childrenList = ref([])
const childrenLoading = ref(false)
const currentParentId = ref(null)

// 初始化
onMounted(() => {
  getList()
  loadCategoryTree()
})

// 获取分类列表
const getList = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: queryParams.pageNum,
      pageSize: queryParams.pageSize,
      categoryName: queryParams.categoryName || null,
      status: queryParams.status
    }
    const res = await getCategoryPage(params)
    if (res.code === 200) {
      categories.value = res.data.records || []
      total.value = res.data.total || 0
    } else {
      ElMessage.error(res.msg || '获取分类列表失败')
    }
  } catch (error) {
    console.error('获取分类列表失败:', error)
    ElMessage.error('获取分类列表失败')
  } finally {
    loading.value = false
  }
}

// 加载分类树
const loadCategoryTree = async () => {
  try {
    const res = await getCategoryTree()
    if (res.code === 200) {
      // 添加"顶级分类"选项用于表单
      categoryTreeOptionsForForm.value = [
        { id: 0, categoryName: '顶级分类', children: res.data || [] }
      ]
    }
  } catch (error) {
    console.error('获取分类树失败:', error)
  }
}

// 搜索
const handleQuery = () => {
  queryParams.pageNum = 1
  getList()
}

// 重置查询
const resetQuery = () => {
  queryParams.pageNum = 1
  queryParams.pageSize = 10
  queryParams.categoryName = ''
  queryParams.status = null
  getList()
}

// 分页大小变化
const handleSizeChange = (size) => {
  queryParams.pageSize = size
  getList()
}

// 当前页变化
const handleCurrentChange = (page) => {
  queryParams.pageNum = page
  getList()
}

// 显示添加对话框
const showAddDialog = () => {
  dialogTitle.value = '添加分类'
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

// 显示添加子分类对话框
const showAddDialogWithParent = (parentId) => {
  dialogTitle.value = '添加子分类'
  isEdit.value = false
  resetForm()
  categoryForm.parentId = parentId
  categoryForm.parentIdPath = parentId
  dialogVisible.value = true
}

// 编辑分类
const editCategory = (row) => {
  dialogTitle.value = '编辑分类'
  isEdit.value = true
  Object.assign(categoryForm, {
    id: row.id,
    categoryName: row.categoryName,
    parentId: row.parentId,
    parentIdPath: row.parentId,
    status: row.status
  })
  dialogVisible.value = true
}

// 保存分类
const saveCategory = async () => {
  if (!categoryFormRef.value) return
  
  try {
    await categoryFormRef.value.validate()
    saveLoading.value = true
    
    const data = {
      categoryName: categoryForm.categoryName,
      parentId: categoryForm.parentIdPath || 0,
      status: categoryForm.status
    }
    
    let res
    if (isEdit.value) {
      data.id = categoryForm.id
      res = await updateCategory(data)
    } else {
      res = await addCategory(data)
    }
    
    if (res.code === 200) {
      ElMessage.success(isEdit.value ? '分类更新成功' : '分类添加成功')
      dialogVisible.value = false
      getList()
      loadCategoryTree()
      // 如果子分类对话框打开，也刷新子分类列表
      if (childrenDialogVisible.value && currentParentId.value) {
        loadChildren(currentParentId.value)
      }
    } else {
      ElMessage.error(res.msg || (isEdit.value ? '分类更新失败' : '分类添加失败'))
    }
  } catch (error) {
    console.error('保存分类失败:', error)
  } finally {
    saveLoading.value = false
  }
}

// 删除分类
const handleDelete = (row) => {
  if (row.hasChildren || (row.childrenCount && row.childrenCount > 0)) {
    ElMessage.warning('该分类下还有子分类，不能删除')
    return
  }
  
  ElMessageBox.confirm('确定要删除该分类吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await deleteCategoryApi(row.id)
      if (res.code === 200) {
        ElMessage.success('删除成功')
        getList()
        loadCategoryTree()
        // 如果子分类对话框打开，也刷新子分类列表
        if (childrenDialogVisible.value && currentParentId.value) {
          loadChildren(currentParentId.value)
        }
      } else {
        ElMessage.error(res.msg || '删除失败')
      }
    } catch (error) {
      console.error('删除分类失败:', error)
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

// 显示子分类对话框
const showChildrenDialog = async (row) => {
  childrenDialogTitle.value = `${row.categoryName} - 子分类列表`
  currentParentId.value = row.id
  childrenDialogVisible.value = true
  await loadChildren(row.id)
}

// 加载子分类列表
const loadChildren = async (parentId) => {
  childrenLoading.value = true
  try {
    const res = await getChildrenByParentId(parentId)
    if (res.code === 200) {
      childrenList.value = res.data || []
    } else {
      ElMessage.error(res.msg || '获取子分类列表失败')
    }
  } catch (error) {
    console.error('获取子分类列表失败:', error)
    ElMessage.error('获取子分类列表失败')
  } finally {
    childrenLoading.value = false
  }
}

// 重置表单
const resetForm = () => {
  Object.assign(categoryForm, {
    id: null,
    categoryName: '',
    parentId: 0,
    parentIdPath: null,
    status: 1
  })
  if (categoryFormRef.value) {
    categoryFormRef.value.resetFields()
  }
}

// 获取层级标签类型
const getLevelTagType = (level) => {
  const types = ['', 'primary', 'success', 'warning', 'danger', 'info']
  return types[level] || 'info'
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  const second = String(d.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

// 计算树形表格的行序号（每层独立编号）
const getRowIndex = (row) => {
  // 如果是顶级分类（parentId 为 0 或 null）
  if (!row.parentId || row.parentId === 0) {
    const index = categories.value.findIndex(item => item.id === row.id)
    return index !== -1 ? index + 1 : ''
  }
  
  // 如果是子分类，在其父分类的 children 中查找索引
  const findIndexInChildren = (list, targetId, parentId) => {
    for (const item of list) {
      if (item.id === parentId && item.children) {
        const childIndex = item.children.findIndex(child => child.id === targetId)
        if (childIndex !== -1) {
          return childIndex + 1
        }
      }
      if (item.children && item.children.length > 0) {
        const result = findIndexInChildren(item.children, targetId, parentId)
        if (result !== -1) {
          return result
        }
      }
    }
    return -1
  }
  
  const result = findIndexInChildren(categories.value, row.id, row.parentId)
  return result !== -1 ? result : ''
}
</script>

<style scoped>
.categories {
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

.search-area {
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.search-form .el-form-item {
  margin-bottom: 0;
}

.pagination-area {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

:deep(.el-table) {
  font-size: 14px;
}

:deep(.el-table .el-button) {
  padding: 4px 8px;
}
</style>
