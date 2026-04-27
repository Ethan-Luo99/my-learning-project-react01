# 模块 1.7：Git 仓库初始化与项目规范化

## 背景说明

项目已完成基础功能和交互实现，现在需要将项目纳入版本控制，并建立标准化的开发流程。

本模块目标：
- 初始化本地 Git 仓库
- 配置远程仓库连接
- 完善 .gitignore 规则
- 生成项目规范文档
- 创建首次提交

---

## 题目 1.7.1：初始化 Git 仓库与配置

### 题目描述

为当前 React01 项目初始化 Git 仓库，并配置基本信息。

### 具体要求

#### 1. 初始化本地仓库

在项目根目录执行：
```bash
git init
```

验证仓库初始化成功：
- 项目中出现 `.git` 隐藏文件夹
- 执行 `git status` 能正常显示文件状态

#### 2. 配置 Git 用户信息

配置全局或局部用户信息（如果未配置）：
```bash
git config user.name "开发者名称"
git config user.email "开发者邮箱"
```

#### 3. 创建并配置 .gitignore

检查并完善 `.gitignore` 文件，确保包含以下内容：

**必须忽略的文件/目录**：
```gitignore
# 依赖目录
node_modules/

# 构建产物
dist/
build/
.out/

# 环境变量文件（保护敏感信息）
.env.local
.env.*.local

# IDE 配置（可选，根据团队规范）
.vscode/settings.json
.idea/

# 操作系统文件
.DS_Store
Thumbs.db
desktop.ini

# 日志文件
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# 测试覆盖率
coverage/
.nyc_output/

# 临时文件
*.tmp
*.temp
.cache/

# Zustand 持久化数据（如果使用了 localStorage 导出）
*.storage.json
```

**注意事项**：
- `.env.development` 和 `.env.production` **不应该**被忽略（需要提交模板配置）
- `node_modules` 必须忽略（通过 package.json 重新安装）
- `dist` 必须忽略（构建产物）

#### 4. 验证 .gitignore 生效

执行以下命令验证：
```bash
# 查看被忽略的文件
git status --ignored

# 确保 node_modules 被忽略
git status
```

### 验收标准

- ✅ Git 仓库初始化成功
- ✅ `.gitignore` 文件存在且配置完整
- ✅ `node_modules` 被正确忽略
- ✅ `dist` 被正确忽略
- ✅ `.env.local` 被正确忽略
- ✅ `git status` 只显示项目源文件
- ✅ 无敏感信息泄露风险

---

## 题目 1.7.2：连接远程仓库与首次提交

### 题目描述

将本地仓库连接到远程 GitHub 仓库，并完成首次提交。

### 具体要求

#### 1. 添加远程仓库

连接远程仓库：
```bash
git remote add origin https://github.com/Ethan-Luo99/my-learning-project-react01.git
```

验证连接：
```bash
git remote -v
```

应该显示：
```
origin  https://github.com/Ethan-Luo99/my-learning-project-react01.git (fetch)
origin  https://github.com/Ethan-Luo99/my-learning-project-react01.git (push)
```

#### 2. 创建首次提交

**步骤 1：查看文件状态**
```bash
git status
```

**步骤 2：添加文件到暂存区**
```bash
git add .
```

或者选择性添加（推荐）：
```bash
# 添加源代码
git add src/
git add public/

# 添加配置文件
git add package.json
git add tsconfig*.json
git add vite.config.ts
git add .eslintrc.cjs
git add .prettierrc

# 添加文档
git add README.md
git add .gitignore
```

**步骤 3：查看暂存区内容**
```bash
git status
git diff --cached --stat
```

**步骤 4：创建提交**
```bash
git commit -m "feat: 初始化低代码搭建平台项目

- 搭建 React + TypeScript + Vite 项目脚手架
- 配置 TailwindCSS、Zustand、DnD Kit
- 实现基础 UI 组件库（Button、Text、Image、Container）
- 实现三栏布局（组件库、画布、属性面板）
- 实现组件添加、选中、删除、复制功能
- 实现撤销/重做、预览模式切换
- 配置 ESLint + Prettier 代码规范"
```

**提交信息规范**：
- 使用 Conventional Commits 规范
- 类型包括：feat（新功能）、fix（修复）、docs（文档）、style（格式）、refactor（重构）、test（测试）、chore（杂项）
- 第一行简短描述（不超过 72 字符）
- 空一行后写详细描述（可选）

#### 3. 推送到远程仓库

```bash
git branch -M main
git push -u origin main
```

验证推送成功：
- 访问 GitHub 仓库页面
- 确认文件已上传
- 提交记录正确显示

#### 4. 创建 .gitattributes（可选）

创建 `.gitattributes` 文件，统一换行符：
```gitattributes
# 自动检测文本文件
* text=auto

# Windows 脚本使用 CRLF
*.bat text eol=crlf
*.cmd text eol=crlf

# Unix 脚本使用 LF
*.sh text eol=lf

# 图片文件使用二进制
*.png binary
*.jpg binary
*.gif binary
*.svg text
```

### 验收标准

- ✅ 远程仓库连接成功
- ✅ 首次提交信息符合规范
- ✅ 代码成功推送到 GitHub
- ✅ GitHub 仓库页面显示正确
- ✅ 所有源文件已提交（无遗漏）
- ✅ 敏感文件未泄露（检查提交历史）

