<template>
  <div class="purchase-suggestion">
    <div class="page-header">
      <h2>
        <el-icon><DocumentChecked /></el-icon>
        采购建议管理
      </h2>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增采购建议
      </el-button>
    </div>

    <!-- 搜索区域 -->
    <el-card class="search-card">
      <el-form :model="queryParams" inline>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="待审核" :value="0" />
            <el-option label="已采纳" :value="1" />
            <el-option label="已驳回" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="商品名称">
          <el-input v-model="queryParams.productName" placeholder="请输入商品名称" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetQuery">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="table-card">
      <el-table :data="tableData" v-loading="loading" stripe border>
        <el-table-column type="index" label="ID" width="80" />
        <el-table-column prop="productName" label="商品名称" min-width="150" />
        <el-table-column prop="currentStock" label="当前库存" width="100" />
        <el-table-column prop="suggestQuantity" label="建议采购量" width="110" />
        <el-table-column prop="urgency" label="紧急程度" width="100">
          <template #default="{ row }">
            <el-tag :type="getUrgencyType(row.urgency)">
              {{ getUrgencyText(row.urgency) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="采购原因" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="creatorName" label="提交人" width="100" />
        <el-table-column prop="createTime" label="提交时间" width="170">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="auditorName" label="审核人" width="100" />
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">
              查看
            </el-button>
            <template v-if="row.status === 0">
              <el-button type="success" link size="small" @click="handleAudit(row, 1)" v-if="isAdmin">
                采纳
              </el-button>
              <el-button type="danger" link size="small" @click="handleAudit(row, 2)" v-if="isAdmin">
                驳回
              </el-button>
              <el-button type="warning" link size="small" @click="handleEdit(row)">
                编辑
              </el-button>
            </template>
            <el-button type="danger" link size="small" @click="handleDelete(row)" v-if="isAdmin">
              删除
            </el-button>
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
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="商品" prop="productId">
          <el-select
            v-model="formData.productId"
            filterable
            remote
            :remote-method="searchProducts"
            :loading="productLoading"
            placeholder="请选择或搜索商品"
            style="width: 100%"
            @change="handleProductChange"
            @focus="loadInitialProducts"
          >
            <el-option
              v-for="item in productOptions"
              :key="item.id"
              :label="`${item.productName} (库存: ${item.stock})`"
              :value="item.id"
            >
              <div style="display: flex; justify-content: space-between; width: 100%">
                <span>{{ item.productName }}</span>
                <span style="color: #8492a6; font-size: 12px">库存: {{ item.stock }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="当前库存">
          <el-input v-model="formData.currentStock" disabled />
        </el-form-item>
        <el-form-item label="推荐供应商" prop="supplierId">
          <el-select
            v-model="formData.supplierId"
            filterable
            clearable
            remote
            :remote-method="searchSuppliers"
            :loading="supplierLoading"
            placeholder="选择或搜索供应商"
            style="width: 100%"
          >
            <el-option
              v-for="item in supplierOptions"
              :key="item.id"
              :label="item.supplierName"
              :value="item.id"
            >
              <div style="display: flex; justify-content: space-between; width: 100%">
                <span>{{ item.supplierName }}</span>
                <span style="color: #8492a6; font-size: 12px">{{ item.contactPerson }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="建议采购量" prop="suggestQuantity">
          <el-input-number v-model="formData.suggestQuantity" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="紧急程度" prop="urgency">
          <el-select v-model="formData.urgency" style="width: 100%">
            <el-option label="一般" :value="0" />
            <el-option label="紧急" :value="1" />
            <el-option label="非常紧急" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="采购原因" prop="reason">
          <el-input
            v-model="formData.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入采购原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" title="采购建议详情" width="600px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="商品名称">{{ detailData.productName }}</el-descriptions-item>
        <el-descriptions-item label="商品编码">{{ detailData.productCode }}</el-descriptions-item>
        <el-descriptions-item label="当前库存">{{ detailData.currentStock }}</el-descriptions-item>
        <el-descriptions-item label="建议采购量">{{ detailData.suggestQuantity }}</el-descriptions-item>
        <el-descriptions-item label="紧急程度">
          <el-tag :type="getUrgencyType(detailData.urgency)">
            {{ getUrgencyText(detailData.urgency) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(detailData.status)">
            {{ getStatusText(detailData.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="采购原因" :span="2">{{ detailData.reason }}</el-descriptions-item>
        <el-descriptions-item label="提交人">{{ detailData.creatorName }}</el-descriptions-item>
        <el-descriptions-item label="提交时间">{{ formatTime(detailData.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="审核人" v-if="detailData.auditorName">{{ detailData.auditorName }}</el-descriptions-item>
        <el-descriptions-item label="审核时间" v-if="detailData.auditTime">{{ formatTime(detailData.auditTime) }}</el-descriptions-item>
        <el-descriptions-item label="审核备注" :span="2" v-if="detailData.auditRemark">{{ detailData.auditRemark }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 审核对话框 -->
    <el-dialog v-model="auditVisible" :title="auditStatus === 1 ? '采纳采购建议' : '驳回采购建议'" width="500px">
      <el-form :model="auditForm" label-width="100px">
        <el-form-item label="实际采购数量" v-if="auditStatus === 1">
          <el-input-number 
            v-model="auditForm.actualQuantity" 
            :min="1" 
            style="width: 100%"
            :placeholder="`建议数量: ${auditForm.suggestQuantity}`"
          />
          <div style="margin-top: 8px; color: #909399; font-size: 12px">
            建议采购数量: {{ auditForm.suggestQuantity }}
          </div>
        </el-form-item>
        <el-form-item label="审核备注">
          <el-input
            v-model="auditForm.remark"
            type="textarea"
            :rows="3"
            :placeholder="auditStatus === 1 ? '请输入采纳理由（可选）' : '请输入驳回理由'"
          />
        </el-form-item>
        <el-form-item label="执行补货" v-if="auditStatus === 1">
          <el-switch v-model="auditForm.executeRestock" />
          <span style="margin-left: 10px; color: #909399; font-size: 12px">
            开启后将自动增加商品库存
          </span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditVisible = false">取消</el-button>
        <el-button :type="auditStatus === 1 ? 'success' : 'danger'" @click="submitAudit" :loading="auditLoading">
          {{ auditStatus === 1 ? '确认采纳' : '确认驳回' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { DocumentChecked, Plus, Search, Refresh } from '@element-plus/icons-vue'
import {
  getPurchaseSuggestionPage,
  getPurchaseSuggestionDetail,
  addPurchaseSuggestion,
  updatePurchaseSuggestion,
  deletePurchaseSuggestion,
  auditPurchaseSuggestion,
  adoptPurchaseSuggestion
} from '@/api/purchaseSuggestion'
import { getProductPage } from '@/api/product'
import { getSupplierList } from '@/api/supplier'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const isAdmin = computed(() => {
  const codes = authStore.permissionCodes || []
  return codes.includes('ALL')
})

const loading = ref(false)
const tableData = ref([])
const total = ref(0)

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  status: null,
  productName: ''
})

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const res = await getPurchaseSuggestionPage(queryParams)
    if (res.code === 200) {
      tableData.value = res.data.records || []
      total.value = res.data.total || 0
    }
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  queryParams.pageNum = 1
  loadData()
}

// 重置
const resetQuery = () => {
  queryParams.status = null
  queryParams.productName = ''
  queryParams.pageNum = 1
  loadData()
}

// 分页
const handleSizeChange = (val) => {
  queryParams.pageSize = val
  loadData()
}

const handleCurrentChange = (val) => {
  queryParams.pageNum = val
  loadData()
}

// 状态相关
const getStatusType = (status) => {
  const map = { 0: 'warning', 1: 'success', 2: 'danger' }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = { 0: '待审核', 1: '已采纳', 2: '已驳回' }
  return map[status] || '未知'
}

// 紧急程度
const getUrgencyType = (urgency) => {
  const map = { 0: 'info', 1: 'warning', 2: 'danger' }
  return map[urgency] || 'info'
}

const getUrgencyText = (urgency) => {
  const map = { 0: '一般', 1: '紧急', 2: '非常紧急' }
  return map[urgency] || '未知'
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

// 新增/编辑
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref(null)
const submitLoading = ref(false)
const productOptions = ref([])
const productLoading = ref(false)
const supplierOptions = ref([])
const supplierLoading = ref(false)

const formData = reactive({
  id: null,
  productId: null,
  supplierId: null,
  currentStock: 0,
  suggestQuantity: 1,
  urgency: 0,
  reason: ''
})

const formRules = {
  productId: [{ required: true, message: '请选择商品', trigger: 'change' }],
  // supplierId: [{ required: true, message: '请选择供应商', trigger: 'change' }],
  suggestQuantity: [{ required: true, message: '请输入建议采购量', trigger: 'blur' }],
  urgency: [{ required: true, message: '请选择紧急程度', trigger: 'change' }],
  reason: [{ required: true, message: '请输入采购原因', trigger: 'blur' }]
}

// 搜索商品
const searchProducts = async (query) => {
  productLoading.value = true
  try {
    const res = await getProductPage({ 
      productName: query || '', 
      pageNum: 1, 
      pageSize: 50,
      status: 1  // 只显示上架商品
    })
    if (res.code === 200) {
      productOptions.value = res.data.records || []
    }
  } catch (error) {
    console.error('搜索商品失败:', error)
  } finally {
    productLoading.value = false
  }
}

// 初始化加载商品列表
const loadInitialProducts = async () => {
  if (productOptions.value.length === 0) {
    await searchProducts('')
  }
}

// 搜索供应商
const searchSuppliers = async (query) => {
  supplierLoading.value = true
  try {
    const res = await getSupplierList({ 
      supplierName: query || '', 
      pageNum: 1, 
      pageSize: 50
    })
    if (res.code === 200) {
      supplierOptions.value = res.data.records || []
    }
  } catch (error) {
    console.error('搜索供应商失败:', error)
  } finally {
    supplierLoading.value = false
  }
}

// 选择商品
const handleProductChange = (productId) => {
  const product = productOptions.value.find(p => p.id === productId)
  if (product) {
    formData.currentStock = product.stock || 0
    // 自动设置默认供应商
    if (product.supplierId) {
      formData.supplierId = product.supplierId
      // 加载默认供应商到选项中
      const existingSupplier = supplierOptions.value.find(s => s.id === product.supplierId)
      if (!existingSupplier && product.supplierName) {
        supplierOptions.value.unshift({
          id: product.supplierId,
          supplierName: product.supplierName,
          contactPerson: ''
        })
      }
    } else {
      formData.supplierId = null
    }
  }
}

// 新增
const handleAdd = () => {
  dialogTitle.value = '新增采购建议'
  Object.assign(formData, {
    id: null,
    productId: null,
    supplierId: null,
    currentStock: 0,
    suggestQuantity: 1,
    urgency: 0,
    reason: ''
  })
  productOptions.value = []
  supplierOptions.value = []
  dialogVisible.value = true
}

// 编辑
const handleEdit = async (row) => {
  dialogTitle.value = '编辑采购建议'
  try {
    const res = await getPurchaseSuggestionDetail(row.id)
    if (res.code === 200) {
      const data = res.data
      Object.assign(formData, {
        id: data.id,
        productId: data.productId,
        supplierId: data.supplierId,
        currentStock: data.currentStock,
        suggestQuantity: data.suggestQuantity,
        urgency: data.urgency,
        reason: data.reason
      })
      // 加载商品选项
      productOptions.value = [{ id: data.productId, productName: data.productName, stock: data.currentStock, supplierId: data.supplierId, supplierName: data.supplierName }]
      // 加载供应商选项 - 包含当前供应商
      if (data.supplierId) {
        supplierOptions.value = [{
          id: data.supplierId,
          supplierName: data.supplierName,
          contactPerson: ''
        }]
      } else {
        supplierOptions.value = []
      }
      dialogVisible.value = true
    }
  } catch (error) {
    ElMessage.error('获取详情失败')
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate();
  if (!valid) return;
    submitLoading.value = true;
    try {
      if (formData.id) {
        await updatePurchaseSuggestion(formData)
        ElMessage.success('更新成功')
      } else {
        await addPurchaseSuggestion(formData)
        ElMessage.success('添加成功')
      }
      dialogVisible.value = false
      loadData()
    } catch (error) {
      // 显示详细的错误信息
      console.error('提交失败:', error)
      // const errorMsg = error.response?.data?.msg || error.msg || '操作失败'
      // console.error('提交失败:', error.response )
      // console.error('错误信息:', errorMsg)
      // ElMessage.error(res.data.msg || '操作失败')
    } finally {
      submitLoading.value = false
    }
  
}

// 查看详情
const detailVisible = ref(false)
const detailData = ref({})

const handleView = async (row) => {
  try {
    const res = await getPurchaseSuggestionDetail(row.id)
    if (res.code === 200) {
      detailData.value = res.data
      detailVisible.value = true
    }
  } catch (error) {
    ElMessage.error('获取详情失败')
  }
}

// 删除
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除这条采购建议吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deletePurchaseSuggestion(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 审核
const auditVisible = ref(false)
const auditLoading = ref(false)
const auditStatus = ref(0)
const auditId = ref(null)
const auditForm = reactive({
  remark: '',
  executeRestock: false,
  suggestQuantity: 0,
  actualQuantity: 0
})

const handleAudit = (row, status) => {
  auditId.value = row.id
  auditStatus.value = status
  auditForm.remark = ''
  auditForm.executeRestock = status === 1
  auditForm.suggestQuantity = row.suggestQuantity
  auditForm.actualQuantity = row.suggestQuantity  // 默认与建议采购数量相同
  auditVisible.value = true
}

const submitAudit = async () => {
  auditLoading.value = true
  try {
    if (auditStatus.value === 1 && auditForm.executeRestock) {
      // 采纳并执行补货，传送实际采购数量
      await adoptPurchaseSuggestion(auditId.value, auditForm.actualQuantity)
      ElMessage.success('采纳成功，库存已更新')
    } else {
      // 仅审核
      await auditPurchaseSuggestion(auditId.value, auditStatus.value, auditForm.remark)
      ElMessage.success(auditStatus.value === 1 ? '采纳成功' : '已驳回')
    }
    auditVisible.value = false
    loadData()
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    auditLoading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.purchase-suggestion {
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
  display: flex;
  align-items: center;
  gap: 8px;
  color: #333;
}

.search-card {
  margin-bottom: 20px;
}

.table-card {
  margin-bottom: 20px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
