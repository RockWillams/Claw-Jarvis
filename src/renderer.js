// DOM 元素
const sidebar = document.getElementById('sidebar');
const sessionsList = document.getElementById('sessions-list');
const connectPanel = document.getElementById('connect-panel');
const chatPanel = document.getElementById('chat-panel');
const settingsPanel = document.getElementById('settings-panel');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// 连接表单
const sessionNameInput = document.getElementById('session-name');
const gatewayUrlInput = document.getElementById('gateway-url');
const gatewayTokenInput = document.getElementById('gateway-token');
const toggleTokenBtn = document.getElementById('toggle-token');
const tokenHelpBtn = document.getElementById('token-help-btn');
const tokenHelp = document.getElementById('token-help');
const copyTokenPathBtn = document.getElementById('copy-token-path');
const openTokenFileBtn = document.getElementById('open-token-file');
const connectBtn = document.getElementById('connect-btn');
const connectionStatus = document.getElementById('connection-status');
const gatewayDetect = document.getElementById('gateway-detect');
const gatewayStatusIcon = document.getElementById('gateway-status-icon');
const gatewayStatusText = document.getElementById('gateway-status-text');

// 聊天界面
const toggleSidebarBtn = document.getElementById('toggle-sidebar');
const currentSessionNameEl = document.getElementById('current-session-name');
const connectionIndicator = document.getElementById('connection-indicator');
const gatewayStatusEl = document.getElementById('gateway-status');
const disconnectBtn = document.getElementById('disconnect-btn');
const exportBtn = document.getElementById('export-btn');
const clearChatBtn = document.getElementById('clear-chat-btn');
const messagesContainer = document.getElementById('messages-container');
const messages = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const charCountEl = document.getElementById('char-count');
const typingIndicator = document.getElementById('typing-indicator');

// 文件上传
const uploadBtn = document.getElementById('upload-btn');
const fileInput = document.getElementById('file-input');
const filePreviewContainer = document.getElementById('file-preview-container');

// 设置面板
const settingsBtn = document.getElementById('settings-btn');
const settingsCloseBtn = document.getElementById('settings-close');
const clearStorageBtn = document.getElementById('clear-storage-btn');
const exportAllBtn = document.getElementById('export-all-btn');
const newSessionBtn = document.getElementById('new-session-btn');

// 设置项
const settingAutoScroll = document.getElementById('setting-auto-scroll');
const settingShowTimestamp = document.getElementById('setting-show-timestamp');
const settingMarkdown = document.getElementById('setting-markdown');

// 状态
let sessions = new Map();
let activeSessionId = null;
let gatewayCheckInterval = null;
let isSending = false;
let pendingRequestIds = new Set();
let pendingFiles = []; // 待发送的文件

// 默认配置
const DEFAULT_CONFIG = {
  gatewayUrl: 'http://127.0.0.1:18789',
  token: ''
};

// 初始化
async function init() {
  loadSettings();
  loadSessions();
  loadAppConfig();
  setupEventListeners();
  setupMenuListeners();
  window.electronAPI.onWsMessage(handleWsMessage);
  window.electronAPI.onWsClose(handleWsClose);

  // 自动检测 Gateway
  detectGateway();
  gatewayCheckInterval = setInterval(detectGateway, 5000);

  updateSessionsList();

  // 自动聚焦到输入框
  setTimeout(() => {
    if (!connectPanel.classList.contains('hidden')) {
      sessionNameInput.focus();
    }
  }, 100);
}

// Toast 通知
function showToast(message, duration = 3000) {
  toastMessage.textContent = message;
  toast.classList.remove('hidden');
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
    toast.classList.add('hidden');
  }, duration);
}

// 加载应用配置（记住 Token）
function loadAppConfig() {
  const config = JSON.parse(localStorage.getItem('appConfig') || '{}');
  if (config.gatewayUrl) gatewayUrlInput.value = config.gatewayUrl;
  if (config.token) gatewayTokenInput.value = config.token;
  else if (DEFAULT_CONFIG.token) gatewayTokenInput.value = DEFAULT_CONFIG.token;
}

// 保存应用配置
function saveAppConfig() {
  const config = {
    gatewayUrl: gatewayUrlInput.value.trim(),
    token: gatewayTokenInput.value.trim()
  };
  localStorage.setItem('appConfig', JSON.stringify(config));
}

// 自动检测 Gateway - 使用 WebSocket 检测避免 Origin 限制
async function detectGateway() {
  const url = gatewayUrlInput.value.trim() || DEFAULT_CONFIG.gatewayUrl;
  if (!url) return;

  try {
    const wsUrl = url.replace('http://', 'ws://').replace('https://', 'wss://');

    await new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      const timeoutId = setTimeout(() => {
        ws.close();
        reject(new Error('Connection timeout'));
      }, 2000);

      ws.onopen = () => {
        clearTimeout(timeoutId);
        ws.close();
        resolve();
      };

      ws.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error('WebSocket connection failed'));
      };
    });

    console.log('Gateway detected OK');
    updateGatewayStatus('success', 'Gateway 在线');
  } catch (error) {
    console.log('Gateway detection failed:', error.message);
    updateGatewayStatus('error', 'Gateway 未响应');
  }
}

