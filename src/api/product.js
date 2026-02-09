import request from '@/utils/request'

/**
 * 分页查询商品
 * @param {Object} params - 查询参数
 * @param {number} params.pageNum - 当前页码
 * @param {number} params.pageSize - 每页条数
 * @param {string} params.productName - 商品名称（模糊查询）
 * @param {string} params.productCode - 商品编号
 * @param {number} params.categoryId - 商品分类ID
 * @param {number} params.supplierId - 供应商ID
 * @param {number} params.status - 商品状态（0-下架，1-上架）
 */
export function getProductPage(params) {
  return request({
    url: '/product/page',
    method: 'post',
    data: params
  })
}

/**
 * 获取商品详情
 * @param {number} id - 商品ID
 */
export function getProductDetail(id) {
  return request({
    url: `/product/detail/${id}`,
    method: 'get'
  })
}

/**
 * 添加商品
 * @param {Object} data - 商品信息
 */
export function addProduct(data) {
  return request({
    url: '/product/add',
    method: 'post',
    data
  })
}

/**
 * 修改商品
 * @param {Object} data - 商品信息
 */
export function updateProduct(data) {
  return request({
    url: '/product/update',
    method: 'put',
    data
  })
}

/**
 * 删除商品
 * @param {number} id - 商品ID
 */
export function deleteProduct(id) {
  return request({
    url: `/product/delete/${id}`,
    method: 'delete'
  })
}

/**
 * 批量删除商品
 * @param {Array<number>} ids - 商品ID数组
 */
export function batchDeleteProduct(ids) {
  return request({
    url: '/product/batchDelete',
    method: 'delete',
    data: ids
  })
}

/**
 * 修改商品状态（上架/下架）
 * @param {number} id - 商品ID
 * @param {number} status - 状态：0-下架，1-上架
 */
export function updateProductStatus(id, status) {
  return request({
    url: `/product/status/${id}`,
    method: 'put',
    params: { status }
  })
}
