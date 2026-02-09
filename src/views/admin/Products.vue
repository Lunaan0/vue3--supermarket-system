<template>
  <div class="products">
    <div class="page-header">
      <h2>商品管理</h2>
      <div class="header-actions">
        <el-button type="danger" :disabled="selectedIds.length === 0" @click="handleBatchDelete">
          <el-icon><Delete /></el-icon>
          批量删除
        </el-button>
        <el-button type="primary" @click="showAddDialog">
          <el-icon><Plus /></el-icon>
            添加商品
        </el-button>
      </div>
    </div>
    
    <el-card>
      <!-- 搜索栏 -->
      <div class="filter-bar">
        <el-input
          v-model="queryParams.productName"
          placeholder="商品名称"
          style="width: 160px"
          clearable
          @keyup.enter="handleSearch"
        />
        <el-input
          v-model="queryParams.productCode"
          placeholder="商品编码"
          style="width: 160px"
          clearable
          @keyup.enter="handleSearch"
        />
        <el-cascader
          v-model="selectedCategory"
          :options="categoryTree"
          :props="{ value: 'id', label: 'categoryName', children: 'children', checkStrictly: true, emitPath: false }"
          placeholder="选择分类"
          clearable
          style="width: 180px"
          @change="handleCategoryChange"
        />
        <el-select v-model="queryParams.status" placeholder="商品状态" clearable style="width: 120px">
          <el-option label="上架" :value="1" />
          <el-option label="下架" :value="0" />
        </el-select>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
        <el-button @click="handleReset">
          <el-icon><Refresh /></el-icon>
          重置
        </el-button>
      </div>
      
      <!-- 商品表格 -->
      <el-table 
        :data="productList" 
        style="width: 100%; margin-top: 20px;"
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column label="序号" type="index" width="60" />
        <el-table-column prop="productImg" label="商品图片" width="100">
          <template #default="scope">
            <el-image 
              :src="getImageUrl(scope.row.productImg)" 
              :preview-src-list="scope.row.productImg ? [getImageUrl(scope.row.productImg)] : []"
              style="width: 60px; height: 60px; border-radius: 4px;"
              fit="cover"
            >
              <template #error>
                <div class="image-placeholder">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
          </template>
        </el-table-column>
        <el-table-column prop="productName" label="商品名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="productCode" label="商品编码" width="130" show-overflow-tooltip />
        <el-table-column prop="specification" label="商品规格" width="100" show-overflow-tooltip />
        <el-table-column prop="unit" label="商品单位" width="80" />
        <el-table-column prop="purchasePrice" label="进货价" width="100">
          <template #default="scope">
            <span class="price">¥{{ scope.row.purchasePrice || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="sellingPrice" label="销售价" width="100">
          <template #default="scope">
            <span class="price sale-price">¥{{ scope.row.sellingPrice || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="discount" label="折扣" width="80">
          <template #default="scope">
            <el-tag v-if="scope.row.discount && scope.row.discount < 1" type="warning" size="small">
              {{ scope.row.discount * 10 }}折
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="80">
          <template #default="scope">
            <span :class="{ 'low-stock': scope.row.stock < 10 }">{{ scope.row.stock || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'" size="small">
              {{ scope.row.status === 1 ? '上架' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sales" label="销量" width="80">
          <template #default="scope">
            {{ scope.row.sales || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="showDetailDialog(scope.row)">
              <el-icon><View /></el-icon>详情
            </el-button>
            <el-button link type="primary" size="small" @click="showEditDialog(scope.row)">
              <el-icon><Edit /></el-icon>编辑
            </el-button>
            <el-button 
              link 
              :type="scope.row.status === 1 ? 'warning' : 'success'" 
              size="small" 
              @click="handleToggleStatus(scope.row)"
            >
              {{ scope.row.status === 1 ? '下架' : '上架' }}
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(scope.row)">
              <el-icon><Delete /></el-icon>删除
            </el-button>
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
          @size-change="getProductList"
          @current-change="getProductList"
        />
      </div>
    </el-card>
    
    <!-- 添加/编辑对话框 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="700px" destroy-on-close>
      <el-form :model="productForm" :rules="rules" ref="productFormRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="商品名称" prop="productName">
              <el-input v-model="productForm.productName" placeholder="请输入商品名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="商品编码" prop="productCode">
              <el-input v-model="productForm.productCode" placeholder="请输入商品编码" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="商品分类" prop="categoryId">
              <el-cascader
                ref="categoryCascaderRef"
                v-model="productForm.categoryId"
                :options="categoryTree"
                :props="{ value: 'id', label: 'categoryName', children: 'children', checkStrictly: true, emitPath: false }"
                placeholder="请选择分类"
                clearable
                style="width: 100%"
                @change="handleCategorySelect"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="供应商" prop="supplierId">
              <el-select 
                v-model="productForm.supplierId" 
                placeholder="请选择供应商" 
                style="width: 100%"
                @change="handleSupplierSelect"
              >
                <el-option 
                  v-for="supplier in supplierList" 
                  :key="supplier.id" 
                  :label="supplier.supplierName" 
                  :value="supplier.id" 
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="商品规格" prop="specification">
              <el-input v-model="productForm.specification" placeholder="如：500g/瓶" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="商品单位" prop="unit">
              <el-input v-model="productForm.unit" placeholder="如：件、瓶、袋" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="进货价" prop="purchasePrice">
              <el-input-number 
                v-model="productForm.purchasePrice" 
                :precision="2" 
                :step="1" 
                :min="0" 
                style="width: 100%" 
                placeholder="请输入进货价"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="销售价" prop="sellingPrice">
              <el-input-number 
                v-model="productForm.sellingPrice" 
                :precision="2" 
                :step="1" 
                :min="0" 
                style="width: 100%" 
                placeholder="请输入销售价"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="折扣" prop="discount">
              <el-input-number 
                v-model="productForm.discount" 
                :precision="2" 
                :step="0.1" 
                :min="0" 
                :max="1"
                style="width: 100%" 
                placeholder="0-1之间"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="商品状态" prop="status">
              <el-radio-group v-model="productForm.status">
                <el-radio :value="1">上架</el-radio>
                <el-radio :value="0">下架</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="商品图片" prop="productImg">
          <div class="image-upload-container">
            <el-upload
              class="image-uploader"
              :show-file-list="false"
              :http-request="handleMainImageUpload"
              accept="image/*"
            >
              <img v-if="productForm.productImg" :src="getImageUrl(productForm.productImg)" class="uploaded-image" />
              <el-icon v-else class="image-uploader-icon"><Plus /></el-icon>
            </el-upload>
            <el-button v-if="productForm.productImg" type="danger" size="small" @click="productForm.productImg = ''">
              删除
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="轮播图" prop="subImage">
          <div class="sub-images-container">
            <el-upload
              class="sub-image-uploader"
              :show-file-list="false"
              :http-request="handleSubImageUpload"
              accept="image/*"
            >
              <el-icon class="image-uploader-icon"><Plus /></el-icon>
            </el-upload>
            <div v-for="(img, index) in subImageList" :key="index" class="sub-image-item">
              <el-image :src="getImageUrl(img)" fit="cover" class="sub-image-preview" />
              <el-icon class="delete-icon" @click="removeSubImage(index)"><Delete /></el-icon>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="商品描述" prop="description">
          <el-input 
            v-model="productForm.description" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入商品描述"
          />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input 
            v-model="productForm.remark" 
            type="textarea" 
            :rows="2" 
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saveLoading">确定</el-button>
      </template>
    </el-dialog>
    
    <!-- 商品详情对话框 -->
    <el-dialog title="商品详情" v-model="detailDialogVisible" width="700px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="商品图片" :span="2">
          <div class="detail-images">
            <el-image 
              v-if="detailData.productImg"
              :src="getImageUrl(detailData.productImg)" 
              :preview-src-list="allImages"
              style="width: 100px; height: 100px; margin-right: 10px;"
              fit="cover"
            />
            <template v-if="detailData.subImage">
              <el-image 
                v-for="(img, index) in detailData.subImage.split(',')" 
                :key="index"
                :src="getImageUrl(img)" 
                :preview-src-list="allImages"
                style="width: 100px; height: 100px; margin-right: 10px;"
                fit="cover"
              />
            </template>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="商品名称">{{ detailData.productName }}</el-descriptions-item>
        <el-descriptions-item label="商品编码">{{ detailData.productCode }}</el-descriptions-item>
        <el-descriptions-item label="商品分类">{{ detailData.categoryName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="供应商">{{ detailData.supplierName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="商品规格">{{ detailData.specification || '-' }}</el-descriptions-item>
        <el-descriptions-item label="商品单位">{{ detailData.unit || '-' }}</el-descriptions-item>
        <el-descriptions-item label="进货价">
          <span class="price">¥{{ detailData.purchasePrice || 0 }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="销售价">
          <span class="price sale-price">¥{{ detailData.sellingPrice || 0 }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="折扣">{{ detailData.discount ? (detailData.discount * 10) + '折' : '无折扣' }}</el-descriptions-item>
        <el-descriptions-item label="库存">
          <span :class="{ 'low-stock': detailData.stock < 10 }">{{ detailData.stock || 0 }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="销量">{{ detailData.sales || 0 }}</el-descriptions-item>
        <el-descriptions-item label="商品状态">
          <el-tag :type="detailData.status === 1 ? 'success' : 'danger'" size="small">
            {{ detailData.status === 1 ? '上架' : '下架' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="商品描述" :span="2">{{ detailData.description || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detailData.remark || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ detailData.createTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ detailData.updateTime || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="showEditFromDetail">编辑</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, Delete, Edit, View, Picture } from '@element-plus/icons-vue'
import { getProductPage, getProductDetail, addProduct, updateProduct, deleteProduct, batchDeleteProduct, updateProductStatus } from '@/api/product'
import { getCategoryTree } from '@/api/category'
import { getSupplierList } from '@/api/supplier'
import { uploadImage } from '@/api/file'

// 获取图片完整URL（统一走 /api 代理）
const getImageUrl = (path) => {
  if (!path) return ''
  // 如果已经是完整URL，直接返回
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  // 加上 /api 前缀，Vite代理会去掉 /api 转发到后端
  return '/api' + path
}

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  productName: '',
  productCode: '',
  categoryId: null,
  supplierId: null,
  status: null
})

// 列表数据
const productList = ref([])
const total = ref(0)
const loading = ref(false)
const selectedIds = ref([])
const selectedCategory = ref(null)

// 分类和供应商数据
const categoryTree = ref([])
const supplierList = ref([])

// 对话框
const dialogVisible = ref(false)
const dialogTitle = ref('添加商品')
const productFormRef = ref()
const isEdit = ref(false)
const saveLoading = ref(false)

// 详情对话框
const detailDialogVisible = ref(false)
const detailData = ref({})

// 分类级联选择器ref
const categoryCascaderRef = ref()

// 轮播图列表
const subImageList = ref([])

// 表单数据
const productForm = reactive({
  id: null,
  productCode: '',
  productName: '',
  categoryId: null,
  categoryName: '',
  supplierId: null,
  supplierName: '',
  productImg: '',
  specification: '',
  unit: '',
  purchasePrice: null,
  sellingPrice: null,
  status: 1,
  remark: '',
  stock: null,
  subImage: '',
  discount: null,
  description: ''
})

// 表单验证规则
const rules = {
  productName: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  productCode: [{ required: true, message: '请输入商品编码', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择商品分类', trigger: 'change' }],
  sellingPrice: [{ required: true, message: '请输入销售价', trigger: 'blur' }]
}

// 计算所有图片（用于预览）
const allImages = computed(() => {
  const images = []
  if (detailData.value.productImg) {
    images.push(getImageUrl(detailData.value.productImg))
  }
  if (detailData.value.subImage) {
    images.push(...detailData.value.subImage.split(',').filter(img => img).map(img => getImageUrl(img)))
  }
  return images
})

// 获取商品列表
const getProductList = async () => {
  loading.value = true
  try {
    const res = await getProductPage(queryParams)
    if (res.code === 200) {
      productList.value = res.data.records || []
      total.value = res.data.total || 0
    }
  } catch (error) {
    console.error('获取商品列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取分类树
const getCategoryTreeData = async () => {
  try {
    const res = await getCategoryTree()
    if (res.code === 200) {
      categoryTree.value = res.data || []
    }
  } catch (error) {
    console.error('获取分类树失败:', error)
  }
}

// 获取供应商列表
const getSupplierListData = async () => {
  try {
    const res = await getSupplierList({ pageNum: 1, pageSize: 1000 })
    if (res.code === 200) {
      supplierList.value = res.data.records || []
    }
  } catch (error) {
    console.error('获取供应商列表失败:', error)
  }
}

// 搜索
const handleSearch = () => {
  queryParams.pageNum = 1
  getProductList()
}

// 分类选择处理（表单中）
const handleCategorySelect = (val) => {
  if (val && categoryCascaderRef.value) {
    const checkedNodes = categoryCascaderRef.value.getCheckedNodes()
    if (checkedNodes && checkedNodes.length > 0) {
      productForm.categoryName = checkedNodes[0].label || ''
    } else {
      productForm.categoryName = ''
    }
  } else {
    productForm.categoryName = ''
  }
}

// 供应商选择处理
const handleSupplierSelect = (val) => {
  if (val) {
    const supplier = supplierList.value.find(s => s.id === val)
    productForm.supplierName = supplier?.supplierName || ''
  } else {
    productForm.supplierName = ''
  }
}

// 重置
const handleReset = () => {
  queryParams.productName = ''
  queryParams.productCode = ''
  queryParams.categoryId = null
  queryParams.supplierId = null
  queryParams.status = null
  selectedCategory.value = null
  queryParams.pageNum = 1
  getProductList()
}

// 分类变化（搜索栏）
const handleCategoryChange = (val) => {
  queryParams.categoryId = val
}

// 上传主图
const handleMainImageUpload = async (options) => {
  try {
    const res = await uploadImage(options.file, 'product')
    if (res.code === 200) {
      productForm.productImg = res.data
      ElMessage.success('图片上传成功')
    } else {
      ElMessage.error(res.msg || '图片上传失败')
    }
  } catch (error) {
    console.error('上传失败:', error)
    ElMessage.error('图片上传失败')
  }
}

// 上传轮播图
const handleSubImageUpload = async (options) => {
  try {
    const res = await uploadImage(options.file, 'product')
    if (res.code === 200) {
      subImageList.value.push(res.data)
      productForm.subImage = subImageList.value.join(',')
      ElMessage.success('图片上传成功')
    } else {
      ElMessage.error(res.msg || '图片上传失败')
    }
  } catch (error) {
    console.error('上传失败:', error)
    ElMessage.error('图片上传失败')
  }
}

// 删除轮播图
const removeSubImage = (index) => {
  subImageList.value.splice(index, 1)
  productForm.subImage = subImageList.value.join(',')
}

// 选择变化
const handleSelectionChange = (selection) => {
  selectedIds.value = selection.map(item => item.id)
}

// 显示添加对话框
const showAddDialog = () => {
  dialogTitle.value = '添加商品'
  isEdit.value = false
  resetForm()
  subImageList.value = []
  dialogVisible.value = true
}

// 显示编辑对话框
const showEditDialog = (row) => {
  dialogTitle.value = '编辑商品'
  isEdit.value = true
  Object.assign(productForm, {
    id: row.id,
    productCode: row.productCode,
    productName: row.productName,
    categoryId: row.categoryId,
    categoryName: row.categoryName || '',
    supplierId: row.supplierId,
    supplierName: row.supplierName || '',
    productImg: row.productImg,
    specification: row.specification,
    unit: row.unit,
    purchasePrice: row.purchasePrice,
    sellingPrice: row.sellingPrice,
    status: row.status,
    remark: row.remark,
    stock: row.stock,
    subImage: row.subImage,
    discount: row.discount,
    description: row.description
  })
  // 解析轮播图列表
  subImageList.value = row.subImage ? row.subImage.split(',').filter(img => img) : []
  dialogVisible.value = true
}

// 显示详情对话框
const showDetailDialog = async (row) => {
  try {
    const res = await getProductDetail(row.id)
    if (res.code === 200) {
      detailData.value = res.data
      detailDialogVisible.value = true
    }
  } catch (error) {
    console.error('获取商品详情失败:', error)
    ElMessage.error('获取商品详情失败')
  }
}

// 从详情页编辑
const showEditFromDetail = () => {
  detailDialogVisible.value = false
  showEditDialog(detailData.value)
}

// 保存商品
const handleSave = async () => {
  if (!productFormRef.value) return
  
  try {
    await productFormRef.value.validate()
    saveLoading.value = true
    
    const api = isEdit.value ? updateProduct : addProduct
    const res = await api(productForm)
    
    if (res.code === 200) {
      ElMessage.success(isEdit.value ? '修改成功' : '添加成功')
      dialogVisible.value = false
      getProductList()
    } else {
      ElMessage.error(res.msg || (isEdit.value ? '修改失败' : '添加失败'))
    }
  } catch (error) {
    console.error('保存失败:', error)
  } finally {
    saveLoading.value = false
  }
}

// 切换状态
const handleToggleStatus = async (row) => {
  const newStatus = row.status === 1 ? 0 : 1
  const statusText = newStatus === 1 ? '上架' : '下架'
  
  try {
    await ElMessageBox.confirm(`确定要${statusText}该商品吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const res = await updateProductStatus(row.id, newStatus)
    if (res.code === 200) {
      ElMessage.success(`${statusText}成功`)
      getProductList()
    } else {
      ElMessage.error(res.msg || `${statusText}失败`)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('操作失败:', error)
    }
  }
}

// 删除商品
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该商品吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const res = await deleteProduct(row.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      getProductList()
    } else {
      ElMessage.error(res.msg || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请选择要删除的商品')
    return
  }
  
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 个商品吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const res = await batchDeleteProduct(selectedIds.value)
    if (res.code === 200) {
      ElMessage.success('批量删除成功')
      selectedIds.value = []
      getProductList()
    } else {
      ElMessage.error(res.msg || '批量删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
    }
  }
}

// 重置表单
const resetForm = () => {
  Object.assign(productForm, {
    id: null,
    productCode: '',
    productName: '',
    categoryId: null,
    categoryName: '',
    supplierId: null,
    supplierName: '',
    productImg: '',
    specification: '',
    unit: '',
    purchasePrice: null,
    sellingPrice: null,
    status: 1,
    remark: '',
    stock: null,
    subImage: '',
    discount: null,
    description: ''
  })
  if (productFormRef.value) {
    productFormRef.value.resetFields()
  }
}

// 初始化
onMounted(() => {
  getProductList()
  getCategoryTreeData()
  getSupplierListData()
})
</script>

<style scoped>
.products {
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
  flex-wrap: wrap;
  gap: 10px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.image-placeholder {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 4px;
  color: #c0c4cc;
  font-size: 20px;
}

.low-stock {
  color: #f56c6c;
  font-weight: bold;
}

.price {
  color: #606266;
}

.sale-price {
  color: #f56c6c;
  font-weight: bold;
  font-size: 16px;
}

.detail-images {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

:deep(.el-descriptions__label) {
  width: 100px;
}

/* 图片上传样式 */
.image-upload-container {
  display: flex;
  align-items: flex-end;
  gap: 10px;
}

.image-uploader {
  width: 120px;
  height: 120px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: border-color 0.3s;
}

.image-uploader:hover {
  border-color: #409eff;
}

.image-uploader-icon {
  font-size: 28px;
  color: #8c939d;
}

.uploaded-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sub-images-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.sub-image-uploader {
  width: 80px;
  height: 80px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.3s;
}

.sub-image-uploader:hover {
  border-color: #409eff;
}

.sub-image-item {
  position: relative;
  width: 80px;
  height: 80px;
}

.sub-image-preview {
  width: 100%;
  height: 100%;
  border-radius: 6px;
}

.delete-icon {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  background: #f56c6c;
  color: #fff;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.delete-icon:hover {
  background: #f78989;
}
</style>
