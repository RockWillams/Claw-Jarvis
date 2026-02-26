# 🦞 OpenClaw Chat UI - 使用指南

## 🚀 快速开始

### 1. 启动 Gateway
```bash
openclaw gateway
```

### 2. 启动 Chat UI
```bash
cd C:\code\code\openclaw-chat-ui-new
npm start
```
或双击 `start.bat`

### 3. 连接 Gateway
1. 打开应用后，看到连接面板
2. **Gateway 地址**: `http://127.0.0.1:18789`（默认）
3. **Gateway Token**: `aec40f84e99afb21bb4966d3f75a9eeba5bbcd3eaf9b78c1`
4. 点击"连接"按钮

### 4. 开始聊天
连接成功后，输入消息并按 Enter 发送

---

## 📋 功能特性

### ✅ 已实现功能

1. **WebSocket 连接**
   - 自动 Gateway 检测
   - ED25519 设备身份认证
   - 完整的协议握手

2. **聊天功能**
   - 发送消息
   - 接收消息
   - 流式响应
   - Markdown 渲染

3. **会话管理**
   - 多会话支持
   - 会话切换
   - 会话状态保存

4. **用户界面**
   - 现代化暗色主题
   - 响应式设计
   - Toast 通知
   - 详细日志

---

## ⌨️ 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+N` | 新建会话 |
| `Ctrl+E` | 导出聊天记录 |
| `Ctrl+Q` | 退出应用 |
| `F12` | 开发者工具 |
| `Enter` | 发送消息 |
| `Shift+Enter` | 换行 |

---

## 🔧 配置

### Gateway Token
位于：`%USERPROFILE%\.openclaw\openclaw.json`
```json
{
  "gateway": {
    "auth": {
      "token": "aec40f84e99afb21bb4966d3f75a9eeba5bbcd3eaf9b78c1"
    }
  }
}
```

### 允许 File Origin
配置已设置：
```json
{
  "gateway": {
    "controlUi": {
      "allowedOrigins": ["*"],
      "allowInsecureAuth": true
    }
  }
}
```

---

## 🐛 故障排查

### 问题：连接失败 "origin not allowed"
**解决**: Gateway 配置已更新，需要重启 Gateway
```bash
taskkill /F /IM node.exe
openclaw gateway
```

### 问题：WebSocket 连接超时
**检查**:
1. Gateway 是否运行：`openclaw gateway status`
2. 端口是否占用：`netstat -ano | findstr 18789`
3. Token 是否正确

### 问题：设备配对失败
**解决**: 本地连接自动批准，检查 Gateway 日志

---

## 📁 项目结构

```
openclaw-chat-ui-new/
├── main.js              # Electron 主进程
├── preload.js           # IPC 桥接
├── package.json         # 项目配置
├── start.bat            # 启动脚本
├── README.md            # 项目说明
├── TEST_REPORT.md       # 测试报告
└── src/
    ├── index.html       # 聊天界面
    ├── styles.css       # 样式
    └── renderer.js      # 前端逻辑
```

---

## 📖 官方文档

- [Gateway 协议](https://beaverslab.mintlify.app/zh/gateway/protocol)
- [WebChat](https://beaverslab.mintlify.app/zh/web/webchat)
- [Control UI](https://beaverslab.mintlify.app/zh/web/control-ui)

---

## ✅ 测试状态

| 测试项 | 状态 |
|--------|------|
| WebSocket 连接 | ✅ 通过 |
| Gateway 认证 | ✅ 通过 |
| ED25519 签名 | ✅ 通过 |
| connect 握手 | ✅ 通过 |
| hello 方法 | ✅ 通过 |
| 消息发送 | ✅ 通过 |
| 消息接收 | ✅ 通过 |
| 会话管理 | ✅ 通过 |
| 错误处理 | ✅ 通过 |
| 日志记录 | ✅ 通过 |

---

**版本**: 1.0.0  
**更新日期**: 2026-02-26  
**状态**: ✅ 完成并测试通过
