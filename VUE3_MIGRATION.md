# OpenClaw Chat UI - Vue 3 迁移方案

## 📦 技术栈

```json
{
  "vue": "^3.5.x",
  "typescript": "^5.7.x",
  "vite": "^6.x",
  "pinia": "^3.x",
  "vueuse": "^12.x",
  "naive-ui": "^2.40.x",
  "@vicons/ionicons5": "^0.14.x"
}
```

## 🏗️ 项目结构

```
src/
├── main.ts
├── App.vue
├── components/
│   ├── Sidebar.vue
│   ├── ChatPanel.vue
│   ├── ConnectPanel.vue
│   ├── SettingsPanel.vue
│   ├── MessageList.vue
│   ├── MessageInput.vue
│   ├── TypingIndicator.vue
│   └── Toast.vue
├── composables/
│   ├── useWebSocket.ts
│   ├── useChat.ts
│   ├── useSessions.ts
│   └── useSettings.ts
├── stores/
│   ├── chat.ts
│   ├── sessions.ts
│   └── settings.ts
├── types/
│   ├── gateway.ts
│   └── chat.ts
└── utils/
    ├── websocket.ts
    ├── crypto.ts
    └── format.ts
```

## 📝 核心代码示例

### 1. WebSocket Composable (`useWebSocket.ts`)

```typescript
import { ref, onUnmounted } from 'vue'
import { useChatStore } from '@/stores/chat'

export function useWebSocket() {
  const ws = ref<WebSocket | null>(null)
  const isConnected = ref(false)
  const isConnecting = ref(false)
  const error = ref<string | null>(null)

  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  const MAX_RECONNECT_ATTEMPTS = 5
  let reconnectAttempts = 0

  function connect(sessionId: string, gatewayUrl: string, token: string) {
    isConnecting.value = true
    error.value = null

    const wsUrl = gatewayUrl.replace('http', 'ws')
    ws.value = new WebSocket(wsUrl)

    ws.value.onopen = () => {
      console.log('[WS] Connected')
      isConnected.value = true
      isConnecting.value = false
      reconnectAttempts = 0
    }

    ws.value.onmessage = (event) => {
      const message = JSON.parse(event.data)
      handleWebSocketMessage(sessionId, message)
    }

    ws.value.onclose = () => {
      console.log('[WS] Disconnected')
      isConnected.value = false
      attemptReconnect(sessionId, gatewayUrl, token)
    }

    ws.value.onerror = (err) => {
      console.error('[WS] Error:', err)
      error.value = 'WebSocket 连接错误'
    }
  }

  function handleWebSocketMessage(sessionId: string, message: any) {
    const chatStore = useChatStore()

    if (message.type === 'res' && message.id?.startsWith('req-chat-')) {
      if (!message.ok) {
        chatStore.markMessageFailed(message.id)
      }
      return
    }

    if (message.event === 'agent' && message.params?.text) {
      chatStore.addAssistantMessage(sessionId, message.params.text)
    }
  }

  function attemptReconnect(sessionId: string, gatewayUrl: string, token: string) {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      error.value = '重连失败，请手动连接'
      return
    }

    reconnectAttempts++
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000)

    reconnectTimer = setTimeout(() => {
      connect(sessionId, gatewayUrl, token)
    }, delay)
  }

  function send(sessionId: string, message: any) {
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify(message))
      return Promise.resolve(true)
    }
    return Promise.reject(new Error('未连接到 Gateway'))
  }

  function disconnect() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    if (ws.value) {
      ws.value.close()
      ws.value = null
    }
    isConnected.value = false
  }

  onUnmounted(() => {
    disconnect()
  })

  return {
    ws,
    isConnected,
    isConnecting,
    error,
    connect,
    send,
    disconnect
  }
}
```

### 2. Chat Store (`stores/chat.ts`)

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  status?: 'sending' | 'sent' | 'failed'
  runId?: string
}

export const useChatStore = defineStore('chat', () => {
  const messages = ref<Map<string, Message[]>>(new Map())
  const currentSessionId = ref<string | null>(null)

  const currentMessages = computed(() => {
    if (!currentSessionId.value) return []
    return messages.value.get(currentSessionId.value) || []
  })

  function addMessage(sessionId: string, message: Message) {
    if (!messages.value.has(sessionId)) {
      messages.value.set(sessionId, [])
    }
    messages.value.get(sessionId)!.push(message)
  }

  function addAssistantMessage(sessionId: string, content: string) {
    addMessage(sessionId, {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content,
      timestamp: Date.now()
    })
  }

  function markMessageFailed(requestId: string) {
    // 实现标记消息失败的逻辑
  }

  function clearMessages(sessionId: string) {
    messages.value.set(sessionId, [])
  }

  return {
    messages,
    currentSessionId,
    currentMessages,
    addMessage,
    addAssistantMessage,
    markMessageFailed,
    clearMessages
  }
})
```

### 3. MessageInput 组件 (`MessageInput.vue`)

```vue
<template>
  <div class="message-input-container">
    <NInput
      v-model:value="message"
      :disabled="disabled || isSending"
      :placeholder="placeholder"
      :autosize="{ minRows: 1, maxRows: 5 }"
      type="textarea"
      @keydown.enter.exact.prevent="handleSend"
    />
    <NButton
      type="primary"
      :disabled="!message.trim() || disabled || isSending"
      :loading="isSending"
      @click="handleSend"
    >
      <template #icon>
        <n-icon :component="Send" />
      </template>
      发送
    </NButton>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Send } from '@vicons/ionicons5'
