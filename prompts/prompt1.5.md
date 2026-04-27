# 模块 1.5：路由与页面布局 - Prompt 集合

## 题目 1.5.1：安装并配置 React Router

### 题目描述
安装 React Router，配置基础路由结构。

### 具体要求

1. **安装依赖**：
   ```bash
   npm install react-router-dom
   ```

2. **创建路由配置**：
   创建 `src/router/index.tsx`：
   ```typescript
   import { createBrowserRouter } from 'react-router-dom'
   import App from '@/App'

   export const router = createBrowserRouter([
     {
       path: '/',
       element: <App />,
     },
   ])
   ```

3. **更新入口文件**：
   更新 `src/main.tsx`：
   ```typescript
   import React from 'react'
   import ReactDOM from 'react-dom/client'
   import { RouterProvider } from 'react-router-dom'
   import { router } from '@/router'
   import './index.css'

   ReactDOM.createRoot(document.getElementById('root')!).render(
     <React.StrictMode>
       <RouterProvider router={router} />
     </React.StrictMode>
   )
   ```

4. **测试路由**：
   - 运行 `npm run dev` 确认项目正常启动
   - 访问 `http://localhost:5173/` 页面正常显示

### 验收标准
- ✅ React Router 成功安装
- ✅ 路由配置文件创建成功
- ✅ main.tsx 使用 RouterProvider
- ✅ 项目正常启动无报错

---

## 题目 1.5.2：实现主页面布局框架

### 题目描述
创建低代码平台的主页面布局，包含左侧组件库、中间画布、右侧属性面板。

### 具体要求

1. **创建布局组件**：
   创建 `src/components/builder/Layout.tsx`：
   ```typescript
   import React from 'react'

   export const BuilderLayout: React.FC<{
     leftPanel: React.ReactNode
     canvas: React.ReactNode
     rightPanel: React.ReactNode
   }> = ({ leftPanel, canvas, rightPanel }) => {
     return (
       <div className="flex h-screen w-full bg-gray-100">
         {/* 左侧组件库 */}
         <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
           {leftPanel}
         </aside>

         {/* 中间画布区域 */}
         <main className="flex-1 overflow-auto p-8">
           <div className="max-w-4xl mx-auto">
             {canvas}
           </div>
         </main>

         {/* 右侧属性面板 */}
         <aside className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
           {rightPanel}
         </aside>
       </div>
     )
   }
   ```

2. **创建占位组件**：
   
   创建 `src/components/builder/ComponentPanel/index.tsx`：
   ```typescript
   import React from 'react'
   import { Text } from '@/components/ui'

   export const ComponentPanel: React.FC = () => {
     return (
       <div className="p-4">
         <Text variant="h3" weight="semibold" className="mb-4">
           组件库
         </Text>
         <Text variant="body" color="muted">
           拖拽组件到画布
         </Text>
       </div>
     )
   }
   ```

   创建 `src/components/builder/Canvas/index.tsx`：
   ```typescript
   import React from 'react'
   import { Text } from '@/components/ui'

   export const Canvas: React.FC = () => {
     return (
       <div className="min-h-[600px] bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 p-8">
         <Text variant="h3" weight="semibold" color="muted" className="text-center">
           拖拽组件到这里
         </Text>
       </div>
     )
   }
   ```

   创建 `src/components/builder/PropertyPanel/index.tsx`：
   ```typescript
   import React from 'react'
   import { Text } from '@/components/ui'

   export const PropertyPanel: React.FC = () => {
     return (
       <div className="p-4">
         <Text variant="h3" weight="semibold" className="mb-4">
           属性配置
         </Text>
         <Text variant="body" color="muted">
           选中组件后显示属性
         </Text>
       </div>
     )
   }
   ```

3. **更新 App.tsx**：
   ```typescript
   import { BuilderLayout } from '@/components/builder/Layout'
   import { ComponentPanel } from '@/components/builder/ComponentPanel'
   import { Canvas } from '@/components/builder/Canvas'
   import { PropertyPanel } from '@/components/builder/PropertyPanel'

   function App() {
     return (
       <BuilderLayout
         leftPanel={<ComponentPanel />}
         canvas={<Canvas />}
         rightPanel={<PropertyPanel />}
       />
     )
   }

   export default App
   ```

### 验收标准
- ✅ BuilderLayout 布局组件创建成功
- ✅ 三栏布局正确显示（左、中、右）
- ✅ 各面板占位组件正常渲染
- ✅ 页面布局响应式正常

---

## 题目 1.5.3：实现响应式布局优化

### 题目描述
优化布局，使其在不同屏幕尺寸下都能正常显示。

### 具体要求

