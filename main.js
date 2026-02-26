const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

// Windows 控制台 UTF-8 编码
if (process.platform === 'win32') {
  try {
    require('child_process').execSync('chcp 65001', { stdio: 'ignore' });
  } catch (e) {}
}

let mainWindow;
let wsConnections = new Map();
let deviceKeys = null;

// 加载或生成设备密钥对
function loadOrCreateDeviceKeys() {
  const keysPath = path.join(app.getPath('userData'), 'device-keys.json');

  try {
    if (fs.existsSync(keysPath)) {
      const data = fs.readFileSync(keysPath, 'utf8');
      const loadedKeys = JSON.parse(data);

      // 支持两种格式：device-auth.json 格式和内部格式
      if (loadedKeys.publicKeyPem && loadedKeys.privateKeyPem) {
        // 已经是内部格式
        deviceKeys = loadedKeys;
      } else if (loadedKeys.publicKey && loadedKeys.privateKey) {
        // device-auth.json 格式
        deviceKeys = {
          publicKeyPem: loadedKeys.publicKey,
          privateKeyPem: loadedKeys.privateKey
        };
      } else {
        throw new Error('Invalid key format');
      }

      console.log('[🔑 KEYS] Loaded existing device keys');
      return deviceKeys;
    }
  } catch (e) {
    console.error('[❌ KEYS] Failed to load keys:', e.message);
  }

  // 生成新密钥对
  const keyPair = crypto.generateKeyPairSync('ed25519');
  deviceKeys = {
    publicKeyPem: keyPair.publicKey.export({ type: 'spki', format: 'pem' }).toString(),
    privateKeyPem: keyPair.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString()
  };

  try {
    fs.writeFileSync(keysPath, JSON.stringify(deviceKeys, null, 2), { mode: 0o600 });
    console.log('[🔑 KEYS] Generated and saved new device keys');
  } catch (e) {
    console.error('[❌ KEYS] Failed to save keys:', e.message);
  }

  return deviceKeys;
}

// 初始化时加载密钥
loadOrCreateDeviceKeys();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'OpenClaw Chat'
  });

  mainWindow.loadFile('src/index.html');
  createMenu();
  mainWindow.on('closed', () => {
    wsConnections.forEach(ws => ws.close());
    wsConnections.clear();
    mainWindow = null;
  });
}

function createMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: '文件', submenu: [
        { label: '新建会话', accelerator: 'CmdOrCtrl+N', click: () => mainWindow.webContents.send('menu-new-session') },
        { label: '导出记录', accelerator: 'CmdOrCtrl+E', click: () => mainWindow.webContents.send('menu-export-chat') },
        { type: 'separator' },
        { label: '退出', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
      ]
    },
    { label: '编辑', submenu: [{ role: 'copy' }, { role: 'paste' }] },
    { label: '视图', submenu: [{ label: '开发者工具', accelerator: 'F12', click: () => mainWindow.webContents.toggleDevTools() }] }
  ]));
}