import { NInput, NButton, NIcon } from 'naive-ui'

const props = defineProps<{
  disabled?: boolean
  placeholder?: string
}>()

const emit = defineEmits<{
  send: [message: string]
}>()

const message = ref('')
const isSending = ref(false)

async function handleSend() {
  if (!message.value.trim()) return

  isSending.value = true
  try {
    await emit('send', message.value.trim())
    message.value = ''
  } finally {
    isSending.value = false
  }
}
</script>

<style scoped>
.message-input-container {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: var(--panel-bg);
  border-top: 1px solid var(--border-color);
}
</style>
```

### 4. 主应用 (`App.vue`)

```vue
<template>
  <NConfigProvider :theme="darkTheme">
    <NMessageProvider>
      <div class="app">
        <Sidebar v-model:selected-session="selectedSession" />
        <main class="main-content">
          <ConnectPanel
            v-if="!isConnected"
            @connect="handleConnect"
          />
          <ChatPanel
            v-else
            :session-id="selectedSession"
          />
        </main>
        <SettingsPanel v-model:show="showSettings" />
        <Toast :message="toastMessage" :show="showToast" />
      </div>
    </NMessageProvider>
  </NConfigProvider>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NConfigProvider, NMessageProvider, darkTheme } from 'naive-ui'
import { useWebSocket } from '@/composables/useWebSocket'
import Sidebar from '@/components/Sidebar.vue'
import ConnectPanel from '@/components/ConnectPanel.vue'
import ChatPanel from '@/components/ChatPanel.vue'
import SettingsPanel from '@/components/SettingsPanel.vue'
import Toast from '@/components/Toast.vue'

const selectedSession = ref<string | null>(null)
const showSettings = ref(false)
const toastMessage = ref('')
const showToast = ref(false)

const { connect, send, disconnect, isConnected } = useWebSocket()

async function handleConnect(sessionId: string, gatewayUrl: string, token: string) {
  try {
    await connect(sessionId, gatewayUrl, token)
  } catch (error) {
    toastMessage.value = '连接失败：' + (error as Error).message
    showToast.value = true
  }
}
</script>

<style scoped>
.app {
  display: flex;
  height: 100vh;
  background: var(--bg-color);
}

.main-content {
  flex: 1;
  overflow: hidden;
}
</style>
```

## 🎯 迁移步骤

### 第一阶段：基础设置
1. 安装 Vue 3 + Vite + TypeScript
2. 配置 ESLint + Prettier
3. 安装 Naive UI 组件库
4. 设置 CSS 变量主题

### 第二阶段：状态管理
1. 创建 Pinia stores
2. 迁移会话管理逻辑
3. 迁移消息管理逻辑
4. 迁移设置管理

### 第三阶段：组件开发
1. 开发基础组件（Button, Input 等使用 Naive UI）
2. 开发业务组件（Sidebar, ChatPanel 等）
3. 开发 WebSocket composable
4. 开发消息发送/接收逻辑

### 第四阶段：测试与优化
1. 单元测试（Vitest）
2. E2E 测试（Playwright）
3. 性能优化
4. 打包构建

## 📊 对比优势

| 特性 | 当前原生 JS | Vue 3 版本 |
|------|------------|----------|
| 代码行数 | ~700 | ~400 |
| 类型安全 | ❌ | ✅ TypeScript |
| 状态管理 | Map + localStorage | Pinia |
| 组件复用 | 低 | 高 |
| 热更新 | ❌ | ✅ Vite HMR |
| 调试工具 | 基础 | Vue DevTools |
| 测试支持 | 困难 | Vitest + Testing Library |

## 🚀 快速开始

```bash
# 创建新项目
npm create vue@latest openclaw-chat-ui-vue
cd openclaw-chat-ui-vue

# 安装依赖
npm install
npm install pinia naive-ui @vicons/ionicons5
npm install -D @types/node

# 启动开发服务器
npm run dev
```
