# 模块 1.3：基础组件库搭建 - Prompt 集合

## 题目 1.3.1：实现 Button 基础组件

### 题目描述
创建一个可复用的 Button 组件，支持多种样式变体和尺寸。

### 具体要求

1. **创建 Button 组件**：
   创建 `src/components/ui/Button.tsx`：
   ```typescript
   import React from 'react'
   import { cn } from '@/utils/classname'

   interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
     variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
     size?: 'sm' | 'md' | 'lg'
     children: React.ReactNode
   }

   export const Button: React.FC<ButtonProps> = ({
     variant = 'primary',
     size = 'md',
     children,
     className,
     ...props
   }) => {
     const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'
     
     const variants = {
       primary: 'bg-primary-600 text-white hover:bg-primary-700',
       secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
       outline: 'border border-gray-300 bg-transparent hover:bg-gray-100',
       ghost: 'hover:bg-gray-100',
     }

     const sizes = {
       sm: 'h-8 px-3 text-sm',
       md: 'h-10 px-4 text-base',
       lg: 'h-12 px-6 text-lg',
     }

     return (
       <button
         className={cn(baseStyles, variants[variant], sizes[size], className)}
         {...props}
       >
         {children}
       </button>
     )
   }
   ```

2. **创建组件导出文件**：
   创建 `src/components/ui/index.ts`：
   ```typescript
   export { Button } from './Button'
   ```

3. **测试组件**：
   更新 `App.tsx`，测试 Button 组件：
   ```typescript
   import { Button } from '@/components/ui'

   function App() {
     return (
       <div className="min-h-screen bg-gray-50 p-8">
         <h1 className="text-3xl font-bold text-primary-600 mb-8">
           {import.meta.env.VITE_APP_TITLE}
         </h1>
         <div className="space-x-4">
           <Button variant="primary" size="md">Primary</Button>
           <Button variant="secondary" size="md">Secondary</Button>
           <Button variant="outline" size="md">Outline</Button>
         </div>
       </div>
     )
   }

   export default App
   ```

### 验收标准
- ✅ Button 组件创建成功
- ✅ 支持 4 种 variant 变体
- ✅ 支持 3 种 size 尺寸
- ✅ 使用 `cn` 工具函数合并类名
- ✅ 组件能够正常渲染

---

## 题目 1.3.2：实现 Text 文本组件

### 题目描述
创建一个可配置的 Text 文本组件，支持多种文本样式。

### 具体要求

1. **创建 Text 组件**：
   创建 `src/components/ui/Text.tsx`：
   ```typescript
   import React from 'react'
   import { cn } from '@/utils/classname'

   interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
     variant?: 'h1' | 'h2' | 'h3' | 'body' | 'small' | 'caption'
     weight?: 'normal' | 'medium' | 'semibold' | 'bold'
     color?: 'default' | 'primary' | 'secondary' | 'muted' | 'error'
     children: React.ReactNode
   }

   export const Text: React.FC<TextProps> = ({
     variant = 'body',
     weight = 'normal',
     color = 'default',
     children,
     className,
     ...props
   }) => {
     const variants = {
       h1: 'text-4xl',
       h2: 'text-3xl',
       h3: 'text-2xl',
       body: 'text-base',
       small: 'text-sm',
       caption: 'text-xs',
     }

     const weights = {
       normal: 'font-normal',
       medium: 'font-medium',
       semibold: 'font-semibold',
       bold: 'font-bold',
     }

     const colors = {
       default: 'text-gray-900',
       primary: 'text-primary-600',
       secondary: 'text-gray-600',
       muted: 'text-gray-400',
       error: 'text-red-600',
     }

     const Tag = variant.startsWith('h') ? variant : 'p'

     return (
       <Tag
         className={cn(variants[variant], weights[weight], colors[color], className)}
         {...props}
       >
         {children}
       </Tag>
     )
   }
   ```

2. **更新导出文件**：
   更新 `src/components/ui/index.ts`：
   ```typescript
   export { Button } from './Button'
   export { Text } from './Text'
   ```

3. **测试组件**：
   在 `App.tsx` 中添加 Text 组件测试：
   ```typescript
   import { Button, Text } from '@/components/ui'

   function App() {
     return (
       <div className="min-h-screen bg-gray-50 p-8 space-y-6">
         <Text variant="h1" weight="bold" color="primary">
           {import.meta.env.VITE_APP_TITLE}
         </Text>
         <Text variant="body" color="secondary">
           这是一个文本组件示例
         </Text>
         <Button variant="primary">点击我</Button>
       </div>
     )
   }

   export default App
   ```

### 验收标准
- ✅ Text 组件创建成功
- ✅ 支持 6 种 variant 变体
- ✅ 支持 4 种 weight 字重
- ✅ 支持 5 种 color 颜色
- ✅ 组件能够正常渲染

---