// 更新 Gateway 状态
function updateGatewayStatus(status, text) {
  gatewayDetect.className = `gateway-detect ${status}`;
  gatewayStatusIcon.textContent = status === 'success' ? '✅' : '❌';
  gatewayStatusText.textContent = text;
  gatewayStatusText.className = `status-text ${status}`;
  updateConnectButton();
}

// 更新连接按钮状态
function updateConnectButton() {
  const token = gatewayTokenInput.value.trim();
  const gatewayOk = gatewayDetect.classList.contains('success');
  connectBtn.disabled = !token || !gatewayOk;
}

// 加载设置
function loadSettings() {
  const settings = JSON.parse(localStorage.getItem('chatSettings') || '{}');
  settingAutoScroll.checked = settings.autoScroll !== false;
  settingShowTimestamp.checked = settings.showTimestamp !== false;
  settingMarkdown.checked = settings.markdown !== false;
}

// 保存设置
function saveSettings() {
  const settings = {
    autoScroll: settingAutoScroll.checked,
    showTimestamp: settingShowTimestamp.checked,
    markdown: settingMarkdown.checked
  };
  localStorage.setItem('chatSettings', JSON.stringify(settings));
}

// 加载会话列表
function loadSessions() {
  const saved = localStorage.getItem('sessions');
  if (saved) {
    const sessionData = JSON.parse(saved);
    sessions = new Map(Object.entries(sessionData));
  }
}

// 保存会话列表
function saveSessions() {
  const sessionData = Object.fromEntries(sessions);
  localStorage.setItem('sessions', JSON.stringify(sessionData));
}

// 设置事件监听
function setupEventListeners() {
  connectBtn.addEventListener('click', connect);
  disconnectBtn.addEventListener('click', disconnect);
  sendBtn.addEventListener('click', sendMessage);
  toggleTokenBtn.addEventListener('click', toggleTokenVisibility);
  tokenHelpBtn.addEventListener('click', toggleTokenHelp);
  copyTokenPathBtn.addEventListener('click', copyTokenPath);
  openTokenFileBtn.addEventListener('click', openTokenFile);
  toggleSidebarBtn.addEventListener('click', toggleSidebar);
  newSessionBtn.addEventListener('click', showConnectPanel);
  exportBtn.addEventListener('click', exportChat);
  clearChatBtn.addEventListener('click', clearChat);
  settingsBtn.addEventListener('click', showSettings);
  settingsCloseBtn.addEventListener('click', hideSettings);
  clearStorageBtn.addEventListener('click', clearStorage);
  exportAllBtn.addEventListener('click', exportAllChats);

  // 文件上传
  uploadBtn.addEventListener('click', handleUploadClick);
  fileInput.addEventListener('change', handleFileSelect);

  messageInput.addEventListener('keydown', handleKeydown);
  messageInput.addEventListener('input', handleInput);

  // 拖拽上传
  setupDragAndDrop();

  gatewayUrlInput.addEventListener('change', () => { detectGateway(); saveAppConfig(); });
  gatewayUrlInput.addEventListener('input', detectGateway);
  gatewayTokenInput.addEventListener('input', () => { updateConnectButton(); saveAppConfig(); });

  [settingAutoScroll, settingShowTimestamp, settingMarkdown].forEach(el => {
    el.addEventListener('change', saveSettings);
  });
}

// 监听菜单事件
function setupMenuListeners() {
  window.electronAPI.onMenuNewSession(() => showConnectPanel());
  window.electronAPI.onMenuSwitchSession(() => toggleSidebar());
  window.electronAPI.onMenuExportChat(() => exportChat());
}

// 切换 Token 显示
function toggleTokenVisibility() {
  const type = gatewayTokenInput.type === 'password' ? 'text' : 'password';
  gatewayTokenInput.type = type;
  toggleTokenBtn.textContent = type === 'password' ? '👁️' : '🙈';
}

// 切换 Token 帮助
function toggleTokenHelp() {
  tokenHelp.classList.toggle('show');
}

// 复制 Token 路径
async function copyTokenPath() {
  const path = '%USERPROFILE%\\.openclaw\\openclaw.json';
  try {
    await navigator.clipboard.writeText(path);
    showToast('已复制配置文件路径');
  } catch (err) {
    showToast('复制失败，请手动复制');
  }
}

// 打开 Token 文件
async function openTokenFile() {
  const path = process.env.USERPROFILE + '\\.openclaw\\openclaw.json';
  try {
    const { shell } = require('electron');
    shell.openPath(path);
    showToast('正在打开配置文件...');
  } catch (err) {
    showToast('无法打开文件，请手动查找');
  }
}

// 处理键盘事件
function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

// 处理输入事件
function handleInput() {
  messageInput.style.height = 'auto';
  messageInput.style.height = Math.min(messageInput.scrollHeight, 200) + 'px';

  const count = messageInput.value.length;
  charCountEl.textContent = `${count} 字`;

  // 有文本或有文件时启用发送按钮
  const hasText = messageInput.value.trim();
  const hasFiles = pendingFiles.length > 0;
  sendBtn.disabled = (!hasText && !hasFiles) || !activeSessionId || isSending;
}

