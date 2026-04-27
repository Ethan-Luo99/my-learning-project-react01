# 模块 1.2：依赖安装与配置 - Prompt 集合

## 题目 1.2.1：安装并配置 TailwindCSS

### 题目描述
为项目安装 TailwindCSS，并配置基础样式系统。

### 具体要求

1. **安装依赖**：
   ```bash
   npm install -D tailwindcss @tailwindcss/vite
   ```

2. **配置 vite.config.ts**：
   更新 `vite.config.ts`，添加 TailwindCSS 插件：
   ```typescript
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'
   import path from 'path'
   import tailwindcss from '@tailwindcss/vite'

   export default defineConfig({
     plugins: [react(), tailwindcss()],
     resolve: {
       alias: {
         '@': path.resolve(__dirname, './src'),
         '@/components': path.resolve(__dirname, './src/components'),
         '@/store': path.resolve(__dirname, './src/store'),
         '@/types': path.resolve(__dirname, './src/types'),
         '@/utils': path.resolve(__dirname, './src/utils'),
         '@/hooks': path.resolve(__dirname, './src/hooks'),
         '@/constants': path.resolve(__dirname, './src/constants'),
       },
     },
   })
   ```

3. **在 CSS 中引入 Tailwind**：
   更新 `src/index.css`，替换原有内容为：
   ```css
   @import "tailwindcss";

   /* 自定义全局样式 */
   * {
     margin: 0;
     padding: 0;
     box-sizing: border-box;
   }

   body {
     font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
       'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
       sans-serif;
     -webkit-font-smoothing: antialiased;
     -moz-osx-font-smoothing: grayscale;
   }

   /* 自定义主题色 */
   @theme {
     --color-primary-50: #eff6ff;
     --color-primary-100: #dbeafe;
     --color-primary-200: #bfdbfe;
     --color-primary-300: #93c5fd;
     --color-primary-400: #60a5fa;
     --color-primary-500: #3b82f6;
     --color-primary-600: #2563eb;
     --color-primary-700: #1d4ed8;
     --color-primary-800: #1e40af;
     --color-primary-900: #1e3a8a;
   }
   ```

4. **测试 TailwindCSS**：
   更新 `App.tsx`，使用 TailwindCSS 类名：
   ```typescript
   function App() {
     return (
       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
         <h1 className="text-3xl font-bold text-primary-600">
           {import.meta.env.VITE_APP_TITLE}
         </h1>
       </div>
     )
   }

   export default App
   ```

### 验收标准
- ✅ TailwindCSS 成功安装
- ✅ `tailwind.config.js` 配置正确
- ✅ `postcss.config.js` 配置正确
- ✅ `index.css` 引入了 Tailwind 指令
- ✅ 页面使用 TailwindCSS 类名正常渲染
- ✅ 自定义主题色 `primary` 可用

---

## 题目 1.2.2：安装并配置 Zustand 状态管理

### 题目描述
安装 Zustand 状态管理库，并创建基础的 Store 结构。

### 具体要求

1. **安装依赖**：
   ```bash
   npm install zustand
   ```

2. **创建基础 Store**：
   创建 `src/store/useBuilderStore.ts`：
   ```typescript
   import { create } from 'zustand'

   interface BuilderState {
     // 组件树数据
     components: any[]
     
     // 当前选中的组件 ID
     selectedComponentId: string | null
     
     // Actions
     setComponents: (components: any[]) => void
     setSelectedComponentId: (id: string | null) => void
   }

   export const useBuilderStore = create<BuilderState>((set) => ({
     components: [],
     selectedComponentId: null,
     
     setComponents: (components) => set({ components }),
     setSelectedComponentId: (id) => set({ selectedComponentId: id }),
   }))
   ```

3. **在组件中使用 Store**：
   更新 `App.tsx`，使用 Zustand store：
   ```typescript
   import { useBuilderStore } from '@/store/useBuilderStore'

   function App() {
     const { components, selectedComponentId, setSelectedComponentId } = useBuilderStore()
     
     return (
       <div className="min-h-screen bg-gray-50">
         <h1 className="text-3xl font-bold text-primary-600 text-center py-8">
           {import.meta.env.VITE_APP_TITLE}
         </h1>
         <div className="text-center text-gray-600">
           <p>当前组件数量: {components.length}</p>
           <p>选中组件: {selectedComponentId || '无'}</p>
         </div>
       </div>
     )
   }

   export default App
   ```

4. **安装 Redux DevTools（可选）**：
   为了方便调试，可以安装 Redux DevTools 浏览器扩展，Zustand 默认支持。

### 验收标准
- ✅ Zustand 成功安装
- ✅ `useBuilderStore.ts` 创建成功
- ✅ Store 包含基础状态和 actions
- ✅ 组件能够正确读取和更新 store 状态
- ✅ TypeScript 类型检查通过

---

## 题目 1.2.3：安装并配置 DnD Kit 拖拽库

### 题目描述
安装 DnD Kit 拖拽库，并创建基础的拖拽上下文配置。

### 具体要求

1. **安装依赖**：
   ```bash
   npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
   ```

