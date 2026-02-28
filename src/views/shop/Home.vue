<template>
  <div class="shop-home">
    <!-- ✦ Hero 横幅区域 -->
    <div class="hero-section">
      <!-- 装饰性浮动元素 -->
      <div class="hero-decor deco-circle deco-1"></div>
      <div class="hero-decor deco-circle deco-2"></div>
      <div class="hero-decor deco-star deco-3">✦</div>
      <div class="hero-decor deco-star deco-4">☁</div>
      <div class="hero-decor deco-star deco-5">✿</div>

      <div class="container hero-content">
        <div class="hero-text">
          <h1 class="hero-title">
            <span class="title-line">欢迎来到</span>
            <span class="title-highlight">超市商城</span>
            <span class="title-emoji">🛒</span>
          </h1>
          <p class="hero-subtitle">新鲜好物 · 每日优选 · 品质生活从这里开始</p>
          <div class="hero-search">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索你想要的商品..."
              size="large"
              clearable
              class="hero-search-input"
              @keyup.enter="handleSearch">
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
              <template #append>
                <el-button @click="handleSearch" type="primary">搜索</el-button>
              </template>
            </el-input>
          </div>
        </div>
        <!-- 可爱购物袋插画 -->
        <div class="hero-illustration">
          <div class="shopping-bag-illustration">
            <div class="bag-body">
              <div class="bag-handle"></div>
              <div class="bag-face">
                <div class="bag-eyes">
                  <span class="eye">◕</span>
                  <span class="eye">◕</span>
                </div>
                <div class="bag-mouth">ᴗ</div>
              </div>
              <div class="bag-items">
                <span class="bag-item item-1">🥕</span>
                <span class="bag-item item-2">🍎</span>
                <span class="bag-item item-3">🥖</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ✦ 分类快捷导航 -->
    <div class="category-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">
            <span class="title-icon">📦</span>
            商品分类
          </h2>
        </div>
        <div class="category-grid">
          <div
            class="category-card"
            :class="{ active: activeCategory === 'all' }"
            @click="handleCategorySelect('all')"
          >
            <div class="category-icon">🏪</div>
            <span class="category-name">全部商品</span>
          </div>
          <div
            v-for="(category, index) in topCategories"
            :key="category.id"
            class="category-card"
            :class="{ active: activeCategory === String(category.id) }"
            :style="{ '--delay': index * 0.06 + 's' }"
            @click="handleCategorySelect(String(category.id))"
          >
            <div class="category-icon">{{ getCategoryEmoji(index) }}</div>
            <span class="category-name">{{ category.categoryName }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ✦ 轮播推荐 -->
    <div class="carousel-section" v-if="carouselProducts.length > 0">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">
            <span class="title-icon">⭐</span>
            精选推荐
          </h2>
        </div>
        <el-carousel height="360px" :interval="4000" arrow="hover" indicator-position="outside" class="styled-carousel">
          <el-carousel-item v-for="product in carouselProducts" :key="product.id">
            <div class="carousel-card" @click="goToProductDetail(product.id)">
              <div class="carousel-img">
                <img :src="getImageUrl(product.subImage || product.productImg)" :alt="product.productName" />
              </div>
              <div class="carousel-info">
                <h3>{{ product.productName }}</h3>
                <p class="carousel-desc">{{ product.description || '精选好物，品质保证' }}</p>
                <div class="carousel-price">
                  <span class="price-value">¥{{ product.sellingPrice }}</span>
                  <el-button type="primary" round size="small" class="carousel-btn">去看看 →</el-button>
                </div>
              </div>
            </div>
          </el-carousel-item>
        </el-carousel>
      </div>
    </div>

    <!-- ✦ 热销排行 -->
    <div class="hot-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">
            <span class="title-icon">🔥</span>
            热销排行
          </h2>
          <p class="section-subtitle">大家都在买的人气商品</p>
        </div>
        <div class="product-grid">
          <div
            v-for="(product, index) in hotProducts"
            :key="product.id"
            class="product-card"
            @click="goToProductDetail(product.id)"
          >
            <!-- 排名标签 -->
            <div class="rank-badge" v-if="index < 3" :class="['rank-' + (index + 1)]">
              {{ index + 1 }}
            </div>
            <div class="card-image">
              <img :src="getImageUrl(product.productImg)" :alt="product.productName" />
              <div class="card-overlay">
                <el-button type="primary" circle size="small" class="overlay-btn" @click.stop="addToCart(product)">
                  <el-icon><ShoppingCart /></el-icon>
                </el-button>
              </div>
            </div>
            <div class="card-content">
              <h3 class="card-name">{{ product.productName }}</h3>
              <p class="card-desc">{{ product.description || '暂无描述' }}</p>
              <div class="card-footer">
                <span class="card-price">¥{{ product.sellingPrice }}</span>
                <span class="card-sales">已售 {{ product.sales || 0 }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ✦ 底部装饰 -->
    <div class="footer-decoration">
      <div class="wave-shape"></div>
      <div class="footer-content container">
        <p>🌸 新鲜好物 每日上新 · 品质生活从超市商城开始 🌸</p>
      </div>
    </div>

    <!-- 购物车悬浮按钮 -->
    <div class="cart-float" @click="goToCart">
      <el-badge :value="cartCount" :hidden="cartCount === 0" class="cart-badge">
        <div class="cart-float-inner">
          <el-icon :size="24"><ShoppingCart /></el-icon>
        </div>
      </el-badge>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, ShoppingCart } from '@element-plus/icons-vue'
import { getTopCategories } from '@/api/shopCategory'
import { getHotProducts, getCarouselProducts } from '@/api/shopProduct'
import { addToCart as addToCartApi, getCartList } from '@/api/cart'

const router = useRouter()

const searchKeyword = ref('')
const activeCategory = ref('all')
const topCategories = ref([])
const hotProducts = ref([])
const carouselProducts = ref([])
const cartCount = ref(0)

// 分类 emoji 列表
const categoryEmojis = ['🥩', '🥬', '🍞', '🥛', '🍜', '🧴', '🍺', '🍫', '🧊', '🫘', '🥤', '🍿']
const getCategoryEmoji = (index) => categoryEmojis[index % categoryEmojis.length]

const getImageUrl = (imagePath) => {
  if (!imagePath) return ''
  return `/api${imagePath}`
}

const loadTopCategories = async () => {
  try {
    const res = await getTopCategories()
    if (res.code === 200) topCategories.value = res.data || []
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

const loadHotProducts = async () => {
  try {
    const res = await getHotProducts(10)
    if (res.code === 200) hotProducts.value = res.data || []
  } catch (error) {
    console.error('加载热销商品失败:', error)
  }
}

const loadCarouselProducts = async () => {
  try {
    const res = await getCarouselProducts()
    if (res.code === 200) carouselProducts.value = res.data || []
  } catch (error) {
    console.error('加载轮播商品失败:', error)
  }
}

const loadCartCount = async () => {
  try {
    const res = await getCartList()
    if (res.code === 200) cartCount.value = res.data?.length || 0
  } catch (error) { /* ignore */ }
}

const handleCategorySelect = (index) => {
  activeCategory.value = index
  if (index === 'all') {
    router.push('/shop/products')
  } else {
    router.push(`/shop/products?categoryId=${index}`)
  }
}

const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    router.push(`/shop/products?keyword=${searchKeyword.value}`)
  }
}

const addToCart = async (product) => {
  try {
    const res = await addToCartApi(product.id, 1)
    if (res.code === 200) {
      ElMessage.success('已加入购物车 🎉')
      loadCartCount()
    } else {
      ElMessage.error(res.msg || '加入购物车失败')
    }
  } catch (error) {
    ElMessage.error('加入购物车失败')
  }
}

const goToProductDetail = (productId) => {
  router.push(`/shop/product/${productId}`)
}

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
/* ========== 全局基础 ========== */
.shop-home {
  min-height: 100vh;
  background: #f5f7fc;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.container {
  max-width: 1160px;
  margin: 0 auto;
  padding: 0 20px;
}

/* ========== Hero 横幅 ========== */
.hero-section {
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #9b8dd4 40%, #e8a0bf 100%);
  padding: 60px 0 70px;
  overflow: hidden;
}

.hero-decor {
  position: absolute;
  pointer-events: none;
}

.deco-circle {
  border-radius: 50%;
  opacity: 0.12;
}

.deco-1 {
  width: 300px;
  height: 300px;
  background: white;
  top: -80px;
  right: -60px;
}

.deco-2 {
  width: 180px;
  height: 180px;
  background: white;
  bottom: -40px;
  left: -40px;
}

.deco-star {
  font-size: 28px;
  color: rgba(255, 255, 255, 0.4);
  animation: float 4s ease-in-out infinite;
}

.deco-3 { top: 30px; left: 12%; animation-delay: 0s; }
.deco-4 { top: 50px; right: 20%; font-size: 36px; animation-delay: 1.2s; }
.deco-5 { bottom: 30px; left: 35%; animation-delay: 2.4s; }

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-14px) rotate(6deg); }
}

