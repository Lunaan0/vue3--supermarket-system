import request from '@/utils/request'

// 分页查询采购建议
export function getPurchaseSuggestionPage(params) {
  return request({
    url: '/admin/purchase-suggestion/page',
    method: 'get',
    params
  })
}

// 获取采购建议详情
export function getPurchaseSuggestionDetail(id) {
  return request({
    url: `/admin/purchase-suggestion/${id}`,
    method: 'get'
  })
}

// 添加采购建议（员工提交）
export function addPurchaseSuggestion(data) {
  return request({
    url: '/admin/purchase-suggestion',
    method: 'post',
    data
  })
}

// 更新采购建议
export function updatePurchaseSuggestion(data) {
  return request({
    url: '/admin/purchase-suggestion',
    method: 'put',
    data
  })
}

// 删除采购建议
export function deletePurchaseSuggestion(id) {
  return request({
    url: `/admin/purchase-suggestion/${id}`,
    method: 'delete'
  })
}

// 审核采购建议（管理员）
export function auditPurchaseSuggestion(id, status, remark) {
  return request({
    url: `/admin/purchase-suggestion/audit/${id}`,
    method: 'post',
    params: { status, remark }
  })
}

// 采纳建议并执行补货
export function adoptPurchaseSuggestion(id, actualQuantity) {
  return request({
    url: `/admin/purchase-suggestion/adopt/${id}`,
    method: 'post',
    params: { actualQuantity }
  })
}