## 题目 1.3.3：实现 Image 图片组件

### 题目描述
创建一个支持懒加载和错误处理的 Image 组件。

### 具体要求

1. **创建 Image 组件**：
   创建 `src/components/ui/Image.tsx`：
   ```typescript
   import React, { useState } from 'react'
   import { cn } from '@/utils/classname'

   interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
     src: string
     alt: string
     fallback?: string
     rounded?: boolean
   }

   export const Image: React.FC<ImageProps> = ({
     src,
     alt,
     fallback = '/placeholder.png',
     rounded = false,
     className,
     ...props
   }) => {
     const [error, setError] = useState(false)
     const [loading, setLoading] = useState(true)

     const handleError = () => {
       setError(true)
       setLoading(false)
     }

     const handleLoad = () => {
       setLoading(false)
     }

     return (
       <div className="relative inline-block">
         {loading && (
           <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
         )}
         <img
           src={error ? fallback : src}
           alt={alt}
           className={cn(
             'max-w-full h-auto',
             rounded && 'rounded-lg',
             className
           )}
           onError={handleError}
           onLoad={handleLoad}
           {...props}
         />
       </div>
     )
   }
   ```

2. **创建占位图**：
   在 `public` 文件夹中创建 `placeholder.png`（可以使用一个简单的灰色矩形图片）

3. **更新导出文件**：
   更新 `src/components/ui/index.ts`：
   ```typescript
   export { Button } from './Button'
   export { Text } from './Text'
   export { Image } from './Image'
   ```

4. **测试组件**：
   在 `App.tsx` 中添加 Image 组件测试

### 验收标准
- ✅ Image 组件创建成功
- ✅ 支持加载状态显示
- ✅ 支持错误处理和 fallback 图片
- ✅ 支持圆角选项
- ✅ 组件能够正常渲染

---

## 题目 1.3.4：实现 Container 容器组件

### 题目描述
创建一个布局容器组件，支持多种布局方式。

### 具体要求

1. **创建 Container 组件**：
   创建 `src/components/ui/Container.tsx`：
   ```typescript
   import React from 'react'
   import { cn } from '@/utils/classname'

   interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
     direction?: 'vertical' | 'horizontal'
     spacing?: 'none' | 'sm' | 'md' | 'lg'
     align?: 'start' | 'center' | 'end' | 'stretch'
     justify?: 'start' | 'center' | 'end' | 'between' | 'around'
     children: React.ReactNode
   }

   export const Container: React.FC<ContainerProps> = ({
     direction = 'vertical',
     spacing = 'md',
     align = 'stretch',
     justify = 'start',
     children,
     className,
     ...props
   }) => {
     const directions = {
       vertical: 'flex-col',
       horizontal: 'flex-row',
     }

     const spacings = {
       none: 'gap-0',
       sm: 'gap-2',
       md: 'gap-4',
       lg: 'gap-6',
     }

     const aligns = {
       start: 'items-start',
       center: 'items-center',
       end: 'items-end',
       stretch: 'items-stretch',
     }

     const justifies = {
       start: 'justify-start',
       center: 'justify-center',
       end: 'justify-end',
       between: 'justify-between',
       around: 'justify-around',
     }

     return (
       <div
         className={cn(
           'flex',
           directions[direction],
           spacings[spacing],
           aligns[align],
           justifies[justify],
           className
         )}
         {...props}
       >
         {children}
       </div>
     )
   }
   ```

2. **更新导出文件**：
   更新 `src/components/ui/index.ts`：
   ```typescript
   export { Button } from './Button'
   export { Text } from './Text'
   export { Image } from './Image'
   export { Container } from './Container'
   ```

3. **综合测试**：
   在 `App.tsx` 中组合使用所有组件：
   ```typescript
   import { Button, Text, Image, Container } from '@/components/ui'

   function App() {
     return (
       <div className="min-h-screen bg-gray-50 p-8">
         <Container spacing="lg" align="center">
           <Text variant="h1" weight="bold" color="primary">
             {import.meta.env.VITE_APP_TITLE}
           </Text>
           <Container direction="horizontal" spacing="md">
             <Button variant="primary">开始搭建</Button>
             <Button variant="outline">了解更多</Button>
           </Container>
         </Container>
       </div>
     )
   }

   export default App
   ```

### 验收标准
- ✅ Container 组件创建成功
- ✅ 支持方向和间距配置
- ✅ 支持对齐和justify配置
- ✅ 所有基础组件能够组合使用
- ✅ 页面布局正常渲染

---

## 模块 1.3 总结

本模块共 4 道题目，完成以下内容：
1. ✅ 实现 Button 基础组件
2. ✅ 实现 Text 文本组件
3. ✅ 实现 Image 图片组件
4. ✅ 实现 Container 容器组件

**前置条件**：模块 1.2（依赖安装与配置）  
**后续依赖**：模块 1.4（路由与页面布局）
