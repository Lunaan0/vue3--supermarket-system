<template>
  <div class="shop-layout">
    <el-header class="header">
      <div class="header-content">
        <div class="logo">
          <h2>超市商城</h2>
        </div>
        <div class="nav-menu">
          <el-menu mode="horizontal" :default-active="$route.path" router :ellipsis="false">
            <el-menu-item index="/shop/home">首页</el-menu-item>
            <el-menu-item index="/shop/products">商品</el-menu-item>
            <el-menu-item index="/shop/cart">购物车</el-menu-item>
            <el-menu-item index="/shop/orders">订单</el-menu-item>
            <el-menu-item index="/shop/member">会员中心</el-menu-item>
          </el-menu>
        </div>
        <div class="user-info">
          <el-dropdown @command="handleCommand">
            <span class="el-dropdown-link">
              <el-avatar 
                :size="30" 
                :src="userAvatarUrl" 
                class="header-avatar"
              >
                <el-icon :size="14"><User /></el-icon>
              </el-avatar>
              <span class="header-username">{{ userProfile.realName || user?.account || '用户' }}</span>
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </el-header>
    
    <el-main class="main">
      <router-view />
    </el-main>
    
    <el-footer class="footer">
      <div class="footer-content">
        <p>&copy; 2024 超市管理系统. All rights reserved.</p>
      </div>
    </el-footer>
    
    <!-- AI 购物助手 -->
    <AiChatWidget />
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { ElMessage } from 'element-plus'
import { ArrowDown, User } from '@element-plus/icons-vue'
import AiChatWidget from '../components/AiChatWidget/index.vue'
import { getUserProfile } from '@/api/profile'

const router = useRouter()
const authStore = useAuthStore()

const user = computed(() => authStore.user)

// 用户个人信息
const userProfile = ref({})
const baseUrl = import.meta.env.VITE_APP_BASE_API

const userAvatarUrl = computed(() => {
  const avatar = userProfile.value.avatar
  if (!avatar) return ''
  if (avatar.startsWith('http')) return avatar
  return baseUrl + avatar
})

const loadUserProfile = async () => {
  try {
    const res = await getUserProfile()
    if (res.code === 200) {
      userProfile.value = res.data || {}
    }
  } catch (error) {
    console.error('加载用户信息失败:', error)
  }
}

onMounted(() => {
  loadUserProfile()
})

const handleCommand = (command) => {
  if (command === 'logout') {
    authStore.logout()
    ElMessage.success('退出登录成功')
    router.push('/login')
  } else if (command === 'profile') {
    router.push('/shop/profile')
  }
}
</script>

<style scoped>
.shop-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background-color: #fff;
  border-bottom: 1px solid #eef0f8;
  box-shadow: 0 2px 12px rgba(102, 126, 234, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.logo h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 1px;
  cursor: pointer;
}

.nav-menu {
  flex: 1;
  display: flex;
  justify-content: center;
}

/* 覆盖 el-menu 默认样式，确保所有菜单项展示 */
.nav-menu :deep(.el-menu) {
  border-bottom: none;
  display: flex;
  flex-wrap: nowrap;
  overflow: visible !important;
}

/* 禁用 el-menu 的溢出折叠机制 */
.nav-menu :deep(.el-menu--horizontal) {
  flex-wrap: nowrap !important;
  overflow: visible !important;
}

/* 确保所有菜单项始终可见，不被折叠 */
.nav-menu :deep(.el-menu--horizontal > .el-menu-item) {
  font-size: 15px;
  font-weight: 500;
  color: #4a4e6a;
  padding: 0 20px;
  height: 60px;
  line-height: 60px;
  border-bottom: 3px solid transparent;
  transition: all 0.3s;
  flex-shrink: 0;
}

.nav-menu :deep(.el-menu--horizontal > .el-menu-item:hover) {
  color: #667eea;
  background: transparent;
}

.nav-menu :deep(.el-menu--horizontal > .el-menu-item.is-active) {
  color: #667eea;
  border-bottom-color: #667eea;
  background: transparent;
}

/* 隐藏省略号按钮(el-menu-overflow的more子菜单) */
.nav-menu :deep(.el-menu--horizontal > .el-sub-menu) {
  display: none !important;
}

.user-info {
  margin-left: 20px;
  flex-shrink: 0;
}

.el-dropdown-link {
  cursor: pointer;
  color: #4a4e6a;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: color 0.3s;
}

.el-dropdown-link:hover {
  color: #667eea;
}

.header-avatar {
  flex-shrink: 0;
  border: 2px solid #a5b4fc;
}

.header-username {
  font-size: 14px;
  font-weight: 500;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.main {
  flex: 1;
  background-color: #f5f7fc;
  padding: 0;
}

.footer {
  background: linear-gradient(135deg, #2d3142 0%, #4a4e6a 100%);
  color: rgba(255, 255, 255, 0.85);
  padding: 20px 0;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
  padding: 0 20px;
}

.footer-content p {
  margin: 0;
  font-size: 13px;
}
</style>
