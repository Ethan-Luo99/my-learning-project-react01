# 模块 1.1：项目脚手架搭建 - Prompt 集合

## 题目 1.1.1：使用 Vite 初始化 React + TypeScript 项目

### 题目描述
请在当前 `React01` 文件夹中，使用 Vite 脚手架初始化一个 React + TypeScript 项目。

### 具体要求

1. **项目位置**：
   - 必须在当前工作目录 `d:\RemoteWork\prompts\Trae CN\React01` 中初始化项目
   - 不要创建新的子文件夹，直接在 React01 目录下生成项目文件

2. **技术选型**：
   - 构建工具：Vite
   - 前端框架：React
   - 编程语言：TypeScript
   - 模板：`react-ts`

3. **初始化步骤**：
   - 使用 `npm create vite@latest` 命令初始化项目
   - 选择 React 框架
   - 选择 TypeScript 变体
   - 安装项目依赖

4. **验证要求**：
   - 项目能够正常启动（`npm run dev`）
   - 访问 http://localhost:5173 能看到 Vite + React 默认页面
   - TypeScript 配置正常工作

### 输入/输出

**输入**：
- 空的 `React01` 文件夹
- 已安装 Node.js（v18+）和 npm

**输出**：
- 完整的项目文件结构：
  ```
  React01/
  ├── node_modules/
  ├── public/
  ├── src/
  │   ├── App.css
  │   ├── App.tsx
  │   ├── index.css
  │   ├── main.tsx
  │   └── vite-env.d.ts
  ├── .gitignore
  ├── index.html
  ├── package.json
  ├── tsconfig.json
  ├── tsconfig.node.json
  └── vite.config.ts
  ```

### 验收标准
- ✅ 项目文件结构完整
- ✅ `package.json` 中正确配置了 react、react-dom、vite、@vitejs/plugin-react
- ✅ `tsconfig.json` 配置正确
- ✅ 项目能够成功启动
- ✅ 默认页面正常渲染

---

## 题目 1.1.2：配置项目目录结构

### 题目描述
基于已初始化的 React 项目，重新组织目录结构，使其适合低代码搭建平台的开发。

### 具体要求

1. **目标目录结构**：
   请在 `src` 目录下创建以下文件夹结构：
   ```
   src/
   ├── components/          # 可复用组件
   │   ├── builder/        # 搭建器核心组件
   │   │   ├── Canvas/     # 画布组件
   │   │   ├── ComponentPanel/  # 组件库面板
   │   │   └── PropertyPanel/   # 属性配置面板
   │   ├── ui/             # 基础 UI 组件
   │   └── common/         # 通用组件
   ├── store/              # Zustand 状态管理
   ├── types/              # TypeScript 类型定义
   ├── utils/              # 工具函数
   ├── constants/          # 常量定义
   ├── hooks/              # 自定义 Hooks
   ├── assets/             # 静态资源
   ├── App.tsx             # 根组件
   └── main.tsx            # 入口文件
   ```

2. **操作步骤**：
   - 创建上述所有文件夹
   - 在每个文件夹中创建 `.gitkeep` 文件（保持文件夹在 git 中）
   - 移动原有的 `App.tsx` 和 `main.tsx` 到正确位置
   - 更新 `main.tsx` 中的导入路径（如果需要）

3. **文件内容要求**：
   - 更新 `App.tsx`，使其输出一个简单的欢迎信息：`<h1>低代码搭建平台</h1>`
   - 确保项目仍然能够正常启动

### 验收标准
- ✅ 目录结构完全按照要求创建
- ✅ 项目能够正常启动
- ✅ 页面上显示"低代码搭建平台"
- ✅ 所有导入路径正确

---

## 题目 1.1.3：配置 ESLint + Prettier 代码规范

### 题目描述
为项目配置 ESLint 和 Prettier，确保代码风格统一。

### 具体要求

