import request from '@/utils/request'

/**
 * 分页查询供应商列表
 * @param {Object} params - 查询参数
 * @param {number} params.pageNum - 页码
 * @param {number} params.pageSize - 每页数量
 * @param {string} params.supplierName - 供应商名称
 * @param {string} params.contactPerson - 联系人
 * @param {string} params.phone - 联系电话
 */
export function getSupplierList(params) {
  return request({
    url: '/supplier/page',
    method: 'post',
    data: params
  })
}

/**
 * 添加供应商
 * @param {Object} data - 供应商信息
 */
export function addSupplier(data) {
  return request({
    url: '/supplier/add',
    method: 'post',
    data
  })
}

/**
 * 更新供应商
 * @param {Object} data - 供应商信息
 */
export function updateSupplier(data) {
  return request({
    url: '/supplier/update',
    method: 'put',
    data
  })
}

/**
 * 删除供应商
 * @param {number} id - 供应商ID
 */
export function deleteSupplier(id) {
  return request({
    url: `/supplier/delete/${id}`,
    method: 'delete'
  })
}
