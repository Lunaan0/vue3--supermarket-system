import request from '@/utils/request'

// 获取销售统计数据
export function getSalesStatistics() {
  return request({
    url: '/admin/statistics/sales',
    method: 'get'
  })
}
