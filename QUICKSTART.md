# 🚀 OpenClaw Chat UI - 快速开始指南

## 📋 第一步：确认环境

### 1. 检查 Node.js 是否安装

打开命令提示符，运行：
```bash
node --version
```

如果显示版本号（如 v18.x.x 或更高），说明已安装。

**如果没有安装**：
- 访问 https://nodejs.org/
- 下载并安装 LTS 版本
- 安装完成后重启终端

---

## 🔧 第二步：安装依赖

```bash
cd C:\code\code\openclaw-chat-ui
npm install
```

等待安装完成（约 1-3 分钟）。

---

## 🦞 第三步：启动 OpenClaw Gateway

打开新的命令提示符窗口：

```bash
openclaw gateway
```

看到类似以下输出表示成功：
```
Gateway listening on ws://127.0.0.1:18789
```

**获取 Gateway Token**：

Token 位于配置文件中，运行以下命令查看：
```bash
type %USERPROFILE%\.openclaw\openclaw.json
```

找到 `gateway.auth.token` 的值，类似：
```json
"token": "aec40f84e99afb21bb4966d3f75a9eeba5bbcd3eaf9b78c1"
```

---

## 🎉 第四步：启动 Chat UI

### 方法 1：使用启动脚本
双击 `start.bat` 文件

### 方法 2：命令行启动
```bash
cd C:\code\code\openclaw-chat-ui
npm start
```

---

## 💬 第五步：开始聊天

1. **输入会话名称** - 例如："我的助手"

2. **输入 Gateway 地址** - 保持默认：`http://127.0.0.1:18789`

3. **输入 Token** - 粘贴刚才找到的 Token

4. **点击"连接"** - 开始聊天！

---

## ⌨️ 快捷键速查

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+N` | 新建会话 |
| `Ctrl+T` | 切换侧边栏 |
| `Ctrl+E` | 导出聊天记录 |
| `Enter` | 发送消息 |
| `Shift+Enter` | 换行 |
| `F12` | 开发者工具 |

---

## 🎯 常用操作

### 创建多个会话
1. 按 `Ctrl+N` 或点击侧边栏 `+`
2. 输入不同的会话名称
3. 连接到同一个或不同的 Gateway
4. 点击侧边栏切换会话

### 导出聊天记录
1. 点击右上角 **📥 导出** 按钮
2. 选择保存位置
3. 聊天记录保存为 JSON 文件

### 清空聊天
点击右上角 **🗑️ 清空** 按钮

---

## 🐛 遇到问题？

### 问题：无法连接 Gateway

**解决方案**：
1. 确认 Gateway 正在运行
2. 检查 Token 是否正确
3. 确认端口 18789 未被占用

### 问题：npm install 失败

**解决方案**：
```bash
# 清除 npm 缓存
npm cache clean --force

# 删除 node_modules 重新安装
rmdir /s /q node_modules
npm install
```

### 问题：应用无法启动

**解决方案**：
```bash
# 检查 Electron 是否安装
npm list electron

# 重新安装 Electron
npm install electron --save-dev
```

---

## 📞 获取帮助

- 查看完整文档：`README.md`
- 检查日志：按 `F12` 打开开发者工具

---

**祝您使用愉快！** 🎊
