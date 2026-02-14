import request from '@/utils/request'

// ========== 后台管理 - 采购建议AI ==========

// 发送消息获取采购建议
export function sendPurchaseMessage(data) {
  return request({
    url: '/admin/ai-chat/send',
    method: 'post',
    data
  })
}

// 获取采购聊天历史
export function getPurchaseChatHistory(sessionId) {
  return request({
    url: `/admin/ai-chat/history/${sessionId}`,
    method: 'get'
  })
}

// 获取采购会话列表
export function getPurchaseSessionList() {
  return request({
    url: '/admin/ai-chat/sessions',
    method: 'get'
  })
}

// 删除采购会话
export function deletePurchaseSession(sessionId) {
  return request({
    url: `/admin/ai-chat/session/${sessionId}`,
    method: 'delete'
  })
}

// ========== 商城端 - 商品咨询AI ==========

// 发送消息咨询商品
export function sendShopMessage(data) {
  return request({
    url: '/shop/ai-chat/send',
    method: 'post',
    data
  })
}

// 获取商品咨询聊天历史
export function getShopChatHistory(sessionId) {
  return request({
    url: `/shop/ai-chat/history/${sessionId}`,
    method: 'get'
  })
}

// 获取商品咨询会话列表
export function getShopSessionList() {
  return request({
    url: '/shop/ai-chat/sessions',
    method: 'get'
  })
}

// 删除商品咨询会话
export function deleteShopSession(sessionId) {
  return request({
    url: `/shop/ai-chat/session/${sessionId}`,
    method: 'delete'
  })
}
