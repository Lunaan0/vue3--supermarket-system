import request from '@/utils/request'

// 分页查询用户（roleId可选：2-员工，3-普通用户）
export function getUserPage(params) {
  return request({
    url: '/admin/user/page',
    method: 'post',
    data:params
  })
}

// 创建用户
export function createUser(data) {
  return request({
    url: '/admin/user/create',
    method: 'post',
    data
  })
}

// 更新用户
export function updateUser(data) {
  return request({
    url: '/admin/user/update',
    method: 'put',
    data
  })
}

// 删除用户
export function deleteUser(id) {
  return request({
    url: `/admin/user/delete/${id}`,
    method: 'delete'
  })
}

// 获取用户详情
export function getUserDetail(id) {
  return request({
    url: `/admin/user/${id}`,
    method: 'get'
  })
}

// 更新用户状态
export function updateUserStatus(id, status) {
  return request({
    url: `/admin/user/status/${id}`,
    method: 'put',
    params: { status }
  })
}

// 修改用户密码
export function updateUserPassword(id, newPassword) {
  return request({
    url: `/admin/user/password/${id}`,
    method: 'put',
    params: { newPassword }
  })
}
