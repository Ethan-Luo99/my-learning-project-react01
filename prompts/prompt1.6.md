# 模块 1.6：基础交互功能实现 - Prompt 集合

## 背景说明

模块 1.4 已完成精美的页面布局，但当前所有按钮点击、拖拽等功能都是 `console.log` 占位。

本模块目标：使用 Mock 数据实现核心交互功能，包括：
- 从组件库拖拽/点击添加组件到画布
- 画布中组件的选中、删除、复制
- 撤销/重做功能
- 预览模式切换
- 数据保存/加载（localStorage）

---

## 题目 1.6.1：创建 Mock 数据与组件类型映射

### 题目描述

创建 Mock 数据和组件类型定义，为后续交互功能提供数据基础。

### 具体要求

#### 1. 定义组件类型枚举

创建 `src/types/component.ts`：

```typescript
export enum ComponentType {
  BUTTON = 'button',
  TEXT = 'text',
  IMAGE = 'image',
  CONTAINER = 'container',
  DIVIDER = 'divider',
  SPACER = 'spacer',
  INPUT = 'input',
  SELECT = 'select',
  CHECKBOX = 'checkbox',
}

export interface BaseComponent {
  id: string;
  type: ComponentType;
  name: string;
  props: Record<string, any>;
  styles: Record<string, string>;
}

export interface ButtonComponent extends BaseComponent {
  type: ComponentType.BUTTON;
  props: {
    text: string;
    variant: 'primary' | 'secondary' | 'outline' | 'ghost';
    size: 'sm' | 'md' | 'lg';
  };
}

export interface TextComponent extends BaseComponent {
  type: ComponentType.TEXT;
  props: {
    content: string;
    variant: 'h1' | 'h2' | 'h3' | 'body' | 'caption';
    weight: 'light' | 'normal' | 'medium' | 'bold';
    color: 'default' | 'primary' | 'secondary';
  };
}

export interface ImageComponent extends BaseComponent {
  type: ComponentType.IMAGE;
  props: {
    src: string;
    alt: string;
    rounded: boolean;
  };
}

export type ComponentSchema = BaseComponent | ButtonComponent | TextComponent | ImageComponent;
```

#### 2. 创建 Mock 数据

创建 `src/constants/mockData.ts`：

```typescript
import { ComponentType, ComponentSchema } from '@/types/component';
import { generateId } from '@/utils/id';

// 组件默认属性配置
export const DEFAULT_COMPONENT_PROPS: Record<ComponentType, any> = {
  [ComponentType.BUTTON]: {
    text: '按钮',
    variant: 'primary',
    size: 'md',
  },
  [ComponentType.TEXT]: {
    content: '这是一段文本',
    variant: 'body',
    weight: 'normal',
    color: 'default',
  },
  [ComponentType.IMAGE]: {
    src: '/placeholder.svg',
    alt: '图片',
    rounded: true,
  },
  [ComponentType.CONTAINER]: {
    direction: 'column',
    gap: 'md',
    padding: 'md',
  },
  [ComponentType.DIVIDER]: {},
  [ComponentType.SPACER]: {
    height: '32px',
  },
  [ComponentType.INPUT]: {
    placeholder: '请输入',
    type: 'text',
  },
  [ComponentType.SELECT]: {
    options: ['选项1', '选项2', '选项3'],
    placeholder: '请选择',
  },
  [ComponentType.CHECKBOX]: {
    label: '复选框',
    checked: false,
  },
};

// Mock 画布数据
export const MOCK_CANVAS_DATA: ComponentSchema[] = [
  {
    id: generateId('comp'),
    type: ComponentType.TEXT,
    name: '标题文本',
    props: {
      content: '欢迎使用低代码搭建平台',
      variant: 'h1',
      weight: 'bold',
      color: 'primary',
    },
    styles: {
      textAlign: 'center',
      marginBottom: '16px',
    },
  },
  {
    id: generateId('comp'),
    type: ComponentType.TEXT,
    name: '描述文本',
    props: {
      content: '从左侧组件库拖拽组件到此处，开始搭建您的页面',
      variant: 'body',
      weight: 'normal',
      color: 'secondary',
    },
    styles: {
      textAlign: 'center',
      marginBottom: '24px',
    },
  },
  {
    id: generateId('comp'),
    type: ComponentType.BUTTON,
    name: '开始按钮',
    props: {
      text: '开始搭建',
      variant: 'primary',
      size: 'md',
    },
    styles: {
      display: 'block',
      margin: '0 auto',
    },
  },
];
```

