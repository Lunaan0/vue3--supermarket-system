import { defineStore } from 'pinia'
import { login, register, logout as logoutApi } from '@/api/login'
import { getToken, setToken, removeToken, getPermissionCodes, setPermissionCodes, removePermissionCodes } from '@/utils/auth'

// 根据权限码获取角色
function getRoleByPermission(permissionCodes) {
  if (permissionCodes.includes('ALL')) {
    return 'admin'
  } else if (permissionCodes.includes('OPER')) {
    return 'employee'
  } else if (permissionCodes.includes('VIEW')) {
    return 'user'
  }
  return 'user'
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: getToken() || null,
    // user: JSON.parse(localStorage.getItem('user') || 'null'),
    // userRole: localStorage.getItem('userRole') || null,
    permissionCodes: getPermissionCodes()  // 从 Cookie 获取
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.userRole === 'admin',
    isEmployee: (state) => state.userRole === 'employee',
    isUser: (state) => state.userRole === 'user',
    hasPermission: (state) => (permission) => {
      return state.permissionCodes.includes('ALL') || state.permissionCodes.includes(permission)
    }
  },

  actions: {
    // 登录
    async login(credentials) {
      try {
        const res = await login(credentials)
        
        if (res.code === 200) {
          const { token, permissionCodes } = res.data
          
          // 根据权限码确定角色
          const userRole = getRoleByPermission(permissionCodes)
          
          this.token = token
          this.userRole = userRole
          this.permissionCodes = permissionCodes
          this.user = {
            username: credentials.username,
            role: userRole
          }
          
          setToken(token)
          setPermissionCodes(permissionCodes)  // 保存到 Cookie
          // localStorage.setItem('userRole', userRole)
          // localStorage.setItem('user', JSON.stringify(this.user))
          
          return { success: true, role: userRole }
        } else {
          return { success: false, message: res.msg || '登录失败' }
        }
      } catch (error) {
        console.error('Login error:', error)
        return { success: false, message: error.message || '网络错误，请稍后重试' }
      }
    },

    // 注册
    async register(userData) {
      try {
        const res = await register(userData)
        
        if (res.code === 200) {
          return { success: true, message: '注册成功' }
        } else {
          return { success: false, message: res.msg || '注册失败' }
        }
      } catch (error) {
        console.error('Register error:', error)
        return { success: false, message: error.message || '网络错误，请稍后重试' }
      }
    },

    // 退出登录
    async logout() {
      try {
        await logoutApi()
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        this.token = null
        this.user = null
        this.userRole = null
        this.permissionCodes = []
        
        removeToken()
        removePermissionCodes()  // 从 Cookie 移除
        // localStorage.removeItem('user')
        // localStorage.removeItem('userRole')
      }
    }
  }
})
