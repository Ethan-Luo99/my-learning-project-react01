# React01 - 低代码搭建平台

一个基于 React + TypeScript + Vite 构建的低代码可视化搭建平台，支持拖拽式组件编排、实时预览和属性配置。

## 技术栈

- **前端框架**: React 19
- **开发语言**: TypeScript
- **构建工具**: Vite 8
- **样式方案**: TailwindCSS 4
- **状态管理**: Zustand 5
- **拖拽库**: DnD Kit
- **路由方案**: React Router 7
- **代码规范**: ESLint + Prettier

## 功能特性

### 基础 UI 组件库
- **Button** - 可配置的按钮组件
- **Text** - 文本展示组件
- **Image** - 图片展示组件
- **Container** - 容器组件，支持嵌套

### 三栏布局编辑器
- **左侧组件面板** - 展示可拖拽的组件列表
- **中间画布区域** - 可视化编辑区域，支持拖拽摆放
- **右侧属性面板** - 编辑选中组件的属性配置

### 核心功能（A 系列）
- ✅ 组件拖拽添加到画布 - [架构文档](docs/architecture/overview.md#44-容器拖拽模块-dnd)
- ✅ 组件选中与取消选中
- ✅ 组件删除功能 - [架构文档](docs/architecture/overview.md#45-快捷键模块-keyboard-shortcuts)
- ✅ 组件复制/粘贴功能 - [架构文档](docs/architecture/overview.md#45-快捷键模块-keyboard-shortcuts)
- ✅ 撤销/重做（历史记录）- [架构文档](docs/architecture/overview.md#42-状态管理模块-store)
- ✅ 编辑模式/预览模式切换 - [架构文档](docs/architecture/PREVIEW-MODE-ARCHITECTURE.md)
- ✅ 键盘快捷键支持 - [架构文档](docs/architecture/KEYBOARD-SHORTCUTS-ARCHITECTURE.md)
- ✅ 组件层级排序（上移/下移/置顶/置底）- [架构文档](docs/architecture/overview.md#42-状态管理模块-store)
- ✅ Container 容器组件嵌套 - [架构文档](docs/architecture/overview.md#44-容器拖拽模块-dnd)
- ✅ 多项目管理（创建/切换/删除/重命名）- [架构文档](docs/PERSISTENCE-ARCHITECTURE.md)
- ✅ 项目导入导出（JSON 格式）- [架构文档](docs/architecture/overview.md#48-导入导出模块-importexport)
- ✅ 数据校验和错误边界 - [架构文档](docs/architecture/overview.md#6-已知限制与改进建议)
- ✅ Toast 操作反馈提示 - [架构文档](docs/architecture/overview.md#47-错误处理模块-error-handling)
- ✅ React ErrorBoundary 错误边界 - [架构文档](docs/architecture/overview.md#47-错误处理模块-error-handling)

## 项目结构

```
React01/
├── src/
│   ├── assets/              # 静态资源
│   ├── components/
│   │   ├── builder/         # 低代码编辑器核心组件
│   │   │   ├── Canvas/      # 画布组件
│   │   │   ├── ComponentPanel/ # 组件面板
│   │   │   ├── ComponentRenderer/ # 组件渲染器
│   │   │   └── PropertyPanel/ # 属性面板
│   │   └── ui/              # 基础 UI 组件
│   ├── constants/           # 常量定义
│   ├── hooks/               # 自定义 Hooks
│   ├── router/              # 路由配置
│   ├── store/               # 状态管理
│   ├── types/               # TypeScript 类型定义
│   ├── utils/               # 工具函数
│   ├── App.tsx              # 根组件
│   └── main.tsx             # 入口文件
├── public/                  # 公共静态资源
├── .env.development         # 开发环境变量
├── .env.production          # 生产环境变量
├── package.json             # 依赖配置
├── vite.config.ts           # Vite 配置
└── tsconfig.json            # TypeScript 配置
```

## 快速开始

### 环境要求
- Node.js >= 18
- npm >= 9 或 pnpm >= 8

### 安装依赖

```bash
npm install
# 或
pnpm install
```

### 开发模式

```bash
npm run dev
# 或
pnpm dev
```

项目将在 `http://localhost:5173` 启动。

### 构建生产版本

```bash
npm run build
# 或
pnpm build
```

### 预览生产构建

```bash
npm run preview
# 或
pnpm preview
```

### 代码检查

```bash
npm run lint
# 或
pnpm lint
```

### 代码格式化

```bash
npm run format
# 或
pnpm format
```

## 使用说明

1. **添加组件**: 从左侧组件面板拖拽组件到中间画布
2. **编辑属性**: 点击画布中的组件选中，然后在右侧属性面板编辑属性
3. **删除组件**: 选中组件后，按 `Delete` 键或使用工具栏删除按钮
4. **复制组件**: 选中组件后，使用工具栏复制按钮
5. **撤销/重做**: 使用工具栏的撤销/重做按钮
6. **预览模式**: 点击工具栏的预览按钮，查看实际运行效果
7. **自动保存**: 组件变更后 2 秒自动保存到 localStorage
8. **项目管理**: 点击顶部项目名称跳转到项目管理页面，可创建/切换/删除/重命名项目
9. **导出项目**: 点击 Header 的"导出"按钮，将项目下载为 JSON 文件
10. **导入项目**: 在项目管理页面点击"导入项目"按钮，选择 JSON 文件导入

## 技术文档

| 文档 | 说明 |
|------|------|
| [A 系列架构综述](docs/architecture/overview.md) | 完整的架构综述，包含所有模块的功能总览、依赖关系、数据流、接口签名、集成点和改进建议 |
| [持久化模块架构设计](docs/PERSISTENCE-ARCHITECTURE.md) | 数据持久化、自动保存、项目管理、导入导出的完整架构说明 |
| [预览模式架构设计](docs/architecture/PREVIEW-MODE-ARCHITECTURE.md) | 预览模式的渲染策略、事件隔离、数据共享机制 |
| [键盘快捷键架构说明](docs/architecture/KEYBOARD-SHORTCUTS-ARCHITECTURE.md) | 快捷键系统的事件处理、焦点管理、跨平台兼容 |
| [存储服务自测文档](docs/STORAGE-SELF-TEST.md) | 存储模块的测试用例、验证步骤、边界情况说明 |
| [容器拖拽功能自测文档](docs/容器拖拽功能自测文档.md) | 拖拽功能的测试场景、预期结果、边界情况 |
| [组件层级排序功能自测文档](docs/组件层级排序功能自测文档.md) | 层级排序功能的测试用例、验证步骤 |
| [键盘快捷键功能自测文档](docs/键盘快捷键功能自测文档.md) | 快捷键功能的测试场景、预期结果 |

## 开发计划

- [ ] 更多基础组件（表单、表格、图表等）
- [ ] 组件样式自定义
- [ ] 数据绑定与事件处理
- [ ] 页面模板库
- [ ] 导出为 React 代码
- [ ] 数据持久化
- [ ] 多页面支持
- [ ] 协作编辑

## AI 训练工作流（Skills）

本项目内置了一套完整的 AI 大模型训练辅助工具，用于生成训练 prompt 和评估模型产出。

### 工作流概览

```
1. 使用 /prompt-planning 生成训练 prompt
   ↓ 保存到 .prompt/prompt_planning.md
   
2. 将 prompt 发送给受训练大模型
   ↓ 获取模型返回的代码变更
   
3. 使用 /code-annotation-in-trae-cn 评估模型产出
   ↓ 生成评估报告到 .history/TASK_*.md
```

### 可用指令

#### `/prompt-planning` - Prompt 规划与生成
**用途**：根据构思生成用于训练其他 AI IDE 的 prompt

**使用方式**：
```
[描述您的构思和需求]...规划 N 轮

/prompt-planning
```

**功能**：
- 读取您的构思描述
- 按照规范生成高质量 prompt
- 自动保存到 `.prompt/prompt_planning.md`
- 支持多轮规划（按序号追加）

**规范要求**：
- 长度精炼，不要过长
- 需求复杂度适中，确保需要改动多文件
- 不放太多源码，不放完整页面/功能代码
- 需求点丰富，提供足够上下文
- 纯文本格式，禁用 markdown

---

#### `/code-annotation-in-trae-cn` - 代码标注与评估
**用途**：评估受训练大模型的代码输出，生成评估报告

**前置准备**：
1. 在 `.prompt/previous_prompt.md` 中填写原始 prompt
2. 在 `.feedback/previous_feedback.md` 中填写您的反馈
3. 将受训练模型的代码变更 `git add` 到暂存区

**使用方式**：
```
/code-annotation-in-trae-cn
```

**功能**：
- 读取 prompt 和 feedback 文件
- 分析 git 暂存区的代码变更
- 生成标准化评估报告
- 自动保存到 `.history/TASK_YYMMDD_序号.md`

**评估维度**：
- 任务类型（Bug修复/0-1代码生成/Feature迭代等）
- 业务领域（Web前端/全栈Web应用等）
- 修改范围（单文件/模块内多文件/跨模块多文件等）
- 任务完成度
- 产物满意度

### 目录结构

```
.project/
├── .qoder/
│   ├── rules/              # 规范约束
│   │   ├── prompt-generation.md    # Prompt 生成规范
│   │   └── code-evaluation.md      # 评估报告格式
│   └── skills/             # 专业技能
│       ├── prompt-planning/          # /prompt-planning
│       └── code-annotation-in-trae-cn/  # /code-annotation-in-trae-cn
├── .prompt/                # Prompt 存储
│   ├── prompt_planning.md      # 规划的 prompt
│   └── previous_prompt.md      # 当前使用的 prompt
├── .feedback/              # 反馈记录
│   └── previous_feedback.md    # 对模型产出的反馈
└── .history/               # 评估报告
    └── TASK_YYMMDD_序号.md     # 评估报告文件
```

### 跨项目复用

要将此工作流复制到其他项目，只需：
1. 复制 `.qoder/` 目录到新项目
2. 用 Qoder 打开新项目
3. Skills 会自动创建所需的目录结构（.prompt/、.feedback/、.history/）

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

---

> 本项目是一个学习型项目，用于探索低代码平台的核心技术实现。