#### 3. 更新 Store 类型定义

更新 `src/store/useBuilderStore.ts`，导入新的类型：

```typescript
import { ComponentSchema } from '@/types/component';

// 修改 ComponentSchema 接口为从 types 导入
// 保留原有的操作函数
```

### 验收标准

- ✅ `ComponentType` 枚举定义完整
- ✅ 各组件类型接口定义清晰
- ✅ Mock 数据包含至少 3 个不同类型的组件
- ✅ 默认属性配置完整
- ✅ TypeScript 类型检查通过

---

## 题目 1.6.2：实现组件库点击添加功能

### 题目描述

实现点击左侧组件库中的组件，自动添加到画布末尾的功能。

### 具体要求

#### 1. 更新 ComponentPanel 添加点击事件

更新 `src/components/builder/ComponentPanel/index.tsx`：

```typescript
interface ComponentPanelProps {
  className?: string;
  onAddComponent: (type: ComponentType) => void; // 新增
}

// 在组件项的 onClick 中调用
onClick={() => {
  const type = component.id as ComponentType;
  onAddComponent(type);
}}
```

#### 2. 在 App.tsx 中实现添加逻辑

更新 `src/App.tsx`：

```typescript
import { useBuilderStore } from '@/store/useBuilderStore';
import { ComponentType, DEFAULT_COMPONENT_PROPS } from '@/types/component';
import { generateId } from '@/utils/id';

function App() {
  const { addComponent } = useBuilderStore();

  const handleAddComponent = (type: ComponentType) => {
    const newComponent = {
      id: generateId('comp'),
      type,
      name: getComponentName(type),
      props: DEFAULT_COMPONENT_PROPS[type],
      styles: {},
    };
    addComponent(newComponent);
  };

  const getComponentName = (type: ComponentType): string => {
    const names: Record<ComponentType, string> = {
      [ComponentType.BUTTON]: '按钮',
      [ComponentType.TEXT]: '文本',
      [ComponentType.IMAGE]: '图片',
      [ComponentType.CONTAINER]: '容器',
      [ComponentType.DIVIDER]: '分割线',
      [ComponentType.SPACER]: '间距',
      [ComponentType.INPUT]: '输入框',
      [ComponentType.SELECT]: '下拉选择',
      [ComponentType.CHECKBOX]: '复选框',
    };
    return names[type];
  };

  // ... 其他代码
}
```

#### 3. 验证添加功能

- 点击左侧组件库任意组件
- 画布中应该出现对应组件的占位显示
- Zustand store 中的 `components` 数组应该增加

### 验收标准

- ✅ 点击组件库项能触发添加
- ✅ 新组件使用正确的默认属性
- ✅ 新组件生成唯一 ID
- ✅ Store 状态正确更新
- ✅ 画布能响应新组件的添加

---

## 题目 1.6.3：实现画布组件选中与删除

### 题目描述

实现点击画布中的组件选中它，并在右侧属性面板显示删除按钮功能。

### 具体要求

#### 1. 更新 Canvas 组件支持点击选中

更新 `src/components/builder/Canvas/index.tsx`：

