<template>
  <div class="admin-layout">
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
          <template v-for="menu in filteredMenus" :key="menu.index">
            <!-- 有子菜单 -->
            <el-sub-menu v-if="menu.children && menu.children.length" :index="menu.index">
              <template #title>
                <el-icon><component :is="menu.icon" /></el-icon>
                <span>{{ menu.title }}</span>
              </template>
              <el-menu-item 
                v-for="child in menu.children" 
                :key="child.index" 
                :index="child.index"
              >
                {{ child.title }}
              </el-menu-item>
            </el-sub-menu>
            <!-- 无子菜单 -->
            <el-menu-item v-else :index="menu.index">
              <el-icon><component :is="menu.icon" /></el-icon>
              <span>{{ menu.title }}</span>
            </el-menu-item>
          </template>
        </el-menu>
      </el-aside>
      
      <el-container>
        <el-header class="header">
          <div class="header-content">
            <span class="welcome">欢迎，{{ roleText }}</span>
            <el-dropdown @command="handleCommand">
              <span class="el-dropdown-link">
                {{ user?.username }}
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
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import { adminMenus, filterMenusByPermission } from '@/config/menu'
import { 
  House, 
  User, 
  Document, 
  Files, 
  Goods, 
  Box, 
  UserFilled, 
  Setting,
  Van,
  ArrowDown
} from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()

const user = computed(() => authStore.user)
const permissionCodes = computed(() => authStore.permissionCodes)

// 根据权限过滤菜单
const filteredMenus = computed(() => {
  // 深拷贝菜单配置，避免修改原数据
  const menusCopy = JSON.parse(JSON.stringify(adminMenus))
  return filterMenusByPermission(menusCopy, permissionCodes.value)
})

// 角色显示文本
const roleText = computed(() => {
  if (permissionCodes.value.includes('ALL')) return '管理员'
  if (permissionCodes.value.includes('OPER')) return '员工'
  return '用户'
})

const handleCommand = async (command) => {
  if (command === 'logout') {
    await authStore.logout()
    ElMessage.success('退出登录成功')
    router.push('/login')
  }
}
</script>

<style scoped>
.admin-layout {
  height: 100vh;
  width: 100%;
}

.admin-layout > .el-container {
  height: 100%;
}

.sidebar {
  background-color: #304156;
  height: 100%;
  overflow-y: auto;
}

.sidebar .el-menu {
  border-right: none;
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

/* 右侧容器 */
.admin-layout > .el-container > .el-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  flex-shrink: 0;
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
  flex: 1;
  overflow-y: auto;
}
</style>