---

## 题目 1.7.3：生成项目规范化文档

### 题目描述

创建项目必要的规范文档，方便团队协作和后续开发。

### 具体要求

#### 1. 完善 README.md

创建或更新 `README.md`，包含以下内容：

```markdown
# 低代码搭建平台

一个基于 React + TypeScript 的可视化 H5 页面搭建工具。

## 技术栈

- **前端框架**: React 19 + TypeScript
- **构建工具**: Vite 8
- **样式方案**: TailwindCSS 4
- **状态管理**: Zustand 5
- **拖拽库**: DnD Kit
- **代码规范**: ESLint + Prettier

## 功能特性

- ✅ 可视化组件拖拽搭建
- ✅ 组件库面板（基础、布局、表单）
- ✅ 实时属性配置面板
- ✅ 撤销/重做功能
- ✅ 预览模式切换
- ✅ 数据持久化（localStorage）
- ✅ 响应式布局支持

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
npm run build
```

### 代码检查

```bash
# ESLint 检查
npm run lint

# Prettier 格式化
npm run format
```

## 项目结构

```
src/
├── components/
│   ├── builder/          # 搭建器核心组件
│   │   ├── Canvas/       # 画布组件
│   │   ├── ComponentPanel/  # 组件库面板
│   │   ├── PropertyPanel/   # 属性面板
│   │   ├── ComponentRenderer/  # 组件渲染器
│   │   ├── Header.tsx    # 顶部导航栏
│   │   └── DndContext.tsx # 拖拽上下文
│   └── ui/               # 基础 UI 组件
├── store/                # Zustand 状态管理
├── types/                # TypeScript 类型定义
├── utils/                # 工具函数
├── constants/            # 常量与 Mock 数据
├── hooks/                # 自定义 Hooks
└── App.tsx               # 根组件
```

## 开发规范

### 提交信息规范

使用 Conventional Commits 规范：

```
<type>(<scope>): <subject>

<body>
```

类型包括：
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具相关

示例：
```
feat(canvas): 实现组件拖拽添加功能

- 支持从组件库拖拽到画布
- 自动插入到画布末尾
- 添加拖拽视觉反馈
```

### 分支管理规范

- `main`: 主分支，保持稳定
- `develop`: 开发分支
- `feature/xxx`: 功能分支
- `fix/xxx`: 修复分支

### 代码审查

所有代码合并到 main 前需要经过 Code Review。

## 许可证

MIT
```

#### 2. 创建 CONTRIBUTING.md

创建 `CONTRIBUTING.md`（贡献指南）：

```markdown
# 贡献指南

感谢你对本项目的关注！欢迎贡献代码。

## 开发流程

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: add some feature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 代码规范

- 遵循 ESLint 规则
- 使用 Prettier 格式化代码
- 提交信息遵循 Conventional Commits 规范

## 提交 PR 前检查清单

- [ ] 代码通过 ESLint 检查
- [ ] 代码已格式化
- [ ] 功能测试通过
- [ ] 提交信息符合规范
```

#### 3. 创建 CHANGELOG.md（可选）

创建 `CHANGELOG.md`（变更日志）：

```markdown
# 变更日志

## [0.1.0] - 2026-04-26

### Added
- 初始化 React + TypeScript + Vite 项目
- 实现基础 UI 组件库
- 实现三栏布局界面
- 实现组件添加、选中、删除、复制功能
- 实现撤销/重做、预览模式切换
```

### 验收标准

- ✅ README.md 内容完整准确
- ✅ CONTRIBUTING.md 包含开发流程
- ✅ CHANGELOG.md 记录首次版本
- ✅ 所有文档使用 Markdown 格式
- ✅ 文档中包含项目结构说明
- ✅ 文档中包含快速开始指南

---

## 模块 1.7 总结

本模块共 3 道题目，完成以下内容：

1. ✅ 初始化 Git 仓库与配置
2. ✅ 连接远程仓库与首次提交
3. ✅ 生成项目规范化文档

**预期效果**：
- 项目纳入版本控制
- 远程仓库同步
- 开发流程规范化
- 团队协作有章可循

**前置条件**：模块 1.6（基础交互功能实现）  
**后续依赖**：后续所有模块都基于 Git 工作流

---

## 验收测试清单

完成所有题目后，请按以下步骤验证：

- [ ] 项目根目录存在 `.git` 文件夹
- [ ] `.gitignore` 文件配置完整
- [ ] `git status` 只显示项目源文件
- [ ] `node_modules` 不在暂存区中
- [ ] `dist` 不在暂存区中
- [ ] `.env.local` 不在暂存区中
- [ ] `git remote -v` 显示正确的远程仓库地址
- [ ] 至少有一次提交记录
- [ ] 提交信息符合 Conventional Commits 规范
- [ ] GitHub 仓库页面显示项目文件
- [ ] README.md 在 GitHub 上正确渲染
- [ ] 所有源文件已提交（无遗漏）

---

## 给审查者的提示

作为出题者，您可以使用以下命令查看受训模型的变更：

```bash
# 查看暂存区内容
git diff --cached

# 查看暂存区文件统计
git diff --cached --stat

# 查看某次提交的详细变更
git show <commit-hash>

# 查看提交历史
git log --oneline --graph

# 查看远程分支
git branch -r
```

这样可以清楚地看到受训模型的每一步操作和代码变更。