// 切换侧边栏
function toggleSidebar() {
  sidebar.classList.toggle('hidden');
}

// 显示连接面板
function showConnectPanel() {
  chatPanel.classList.add('hidden');
  connectPanel.classList.remove('hidden');
  sidebar.classList.add('hidden');
  sessionNameInput.value = generateSessionName();
  sessionNameInput.focus();
}

// 显示设置面板
function showSettings() {
  settingsPanel.classList.remove('hidden');
}

// 隐藏设置面板
function hideSettings() {
  settingsPanel.classList.add('hidden');
}

// 连接 Gateway
async function connect() {
  const sessionName = sessionNameInput.value.trim() || generateSessionName();
  const gatewayUrl = gatewayUrlInput.value.trim() || DEFAULT_CONFIG.gatewayUrl;
  const token = gatewayTokenInput.value.trim();

  if (!token) {
    showToast('请输入 Gateway Token');
    return;
  }

  // 保存配置
  saveAppConfig();

  const sessionId = 'session-' + Date.now();

  // 更新 UI 为加载中
  connectBtn.disabled = true;
  connectBtn.querySelector('.btn-text').classList.add('hidden');
  connectBtn.querySelector('.btn-loading').classList.remove('hidden');

  console.log('🔌 Connecting to:', gatewayUrl);
  console.log('🆔 Session ID:', sessionId);
  console.log('🔑 Token length:', token.length);

  try {
    console.log('📡 Calling createSession...');
    const result = await window.electronAPI.createSession(sessionId, gatewayUrl, token);

    console.log('📨 Connection result:', result);

    if (result.success) {
      console.log('✅ Connection successful!');
      sessions.set(sessionId, {
        name: sessionName,
        gatewayUrl,
        token,
        connected: true,
        createdAt: Date.now(),
        messages: [],
        lastActiveAt: Date.now()
      });
      saveSessions();

      activeSessionId = sessionId;

      connectPanel.classList.add('hidden');
      chatPanel.classList.remove('hidden');
      sidebar.classList.remove('hidden');

      updateConnectionStatus(true);
      updateSessionsList();
      switchSession(sessionId);

      showToast('连接成功!');
    } else {
      console.error('❌ Connection failed:', result.error);
      let errorMsg = result.error || '连接失败';
      // 提供错误恢复建议
      if (errorMsg.includes('token mismatch')) {
        errorMsg += '\n请检查 Token 是否正确，可从 openclaw.json 中复制';
      } else if (errorMsg.includes('device')) {
        errorMsg += '\n设备认证失败，请尝试重启 Gateway';
      }
      showToast('连接失败：' + errorMsg);
    }
  } catch (error) {
    console.error('❌ Connection error:', error);
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);
    showToast('连接失败：' + error.message);
  } finally {
    connectBtn.disabled = false;
    connectBtn.querySelector('.btn-text').classList.remove('hidden');
    connectBtn.querySelector('.btn-loading').classList.add('hidden');
  }
}

// 断开连接
async function disconnect() {
  if (!activeSessionId) return;

  await window.electronAPI.closeSession({ sessionId: activeSessionId });

  const session = sessions.get(activeSessionId);
  if (session) {
    session.connected = false;
    saveSessions();
  }

  updateConnectionStatus(false);
  updateSessionsList();
  showToast('已断开连接');
}

// 切换会话
function switchSession(sessionId) {
  activeSessionId = sessionId;
  const session = sessions.get(sessionId);

  if (!session) return;

  currentSessionNameEl.textContent = session.name;
  updateConnectionStatus(session.connected);
  loadMessages(sessionId);
  updateSessionsList();
  sendBtn.disabled = !session.connected || isSending;

  // 聚焦到输入框
  setTimeout(() => messageInput.focus(), 50);
}

// 更新会话列表
function updateSessionsList() {
  sessionsList.innerHTML = '';

  // 按最近活动时间排序
  const sortedSessions = [...sessions.entries()].sort((a, b) => {
    return (b[1].lastActiveAt || 0) - (a[1].lastActiveAt || 0);
  });

  sortedSessions.forEach(([sessionId, session]) => {
    const item = document.createElement('div');
    item.className = `session-item ${sessionId === activeSessionId ? 'active' : ''}`;
    const statusClass = session.connected ? 'connected' : 'disconnected';
    const msgCount = session.messages?.length || 0;
    item.innerHTML = `
      <span class="session-icon">${session.connected ? '🟢' : '⚪'}</span>
      <span class="session-name">${session.name}</span>
      <span class="session-msg-count">${msgCount > 0 ? msgCount : ''}</span>
      <span class="session-status ${statusClass}"></span>
      <button class="session-delete-btn" title="删除会话" data-session-id="${sessionId}">×</button>
    `;
    item.addEventListener('click', (e) => {
      // 如果点击的是删除按钮，不切换会话
      if (e.target.classList.contains('session-delete-btn')) {
        return;
      }
      switchSession(sessionId);
    });
    sessionsList.appendChild(item);
  });

  // 添加删除按钮事件监听
  document.querySelectorAll('.session-delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const sessionId = btn.getAttribute('data-session-id');
      deleteSession(sessionId);
    });
  });
}

