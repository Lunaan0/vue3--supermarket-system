<template>
  <div class="ai-purchase">
    <div class="page-header">
      <h2>
        <el-icon><ChatDotRound /></el-icon>
        AI采购助手
      </h2>
      <div class="header-actions">
        <el-button type="primary" @click="startNewChat">
          <el-icon><Plus /></el-icon>
          新建对话
        </el-button>
      </div>
    </div>

    <el-row :gutter="20">
      <!-- 会话列表 -->
      <el-col :span="6">
        <el-card class="session-card">
          <template #header>
            <span>历史会话</span>
          </template>
          <div class="session-list" v-loading="sessionLoading">
            <div
              v-for="session in sessionList"
              :key="session.sessionId"
              class="session-item"
              :class="{ active: currentSessionId === session.sessionId }"
              @click="loadSession(session.sessionId)"
            >
              <el-icon><ChatLineSquare /></el-icon>
              <span class="session-title" :title="session.title">{{ session.title || '新对话' }}</span>
              <el-icon 
                class="delete-btn" 
                @click.stop="deleteSession(session.sessionId)"
              >
                <Delete />
              </el-icon>
            </div>
            <el-empty v-if="sessionList.length === 0" description="暂无历史会话" :image-size="80" />
          </div>
        </el-card>
      </el-col>

      <!-- 聊天区域 -->
      <el-col :span="18">
        <el-card class="chat-card">
          <!-- 聊天消息区域 -->
          <div class="chat-messages" ref="chatMessagesRef">
            <!-- 欢迎消息 -->
            <div v-if="messages.length === 0" class="welcome-message">
              <div class="ai-avatar">
                <el-icon :size="40"><Cpu /></el-icon>
              </div>
              <h3>您好！我是智采助手 🛒</h3>
              <p>我可以帮您分析库存数据、生成采购建议。请问有什么可以帮您的？</p>
              <div class="quick-actions">
                <el-button @click="sendQuickMessage('帮我看看哪些商品需要补货')">
                  📦 查看库存预警商品
                </el-button>
                <el-button @click="sendQuickMessage('帮我生成采购建议')">
                  📋 生成采购建议
                </el-button>
                <el-button @click="sendQuickMessage('分析一下近期销售情况')">
                  📊 分析销售数据
                </el-button>
              </div>
            </div>

            <!-- 消息列表 -->
            <div
              v-for="msg in messages"
              :key="msg.id"
              class="message-item"
              :class="msg.role"
            >
              <div class="message-avatar">
                <el-icon v-if="msg.role === 'assistant'" :size="24"><Cpu /></el-icon>
                <el-icon v-else :size="24"><User /></el-icon>
              </div>
              <div class="message-content">
                <div class="message-text" v-html="formatMessage(msg.content)"></div>
                <div class="message-time">{{ formatTime(msg.createTime) }}</div>
              </div>
            </div>

            <!-- 加载中状态已整合到流式消息中，不需要单独的加载框 -->
          </div>

          <!-- 输入区域 -->
          <div class="chat-input">
            <el-input
              v-model="inputMessage"
              type="textarea"
              :rows="2"
              placeholder="输入您的问题，如：帮我看看哪些商品需要补货..."
              @keyup.enter.ctrl="sendMessage"
              :disabled="loading"
            />
            <el-button 
              type="primary" 
              @click="sendMessage" 
              :loading="loading"
              :disabled="!inputMessage.trim()"
            >
              <el-icon><Promotion /></el-icon>
              发送
            </el-button>
          </div>
          <div class="input-tip">按 Ctrl + Enter 发送消息</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ChatDotRound, Plus, ChatLineSquare, Delete, Cpu, User, Promotion } from '@element-plus/icons-vue'
import { sendPurchaseMessage, sendPurchaseMessageStream, getPurchaseChatHistory, getPurchaseSessionList, deletePurchaseSession } from '@/api/aiChat'
import { marked } from 'marked'

const sessionList = ref([])
const sessionLoading = ref(false)
const currentSessionId = ref('')
const messages = ref([])
const inputMessage = ref('')
const loading = ref(false)
const chatMessagesRef = ref(null)

// 加载会话列表
const loadSessionList = async () => {
  sessionLoading.value = true
  try {
    const res = await getPurchaseSessionList()
    if (res.code === 200) {
      sessionList.value = res.data || []
    }
  } catch (error) {
    console.error('加载会话列表失败:', error)
  } finally {
    sessionLoading.value = false
  }
}