// 根据官方协议实现 WebSocket 连接
function createWebSocket(sessionId, gatewayUrl, token) {
  return new Promise((resolve, reject) => {
    try {
      const WebSocket = require('ws');
      const wsUrl = gatewayUrl.replace('http', 'ws');
      const httpUrl = gatewayUrl.startsWith('ws') ? gatewayUrl.replace('ws', 'http') : gatewayUrl;
      
      console.log('========================================');
      console.log('[🔌 CONNECT] Gateway:', wsUrl);
      console.log('[🔑 TOKEN]', token);
      console.log('[📍 ORIGIN]', httpUrl);
      console.log('========================================');
      
      const ws = new WebSocket(wsUrl, {
        origin: httpUrl,
        headers: {
          'Origin': httpUrl
        }
      });
      let nonce = null;
      let requestId = 'req-' + Date.now();
      let connectTimeout = null;

      // 3 秒连接超时
      const connectTimeoutTimer = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          console.error('[❌ ERROR] WebSocket connection timeout');
          reject(new Error('WebSocket connection timeout'));
        }
      }, 3000);

      ws.on('open', () => {
        console.log('[✅ OPEN] WebSocket connected');
        clearTimeout(connectTimeoutTimer);
        
        // 等待 Gateway 发送 connect.challenge
        connectTimeout = setTimeout(() => {
          console.error('[❌ TIMEOUT] No connect.challenge received');
          reject(new Error('Gateway did not send connect.challenge'));
        }, 5000);
      });

      ws.on('message', (data) => {
        const raw = data.toString();
        console.log('========================================');
        console.log('[📨 RECV]', raw);
        console.log('========================================');
        
        try {
          const msg = JSON.parse(raw);
          
          // 处理 connect.challenge 事件
          if (msg.type === 'event' && msg.event === 'connect.challenge') {
            console.log('[🔐 CHALLENGE] Received');
            console.log('   Nonce:', msg.payload?.nonce);
            clearTimeout(connectTimeout);
            const nonce = msg.payload?.nonce;

            // 使用持久化的密钥对
            const publicKeyPem = deviceKeys.publicKeyPem;
            const privateKeyPem = deviceKeys.privateKeyPem;

            // 设备 ID 计算方法与 OpenClaw Gateway 一致：
            // 1. 从 PEM 提取原始公钥字节 (32 字节)
            // 2. 对原始字节进行 SHA256 哈希
            const publicKeyDer = crypto.createPublicKey(publicKeyPem)
              .export({ type: 'spki', format: 'der' });
            // ED25519 SPKI 前缀是 12 字节，后面 32 字节是原始公钥
            const publicKeyRaw = publicKeyDer.slice(12);
            const deviceId = crypto.createHash('sha256').update(publicKeyRaw).digest('hex');

            // 构建签名 payload，格式与 OpenClaw Gateway 一致：
            // v2|deviceId|clientId|clientMode|role|scopes|signedAtMs|token|nonce
            const clientId = 'webchat';
            const clientMode = 'webchat';
            const role = 'operator';
            const scopes = 'operator.admin,operator.read,operator.write,operator.approvals,operator.pairing';
            const signedAtMs = Date.now();
            const gatewayToken = token; // 使用传入的 token
            const payload = `v2|${deviceId}|${clientId}|${clientMode}|${role}|${scopes}|${signedAtMs}|${gatewayToken}|${nonce}`;

            // 使用 ED25519 签名 payload，并使用 Base64URL 编码
            const privateKey = crypto.createPrivateKey(privateKeyPem);
            const signatureBuf = crypto.sign(null, Buffer.from(payload), privateKey);
            // Base64URL 编码：替换 + 为 -，/ 为 _，去掉 = 填充
            const signature = signatureBuf.toString('base64')
              .replace(/\+/g, '-')
              .replace(/\//g, '_')
              .replace(/=+$/, '');
            
            console.log('[🆔 DEVICE]', deviceId);
            console.log('[✍️ SIGNATURE]', signature);
            
            // 构建 connect 请求（完全符合官方协议）
            const connectReq = {
              type: 'req',
              id: requestId,
              method: 'connect',
              params: {
                minProtocol: 1,
                maxProtocol: 3,
                client: {
                  id: 'webchat',
                  version: '1.0.0',
                  platform: process.platform,
                  mode: 'webchat'
                },
                role: 'operator',
                scopes: ['operator.admin', 'operator.read', 'operator.write', 'operator.approvals', 'operator.pairing'],
                caps: [],
                commands: [],
                permissions: {},
                auth: {
                  token: token
                },
                locale: 'zh-CN',
                userAgent: 'openclaw-chat-ui/1.0.0',
                device: {
                  id: deviceId,
                  publicKey: publicKeyPem,
                  signature: signature,
                  signedAt: signedAtMs,
                  nonce: nonce
                }
              }
            };
            
            console.log('[📤 SEND] Connect request:');
            console.log(JSON.stringify(connectReq, null, 2));
            console.log('========================================');
            ws.send(JSON.stringify(connectReq));
            return;
          }
          
          // 处理 connect 响应
          if (msg.type === 'res' && msg.id === requestId) {
            console.log('[📨 RESPONSE] Connect response');
            console.log('   OK:', msg.ok);
            console.log('   Payload:', JSON.stringify(msg.payload));
            console.log('   Error:', msg.error);
            console.log('========================================');

            if (msg.ok) {
              console.log('[✅ SUCCESS] Connect OK!');
              console.log('   Protocol:', msg.payload?.protocol);
              console.log('   Policy:', JSON.stringify(msg.payload?.policy));

              wsConnections.set(sessionId, ws);
              resolve({ sessionId, ws });
              // 不再发送 hello 请求，Gateway 不支持此方法
            } else {
              console.error('[❌ FAILED] Connect failed');
              reject(new Error(msg.error?.message || 'Connect failed'));
            }
            return;
          }
          
          // 转发其他消息到渲染进程
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('ws-message', { sessionId, message: msg });
          }
        } catch (e) {
          console.error('[❌ ERROR] Parse error:', e.message);
          console.error('Stack:', e.stack);
        }
      });

      ws.on('error', (err) => {
        console.error('========================================');
        console.error('[❌ ERROR] WebSocket error:', err.message);
        console.error('   Code:', err.code);
        console.error('========================================');
        clearTimeout(connectTimeoutTimer);
        clearTimeout(connectTimeout);
        reject(err);
      });

      ws.on('close', (code, reason) => {
        console.log('========================================');
        console.log('[🚪 CLOSE] WebSocket closed');
        console.log('   Code:', code);
        console.log('   Reason:', reason?.toString());
        console.log('========================================');
        clearTimeout(connectTimeoutTimer);
        clearTimeout(connectTimeout);
        wsConnections.delete(sessionId);
        reject(new Error(`Connection closed: ${code} ${reason?.toString() || ''}`));
      });
    } catch (err) {
      console.error('[❌ ERROR] CreateWebSocket error:', err.message);
      reject(err);
    }
  });
}