// 删除会话
function deleteSession(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return;

  const confirmed = confirm(`确定要删除会话"${session.name}"吗？\n此操作将删除该会话的所有聊天记录。`);
  if (!confirmed) return;

  // 如果删除的是当前会话，需要断开连接
  if (sessionId === activeSessionId) {
    window.electronAPI.closeSession({ sessionId });
    activeSessionId = null;
    showConnectPanel();
  } else {
    window.electronAPI.closeSession({ sessionId });
  }

  sessions.delete(sessionId);
  saveSessions();
  updateSessionsList();
  showToast('已删除会话');
}

// 更新连接状态
function updateConnectionStatus(connected) {
  if (connected) {
    connectionIndicator.className = 'indicator connected';
    gatewayStatusEl.textContent = '已连接';
    gatewayStatusEl.style.color = 'var(--success-color)';
    const hasText = messageInput.value.trim();
    const hasFiles = pendingFiles.length > 0;
    sendBtn.disabled = (!hasText && !hasFiles) || isSending;
  } else {
    connectionIndicator.className = 'indicator disconnected';
    gatewayStatusEl.textContent = '未连接';
    gatewayStatusEl.style.color = 'var(--text-muted)';
    sendBtn.disabled = true;
  }
}

// 发送消息
async function sendMessage() {
  const text = messageInput.value.trim();
  const hasFiles = pendingFiles.length > 0;

  if ((!text && !hasFiles) || !activeSessionId || isSending) return;

  const session = sessions.get(activeSessionId);
  if (!session || !session.connected) {
    showToast('未连接到 Gateway');
    return;
  }

  // 设置发送中状态
  isSending = true;
  sendBtn.disabled = true;
  showTypingIndicator(true);

  // 构建消息内容（包含文件信息）
  let messageContent = text;
  const attachments = [];

  // 处理文件
  for (const file of pendingFiles) {
    attachments.push({
      id: file.id,
      name: file.name,
      size: file.size,
      mimeType: file.mimeType,
      isImage: file.isImage,
      url: file.url,
      ocrText: file.ocrText,
      textContent: file.textContent
    });

    // 如果是图片，添加到消息上下文中
    if (file.isImage) {
      messageContent += `\n\n[图片附件：${file.name}]`;
    } else if (file.textContent) {
      // 文档内容添加到上下文中
      messageContent += `\n\n[文档附件：${file.name}]`;
      messageContent += `\n文件内容：${file.textContent}`;
    } else {
      messageContent += `\n\n[文档附件：${file.name}]`;
    }
  }

  // 添加用户消息到界面
  addMessage('user', messageContent, null, attachments);
  session.messages.push({
    role: 'user',
    content: messageContent,
    timestamp: Date.now(),
    status: 'sent',
    attachments
  });

  // 生成请求 ID 用于追踪
  const requestId = 'req-chat-' + Date.now();
  pendingRequestIds.add(requestId);

  const chatMessage = {
    type: 'req',
    id: requestId,
    method: 'chat.send',
    params: {
      sessionKey: activeSessionId,
      message: messageContent,
      idempotencyKey: requestId
    }
  };

  console.log('[📤 SEND] Chat message:', JSON.stringify(chatMessage));
  window.electronAPI.sendMessage({ sessionId: activeSessionId, message: chatMessage });

  // 清空输入框和文件
  messageInput.value = '';
  messageInput.style.height = 'auto';
  charCountEl.textContent = '0 字';
  pendingFiles = [];
  filePreviewContainer.innerHTML = '';
  filePreviewContainer.classList.add('hidden');

  saveSessions();

  // 更新最后活动时间
  session.lastActiveAt = Date.now();
  updateSessionsList();
}

// 显示/隐藏打字指示器
function showTypingIndicator(show) {
  if (typingIndicator) {
    typingIndicator.classList.toggle('hidden', !show);
  }
}

