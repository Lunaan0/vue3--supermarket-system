<template>
  <div class="login-container">
    <div class="login-left">
      <div class="brand-info">
        <h1 class="brand-title">超市管理系统</h1>
        <p class="brand-subtitle">智能化管理，高效运营</p>
        <div class="feature-list">
          <div class="feature-item">
            <el-icon><Monitor /></el-icon>
            <span>全面的数据监控</span>
          </div>
          <div class="feature-item">
            <el-icon><Setting /></el-icon>
            <span>灵活的权限管理</span>
          </div>
          <div class="feature-item">
            <el-icon><TrendCharts /></el-icon>
            <span>实时的业务分析</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="login-right">
      <div class="login-card">
        <div class="login-header">
          <h2>欢迎登录</h2>
          <p>请输入您的登录信息</p>
        </div>
        
        <el-form :model="loginForm" :rules="rules" ref="loginFormRef" class="login-form">
          <el-form-item prop="role">
            <div class="role-selection">
              <label class="role-label">选择角色</label>
              <div class="role-options">
                <div 
                  class="role-option" 
                  :class="{ active: loginForm.role === 1 }"
                  @click="loginForm.role = 1"
                >
                  <el-icon class="role-icon"><UserFilled /></el-icon>
                  <span>管理员</span>
                </div>
                <div 
                  class="role-option" 
                  :class="{ active: loginForm.role === 2 }"
                  @click="loginForm.role = 2"
                >
                  <el-icon class="role-icon"><User /></el-icon>
                  <span>员工</span>
                </div>
                <div 
                  class="role-option" 
                  :class="{ active: loginForm.role === 3 }"
                  @click="loginForm.role = 3"
                >
                  <el-icon class="role-icon"><Avatar /></el-icon>
                  <span>普通用户</span>
                </div>
              </div>
            </div>
          </el-form-item>

          <el-form-item prop="username">
            <el-input 
              v-model="loginForm.username" 
              placeholder="请输入用户名"
              size="large"
              prefix-icon="User"
            />
          </el-form-item>
          
          <el-form-item prop="password">
            <el-input 
              v-model="loginForm.password" 
              type="password" 
              placeholder="请输入密码"
              size="large"
              prefix-icon="Lock"
              show-password
              @keyup.enter="handleLogin"
            />
          </el-form-item>
          
          <el-form-item>
            <el-button 
              type="primary" 
              @click="handleLogin" 
              :loading="loading" 
              size="large"
              class="login-button"
            >
              {{ loading ? '登录中...' : '立即登录' }}
            </el-button>
          </el-form-item>
          
          <div class="login-footer">
            <el-link type="primary" @click="goToRegister">
              没有账号？立即注册
            </el-link>
            <el-link type="info" @click="goToShop" style="margin-left: 20px;">
              游客浏览商城
            </el-link>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import { Monitor, Setting, TrendCharts, UserFilled, User, Avatar } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const loginFormRef = ref()
const loading = ref(false)

const loginForm = reactive({
  role: 0,
  username: '',
  password: ''
})

const rules = {
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  try {
    await loginFormRef.value.validate()
    loading.value = true
    
    const result = await authStore.login(loginForm)
    
    if (result.success) {
      ElMessage.success('登录成功')
      
      // 如果有重定向地址，跳转到原目标页面
      const redirect = route.query.redirect
      if (redirect) {
        router.push(redirect)
        return
      }
      
      // 根据权限码返回的角色跳转到对应页面
      // ALL -> admin, OPER -> employee, VIEW -> user
      if (result.role === 'admin' || result.role === 'employee') {
        // 管理员和员工跳转到后台管理页面
        router.push('/admin')
      } else {
        // 普通用户跳转到商城首页
        router.push('/shop')
      }
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    console.error('Login validation error:', error)
  } finally {
    loading.value = false
  }
}

const goToRegister = () => {
  router.push('/register')
}

const goToShop = () => {
  router.push('/shop')
}
</script>

<style scoped>
.login-container {
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
}

.login-left {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 50%, #e67e22 100%);
  position: relative;
  overflow: hidden;
}

.login-left::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
  opacity: 0.3;
}

.brand-info {
  text-align: center;
  color: white;
  z-index: 1;
  position: relative;
}

.brand-title {
  font-size: 48px;
  font-weight: bold;
  margin-bottom: 16px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.brand-subtitle {
  font-size: 18px;
  margin-bottom: 40px;
  opacity: 0.9;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  opacity: 0.8;
}

.feature-item .el-icon {
  font-size: 20px;
  color: #e67e22;
}

.login-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  background: #f8f9fa;
}

.login-card {
  width: 100%;
  max-width: 480px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  padding: 48px 40px;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.login-header h2 {
  font-size: 28px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
}

.login-header p {
  color: #6c757d;
  font-size: 14px;
  margin: 0;
}

.login-form {
  width: 100%;
}

.role-selection {
  width: 100%;
}

.role-label {
  display: block;
  font-size: 14px;
  color: #606266;
  margin-bottom: 12px;
  font-weight: 500;
}

.role-options {
  display: flex;
  gap: 12px;
  width: 100%;
}

.role-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 12px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafafa;
}

.role-option:hover {
  border-color: #e67e22;
  background: #fff9f5;
}

.role-option.active {
  border-color: #e67e22;
  background: linear-gradient(135deg, #fff9f5 0%, #fef3e8 100%);
  box-shadow: 0 4px 12px rgba(230, 126, 34, 0.15);
}

.role-option .role-icon {
  font-size: 28px;
  color: #909399;
  margin-bottom: 8px;
  transition: color 0.3s ease;
}

.role-option:hover .role-icon,
.role-option.active .role-icon {
  color: #e67e22;
}

.role-option span {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}

.role-option.active span {
  color: #e67e22;
}

.login-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
  background: linear-gradient(135deg, #e67e22 0%, #d35400 100%);
  border: none;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.login-button:hover {
  background: linear-gradient(135deg, #d35400 0%, #e67e22 100%);
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(230, 126, 34, 0.3);
}

.login-footer {
  text-align: center;
  margin-top: 24px;
}

.login-footer .el-link {
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .login-left {
    padding: 40px;
  }
  
  .login-right {
    padding: 40px;
  }
  
  .brand-title {
    font-size: 36px;
  }
}

@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
  }
  
  .login-left {
    padding: 60px 40px;
    min-height: auto;
  }
  
  .login-right {
    padding: 40px 20px;
  }
  
  .login-card {
    padding: 32px 24px;
  }
  
  .brand-title {
    font-size: 28px;
  }
}
</style>
