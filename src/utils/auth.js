import Cookies from 'js-cookie'

const TokenKey = 'Admin-Token'
const PermissionKey = 'Permission-Codes'

export function getToken() {
  // 只从 Cookie 获取 token
  return Cookies.get(TokenKey)
}

export function setToken(token) {
  // 只保存到 Cookie
  return Cookies.set(TokenKey, token)
}

export function removeToken() {
  return Cookies.remove(TokenKey)
}

export function getPermissionCodes() {
  const codes = Cookies.get(PermissionKey)
  return codes ? JSON.parse(codes) : []
}

export function setPermissionCodes(codes) {
  return Cookies.set(PermissionKey, JSON.stringify(codes))
}

export function removePermissionCodes() {
  return Cookies.remove(PermissionKey)
}
