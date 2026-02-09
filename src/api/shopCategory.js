import request from '@/utils/request'

// 获取顶级分类列表
export function getTopCategories() {
  return request({
    url: '/productCategory/top',
    method: 'get'
  })
}

// 获取分类树
export function getCategoryTree() {
  return request({
    url: '/productCategory/tree',
    method: 'get'
  })
}

// 获取子分类列表
export function getChildrenCategories(parentId) {
  return request({
    url: `/productCategory/children/${parentId}`,
    method: 'get'
  })
}
