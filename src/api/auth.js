import request from '@/utils/request'

// 登录接口
export function login(credentials) {
  return request({
    url: '/common/user/login',
    method: 'post',
    data: credentials
  })
}

// 注册接口
export function register(userData) {
  return request({
    url: '/common/user/register',
    method: 'post',
    data: userData
  })
}

export default request




// import axios from 'axios'
// import getToken from '@/utils/auth';

// const api = axios.create({
//   baseURL: '/api',
//   timeout: 10000,
//   headers: {
//     'Content-Type': 'application/json'
//   }
// })

// api.interceptors.request.use(
//   (config) => {
//     // const token = localStorage.getItem('token')
//     const token=getToken()
//     if (token) {
//       // config.headers.Authorization = `Bearer ${token}`
//       config.headers['token'] = token
//     }
//     return config
//   },
//   (error) => {
//     return Promise.reject(error)
//   }
// )

// api.interceptors.response.use(
//   (response) => {
//     return response
//   },
//   (error) => {
//     if (error.response?.status === 401) {
//       // localStorage.removeItem('token')
//       // localStorage.removeItem('userRole')
//       // localStorage.removeItem('permissionCodes')
//       // localStorage.removeItem('user')
//       window.location.href = '/login'
//     }
//     return Promise.reject(error)
//   }
// )

// export const authAPI = {
//   login: (credentials) => api.post('/auth/login', credentials),
//   register: (userData) => api.post('/auth/register', userData)
// }

// export default api
