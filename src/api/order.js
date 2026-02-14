import request from '@/utils/request'

// 创建订单
export function createOrder(data) {
  return request({
    url: '/shop/order/create',
    method: 'post',
    data
  })
}

// 支付订单
export function payOrder(orderId, payType) {
  return request({
    url: `/shop/order/pay/${orderId}?payType=${payType}`,
    method: 'post'
  })
}

// 取消订单
export function cancelOrder(orderId) {
  return request({
    url: `/shop/order/cancel/${orderId}`,
    method: 'post'
  })
}

// 获取订单详情
export function getOrderDetail(orderId) {
  return request({
    url: `/shop/order/detail/${orderId}`,
    method: 'get'
  })
}

// 分页查询我的订单
export function getOrderPage(data) {
  return request({
    url: '/shop/order/page',
    method: 'post',
    data
  })
}

// 获取订单列表
export function getOrderList(orderStatus) {
  return request({
    url: '/shop/order/list',
    method: 'get',
    params: { orderStatus }
  })
}

// ========== 管理员端订单API ==========

// 分页查询所有订单(管理员)
export function getAdminOrderPage(data) {
  return request({
    url: '/admin/order/page',
    method: 'post',
    data
  })
}

// 获取订单详情(管理员)
export function getAdminOrderDetail(orderId) {
  return request({
    url: `/admin/order/detail/${orderId}`,
    method: 'get'
  })
}

// 完成订单(管理员)
export function completeOrder(orderId) {
  return request({
    url: `/admin/order/complete/${orderId}`,
    method: 'post'
  })
}

// 取消订单(管理员)
export function cancelAdminOrder(orderId) {
  return request({
    url: `/admin/order/cancel/${orderId}`,
    method: 'post'
  })
}
