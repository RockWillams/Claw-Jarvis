# 文件上传功能实现说明

## 已实现的功能

### 1. 文件上传方式

#### 点击按钮上传 ✅
- 点击输入框左侧的 📎 按钮
- 弹出文件选择对话框
- 支持多选文件

#### 拖拽上传 ⚠️
- 由于 Electron 沙盒安全限制，拖拽上传功能暂时无法使用
- 拖拽文件时会提示用户点击上传按钮
- 未来版本可能通过更好的方式实现

### 2. 支持的文件类型

**图片格式**:
- JPG, JPEG, PNG, GIF, BMP, WEBP
- 上传后显示缩略图预览
- 支持点击放大查看

**文档格式**:
- PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
- TXT, MD, CSV
- 显示文件图标和大小

### 3. 文件预览

上传的文件在输入框上方显示预览卡片：
- **图片**: 显示缩略图
- **文档**: 显示文件图标、名称、大小
- 可点击 × 按钮移除已上传的文件
- 上传中显示进度动画

### 4. 发送到对话

发送消息时：
- 自动将文件信息附加到消息中
- 图片：添加 `[图片：文件名]` 标记
- 文档：添加 `[文档：文件名]` 标记
- 支持 OCR 识别（图片）
- 支持提取文本内容（TXT/MD/CSV）

### 5. OCR 识别

图片上传后：
- 自动标记需要进行 OCR 识别
- OCR 结果将附加到消息上下文
- AI 可以读取图片中的文字内容

### 6. 消息显示

聊天消息中：
- 图片显示为可点击的缩略图
- 文档显示为带图标的卡片
- 点击可打开/下载文件

## 技术实现

### 前端 (renderer.js)

```javascript
// 文件上传核心函数
- handleUploadClick()      // 处理按钮点击
- handleFileSelect()       // 处理文件选择
- uploadFile()             // 上传单个文件
- setupDragAndDrop()       // 设置拖拽上传
- addFilePreview()         // 添加预览卡片
- removeFilePreview()      // 移除预览
```

### 后端 (main.js)

```javascript
// IPC 处理
- 'select-files'    // 打开文件选择对话框
- 'upload-file'     // 处理文件上传
- 'get-file-info'   // 获取文件信息
- 'delete-file'     // 删除文件
```

### 数据流

```
用户选择/拖拽文件
    ↓
renderer.js 读取文件路径
    ↓
通过 IPC 发送到 main.js
    ↓
main.js 读取文件并保存
    ↓
生成文件 ID 和 URL
    ↓
返回文件信息到 renderer
    ↓
显示预览卡片
    ↓
用户发送消息
    ↓
将文件信息附加到消息内容
    ↓
发送到 OpenClaw Gateway
```

## 消息格式

发送的消息包含 attachments 数组：

```json
{
  "role": "user",
  "content": "请分析这张图片\n\n[图片：screenshot.png]",
  "attachments": [
    {
      "id": "file-xxx",
      "name": "screenshot.png",
      "size": 102400,
      "mimeType": "image/png",
      "isImage": true,
      "url": "file:///path/to/file",
      "ocrText": "[图片待 OCR 识别]"
    }
  ]
}
```

## CSS 样式

新增样式类：
- `.file-preview-container` - 预览容器
- `.file-preview-card` - 预览卡片
- `.attachment-image` - 图片附件
- `.attachment-file` - 文档附件
- `.drag-over` - 拖拽覆盖层

## 后续优化建议

1. **OCR 集成**: 对接真实的 OCR 服务（如 Tesseract.js 或云端 OCR）
2. **文档解析**: 实现 PDF、Word 等文档的文本提取
3. **文件存储**: 集成 MinIO 或其他对象存储
4. **上传进度**: 显示真实的大文件上传进度
5. **文件大小限制**: 添加文件大小验证
6. **图片压缩**: 自动压缩大尺寸图片
