<template>
  <div class="shop-products">
    <!-- 顶部导航栏 -->
    <div class="top-bar">
      <div class="container">
        <div class="top-bar-left">
          <el-button class="back-btn" @click="goToHome" round>
            <el-icon><ArrowLeft /></el-icon>
            <span>返回首页</span>
          </el-button>
          <div class="logo" @click="goToHome">超市商城</div>
        </div>
        <div class="search-box">
          <el-input 
            v-model="searchKeyword" 
            placeholder="搜索你想要的商品..."
            clearable
            class="search-input"
            @clear="clearSearch"
            @keyup.enter="handleSearch">
            <template #append>
              <el-button :icon="Search" @click="handleSearch" />
            </template>
          </el-input>
        </div>
        <div class="user-info">
          <span>欢迎, {{ userStore.user?.username || '游客' }}</span>
        </div>
      </div>
    </div>

    <!-- 主体内容 -->
    <div class="main-content">
      <div class="container">
        <el-row :gutter="20">
          <!-- 左侧分类筛选 -->
          <el-col :xs="24" :sm="6" :md="5">
            <div class="filter-sidebar">
              <h3 class="filter-title">商品分类</h3>
              <el-menu
                :default-active="currentCategoryId"
                @select="handleCategorySelect"
                class="category-filter-menu">
                <el-menu-item index="">全部商品</el-menu-item>
                <el-sub-menu 
                  v-for="category in categories" 
                  :key="category.id" 
                  :index="String(category.id)">
                  <template #title >
                    <span>{{ category.categoryName }}</span>
                    <el-icon 
                      class="query-icon" 
                      @click.stop="handleCategorySelect(String(category.id))">
                      <Search />
                    </el-icon>
                  </template>
                  <el-menu-item 
                    v-for="child in category.children" 
                    :key="child.id"
                    :index="String(child.id)">
                    {{ child.categoryName }}
                  </el-menu-item>
                </el-sub-menu>
              </el-menu>
            </div>
          </el-col>

          <!-- 右侧商品列表 -->
          <el-col :xs="24" :sm="18" :md="19">
            <div class="products-content">
              <!-- 筛选条件显示 -->
              <div class="filter-tags" v-if="currentCategory || searchKeyword">
                <el-tag 
                  v-if="searchKeyword" 
                  closable 
                  @close="clearSearch"
                  type="warning">
                  搜索: {{ searchKeyword }}
                </el-tag>
                <el-tag 
                  v-if="currentCategory" 
                  closable 
                  @close="clearCategory"
                  type="primary">
                  分类: {{ currentCategory }}
                </el-tag>
              </div>

              <!-- 商品网格 -->
              <el-row :gutter="20" v-loading="loading">
                <el-col 
                  v-for="product in productList" 
                  :key="product.id"
                  :xs="12" 
                  :sm="8" 
                  :md="6">
                  <div class="product-card" @click="goToProductDetail(product.id)">
                    <div class="product-image">
                      <img :src="getImageUrl(product.productImg)" :alt="product.productName" />
                      <div class="product-overlay" v-if="product.subImage">
                        <el-icon><View /></el-icon>
                        <span>查看详情</span>
                      </div>
                    </div>
                    <div class="product-info">
                      <div class="product-name" :title="product.productName">
                        {{ product.productName }}
                      </div>
                      <div class="product-desc">
                        {{ product.description || '暂无描述' }}
                      </div>
                      <div class="product-price-row">
                        <span class="current-price">¥{{ product.sellingPrice }}</span>
                        <span class="sales">销量: {{ product.sales }}</span>
                      </div>
                      <div class="button-group">
                        <el-button 
                          type="primary" 
                          size="small" 
                          class="add-cart-btn"
                          @click.stop="addToCart(product)">
                          加入购物车
                        </el-button>
                        <el-button 
                          type="success" 
                          size="small" 
                          class="buy-now-btn"
                          @click.stop="buyNow(product)">
                          立即购买
                        </el-button>
                      </div>
                    </div>
                  </div>
                </el-col>
              </el-row>

              <!-- 空状态 -->
              <el-empty 
                v-if="!loading && productList.length === 0" 
                description="暂无商品"
                :image-size="200" />

              <!-- 分页 -->
              <div class="pagination-container" v-if="total > 0">
                <el-pagination
                  :current-page="queryParams.pageNum"
                  :page-size="queryParams.pageSize"
                  :total="total"
                  :page-sizes="[12, 24, 48, 96]"
                  layout="total, sizes, prev, pager, next, jumper"
                  @size-change="handleSizeChange"
                  @current-change="handleCurrentChange" />
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </div>

    <!-- 购物车悬浮按钮 -->
    <div class="cart-float-btn" @click="goToCart">
      <el-badge :value="cartCount" :hidden="cartCount === 0" class="cart-badge">
        <el-icon :size="28"><ShoppingCart /></el-icon>
      </el-badge>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, ShoppingCart, View, ArrowLeft } from '@element-plus/icons-vue'
