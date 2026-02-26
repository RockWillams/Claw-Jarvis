const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 会话管理
  createSession: (sessionId, gatewayUrl, token) =>
    ipcRenderer.invoke('create-session', { sessionId, gatewayUrl, token }),

  closeSession: ({ sessionId }) =>
    ipcRenderer.invoke('close-session', { sessionId }),

  getSessions: () =>
    ipcRenderer.invoke('get-sessions'),

  // 消息发送
  sendMessage: ({ sessionId, message }) =>
    ipcRenderer.invoke('send-message', { sessionId, message }),

  // WebSocket 事件
  onWsMessage: (callback) =>
    ipcRenderer.on('ws-message', (event, data) => callback(data)),

  onWsClose: (callback) =>
    ipcRenderer.on('ws-close', (event, data) => callback(data)),

  // 文件上传
  uploadFile: ({ filePath, sessionId }) =>
    ipcRenderer.invoke('upload-file', { filePath, sessionId }),

  selectFiles: (options) =>
    ipcRenderer.invoke('select-files', options),

  getFileBase64: ({ fileId }) =>
    ipcRenderer.invoke('get-file-base64', { fileId }),

  // 获取文件路径（用于拖拽上传）
  getFilePaths: (files) =>
    ipcRenderer.invoke('get-file-paths', { files }),

  // 聊天记录
  saveChatHistory: ({ sessionId, messages }) =>
    ipcRenderer.invoke('save-chat-history', { sessionId, messages }),

  selectSavePath: () =>
    ipcRenderer.invoke('select-save-path'),

  // 菜单事件
  onMenuNewSession: (callback) =>
    ipcRenderer.on('menu-new-session', () => callback()),

  onMenuSwitchSession: (callback) =>
    ipcRenderer.on('menu-switch-session', () => callback()),

  onMenuExportChat: (callback) =>
    ipcRenderer.on('menu-export-chat', () => callback())
});
