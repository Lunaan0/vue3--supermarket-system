import request from '@/utils/request'
import { getToken } from '@/utils/auth'

// ========== 通用流式请求工具（复用逻辑，避免冗余） ==========
/**
 * 通用 SSE 流式请求工具
 * @param {string} path - 接口路径（如 /admin/ai-chat/stream-send）
 * @param {Object} data - 请求参数
 * @param {Function} onChunk - 内容分段回调
 * @param {Function} onComplete - 流结束回调
 * @param {Function} onError - 错误回调
 * @param {Function} onSession - sessionId 回调
 * @returns {Function} 取消请求的函数
 */
function sseRequest(path, data, onChunk, onComplete, onError, onSession) {
  const baseURL = import.meta.env.VITE_APP_BASE_API
  const url = `${baseURL}${path}`
  const token = getToken()
  // 创建 AbortController 用于取消请求
  const controller = new AbortController()
  const signal = controller.signal

  // 标记流是否已完成/取消
  let isCompleted = false
  let fullContent = ''

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'token': token || '',
      // 禁用缓存（关键：防止浏览器合并分段）
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    },
    credentials: 'include',
    body: JSON.stringify(data),
    signal // 关联取消信号
  }).then(async (response) => {
    if (!response.ok) {
      throw new Error(`HTTP请求失败: ${response.status} ${response.statusText}`)
    }
    // 验证是否是流式响应
    const contentType = response.headers.get('Content-Type')
    if (!contentType || !contentType.includes('text/event-stream')) {
      throw new Error('非SSE流式响应，请检查后端配置')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8') // 显式指定编码，避免乱码
    let buffer = ''

    // 循环读取流
    async function readStream() {
      try {
        const { done, value } = await reader.read()

        // 流完成/已取消，终止循环
        if (done || isCompleted || signal.aborted) {
          if (!isCompleted && !signal.aborted) {
            onComplete && onComplete(fullContent)
          }
          reader.releaseLock() // 释放阅读器，防止内存泄漏
          return
        }

        // 解码并拼接缓存
        buffer += decoder.decode(value, { stream: true })
        // 按行分割（SSE 每行以 \n 分隔）
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // 保留不完整的行

        // 解析每一行 SSE 数据
        for (const line of lines) {
          const trimmedLine = line.trim()
          if (!trimmedLine) continue

          // 跳过 event 行（如 event:session）
          if (trimmedLine.startsWith('event:')) {
            continue
          }

          // 解析 data 行
          if (trimmedLine.startsWith('data:')) {
            const content = trimmedLine.substring(5).trim()

            // 检测流结束标识
            if (content === '[DONE]') {
              isCompleted = true
              onComplete && onComplete(fullContent)
              reader.releaseLock()
              return
            }

            // 解析 sessionId（宽松匹配：非空、非文本内容的短字符串）
            if (content && !isNaN(Number(content)) === false && content.length >= 16 && content.length <= 64) {
              onSession && onSession(content)
            } 
            // 解析普通内容分段
            else if (content) {
              fullContent += content
              onChunk && onChunk(content)
            }
          }
        }

        // 继续读取下一段
        readStream()
      } catch (err) {
        // 排除主动取消的错误
        if (!signal.aborted) {
          onError && onError(err)
        }
        reader.releaseLock()
      }
    }

    // 启动流读取
    readStream()
  }).catch(err => {
    // 排除主动取消的错误
    if (!signal.aborted) {
      onError && onError(err)
    }
  })

  // 返回取消函数（供前端组件调用）
  return () => {
    isCompleted = true
    controller.abort()
  }
}

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
  return sseRequest(
    '/admin/ai-chat/stream-send',
    data,
    onChunk,
    onComplete,
    onError,
    onSession
  )
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
  return sseRequest(
    '/shop/ai-chat/stream-send',
    data,
    onChunk,
    onComplete,
    onError,
    onSession
  )
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