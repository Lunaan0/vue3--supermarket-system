<template>
  <div class="shop-cart">
    <!-- 顶部导航栏 -->
    <div class="top-bar">
      <div class="container">
        <div class="logo" @click="goToHome">超市商城</div>
        <div class="nav-links">
          <el-button text @click="goToHome">首页</el-button>
          <el-button text @click="goToProducts">商品</el-button>
          <el-button text type="primary">购物车</el-button>
        </div>
        <div class="user-info">
          <span>欢迎, {{ userStore.user?.username || '游客' }}</span>
        </div>
      </div>
    </div>

    <!-- 购物车内容 -->
    <div class="cart-content">
      <div class="container">
        <h2 class="page-title">我的购物车</h2>

        <!-- 购物车列表 -->
        <div v-if="cartList.length > 0" class="cart-list">
          <!-- 表头 -->
          <div class="cart-header">
            <div class="header-checkbox">
              <el-checkbox 
                :model-value="isAllChecked" 
                @change="handleCheckAll"
                :indeterminate="isIndeterminate">
                全选
              </el-checkbox>
            </div>
            <div class="header-product">商品信息</div>
            <div class="header-price">单价</div>
            <div class="header-quantity">数量</div>
            <div class="header-subtotal">小计</div>
            <div class="header-action">操作</div>
          </div>

          <!-- 购物车项 -->
          <div 
            v-for="item in cartList" 
            :key="item.id" 
            class="cart-item"
            :class="{ 'out-of-stock': item.stock <= 0 }">
            <div class="item-checkbox">
              <el-checkbox 
                :model-value="item.checked === 1"
                @change="handleCheckItem(item)"
                :disabled="item.stock <= 0" />
            </div>
            <div class="item-product">
              <img :src="getImageUrl(item.productImg)" :alt="item.productName" />
              <div class="product-details">
                <div class="product-name">{{ item.productName }}</div>
                <el-tag v-if="item.stock <= 0" type="danger" size="small">库存不足</el-tag>
                <el-tag v-else type="success" size="small">库存: {{ item.stock }}</el-tag>
              </div>
            </div>
            <div class="item-price">
              <span class="current-price">¥{{ item.sellingPrice }}</span>
              <span v-if="item.discount < 1" class="discount-tag">
                {{ (item.discount * 10).toFixed(1) }}折
              </span>
            </div>
            <div class="item-quantity">
              <el-input-number 
                v-model="item.quantity"
                @change="handleQuantityChange(item, $event)"
                :min="1"
                :max="item.stock"
                :disabled="item.stock <= 0"
                size="small" />
            </div>
            <div class="item-subtotal">
              <span class="subtotal-price">¥{{ (item.quantity * item.sellingPrice * (item.discount || 1)).toFixed(2) }}</span>
            </div>
            <div class="item-action">
              <el-button 
                type="danger" 
                text 
                @click="handleRemove(item)">
                删除
              </el-button>
            </div>
          </div>
        </div>

        <!-- 空购物车 -->
        <el-empty 
          v-else 
          description="购物车是空的"
          :image-size="200">
          <el-button type="primary" @click="goToProducts">去购物</el-button>
        </el-empty>

        <!-- 底部结算栏 -->
        <div v-if="cartList.length > 0" class="cart-footer">
          <div class="footer-left">
            <el-checkbox 
              :model-value="isAllChecked"
              @change="handleCheckAll"
              :indeterminate="isIndeterminate">
              全选
            </el-checkbox>
            <el-button 
              type="danger" 
              text 
              @click="handleClearCart"
              :disabled="checkedItems.length === 0">
              清空已选商品
            </el-button>
          </div>
          <div class="footer-right">
            <div class="total-info">
              <span class="total-label">已选商品</span>
              <span class="total-count">{{ checkedItems.length }}</span>
              <span class="total-label">件</span>
            </div>
            <!-- 会员折扣信息 -->
            <div v-if="isValidMember" class="member-discount-info">
              <el-tag type="warning" size="small" class="member-tag">
                {{ memberInfo.memberLevel }} {{ (memberDiscount * 10).toFixed(1) }}折
              </el-tag>
              <span class="original-price">原价: ¥{{ totalPrice.toFixed(2) }}</span>
              <span class="saved-amount">已省: ¥{{ savedAmount }}</span>
            </div>
            <div class="total-price-info">
              <span class="total-label">{{ isValidMember ? '折后价:' : '合计:' }}</span>
              <span class="total-price">¥{{ discountedTotalPrice }}</span>
            </div>
            <el-button 
              type="primary" 
              size="large"
              class="checkout-btn"
              :disabled="checkedItems.length === 0"
              @click="handleCheckout">
              结算
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  getCartList, 
  updateCartQuantity, 
  updateCartChecked, 
  updateAllChecked, 
  removeFromCart,
  clearCart 
} from '@/api/cart'
import { createOrder, payOrder } from '@/api/order'
import { getCurrentMemberInfo } from '@/api/shopMember'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const userStore = useAuthStore()