// 处理 WebSocket 消息
function handleWsMessage(data) {
  const { sessionId, message } = data;

  console.log('[📨 WS Message]', sessionId, message);

  if (sessionId !== activeSessionId) return;

  const session = sessions.get(sessionId);

  // 处理 chat.send 响应
  if (message.type === 'res' && message.id?.startsWith('req-chat-')) {
    pendingRequestIds.delete(message.id);

    if (!message.ok) {
      console.error('[❌ Chat send failed]', message.error);
      isSending = false;
      showTypingIndicator(false);
      sendBtn.disabled = !messageInput.value.trim();

      // 标记最后一条消息为失败
      if (session && session.messages.length > 0) {
        const lastMsg = session.messages[session.messages.length - 1];
        if (lastMsg.role === 'user' && lastMsg.status === 'sent') {
          lastMsg.status = 'failed';
          saveSessions();
        }
      }

      showToast('发送失败：' + (message.error?.message || '未知错误'));
      return;
    }

    console.log('[✅ Chat send OK]');
    // 发送成功，等待 AI 回复
    return;
  }

  // 处理 agent 事件（AI 回复）
  if (message.event === 'agent') {
    console.log('[🤖 Agent event]', message);

    // Gateway 使用 payload 而不是 params
    const payload = message.payload || message.params || {};
    const runId = payload.runId;

    // 处理流式响应
    if (payload.stream) {
      // 流式文本块（stream: 'assistant' 或 'text'）
      if ((payload.stream === 'assistant' || payload.stream === 'text') && payload.data) {
        // 使用 delta（增量）或 text（完整文本）
        const chunkText = payload.data.delta || payload.data.text || '';
        if (chunkText) {
          handleStreamingText(chunkText, runId);
        }
        return;
      }

      // lifecycle 事件（开始/结束）
      if (payload.stream === 'lifecycle') {
        const phase = payload.data?.phase;
        if (phase === 'start') {
          console.log('[🤖 AI Start] runId:', runId);
          showTypingIndicator(true);
        } else if (phase === 'end') {
          console.log('[🤖 AI End] runId:', runId);
          showTypingIndicator(false);
          isSending = false;
          sendBtn.disabled = !messageInput.value.trim();
        }
        return;
      }
    }

    // 完整文本响应（非流式）
    const text = payload.text || payload.content || '';
    if (text) {
      // 更新或添加 AI 回复
      updateOrCreateAssistantMessage(text, runId);

      if (session) {
        // 检查是否已有相同 runId 的消息
        const existingMsg = session.messages.find(m => m.runId === runId && m.role === 'assistant');
        if (existingMsg) {
          existingMsg.content = text;
        } else {
          session.messages.push({
            role: 'assistant',
            content: text,
            timestamp: Date.now(),
            runId
          });
        }
        saveSessions();
      }

      // 重置发送状态
      isSending = false;
      showTypingIndicator(false);
      sendBtn.disabled = !messageInput.value.trim();
    }
    return;
  }

  // 处理 chat 事件（旧格式兼容）
  if (message.event === 'chat' && message.params?.message) {
    console.log('[💬 Chat event]', message.params.message);

    const text = message.params.message;
    addMessage('assistant', text);

    if (session) {
      session.messages.push({
        role: 'assistant',
        content: text,
        timestamp: Date.now()
      });
      saveSessions();
    }

    isSending = false;
    showTypingIndicator(false);
    sendBtn.disabled = !messageInput.value.trim();
    return;
  }

  // 处理 tick 事件（保持心跳）
  if (message.event === 'tick') {
    console.log('[💓 Tick]', message.params?.ts);
    return;
  }

  // 处理 health 事件
  if (message.event === 'health') {
    console.log('[🏥 Health]', message.params?.ok);
    return;
  }

  // 处理 presence 事件
  if (message.event === 'presence') {
    console.log('[👥 Presence]', message.params);
    return;
  }
}

// 更新或创建助手消息（支持流式更新）
function updateOrCreateAssistantMessage(text, runId) {
  // 隐藏打字指示器
  showTypingIndicator(false);

  // 如果有 runId，尝试更新现有消息
  if (runId) {
    const existingMsg = messages.querySelector(`[data-runid="${runId}"]`);
    if (existingMsg) {
      const contentEl = existingMsg.querySelector('.message-content-text');
      if (contentEl) {
        contentEl.innerHTML = formatMessage(text);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return;
      }
    }
  }

  // 检查最后一条消息是否是待更新的助手消息（无 runId 或 runId 不匹配）
  const lastMessageEl = messages.querySelector('.message.assistant:last-child');
  if (lastMessageEl && !lastMessageEl.hasAttribute('data-runid')) {
    const contentEl = lastMessageEl.querySelector('.message-content-text');
    if (contentEl) {
      contentEl.innerHTML = formatMessage(text);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      return;
    }
  }

  // 添加新消息
  addMessage('assistant', text, runId);
}

// 处理流式文本（累加模式）
const streamingChunks = new Map(); // runId -> accumulated text

function handleStreamingText(chunk, runId) {
  if (!runId) return;

  // 累加文本
  const currentText = streamingChunks.get(runId) || '';
  const newText = currentText + chunk;
  streamingChunks.set(runId, newText);

  // 更新界面
  updateOrCreateAssistantMessage(newText, runId);

  // 更新 session 数据
  const session = sessions.get(activeSessionId);
  if (session) {
    const existingMsg = session.messages.find(m => m.runId === runId && m.role === 'assistant');
    if (existingMsg) {
      existingMsg.content = newText;
    } else {
      session.messages.push({
        role: 'assistant',
        content: newText,
        timestamp: Date.now(),
        runId
      });
    }
    saveSessions();
  }
}

