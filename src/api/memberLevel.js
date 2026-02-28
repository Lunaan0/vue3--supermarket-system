import request from '@/utils/request'

// 分页查询会员等级
export function getMemberLevelPage(data) {
  return request({
    url: '/admin/memberLevel/page',
    method: 'post',
    data
  })
}

// 获取所有启用的会员等级
export function getEnabledMemberLevels() {
  return request({
    url: '/admin/memberLevel/enabled',
    method: 'get'
  })
}

// 新增会员等级
export function addMemberLevel(data) {
  return request({
    url: '/admin/memberLevel/add',
    method: 'post',
    data
  })
}

// 修改会员等级
export function updateMemberLevel(data) {
  return request({
    url: '/admin/memberLevel/update',
    method: 'put',
    data
  })
}

// 删除会员等级
export function deleteMemberLevel(id) {
  return request({
    url: `/admin/memberLevel/delete/${id}`,
    method: 'delete'
  })
}

// 获取会员等级详情
export function getMemberLevelDetail(id) {
  return request({
    url: `/admin/memberLevel/${id}`,
    method: 'get'
  })
}