.hero-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  z-index: 1;
}

.hero-text {
  flex: 1;
  max-width: 520px;
}

.hero-title {
  margin: 0 0 14px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.title-line {
  font-size: 22px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 400;
}

.title-highlight {
  font-size: 40px;
  font-weight: 800;
  color: white;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
}

.title-emoji {
  font-size: 36px;
  animation: bounce-emoji 2s ease-in-out infinite;
}

@keyframes bounce-emoji {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.hero-subtitle {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.85);
  margin: 0 0 28px;
  letter-spacing: 1px;
}

.hero-search-input {
  max-width: 460px;
}

.hero-search-input :deep(.el-input__wrapper) {
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding-left: 16px;
}

.hero-search-input :deep(.el-input-group__append) {
  border-radius: 0 12px 12px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
}

.hero-search-input :deep(.el-input-group__append .el-button) {
  color: white;
}

/* 可爱购物袋插画 */
.hero-illustration {
  flex-shrink: 0;
  margin-left: 40px;
}

.bag-body {
  width: 160px;
  height: 180px;
  background: linear-gradient(180deg, #ffecd2 0%, #fcb69f 100%);
  border-radius: 8px 8px 24px 24px;
  position: relative;
  box-shadow: 0 8px 30px rgba(252, 182, 159, 0.4);
  animation: bag-float 3s ease-in-out infinite;
}

@keyframes bag-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.bag-handle {
  position: absolute;
  top: -28px;
  left: 50%;
  transform: translateX(-50%);
  width: 70px;
  height: 36px;
  border: 6px solid #f7c5a8;
  border-bottom: none;
  border-radius: 35px 35px 0 0;
}

.bag-face {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.bag-eyes {
  display: flex;
  gap: 18px;
  justify-content: center;
  font-size: 22px;
  color: #5d4037;
}

.bag-mouth {
  font-size: 20px;
  color: #5d4037;
  margin-top: 2px;
}

.bag-items {
  position: absolute;
  top: -18px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 4px;
}

.bag-item {
  font-size: 22px;
  animation: item-pop 2s ease-in-out infinite;
}

.item-1 { animation-delay: 0s; }
.item-2 { animation-delay: 0.4s; }
.item-3 { animation-delay: 0.8s; }

@keyframes item-pop {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-6px) rotate(-5deg); }
}

/* ========== 分类导航 ========== */
.category-section {
  padding: 40px 0 10px;
}

.section-header {
  margin-bottom: 24px;
}

.section-title {
  font-size: 22px;
  font-weight: 700;
  color: #2d3142;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 24px;
}

.section-subtitle {
  font-size: 13px;
  color: #9a9eb8;
  margin: 6px 0 0;
}

.category-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

.category-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 18px 22px;
  background: white;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent;
  box-shadow: 0 2px 8px rgba(100, 120, 180, 0.06);
  min-width: 90px;
  animation: fadeInUp 0.4s ease forwards;
  animation-delay: var(--delay, 0s);
}

