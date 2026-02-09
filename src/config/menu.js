/**
 * 菜单配置
 * permission: 权限码数组，ALL表示管理员可见，OPER表示员工可见，VIEW表示普通用户可见
 * 如果不设置permission，则所有角色可见
 */
export const adminMenus = [
  {
    index: '/admin/dashboard',
    title: '首页',
    icon: 'House',
    permission: ['ALL', 'OPER']  // 管理员和员工都可见
  },
  {
    index: '/admin/suppliers',
    title: '供应商管理',
    icon: 'Van',
    permission: ['ALL', 'OPER']
  },
  {
    index: '/admin/orders',
    title: '订单管理',
    icon: 'Document',
    permission: ['ALL', 'OPER']
  },
  {
    index: '/admin/categories',
    title: '商品分类管理',
    icon: 'Files',
    permission: ['ALL', 'OPER']
  },
  {
    index: '/admin/products',
    title: '商品管理',
    icon: 'Goods',
    permission: ['ALL', 'OPER']
  },
  {
    index: '/admin/inventory',
    title: '库存管理',
    icon: 'Box',
    permission: ['ALL', 'OPER']
  },
  {
    index: '/admin/members',
    title: '会员管理',
    icon: 'UserFilled',
    permission: ['ALL', 'OPER']
  },
  {
    index: 'user-management',
    title: '系统管理',
    icon: 'Setting',
    permission: ['ALL'],  // 只有管理员可见
    children: [
      {
        index: '/admin/users',
        title: '用户管理',
        permission: ['ALL']
      },
      {
        index: '/admin/employees',
        title: '员工管理',
        permission: ['ALL']  // 只有管理员可见
      }
    ]
  }
]

/**
 * 根据权限码过滤菜单
 * @param {Array} menus 菜单配置
 * @param {Array} permissionCodes 用户权限码
 * @returns {Array} 过滤后的菜单
 */
export function filterMenusByPermission(menus, permissionCodes) {
  return menus.filter(menu => {
    // 如果没有设置权限，则所有角色可见
    if (!menu.permission) return true
    
    // 检查用户权限码是否与菜单权限匹配
    const hasPermission = menu.permission.some(p => permissionCodes.includes(p))
    
    if (!hasPermission) return false
    
    // 如果有子菜单，递归过滤
    if (menu.children) {
      menu.children = filterMenusByPermission(menu.children, permissionCodes)
      // 如果子菜单全部被过滤掉，则不显示父菜单
      return menu.children.length > 0
    }
    
    return true
  })
}
