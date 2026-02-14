import { createRouter, createWebHistory } from 'vue-router'
import { getToken, getPermissionCodes } from '@/utils/auth'

// 公共路由 - 不需要登录即可访问
const publicRoutes = [
  {
    path: '/',
    redirect: '/shop'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue'),
    meta: { title: '注册' }
  },
  {
    path: '/shop',
    component: () => import('../layouts/ShopLayout.vue'),
    meta: { title: '超市首页' },
    children: [
      {
        path: '',
        name: 'ShopLayout',
        redirect: '/shop/home'
      },
      {
        path: 'home',
        name: 'ShopHome',
        component: () => import('../views/shop/Home.vue'),
        meta: { title: '首页' }
      },
      {
        path: 'products',
        name: 'ShopProducts',
        component: () => import('../views/shop/Products.vue'),
        meta: { title: '商品列表' }
      },
      {
        path: 'cart',
        name: 'ShopCart',
        component: () => import('../views/shop/Cart.vue'),
        meta: { title: '购物车', requiresAuth: true }
      },
      {
        path: 'profile',
        name: 'UserProfile',
        component: () => import('../views/shop/Home.vue'),  // TODO: 创建个人中心页面
        meta: { title: '个人中心', requiresAuth: true }
      },
      {
        path: 'orders',
        name: 'ShopOrders',
        component: () => import('../views/shop/Orders.vue'),
        meta: { title: '我的订单', requiresAuth: true }
      }
    ]
  }
]

// 后台管理路由 - 需要登录且有管理权限
const adminRoutes = [
  {
    path: '/admin',
    component: () => import('../layouts/BackendLayout.vue'),
    meta: { requiresAuth: true, permissions: ['ALL', 'OPER'], title: '后台管理' },
    children: [
      {
        path: '',
        name: 'BackendLayout',
        redirect: '/admin/dashboard',
        meta: { requiresAuth: true, permissions: ['ALL', 'OPER'] }
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/admin/Dashboard.vue'),
        meta: { requiresAuth: true, permissions: ['ALL', 'OPER'], title: '首页' }
      },
      {
        path: 'suppliers',
        name: 'Suppliers',
        component: () => import('../views/admin/Suppliers.vue'),
        meta: { requiresAuth: true, permissions: ['ALL', 'OPER'], title: '供应商管理' }
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('../views/admin/Orders.vue'),
        meta: { requiresAuth: true, permissions: ['ALL', 'OPER'], title: '订单管理' }
      },
      {
        path: 'categories',
        name: 'Categories',
        component: () => import('../views/admin/Categories.vue'),
        meta: { requiresAuth: true, permissions: ['ALL', 'OPER'], title: '商品分类管理' }
      },
      {
        path: 'products',
        name: 'Products',
        component: () => import('../views/admin/Products.vue'),
        meta: { requiresAuth: true, permissions: ['ALL', 'OPER'], title: '商品管理' }
      },
      {
        path: 'inventory',
        name: 'Inventory',
        component: () => import('../views/admin/Inventory.vue'),
        meta: { requiresAuth: true, permissions: ['ALL', 'OPER'], title: '库存管理' }
      },
      {
        path: 'members',
        name: 'Members',
        component: () => import('../views/admin/Members.vue'),
        meta: { requiresAuth: true, permissions: ['ALL', 'OPER'], title: '会员管理' }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('../views/admin/Users.vue'),
        meta: { requiresAuth: true, permissions: ['ALL'], title: '用户管理' }  // 只有管理员可访问
      },
      {
        path: 'employees',
        name: 'Employees',
        component: () => import('../views/admin/Employees.vue'),
        meta: { requiresAuth: true, permissions: ['ALL'], title: '员工管理' }  // 只有管理员可访问
      },
      {
        path: 'ai-purchase',
        name: 'AiPurchase',
        component: () => import('../views/admin/AiPurchase.vue'),
        meta: { requiresAuth: true, permissions: ['ALL', 'OPER'], title: 'AI采购助手' }
      }
    ]
  }
]

// 合并所有路由
const routes = [...publicRoutes, ...adminRoutes]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 检查用户是否有权限
function hasPermission(userPermissions, requiredPermissions) {
  if (!requiredPermissions || requiredPermissions.length === 0) return true
  return requiredPermissions.some(p => userPermissions.includes(p))
}

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = getToken()  // 从 Cookie 获取 token
  const permissionCodes = getPermissionCodes()  // 从 Cookie 获取权限码
  
  // 调试日志
  console.log('路由守卫触发:', {
    path: to.path,
    requiresAuth: to.meta.requiresAuth,
    token: token,
    permissionCodes: permissionCodes
  })
  
  // 如果页面需要登录认证
  if (to.meta.requiresAuth) {
    // 未登录或登录状态不完整，跳转到登录页
    // if (!token || permissionCodes.length === 0) {
    //   next({
    //     path: '/login',
    //     query: { redirect: to.fullPath }  // 保存原目标路径
    //   })
    //   return
    // }

    if ( permissionCodes.length === 0) {
      next({
        path: '/login',
        query: { redirect: to.fullPath }  // 保存原目标路径
      })
      return
    }
    
    // 检查权限
    if (to.meta.permissions && !hasPermission(permissionCodes, to.meta.permissions)) {
      // 无权限，跳转到对应首页
      if (permissionCodes.includes('ALL') || permissionCodes.includes('OPER')) {
        next('/admin')
      } else {
        next('/shop')
      }
      return
    }
  }
  
  // 已登录用户访问登录页，根据权限跳转（必须同时有 token 和权限信息才算真正登录）
  if (to.path === '/login' && token && permissionCodes.length > 0) {
    if (permissionCodes.includes('ALL') || permissionCodes.includes('OPER')) {
      next('/admin')
    } else {
      next('/shop')
    }
    return
  }
  
  next()
})

export default router
