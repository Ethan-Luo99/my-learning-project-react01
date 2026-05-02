# 预览模式架构设计文档

## 文档信息

| 项目 | 内容 |
|------|------|
| 文档版本 | v1.0 |
| 最后更新 | 2026-05-02 |
| 作者 | 开发团队 |
| 状态 | 稳定 |

---

## 目录

1. [概述](#1-概述)
2. [渲染策略设计](#2-渲染策略设计)
3. [事件隔离策略](#3-事件隔离策略)
4. [路由设计思路](#4-路由设计思路)
5. [数据共享机制](#5-数据共享机制)
6. [关键模块说明](#6-关键模块说明)

---

## 1. 概述

### 1.1 设计目标

预览模式的核心目标是：

1. **真实渲染**：让用户在不离开构建器的情况下查看页面的真实渲染效果
2. **交互模拟**：让按钮等组件具有真实的交互行为（点击、跳转等）
3. **数据复用**：与编辑模式共享同一份组件数据，无需重复保存
4. **状态隔离**：预览模式不影响编辑模式的状态，两个模式可以自由切换

### 1.2 设计原则

| 原则 | 说明 |
|------|------|
| **组件复用优先** | 尽可能复用编辑模式已有的渲染逻辑，避免重复开发 |
| **参数化控制差异** | 通过参数（props）控制编辑态和预览态的差异，而不是两套代码 |
| **单向数据流** | 数据只从 store 流向组件，预览模式不修改 store 数据 |
| **渐进式增强** | 编辑模式是基础，预览模式是增强的交互层 |

---

## 2. 渲染策略设计

### 2.1 为什么复用 ComponentRenderer？

#### 2.1.1 设计决策

预览模式采用了**复用 ComponentRenderer** 的策略，而不是单独编写一套渲染逻辑。主要原因：

| 原因 | 说明 |
|------|------|
| **减少维护成本** | 一套渲染逻辑，一处修改，两处生效 |
| **保证渲染一致性** | 编辑模式和预览模式渲染结果完全一致 |
| **降低 Bug 风险** | 避免两套逻辑可能产生的不一致问题 |
| **快速迭代** | 新增组件只需在 ComponentRenderer 中添加一次 |

#### 2.1.2 为什么不单独写预览渲染器？

如果单独编写预览渲染器，会面临以下问题：

```
问题 1: 代码重复
   - ComponentRenderer 有 Text/Button/Image/Container 四种渲染逻辑
   - PreviewRenderer 需要完全复制这四种逻辑
   - 未来新增组件时，需要在两处同时添加

问题 2: 同步困难
   - 修复一个渲染 Bug，需要在两处同时修改
   - 容易遗漏，导致编辑模式和预览模式表现不一致

问题 3: 测试成本
   - 两套逻辑需要分别测试
   - 增加测试用例数量和维护成本
```

### 2.2 PreviewRenderer 与 ComponentRenderer 的关系

#### 2.2.1 架构关系图

```
┌─────────────────────────────────────────────────────────────┐
│                      渲染层架构                               │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ 渲染基础组件
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                ComponentRenderer (核心渲染器)                 │
│                                                              │
│  职责:                                                        │
│  - 根据 type 渲染不同组件 (Text/Button/Image/Container)       │
│  - 递归渲染 Container 的子组件                                 │
│  - 通过 editable 参数控制编辑态/预览态                        │
│                                                              │
│  参数:                                                        │
│  - component: ComponentSchema  (组件数据)                     │
│  - isSelected: boolean        (是否选中，编辑态用)            │
│  - onClick: function          (点击回调，编辑态用)            │
│  - editable: boolean          (是否可编辑，关键控制参数)       │
│                                                              │
│  导出: ✅ 可直接在编辑模式中使用                               │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ 作为基础
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                PreviewRenderer (预览快捷方式)                 │
│                                                              │
│  本质: ComponentRenderer 的一个特化调用                       │
│  职责: 提供预览模式的默认参数                                  │
│                                                              │
│  实现方式:                                                    │
│  const PreviewRenderer = ({ component }) => (                │
│    <ComponentRenderer                                         │
│      component={component}                                    │
│      isSelected={false}        // 预览态不显示选中高亮        │
│      onClick={undefined}       // 预览态不触发编辑点击事件    │
│      editable={false}          // 关键：禁用编辑态            │
│    />                                                          │
│  );                                                           │
│                                                              │
│  导出: ✅ 可直接在预览模式中使用                               │
└─────────────────────────────────────────────────────────────┘
```

#### 2.2.2 关键代码

```typescript
// src/components/builder/ComponentRenderer/index.tsx

// 核心渲染器
const ComponentRenderer: React.FC<ComponentRendererProps> = ({
  component,
  isSelected = false,    // 默认: 不选中
  onClick,                 // 默认: undefined
  editable = true,         // 默认: 可编辑
}) => {
  // ... 渲染逻辑
};

// 预览快捷方式
const PreviewRenderer: React.FC<Omit<ComponentRendererProps, 'isSelected' | 'onClick' | 'editable'>> = ({
  component,
}) => {
  return (
    <ComponentRenderer
      component={component}
      isSelected={false}      // 强制不选中
      onClick={undefined}     // 强制无编辑点击
      editable={false}        // 强制不可编辑
    />
  );
};
```

### 2.3 如何通过参数控制编辑态/预览态

#### 2.3.1 editable 参数的影响

| 特性 | editable=true (编辑态) | editable=false (预览态) |
|------|----------------------|-----------------------|
| **选中高亮框** | 显示 `ring-2 ring-primary-500` | 不显示 |
| **点击选择事件** | 响应，选中组件 | 不响应，组件内部处理 |
| **pointer-events-none** | 添加，点击由 wrapper 处理 | 移除，组件可真正点击 |
| **交互行为** | 无（纯编辑模式） | 有（执行配置的事件） |

#### 2.3.2 样式差异控制

```typescript
// ComponentRenderer 中的样式控制

const wrapperClassName = cn(
  'relative',
  // 只有 editable=true 时才显示选中高亮框
  editable && isSelected && 'ring-2 ring-primary-500 ring-offset-2 rounded-lg'
);

// Button 组件的点击控制
const handlePreviewClick = (e: React.MouseEvent) => {
  if (editable) {
    // 编辑态：触发选中逻辑
    handleWrapperClick(e, onClick);
  } else {
    // 预览态：执行配置的事件
    executeClickEvent(component.events?.onClick);
  }
};

// CSS 类控制
className={cn(
  editable && 'pointer-events-none',  // 编辑态：禁止组件内部点击
  buttonClassName
)}
```

#### 2.3.3 Container 递归渲染的参数传递

Container 组件的子组件需要正确继承 editable 参数：

```typescript
const renderContainerChildren = () => {
  if (!isContainerComponent(component)) {
    return undefined;
  }
  const children = component.children;
  if (!children || children.length === 0) {
    return undefined;
  }
  return children.map((child) => (
    <ComponentRenderer
      key={child.id}
      component={child}
      // 关键：传递 editable 参数给子组件
      onClick={editable && onClick ? (e) => handleWrapperClick(e, onClick) : undefined}
      editable={editable}
    />
  ));
};
```

---

## 3. 事件隔离策略

### 3.1 为什么预览模式中按钮可点击而编辑模式中不可点击？

#### 3.1.1 设计考虑

编辑模式和预览模式的核心差异在于**点击目标**不同：

```
编辑模式:
  用户点击 Button → 目标是"选中这个组件进行编辑"
  问题: Button 本身有 onClick，如果不阻止，会同时触发按钮的默认行为

预览模式:
  用户点击 Button → 目标是"触发这个按钮的真实交互"
  问题: 需要让 Button 真正响应点击，执行配置的事件
```

#### 3.1.2 技术实现

通过 `pointer-events-none` CSS 类控制：

```typescript
// 编辑模式 (editable=true):
// - Button 添加 pointer-events-none
// - 点击事件由外层 wrapper 捕获，触发选中逻辑

// 预览模式 (editable=false):
// - Button 不添加 pointer-events-none
// - 点击事件由 Button 本身处理，执行配置的事件

className={cn(
  editable && 'pointer-events-none',  // 只有编辑态才禁用组件点击
  buttonClassName
)}
```

### 3.2 两个模式下事件处理如何区分

#### 3.2.1 事件处理流程图

```
┌─────────────────────────────────────────────────────────────┐
│                    点击事件处理流程                            │
└─────────────────────────────────────────────────────────────┘

用户点击 Button 组件
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  判断 editable 参数                                          │
│                                                              │
│  ┌─────────────────┐          ┌─────────────────┐          │
│  │  editable=true  │          │ editable=false  │          │
│  │   (编辑模式)     │          │   (预览模式)     │          │
│  └────────┬────────┘          └────────┬────────┘          │
│           │                            │                    │
│           ▼                            ▼                    │
│  ┌─────────────────┐          ┌─────────────────┐          │
│  │ pointer-events  │          │ pointer-events  │          │
│  │    = none       │          │    = auto       │          │
│  │ (组件不可点击)    │          │ (组件可点击)      │          │
│  └────────┬────────┘          └────────┬────────┘          │
│           │                            │                    │
│           ▼                            ▼                    │
│  ┌─────────────────┐          ┌─────────────────┐          │
│  │ 外层 wrapper 捕获 │          │ Button 本身捕获 │          │
│  │  onClick 回调    │          │ onClick 回调    │          │
│  └────────┬────────┘          └────────┬────────┘          │
│           │                            │                    │
│           ▼                            ▼                    │
│  ┌─────────────────┐          ┌─────────────────┐          │
│  │ 选中该组件       │          │ executeClickEvent│          │
│  │ (编辑逻辑)       │          │ 执行配置的事件   │          │
│  └─────────────────┘          └─────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

#### 3.2.2 核心代码对比

**编辑模式的事件处理**：

```typescript
// 编辑模式下，点击由外层 div 处理
<div
  className={wrapperClassName}
  onClick={editable ? handleClick : undefined}
>
  <Button
    // 关键：编辑模式下添加 pointer-events-none
    className={cn(editable && 'pointer-events-none', buttonClassName)}
    // 编辑模式下不添加 onClick
    {...restButtonProps}
  >
    {getButtonContent(component)}
  </Button>
</div>
```

**预览模式的事件处理**：

```typescript
// 预览模式下，点击由 Button 本身处理
<div
  className={wrapperClassName}
  onClick={undefined}  // 预览模式下外层不处理
>
  <Button
    // 关键：预览模式下不添加 pointer-events-none
    className={buttonClassName}
    // 预览模式下添加 onClick
    onClick={handlePreviewClick}
    {...restButtonProps}
  >
    {getButtonContent(component)}
  </Button>
</div>
```

### 3.3 executeClickEvent 事件执行器

#### 3.3.1 支持的事件类型

```typescript
enum ClickEventType {
  None = 'none',           // 无事件
  Alert = 'alert',          // 弹窗提示
  NavigateUrl = 'navigate_url', // 跳转到 URL
  CustomCode = 'custom_code',   // 自定义代码
}
```

#### 3.3.2 事件执行逻辑

```typescript
const executeClickEvent = (eventConfig?: ClickEventConfig): void => {
  if (!eventConfig || eventConfig.type === ClickEventType.None) {
    return;
  }

  switch (eventConfig.type) {
    case ClickEventType.Alert:
      // 弹窗提示
      if (eventConfig.alertMessage) {
        alert(eventConfig.alertMessage);
      } else {
        alert('按钮被点击了');
      }
      break;

    case ClickEventType.NavigateUrl:
      // URL 跳转（新窗口）
      if (eventConfig.targetUrl) {
        window.open(eventConfig.targetUrl, '_blank');
      }
      break;

    case ClickEventType.CustomCode:
      // 自定义代码执行
      if (eventConfig.customCode) {
        try {
          eval(eventConfig.customCode);
        } catch (error) {
          console.error('自定义代码执行错误:', error);
          alert(`代码执行错误: ${error}`);
        }
      }
      break;
  }
};
```

#### 3.3.3 安全说明

**⚠️ 关于 eval 的安全性**：

自定义代码使用 `eval` 执行，存在安全风险。设计考虑：

| 场景 | 风险 | 缓解措施 |
|------|------|---------|
| 预览模式执行 | 低风险 | 仅在预览模式执行，编辑模式不执行 |
| 用户输入代码 | 中风险 | UI 上显示明显的安全警告 |
| 项目导入时 | 中风险 | 导入时验证代码格式，不自动执行 |

**设计决策**：
- 预览模式的目标是**开发和测试**，不是生产环境
- `eval` 提供了最大的灵活性，方便用户快速测试交互逻辑
- 真实部署时，应该有更安全的执行环境（如沙箱）

### 3.4 事件配置数据结构

#### 3.4.1 数据结构定义

```typescript
// 事件类型枚举
export enum ClickEventType {
  None = 'none',           // 无事件（禁用点击）
  Alert = 'alert',          // 弹窗提示
  NavigateUrl = 'navigate_url', // 跳转到 URL
  CustomCode = 'custom_code',   // 执行自定义代码
}

// 事件配置
export interface ClickEventConfig {
  type: ClickEventType;        // 事件类型（必填）
  alertMessage?: string;       // 弹窗内容（Alert 类型时用）
  targetUrl?: string;          // 目标 URL（NavigateUrl 类型时用）
  customCode?: string;         // 自定义代码（CustomCode 类型时用）
}

// 组件事件集合
export interface ComponentEvents {
  onClick?: ClickEventConfig;  // 点击事件
}

// 嵌入到 ComponentBaseSchema
export interface ComponentBaseSchema {
  id: string;
  type: ComponentType;
  // ... 其他字段
  events?: ComponentEvents;    // 事件配置
}
```

#### 3.4.2 存储示例

```typescript
// localStorage 中存储的示例
{
  "id": "button_xxx",
  "type": "Button",
  "props": {
    "children": "点击我",
    "variant": "primary"
  },
  "styles": {},
  "x": 100,
  "y": 100,
  "events": {
    "onClick": {
      "type": "alert",
      "alertMessage": "按钮被点击了！"
    }
  }
}
```

---

## 4. 路由设计思路

### 4.1 路由架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      路由架构                                  │
└─────────────────────────────────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
    ┌─────────┐     ┌─────────┐     ┌─────────┐
    │/projects│     │ /builder│     │/preview │
    │(项目管理) │     │(编辑模式) │     │(预览模式) │
    └────┬────┘     └────┬────┘     └────┬────┘
         │                │                │
         │ 点击"打开"      │ 点击"预览"    │ 点击"返回编辑"
         │                │                │
         ▼                ▼                ▼
    ┌─────────┐     ┌─────────┐     ┌─────────┐
    │/builder │     │/preview │     │/builder │
    │  加载项目 │     │  无参数   │     │  保持数据 │
    └─────────┘     └─────────┘     └─────────┘
                          │
                          │ URL 参数方式
                          ▼
                    ┌──────────────┐
                    │/preview      │
                    │?project=xxx  │
                    │  加载指定项目  │
                    └──────────────┘
```

### 4.2 路由配置

```typescript
// src/router/index.tsx

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Navigate to="/projects" replace />,
      },
      {
        path: 'projects',
        element: <ProjectsPage />,  // 项目管理
      },
      {
        path: 'builder',
        element: <App />,           // 编辑模式
      },
      {
        path: 'preview',
        element: <PreviewPage />,   // 预览模式
      },
    ],
  },
]);
```

### 4.3 URL 参数传递项目 ID

#### 4.3.1 设计目的

- **直接预览**：从项目列表直接预览某个项目，无需先进入编辑模式
- **链接分享**：可以生成预览链接分享给其他人

#### 4.3.2 实现方式

```typescript
// src/pages/PreviewPage.tsx

const PreviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project');  // 读取 URL 参数

  const loadProject = useBuilderStore((state) => state.loadProject);
  const isCurrentProject = useBuilderStore((state) => state.isCurrentProject);
  
  const loadedProjectRef = useRef<string | null>(null);  // 防重复加载

  useEffect(() => {
    // 检查：
    // 1. 有 projectId 参数
    // 2. 不是已经加载的项目（防循环）
    // 3. 不是当前打开的项目（避免重复加载）
    if (projectId && 
        projectId !== loadedProjectRef.current && 
        !isCurrentProject(projectId)) {
      loadedProjectRef.current = projectId;  // 标记已加载
      const success = loadProject(projectId);
      if (!success) {
        setLoadError('无法加载指定的项目');
      }
    }
  }, [projectId]);  // 只依赖 projectId

  // ...
};
```

#### 4.3.3 生成预览链接

```typescript
// src/pages/ProjectsPage.tsx

const handlePreviewProject = (project: ProjectMetadata) => {
  // 生成带参数的预览链接
  navigate(`/preview?project=${project.id}`);
};
```

### 4.4 与编辑器的路由关系

#### 4.4.1 数据共享

```
┌─────────────────────────────────────────────────────────────┐
│                    状态共享 (Zustand Store)                   │
└─────────────────────────────────────────────────────────────┘
                          │
         ┌────────────────┴────────────────┐
         ▼                                 ▼
    ┌─────────┐                       ┌─────────┐
    │ /builder│                       │ /preview│
    │(编辑模式) │                       │(预览模式) │
    └────┬────┘                       └────┬────┘
         │                                 │
         │ 读取和修改                       │ 只读取
         │                                 │
         ▼                                 ▼
    ┌─────────────────────────────────────────────────┐
    │           useBuilderStore (Zustand)              │
    │                                                   │
    │  components: ComponentSchema[]    (组件树数据)   │
    │  currentProjectId: string | null  (当前项目ID)  │
    │  projectName: string              (项目名称)     │
    │  ...                                             │
    │                                                   │
    │  读取: ✅ 两个模式都可以                           │
    │  修改: ✅ 只有编辑模式可以                         │
    └─────────────────────────────────────────────────┘
```

#### 4.4.2 切换流程

```
从编辑模式进入预览模式:
1. 用户点击 Header 的"预览"按钮
2. navigate('/preview')
3. PreviewPage 从 store 读取当前组件数据
4. 使用 PreviewRenderer 渲染（无编辑交互）

从预览模式返回编辑模式:
1. 用户点击"返回编辑"按钮
2. navigate('/builder')
3. App 从 store 读取组件数据
4. 数据完全保留，无需重新加载

从项目列表直接预览:
1. 用户点击项目卡片的"预览"按钮
2. navigate(`/preview?project=${id}`)
3. PreviewPage 检测到 URL 参数
4. 调用 loadProject(id) 加载指定项目
5. 渲染预览
```

---

## 5. 数据共享机制

### 5.1 数据流向图

```
┌─────────────────────────────────────────────────────────────┐
│                      数据流架构                                │
└─────────────────────────────────────────────────────────────┘

                    用户编辑操作
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    编辑模式 (/builder)                        │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  用户操作:                                             │   │
│  │  - 拖拽添加组件                                         │   │
│  │  - 删除组件                                            │   │
│  │  - 修改属性（包括事件配置）                              │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Zustand store 更新:                                   │   │
│  │  - addComponent()                                     │   │
│  │  - removeComponent()                                  │   │
│  │  - updateComponent()  ← 包括 events 字段             │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ 共享同一份数据
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    预览模式 (/preview)                        │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  从 store 读取数据:                                    │   │
│  │  - components 数组                                     │   │
│  │  - 每个组件的 events.onClick 配置                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  渲染和交互:                                           │   │
│  │  - PreviewRenderer 渲染（无编辑交互）                  │   │
│  │  - 点击 Button → executeClickEvent()                  │   │
│  │  - 执行配置的事件（不修改 store）                       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 事件配置的持久化

事件配置是组件数据的一部分，会被持久化到 localStorage：

```typescript
// 组件保存时，events 字段会被包含
const component: ComponentSchema = {
  id: 'button_xxx',
  type: ComponentType.Button,
  props: { ... },
  styles: { ... },
  x: 100,
  y: 100,
  events: {
    onClick: {
      type: ClickEventType.Alert,
      alertMessage: '点击成功！'
    }
  }
};

// 保存时完整序列化
localStorage.setItem(`lowcode_builder_project_${id}`, JSON.stringify({
  id: projectId,
  name: projectName,
  components: [...components],  // 包含 events
  createdAt: ...,
  updatedAt: ...,
}));
```

### 5.3 编辑和预览的数据流对比

| 操作 | 编辑模式 | 预览模式 |
|------|---------|---------|
| **读取组件数据** | ✅ 从 store 读取 | ✅ 从 store 读取 |
| **修改组件数据** | ✅ 可以 (updateComponent) | ❌ 不可以 |
| **修改事件配置** | ✅ 可以 (通过属性面板) | ❌ 不可以 |
| **执行点击事件** | ❌ 不执行 (选中逻辑) | ✅ 执行 (executeClickEvent) |
| **修改 store** | ✅ 可以 | ❌ 不可以 |

---

## 6. 关键模块说明

### 6.1 ComponentRenderer - 核心渲染器

#### 6.1.1 文件位置

```
src/components/builder/ComponentRenderer/index.tsx
```

#### 6.1.2 核心函数列表

| 函数/组件 | 用途 | 导出 |
|---------|------|------|
| `ComponentRenderer` | 核心渲染组件，支持编辑/预览两种模式 | ✅ |
| `PreviewRenderer` | 预览模式快捷方式，固定 editable=false | ✅ |
| `isContainerComponent` | 类型守卫，判断是否是 Container 组件 | ✅ |
| `handleWrapperClick` | 编辑态点击处理，停止冒泡并调用回调 | ✅ |
| `executeClickEvent` | 预览态点击处理，执行配置的事件 | ❌ 内部使用 |

#### 6.1.3 关键参数

```typescript
interface ComponentRendererProps {
  component: ComponentSchema;           // 组件数据
  isSelected?: boolean;                  // 是否选中（编辑态用）
  onClick?: ((e: React.MouseEvent) => void) | (() => void);  // 选中回调
  editable?: boolean;                    // 是否可编辑（关键控制）
}
```

### 6.2 PreviewPage - 预览页面

#### 6.2.1 文件位置

```
src/pages/PreviewPage.tsx
```

#### 6.2.2 核心功能

| 功能 | 实现方式 |
|------|---------|
| **渲染组件** | 使用 PreviewRenderer 渲染 components 数组 |
| **加载项目** | 监听 URL 参数 ?project=xxx，调用 loadProject |
| **防重复加载** | 使用 useRef 记录已加载的项目 ID |
| **返回编辑** | navigate('/builder') |
| **空状态处理** | components.length === 0 时显示空状态 |

#### 6.2.3 组件位置渲染

```typescript
// 保持与编辑模式相同的绝对定位
const style: React.CSSProperties = {
  position: 'absolute',
  left: component.x ?? DEFAULT_POSITION.X,
  top: component.y ?? DEFAULT_POSITION.Y,
  width: getSizeValue(component.width),
  height: getSizeValue(component.height),
};
```

### 6.3 EventConfigEditor - 事件配置编辑器

#### 6.3.1 文件位置

```
src/components/builder/PropertyPanel/index.tsx  (内嵌组件)
```

#### 6.3.2 功能说明

| 功能 | 说明 |
|------|------|
| **事件类型选择** | 下拉选择：无、弹窗提示、跳转到 URL、执行自定义代码 |
| **动态参数输入** | 根据选择的类型显示对应的输入框 |
| **安全警告** | 自定义代码类型时显示黄色警告框 |
| **实时更新** | 修改时立即调用 updateComponent 更新 events 字段 |

#### 6.3.3 组件类型限制

事件配置只对 Button 组件显示：

```typescript
// PropertyPanel 中
{selectedComponent.type === ComponentType.Button && (
  <PropertySection title="事件配置" isEmpty={false}>
    <EventConfigEditor
      eventConfig={selectedComponent.events?.onClick}
      onChange={handleEventChange}
    />
  </PropertySection>
)}
```

### 6.4 类型定义

#### 6.4.1 文件位置

```
src/types/component.ts
```

#### 6.4.2 新增类型

```typescript
// 事件类型枚举
export enum ClickEventType {
  None = 'none',
  Alert = 'alert',
  NavigateUrl = 'navigate_url',
  CustomCode = 'custom_code',
}

// 事件配置
export interface ClickEventConfig {
  type: ClickEventType;
  alertMessage?: string;
  targetUrl?: string;
  customCode?: string;
}

// 组件事件集合
export interface ComponentEvents {
  onClick?: ClickEventConfig;
}

// ComponentBaseSchema 新增字段
export interface ComponentBaseSchema {
  // ... 已有字段
  events?: ComponentEvents;  // 新增
}
```

---

## 7. 设计决策总结

### 7.1 关键决策清单

| 决策 | 选项 | 选择 | 理由 |
|------|------|------|------|
| 渲染器复用 | 复用 vs 重写 | 复用 | 减少维护成本，保证一致性 |
| 事件隔离 | 两套代码 vs 参数控制 | 参数控制 | 通过 editable 参数简洁区分 |
| 数据共享 | 独立存储 vs 共享 store | 共享 store | 切换模式数据不丢失 |
| URL 参数 | 支持 vs 不支持 | 支持 | 方便从项目列表直接预览 |
| 自定义代码 | eval vs 禁用 | eval | 预览模式需要灵活性，有安全警告 |

### 7.2 未来扩展点

| 扩展点 | 说明 |
|--------|------|
| **更多事件类型** | onHover、onDoubleClick、onContextMenu 等 |
| **更多组件支持** | Image 点击、Text 点击等 |
| **沙箱执行** | 自定义代码使用沙箱环境，提高安全性 |
| **条件事件** | 根据条件（如表单值）执行不同事件 |
| **事件链** | 一个点击触发多个事件序列 |

---

*文档版本: v1.0*
*最后更新: 2026-05-02*