2. **创建拖拽上下文组件**：
   创建 `src/components/builder/DndContext.tsx`：
   ```typescript
   import { DndContext as DndKitContext, closestCenter } from '@dnd-kit/core'
   import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
   import type { ReactNode } from 'react'

   interface DndContextProps {
     children: ReactNode
     onDragEnd: (event: any) => void
   }

   export function DndContext({ children, onDragEnd }: DndContextProps) {
     return (
       <DndKitContext
         collisionDetection={closestCenter}
         onDragEnd={onDragEnd}
       >
         {children}
       </DndKitContext>
     )
   }
   ```

3. **在 App 中集成拖拽上下文**：
   更新 `App.tsx`：
   ```typescript
   import { DndContext } from '@/components/builder/DndContext'
   import { useBuilderStore } from '@/store/useBuilderStore'

   function App() {
     const handleDragEnd = (event: any) => {
       console.log('拖拽结束', event)
     }

     return (
       <DndContext onDragEnd={handleDragEnd}>
         <div className="min-h-screen bg-gray-50">
           <h1 className="text-3xl font-bold text-primary-600 text-center py-8">
             {import.meta.env.VITE_APP_TITLE}
           </h1>
         </div>
       </DndContext>
     )
   }

   export default App
   ```

4. **测试拖拽库**：
   - 确保项目能够正常启动
   - 控制台无报错
   - DnD Kit 相关导入正常

### 验收标准
- ✅ DnD Kit 相关包成功安装
- ✅ `DndContext.tsx` 组件创建成功
- ✅ 拖拽上下文正确包裹应用
- ✅ 项目正常启动无报错
- ✅ TypeScript 类型检查通过

---

## 题目 1.2.4：安装其他工具库

### 题目描述
安装项目常用的工具库，提升开发效率。

### 具体要求

1. **安装依赖**：
   ```bash
   npm install uuid clsx
   npm install -D @types/uuid
   ```

   - `uuid`: 生成唯一 ID（用于组件 ID）
   - `clsx`: 条件类名拼接（用于动态 className）

2. **创建工具函数**：
   创建 `src/utils/id.ts`：
   ```typescript
   import { v4 as uuidv4 } from 'uuid'

   /**
    * 生成唯一 ID
    * @param prefix - ID 前缀（可选）
    * @returns 唯一 ID 字符串
    */
   export function generateId(prefix: string = 'comp'): string {
     return `${prefix}-${uuidv4()}`
   }
   ```

3. **创建类名工具函数**：
   创建 `src/utils/classname.ts`：
   ```typescript
   import clsx from 'clsx'
   import { twMerge } from 'tailwind-merge'

   /**
    * 合并类名，支持 TailwindCSS
    */
   export function cn(...inputs: clsx.ClassValue[]) {
     return twMerge(clsx(inputs))
   }
   ```

4. **安装 tailwind-merge**：
   ```bash
   npm install tailwind-merge
   ```

5. **测试工具函数**：
   在 `App.tsx` 中测试：
   ```typescript
   import { generateId } from '@/utils/id'
   import { cn } from '@/utils/classname'

   function App() {
     const testId = generateId('test')
     const className = cn('text-primary-600', 'font-bold')
     
     return (
       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
         <div className={className}>
           <h1>测试 ID: {testId}</h1>
         </div>
       </div>
     )
   }

   export default App
   ```

### 验收标准
- ✅ uuid、clsx、tailwind-merge 成功安装
- ✅ `generateId` 函数正常工作
- ✅ `cn` 类名合并函数正常工作
- ✅ TypeScript 类型检查通过
- ✅ 页面显示生成的测试 ID

---

## 题目 1.2.5：安装开发工具依赖

### 题目描述
安装开发过程中常用的工具依赖，提升开发体验。

### 具体要求

1. **安装类型声明文件**（如已安装可跳过）：
   ```bash
   # 检查是否已安装：@types/node, @types/react, @types/react-dom
   # 如果 package.json 中已有，则无需重复安装
   ```

2. **检查类型文件**：
   确认 `src/types/global.d.ts` 已存在（模块 1.1 已创建）
   确认 `src/types/env.d.ts` 已存在（模块 1.1 已创建）

3. **验证配置**：
   - 运行 `npm run dev` 确认项目正常启动
   - 运行 `npm run lint` 确认无 lint 错误
   - TypeScript 编译器正常工作

### 验收标准
- ✅ 类型声明包已正确安装（已在模块 1.1 完成）
- ✅ `global.d.ts` 和 `env.d.ts` 存在
- ✅ TypeScript 类型检查通过
- ✅ 项目正常启动
- ✅ Lint 检查通过

---

## 模块 1.2 总结

本模块共 5 道题目，完成以下内容：
1. ✅ 安装并配置 TailwindCSS 样式系统
2. ✅ 安装并配置 Zustand 状态管理
3. ✅ 安装并配置 DnD Kit 拖拽库
4. ✅ 安装工具库（uuid、clsx、tailwind-merge）
5. ✅ 安装开发工具依赖

**前置条件**：模块 1.1（项目脚手架搭建）  
**后续依赖**：模块 1.3（基础组件库搭建）