```typescript
interface CanvasProps {
  components: ComponentSchema[];
  selectedId: string | null;
  onSelectComponent: (id: string) => void;
  // ... 其他 props
}

// 在组件渲染部分
{components.map((component) => (
  <div
    key={component.id}
    onClick={() => onSelectComponent(component.id)}
    className={cn(
      'p-4 bg-gray-50 rounded-lg border-2 cursor-pointer transition-all',
      selectedId === component.id
        ? 'border-primary-500 bg-primary-50'
        : 'border-transparent hover:border-gray-200'
    )}
  >
    <div className="text-sm font-medium text-gray-700 mb-1">
      {component.name}
    </div>
    <div className="text-xs text-gray-500">
      类型: {component.type}
    </div>
    {/* TODO: 后续根据 type 渲染实际组件 */}
  </div>
))}
```

#### 2. 在 App.tsx 中连接选中逻辑

更新 `src/App.tsx`：

```typescript
const { components, selectedComponentId, setSelectedComponentId, removeComponent } = useBuilderStore();

const handleSelectComponent = (id: string) => {
  setSelectedComponentId(id);
};

const handleDeleteComponent = (id: string) => {
  removeComponent(id);
  setSelectedComponentId(null); // 删除后清除选中状态
};

// 传递给 Canvas
<Canvas
  components={components}
  selectedId={selectedComponentId}
  onSelectComponent={handleSelectComponent}
  onEmptyAction={handleEmptyAction}
/>

// 传递给 PropertyPanel
<PropertyPanel
  selectedComponent={selectedComponentId ? components.find(c => c.id === selectedComponentId) : null}
  onDeleteComponent={handleDeleteComponent}
  onDuplicateComponent={handleDuplicateComponent}
/>
```

#### 3. 更新 PropertyPanel 显示真实数据

更新 `src/components/builder/PropertyPanel/index.tsx`：

```typescript
import { ComponentSchema } from '@/types/component';

interface PropertyPanelProps {
  selectedComponent: ComponentSchema | null;
  onDeleteComponent: (id: string) => void;
  // ...
}

// 显示真实的组件信息
<span className="text-sm font-medium text-gray-700">
  {selectedComponent?.name}
</span>
<span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded">
  类型: {selectedComponent?.type}
</span>
```

### 验收标准

- ✅ 点击画布组件能选中（高亮边框）
- ✅ 右侧面板显示选中组件的真实信息
- ✅ 点击删除按钮能删除组件
- ✅ 删除后自动清除选中状态
- ✅ 选中状态切换流畅

---

## 题目 1.6.4：实现组件复制功能

### 题目描述

实现复制选中组件的功能，新组件 ID 不同但属性相同。

### 具体要求

#### 1. 在 Store 中添加复制方法

更新 `src/store/useBuilderStore.ts`：

```typescript
interface BuilderState {
  // ... 现有接口
  duplicateComponent: (id: string) => void;
}

// 在 create 中添加
duplicateComponent: (id) =>
  set((state) => {
    const component = findComponentById(state.components, id);
    if (!component) return state;

    const duplicatedComponent = {
      ...component,
      id: generateId('comp'),
      name: `${component.name} (复制)`,
    };

    return {
      components: insertAfterComponent(state.components, id, duplicatedComponent),
    };
  }, false, { type: 'duplicateComponent', id }),
```

#### 2. 实现辅助函数

```typescript
const findComponentById = (
  components: ComponentSchema[],
  id: string
): ComponentSchema | null => {
  for (const comp of components) {
    if (comp.id === id) return comp;
  }
  return null;
};

const insertAfterComponent = (
  components: ComponentSchema[],
  targetId: string,
  newComponent: ComponentSchema
): ComponentSchema[] => {
  const index = components.findIndex((c) => c.id === targetId);
  if (index === -1) return [...components, newComponent];
  
  const newComponents = [...components];
  newComponents.splice(index + 1, 0, newComponent);
  return newComponents;
};
```

#### 3. 在 App.tsx 中连接

```typescript
const { duplicateComponent } = useBuilderStore();

const handleDuplicateComponent = (id: string) => {
  duplicateComponent(id);
};
```

### 验收标准

- ✅ 点击复制按钮能复制组件
- ✅ 新组件 ID 不同
- ✅ 新组件名称带"(复制)"后缀
- ✅ 新组件插入到原组件后面
- ✅ 复制后保持原组件选中状态

