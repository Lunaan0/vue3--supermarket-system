import request from '@/utils/request'

// 登录方法
export function login(credentials) {
  return request({
    url: '/common/user/login',
    headers: {
      isToken: false,
      repeatSubmit: false
    },
    method: 'post',
    data: credentials
  })
}

// 注册方法
export function register(userData) {
  return request({
    url: '/common/user/register',
    headers: {
      isToken: false
    },
    method: 'post',
    data: userData
  })
}

// 退出方法
export function logout() {
  return request({
    url: '/common/user/logout',
    method: 'post'
  })
}
