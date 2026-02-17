<template>
  <!-- AI助手悬浮按钮 -->
  <div class="ai-chat-widget">
    <el-badge :value="unreadCount" :hidden="unreadCount === 0">
      <div class="ai-fab" @click="toggleChat" :class="{ active: isOpen }">
        <el-icon v-if="!isOpen" :size="28"><Service /></el-icon>
        <el-icon v-else :size="28"><Close /></el-icon>
      </div>
    </el-badge>

    <!-- 聊天窗口 -->
    <transition name="slide-up">
      <div v-if="isOpen" class="chat-window">
        <div class="chat-header">
          <div class="header-info">
            <el-icon :size="24"><Service /></el-icon>
            <span>购物小助</span>
          </div>
          <div class="header-actions">
            <el-tooltip content="新建对话">
              <el-icon @click="startNewChat"><RefreshRight /></el-icon>
            </el-tooltip>
            <el-tooltip content="历史记录">
              <el-icon @click="showHistory = !showHistory"><Clock /></el-icon>
            </el-tooltip>
          </div>
        </div>

        <!-- 历史会话侧栏 -->
        <transition name="slide-left">
          <div v-if="showHistory" class="history-sidebar">
            <div class="history-header">
              <span>历史会话</span>
              <el-icon @click="showHistory = false"><Close /></el-icon>
            </div>
            <div class="history-list">
              <div
                v-for="session in sessionList"
                :key="session.sessionId"
                class="history-item"
                :class="{ active: currentSessionId === session.sessionId }"
                @click="loadSession(session.sessionId)"
              >
                <el-icon><ChatLineSquare /></el-icon>
                <span class="session-title" :title="session.title">{{ session.title || '新对话' }}</span>
              </div>
              <el-empty v-if="sessionList.length === 0" description="暂无历史" :image-size="60" />
            </div>
          </div>
        </transition>

        <!-- 消息区域 -->
        <div class="chat-messages" ref="chatMessagesRef">
          <!-- 欢迎消息 -->
          <div v-if="messages.length === 0" class="welcome-area">
            <div class="bot-avatar">🛒</div>
            <div class="welcome-text">
              <p>您好！我是购物小助~</p>
              <p>有什么可以帮您的吗？</p>
            </div>
            <div class="quick-btns">
              <el-button size="small" @click="sendQuickMessage('有什么推荐的商品吗')">
                商品推荐
              </el-button>
              <el-button size="small" @click="sendQuickMessage('有什么促销活动吗')">
                促销活动
              </el-button>
            </div>
          </div>

          <!-- 消息列表 -->
          <div
            v-for="msg in messages"
            :key="msg.id"
            class="message-bubble"
            :class="msg.role"
          >
            <div class="bubble-avatar">
              <span v-if="msg.role === 'assistant'">🤖</span>
              <span v-else>👤</span>
            </div>
            <div class="bubble-content" v-html="formatMessage(msg.content)"></div>
          </div>

          <!-- 加载中状态已整合到流式消息中，不需要单独的加载框 -->
        </div>

        <!-- 输入区域 -->
        <div class="chat-input">
          <el-input
            v-model="inputMessage"
            placeholder="请输入您的问题..."
            @keyup.enter="sendMessage"
            :disabled="loading"
          />
          <el-button 
            type="primary" 
            :icon="Promotion"
            @click="sendMessage" 
            :loading="loading"
            :disabled="!inputMessage.trim()"
          />
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Service, Close, RefreshRight, Clock, ChatLineSquare, Promotion } from '@element-plus/icons-vue'
import { sendShopMessage, sendShopMessageStream, getShopChatHistory, getShopSessionList } from '@/api/aiChat'
import { marked } from 'marked'

const isOpen = ref(false)
const showHistory = ref(false)
const sessionList = ref([])
const currentSessionId = ref('')
const messages = ref([])
const inputMessage = ref('')
const loading = ref(false)
const unreadCount = ref(0)
const chatMessagesRef = ref(null)

// 切换聊天窗口
const toggleChat = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    unreadCount.value = 0
    loadSessionList()
  }
}

// 加载会话列表
const loadSessionList = async () => {
  try {
    const res = await getShopSessionList()
    if (res.code === 200) {
      sessionList.value = res.data || []
    }
  } catch (error) {
    console.error('加载会话列表失败:', error)
  }
}

// 开始新对话
const startNewChat = () => {
  currentSessionId.value = ''
  messages.value = []
  inputMessage.value = ''
  showHistory.value = false
}

// 加载会话
const loadSession = async (sessionId) => {
  currentSessionId.value = sessionId
  showHistory.value = false
  try {
    const res = await getShopChatHistory(sessionId)
    if (res.code === 200) {
      messages.value = res.data || []
      await nextTick()
      scrollToBottom()
    }
  } catch (error) {
    ElMessage.error('加载聊天记录失败')
  }
}