---

## 题目 1.6.5：实现撤销/重做功能

### 题目描述

实现简单的撤销/重做功能，基于历史快照。

### 具体要求

#### 1. 在 Store 中添加历史记录

更新 `src/store/useBuilderStore.ts`：

```typescript
interface BuilderState {
  // ... 现有接口
  history: ComponentSchema[][];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  
  undo: () => void;
  redo: () => void;
}

// 修改现有的修改操作，添加历史记录
const addToHistory = (state: any, newComponents: ComponentSchema[]) => {
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(newComponents);
  
  // 限制历史记录数量为 50
  if (newHistory.length > 50) {
    newHistory.shift();
  }
  
  return {
    components: newComponents,
    history: newHistory,
    historyIndex: newHistory.length - 1,
    canUndo: newHistory.length > 1,
    canRedo: false,
  };
};

// 示例：修改 addComponent
addComponent: (component) =>
  set((state) => {
    const newComponents = [...state.components, component];
    return addToHistory(state, newComponents);
  }, false, { type: 'addComponent' }),

// 撤销
undo: () =>
  set((state) => {
    if (state.historyIndex <= 0) return state;
    
    const newIndex = state.historyIndex - 1;
    return {
      components: state.history[newIndex],
      historyIndex: newIndex,
      canUndo: newIndex > 0,
      canRedo: true,
    };
  }, false, { type: 'undo' }),

// 重做
redo: () =>
  set((state) => {
    if (state.historyIndex >= state.history.length - 1) return state;
    
    const newIndex = state.historyIndex + 1;
    return {
      components: state.history[newIndex],
      historyIndex: newIndex,
      canUndo: true,
      canRedo: newIndex < state.history.length - 1,
    };
  }, false, { type: 'redo' }),
```

#### 2. 在 App.tsx 中连接

```typescript
const { undo, redo, canUndo, canRedo } = useBuilderStore();

const handleUndo = () => {
  undo();
};

const handleRedo = () => {
  redo();
};

// 传递给 Header
<Header
  onUndo={handleUndo}
  onRedo={handleRedo}
  // 可以传递 canUndo/canRedo 来控制按钮 disabled 状态
/>
```

#### 3. 更新 Header 支持 disabled 状态

更新 `src/components/builder/Header.tsx`：

```typescript
interface HeaderProps {
  // ... 现有 props
  canUndo?: boolean;
  canRedo?: boolean;
}

// 在按钮上添加 disabled
<Button
  variant="ghost"
  size="sm"
  onClick={onUndo}
  disabled={!canUndo}
  className={cn(!canUndo && 'opacity-50 cursor-not-allowed')}
>
  <UndoIcon />
  <span>撤销</span>
</Button>
```

### 验收标准

- ✅ 每次修改组件都记录到历史
- ✅ 点击撤销能回到上一步
- ✅ 点击重做能前进到下一步
- ✅ 撤销/重做按钮状态正确（disabled）
- ✅ 历史记录限制在 50 步内

---

## 题目 1.6.6：实现预览模式切换

### 题目描述

实现预览模式，隐藏编辑辅助线，禁用编辑功能。

### 具体要求

#### 1. 在 Store 中添加预览状态

更新 `src/store/useBuilderStore.ts`：

```typescript
interface BuilderState {
  // ... 现有接口
  isPreviewMode: boolean;
  togglePreviewMode: () => void;
}

// 在 create 中添加
isPreviewMode: false,
togglePreviewMode: () =>
  set((state) => ({ isPreviewMode: !state.isPreviewMode }), false, {
    type: 'togglePreviewMode',
  }),
```

#### 2. 在 App.tsx 中实现切换

```typescript
const { isPreviewMode, togglePreviewMode } = useBuilderStore();

const handlePreview = () => {
  togglePreviewMode();
};

// 传递给 Header
<Header onPreview={handlePreview} />

// 根据预览模式隐藏/显示面板
{!isPreviewMode && (
  <>
    <ComponentPanel ... />
    <PropertyPanel ... />
  </>
)}

// Canvas 根据预览模式调整样式
<Canvas
  isPreview={isPreviewMode}
  // ...
/>
```