.category-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.15);
  border-color: #a5b4fc;
}

.category-card.active {
  background: linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%);
  border-color: #818cf8;
}

.category-icon {
  font-size: 30px;
  line-height: 1;
}

.category-name {
  font-size: 13px;
  color: #4a4e5c;
  font-weight: 500;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ========== 轮播推荐 ========== */
.carousel-section {
  padding: 36px 0;
}

.styled-carousel :deep(.el-carousel__container) {
  border-radius: 16px;
  overflow: hidden;
}

.carousel-card {
  display: flex;
  height: 100%;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.3s;
}

.carousel-card:hover {
  box-shadow: 0 8px 30px rgba(100, 120, 180, 0.12);
}

.carousel-img {
  width: 45%;
  overflow: hidden;
  background: #f0f2f8;
}

.carousel-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.carousel-card:hover .carousel-img img {
  transform: scale(1.06);
}

.carousel-info {
  flex: 1;
  padding: 36px 32px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.carousel-info h3 {
  font-size: 24px;
  color: #2d3142;
  margin: 0 0 12px;
  font-weight: 700;
}

.carousel-desc {
  font-size: 14px;
  color: #9a9eb8;
  line-height: 1.6;
  margin: 0 0 24px;
}

.carousel-price {
  display: flex;
  align-items: center;
  gap: 16px;
}

.price-value {
  font-size: 28px;
  font-weight: 800;
  color: #e74860;
}

.carousel-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  padding: 8px 20px;
}

.carousel-btn:hover {
  background: linear-gradient(135deg, #5a6fd6 0%, #6b3f99 100%);
}

/* ========== 热销排行 ========== */
.hot-section {
  padding: 36px 0 50px;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 20px;
}

.product-card {
  position: relative;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 10px rgba(100, 120, 180, 0.07);
}

.product-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.15);
}

