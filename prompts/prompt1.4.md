# 模块 1.4：页面布局与样式优化 - Prompt 集合

## 背景说明

当前项目已完成基础组件库搭建（Button、Text、Image、Container），但页面展示仍为简单的测试页面，缺乏低代码平台应有的专业界面。

本模块目标：将当前测试页面改造为完整的低代码搭建平台界面，包含：
- 顶部导航栏（包含项目名称、操作按钮）
- 左侧组件库面板
- 中间画布区域
- 右侧属性面板
- 整体响应式布局

---

## 题目 1.4.1：创建顶部导航栏组件（Header/Navbar）

### 题目描述

创建一个专业的顶部导航栏，包含项目名称、常用操作按钮（撤销、重做、预览、保存等）。

#### 1. 创建 Header 组件

创建 `src/components/builder/Header.tsx`：

```typescript
import React from 'react';
import { Button, Container } from '@/components/ui';

export const Header: React.FC = () => {
  return (
    <header className="h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between shadow-sm">
      {/* 左侧：项目名称和 Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">LC</span>
        </div>
        <h1 className="text-lg font-semibold text-gray-800">
          低代码搭建平台
        </h1>
      </div>

      {/* 中间：操作按钮组 */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" disabled>
          <span className="mr-1">↩</span> 撤销
        </Button>
        <Button variant="ghost" size="sm" disabled>
          <span className="mr-1">↪</span> 重做
        </Button>
      </div>

      {/* 右侧：预览和保存按钮 */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <span className="mr-1">👁</span> 预览
        </Button>
        <Button variant="primary" size="sm">
          <span className="mr-1">💾</span> 保存
        </Button>
      </div>
    </header>
  );
};
```

#### 2. 更新 App.tsx 使用 Header 组件

更新 `src/App.tsx`：

```typescript
import { DndContextProvider } from '@/components/builder/DndContext';
import { Header } from '@/components/builder/Header';

function App() {
  return (
    <DndContextProvider>
      <div className="h-screen w-screen flex flex-col bg-gray-50">
        {/* 顶部导航栏 */}
        <Header />
        
        {/* 主体内容区域（后续添加） */}
        <main className="flex-1 overflow-hidden">
          {/* TODO: 后续添加三栏布局 */}
        </main>
      </div>
    </DndContextProvider>
  );
}

export default App;
```

### 验收标准

- ✅ Header 组件创建成功
- ✅ 导航栏固定在顶部，高度 56px (h-14)
- ✅ 包含 Logo、项目名称、操作按钮
- ✅ 使用 flex 布局正确对齐（左侧、中间、右侧）
- ✅ 按钮有明确的视觉层次（ghost、outline、primary）
- ✅ 页面不出现横向滚动条
- ✅ 组件能够正常渲染

---

## 题目 1.4.2：创建左侧组件库面板（ComponentPanel）

### 题目描述

创建左侧组件库面板，按分类展示可用的基础组件，每个组件带有图标和名称。

### 具体要求

#### 1. 创建 ComponentPanel 组件

创建 `src/components/builder/ComponentPanel/index.tsx`：

```typescript
import React from 'react';
import { Text } from '@/components/ui';

interface ComponentItem {
  id: string;
  name: string;
  icon: string;
  category: string;
}

const components: ComponentItem[] = [
  // 基础组件
  { id: 'button', name: '按钮', icon: '🔘', category: '基础' },
  { id: 'text', name: '文本', icon: '📝', category: '基础' },
  { id: 'image', name: '图片', icon: '🖼️', category: '基础' },
  
  // 布局组件
  { id: 'container', name: '容器', icon: '📦', category: '布局' },
  { id: 'divider', name: '分割线', icon: '➖', category: '布局' },
  { id: 'spacer', name: '间距', icon: '↕️', category: '布局' },
  
  // 表单组件
  { id: 'input', name: '输入框', icon: '✏️', category: '表单' },
  { id: 'select', name: '下拉选择', icon: '📋', category: '表单' },
  { id: 'checkbox', name: '复选框', icon: '☑️', category: '表单' },
];

export const ComponentPanel: React.FC = () => {
  // 按分类分组
  const groupedComponents = components.reduce<Record<string, ComponentItem[]>>(
    (acc, comp) => {
      if (!acc[comp.category]) {
        acc[comp.category] = [];
      }
      acc[comp.category].push(comp);
      return acc;
    },
    {}
  );

  return (
    <aside className="h-full bg-white border-r border-gray-200 overflow-y-auto">
      {/* 面板标题 */}
      <div className="p-4 border-b border-gray-200">
        <Text variant="h4" weight="bold" color="default">
          组件库
        </Text>
      </div>

      {/* 组件列表 */}
      <div className="p-4 space-y-6">
        {Object.entries(groupedComponents).map(([category, items]) => (
          <div key={category}>
            <Text variant="caption" weight="medium" color="secondary" className="mb-3 uppercase">
              {category}
            </Text>
            <div className="grid grid-cols-2 gap-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col items-center justify-center p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-primary-50 hover:border-primary-300 transition-colors"
                >
                  <span className="text-2xl mb-2">{item.icon}</span>
                  <Text variant="caption" color="default">
                    {item.name}
                  </Text>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};
```

