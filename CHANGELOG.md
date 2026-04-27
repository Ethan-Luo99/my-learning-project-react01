# Changelog

All notable changes to this project will be documented in this file.

## [0.0.0] - 2026-04-27

### Added

#### 项目脚手架
- 搭建 React + TypeScript + Vite 项目脚手架
- 配置 TailwindCSS 4 作为样式方案
- 配置 Zustand 5 作为状态管理方案
- 集成 DnD Kit 实现拖拽功能
- 配置 React Router 7 路由管理
- 配置 ESLint + Prettier 代码规范

#### 基础 UI 组件库
- **Button** - 可配置的按钮组件
- **Text** - 文本展示组件
- **Image** - 图片展示组件
- **Container** - 容器组件，支持嵌套

#### 低代码编辑器核心
- 实现三栏布局（组件库、画布、属性面板）
  - 左侧组件面板：展示可拖拽的组件列表
  - 中间画布区域：可视化编辑区域，支持拖拽摆放
  - 右侧属性面板：编辑选中组件的属性配置

#### 核心功能
- 组件拖拽添加到画布
- 组件选中与取消选中
- 组件删除功能
- 组件复制功能
- 撤销/重做（历史记录）
- 编辑模式/预览模式切换
- 响应式设计支持

#### 状态管理
- 使用 Zustand 实现全局状态管理
- 组件树状态管理
- 历史记录栈管理
- 选中组件状态管理

#### 类型定义
- 完整的 TypeScript 类型定义
- 组件类型定义
- 全局类型声明
- 环境变量类型定义

#### 环境配置
- .env.development - 开发环境变量配置
- .env.production - 生产环境变量配置

---

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
