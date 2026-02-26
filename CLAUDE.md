# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Install dependencies
npm install

# Start application
npm start

# Start with dev tools
npm run dev

# Windows: Use startup script (auto-checks Node.js and dependencies)
start.bat
```

## Architecture Overview

**Electron Application** with main/renderer process separation:

- `main.js` - Electron main process, handles WebSocket connections to OpenClaw Gateway with ED25519 device authentication
- `preload.js` - Exposes IPC bridge (`window.electronAPI`) to renderer via contextBridge
- `src/renderer.js` - Frontend logic, UI state management, message handling
- `src/index.html` - Single-page UI with connection panel, chat panel, and settings modal
- `src/styles.css` - Dark theme with CSS variables, animations, and responsive design

## OpenClaw Protocol

The app implements the OpenClaw Gateway WebSocket protocol:
1. Connects to `ws://127.0.0.1:18789` (configurable)
2. Receives `connect.challenge` with nonce
3. Signs challenge using ED25519 keypair (stored in app userData)
4. Sends `connect` request with device signature, token, and scopes
5. Handles `agent` events for streaming AI responses

## Key Patterns

- **Sessions**: Multiple concurrent Gateway connections supported, stored in `Map` + localStorage
- **Message Streaming**: Handles `stream: 'assistant'/'text'` delta chunks and `lifecycle` events
- **Toast Notifications**: Centralized `showToast()` for user feedback
- **Auto Gateway Detection**: Polls Gateway every 5s via fetch HEAD request

## Configuration

- Gateway URL: Default `http://127.0.0.1:18789`
- Token: Stored in `%USERPROFILE%\.openclaw\openclaw.json` under `gateway.auth.token`
- Device keys: Persisted in Electron userData as ED25519 PEM keypair
