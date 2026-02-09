import request from '@/utils/request'

// 分页查询商品（用户端）
export function getProductPage(params) {
  return request({
    url: '/shop/product/page',
    method: 'post',
    data: params
  })
}

// 获取商品详情
export function getProductDetail(id) {
  return request({
    url: `/shop/product/detail/${id}`,
    method: 'get'
  })
}

// 获取热销商品
export function getHotProducts(limit = 10) {
  return request({
    url: `/shop/product/hot?limit=${limit}`,
    method: 'get'
  })
}

// 获取轮播商品
export function getCarouselProducts() {
  return request({
    url: '/shop/product/carousel',
    method: 'get'
  })
}