1. **更新 Layout 组件**：
   更新 `src/components/builder/Layout.tsx`，添加响应式支持：
   ```typescript
   import React, { useState } from 'react'
   import { Button } from '@/components/ui'

   export const BuilderLayout: React.FC<{
     leftPanel: React.ReactNode
     canvas: React.ReactNode
     rightPanel: React.ReactNode
   }> = ({ leftPanel, canvas, rightPanel }) => {
     const [leftCollapsed, setLeftCollapsed] = useState(false)
     const [rightCollapsed, setRightCollapsed] = useState(false)

     return (
       <div className="flex h-screen w-full bg-gray-100">
         {/* 左侧组件库 */}
         <aside
           className={`bg-white border-r border-gray-200 overflow-y-auto transition-all duration-300 ${
             leftCollapsed ? 'w-12' : 'w-64'
           }`}
         >
           <div className="p-2">
             <Button
               variant="ghost"
               size="sm"
               onClick={() => setLeftCollapsed(!leftCollapsed)}
               className="w-full"
             >
               {leftCollapsed ? '→' : '←'}
             </Button>
           </div>
           {!leftCollapsed && leftPanel}
         </aside>

         {/* 中间画布区域 */}
         <main className="flex-1 overflow-auto p-8">
           <div className="max-w-4xl mx-auto">
             {canvas}
           </div>
         </main>

         {/* 右侧属性面板 */}
         <aside
           className={`bg-white border-l border-gray-200 overflow-y-auto transition-all duration-300 ${
             rightCollapsed ? 'w-12' : 'w-80'
           }`}
         >
           <div className="p-2">
             <Button
               variant="ghost"
               size="sm"
               onClick={() => setRightCollapsed(!rightCollapsed)}
               className="w-full"
             >
               {rightCollapsed ? '←' : '→'}
             </Button>
           </div>
           {!rightCollapsed && rightPanel}
         </aside>
       </div>
     )
   }
   ```

2. **测试响应式**：
   - 测试折叠/展开左侧面板
   - 测试折叠/展开右侧面板
   - 确保动画流畅

### 验收标准
- ✅ 左右面板可以折叠/展开
- ✅ 折叠动画流畅
- ✅ 画布区域自动适应宽度
- ✅ 布局在不同屏幕尺寸下正常显示

---

## 题目 1.5.4：添加工具栏组件

### 题目描述
在画布上方添加顶部工具栏，包含常用操作按钮。

### 具体要求

1. **创建工具栏组件**：
   创建 `src/components/builder/Toolbar.tsx`：
   ```typescript
   import React from 'react'
   import { Button, Container } from '@/components/ui'

   export const Toolbar: React.FC = () => {
     return (
       <div className="bg-white border-b border-gray-200 px-4 py-2">
         <Container direction="horizontal" spacing="md" justify="between" align="center">
           <Container direction="horizontal" spacing="md">
             <Button variant="outline" size="sm">撤销</Button>
             <Button variant="outline" size="sm">重做</Button>
           </Container>
           
           <Container direction="horizontal" spacing="md">
             <Button variant="outline" size="sm">预览</Button>
             <Button variant="primary" size="sm">保存</Button>
           </Container>
         </Container>
       </div>
     )
   }
   ```

2. **更新 Layout 组件**：
   更新 `src/components/builder/Layout.tsx`，添加工具栏：
   ```typescript
   import { Toolbar } from './Toolbar'

   export const BuilderLayout: React.FC<{...}> = ({...}) => {
     return (
       <div className="flex flex-col h-screen w-full bg-gray-100">
         {/* 顶部工具栏 */}
         <Toolbar />
         
         {/* 主体区域 */}
         <div className="flex flex-1 overflow-hidden">
           {/* 左侧、中间、右侧面板 */}
           ...
         </div>
       </div>
     )
   }
   ```

3. **测试工具栏**：
   - 工具栏固定在顶部
   - 按钮正常显示
   - 布局不溢出屏幕

### 验收标准
- ✅ Toolbar 组件创建成功
- ✅ 工具栏固定在页面顶部
- ✅ 布局结构调整正确（工具栏 + 主体区域）
- ✅ 页面正常显示，无滚动条溢出

---

## 题目 1.5.5：完善页面样式细节

### 题目描述
优化整体页面样式，提升用户体验。

### 具体要求

1. **更新全局样式**：
   更新 `src/index.css`，添加自定义样式：
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
     overflow: hidden; /* 防止整个页面滚动 */
   }

   /* 自定义滚动条样式 */
   ::-webkit-scrollbar {
     width: 8px;
     height: 8px;
   }

   ::-webkit-scrollbar-track {
     background: #f1f1f1;
   }

   ::-webkit-scrollbar-thumb {
     background: #888;
     border-radius: 4px;
   }

   ::-webkit-scrollbar-thumb:hover {
     background: #555;
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

2. **优化 Canvas 样式**：
   更新 `src/components/builder/Canvas/index.tsx`：
   ```typescript
   export const Canvas: React.FC = () => {
     return (
       <div className="min-h-[600px] bg-white rounded-lg shadow-lg border border-gray-200 p-8">
         <div className="flex items-center justify-center h-full min-h-[500px]">
           <Text variant="h3" weight="semibold" color="muted">
             拖拽组件到这里开始搭建
           </Text>
         </div>
       </div>
     )
   }
   ```

3. **最终测试**：
   - 运行 `npm run dev`
   - 检查整体布局
   - 检查滚动条样式
   - 检查各面板样式

### 验收标准
- ✅ 全局样式优化完成
- ✅ 自定义滚动条样式生效
- ✅ Canvas 区域样式美观
- ✅ 整体页面布局协调
- ✅ 项目正常启动无报错

---

## 模块 1.5 总结

本模块共 5 道题目，完成以下内容：
1. ✅ 安装并配置 React Router
2. ✅ 实现主页面布局框架（三栏布局）
3. ✅ 实现响应式布局优化（折叠面板）
4. ✅ 添加工具栏组件
5. ✅ 完善页面样式细节

**前置条件**：模块 1.3（基础组件库搭建）  
**后续依赖**：模块 1.5（页面布局与样式优化）或模块 2.1（组件协议设计）