// IPC handlers
ipcMain.handle('create-session', async (event, { sessionId, gatewayUrl, token }) => {
  console.log('[IPC] create-session', sessionId);
  try {
    await createWebSocket(sessionId, gatewayUrl, token);
    return { success: true, sessionId };
  } catch (err) {
    console.error('[IPC] create-session failed:', err.message);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('send-message', async (event, { sessionId, message }) => {
  const ws = wsConnections.get(sessionId);
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify(message));
    return { success: true };
  }
  return { success: false, error: 'Not connected' };
});

ipcMain.handle('close-session', async (event, { sessionId }) => {
  const ws = wsConnections.get(sessionId);
  if (ws) { ws.close(); wsConnections.delete(sessionId); }
  return { success: true };
});

ipcMain.handle('save-chat-history', async (event, { messages }) => {
  try {
    const fs = require('fs');
    const dir = path.join(app.getPath('documents'), 'OpenClaw-Chats');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `chat-${Date.now()}.json`);
    fs.writeFileSync(file, JSON.stringify(messages, null, 2));
    return { success: true, filePath: file };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('select-save-path', async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });
  return result.canceled ? { success: false } : { success: true, filePath: result.filePath };
});

// 文件上传处理
const uploadedFiles = new Map(); // 存储已上传的文件信息

