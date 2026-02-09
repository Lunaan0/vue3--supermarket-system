<template>
  <div class="employee-layout">
    <el-container>
      <el-aside width="200px" class="sidebar">
        <div class="logo">
          <h3>超市管理系统</h3>
        </div>
        <el-menu
          :default-active="$route.path"
          router
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
        >
          <el-menu-item index="/employee/dashboard">
            <el-icon><House /></el-icon>
            <span>首页</span>
          </el-menu-item>
          
          <el-menu-item index="/employee/suppliers">
            <el-icon><User /></el-icon>
            <span>供应商管理</span>
          </el-menu-item>
          
          <el-menu-item index="/employee/orders">
            <el-icon><Document /></el-icon>
            <span>订单管理</span>
          </el-menu-item>
          
          <el-menu-item index="/employee/categories">
            <el-icon><Files /></el-icon>
            <span>商品分类管理</span>
          </el-menu-item>
          
          <el-menu-item index="/employee/products">
            <el-icon><Goods /></el-icon>
            <span>商品管理</span>
          </el-menu-item>
          
          <el-menu-item index="/employee/inventory">
            <el-icon><Box /></el-icon>
            <span>库存管理</span>
          </el-menu-item>
          
          <el-menu-item index="/employee/members">
            <el-icon><UserFilled /></el-icon>
            <span>会员管理</span>
          </el-menu-item>
          
          <el-menu-item index="/employee/users">
            <el-icon><Setting /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      
      <el-container>
        <el-header class="header">
          <div class="header-content">
            <span class="welcome">欢迎，员工</span>
            <el-dropdown @command="handleCommand">
              <span class="el-dropdown-link">
                {{ user?.account }}
                <el-icon class="el-icon--right"><arrow-down /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>
        
        <el-main class="main">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../src/stores/auth'
import { ElMessage } from 'element-plus'
import { 
  House, 
  User, 
  Document, 
  Files, 
  Goods, 
  Box, 
  UserFilled, 
  Setting,
  ArrowDown
} from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()

const user = computed(() => authStore.user)

const handleCommand = (command) => {
  if (command === 'logout') {
    authStore.logout()
    ElMessage.success('退出登录成功')
    router.push('/login')
  }
}
</script>

<style scoped>
.employee-layout {
  height: 100vh;
}

.sidebar {
  background-color: #304156;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #263445;
  color: white;
  margin-bottom: 10px;
}

.logo h3 {
  margin: 0;
  font-size: 16px;
}

.header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
}

.header-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.welcome {
  color: #333;
  font-size: 16px;
}

.el-dropdown-link {
  cursor: pointer;
  color: #333;
  display: flex;
  align-items: center;
}

.main {
  background-color: #f5f5f5;
  padding: 20px;
}
</style>
