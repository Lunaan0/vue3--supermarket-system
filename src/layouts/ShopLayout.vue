<template>
  <div class="shop-layout">
    <el-header class="header">
      <div class="header-content">
        <div class="logo">
          <h2>超市商城</h2>
        </div>
        <div class="nav-menu">
          <el-menu mode="horizontal" :default-active="$route.path" router>
            <el-menu-item index="/shop/home">首页</el-menu-item>
            <el-menu-item index="/shop/products">商品</el-menu-item>
            <el-menu-item index="/shop/cart">购物车</el-menu-item>
            <el-menu-item index="/shop/orders">订单</el-menu-item>
          </el-menu>
        </div>
        <div class="user-info">
          <el-dropdown @command="handleCommand">
            <span class="el-dropdown-link">
              {{ user?.account || '用户' }}
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
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { ElMessage } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import AiChatWidget from '../components/AiChatWidget/index.vue'

const router = useRouter()
const authStore = useAuthStore()

const user = computed(() => authStore.user)

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
  border-bottom: 1px solid #e6e6e6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.logo h2 {
  margin: 0;
  color: #409EFF;
  font-size: 24px;
}

.nav-menu {
  /* flex: 1; */
  min-width: 500px;
  display: flex;
  justify-content: center;
}

.user-info {
  margin-left: 20px;
}

.el-dropdown-link {
  cursor: pointer;
  color: #333;
  display: flex;
  align-items: center;
}

.main {
  flex: 1;
  background-color: #f5f5f5;
  padding: 20px;
}

.footer {
  background-color: #333;
  color: white;
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
}
</style>