const cartList = ref([])
const memberInfo = ref(null) // 会员信息

// 获取图片URL
const getImageUrl = (imagePath) => {
  if (!imagePath) return ''
  return `/api${imagePath}`
}

// 判断会员是否有效（未过期且等级大于0）
const isValidMember = computed(() => {
  if (!memberInfo.value || !memberInfo.value.level || memberInfo.value.level === 0) {
    return false
  }
  // 检查是否过期
  if (memberInfo.value.expireTime) {
    const expireDate = new Date(memberInfo.value.expireTime)
    return expireDate > new Date()
  }
  return true
})

// 会员折扣
const memberDiscount = computed(() => {
  if (isValidMember.value && memberInfo.value.discount) {
    return parseFloat(memberInfo.value.discount)
  }
  return 1
})

// 已选中的商品
const checkedItems = computed(() => {
  return cartList.value.filter(item => item.checked === 1 && item.stock > 0)
})

// 是否全选
const isAllChecked = computed(() => {
  const validItems = cartList.value.filter(item => item.stock > 0)
  return validItems.length > 0 && checkedItems.value.length === validItems.length
})

// 是否半选
const isIndeterminate = computed(() => {
  const validItems = cartList.value.filter(item => item.stock > 0)
  return checkedItems.value.length > 0 && checkedItems.value.length < validItems.length
})

// 总价（原价）- 已包含商品折扣
const totalPrice = computed(() => {
  return checkedItems.value.reduce((sum, item) => {
    return sum + (item.quantity * item.sellingPrice * (item.discount || 1))
  }, 0)
})

// 折扣后的总价（实际支付金额）
const discountedTotalPrice = computed(() => {
  return (totalPrice.value * memberDiscount.value).toFixed(2)
})

// 节省的金额
const savedAmount = computed(() => {
  return (totalPrice.value - parseFloat(discountedTotalPrice.value)).toFixed(2)
})

// 加载会员信息
const loadMemberInfo = async () => {
  try {
    const res = await getCurrentMemberInfo()
    if (res.code === 200) {
      memberInfo.value = res.data
    }
  } catch (error) {
    console.error('加载会员信息失败:', error)
  }
}

// 加载购物车列表
const loadCartList = async () => {
  try {
    const res = await getCartList()
    if (res.code === 200) {
      cartList.value = res.data || []
    }
  } catch (error) {
    console.error('加载购物车失败:', error)
    ElMessage.error('加载购物车失败')
  }
}

