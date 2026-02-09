<template>
  <div class="inventory">
    <div class="page-header">
      <h2>库存管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="showBatchUpdateDialog">
          <el-icon><Edit /></el-icon>
          批量更新
        </el-button>
        <el-button type="success" @click="exportInventory">
          <el-icon><Download /></el-icon>
          导出库存
        </el-button>
      </div>
    </div>
    
    <el-card>
      <div class="filter-bar">
        <el-select v-model="filterCategory" placeholder="选择分类" style="width: 150px; margin-right: 10px;" clearable>
          <el-option v-for="category in categories" :key="category.id" :label="category.name" :value="category.id" />
        </el-select>
        <el-select v-model="stockStatus" placeholder="库存状态" style="width: 150px; margin-right: 10px;" clearable>
          <el-option label="充足" value="sufficient" />
          <el-option label="不足" value="low" />
          <el-option label="缺货" value="out" />
        </el-select>
        <el-input
          v-model="searchText"
          placeholder="搜索商品名称"
          style="width: 200px; margin-right: 10px;"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary">搜索</el-button>
      </div>
      
      <el-table :data="filteredInventory" style="width: 100%; margin-top: 20px;" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="image" label="图片" width="80">
          <template #default="scope">
            <img :src="scope.row.image" :alt="scope.row.name" style="width: 50px; height: 50px; object-fit: cover;">
          </template>
        </el-table-column>
        <el-table-column prop="name" label="商品名称" />
        <el-table-column prop="category" label="分类" />
        <el-table-column prop="currentStock" label="当前库存" width="100">
          <template #default="scope">
            <span :style="{ color: getStockColor(scope.row.currentStock, scope.row.minStock) }">
              {{ scope.row.currentStock }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="minStock" label="最低库存" width="100" />
        <el-table-column prop="maxStock" label="最高库存" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStockStatusType(scope.row.currentStock, scope.row.minStock)">
              {{ getStockStatus(scope.row.currentStock, scope.row.minStock) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button size="small" @click="updateStock(scope.row)">更新库存</el-button>
            <el-button size="small" type="primary" @click="viewHistory(scope.row)">查看记录</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalInventory"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>
    </el-card>
    
    <!-- 更新库存对话框 -->
    <el-dialog title="更新库存" v-model="updateDialogVisible" width="400px">
      <el-form :model="stockForm" :rules="rules" ref="stockFormRef" label-width="100px">
        <el-form-item label="商品名称">
          <span>{{ stockForm.name }}</span>
        </el-form-item>
        <el-form-item label="当前库存">
          <span>{{ stockForm.currentStock }}</span>
        </el-form-item>
        <el-form-item label="更新类型" prop="updateType">
          <el-select v-model="stockForm.updateType" style="width: 100%">
            <el-option label="入库" value="in" />
            <el-option label="出库" value="out" />
            <el-option label="调整" value="adjust" />
          </el-select>
        </el-form-item>
        <el-form-item label="数量" prop="quantity">
          <el-input-number v-model="stockForm.quantity" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="stockForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="updateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmUpdate">确定</el-button>
      </template>
    </el-dialog>
    
    <!-- 批量更新对话框 -->
    <el-dialog title="批量更新库存" v-model="batchDialogVisible" width="500px">
      <el-form :model="batchForm" :rules="batchRules" ref="batchFormRef" label-width="100px">
        <el-form-item label="更新类型" prop="updateType">
          <el-select v-model="batchForm.updateType" style="width: 100%">
            <el-option label="入库" value="in" />
            <el-option label="出库" value="out" />
            <el-option label="调整" value="adjust" />
          </el-select>
        </el-form-item>
        <el-form-item label="数量" prop="quantity">
          <el-input-number v-model="batchForm.quantity" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="batchForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmBatchUpdate">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Edit, Download, Search } from '@element-plus/icons-vue'

const categories = ref([
  { id: 1, name: '水果' },
  { id: 2, name: '乳制品' },
  { id: 3, name: '面包' },
  { id: 4, name: '肉类' },
  { id: 5, name: '海鲜' }
])

const inventory = ref([
  {
    id: 1,
    name: '红富士苹果',
    category: '水果',
    currentStock: 100,
    minStock: 20,
    maxStock: 200,
    image: 'https://via.placeholder.com/50x50/ff6b6b/ffffff?text=Apple'
  },
  {
    id: 2,
    name: '纯牛奶',
    category: '乳制品',
    currentStock: 15,
    minStock: 30,
    maxStock: 100,
    image: 'https://via.placeholder.com/50x50/4ecdc4/ffffff?text=Milk'
  },
  {
    id: 3,
    name: '全麦面包',
    category: '面包',
    currentStock: 0,
    minStock: 10,
    maxStock: 50,
    image: 'https://via.placeholder.com/50x50/45b7d1/ffffff?text=Bread'
  },
  {
    id: 4,
    name: '新鲜鸡蛋',
    category: '蛋类',
    currentStock: 80,
    minStock: 25,
    maxStock: 150,
    image: 'https://via.placeholder.com/50x50/f9ca24/ffffff?text=Eggs'
  }
])

const filterCategory = ref('')
const stockStatus = ref('')
const searchText = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const selectedItems = ref([])

const updateDialogVisible = ref(false)
const batchDialogVisible = ref(false)
const stockFormRef = ref()
const batchFormRef = ref()

const stockForm = reactive({
  id: null,
  name: '',
  currentStock: 0,
  updateType: 'in',
  quantity: 1,
  remark: ''
})

const batchForm = reactive({
  updateType: 'in',
  quantity: 1,
  remark: ''
})

const rules = {
  updateType: [{ required: true, message: '请选择更新类型', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }],
  remark: [{ required: true, message: '请输入备注', trigger: 'blur' }]
}

const batchRules = {
  updateType: [{ required: true, message: '请选择更新类型', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }],
  remark: [{ required: true, message: '请输入备注', trigger: 'blur' }]
}

const filteredInventory = computed(() => {
  let result = inventory.value
  
  if (filterCategory.value) {
    const categoryName = categories.value.find(c => c.id === filterCategory.value)?.name
    result = result.filter(item => item.category === categoryName)
  }
  
  if (stockStatus.value) {
    result = result.filter(item => {
      if (stockStatus.value === 'sufficient') return item.currentStock > item.minStock
      if (stockStatus.value === 'low') return item.currentStock > 0 && item.currentStock <= item.minStock
      if (stockStatus.value === 'out') return item.currentStock === 0
      return true
    })
  }
  
  if (searchText.value) {
    result = result.filter(item => item.name.includes(searchText.value))
  }
  
  return result
})

const totalInventory = computed(() => filteredInventory.value.length)

const getStockStatus = (current, min) => {
  if (current === 0) return '缺货'
  if (current <= min) return '不足'
  return '充足'
}

const getStockStatusType = (current, min) => {
  if (current === 0) return 'danger'
  if (current <= min) return 'warning'
  return 'success'
}

const getStockColor = (current, min) => {
  if (current === 0) return '#f56c6c'
  if (current <= min) return '#e6a23c'
  return '#67c23a'
}

const handleSelectionChange = (selection) => {
  selectedItems.value = selection
}

const updateStock = (row) => {
  Object.assign(stockForm, {
    id: row.id,
    name: row.name,
    currentStock: row.currentStock,
    updateType: 'in',
    quantity: 1,
    remark: ''
  })
  updateDialogVisible.value = true
}

const confirmUpdate = async () => {
  if (!stockFormRef.value) return
  
  try {
    await stockFormRef.value.validate()
    
    const item = inventory.value.find(i => i.id === stockForm.id)
    if (stockForm.updateType === 'in') {
      item.currentStock += stockForm.quantity
    } else if (stockForm.updateType === 'out') {
      item.currentStock = Math.max(0, item.currentStock - stockForm.quantity)
    } else {
      item.currentStock = stockForm.quantity
    }
    
    ElMessage.success('库存更新成功')
    updateDialogVisible.value = false
  } catch (error) {
    console.error('Form validation error:', error)
  }
}

const showBatchUpdateDialog = () => {
  if (selectedItems.value.length === 0) {
    ElMessage.warning('请先选择要更新的商品')
    return
  }
  
  Object.assign(batchForm, {
    updateType: 'in',
    quantity: 1,
    remark: ''
  })
  batchDialogVisible.value = true
}

const confirmBatchUpdate = async () => {
  if (!batchFormRef.value) return
  
  try {
    await batchFormRef.value.validate()
    
    selectedItems.value.forEach(item => {
      const inventoryItem = inventory.value.find(i => i.id === item.id)
      if (batchForm.updateType === 'in') {
        inventoryItem.currentStock += batchForm.quantity
      } else if (batchForm.updateType === 'out') {
        inventoryItem.currentStock = Math.max(0, inventoryItem.currentStock - batchForm.quantity)
      } else {
        inventoryItem.currentStock = batchForm.quantity
      }
    })
    
    ElMessage.success('批量更新成功')
    batchDialogVisible.value = false
  } catch (error) {
    console.error('Form validation error:', error)
  }
}

const viewHistory = (row) => {
  ElMessage.info(`查看 ${row.name} 的库存记录`)
}

const exportInventory = () => {
  ElMessage.success('库存数据导出成功')
}
</script>

<style scoped>
.inventory {
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
  gap: 10px;
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
