import request from '@/utils/request'
import { getToken } from '@/utils/auth'

// ========== 后台管理 - 采购建议AI ==========

// 发送消息获取采购建议（非流式）
export function sendPurchaseMessage(data) {
  return request({
    url: '/admin/ai-chat/send',
    method: 'post',
    data
  })
}

// 流式发送消息获取采购建议
export function sendPurchaseMessageStream(data, onChunk, onComplete, onError, onSession) {
  const baseURL = import.meta.env.VITE_APP_BASE_API
  const url = `${baseURL}/admin/ai-chat/stream-send`
  const token = getToken()
  
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'token': token || ''
    },
    credentials: 'include',
    body: JSON.stringify(data)
  }).then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullContent = ''
    let buffer = ''
    let isCompleted = false
    
    function read() {
      reader.read().then(({ done, value }) => {
        if (done || isCompleted) {
          if (!isCompleted) {
            onComplete && onComplete(fullContent)
          }
          return
        }
        buffer += decoder.decode(value, { stream: true })
        // 解析 SSE 格式
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // 保留不完整的行
        
        for (const line of lines) {
          const trimmedLine = line.trim()
          if (!trimmedLine) continue
          
          // 处理 event: session
          if (trimmedLine.startsWith('event:')) {
            continue
          }
          
          if (trimmedLine.startsWith('data:')) {
            const content = trimmedLine.substring(5).trim()
            // 检测 [DONE] 标识
            if (content === '[DONE]') {
              isCompleted = true
              onComplete && onComplete(fullContent)
              return
            }
            if (content) {
              // 检查是否是 sessionId（通常是32位hex字符串）
              if (/^[a-f0-9]{32}$/i.test(content)) {
                onSession && onSession(content)
              } else {
                fullContent += content
                onChunk && onChunk(content)
              }
            }
          }
        }
        read()
      }).catch(err => {
        onError && onError(err)
      })
    }
    read()
  }).catch(err => {
    onError && onError(err)
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

// 发送消息咨询商品（非流式）
export function sendShopMessage(data) {
  return request({
    url: '/shop/ai-chat/send',
    method: 'post',
    data
  })
}

// 流式发送消息咨询商品
export function sendShopMessageStream(data, onChunk, onComplete, onError, onSession) {
  const baseURL = import.meta.env.VITE_APP_BASE_API
  const url = `${baseURL}/shop/ai-chat/stream-send`
  const token = getToken()
  
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'token': token || ''
    },
    credentials: 'include',
    body: JSON.stringify(data)
  }).then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullContent = ''
    let buffer = ''
    let isCompleted = false
    
    function read() {
      reader.read().then(({ done, value }) => {
        if (done || isCompleted) {
          if (!isCompleted) {
            onComplete && onComplete(fullContent)
          }
          return
        }
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        
        for (const line of lines) {
          const trimmedLine = line.trim()
          if (!trimmedLine) continue
          
          if (trimmedLine.startsWith('event:')) {
            continue
          }
          
          if (trimmedLine.startsWith('data:')) {
            const content = trimmedLine.substring(5).trim()
            // 检测 [DONE] 标识
            if (content === '[DONE]') {
              isCompleted = true
              onComplete && onComplete(fullContent)
              return
            }
            if (content) {
              if (/^[a-f0-9]{32}$/i.test(content)) {
                onSession && onSession(content)
              } else {
                fullContent += content
                onChunk && onChunk(content)
              }
            }
          }
        }
        read()
      }).catch(err => {
        onError && onError(err)
      })
    }
    read()
  }).catch(err => {
    onError && onError(err)
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
