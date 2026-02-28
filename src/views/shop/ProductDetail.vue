<template>
  <div class="product-detail" v-loading="loading">
    <!-- 面包屑 -->
    <div class="breadcrumb-bar">
      <div class="container">
        <div class="breadcrumb-content">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/shop/home' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item :to="{ path: '/shop/products' }">商品列表</el-breadcrumb-item>
            <el-breadcrumb-item>{{ product.productName }}</el-breadcrumb-item>
          </el-breadcrumb>
          <el-button type="primary" plain size="small" @click="goBackToProducts">
            <el-icon><Back /></el-icon>
            返回商品列表
          </el-button>
        </div>
      </div>
    </div>

    <div class="container" v-if="product.id">
      <!-- 商品主体 -->
      <div class="product-main">
        <!-- 左侧图片 -->
        <div class="product-gallery">
          <div class="main-image">
            <img :src="getImageUrl(currentImage)" :alt="product.productName" />
          </div>
          <div class="image-thumbs" v-if="imageList.length > 1">
            <div 
              v-for="(img, index) in imageList" 
              :key="index" 
              class="thumb-item"
              :class="{ active: currentImage === img }"
              @click="currentImage = img"
            >
              <img :src="getImageUrl(img)" />
            </div>
          </div>
        </div>

        <!-- 右侧信息 -->
        <div class="product-info">
          <h1 class="product-name">{{ product.productName }}</h1>
          <p class="product-desc">{{ product.description || '暂无描述' }}</p>
          
          <div class="price-box">
            <div class="price-row">
              <span class="label">售价</span>
              <span class="price">¥{{ product.sellingPrice }}</span>
              <span class="discount-tag" v-if="product.discount && product.discount < 1">
                {{ (product.discount * 10).toFixed(1) }}折
              </span>
            </div>
          </div>

          <div class="info-rows">
            <div class="info-row">
              <span class="label">规格</span>
              <span class="value">{{ product.specification || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="label">单位</span>
              <span class="value">{{ product.unit || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="label">分类</span>
              <span class="value">{{ product.categoryName || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="label">供应商</span>
              <span class="value">{{ product.supplierName || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="label">库存</span>
              <span class="value" :class="{ 'low-stock': product.stock < 10 }">
                {{ product.stock > 0 ? `有货 (${product.stock})` : '暂时缺货' }}
              </span>
            </div>
            <div class="info-row">
              <span class="label">销量</span>
              <span class="value">{{ product.sales || 0 }}</span>
            </div>
          </div>

          <div class="action-row">
            <div class="quantity-picker">
              <span class="label">数量</span>
              <el-input-number v-model="quantity" :min="1" :max="product.stock || 99" size="large" />
            </div>
            <div class="action-buttons">
              <el-button type="primary" size="large" class="btn-add-cart" @click="handleAddToCart" :disabled="product.stock <= 0">
                <el-icon><ShoppingCart /></el-icon>
                加入购物车
              </el-button>
              <el-button type="danger" size="large" class="btn-buy-now" @click="handleBuyNow" :disabled="product.stock <= 0">
                立即购买
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 商品详情标签页 -->
      <div class="product-detail-tabs">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="商品详情" name="detail">
            <div class="detail-content">
              <div v-if="product.description" class="description-text">
                {{ product.description }}
              </div>
              <div v-if="product.subImage" class="detail-images">
                <img 
                  v-for="(img, index) in subImageList" 
                  :key="index" 
                  :src="getImageUrl(img)" 
                  :alt="`${product.productName} 详情图 ${index + 1}`"
                />
              </div>
              <el-empty v-if="!product.description && !product.subImage" description="暂无详细介绍" />
            </div>
          </el-tab-pane>
          <el-tab-pane label="商品规格" name="spec">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="商品名称">{{ product.productName }}</el-descriptions-item>
              <el-descriptions-item label="商品编号">{{ product.productCode || '-' }}</el-descriptions-item>
              <el-descriptions-item label="规格">{{ product.specification || '-' }}</el-descriptions-item>
              <el-descriptions-item label="单位">{{ product.unit || '-' }}</el-descriptions-item>
              <el-descriptions-item label="分类">{{ product.categoryName || '-' }}</el-descriptions-item>
              <el-descriptions-item label="供应商">{{ product.supplierName || '-' }}</el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <!-- 商品不存在 -->
    <div class="container" v-if="!loading && !product.id">
      <el-result icon="warning" title="商品不存在" sub-title="该商品可能已下架或不存在">
        <template #extra>
          <el-button type="primary" @click="$router.push('/shop/products')">返回商品列表</el-button>
        </template>
      </el-result>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ShoppingCart, Back } from '@element-plus/icons-vue'
import { getProductDetail } from '@/api/shopProduct'
import { addToCart as addToCartApi } from '@/api/cart'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const product = ref({})
const quantity = ref(1)
const currentImage = ref('')
const activeTab = ref('detail')

// 获取图片URL
const getImageUrl = (imagePath) => {
  if (!imagePath) return ''
  return `/api${imagePath}`
}

// 商品图片列表
const imageList = computed(() => {
  const imgs = []
  if (product.value.productImg) {
    imgs.push(...product.value.productImg.split(',').filter(Boolean))
  }
  if (product.value.subImage) {
    imgs.push(...product.value.subImage.split(',').filter(Boolean))
  }
  return [...new Set(imgs)]
})

// 详情图列表
const subImageList = computed(() => {
  if (!product.value.subImage) return []
  return product.value.subImage.split(',').filter(Boolean)
})

// 加载商品详情
const loadProduct = async () => {
  const id = route.params.id
  if (!id) return

  loading.value = true
  try {
    const res = await getProductDetail(id)
    if (res.code === 200 && res.data) {
      product.value = res.data
      // 设置默认展示图片
      if (res.data.productImg) {
        currentImage.value = res.data.productImg.split(',')[0]
      }
    } else {
      ElMessage.error(res.msg || '商品不存在')
    }
  } catch (error) {
    console.error('加载商品详情失败:', error)
    ElMessage.error('加载失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 加入购物车
const handleAddToCart = async () => {
  try {
    const res = await addToCartApi(product.value.id, quantity.value)
    if (res.code === 200) {
      ElMessage.success('已加入购物车')
    } else {
      ElMessage.error(res.msg || '加入购物车失败')
    }
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 立即购买
const handleBuyNow = async () => {
  try {
    const res = await addToCartApi(product.value.id, quantity.value)
    if (res.code === 200) {
      router.push('/shop/cart')
    } else {
      ElMessage.error(res.msg || '操作失败')
    }
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 返回商品列表
const goBackToProducts = () => {
  router.push('/shop/products')
}

onMounted(() => {
  loadProduct()
})
</script>

<style scoped>
.product-detail {
  min-height: 60vh;
  padding-bottom: 40px;
  background: #f8f9fc;
}

.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 20px;
}

.breadcrumb-bar {
  background: white;
  padding: 14px 0;
  border-bottom: 1px solid #eef0f4;
  margin-bottom: 24px;
}

.breadcrumb-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.breadcrumb-content .el-button {
  margin-left: 20px;
}

/* 商品主体 */
.product-main {
  display: flex;
  gap: 36px;
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 2px 16px rgba(100, 120, 180, 0.07);
  margin-bottom: 28px;
}

/* 左侧图片 */
.product-gallery {
  width: 420px;
  flex-shrink: 0;
}

.main-image {
  width: 420px;
  height: 420px;
  border-radius: 12px;
  overflow: hidden;
  background: #f5f6fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.main-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.main-image:hover img {
  transform: scale(1.05);
}

.image-thumbs {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}

.thumb-item {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s;
  background: #f5f6fa;
}

.thumb-item.active,
.thumb-item:hover {
  border-color: #6b8aed;
  box-shadow: 0 0 0 2px rgba(107, 138, 237, 0.2);
}

.thumb-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 右侧信息 */
.product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.product-name {
  font-size: 24px;
  font-weight: 700;
  color: #2d3142;
  margin: 0 0 10px;
  line-height: 1.4;
}

.product-desc {
  font-size: 14px;
  color: #8b90a0;
  margin: 0 0 20px;
  line-height: 1.6;
}

.price-box {
  background: linear-gradient(135deg, #f0f4ff 0%, #fce4ec 100%);
  border-radius: 12px;
  padding: 18px 22px;
  margin-bottom: 20px;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.price-row .label {
  font-size: 13px;
  color: #8b90a0;
}

.price {
  font-size: 32px;
  font-weight: 800;
  color: #e74860;
}

.discount-tag {
  background: #e74860;
  color: white;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
}

.info-rows {
  flex: 1;
}

.info-row {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f1f5;
}

.info-row .label {
  width: 60px;
  font-size: 13px;
  color: #8b90a0;
  flex-shrink: 0;
}

.info-row .value {
  font-size: 14px;
  color: #2d3142;
}

.low-stock {
  color: #e74860 !important;
  font-weight: 600;
}

.action-row {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.quantity-picker {
  display: flex;
  align-items: center;
  gap: 12px;
}

.quantity-picker .label {
  font-size: 13px;
  color: #8b90a0;
}

.action-buttons {
  display: flex;
  gap: 14px;
}

.btn-add-cart {
  flex: 1;
  height: 46px;
  font-size: 15px;
  border-radius: 10px;
  background: linear-gradient(135deg, #6b8aed 0%, #8b6aed 100%);
  border: none;
}

.btn-add-cart:hover {
  background: linear-gradient(135deg, #5a79dc 0%, #7a59dc 100%);
}

.btn-buy-now {
  flex: 1;
  height: 46px;
  font-size: 15px;
  border-radius: 10px;
  background: linear-gradient(135deg, #e74860 0%, #ff6b81 100%);
  border: none;
}

.btn-buy-now:hover {
  background: linear-gradient(135deg, #d63b53 0%, #ee5a70 100%);
}

/* 详情标签页 */
.product-detail-tabs {
  background: white;
  border-radius: 16px;
  padding: 28px 32px;
  box-shadow: 0 2px 16px rgba(100, 120, 180, 0.07);
}

.detail-content {
  padding: 10px 0;
}

.description-text {
  font-size: 15px;
  line-height: 1.8;
  color: #4a4e5c;
  margin-bottom: 20px;
}

.detail-images img {
  width: 100%;
  border-radius: 8px;
  margin-bottom: 14px;
}

/* 响应式 */
@media (max-width: 768px) {
  .product-main {
    flex-direction: column;
    padding: 20px;
  }

  .product-gallery {
    width: 100%;
  }

  .main-image {
    width: 100%;
    height: 300px;
  }

  .action-buttons {
    flex-direction: column;
  }
}
</style>
