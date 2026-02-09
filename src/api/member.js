import request from '@/utils/request'

// 分页查询会员
export function getMemberPage(data) {
  return request({
    url: '/admin/member/page',
    method: 'post',
    data
  })
}

// 添加会员（从普通用户选择）
export function addMember(data) {
  return request({
    url: '/admin/member/add',
    method: 'post',
    data
  })
}

// 更新会员等级
export function updateMemberLevel(data) {
  return request({
    url: '/admin/member/updateLevel',
    method: 'put',
    data
  })
}

// 获取会员详情
export function getMemberDetail(id) {
  return request({
    url: `/admin/member/${id}`,
    method: 'get'
  })
}

// 删除会员
export function deleteMember(id) {
  return request({
    url: `/admin/member/delete/${id}`,
    method: 'delete'
  })
}