ipcMain.handle('select-files', async (event, options = {}) => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: '图片', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] },
        { name: '文档', extensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'] },
        { name: '文本', extensions: ['txt', 'md', 'csv'] },
        { name: '所有文件', extensions: ['*'] }
      ],
      ...options
    });

    if (result.canceled) {
      return { success: false };
    }

    return {
      success: true,
      filePaths: result.filePaths
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('upload-file', async (event, { filePath, sessionId }) => {
  try {
    // 确保 filePath 是字符串
    let actualFilePath = filePath;
    if (typeof filePath !== 'string') {
      if (filePath && typeof filePath.path === 'string') {
        actualFilePath = filePath.path;
      } else if (Array.isArray(filePath) && filePath.length > 0) {
        actualFilePath = filePath[0];
      } else {
        throw new Error('Invalid filePath: ' + JSON.stringify(filePath));
      }
    }

    const fs = require('fs');
    const crypto = require('crypto');

    // 读取文件并转换为 Base64（用于 OCR 或直接发送）
    const fileBuffer = fs.readFileSync(actualFilePath);
    const fileBase64 = fileBuffer.toString('base64');
    const fileName = path.basename(filePath);
    const ext = path.extname(fileName).toLowerCase();
    const fileSize = fileBuffer.length;

    // 确定 MIME 类型
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.bmp': 'image/bmp',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.txt': 'text/plain',
      '.md': 'text/markdown',
      '.csv': 'text/csv'
    };

    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    const isImage = mimeType.startsWith('image/');

    // 生成文件 ID 和存储路径
    const fileId = 'file-' + crypto.randomBytes(16).toString('hex');
    const uploadDir = path.join(app.getPath('userData'), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const storagePath = path.join(uploadDir, fileId + ext);

    // 保存文件
    fs.writeFileSync(storagePath, fileBuffer);

    // 如果是图片，可以进行 OCR 识别（这里标记为需要 OCR）
    let ocrText = null;
    let imageBase64 = null;
    if (isImage) {
      // 存储 Base64 编码用于发送给 AI
      imageBase64 = fileBase64;
    }

    // 如果是文档，提取文本内容（简化版，仅支持 txt/md）
    let textContent = null;
    if (ext === '.txt' || ext === '.md' || ext === '.csv') {
      textContent = fileBuffer.toString('utf-8');
    }

    // 生成访问 URL（本地文件协议）
    const fileUrl = `file://${storagePath}`;

    // 存储文件信息
    const fileInfo = {
      id: fileId,
      name: fileName,
      size: fileSize,
      mimeType,
      isImage,
      path: storagePath,
      url: fileUrl,
      ocrText,
      textContent,
      imageBase64,
      sessionId,
      createdAt: Date.now()
    };

    uploadedFiles.set(fileId, fileInfo);

    return {
      success: true,
      file: fileInfo
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// 获取已上传的文件信息
ipcMain.handle('get-file-info', async (event, { fileId }) => {
  const fileInfo = uploadedFiles.get(fileId);
  if (!fileInfo) {
    return { success: false, error: 'File not found' };
  }
  return { success: true, file: fileInfo };
});

// 删除已上传的文件
ipcMain.handle('delete-file', async (event, { fileId }) => {
  try {
    const fileInfo = uploadedFiles.get(fileId);
    if (fileInfo && fs.existsSync(fileInfo.path)) {
      fs.unlinkSync(fileInfo.path);
    }
    uploadedFiles.delete(fileId);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// 获取文件 Base64 数据
ipcMain.handle('get-file-base64', async (event, { fileId }) => {
  try {
    const fileInfo = uploadedFiles.get(fileId);
    if (!fileInfo) {
      return { success: false, error: 'File not found' };
    }
    const fileBuffer = fs.readFileSync(fileInfo.path);
    return {
      success: true,
      base64: fileBuffer.toString('base64'),
      mimeType: fileInfo.mimeType
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// 获取文件路径（用于拖拽上传）
// 注意：在 Electron 沙盒中，渲染进程无法直接访问 file.path
// 但这个 IPC 处理器实际上无法直接获取渲染进程的 File 对象
// 我们改用另一种方式：让渲染进程通过 dataTransfer.files 获取
// 并在 preload 中暴露 getPathForFile 方法

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
