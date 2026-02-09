import request from '@/utils/request'

/**
 * 获取分类树结构（用于下拉选择）
 */
export function getCategoryTree() {
  return request({
    url: '/productCategory/tree',
    method: 'get'
  })
}

/**
 * 分页查询分类列表
 * @param {Object} params - 查询参数
 * @param {number} params.pageNum - 页码
 * @param {number} params.pageSize - 每页数量
 * @param {number} params.parentId - 父分类ID，0或null表示查询一级分类
 * @param {string} params.categoryName - 分类名称（模糊查询）
 * @param {number} params.status - 分类状态（0禁用，1启用）
 */
export function getCategoryPage(params) {
  return request({
    url: '/productCategory/level/page',
    method: 'post',
    data: params
  })
}

/**
 * 添加分类
 * @param {Object} data - 分类信息
 * @param {string} data.categoryName - 分类名称
 * @param {number} data.parentId - 父分类ID，0或null表示一级分类
 * @param {number} data.sort - 排序号
 * @param {number} data.status - 分类状态（0禁用，1启用）
 */
export function addCategory(data) {
  return request({
    url: '/productCategory/level/add',
    method: 'post',
    data
  })
}

/**
 * 更新分类
 * @param {Object} data - 分类信息
 * @param {number} data.id - 分类ID
 * @param {string} data.categoryName - 分类名称
 * @param {number} data.parentId - 父分类ID
 * @param {number} data.sort - 排序号
 * @param {number} data.status - 分类状态（0禁用，1启用）
 */
export function updateCategory(data) {
  return request({
    url: '/productCategory/level/update',
    method: 'put',
    data
  })
}

/**
 * 删除分类
 * @param {number} id - 分类ID
 */
export function deleteCategory(id) {
  return request({
    url: `/productCategory/level/delete/${id}`,
    method: 'delete'
  })
}

/**
 * 获取指定分类的子分类列表（不分页）
 * @param {number} parentId - 父分类ID
 */
export function getChildrenByParentId(parentId) {
  return request({
    url: `/productCategory/children/${parentId}`,
    method: 'get'
  })
}
