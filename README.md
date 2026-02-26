# 🦞 OpenClaw Chat UI

一个功能完整、用户体验优秀的 Electron 桌面聊天客户端，专为 OpenClaw 设计。

![版本](https://img.shields.io/badge/版本 -1.0.0-orange)
![Electron](https://img.shields.io/badge/Electron-28.0-blue)
![平台](https://img.shields.io/badge/平台-Windows-lightgrey)

---

## ✨ 核心特性

### 🎨 现代化界面
- 🦞 动态螃蟹 Logo 动画
- 🌓 专业暗色主题
- 📱 响应式设计
- ✨ 流畅动画效果

### 🚀 智能体验
- 🔍 **自动 Gateway 检测** - 实时检测 Gateway 状态
- 💡 **Token 帮助系统** - 一键复制路径、打开配置文件
- 🔔 **Toast 通知** - 友好的操作反馈
- ⌨️ **快捷键支持** - 高效操作

### 💼 实用功能
- 💬 多会话管理
- 📥 导出聊天记录
- 💾 自动保存
- 📊 Markdown 渲染

---

## 📦 快速开始

### 1️⃣ 安装依赖

```bash
cd C:\code\code\openclaw-chat-ui
npm install
```

### 2️⃣ 启动 Gateway

```bash
openclaw gateway
```

### 3️⃣ 启动应用

**方法 A：双击启动**
```
双击 start.bat
```

**方法 B：命令行启动**
```bash
npm start
```

---

## 🎯 使用指南

### 首次连接

1. **启动应用** - 双击 `start.bat`
2. **自动检测** - 应用会自动检测 Gateway 状态
3. **获取 Token** - 点击 ❓ 按钮查看帮助
4. **输入 Token** - 粘贴并点击"连接"
5. **开始聊天** - 享受流畅的对话体验！

### Token 获取

点击连接面板的 **❓** 按钮，然后：

1. 点击 **📋 复制配置文件路径**
2. 打开文件：`%USERPROFILE%\.openclaw\openclaw.json`
3. 找到 `gateway.auth.token`
4. 复制 token 值

### 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+N` | 新建会话 |
| `Ctrl+T` | 切换侧边栏 |
| `Ctrl+E` | 导出聊天记录 |
| `Ctrl+Q` | 退出应用 |
| `F12` | 开发者工具 |
| `Enter` | 发送消息 |
| `Shift+Enter` | 换行 |

---

## 🎨 界面预览

### 连接面板
- 🦞 动态 Logo 动画
- 🔍 Gateway 状态实时检测
- 💡 Token 帮助系统
- 📖 快速入门指南

### 聊天界面
- 💬 现代化消息气泡
- 🔔 Toast 通知反馈
- 📊 Markdown 代码高亮
- ⏰ 消息时间戳

---

## 📁 项目结构

```
openclaw-chat-ui/
├── main.js              # Electron 主进程
├── preload.js           # 预加载脚本
├── src/
│   ├── index.html       # 聊天界面
│   ├── styles.css       # 样式（暗色主题）
│   └── renderer.js      # 前端逻辑
├── assets/              # 资源文件
├── start.bat            # 启动脚本
├── package.json         # 项目配置
├── README.md            # 本文档
└── UX_OPTIMIZATIONS.md  # UX 优化报告
```

---

## ⚙️ 配置说明

### Gateway 地址

默认：`http://127.0.0.1:18789`

### Gateway Token

位置：`%USERPROFILE%\.openclaw\openclaw.json`

路径：`gateway.auth.token`

### 本地数据

- **会话列表**: `localStorage.sessions`
- **设置**: `localStorage.chatSettings`
- **聊天记录**: 内存中（可导出）

---

## 🛠️ 开发

### 启动开发模式

```bash
npm run dev
```

### 修改代码后

```bash
npm start
```

### 打包（可选）

```bash
npm install --save-dev electron-builder
npm run build
```

---

## 🐛 故障排除

### 无法连接 Gateway

1. 确认 Gateway 正在运行：
   ```bash
   openclaw gateway status
   ```

2. 检查 Token 是否正确
3. 确认端口 18789 未被占用

### 应用无法启动

```bash
# 重新安装依赖
rmdir /s /q node_modules
npm install
npm start
```

### 依赖安装失败

```bash
# 清除 npm 缓存
npm cache clean --force
npm install
```

---

## 📝 更新日志

### v1.0.0 (2026-02-25)

**新增**
- ✨ 自动 Gateway 检测
- ✨ Token 帮助系统
- ✨ Toast 通知系统
- ✨ 动态 Logo 动画
- ✨ 快捷键支持
- ✨ Markdown 渲染

**优化**
- 🎨 现代化界面设计
- 📱 响应式布局
- ⚡ 性能优化
- 🐛 错误修复

---

## 📄 许可证

MIT License

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📞 支持

- 📖 查看 [UX_OPTIMIZATIONS.md](UX_OPTIMIZATIONS.md) 了解优化详情
- 🐛 遇到问题？按 `F12` 查看控制台日志
- 💡 需要帮助？查看快速入门指南

---

**开发时间**: 2026-02-25  
**开发工具**: OpenClaw + Electron  
**设计理念**: 用户体验优先
