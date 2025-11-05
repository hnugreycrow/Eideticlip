# Eideticlip - 剪贴板管理工具

## 📝 项目简介

Eideticlip 是一款基于 Electron 和 Vue 3 开发的剪贴板管理工具，能够自动记录您复制的内容，方便随时查看和重用剪贴板历史记录。本项目是我为学习 Electron 开发而创建的小型实践项目，在实用性方面可能不如 Windows 自带的剪贴板历史功能便捷。

## ✨ 主要特性

- **剪贴板历史记录**：自动保存复制的文本内容，支持随时查看与重复使用
- **全局快捷键**：支持自定义快捷键快速唤出应用
- **系统托盘**：可最小化至系统托盘，减少对工作流程的干扰
- **主题切换**：提供亮色与暗色主题

## 🔧 技术栈

- **前端框架**：Vue 3 + TypeScript
- **构建工具**：Vite
- **UI 组件库**：Element Plus
- **桌面应用框架**：Electron
- **数据存储**：SQLite (better-sqlite3)

## 🚀 快速开始

### 方式一：直接下载

前往 [Releases](https://github.com/hnugreycrow/Eideticlip/releases) 页面下载安装包。

### 方式二：源码构建

#### 开发环境

```bash
# 安装依赖
npm install

# 重建 SQLite3 (如果需要)
npm run sqlite3-rebuild

# 启动开发服务器
npm run dev
```

#### 构建应用

```bash
# 构建生产版本
npm run build
```

## 📦 项目结构

```
├── electron/              # Electron 主进程代码
│   ├── database/          # 数据库相关代码
│   ├── services/          # 主进程服务
│   ├── main.ts            # 主进程入口
│   └── preload.ts         # 预加载脚本
├── src/                   # 渲染进程代码 (Vue 应用)
│   ├── assets/            # 静态资源
│   ├── components/        # Vue 组件
│   ├── layout/            # 布局组件
│   ├── router/            # 路由配置
│   ├── styles/            # 样式文件
│   ├── utils/             # 工具函数
│   ├── views/             # 页面视图
│   └── main.ts            # 渲染进程入口
├── public/                # 公共资源
└── vite.config.ts         # Vite 配置
```

## 📄 许可证

[MIT](./LICENSE) © [hnugreycrow](https://www.kimi.com/chat/LICENSE)