#### 2. 创建面板宽度配置常量

创建 `src/constants/layout.ts`：

```typescript
export const PANEL_WIDTHS = {
  left: 'w-64',      // 256px
  right: 'w-80',     // 320px
};
```

### 验收标准

- ✅ ComponentPanel 组件创建成功
- ✅ 组件按分类展示（基础、布局、表单）
- ✅ 每个组件项有图标和名称
- ✅ 使用 grid 布局（2列）展示组件
- ✅ 鼠标悬停有视觉反馈（背景色变化）
- ✅ 面板有固定宽度（64 = 256px）
- ✅ 面板内容可以滚动

---

## 题目 1.4.3：创建中间画布区域（Canvas）

### 题目描述

创建中间画布区域，作为用户拖拽组件的主要工作区，包含画布容器和空状态提示。

### 具体要求

#### 1. 创建 Canvas 组件

创建 `src/components/builder/Canvas/index.tsx`：

```typescript
import React from 'react';
import { Text, Button } from '@/components/ui';

export const Canvas: React.FC = () => {
  return (
    <main className="flex-1 bg-gray-100 overflow-auto p-8">
      {/* 画布容器 */}
      <div className="max-w-4xl mx-auto min-h-[600px]">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 min-h-[600px]">
          {/* 空状态提示 */}
          <div className="flex flex-col items-center justify-center h-full min-h-[600px] p-12">
            <div className="text-6xl mb-4">🎨</div>
            <Text variant="h3" weight="medium" color="secondary" className="mb-2">
              开始搭建你的页面
            </Text>
            <Text variant="body" color="secondary" className="mb-6 text-center">
              从左侧组件库拖拽组件到此处，
              <br />
              或点击组件添加到画布
            </Text>
            <Button variant="primary" size="md">
              添加第一个组件
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
};
```

#### 2. 更新 App.tsx 集成 Canvas

更新 `src/App.tsx`：

```typescript
import { DndContextProvider } from '@/components/builder/DndContext';
import { Header } from '@/components/builder/Header';
import { ComponentPanel } from '@/components/builder/ComponentPanel';
import { Canvas } from '@/components/builder/Canvas';
import { PANEL_WIDTHS } from '@/constants/layout';

function App() {
  return (
    <DndContextProvider>
      <div className="h-screen w-screen flex flex-col bg-gray-50">
        {/* 顶部导航栏 */}
        <Header />
        
        {/* 主体内容区域 */}
        <div className="flex flex-1 overflow-hidden">
          {/* 左侧组件库 */}
          <div className={`${PANEL_WIDTHS.left} flex-shrink-0`}>
            <ComponentPanel />
          </div>
          
          {/* 中间画布 */}
          <Canvas />
          
          {/* 右侧属性面板（占位） */}
          <div className={`${PANEL_WIDTHS.right} flex-shrink-0 bg-white border-l border-gray-200`}>
            {/* TODO: 后续添加 PropertyPanel */}
          </div>
        </div>
      </div>
    </DndContextProvider>
  );
}

export default App;
```

### 验收标准

- ✅ Canvas 组件创建成功
- ✅ 画布区域占据中间主要空间（flex-1）
- ✅ 画布有最大宽度限制（max-w-4xl）
- ✅ 画布背景为白色，有阴影和圆角
- ✅ 空状态提示美观，包含图标、文字和按钮
- ✅ 三栏布局正确显示（左 256px、中间自适应、右 320px）
- ✅ 页面不出现横向滚动条

---

## 题目 1.4.4：创建右侧属性面板（PropertyPanel）

### 题目描述

创建右侧属性面板，显示选中组件的属性配置选项（当前先实现占位界面）。

### 具体要求

#### 1. 创建 PropertyPanel 组件

创建 `src/components/builder/PropertyPanel/index.tsx`：

```typescript
import React from 'react';
import { Text } from '@/components/ui';

export const PropertyPanel: React.FC = () => {
  return (
    <aside className="h-full bg-white overflow-y-auto">
      {/* 面板标题 */}
      <div className="p-4 border-b border-gray-200">
        <Text variant="h4" weight="bold" color="default">
          属性配置
        </Text>
      </div>

      {/* 空状态 */}
      <div className="flex flex-col items-center justify-center h-[calc(100%-64px)] p-6">
        <div className="text-5xl mb-4">⚙️</div>
        <Text variant="body" weight="medium" color="secondary" className="text-center mb-2">
          未选中任何组件
        </Text>
        <Text variant="caption" color="secondary" className="text-center">
          点击画布中的组件以查看和编辑属性
        </Text>
      </div>
    </aside>
  );
};
```

#### 2. 更新 App.tsx 集成 PropertyPanel

更新 `src/App.tsx`，将占位 div 替换为 PropertyPanel 组件：

```typescript
import { PropertyPanel } from '@/components/builder/PropertyPanel';

// ... 在右侧面板位置使用
<div className={`${PANEL_WIDTHS.right} flex-shrink-0`}>
  <PropertyPanel />
</div>
```