// 处理 WebSocket 关闭
function handleWsClose(data) {
  const { sessionId } = data;
  const session = sessions.get(sessionId);

  if (session) {
    session.connected = false;
    saveSessions();
  }

  if (sessionId === activeSessionId) {
    updateConnectionStatus(false);
    updateSessionsList();
    isSending = false;
    showTypingIndicator(false);
    showToast('与 Gateway 的连接已断开');

    // 自动重连提示
    setTimeout(() => {
      if (!session?.connected && activeSessionId === sessionId) {
        showToast('点击连接按钮重新连接', 5000);
      }
    }, 2000);
  }
}

// 添加消息到界面
function addMessage(role, text, runId = null, attachments = []) {
  const welcome = messages.querySelector('.welcome-message');
  if (welcome) welcome.remove();

  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;
  if (runId) messageDiv.setAttribute('data-runid', runId);

  const avatar = role === 'user' ? '👤' : '🦞';
  const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  const formattedText = formatMessage(text);

  // 构建附件 HTML
  let attachmentsHtml = '';
  if (attachments.length > 0) {
    attachmentsHtml = `<div class="message-attachments">`;
    for (const att of attachments) {
      if (att.isImage) {
        attachmentsHtml += `
          <div class="attachment-image" onclick="window.open('${att.url.replace(/\\/g, '\\\\')}')" style="cursor: pointer;" title="${att.name}">
            <img src="${att.url}" alt="${att.name}" />
          </div>
        `;
      } else {
        const icon = getFileIcon(getFileExtension(att.name));
        attachmentsHtml += `
          <div class="attachment-file">
            <span class="attachment-icon">${icon}</span>
            <div class="attachment-info">
              <span class="attachment-name">${att.name}</span>
              <span class="attachment-size">${formatFileSize(att.size)}</span>
            </div>
          </div>
        `;
      }
    }
    attachmentsHtml += `</div>`;
  }

  messageDiv.innerHTML = `
    <div class="message-avatar">${avatar}</div>
    <div class="message-content">
      ${attachmentsHtml}
      <div class="message-content-text">${formattedText}</div>
      ${settingShowTimestamp.checked ? `<div class="message-time">${time}</div>` : ''}
    </div>
  `;

  messages.appendChild(messageDiv);

  // 重置发送状态（在第一条助手消息后）
  if (role === 'assistant') {
    isSending = false;
    showTypingIndicator(false);
    sendBtn.disabled = !messageInput.value.trim();
  }

  if (settingAutoScroll.checked) {
    scrollToBottom();
  }
}

// 获取文件扩展名
function getFileExtension(filename) {
  const parts = filename.split('.');
  return parts.length > 1 ? '.' + parts.pop().toLowerCase() : '';
}

// 更新最后一条消息
function updateLastMessage(text) {
  const lastMessage = messages.querySelector('.message.assistant:last-child .message-content-text');
  if (lastMessage) {
    const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    lastMessage.innerHTML = formatMessage(text);

    // 更新时间戳
    const timeEl = lastMessage.parentElement.querySelector('.message-time');
    if (timeEl && settingShowTimestamp.checked) {
      timeEl.textContent = time;
    }

    if (settingAutoScroll.checked) {
      scrollToBottom();
    }
  }
}

