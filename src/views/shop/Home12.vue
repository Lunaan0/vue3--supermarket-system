<template>
  <div class="shop-home">
    <!-- 顶部导航栏 -->
    <div class="top-bar">
      <div class="container">
        <div class="logo">超市商城</div>
        <div class="search-box">
          <el-input 
            v-model="searchKeyword" 
            placeholder="请输入商品名称搜索"
            class="search-input"
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

    <!-- 分类导航 -->
    <div class="category-nav">
      <div class="container">
        <el-menu 
          mode="horizontal" 
          :default-active="activeCategory" 
          @select="handleCategorySelect"
          class="category-menu">
          <el-menu-item index="all">全部商品</el-menu-item>
          <el-menu-item 
            v-for="category in topCategories" 
            :key="category.id" 
            :index="String(category.id)">
            {{ category.categoryName }}
          </el-menu-item>
        </el-menu>
      </div>
    </div>

    <!-- 轮播图 -->
    <div class="carousel-section">
      <div class="container">
        <el-carousel height="400px" :interval="3000">
          <el-carousel-item v-for="product in carouselProducts" :key="product.id">
            <div class="carousel-item" @click="goToProductDetail(product.id)">
              <img :src="getImageUrl(product.subImage)" :alt="product.productName" />
              <div class="carousel-info">
                <h3>{{ product.productName }}</h3>
                <p class="price">¥{{ product.sellingPrice }}</p>
              </div>
            </div>
          </el-carousel-item>
        </el-carousel>
      </div>
    </div>

    <!-- 热销商品 -->
    <div class="hot-products-section">
      <div class="container">
        <div class="section-title">
          <h2>热销商品</h2>
          <span class="subtitle">销量前10的热门商品</span>
        </div>
        <el-row :gutter="20">
          <el-col 
            v-for="product in hotProducts" 
            :key="product.id" 
            :xs="12" 
            :sm="8" 
            :md="6" 
            :lg="4.8">
            <div class="product-card" @click="goToProductDetail(product.id)">
              <div class="product-image">
                <img :src="getImageUrl(product.productImg)" :alt="product.productName" />
              </div>
              <div class="product-info">
                <div class="product-name">{{ product.productName }}</div>
                <div class="product-price">
                  <span class="current-price">¥{{ product.sellingPrice }}</span>
                  <span class="sales">销量: {{ product.sales }}</span>
                </div>
                <el-button 
                  type="primary" 
                  size="small" 
                  class="add-cart-btn"
                  @click.stop="addToCart(product)">
                  加入购物车
                </el-button>
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
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, ShoppingCart } from '@element-plus/icons-vue'
import { getTopCategories } from '@/api/shopCategory'
import { getHotProducts, getCarouselProducts } from '@/api/shopProduct'
import { addToCart as addToCartApi, getCartList } from '@/api/cart'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const userStore = useAuthStore()

const searchKeyword = ref('')
const activeCategory = ref('all')
const topCategories = ref([])
const hotProducts = ref([])
const carouselProducts = ref([])
const cartCount = ref(0)

// 获取图片URL
const getImageUrl = (imagePath) => {
  if (!imagePath) return ''
  return `/api${imagePath}`
}