### 验收标准

- ✅ PropertyPanel 组件创建成功
- ✅ 面板有标题和边框分隔
- ✅ 空状态提示清晰友好
- ✅ 面板宽度固定 320px
- ✅ 面板内容可以滚动
- ✅ 完整的三栏布局展示

---

## 题目 1.4.5：完善全局样式和细节优化

### 题目描述

优化全局样式，添加自定义滚动条、过渡动画、响应式优化等细节。

### 具体要求

#### 1. 更新全局样式

更新 `src/index.css`：

```css
@import "tailwindcss";

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
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
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

/* 画布拖拽放置区域样式 */
.canvas-drop-zone {
  @apply border-2 border-dashed border-primary-400 bg-primary-50 transition-colors;
}

/* 组件选中状态样式 */
.component-selected {
  @apply ring-2 ring-primary-500 ring-offset-2;
}

/* 过渡动画 */
.transition-panel {
  @apply transition-all duration-300 ease-in-out;
}
```

#### 2. 添加 Canvas 拖拽提示样式

更新 `src/components/builder/Canvas/index.tsx`，为画布添加拖拽提示边框：

```typescript
// 在画布容器 div 上添加类名
<div className="bg-white rounded-lg shadow-lg border-2 border-dashed border-gray-300 hover:border-primary-400 transition-colors min-h-[600px]">
```

#### 3. 添加面板折叠功能（可选增强）

在 `src/components/builder/Header.tsx` 中添加面板折叠按钮：

```typescript
// 添加状态
const [leftPanelVisible, setLeftPanelVisible] = useState(true);
const [rightPanelVisible, setRightPanelVisible] = useState(true);

// 添加折叠按钮
<Button 
  variant="ghost" 
  size="sm"
  onClick={() => setLeftPanelVisible(!leftPanelVisible)}
>
  {leftPanelVisible ? '◀' : '▶'}
</Button>
```

### 验收标准

- ✅ 自定义滚动条样式生效（窄滚动条、圆角）
- ✅ 画布有拖拽提示边框（虚线边框）
- ✅ 鼠标悬停画布时边框变色
- ✅ 页面无横向滚动条
- ✅ 所有面板都可以正常滚动
- ✅ 整体视觉效果专业、协调
- ✅ 项目正常启动无报错

---

## 题目 1.4.6：响应式布局适配（可选）

### 题目描述

为布局添加响应式支持，在小屏幕设备上优化显示。

### 具体要求

#### 1. 添加响应式断点

在 `src/components/builder/Canvas/index.tsx` 中根据屏幕宽度调整画布边距：

```typescript
// TailwindCSS 响应式类名示例
<div className="p-4 md:p-6 lg:p-8">
```

#### 2. 移动端隐藏侧边栏

在小屏幕上默认隐藏左右面板，通过按钮切换显示：

```typescript
// 使用 Tailwind 响应式类
<aside className="hidden lg:block w-64">
  <ComponentPanel />
</aside>
```

#### 3. 添加工具栏菜单按钮

在 Header 中添加移动端菜单切换按钮：

```typescript
<Button variant="ghost" size="sm" className="lg:hidden">
  ☰
</Button>
```

### 验收标准

- ✅ 大屏（≥1024px）：完整三栏布局
- ✅ 中屏（768px-1023px）：隐藏右侧面板或缩小
- ✅ 小屏（<768px）：只显示画布，通过按钮切换面板
- ✅ 响应式切换流畅
- ✅ 各断点下布局协调

---

## 模块 1.4 总结

本模块共 6 道题目，完成以下内容：

1. ✅ 创建顶部导航栏（Header）
2. ✅ 创建左侧组件库面板（ComponentPanel）
3. ✅ 创建中间画布区域（Canvas）
4. ✅ 创建右侧属性面板（PropertyPanel）
5. ✅ 完善全局样式和细节优化
6. ✅ 响应式布局适配（可选）

**预期效果**：
- 专业的低代码平台界面
- 清晰的三栏布局（组件库、画布、属性面板）
- 顶部导航栏包含常用操作
- 美观的视觉设计和交互反馈
- 完善的滚动条和过渡动画

**前置条件**：模块 1.3（基础组件库搭建）  
**后续依赖**：模块 2.1（组件协议设计）或模块 3.1（画布渲染器）

---

## 验收测试清单

完成所有题目后，请检查：

- [ ] 页面加载正常，无控制台错误
- [ ] 顶部导航栏显示正确（Logo、标题、按钮）
- [ ] 左侧组件库有分类展示（基础、布局、表单）
- [ ] 中间画布区域有空状态提示
- [ ] 右侧属性面板显示"未选中组件"提示
- [ ] 三栏布局比例协调（256px : 自适应 : 320px）
- [ ] 滚动条样式统一且美观
- [ ] 所有面板内容可正常滚动
- [ ] 鼠标悬停组件项有视觉反馈
- [ ] 页面整体视觉效果专业、协调
- [ ] 无横向滚动条
- [ ] 响应式断点切换正常（如实现）