// 发送消息 - 使用流式输出
const sendMessage = async () => {
  const message = inputMessage.value.trim()
  if (!message || loading.value) return

  // 添加用户消息
  messages.value.push({
    id: Date.now(),
    role: 'user',
    content: message,
    createTime: new Date()
  })
  inputMessage.value = ''
  await nextTick()
  scrollToBottom()

  loading.value = true

  // 创建 AI 回复占位消息
  const assistantMsg = { id: Date.now() + 1, role: 'assistant', content: '', createTime: new Date() }
  messages.value.push(assistantMsg)

  const payload = { sessionId: currentSessionId.value || null, message }

  // 使用流式 API
  sendShopMessageStream(
    payload,
    // onChunk - 每收到一段内容
    (chunk) => {
      assistantMsg.content += chunk
      nextTick().then(scrollToBottom)
    },
    // onComplete - 流式结束
    (fullContent) => {
      loading.value = false
      loadSessionList()
    },
    // onError - 出错时回退到非流式
    async (error) => {
      console.error('流式请求失败，回退到普通请求:', error)
      // 移除空的占位消息
      const idx = messages.value.findIndex(m => m.id === assistantMsg.id)
      if (idx > -1 && !assistantMsg.content) {
        messages.value.splice(idx, 1)
      }
      // 回退到非流式
      try {
        const res = await sendShopMessage({ sessionId: currentSessionId.value || null, message })
        if (res.code === 200) {
          currentSessionId.value = res.data.sessionId
          messages.value.push({ id: Date.now() + 2, role: 'assistant', content: res.data.reply, createTime: new Date() })
          loadSessionList()
        } else {
          ElMessage.error(res.msg || '发送失败')
        }
      } catch (e) {
        ElMessage.error('发送消息失败')
      } finally {
        loading.value = false
      }
    },
    // onSession - 收到 sessionId
    (sessionId) => {
      currentSessionId.value = sessionId
    }
  )
}

// 快捷消息
const sendQuickMessage = (message) => {
  inputMessage.value = message
  sendMessage()
}

// 格式化消息
const formatMessage = (content) => {
  if (!content) return ''
  try {
    return marked(content)
  } catch {
    return content.replace(/\n/g, '<br>')
  }
}

// 滚动到底部
const scrollToBottom = () => {
  if (chatMessagesRef.value) {
    chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
  }
}

// 监听消息，如果窗口关闭则增加未读计数
watch(messages, (newVal, oldVal) => {
  if (!isOpen.value && newVal.length > oldVal.length) {
    const lastMsg = newVal[newVal.length - 1]
    if (lastMsg.role === 'assistant') {
      unreadCount.value++
    }
  }
})
</script>

<style scoped>
.ai-chat-widget {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 1000;
}

.ai-fab {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #56aaff 0%, #308cff 100%); /* 蓝色风格 */
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(48, 140, 255, 0.4);
  transition: all 0.3s ease;
}

.ai-fab:hover {
  transform: scale(1.1);
}

.ai-fab.active {
  background: #909399;
}

.chat-window {
  position: absolute;
  bottom: 80px;
  right: 0;
  width: 380px;
  height: 500px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: linear-gradient(135deg, #ff9a56 0%, #ff7730 100%);
  color: white;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: bold;
  font-size: 16px;
}

.header-actions {
  display: flex;
  gap: 15px;
}

.header-actions .el-icon {
  cursor: pointer;
  transition: transform 0.3s;
}

.header-actions .el-icon:hover {
  transform: scale(1.2);
}

.history-sidebar {
  position: absolute;
  top: 55px;
  left: 0;
  right: 0;
  bottom: 60px;
  background: white;
  z-index: 10;
  display: flex;
  flex-direction: column;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #e0e0e0;
}

.history-header .el-icon {
  cursor: pointer;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 8px;
  background: #f5f7fa;
}

.history-item .session-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-item:hover {
  background: #e8f0fe;
}

.history-item.active {
  background: #ff7730;
  color: white;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  background: #f9f9f9;
}

.welcome-area {
  text-align: center;
  padding: 30px 20px;
}

.bot-avatar {
  font-size: 50px;
  margin-bottom: 15px;
}

.welcome-text p {
  margin: 5px 0;
  color: #666;
}

.quick-btns {
  margin-top: 15px;
  display: flex;
  gap: 10px;
  justify-content: center;
}

.message-bubble {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.message-bubble.user {
  flex-direction: row-reverse;
}

.bubble-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  background: #f0f0f0;
}

.bubble-content {
  max-width: 70%;
  padding: 10px 14px;
  border-radius: 12px;
  line-height: 1.5;
  font-size: 14px;
}

.message-bubble.assistant .bubble-content {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px 12px 12px 0;
}

.message-bubble.user .bubble-content {
  background: linear-gradient(135deg, #ff9a56 0%, #ff7730 100%);
  color: white;
  border-radius: 12px 12px 0 12px;
}

.bubble-content :deep(p) {
  margin: 0 0 8px;
}

.bubble-content :deep(p:last-child) {
  margin-bottom: 0;
}

.typing-dots {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
}

.typing-dots span {
  width: 6px;
  height: 6px;
  background: #ff7730;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.typing-dots span:nth-child(1) { animation-delay: -0.32s; }
.typing-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.chat-input {
  display: flex;
  gap: 10px;
  padding: 12px 15px;
  border-top: 1px solid #e0e0e0;
  background: white;
}

.chat-input .el-input {
  flex: 1;
}

/* 动画 */
.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from, .slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.slide-left-enter-active, .slide-left-leave-active {
  transition: all 0.3s ease;
}

.slide-left-enter-from, .slide-left-leave-to {
  opacity: 0;
  transform: translateX(-100%);
}
</style>
