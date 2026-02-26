# 🦞 OpenClaw Chat UI

一个基于 Electron 的 OpenClaw 桌面聊天客户端，支持内网远程访问 Gateway 服务。

![版本](https://img.shields.io/badge/版本 -1.0.0-orange)
![Electron](https://img.shields.io/badge/Electron-28.0-blue)
![平台](https://img.shields.io/badge/平台-Windows-lightgrey)
![许可证](https://img.shields.io/badge/许可证-MIT-green)

---

## ✨ 核心特性

### 🎨 现代化界面
- 动态螃蟹 Logo 动画
- 专业暗色主题
- 响应式设计，适配不同屏幕尺寸
- 流畅的动画效果

### 🚀 智能体验
- **自动 Gateway 检测** - 实时检测 Gateway 状态
- **Token 帮助系统** - 一键复制路径、打开配置文件
- **Toast 通知** - 友好的操作反馈
- **快捷键支持** - 高效操作

### 💼 实用功能
- 多会话管理
- 导出聊天记录
- 自动保存
- Markdown 渲染支持
- **内网远程访问** - 支持连接局域网内其他电脑的 Gateway

---

## 📦 快速开始

### 环境要求

- **Node.js** 18.x 或更高版本
- **OpenClaw CLI** 已安装并配置

### 1️⃣ 安装依赖

```bash
npm install
```

### 2️⃣ 配置 OpenClaw Gateway

> ⚠️ **重要**：在启动 Chat UI 之前，必须先配置并启动 OpenClaw Gateway。

**安装 OpenClaw CLI（如果未安装）：**
```bash
npm install -g openclaw
```

**配置 Gateway：**
```bash
# 运行配置向导
openclaw config
```

**启动 Gateway：**
```bash
# 本地模式（仅本机可访问）
openclaw gateway

# 局域网模式（允许内网其他设备访问）
openclaw gateway run --bind lan
```

### 3️⃣ 启动应用

**方法 A：双击启动（推荐）**
```
双击 start.bat
```

**方法 B：命令行启动**
```bash
npm start
```

---

## 🔧 OpenClaw 配置指南

> 本章节详细说明如何配置 OpenClaw 以支持第三方聊天工具的连接。

### 步骤 1：安装 OpenClaw CLI

```bash
npm install -g openclaw
```

### 步骤 2：配置 Gateway

运行配置向导：
```bash
openclaw config
```

或手动设置关键配置项：

```bash
# 设置 Gateway 监听模式
# loopback - 仅本机访问
# lan - 局域网内所有设备可访问
openclaw config set gateway.bind lan

# 设置认证模式为 token
openclaw config set gateway.auth.mode token

# 设置 Gateway 端口（默认 18789）
openclaw config set gateway.port 18789
```

### 步骤 3：获取 Gateway Token

Token 位于配置文件中，路径：`%USERPROFILE%\.openclaw\openclaw.json`

**查看配置文件：**
```bash
# Windows
type %USERPROFILE%\.openclaw\openclaw.json

# 或直接打开
notepad %USERPROFILE%\.openclaw\openclaw.json
```

**找到以下字段：**
```json
{
  "gateway": {
    "auth": {
      "mode": "token",
      "token": "你的 TOKEN（类似：n7SUZu6UDSzcNayZJZEQ-ifWdQ-pGlQXPt8uWCcLVvg）"
    }
  }
}
```

复制 `token` 的值，在 Chat UI 连接时使用。

### 步骤 4：启动 Gateway

```bash
# 前台运行
openclaw gateway run --bind lan

# 或作为后台服务运行
openclaw gateway start
```

### 步骤 5：在 Chat UI 中连接

1. 启动 Chat UI 应用
2. 在连接面板输入：
   - **Gateway 地址**：`http://127.0.0.1:18789`（本地）或 `http://<内网IP>:18789`（远程）
   - **Token**：从配置文件中复制的 token 值
3. 点击"连接"

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

或者参考上面的 **OpenClaw 配置指南** 章节。

### 内网远程访问配置

如果想让内网其他电脑访问 Gateway 服务：

**1. 在运行 Gateway 的电脑上：**
```bash
# 配置 Gateway 监听局域网
openclaw config set gateway.bind lan

# 重启 Gateway
openclaw gateway run --bind lan
```

**2. 获取本机内网 IP：**
```bash
ipconfig
# 找到类似 192.168.x.x 或 10.x.x.x 的 IPv4 地址
```

**3. 开放防火墙端口（如需要）：**
```powershell
# 以管理员身份运行 PowerShell
New-NetFirewallRule -DisplayName "OpenClaw Gateway" -Direction Inbound -LocalPort 18789 -Protocol TCP -Action Allow
```

**4. 在内网其他电脑的 Chat UI 中连接：**
- Gateway 地址：`http://<内网IP>:18789`
- Token：相同的 Gateway Token

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
├── start.bat            # Windows 启动脚本
├── start.ps1            # PowerShell 启动脚本
├── package.json         # 项目配置
└── README.md            # 本文档
```

---

## ⚙️ 配置说明

### Gateway 地址
默认：`http://127.0.0.1:18789`
内网访问：`http://<内网IP>:18789`

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
4. 检查防火墙设置

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

### 内网连接失败

1. 确认 Gateway 使用 `--bind lan` 参数启动
2. 确认防火墙已开放 18789 端口
3. 确认输入的 IP 地址正确

---

## 📝 更新日志

### v1.0.0 (2026-02-25)

**新增**
- 自动 Gateway 检测
- Token 帮助系统
- Toast 通知系统
- 动态 Logo 动画
- 快捷键支持
- Markdown 渲染
- 内网远程访问支持

**优化**
- 现代化界面设计
- 响应式布局
- 性能优化

---

## 👥 作者

- **rockwillams** - [GitHub](https://github.com/RockWillams)

---

## 📄 许可证

MIT License

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📞 支持

- 🐛 遇到问题？按 `F12` 查看控制台日志
- 💡 需要帮助？查看快速入门指南

---

**开发工具**: OpenClaw + Electron
**设计理念**: 用户体验优先