import { getCategoryTree } from '@/api/shopCategory'
import { getProductPage } from '@/api/shopProduct'
import { addToCart as addToCartApi, getCartList } from '@/api/cart'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const userStore = useAuthStore()

const searchKeyword = ref('')
const currentCategoryId = ref('')
const currentCategory = ref('')
const categories = ref([])
const productList = ref([])
const loading = ref(false)
const cartCount = ref(0)
const total = ref(0)

const queryParams = ref({
  pageNum: 1,
  pageSize: 12,
  productName: '',
  categoryId: null
})

// 获取图片URL
const getImageUrl = (imagePath) => {
  if (!imagePath) return ''
  return `/api${imagePath}`
}

// 加载分类树
const loadCategories = async () => {
  try {
    const res = await getCategoryTree()
    if (res.code === 200) {
      categories.value = res.data || []
    }
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

// 加载商品列表
const loadProducts = async () => {
  loading.value = true
  try {
    const res = await getProductPage(queryParams.value)
    if (res.code === 200) {
      productList.value = res.data.records || []
      total.value = res.data.total || 0
    }
  } catch (error) {
    console.error('加载商品失败:', error)
    ElMessage.error('加载商品失败')
  } finally {
    loading.value = false
  }
}

// 加载购物车数量
const loadCartCount = async () => {
  try {
    const res = await getCartList()
    if (res.code === 200) {
      cartCount.value = res.data?.length || 0
    }
  } catch (error) {
    console.error('加载购物车数量失败:', error)
  }
}

// 分类选择
const handleCategorySelect = (index) => {
  currentCategoryId.value = index
  queryParams.value.categoryId = index ? parseInt(index) : null
  queryParams.value.pageNum = 1
  
  // 查找分类名称
  if (index) {
    const findCategory = (cats) => {
      for (const cat of cats) {
        if (String(cat.id) === index) {
          return cat.categoryName
        }
        if (cat.children && cat.children.length > 0) {
          const found = findCategory(cat.children)
          if (found) return found
        }
      }
      return null
    }
    currentCategory.value = findCategory(categories.value) || ''
  } else {
    currentCategory.value = ''
  }
  
  loadProducts()
}

// 搜索
const handleSearch = () => {
  queryParams.value.productName = searchKeyword.value
  queryParams.value.pageNum = 1
  loadProducts()
}

// 清除搜索
const clearSearch = () => {
  searchKeyword.value = ''
  queryParams.value.productName = ''
  queryParams.value.pageNum = 1
  loadProducts()
}

// 清除分类
const clearCategory = () => {
  currentCategoryId.value = ''
  currentCategory.value = ''
  queryParams.value.categoryId = null
  queryParams.value.pageNum = 1
  loadProducts()
}

// 分页变化
const handleSizeChange = (val) => {
  queryParams.value.pageSize = val
  queryParams.value.pageNum = 1
  loadProducts()
}

const handleCurrentChange = (val) => {
  queryParams.value.pageNum = val
  loadProducts()
}

// 加入购物车
const addToCart = async (product) => {
  const productId = product.id
  const quantity = 1
  console.log('准备加入购物车:', { productId, quantity })
  try {
    const res = await addToCartApi(
      productId,
      quantity
    )
    if (res.code === 200) {
      ElMessage.success('已加入购物车')
      loadCartCount()
    } else {
      ElMessage.error(res.msg || '加入购物车失败')
    }
  } catch (error) {
    ElMessage.error('加入购物车失败')
  }
}

// 立即购买
const buyNow = async (product) => {
  try {
    const res = await addToCartApi(
      product.id,
      1
    )
    if (res.code === 200) {
      ElMessage.success('已加入购物车，前往结算')
      // 跳转到购物车
      goToCart()
    } else {
      ElMessage.error(res.msg || '购买失败')
    }
  } catch (error) {
    ElMessage.error('购买失败')
  }
}

// 跳转到商品详情
const goToProductDetail = (productId) => {
  router.push(`/shop/product/${productId}`)
}

// 跳转到首页
const goToHome = () => {
  router.push('/shop/home')
}

// 跳转到购物车
const goToCart = () => {
  router.push('/shop/cart')
}

// 监听路由变化
watch(() => route.query, (newQuery) => {
  if (newQuery.categoryId) {
    currentCategoryId.value = newQuery.categoryId
    queryParams.value.categoryId = parseInt(newQuery.categoryId)
  }
  if (newQuery.keyword) {
    searchKeyword.value = newQuery.keyword
    queryParams.value.productName = newQuery.keyword
  }
  loadProducts()
}, { immediate: true })

onMounted(() => {
  loadCategories()
  loadCartCount()
})
</script>

<style scoped>
.shop-products {
  min-height: 100vh;
  background-color: #f5f7fc;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 顶部导航栏 */
.top-bar {
  background: linear-gradient(135deg, #667eea 0%, #9b8dd4 60%, #c4a0d4 100%);
  color: white;
  padding: 15px 0;
  box-shadow: 0 2px 12px rgba(102, 126, 234, 0.25);
}

.top-bar .container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.top-bar-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.back-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.35);
  color: white;
  font-size: 13px;
  padding: 6px 14px;
  backdrop-filter: blur(4px);
  transition: all 0.3s;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.35);
  border-color: rgba(255, 255, 255, 0.5);
  color: white;
}

.logo {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 2px;
  cursor: pointer;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.1);
}

