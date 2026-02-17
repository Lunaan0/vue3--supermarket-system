import request from '@/utils/request'

/**
 * 获取当前用户个人信息
 */
export function getUserProfile() {
  return request({
    url: '/common/user/profile',
    method: 'get'
  })
}

/**
 * 修改当前用户个人信息
 */
export function updateUserProfile(data) {
  return request({
    url: '/common/user/profile',
    method: 'put',
    data
  })
}

/**
 * 修改当前用户密码
 */
export function updateUserPassword(data) {
  return request({
    url: '/common/user/profile/password',
    method: 'put',
    data
  })
}

/**
 * 上传头像
 */
export function uploadAvatar(file) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', 'avatar')
  return request({
    url: '/common/file/upload',
    method: 'post',
    headers: { 'Content-Type': 'multipart/form-data' },
    data: formData
  })
}