// 加载消息历史
function loadMessages(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return;

  messages.innerHTML = '';

  if (session.messages.length === 0) {
    messages.innerHTML = `
      <div class="welcome-message">
        <div class="welcome-icon">🦞</div>
        <h3>欢迎使用 OpenClaw Chat!</h3>
        <p>会话：${session.name}</p>
        <p class="hint">输入消息后按 Enter 发送，Shift+Enter 换行</p>
        <p class="hint">Token 已自动保存，下次无需重新输入</p>
        <p class="hint">支持拖拽上传图片/文档，或点击回形针按钮选择文件</p>
      </div>
    `;
    return;
  }

  session.messages.forEach(msg => {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${msg.role}`;
    if (msg.runId) messageDiv.setAttribute('data-runid', msg.runId);

    const avatar = msg.role === 'user' ? '👤' : '🦞';
    const time = new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    const formattedText = formatMessage(msg.content);
    const statusIcon = msg.status === 'failed' ? '<span class="msg-status" title="发送失败">❌</span>' : '';

    // 处理附件
    const attachments = msg.attachments || [];
    let attachmentsHtml = '';
    if (attachments.length > 0) {
      attachmentsHtml = `<div class="message-attachments">`;
      for (const att of attachments) {
        if (att.isImage) {
          attachmentsHtml += `
            <div class="attachment-image" onclick="window.open('${att.url.replace(/\\/g, '\\\\')}')" style="cursor: pointer;" title="${att.name}">
              <img src="${att.url}" alt="${att.name}" />
            </div>
          `;
        } else {
          const icon = getFileIcon(getFileExtension(att.name));
          attachmentsHtml += `
            <div class="attachment-file">
              <span class="attachment-icon">${icon}</span>
              <div class="attachment-info">
                <span class="attachment-name">${att.name}</span>
                <span class="attachment-size">${formatFileSize(att.size)}</span>
              </div>
            </div>
          `;
        }
      }
      attachmentsHtml += `</div>`;
    }

    messageDiv.innerHTML = `
      <div class="message-avatar">${avatar}</div>
      <div class="message-content">
        ${attachmentsHtml}
        <div class="message-content-text">${formattedText}</div>
        ${statusIcon}
        ${settingShowTimestamp.checked ? `<div class="message-time">${time}</div>` : ''}
      </div>
    `;

    messages.appendChild(messageDiv);
  });

  scrollToBottom();
}

// 格式化消息
function formatMessage(text) {
  if (!text) return '';

  if (!settingMarkdown.checked) {
    return escapeHtml(text).replace(/\n/g, '<br>');
  }

  let formatted = escapeHtml(text);

  // 代码块
  formatted = formatted.replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');
  // 行内代码
  formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
  // 粗体
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // 斜体
  formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  // 链接
  formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  // 换行
  formatted = formatted.replace(/\n/g, '<br>');

  return formatted;
}

// HTML 转义
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 滚动到底部
function scrollToBottom() {
  if (settingAutoScroll.checked) {
    messagesContainer.scrollTo({
      top: messagesContainer.scrollHeight,
      behavior: 'smooth'
    });
  }
}

// 导出聊天记录
async function exportChat() {
  if (!activeSessionId) return;

  const session = sessions.get(activeSessionId);
  if (!session || session.messages.length === 0) {
    showToast('当前会话没有消息');
    return;
  }

  try {
    const result = await window.electronAPI.selectSavePath();
    if (!result.success) return;

    const exportData = {
      sessionName: session.name,
      gatewayUrl: session.gatewayUrl,
      createdAt: session.createdAt,
      exportedAt: Date.now(),
      messages: session.messages
    };

    await window.electronAPI.saveChatHistory({
      sessionId: activeSessionId,
      messages: exportData
    });

    showToast('聊天记录已导出!');
  } catch (error) {
    showToast('导出失败：' + error.message);
  }
}

// 导出所有聊天记录
async function exportAllChats() {
  const allData = [];

  sessions.forEach((session, sessionId) => {
    allData.push({
      sessionId,
      sessionName: session.name,
      gatewayUrl: session.gatewayUrl,
      createdAt: session.createdAt,
      messages: session.messages
    });
  });

  try {
    const result = await window.electronAPI.selectSavePath();
    if (!result.success) return;

    await window.electronAPI.saveChatHistory({
      sessionId: 'all',
      messages: allData
    });

    showToast('所有聊天记录已导出!');
    hideSettings();
  } catch (error) {
    showToast('导出失败：' + error.message);
  }
}

// 清空聊天
function clearChat() {
  if (!activeSessionId) return;

  if (!confirm('确定要清空当前会话的聊天记录吗？')) return;

  const session = sessions.get(activeSessionId);
  if (session) {
    session.messages = [];
    saveSessions();
    loadMessages(activeSessionId);
    showToast('聊天记录已清空');
  }
}

// 清除本地缓存
function clearStorage() {
  if (!confirm('确定要清除所有本地缓存吗？这将删除所有会话和设置。')) return;

  localStorage.clear();
  showToast('缓存已清除，页面将重新加载');
  setTimeout(() => location.reload(), 1000);
}

// 生成会话名称
function generateSessionName() {
  const date = new Date();
  return `会话 ${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// 重试发送失败的消息
async function retryMessage(msgIndex) {
  const session = sessions.get(activeSessionId);
  if (!session || !session.messages[msgIndex]) return;

  const msg = session.messages[msgIndex];
  if (msg.status !== 'failed') return;

  msg.status = 'sending';
  saveSessions();
  sendMessage();
}

// ========== 文件上传功能 ==========

// 处理上传按钮点击
async function handleUploadClick() {
  try {
    const result = await window.electronAPI.selectFiles();
    if (!result.success) return;

    for (const filePath of result.filePaths) {
      await uploadFile(filePath);
    }
  } catch (err) {
    console.error('[Upload error]', err);
    showToast('文件上传失败：' + err.message);
  }
}

// 处理文件选择
// 注意：由于 Electron 沙盒限制，input[type=file] 无法直接获取文件路径
// 所以实际文件选择逻辑在 handleUploadClick 中通过 dialog.showOpenDialog 实现
async function handleFileSelect(e) {
  // 这个函数主要用于兼容，实际使用 handleUploadClick
  e.target.value = '';
}

// 上传单个文件
async function uploadFile(filePath) {
  if (!activeSessionId) {
    showToast('请先连接到会话');
    return;
  }

  // 添加到待发送队列
  const fileId = 'temp-' + Date.now();
  const fileName = filePath.split(/[\\/]/).pop();
  const ext = '.' + fileName.split('.').pop().toLowerCase();
  const isImage = /\.(jpg|jpeg|png|gif|bmp|webp)$/.test(ext.toLowerCase());

  // 创建预览卡片
  addFilePreview(fileId, {
    name: fileName,
    size: 0,
    isImage,
    ext,
    uploading: true
  });

  try {
    const result = await window.electronAPI.uploadFile({ filePath, sessionId: activeSessionId });

    if (!result.success) {
      throw new Error(result.error || '上传失败');
    }

    const fileInfo = result.file;

    // 更新预览卡片
    updateFilePreview(fileId, {
      ...fileInfo,
      uploading: false
    });

    // 添加到待发送文件列表
    pendingFiles.push(fileInfo);

    // 如果是图片，显示 OCR 提示
    if (fileInfo.isImage) {
      showToast('图片已上传，将自动进行 OCR 识别');
    } else {
      showToast(`文件已上传：${fileName}`);
    }

  } catch (err) {
    console.error('[Upload error]', err);
    removeFilePreview(fileId);
    showToast('上传失败：' + err.message);
  }
}

// 设置拖拽上传
// 注意：由于 Electron 沙盒限制，拖拽上传可能无法在所有环境下工作
// 推荐使用上传按钮
function setupDragAndDrop() {
  const dropZone = chatPanel;

  // 拖拽进入
  dropZone.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  // 拖拽离开
  dropZone.addEventListener('dragleave', (e) => {
    if (e.target === dropZone || !dropZone.contains(e.relatedTarget)) {
      dropZone.classList.remove('drag-over');
    }
  });

  // 拖拽中
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });

  // 放下文件 - 提示用户使用上传按钮
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');

    // 尝试获取文件路径（仅在某些配置下有效）
    const items = e.dataTransfer.items;
    if (items && items.length > 0) {
      // 尝试使用 Electron 特有的 API
      const files = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const entry = item.webkitGetAsEntry();
          if (entry) {
            // 这是一个 FileSystemEntry，但我们无法直接获取完整路径
            // 需要用户通过上传按钮选择
          }
        }
      }
    }

    // 提示用户
    showToast('请点击上方 📎 按钮选择文件上传');
  });
}