// 全选/取消全选
const handleCheckAll = async (checked) => {
  try {
    const res = await updateAllChecked(checked)
    if (res.code === 200) {
      await loadCartList()
    }
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 单项选中
const handleCheckItem = async (item) => {
  try {
    const res = await updateCartChecked({
      id: item.id,
      checked: item.checked === 1 ? 0 : 1
    })
    if (res.code === 200) {
      await loadCartList()
    }
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 数量变化
const handleQuantityChange = async (item, quantity) => {
  if (quantity === item.quantity) return
  
  try {
    const res = await updateCartQuantity({
      id: item.id,
      quantity: quantity
    })
    if (res.code === 200) {
      // 静默更新，不显示成功提示
      await loadCartList()
    } else {
      ElMessage.error(res.msg || '更新失败')
      // 失败时恢复原数量
      await loadCartList()
    }
  } catch (error) {
    ElMessage.error('更新失败')
    // 失败时恢复原数量
    await loadCartList()
  }
}

// 删除商品
const handleRemove = async (item) => {
  try {
    await ElMessageBox.confirm('确定要删除该商品吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const res = await removeFromCart(item.id)
    if (res.code === 200) {
      await loadCartList()
      ElMessage.success('删除成功')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 清空购物车
const handleClearCart = async () => {
  try {
    await ElMessageBox.confirm('确定要清空已选商品吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 删除所有已选中的商品
    for (const item of checkedItems.value) {
      await removeFromCart(item.id)
    }
    
    await loadCartList()
    ElMessage.success('清空成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('清空失败')
    }
  }
}

// 结算
const handleCheckout = async () => {
  if (checkedItems.value.length === 0) {
    ElMessage.warning('请选择要结算的商品')
    return
  }
  
  // 弹出支付方式选择
  try {
    // 构建确认消息
    let confirmMessage = `共 ${checkedItems.value.length} 件商品`
    if (isValidMember.value) {
      confirmMessage += `\n原价: ¥${totalPrice.value.toFixed(2)}`
      confirmMessage += `\n会员折扣: ${(memberDiscount.value * 10).toFixed(1)}折`
      confirmMessage += `\n实付: ¥${discountedTotalPrice.value}`
      confirmMessage += `\n已省: ¥${savedAmount.value}`
    } else {
      confirmMessage += `\n合计: ¥${discountedTotalPrice.value}`
    }
    
    const { value: payType } = await ElMessageBox.confirm(
      confirmMessage,
      '确认结算',
      {
        confirmButtonText: '确认支付',
        cancelButtonText: '取消',
        type: 'info',
        distinguishCancelAndClose: true,
        inputType: 'select'
      }
    )

    // 创建订单
    const cartIds = checkedItems.value.map(item => item.id)
    const res = await createOrder({
      cartIds: cartIds,
      payType: 1, // 默认微信支付
      remark: ''
    })
    
    if (res.code === 200) {
      const order = res.data
      // 模拟支付
      const payRes = await payOrder(order.id, 1)
      if (payRes.code === 200) {
        ElMessage.success('支付成功!')
        router.push('/shop/orders')
      } else {
        ElMessage.warning('订单已创建，请在订单页面完成支付')
        router.push('/shop/orders')
      }
    } else {
      ElMessage.error(res.msg || '创建订单失败')
    }
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      console.error('结算失败:', error)
      ElMessage.error('结算失败')
    }
  }
}

// 跳转到首页
const goToHome = () => {
  router.push('/shop/home')
}

// 跳转到商品页
const goToProducts = () => {
  router.push('/shop/products')
}

onMounted(() => {
  loadCartList()
  loadMemberInfo()
})
</script>

<style scoped>
.shop-cart {
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

.logo {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 2px;
  cursor: pointer;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.1);
}

.nav-links {
  flex: 1;
  margin-left: 40px;
}

.nav-links .el-button {
  color: white;
  font-size: 16px;
}

.user-info {
  font-size: 14px;
  opacity: 0.9;
}

/* 购物车内容 */
.cart-content {
  padding: 30px 0;
}

.page-title {
  font-size: 28px;
  margin: 0 0 30px 0;
  color: #2d3142;
  font-weight: 700;
}

/* 购物车列表 */
.cart-list {
  background: white;
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(100, 120, 180, 0.07);
  overflow: hidden;
}

.cart-header,
.cart-item {
  display: grid;
  grid-template-columns: 60px 1fr 120px 150px 120px 80px;
  align-items: center;
  padding: 15px 20px;
  gap: 15px;
}

.cart-header {
  background: #f5f7fc;
  font-weight: bold;
  color: #6b7280;
  border-bottom: 2px solid #eef0f8;
}

.cart-item {
  border-bottom: 1px solid #eef0f8;
  transition: background-color 0.3s ease;
}

.cart-item:hover {
  background-color: #fafbff;
}

.cart-item.out-of-stock {
  opacity: 0.6;
  background-color: #f9f9fb;
}

/* 商品信息 */
.item-product {
  display: flex;
  align-items: center;
  gap: 15px;
}

.item-product img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #eef0f8;
}

.product-details {
  flex: 1;
}

.product-name {
  font-size: 14px;
  color: #2d3142;
  margin-bottom: 8px;
  line-height: 1.5;
}

/* 价格 */
.item-price {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
}

.current-price {
  font-size: 18px;
  color: #e74860;
  font-weight: 800;
}

.discount-tag {
  font-size: 12px;
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  padding: 2px 8px;
  border-radius: 6px;
}

/* 小计 */
.subtotal-price {
  font-size: 20px;
  color: #e74860;
  font-weight: 800;
}

/* 底部结算栏 */
.cart-footer {
  background: white;
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(100, 120, 180, 0.07);
  margin-top: 20px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 30px;
}

.total-info {
  font-size: 14px;
  color: #6b7280;
}

.total-count {
  color: #667eea;
  font-weight: bold;
  font-size: 18px;
  margin: 0 5px;
}

/* 会员折扣信息样式 */
.member-discount-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%);
  border-radius: 8px;
  border: 1px solid #fcd34d;
}

.member-tag {
  font-weight: 600;
}

.original-price {
  font-size: 13px;
  color: #9ca3af;
  text-decoration: line-through;
}

.saved-amount {
  font-size: 13px;
  color: #ef4444;
  font-weight: 600;
}

.total-price-info {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.total-label {
  font-size: 14px;
  color: #6b7280;
}

.total-price {
  font-size: 28px;
  color: #e74860;
  font-weight: 800;
}

.checkout-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  padding: 12px 40px;
  font-size: 16px;
  border-radius: 10px;
}

.checkout-btn:hover {
  background: linear-gradient(135deg, #5a6fd6 0%, #6b3f99 100%);
}

/* 响应式 */
@media (max-width: 1024px) {
  .cart-header,
  .cart-item {
    grid-template-columns: 50px 1fr 100px 130px 100px 70px;
    gap: 10px;
    padding: 12px 15px;
  }
  
  .item-product img {
    width: 60px;
    height: 60px;
  }
}

@media (max-width: 768px) {
  .cart-header {
    display: none;
  }
  
  .cart-item {
    grid-template-columns: 40px 1fr;
    gap: 10px;
  }
  
  .item-product {
    grid-column: 1 / -1;
  }
  
  .item-price,
  .item-quantity,
  .item-subtotal {
    grid-column: 2;
  }
  
  .item-action {
    grid-column: 2;
    text-align: right;
  }
  
  .cart-footer {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .footer-right {
    justify-content: space-between;
  }
  
  .checkout-btn {
    width: 100%;
  }
}
</style>