#### 3. 更新 Canvas 支持预览模式

更新 `src/components/builder/Canvas/index.tsx`：

```typescript
interface CanvasProps {
  isPreview?: boolean;
  // ...
}

// 预览模式下隐藏选中边框和虚线边框
className={cn(
  'bg-white rounded-lg shadow-lg min-h-[600px] p-6',
  !isPreview && 'border-2 border-dashed border-gray-300 hover:border-primary-400',
  isPreview && 'cursor-default'
)}
```

### 验收标准

- ✅ 点击预览按钮切换预览模式
- ✅ 预览模式下隐藏左右面板
- ✅ 预览模式下画布无编辑辅助线
- ✅ 再次点击退出预览模式
- ✅ 预览模式下无法选中/编辑组件

---

## 题目 1.6.7：实现数据持久化（localStorage）

### 题目描述

实现画布数据的自动保存和加载。

### 具体要求

#### 1. 在 Store 中添加持久化

更新 `src/store/useBuilderStore.ts`：

```typescript
import { persist } from 'zustand/middleware';

export const useBuilderStore = create<BuilderState>()(
  persist(
    (set, get) => ({
      // ... 现有状态和操作
    }),
    {
      name: 'builder-storage', // localStorage key
      partialize: (state) => ({
        components: state.components,
        // 不保存选中状态和历史记录
      }),
    }
  )
);
```

#### 2. 手动保存/加载功能

在 App.tsx 中添加：

```typescript
const handleSave = () => {
  // Zustand persist 会自动保存
  // 这里可以添加额外的保存逻辑，比如显示保存成功提示
  console.log('数据已保存到 localStorage');
};

const handleLoad = () => {
  // 从 localStorage 加载
  const savedData = localStorage.getItem('builder-storage');
  if (savedData) {
    const { state } = JSON.parse(savedData);
    setComponents(state.components);
  }
};
```

### 验收标准

- ✅ 刷新页面后画布数据保留
- ✅ 添加/删除组件后自动保存
- ✅ localStorage 中有正确的数据
- ✅ 数据结构完整（包含 id、type、props、styles）

---

## 模块 1.6 总结

本模块共 7 道题目，完成以下内容：

1. ✅ 创建 Mock 数据与组件类型映射
2. ✅ 实现组件库点击添加功能
3. ✅ 实现画布组件选中与删除
4. ✅ 实现组件复制功能
5. ✅ 实现撤销/重做功能
6. ✅ 实现预览模式切换
7. ✅ 实现数据持久化

**预期效果**：
- 完整的交互流程：添加 → 选中 → 编辑 → 删除 → 撤销 → 保存
- 流畅的用户体验
- 数据不会因刷新丢失

**前置条件**：模块 1.4（页面布局与样式优化）  
**后续依赖**：模块 3.1（画布渲染器 - 实际渲染组件而非占位）

---

## 验收测试清单

完成所有题目后，请按以下步骤测试：

- [ ] 点击左侧组件库"按钮"，画布中出现按钮占位
- [ ] 继续添加多个组件，画布中依次显示
- [ ] 点击画布中的组件，出现高亮边框
- [ ] 右侧属性面板显示选中组件的名称和类型
- [ ] 点击删除按钮，组件从画布消失
- [ ] 点击复制按钮，原组件后面出现复制品
- [ ] 添加 3 个组件后，点击撤销 2 次，只剩 1 个
- [ ] 点击重做 1 次，恢复到 2 个组件
- [ ] 点击预览按钮，左右面板隐藏，画布无编辑边框
- [ ] 再次点击预览按钮，恢复正常编辑模式
- [ ] 刷新页面，画布数据依然存在
- [ ] 打开浏览器 DevTools → Application → localStorage，能看到保存的数据
