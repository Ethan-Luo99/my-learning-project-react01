# Zustand 基本使用指南

## 一、什么是 Zustand？

Zustand 是 React 生态中一个轻量级的状态管理库。与 Vue 生态中的 Pinia 类似，它的主要作用是：

- **跨组件共享状态**：让多个组件能够访问和修改同一个状态
- **简化状态管理**：比 React 原生的 Context API 更简单易用
- **提高开发效率**：减少 props 层层传递（也就是 Vue 开发者熟悉的"props 钻取"问题）

## 二、安装 Zustand

在项目根目录下运行：

```bash
npm install zustand
```

这会将 zustand 添加到项目的依赖中。

## 三、创建 Store 的基本步骤

### 1. 什么是 Store？

Store 可以理解为一个**全局状态容器**，类似于 Vue 中的 Pinia store。它包含：
- **状态（State）**：要共享的数据
- **方法（Actions）**：用来修改状态的函数

### 2. 创建 Store 文件

在当前项目中，我们创建了 `src/store/useBuilderStore.ts` 文件。让我逐行解释：

#### 第 1 行：导入 create 函数
```typescript
import { create } from 'zustand';
```

- `create` 是 zustand 提供的核心函数
- 用它来创建一个 store（状态容器）
- 类似 Vue 中的 `defineStore` 函数

#### 第 3-6 行：定义 TypeScript 接口
```typescript
interface BuilderState {
  title: string;
  setTitle: (title: string) => void;
}
```

- `interface` 是 TypeScript 中定义类型的方式
- `BuilderState` 定义了这个 store 包含哪些内容：
  - `title: string`：一个字符串类型的状态，用来存储标题
  - `setTitle: (title: string) => void`：一个函数类型的方法，用来更新标题
- 这个接口的作用是：**让 TypeScript 知道我们的 store 里有什么，提供类型提示和错误检查**

#### 第 8-11 行：创建 Store
```typescript
export const useBuilderStore = create<BuilderState>((set) => ({
  title: 'React + Zustand 示例',
  setTitle: (title) => set({ title }),
}));
```

让我逐部分解释：

**`export const useBuilderStore =`**
- `export`：让其他文件可以导入这个 store
- `const useBuilderStore`：定义一个常量，命名以 `use` 开头，这是 React Hooks 的命名规范

**`create<BuilderState>(...)`**
- `create`：调用 zustand 的 create 函数
- `<BuilderState>`：这是 TypeScript 的泛型语法，告诉 create 函数我们的 store 类型是什么
- 传入一个回调函数 `(set) => ({ ... })`

**回调函数的参数 `set`**
- `set` 是 zustand 提供的一个函数
- 用它来修改 store 中的状态
- 类似 Vuex 中的 `commit` 或 Pinia 中的直接修改

**回调函数返回的对象**
```typescript
{
  title: 'React + Zustand 示例',  // 状态的初始值
  setTitle: (title) => set({ title }),  // 修改状态的方法
}
```

- `title: 'React + Zustand 示例'`：定义了 `title` 状态的初始值
- `setTitle: (title) => set({ title })`：定义了修改 `title` 的方法
  - 接收一个参数 `title`（新的标题值）
  - 调用 `set({ title })` 来更新状态
  - `set({ title })` 是 `set({ title: title })` 的简写（ES6 对象属性简写）

## 四、在组件中使用 Store

创建好 store 后，如何在 React 组件中使用呢？让我们看 `App.tsx` 中的代码：

### 第 1 行：导入 store
```typescript
import { useBuilderStore } from './store/useBuilderStore';
```

- 从 store 文件中导入 `useBuilderStore`
- 这是一个 React Hook，所以命名以 `use` 开头

### 第 4 行：使用 store
```typescript
const { title, setTitle } = useBuilderStore();
```

- `useBuilderStore()`：调用这个 Hook，获取整个 store 的内容
- `{ title, setTitle }`：使用 ES6 的对象解构语法，从 store 中提取我们需要的状态和方法
- 类似 Vue 中从 Pinia store 解构 `state` 和 `actions`

### 第 6-8 行：使用状态和方法
```typescript
const handleClick = () => {
  setTitle(title === 'React + Zustand 示例' ? 'Zustand 状态已更新！' : 'React + Zustand 示例');
};
```

- `handleClick`：定义一个点击事件处理函数
- `setTitle(...)`：调用 store 中的方法来更新状态
- `title === ... ? ... : ...`：三元表达式，判断当前 title 的值，切换到另一个值
- 这就实现了"点击按钮切换标题"的功能

### 第 13-15 行：在 JSX 中使用状态
```jsx
<h1 className="text-3xl font-bold text-primary-600 mb-4">
  {title}
</h1>
```

- `{title}`：在 JSX 中使用花括号 `{}` 来插入 JavaScript 表达式
- 这里显示 store 中的 `title` 状态
- 当 `title` 改变时，这个 h1 标签的内容会自动更新

### 第 20-23 行：绑定点击事件
```jsx
<button 
  onClick={handleClick}
  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
>
  更新状态
</button>
```

- `onClick={handleClick}`：给按钮绑定点击事件
- 当用户点击这个按钮时，会执行 `handleClick` 函数
- 类似 Vue 中的 `@click="handleClick"`

## 五、完整的使用流程总结

1. **安装**：`npm install zustand`
2. **创建 Store**：
   - 导入 `create` 函数
   - 定义 TypeScript 接口（可选但推荐）
   - 调用 `create` 函数创建 store，包含初始状态和修改方法
3. **在组件中使用**：
   - 导入 store
   - 调用 `useBuilderStore()` 获取状态和方法
   - 在代码中使用状态，通过方法修改状态
   - 在 JSX 中显示状态，绑定事件

## 六、与 Vue 概念的初步对比

| React + Zustand | Vue + Pinia |
|----------------|-------------|
| `create` 函数 | `defineStore` 函数 |
| `useBuilderStore()` Hook | `useStore()` |
| `set` 函数修改状态 | 直接修改 state 或使用 actions |
| 解构 `{ title, setTitle }` | 解构 `{ title, setTitle }` |
| `onClick={handleClick}` | `@click="handleClick"` |
| `{title}` | `{{ title }}` |

下一篇文档 `study02.md` 会更详细地对比 Vue 与 React + Zustand 的概念差异，帮助你更好地理解为什么代码要这么写。
