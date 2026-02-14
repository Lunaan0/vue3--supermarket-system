import request from '@/utils/request'
import { getToken } from '@/utils/auth'

// 添加到购物车
export function addToCart(productId, quantity) {
  console.log('购物车请求参数:', { productId, quantity })
  return request({
    url: `/shop/cart/add/${productId}/${quantity}`,
    method: 'post',
    // data: {}
  })
}

// 更新购物车商品数量
export function updateCartQuantity(data) {
  return request({
    url: '/shop/cart/updateQuantity',
    method: 'put',
    data
  })
}

// 删除购物车商品
export function removeFromCart(id) {
  return request({
    url: `/shop/cart/remove/${id}`,
    method: 'delete'
  })
}

// 更新商品选中状态
export function updateCartChecked(data) {
  return request({
    url: '/shop/cart/updateChecked',
    method: 'put',
    data
  })
}

// 全选/取消全选
export function updateAllChecked(checked) {
  return request({
    url: `/shop/cart/updateAllChecked?checked=${checked}`,
    method: 'put'
  })
}

// 获取购物车列表
export function getCartList() {
  return request({
    url: '/shop/cart/list',
    method: 'get'
  })
}

// 清空购物车
export function clearCart() {
  return request({
    url: '/shop/cart/clear',
    method: 'delete'
  })
}