.rank-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: white;
  z-index: 2;
}

.rank-1 {
  background: linear-gradient(135deg, #ffd700 0%, #ffb347 100%);
  box-shadow: 0 2px 8px rgba(255, 179, 71, 0.4);
}

.rank-2 {
  background: linear-gradient(135deg, #c0c0c0 0%, #a8a8a8 100%);
  box-shadow: 0 2px 8px rgba(168, 168, 168, 0.4);
}

.rank-3 {
  background: linear-gradient(135deg, #cd7f32 0%, #b8672e 100%);
  box-shadow: 0 2px 8px rgba(184, 103, 46, 0.4);
}

.card-image {
  position: relative;
  width: 100%;
  height: 190px;
  overflow: hidden;
  background: #f5f6fa;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.product-card:hover .card-image img {
  transform: scale(1.08);
}

.card-overlay {
  position: absolute;
  inset: 0;
  background: rgba(45, 49, 66, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.product-card:hover .card-overlay {
  opacity: 1;
}

.overlay-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  border: none !important;
  width: 42px;
  height: 42px;
}

.overlay-btn:hover {
  transform: scale(1.1);
}

.card-content {
  padding: 14px 16px 18px;
}

.card-name {
  font-size: 14px;
  font-weight: 600;
  color: #2d3142;
  margin: 0 0 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-desc {
  font-size: 12px;
  color: #9a9eb8;
  margin: 0 0 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-price {
  font-size: 18px;
  font-weight: 800;
  color: #e74860;
}

.card-sales {
  font-size: 12px;
  color: #b0b4c8;
}

/* ========== 底部装饰 ========== */
.footer-decoration {
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #9b8dd4 50%, #e8a0bf 100%);
  padding: 40px 0 30px;
  margin-top: 20px;
}

.wave-shape {
  position: absolute;
  top: -40px;
  left: 0;
  right: 0;
  height: 40px;
  background: #f5f7fc;
  clip-path: ellipse(55% 100% at 50% 0%);
}

.footer-content {
  text-align: center;
}

.footer-content p {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  margin: 0;
  letter-spacing: 1px;
}

/* ========== 购物车悬浮按钮 ========== */
.cart-float {
  position: fixed;
  right: 32px;
  bottom: 100px;
  z-index: 999;
  cursor: pointer;
}

.cart-float-inner {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
  transition: all 0.3s;
}

.cart-float-inner:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 24px rgba(102, 126, 234, 0.5);
}

:deep(.el-badge__content) {
  background: #e74860;
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .hero-content {
    flex-direction: column;
    text-align: center;
  }

  .hero-illustration {
    margin-left: 0;
    margin-top: 30px;
  }

  .title-highlight {
    font-size: 30px;
  }

  .hero-search-input {
    max-width: 100%;
  }

  .category-grid {
    justify-content: center;
  }

  .carousel-card {
    flex-direction: column;
  }

  .carousel-img {
    width: 100%;
    height: 180px;
  }

  .carousel-info {
    padding: 20px;
  }

  .product-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .cart-float {
    right: 16px;
    bottom: 16px;
  }
}
</style>