// 开始新对话
const startNewChat = () => {
  currentSessionId.value = ''
  messages.value = []
  inputMessage.value = ''
}

// 加载会话
const loadSession = async (sessionId) => {
  currentSessionId.value = sessionId
  try {
    const res = await getPurchaseChatHistory(sessionId)
    if (res.code === 200) {
      messages.value = res.data || []
      await nextTick()
      scrollToBottom()
    }
  } catch (error) {
    ElMessage.error('加载聊天记录失败')
  }
}

// 删除会话
const deleteSession = async (sessionId) => {
  try {
    await ElMessageBox.confirm('确定要删除这个会话吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await deletePurchaseSession(sessionId)
    ElMessage.success('删除成功')
    
    if (currentSessionId.value === sessionId) {
      startNewChat()
    }
    loadSessionList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 发送消息 - 使用流式输出
const sendMessage = async () => {
  const message = inputMessage.value.trim()
  if (!message || loading.value) return

  // 添加用户消息
  messages.value.push({ id: Date.now(), role: 'user', content: message, createTime: new Date() })
  inputMessage.value = ''
  await nextTick()
  scrollToBottom()

  loading.value = true

  // 创建 AI 回复占位消息
  const assistantMsg = { id: Date.now() + 1, role: 'assistant', content: '', createTime: new Date() }
  messages.value.push(assistantMsg)

  const payload = { sessionId: currentSessionId.value || null, message }

  // 使用流式 API
  sendPurchaseMessageStream(
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
        const res = await sendPurchaseMessage({ sessionId: currentSessionId.value || null, message })
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

// 格式化消息（支持Markdown）
const formatMessage = (content) => {
  if (!content) return ''
  try {
    return marked(content)
  } catch {
    return content.replace(/\n/g, '<br>')
  }
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}

// 滚动到底部
const scrollToBottom = () => {
  if (chatMessagesRef.value) {
    chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
  }
}

onMounted(() => {
  loadSessionList()
})
</script>

<style scoped>
.ai-purchase {
  padding: 20px;
  height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.session-card {
  height: calc(100vh - 180px);
}

.session-card :deep(.el-card__body) {
  padding: 0;
  height: calc(100% - 50px);
  overflow-y: auto;
}

.session-list {
  padding: 10px;
}

.session-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 8px;
  transition: all 0.3s;
  background: #f5f7fa;
}

.session-item .session-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-item:hover {
  background: #e8f0fe;
}

.session-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.session-item .delete-btn {
  margin-left: auto;
  opacity: 0;
  transition: opacity 0.3s;
}

.session-item:hover .delete-btn {
  opacity: 1;
}

.chat-card {
  height: calc(100vh - 180px);
  display: flex;
  flex-direction: column;
}

.chat-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f9f9f9;
}

.welcome-message {
  text-align: center;
  padding: 40px 20px;
}

.ai-avatar {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.welcome-message h3 {
  margin: 0 0 10px;
  color: #333;
}

.welcome-message p {
  color: #666;
  margin-bottom: 20px;
}

.quick-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.message-item {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.message-item.assistant .message-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.message-item.user .message-avatar {
  background: #f0f0f0;
  color: #666;
}

.message-content {
  max-width: 70%;
}

.message-text {
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.6;
}

.message-item.assistant .message-text {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px 12px 12px 0;
}

.message-item.user .message-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px 12px 0 12px;
}

.message-text :deep(p) {
  margin: 0 0 10px;
}

.message-text :deep(p:last-child) {
  margin-bottom: 0;
}

.message-text :deep(ul), .message-text :deep(ol) {
  margin: 10px 0;
  padding-left: 20px;
}

.message-text :deep(strong) {
  font-weight: bold;
}

.message-time {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
  text-align: right;
}

.message-item.user .message-time {
  text-align: left;
}

/* 打字动画 */
.typing {
  display: flex;
  gap: 4px;
  padding: 15px 20px;
}

.typing span {
  width: 8px;
  height: 8px;
  background: #667eea;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.typing span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.chat-input {
  display: flex;
  gap: 10px;
  padding: 15px 20px;
  border-top: 1px solid #e0e0e0;
  background: white;
}

.chat-input .el-textarea {
  flex: 1;
}

.chat-input .el-button {
  height: 60px;
  width: 80px;
}

.input-tip {
  text-align: right;
  padding: 5px 20px 10px;
  font-size: 12px;
  color: #999;
  background: white;
}
</style>