.search-box {
  flex: 1;
  max-width: 460px;
  margin: 0 40px;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.search-input :deep(.el-input-group__append) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  border-radius: 0 10px 10px 0;
}

.search-input :deep(.el-input-group__append .el-button) {
  color: white;
}

.user-info {
  font-size: 14px;
  flex-shrink: 0;
  opacity: 0.9;
}

/* 主体内容 */
.main-content {
  padding: 24px 0;
}

/* 筛选侧边栏 */
.filter-sidebar {
  background: white;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(100, 120, 180, 0.07);
}

.filter-title {
  font-size: 18px;
  margin: 0 0 15px 0;
  color: #2d3142;
  padding-bottom: 10px;
  border-bottom: 2px solid #667eea;
  font-weight: 700;
}

.category-filter-menu {
  border: none;
}

:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  padding-left: 20px !important;
}

:deep(.el-menu-item.is-active) {
  color: #667eea;
  background-color: rgba(102, 126, 234, 0.08);
}

/* 商品内容区 */
.products-content {
  background: white;
  border-radius: 14px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(100, 120, 180, 0.07);
  min-height: 500px;
}

/* 筛选标签 */
.filter-tags {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

/* 商品卡片 */
.product-card {
  background: white;
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 20px;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #eef0f8;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.16);
  border-color: #a5b4fc;
}

.product-image {
  position: relative;
  width: 100%;
  height: 180px;
  overflow: hidden;
  background: #f5f6fa;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.product-card:hover .product-image img {
  transform: scale(1.08);
}

.product-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(45, 49, 66, 0.45);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  color: white;
  font-size: 14px;
}

.product-card:hover .product-overlay {
  opacity: 1;
}

.product-overlay .el-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.product-info {
  padding: 14px;
  min-height: 130px;
  display: flex;
  flex-direction: column;
}

.product-name {
  font-size: 14px;
  color: #2d3142;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
  height: 20px;
}

.product-desc {
  font-size: 12px;
  color: #9a9eb8;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  height: 18px;
  flex-shrink: 0;
}

.product-price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.current-price {
  font-size: 18px;
  color: #e74860;
  font-weight: 800;
}

.sales {
  font-size: 12px;
  color: #b0b4c8;
}

.button-group {
  display: flex;
  gap: 8px;
}

.add-cart-btn {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  border-radius: 8px;
}

.add-cart-btn:hover {
  background: linear-gradient(135deg, #5a6fd6 0%, #6b3f99 100%);
}

.buy-now-btn {
  flex: 1;
  background: linear-gradient(135deg, #43cea2 0%, #3bb896 100%);
  border: none;
  color: white;
  border-radius: 8px;
}

.buy-now-btn:hover {
  background: linear-gradient(135deg, #38b892 0%, #2fa584 100%);
}

/* 分页 */
.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

/* 购物车悬浮按钮 */
.cart-float-btn {
  position: fixed;
  right: 32px;
  bottom: 100px;
  width: 52px;
  height: 52px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
  z-index: 999;
  color: white;
}

.cart-float-btn:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 24px rgba(102, 126, 234, 0.5);
}

.cart-badge {
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.el-badge__content) {
  background-color: #e74860;
}

/* 查询图标样式 */
:deep(.query-icon) {
  margin-left: 8px;
  color: #667eea;
  font-size: 22px;
  transition: color 0.3s, font-size 0.3s;
}

:deep(.query-icon:hover) {
  color: #764ba2;
  font-size: 22px;
}

/* 响应式 */
@media (max-width: 768px) {
  .filter-sidebar {
    margin-bottom: 20px;
  }
  
  .search-box {
    margin: 0 16px;
  }
  
  .top-bar-left {
    gap: 8px;
  }
  
  .back-btn span {
    display: none;
  }

  .cart-float-btn {
    right: 16px;
    bottom: 16px;
    width: 46px;
    height: 46px;
  }
}
</style>