// 加载顶级分类
const loadTopCategories = async () => {
  try {
    const res = await getTopCategories()
    if (res.code === 200) {
      topCategories.value = res.data || []
    }
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

// 加载热销商品
const loadHotProducts = async () => {
  try {
    const res = await getHotProducts(10)
    if (res.code === 200) {
      hotProducts.value = res.data || []
    }
  } catch (error) {
    console.error('加载热销商品失败:', error)
  }
}

// 加载轮播商品
const loadCarouselProducts = async () => {
  try {
    const res = await getCarouselProducts()
    if (res.code === 200) {
      carouselProducts.value = res.data || []
    }
  } catch (error) {
    console.error('加载轮播商品失败:', error)
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
  activeCategory.value = index
  if (index === 'all') {
    router.push('/shop/products')
  } else {
    router.push(`/shop/products?categoryId=${index}`)
  }
}

// 搜索
const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    router.push(`/shop/products?keyword=${searchKeyword.value}`)
  }
}

// 加入购物车
const addToCart = async (product) => {
  const productId=product.id
  const quantity=1
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

// 跳转到商品详情
const goToProductDetail = (productId) => {
  router.push(`/shop/product/${productId}`)
}

// 跳转到购物车
const goToCart = () => {
  router.push('/shop/cart')
}

onMounted(() => {
  loadTopCategories()
  loadHotProducts()
  loadCarouselProducts()
  loadCartCount()
})
</script>

<style scoped>
.shop-home {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 顶部导航栏 */
.top-bar {
  background: linear-gradient(135deg, #ff9a56 0%, #ff7730 100%);
  color: white;
  padding: 15px 0;
  box-shadow: 0 2px 8px rgba(255, 119, 48, 0.2);
}

.top-bar .container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-size: 24px;
  font-weight: bold;
  letter-spacing: 2px;
}

.search-box {
  flex: 1;
  max-width: 500px;
  margin: 0 40px;
}

.search-input {
  --el-input-bg-color: rgba(255, 255, 255, 0.9);
}

.user-info {
  font-size: 14px;
}

/* 分类导航 */
.category-nav {
  background: white;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.category-menu {
  border-bottom: none;
}

:deep(.el-menu-item) {
  font-size: 15px;
  padding: 0 25px;
}

:deep(.el-menu-item:hover),
:deep(.el-menu-item.is-active) {
  color: #ff7730;
  border-bottom-color: #ff7730;
}

/* 轮播图 */
.carousel-section {
  padding: 30px 0;
}

.carousel-item {
  position: relative;
  width: 100%;
  height: 100%;
  cursor: pointer;
  overflow: hidden;
}

.carousel-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.carousel-item:hover img {
  transform: scale(1.05);
}

.carousel-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  color: white;
  padding: 30px;
}

.carousel-info h3 {
  font-size: 28px;
  margin: 0 0 10px 0;
}

.carousel-info .price {
  font-size: 32px;
  color: #ff9a56;
  font-weight: bold;
  margin: 0;
}

/* 热销商品区域 */
.hot-products-section {
  padding: 40px 0;
}

.section-title {
  text-align: center;
  margin-bottom: 30px;
}

.section-title h2 {
  font-size: 32px;
  margin: 0 0 10px 0;
  color: #333;
}

.section-title .subtitle {
  color: #999;
  font-size: 14px;
}

/* 商品卡片 */
.product-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 16px rgba(255, 119, 48, 0.2);
}

.product-image {
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: #f9f9f9;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.product-card:hover .product-image img {
  transform: scale(1.1);
}

.product-info {
  padding: 15px;
}

.product-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-price {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.current-price {
  font-size: 20px;
  color: #ff7730;
  font-weight: bold;
}

.sales {
  font-size: 12px;
  color: #999;
}

.add-cart-btn {
  width: 100%;
  background: linear-gradient(135deg, #ff9a56 0%, #ff7730 100%);
  border: none;
}

.add-cart-btn:hover {
  background: linear-gradient(135deg, #ff8c42 0%, #ff6620 100%);
}

/* 购物车悬浮按钮 */
.cart-float-btn {
  position: fixed;
  right: 100px;
  bottom: 20px;
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #ff9a56 0%, #ff7730 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(255, 119, 48, 0.4);
  transition: all 0.3s ease;
  z-index: 999;
  color: white;
}

.cart-float-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(255, 119, 48, 0.5);
}

.cart-badge {
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.el-badge__content) {
  background-color: #ff3030;
}

/* 响应式 */
@media (max-width: 768px) {
  .search-box {
    margin: 0 20px;
  }
  
  .carousel-info h3 {
    font-size: 20px;
  }
  
  .carousel-info .price {
    font-size: 24px;
  }
  
  .cart-float-btn {
    right: 20px;
    bottom: 20px;
    width: 50px;
    height: 50px;
  }
}
</style>