// 添加文件预览卡片
function addFilePreview(fileId, fileInfo) {
  const card = document.createElement('div');
  card.className = `file-preview-card ${fileInfo.uploading ? 'uploading' : ''}`;
  card.dataset.fileId = fileId;

  const sizeText = fileInfo.size ? formatFileSize(fileInfo.size) : '';

  if (fileInfo.isImage && !fileInfo.uploading) {
    // 图片显示缩略图
    card.classList.add('image-file');
    card.innerHTML = `
      <img src="${fileInfo.url}" alt="${fileInfo.name}" class="file-thumbnail" />
      <button class="file-remove" title="移除">×</button>
    `;
  } else {
    // 文档显示图标和信息
    const icon = getFileIcon(fileInfo.ext);
    card.innerHTML = `
      <div class="file-thumbnail">${icon}</div>
      <div class="file-info">
        <span class="file-name" title="${fileInfo.name}">${fileInfo.name}</span>
        <span class="file-size">${sizeText}</span>
      </div>
      <button class="file-remove" title="移除">×</button>
    `;
  }

  // 移除按钮事件
  card.querySelector('.file-remove').addEventListener('click', () => {
    removeFilePreview(fileId);
    pendingFiles = pendingFiles.filter(f => f.id !== fileId);
  });

  filePreviewContainer.appendChild(card);
  filePreviewContainer.classList.remove('hidden');
}

// 更新文件预览
function updateFilePreview(fileId, fileInfo) {
  const card = filePreviewContainer.querySelector(`[data-file-id="${fileId}"]`);
  if (!card) return;

  card.classList.toggle('uploading', fileInfo.uploading);

  if (fileInfo.isImage && fileInfo.url) {
    card.classList.add('image-file');
    card.innerHTML = `
      <img src="${fileInfo.url}" alt="${fileInfo.name}" class="file-thumbnail" />
      <button class="file-remove" title="移除">×</button>
    `;
    card.querySelector('.file-remove').addEventListener('click', () => {
      removeFilePreview(fileId);
      pendingFiles = pendingFiles.filter(f => f.id !== fileId);
    });
  }
}

// 移除文件预览
function removeFilePreview(fileId) {
  const card = filePreviewContainer.querySelector(`[data-file-id="${fileId}"]`);
  if (card) {
    card.remove();
  }

  // 如果没有文件了，隐藏容器
  if (filePreviewContainer.children.length === 0) {
    filePreviewContainer.classList.add('hidden');
  }
}

// 获取文件图标
function getFileIcon(ext) {
  const icons = {
    '.pdf': '📕',
    '.doc': '📘',
    '.docx': '📘',
    '.xls': '📗',
    '.xlsx': '📗',
    '.ppt': '📙',
    '.pptx': '📙',
    '.txt': '📄',
    '.md': '📝',
    '.csv': '📊',
    '.jpg': '🖼️',
    '.jpeg': '🖼️',
    '.png': '🖼️',
    '.gif': '🖼️',
    '.bmp': '🖼️',
    '.webp': '🖼️'
  };
  return icons[ext?.toLowerCase()] || '📁';
}

// 格式化文件大小
function formatFileSize(bytes) {
  if (bytes === 0) return '';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// 清理
window.addEventListener('beforeunload', () => {
  if (gatewayCheckInterval) {
    clearInterval(gatewayCheckInterval);
  }
});

// 启动应用
init();