1. **安装依赖**：
   - 安装 ESLint 相关包：`eslint`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`
   - 安装 Prettier 相关包：`prettier`, `eslint-config-prettier`, `eslint-plugin-prettier`

2. **配置 ESLint**：
   创建 `.eslintrc.cjs` 文件，配置内容：
   ```javascript
   module.exports = {
     root: true,
     env: { browser: true, es2020: true },
     extends: [
       'eslint:recommended',
       'plugin:@typescript-eslint/recommended',
       'plugin:react-hooks/recommended',
     ],
     ignorePatterns: ['dist', '.eslintrc.cjs'],
     parser: '@typescript-eslint/parser',
     plugins: ['react-refresh'],
     rules: {
       'react-refresh/only-export-components': [
         'warn',
         { allowConstantExport: true },
       ],
     },
   }
   ```

3. **配置 Prettier**：
   创建 `.prettierrc` 文件，配置内容：
   ```json
   {
     "semi": true,
     "trailingComma": "all",
     "singleQuote": true,
     "printWidth": 100,
     "tabWidth": 2,
     "endOfLine": "auto"
   }
   ```

4. **配置 .prettierignore**：
   ```
   dist
   node_modules
   *.local
   ```

5. **更新 package.json 脚本**：
   ```json
   {
     "scripts": {
       "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
       "lint:fix": "eslint . --ext ts,tsx --fix",
       "format": "prettier --write \"src/**/*.{ts,tsx,css,json}\"",
       "format:check": "prettier --check \"src/**/*.{ts,tsx,css,json}\""
     }
   }
   ```

### 验收标准
- ✅ `.eslintrc.cjs` 文件创建成功
- ✅ `.prettierrc` 文件创建成功
- ✅ `npm run lint` 能够正常执行
- ✅ `npm run format` 能够格式化代码
- ✅ 代码规范配置生效

---

## 题目 1.1.4：配置路径别名（Alias）

### 题目描述
为项目配置路径别名，简化模块导入路径。

### 具体要求

1. **配置 tsconfig.json**：
   在 `tsconfig.json` 中的 `compilerOptions` 添加：
   ```json
   {
     "compilerOptions": {
       "baseUrl": ".",
       "paths": {
         "@/*": ["src/*"],
         "@/components/*": ["src/components/*"],
         "@/store/*": ["src/store/*"],
         "@/types/*": ["src/types/*"],
         "@/utils/*": ["src/utils/*"],
         "@/hooks/*": ["src/hooks/*"],
         "@/constants/*": ["src/constants/*"]
       }
     }
   }
   ```

2. **配置 vite.config.ts**：
   更新 `vite.config.ts`，添加路径别名解析：
   ```typescript
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'
   import path from 'path'

   export default defineConfig({
     plugins: [react()],
     resolve: {
       alias: {
         '@': path.resolve(__dirname, './src'),
       },
     },
   })
   ```

3. **配置类型声明**：
   在 `src/vite-env.d.ts` 或创建 `src/types/global.d.ts`：
   ```typescript
   /// <reference types="vite/client" />
   ```

4. **测试路径别名**：
   - 在 `App.tsx` 中使用 `@/components/ui` 导入（即使文件不存在，确保类型检查不报错）
   - 运行 `npm run dev` 确认配置生效

### 验收标准
- ✅ `tsconfig.json` 中 paths 配置正确
- ✅ `vite.config.ts` 中 alias 配置正确
- ✅ 使用 `@/` 前缀导入模块不报错
- ✅ 项目正常启动

---

## 题目 1.1.5：配置环境变量

### 题目描述
为项目配置环境变量，支持不同环境（开发、生产）的配置。

### 具体要求

1. **创建环境文件**：
   - 创建 `.env.development` 文件：
     ```
     VITE_APP_TITLE=低代码搭建平台 - 开发环境
     VITE_API_BASE_URL=http://localhost:3000
     ```
   
   - 创建 `.env.production` 文件：
     ```
     VITE_APP_TITLE=低代码搭建平台
     VITE_API_BASE_URL=/api
     ```

2. **创建环境变量类型声明**：
   在 `src/types/env.d.ts` 中：
   ```typescript
   /// <reference types="vite/client" />

   interface ImportMetaEnv {
     readonly VITE_APP_TITLE: string
     readonly VITE_API_BASE_URL: string
   }

   interface ImportMeta {
     readonly env: ImportMetaEnv
   }
   ```

3. **在代码中使用环境变量**：
   更新 `App.tsx`，显示应用标题：
   ```typescript
   function App() {
     return (
       <div>
         <h1>{import.meta.env.VITE_APP_TITLE}</h1>
       </div>
     )
   }
   ```

4. **更新 .gitignore**：
   确保 `.env.local` 在 `.gitignore` 中（不提交本地环境变量）

### 验收标准
- ✅ 环境文件创建成功
- ✅ 环境变量类型声明正确
- ✅ 页面显示"低代码搭建平台 - 开发环境"
- ✅ TypeScript 类型检查通过

---

## 模块 1.1 总结

本模块共 5 道题目，完成以下内容：
1. ✅ 使用 Vite 初始化 React + TypeScript 项目
2. ✅ 配置适合低代码平台的目录结构
3. ✅ 配置 ESLint + Prettier 代码规范
4. ✅ 配置路径别名简化导入
5. ✅ 配置环境变量

**前置条件**：无（从零开始）  
**后续依赖**：模块 1.2（依赖安装与配置）
