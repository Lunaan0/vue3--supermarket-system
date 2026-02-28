import request from '@/utils/request'

// 获取当前用户会员信息
export function getCurrentMemberInfo() {
  return request({
    url: '/shop/member/info',
    method: 'get'
  })
}

// 获取可购买的会员等级列表
export function getMemberLevels() {
  return request({
    url: '/shop/member/levels',
    method: 'get'
  })
}

// 购买会员
export function purchaseMember(data) {
  return request({
    url: '/shop/member/purchase',
    method: 'post',
    data
  })
}

// 支付订单
export function payMemberOrder(recordId) {
  return request({
    url: `/shop/member/pay/${recordId}`,
    method: 'post'
  })
}

// 取消订单
export function cancelMemberOrder(recordId) {
  return request({
    url: `/shop/member/cancel/${recordId}`,
    method: 'post'
  })
}

// 分页查询购买记录
export function getMemberPurchaseRecords(data) {
  return request({
    url: '/shop/member/records',
    method: 'post',
    data
  })
}

// 获取购买记录详情
export function getMemberPurchaseRecordDetail(id) {
  return request({
    url: `/shop/member/record/${id}`,
    method: 'get'
  })
}
