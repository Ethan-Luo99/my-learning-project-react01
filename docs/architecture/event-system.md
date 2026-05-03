# 事件系统架构设计文档

## 1. 概述

事件系统是低代码平台的核心交互机制，允许开发者为 UI 组件配置响应式行为。系统采用"事件-动作"模型，即用户操作（事件）触发预定义的行为序列（动作）。本文档详细描述了事件系统的架构设计、核心机制、安全策略和扩展方式。

### 1.1 系统目标

- 支持多种事件类型（点击、变更、提交、聚焦、失焦）
- 支持多种动作类型（弹窗、跳转、日志、脚本、表单操作）
- 编辑模式下配置，预览模式下执行
- 支持多页面间导航（NAVIGATE_PAGE）
- 配置可持久化保存
- 安全的自定义脚本执行环境

### 1.2 核心概念

| 概念 | 说明 |
|------|------|
| **事件类型** | 用户与组件交互的方式，如 onClick、onChange |
| **动作类型** | 事件触发后执行的具体操作，如 SHOW_ALERT、NAVIGATE_URL |
| **事件配置** | 为组件的某个事件绑定的一组动作 |
| **动作配置** | 单个动作的具体参数配置 |
| **事件引擎** | 负责解析和执行事件配置的核心模块 |
| **执行上下文** | 为动作执行提供运行时环境的对象 |

---

## 2. 类型定义与数据结构

### 2.1 事件类型枚举

事件类型定义了组件可以响应的交互方式。

```typescript
// src/types/component.ts

export enum EventType {
  Click = 'onClick',    // 点击事件
  Change = 'onChange',  // 值变更事件
  Submit = 'onSubmit',  // 表单提交事件
  Focus = 'onFocus',    // 聚焦事件
  Blur = 'onBlur',      // 失焦事件
}
```

### 2.2 动作类型枚举

动作类型定义了事件触发后可以执行的具体操作。

```typescript
// src/types/component.ts

export enum ActionType {
  ShowAlert = 'SHOW_ALERT',        // 弹窗提示
  NavigateUrl = 'NAVIGATE_URL',    // 跳转外部 URL
  NavigatePage = 'NAVIGATE_PAGE',  // 项目内页面跳转
  ConsoleLog = 'CONSOLE_LOG',      // 控制台输出
  CustomScript = 'CUSTOM_SCRIPT',  // 自定义脚本
  FormSubmit = 'FORM_SUBMIT',      // 表单提交
  FormReset = 'FORM_RESET',        // 表单重置
}
```

### 2.3 跳转目标枚举

用于 NAVIGATE_URL 动作。

```typescript
// src/types/component.ts

export enum NavigateTarget {
  NewWindow = '_blank',      // 新窗口打开
  CurrentWindow = '_self',   // 当前窗口跳转
}
```

### 2.4 动作配置数据结构

每个动作都有唯一 ID、类型标识、参数对象和启用状态。

```typescript
// src/types/component.ts

export interface ActionConfig {
  id: string;                              // 动作唯一标识
  type: ActionType;                        // 动作类型
  params: {
    // SHOW_ALERT
    alertMessage?: string;
    
    // NAVIGATE_URL
    targetUrl?: string;
    navigateTarget?: NavigateTarget;
    
    // NAVIGATE_PAGE
    pageId?: string;
    
    // CONSOLE_LOG
    logMessage?: string;
    
    // CUSTOM_SCRIPT
    customScript?: string;
    
    // FORM_SUBMIT / FORM_RESET
    formId?: string;
  };
  enabled: boolean;                         // 是否启用
}
```

### 2.5 事件配置数据结构

事件配置将一个事件类型与一组动作绑定。

```typescript
// src/types/component.ts

export interface EventConfig {
  type: EventType;           // 事件类型
  actions: ActionConfig[];   // 动作列表（按顺序执行）
  enabled: boolean;          // 是否启用整个事件
}
```

### 2.6 组件事件数据结构

组件的 events 字段存储所有事件配置。

```typescript
// src/types/component.ts

export interface ComponentEvents {
  // 新事件系统（推荐）
  onClickActions?: EventConfig;    // 点击事件动作
  onChangeActions?: EventConfig;   // 变更事件动作
  onSubmitActions?: EventConfig;   // 提交事件动作
  onFocusActions?: EventConfig;    // 聚焦事件动作
  onBlurActions?: EventConfig;     // 失焦事件动作
  
  // 旧事件系统（向后兼容）
  onClick?: ClickEventConfig;
}
```

### 2.7 旧事件系统（向后兼容）

为了保持向后兼容，系统仍然支持旧的 ClickEventConfig：

```typescript
// src/types/component.ts

export enum ClickEventType {
  None = 'none',
  Alert = 'alert',
  NavigateUrl = 'navigate_url',
  CustomCode = 'custom_code',
  FormSubmit = 'form_submit',
  FormReset = 'form_reset',
}

export interface ClickEventConfig {
  type: ClickEventType;
  alertMessage?: string;
  targetUrl?: string;
  customCode?: string;
  formId?: string;
}
```

---

## 3. 事件引擎架构

### 3.1 核心模块位置

| 文件路径 | 职责 |
|---------|------|
| `src/utils/eventEngine.ts` | 事件引擎核心实现 |
| `src/types/component.ts` | 事件相关类型定义 |
| `src/components/builder/ComponentRenderer/index.tsx` | 组件渲染与事件绑定 |
| `src/components/builder/PropertyPanel/index.tsx` | 属性面板中的事件配置 UI |

### 3.2 执行上下文

执行上下文为动作提供运行时环境，允许动作与宿主环境交互。

```typescript
// src/utils/eventEngine.ts

export interface ActionExecutionContext {
  submitForm?: (formId?: string) => void;    // 表单提交回调
  resetForm?: (formId?: string) => void;      // 表单重置回调
  navigateToPage?: (pageId: string) => void;  // 页面跳转回调
}
```

### 3.3 事件执行流程

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         事件执行流程                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  阶段 1：事件触发                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  用户与组件交互（点击按钮、选择下拉框、输入文字等）                  │  │
│  │  ──────────────────────────────────────────────────────────────  │  │
│  │  组件类型      │  触发事件                                         │  │
│  │  ──────────────────────────────────────────────────────────────  │  │
│  │  Button        │  onClick → 执行 onClickActions                  │  │
│  │  Input         │  onChange → 执行 onChangeActions                │  │
│  │  Select        │  onChange → 执行 onChangeActions                │  │
│  │  Form          │  onSubmit → 执行 onSubmitActions               │  │
│  │  Input/Select  │  onFocus / onBlur → 执行对应事件                │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│                           │                                             │
│                           ▼                                             │
│                                                                         │
│  阶段 2：模式检查                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  检查当前是否为预览模式（editable = false）                          │  │
│  │  ──────────────────────────────────────────────────────────────  │  │
│  │  编辑模式：事件不执行，仅用于配置                                     │  │
│  │  预览模式：事件引擎执行配置的动作                                     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│                           │                                             │
│                           ▼                                             │
│                                                                         │
│  阶段 3：动作解析与分发                                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  executeAction(action, context)                                     │  │
│  │  ──────────────────────────────────────────────────────────────  │  │
│  │  1. 检查 action.enabled → 未启用则跳过                              │  │
│  │  2. 根据 action.type 分发到对应的执行函数                            │  │
│  │  3. 传递 action.params 和 context                                    │  │
│  │                                                                     │  │
│  │     switch (action.type) {                                          │  │
│  │       case ActionType.ShowAlert:                                    │  │
│  │         executeShowAlert(action.params);                            │  │
│  │         break;                                                      │  │
│  │       case ActionType.NavigateUrl:                                  │  │
│  │         executeNavigateUrl(action.params);                          │  │
│  │         break;                                                      │  │
│  │       case ActionType.NavigatePage:                                 │  │
│  │         executeNavigatePage(action.params, context);                │  │
│  │         break;                                                      │  │
│  │       // ... 其他动作类型                                            │  │
│  │     }                                                               │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│                           │                                             │
│                           ▼                                             │
│                                                                         │
│  阶段 4：动作执行                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  各动作类型的具体执行逻辑                                            │  │
│  │  ──────────────────────────────────────────────────────────────  │  │
│  │  SHOW_ALERT:                                                        │  │
│  │    alert(action.params.alertMessage || '事件触发了')               │  │
│  │                                                                     │  │
│  │  NAVIGATE_URL:                                                      │  │
│  │    if (navigateTarget === NewWindow) {                             │  │
│  │      window.open(targetUrl, '_blank');                             │  │
│  │    } else {                                                         │  │
│  │      window.location.href = targetUrl;                             │  │
│  │    }                                                                │  │
│  │                                                                     │  │
│  │  NAVIGATE_PAGE:                                                     │  │
│  │    if (context?.navigateToPage) {                                  │  │
│  │      context.navigateToPage(pageId);  // 由预览页面提供           │  │
│  │    } else {                                                         │  │
│  │      alert('请在预览模式下使用');                                   │  │
│  │    }                                                                │  │
│  │                                                                     │  │
│  │  CUSTOM_SCRIPT:                                                     │  │
│  │    try {                                                            │  │
│  │      const scriptFn = new Function(customScript);                  │  │
│  │      scriptFn();                                                    │  │
│  │    } catch (error) {                                                │  │
│  │      console.error('脚本执行错误:', error);                        │  │
│  │      alert(`脚本执行错误: ${error}`);                               │  │
│  │    }                                                                │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│                           │                                             │
│                           ▼                                             │
│                                                                         │
│  阶段 5：结果处理                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  错误处理：所有动作执行都被 try-catch 包裹                          │  │
│  │  静默失败：未知 ActionType 不抛出错误，仅 console.warn              │  │
│  │  顺序执行：executeActions 按配置顺序逐个执行动作                    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.4 事件引擎核心函数

#### 3.4.1 单动作执行

```typescript
// src/utils/eventEngine.ts

export const executeAction = (
  action: ActionConfig,
  context?: ActionExecutionContext
): void => {
  if (!action.enabled) {
    return;
  }

  switch (action.type) {
    case ActionType.ShowAlert:
      executeShowAlert(action.params);
      break;

    case ActionType.NavigateUrl:
      executeNavigateUrl(action.params);
      break;

    case ActionType.NavigatePage:
      executeNavigatePage(action.params, context);
      break;

    case ActionType.ConsoleLog:
      executeConsoleLog(action.params);
      break;

    case ActionType.CustomScript:
      executeCustomScript(action.params);
      break;

    case ActionType.FormSubmit:
      executeFormSubmit(action.params, context);
      break;

    case ActionType.FormReset:
      executeFormReset(action.params, context);
      break;

    default:
      console.warn('未知的动作类型:', action.type);
  }
};
```

#### 3.4.2 多动作顺序执行

```typescript
// src/utils/eventEngine.ts

export const executeActions = (
  actions: ActionConfig[],
  context?: ActionExecutionContext
): void => {
  for (const action of actions) {
    executeAction(action, context);
  }
};
```

#### 3.4.3 事件引擎工厂

```typescript
// src/utils/eventEngine.ts

export interface EventEngine {
  executeAction: (action: ActionConfig) => void;
  executeActions: (actions: ActionConfig[]) => void;
}

export const createEventEngine = (context?: ActionExecutionContext): EventEngine => {
  return {
    executeAction: (action: ActionConfig) => executeAction(action, context),
    executeActions: (actions: ActionConfig[]) => executeActions(actions, context),
  };
};
```

### 3.5 与 PreviewRenderer 的集成

#### 3.5.1 集成架构

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    PreviewRenderer 事件集成架构                             │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  PreviewPage.tsx (预览页面)                                               │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  // 1. 创建导航上下文                                              │  │
│  │  const handleNavigateToPage = (pageId: string) => {              │  │
│  │    // 查找目标页面                                                  │  │
│  │    const targetPage = pages.find(p => p.id === pageId);          │  │
│  │    // 更新预览状态                                                  │  │
│  │    setPreviewPageId(pageId);                                       │  │
│  │  };                                                                 │  │
│  │                                                                    │  │
│  │  // 2. 暴露到全局供 ComponentRenderer 使用                          │  │
│  │  const actionContext = {                                           │  │
│  │    navigateToPage: handleNavigateToPage,                          │  │
│  │  };                                                                 │  │
│  │  (window as any).__previewActionContext = actionContext;          │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│                            │                                             │
│                            ▼                                             │
│                                                                          │
│  ComponentRenderer.tsx (组件渲染器)                                       │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  // 3. 合并全局上下文                                              │  │
│  │  const useActionExecutor = () => {                                │  │
│  │    const submitForm = usePreviewFormSubmit();                     │  │
│  │    const resetForm = usePreviewFormReset();                       │  │
│  │                                                                    │  │
│  │    const actionContext = React.useMemo(() => {                   │  │
│  │      const globalContext = (window as any).__previewActionContext;│  │
│  │      return {                                                      │  │
│  │        submitForm,                                                 │  │
│  │        resetForm,                                                  │  │
│  │        navigateToPage: globalContext?.navigateToPage,             │  │
│  │      };                                                            │  │
│  │    }, [submitForm, resetForm]);                                   │  │
│  │                                                                    │  │
│  │    // 4. 执行动作时传入 context                                    │  │
│  │    const executeAction = (action: ActionConfig) => {              │  │
│  │      executeActionFromEngine(action, actionContext);              │  │
│  │    };                                                              │  │
│  │  };                                                                │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│                            │                                             │
│                            ▼                                             │
│                                                                          │
│  组件事件处理示例（Button）                                               │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  case ComponentType.Button: {                                     │  │
│  │    const handlePreviewClick = (e: React.MouseEvent) => {         │  │
│  │      if (editable) {                                               │  │
│  │        // 编辑模式：只处理选中                                      │  │
│  │        handleWrapperClick(e, onClick);                            │  │
│  │      } else {                                                      │  │
│  │        // 预览模式：执行事件                                        │  │
│  │        executeClickEvent(events?.onClick);   // 旧系统            │  │
│  │        executeEvent(events?.onClickActions);  // 新系统            │  │
│  │      }                                                             │  │
│  │    };                                                              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

#### 3.5.2 编辑模式 vs 预览模式

| 特性 | 编辑模式 (editable=true) | 预览模式 (editable=false) |
|------|--------------------------|---------------------------|
| 组件交互 | 可拖拽、可选中 | 真实交互（点击、输入等） |
| 事件执行 | 不执行 | 执行事件引擎 |
| 指针事件 | pointer-events-none | 正常 |
| 上下文 | 无 | 完整的 ActionExecutionContext |

---

## 4. 安全策略

### 4.1 CUSTOM_SCRIPT 的安全考量

自定义脚本执行是事件系统中最敏感的功能，系统采用多层安全策略。

### 4.2 Function 构造器 vs eval

#### 4.2.1 为什么使用 Function 而非 eval

```typescript
// src/utils/eventEngine.ts

export const executeCustomScript = (params: ActionConfig['params']): void => {
  if (!params.customScript) {
    return;
  }

  try {
    const scriptFn = new Function(params.customScript);
    scriptFn();
  } catch (error) {
    console.error('CUSTOM_SCRIPT 执行错误:', error);
    alert(`脚本执行错误: ${error}`);
  }
};
```

**Function 构造器的优势：**

| 特性 | Function 构造器 | eval |
|------|----------------|------|
| **作用域隔离** | 创建独立函数作用域，无法访问外部变量 | 直接在当前作用域执行，可访问所有变量 |
| **性能** | 创建后可复用（虽然当前实现每次新建） | 每次都需要解析 |
| **可控性** | 函数体独立，更容易分析和限制 | 代码可包含任意语句 |
| **安全边界** | 只能使用全局对象和传入的参数 | 可直接修改调用环境的任何变量 |

#### 4.2.2 作用域隔离示例

```javascript
// eval 的问题
const secret = '敏感数据';
eval('console.log(secret)'); // 输出: 敏感数据

// Function 构造器的保护
const scriptFn = new Function('console.log(typeof secret)');
scriptFn(); // 输出: undefined (无法访问外部变量)
```

### 4.3 沙箱执行的限制

#### 4.3.1 可访问的全局对象

Function 构造器创建的函数仍然可以访问浏览器全局对象：

```javascript
// 可以访问
window
document
console
alert
location
fetch
XMLHttpRequest

// 无法访问
// 外部函数的局部变量
// 调用方的闭包变量
```

#### 4.3.2 安全风险与缓解

| 风险 | 说明 | 缓解措施 |
|------|------|----------|
| **XSS 攻击** | 脚本可访问 DOM，可能注入恶意内容 | 仅在预览模式执行，编辑模式禁用；try-catch 捕获异常 |
| **数据泄露** | 脚本可读取 localStorage、Cookie | 用户配置的数据，仅在用户自己的浏览器执行 |
| **页面跳转** | 脚本可修改 location.href | 这是预期行为，但应在用户可控范围内 |
| **网络请求** | 脚本可发起 fetch/XMLHttpRequest | 受浏览器同源策略限制 |

#### 4.3.3 执行环境限制

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CUSTOM_SCRIPT 执行环境限制                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    浏览器沙箱 (Browser Sandbox)                     │  │
│  │  ┌──────────────────────────────────────────────────────────────┐│  │
│  │  │              全局对象 (Global Objects)                         ││  │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            ││  │
│  │  │  │ window  │ │ document│ │ console │ │  alert  │            ││  │
│  │  │  │ location│ │  fetch  │ │  Date   │ │ Math... │            ││  │
│  │  │  └────▲────┘ └─────────┘ └─────────┘ └─────────┘            ││  │
│  │  │       │                                                        ││  │
│  │  │       │ Function 构造器可访问                                  ││  │
│  │  │       │                                                        ││  │
│  │  │  ┌────┴─────────────────────────────────────────────────────┐││  │
│  │  │  │              Function 作用域 (隔离)                        │││  │
│  │  │  │                                                           │││  │
│  │  │  │  ✅ 可访问:                                               │││  │
│  │  │  │     - 全局对象 (window, document, console, alert)         │││  │
│  │  │  │     - 内置构造器 (Array, Object, Date, RegExp)            │││  │
│  │  │  │     - 浏览器 API (fetch, setTimeout, localStorage)         │││  │
│  │  │  │                                                           │││  │
│  │  │  │  ❌ 不可访问:                                             │││  │
│  │  │  │     - 外部函数的局部变量                                    │││  │
│  │  │  │     - 事件引擎的内部状态                                    │││  │
│  │  │  │     - useBuilderStore 等 React Hooks                      │││  │
│  │  │  │     - 组件 props/states                                    │││  │
│  │  │  └───────────────────────────────────────────────────────────┘││  │
│  │  └────────────────────────────────────────────────────────────────┘│  │
│  │                                                                      │  │
│  │  额外限制:                                                          │  │
│  │  - 仅在预览模式执行                                                 │  │
│  │  - try-catch 包裹，异常不影响宿主                                  │  │
│  │  - 无法直接修改项目数据（需通过全局 API）                           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.4 用户提示

在属性面板中，CUSTOM_SCRIPT 配置区域有明确的安全警告：

```typescript
// src/components/builder/PropertyPanel/index.tsx

<div className="mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded">
  <p className="text-xs text-yellow-700">
    ⚠️ 安全警告：自定义代码将使用 Function 构造器执行。仅在预览模式下执行。
  </p>
</div>
```

---

## 5. 持久化与序列化

### 5.1 序列化方案

事件配置通过 JSON 序列化存储到 localStorage。由于所有类型都是纯数据对象（无函数、无循环引用），可以直接使用标准的 `JSON.stringify`。

### 5.2 存储位置

```
项目数据结构 (存储在 localStorage)

Project {
  id: string;
  name: string;
  pages: Page[];           // 多页面系统
  currentPageId: string;
  components: ComponentSchema[];  // 兼容旧数据
  bindings?: DataBindingRule[];
  createdAt: string;
  updatedAt: string;
}

Page {
  id: string;
  name: string;
  components: ComponentSchema[];  // 页面的组件树
  createdAt: string;
  updatedAt: string;
  isHome?: boolean;
}

ComponentSchema {
  // ... 其他字段
  events?: ComponentEvents;  // 事件配置存储在这里
}
```

### 5.3 序列化示例

```typescript
// 一个 Button 组件的事件配置示例
const buttonComponent = {
  id: 'button-1',
  type: ComponentType.Button,
  props: { content: '提交' },
  styles: {},
  events: {
    onClickActions: {
      type: EventType.Click,
      enabled: true,
      actions: [
        {
          id: 'action-1',
          type: ActionType.ShowAlert,
          params: { alertMessage: '提交成功！' },
          enabled: true,
        },
        {
          id: 'action-2',
          type: ActionType.NavigatePage,
          params: { pageId: 'success-page' },
          enabled: true,
        },
      ],
    },
  },
};

// 序列化
const serialized = JSON.stringify(buttonComponent);

// 反序列化
const deserialized = JSON.parse(serialized);
```

### 5.4 可序列化字段检查

| 字段类型 | 可序列化 | 说明 |
|---------|---------|------|
| `string` | ✅ | 直接支持 |
| `number` | ✅ | 直接支持 |
| `boolean` | ✅ | 直接支持 |
| `null` | ✅ | 直接支持 |
| `undefined` | ❌ | 序列化后字段消失 |
| `Array` | ✅ | 元素需要可序列化 |
| `Object` | ✅ | 属性需要可序列化 |
| `Function` | ❌ | 序列化后丢失 |
| `RegExp` | ⚠️ | 序列化为 `{}`，丢失正则信息 |
| `Date` | ⚠️ | 序列化为 ISO 字符串 |
| `enum` (值) | ✅ | 枚举值是字符串/数字 |

### 5.5 向后兼容策略

系统支持新旧两种事件配置格式：

```typescript
// src/types/component.ts

export interface ComponentEvents {
  // 新系统（推荐）
  onClickActions?: EventConfig;
  onChangeActions?: EventConfig;
  onSubmitActions?: EventConfig;
  onFocusActions?: EventConfig;
  onBlurActions?: EventConfig;
  
  // 旧系统（兼容）
  onClick?: ClickEventConfig;
}

// ComponentRenderer 中的处理
const handlePreviewClick = (e: React.MouseEvent) => {
  if (editable) {
    handleWrapperClick(e, onClick);
  } else {
    // 两个系统都支持
    executeClickEvent(events?.onClick);        // 旧系统
    executeEvent(events?.onClickActions);      // 新系统
  }
};
```

### 5.6 数据迁移

旧项目数据自动迁移到多页面格式：

```typescript
// src/utils/storage.ts

const migrateProjectToPages = (project: Project): Project => {
  if (project.pages && project.pages.length > 0) {
    return project;
  }
  
  // 创建默认页面，包含原有的组件
  const defaultPage = createDefaultPage();
  defaultPage.components = project.components || [];
  
  return {
    ...project,
    pages: [defaultPage],
    currentPageId: defaultPage.id,
    components: defaultPage.components,
  };
};
```

---

## 6. 动作类型扩展指南

### 6.1 扩展概述

事件引擎采用**策略模式**设计，新增动作类型需要修改以下文件：

1. **`src/types/component.ts`** - 添加新的动作类型枚举和参数定义
2. **`src/utils/eventEngine.ts`** - 实现动作执行函数，注册到执行器
3. **`src/components/builder/PropertyPanel/index.tsx`** - 添加配置 UI

### 6.2 扩展步骤详解

假设要新增一个 `COPY_TO_CLIPBOARD`（复制到剪贴板）动作类型。

#### 步骤 1：扩展类型定义

```typescript
// src/types/component.ts

// 1.1 添加到 ActionType 枚举
export enum ActionType {
  ShowAlert = 'SHOW_ALERT',
  NavigateUrl = 'NAVIGATE_URL',
  NavigatePage = 'NAVIGATE_PAGE',
  ConsoleLog = 'CONSOLE_LOG',
  CustomScript = 'CUSTOM_SCRIPT',
  FormSubmit = 'FORM_SUBMIT',
  FormReset = 'FORM_RESET',
  CopyToClipboard = 'COPY_TO_CLIPBOARD',  // 新增
}

// 1.2 在 ActionConfig.params 中添加参数定义
export interface ActionConfig {
  id: string;
  type: ActionType;
  params: {
    // 现有参数...
    alertMessage?: string;
    targetUrl?: string;
    // ...
    
    // 新增参数
    clipboardText?: string;      // 要复制的文本
  };
  enabled: boolean;
}
```

#### 步骤 2：实现动作执行函数

```typescript
// src/utils/eventEngine.ts

// 2.1 实现执行函数
export const executeCopyToClipboard = (
  params: ActionConfig['params']
): void => {
  if (!params.clipboardText) {
    console.warn('COPY_TO_CLIPBOARD 动作缺少 clipboardText 参数');
    return;
  }

  try {
    // 使用 Clipboard API
    navigator.clipboard.writeText(params.clipboardText).then(
      () => {
        console.log('已复制到剪贴板:', params.clipboardText);
      },
      (err) => {
        console.error('复制失败:', err);
        alert('复制到剪贴板失败: ' + err.message);
      }
    );
  } catch (error) {
    console.error('COPY_TO_CLIPBOARD 执行错误:', error);
  }
};

// 2.2 注册到 executeAction 函数
export const executeAction = (
  action: ActionConfig,
  context?: ActionExecutionContext
): void => {
  if (!action.enabled) {
    return;
  }

  switch (action.type) {
    // 现有 case...
    case ActionType.ShowAlert:
      executeShowAlert(action.params);
      break;
      
    // 新增 case
    case ActionType.CopyToClipboard:
      executeCopyToClipboard(action.params);
      break;

    case ActionType.FormReset:
      executeFormReset(action.params, context);
      break;

    default:
      console.warn('未知的动作类型:', action.type);
  }
};
```

#### 步骤 3：添加属性面板配置 UI

```typescript
// src/components/builder/PropertyPanel/index.tsx

// 3.1 添加到动作类型选项列表
const actionTypeOptions = [
  { value: ActionType.ShowAlert, label: '弹窗提示 (SHOW_ALERT)' },
  { value: ActionType.NavigateUrl, label: '跳转链接 (NAVIGATE_URL)' },
  { value: ActionType.NavigatePage, label: '页面跳转 (NAVIGATE_PAGE)' },
  { value: ActionType.ConsoleLog, label: '控制台输出 (CONSOLE_LOG)' },
  { value: ActionType.CustomScript, label: '自定义脚本 (CUSTOM_SCRIPT)' },
  { value: ActionType.FormSubmit, label: '表单提交 (FORM_SUBMIT)' },
  { value: ActionType.FormReset, label: '表单重置 (FORM_RESET)' },
  { value: ActionType.CopyToClipboard, label: '复制到剪贴板 (COPY_TO_CLIPBOARD)' },  // 新增
];

// 3.2 在 renderParamInputs 中添加参数编辑器
const renderParamInputs = () => {
  switch (action.type) {
    // 现有 case...
    
    case ActionType.ConsoleLog:
      return (
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            日志内容
          </label>
          <input
            type="text"
            value={action.params.logMessage ?? ''}
            onChange={(e) => handleParamChange('logMessage', e.target.value)}
            placeholder="例如：按钮被点击了"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white"
          />
        </div>
      );

    // 新增 case
    case ActionType.CopyToClipboard:
      return (
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            要复制的文本
          </label>
          <textarea
            value={action.params.clipboardText ?? ''}
            onChange={(e) => handleParamChange('clipboardText', e.target.value)}
            placeholder="例如：这是要复制的文本内容"
            rows={2}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white resize-none"
          />
          <p className="mt-1 text-xs text-gray-500">
            文本将被复制到系统剪贴板
          </p>
        </div>
      );

    case ActionType.CustomScript:
      // ... 现有代码
  }
};
```

#### 步骤 4：（可选）添加执行上下文

如果新动作需要与宿主环境交互（类似 NAVIGATE_PAGE 需要页面导航回调），需要扩展 `ActionExecutionContext`：

```typescript
// src/utils/eventEngine.ts

export interface ActionExecutionContext {
  submitForm?: (formId?: string) => void;
  resetForm?: (formId?: string) => void;
  navigateToPage?: (pageId: string) => void;
  // 新增
  showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}
```

然后在预览页面中提供这个上下文：

```typescript
// src/pages/PreviewPage.tsx

const actionContext: ActionExecutionContext = {
  navigateToPage: handleNavigateToPage,
  showToast: (message, type) => {
    // 实现 toast 显示逻辑
    toast[type === 'success' ? 'success' : type === 'error' ? 'error' : 'info'](message);
  },
};
```

### 6.3 扩展检查清单

新增动作类型时，请确保完成以下检查：

| 检查项 | 文件位置 | 说明 |
|--------|---------|------|
| ✅ 添加枚举值 | `src/types/component.ts` | ActionType 枚举 |
| ✅ 添加参数类型 | `src/types/component.ts` | ActionConfig.params 接口 |
| ✅ 实现执行函数 | `src/utils/eventEngine.ts` | executeXxx 函数 |
| ✅ 注册到 switch | `src/utils/eventEngine.ts` | executeAction 函数中的 switch |
| ✅ 添加 UI 选项 | `src/components/builder/PropertyPanel/index.tsx` | actionTypeOptions 数组 |
| ✅ 添加参数编辑器 | `src/components/builder/PropertyPanel/index.tsx` | renderParamInputs 函数 |
| ✅ （可选）扩展上下文 | `src/utils/eventEngine.ts` | ActionExecutionContext 接口 |
| ✅ （可选）提供上下文 | `src/pages/PreviewPage.tsx` | 创建 actionContext 对象 |

### 6.4 动作类型分类建议

根据功能特性，动作类型可以分为以下几类：

| 类别 | 示例 | 是否需要上下文 |
|------|------|---------------|
| **显示类** | SHOW_ALERT, CONSOLE_LOG | 否 |
| **导航类** | NAVIGATE_URL, NAVIGATE_PAGE | NAVIGATE_PAGE 需要 |
| **表单类** | FORM_SUBMIT, FORM_RESET | 是 |
| **自定义类** | CUSTOM_SCRIPT | 否（使用全局） |
| **扩展类** | COPY_TO_CLIPBOARD, SHOW_TOAST | 可选 |

---

## 7. 多页面导航机制

### 7.1 页面数据结构

```typescript
// src/types/component.ts

export interface Page {
  id: string;           // 页面唯一标识
  name: string;         // 页面名称（用于显示）
  components: ComponentSchema[];  // 页面的组件树
  createdAt: string;    // 创建时间
  updatedAt: string;    // 更新时间
  isHome?: boolean;     // 是否为首页
}
```

### 7.2 NAVIGATE_PAGE 执行流程

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    NAVIGATE_PAGE 执行流程                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  阶段 1：事件触发                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  用户点击配置了 NAVIGATE_PAGE 动作的 Button                        │  │
│  │  Button 的 onClick 被触发                                          │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│                           │                                             │
│                           ▼                                             │
│                                                                         │
│  阶段 2：事件引擎执行                                                    │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  executeNavigatePage(params, context)                              │  │
│  │  ──────────────────────────────────────────────────────────────  │  │
│  │  1. 检查 params.pageId 是否存在                                    │  │
│  │  2. 检查 context?.navigateToPage 是否可用                          │  │
│  │  3. 如果可用：调用 context.navigateToPage(pageId)                  │  │
│  │  4. 如果不可用：显示 alert 提示（编辑模式）                         │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│                           │                                             │
│                           ▼                                             │
│                                                                         │
│  阶段 3：预览页面处理                                                    │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  PreviewPage.tsx 中的 handleNavigateToPage                         │  │
│  │  ──────────────────────────────────────────────────────────────  │  │
│  │  1. 根据 pageId 查找目标页面                                        │  │
│  │     targetPage = pages.find(p => p.id === pageId)                 │  │
│  │                                                                    │  │
│  │  2. 更新预览状态                                                    │  │
│  │     setPreviewPageId(pageId)                                       │  │
│  │                                                                    │  │
│  │  3. 更新导航历史                                                    │  │
│  │     navigationHistoryRef.current.push(pageId)                      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│                           │                                             │
│                           ▼                                             │
│                                                                         │
│  阶段 4：重新渲染                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  React 响应式更新                                                   │  │
│  │  ──────────────────────────────────────────────────────────────  │  │
│  │  previewPageId 变化 → currentPage 重新计算                         │  │
│  │  currentPage = pages.find(p => p.id === previewPageId)            │  │
│  │                                                                    │  │
│  │  currentComponents 变化 → ComponentRenderer 重新渲染               │  │
│  │  currentComponents = currentPage?.components || storeComponents    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 7.3 页面管理 UI

页面管理面板位于左侧组件库面板上方：

```
┌─────────────────────────────────────┐
│  页面                              + │  ← 标题 + 新增按钮
├─────────────────────────────────────┤
│  🏠 首页                   ✏️ 🗑️    │  ← 当前页面高亮
│  📄 产品列表                        │  ← 普通页面
│  📄 关于我们                        │
├─────────────────────────────────────┤
│  单击切换页面，双击重命名            │  ← 使用提示
└─────────────────────────────────────┘

操作说明：
- 单击页面项：切换到该页面
- 双击页面项：进入重命名模式
- 点击 ✏️ 图标：重命名
- 点击 🗑️ 图标：删除页面（至少保留一个）
- 点击 + 按钮：新建页面
```

---

## 8. 关键文件索引

| 文件路径 | 说明 |
|---------|------|
| `src/types/component.ts` | 事件类型、动作类型、配置接口定义 |
| `src/utils/eventEngine.ts` | 事件引擎核心实现 |
| `src/utils/eventEngine.test.ts` | 事件引擎单元测试 |
| `src/components/builder/ComponentRenderer/index.tsx` | 组件渲染与事件绑定 |
| `src/components/builder/PropertyPanel/index.tsx` | 属性面板中的事件配置 UI |
| `src/components/builder/PagePanel/index.tsx` | 页面管理面板 |
| `src/pages/PreviewPage.tsx` | 预览页面（多页面导航） |
| `src/store/useBuilderStore.ts` | 状态管理（多页面） |
| `src/utils/storage.ts` | 持久化与数据迁移 |

---

## 9. 测试矩阵

### 9.1 事件类型测试

| 事件类型 | 触发组件 | 测试场景 | 预期结果 |
|---------|---------|---------|---------|
| onClick | Button | 点击按钮 | 动作列表按序执行 |
| onChange | Input/Select | 输入值/选择选项 | 动作列表按序执行 |
| onSubmit | Form | 提交表单 | 动作列表按序执行 |
| onFocus | Input | 聚焦输入框 | 动作列表按序执行 |
| onBlur | Input | 失焦输入框 | 动作列表按序执行 |

### 9.2 动作类型测试

| 动作类型 | 测试场景 | 预期结果 |
|---------|---------|---------|
| SHOW_ALERT | 配置 alertMessage | 弹出 alert 显示消息 |
| SHOW_ALERT | 未配置 alertMessage | 显示默认消息"事件触发了" |
| NAVIGATE_URL | 新窗口打开 | 调用 window.open |
| NAVIGATE_URL | 当前窗口跳转 | 修改 location.href |
| NAVIGATE_PAGE | 目标页面存在 | 预览模式切换到目标页面 |
| NAVIGATE_PAGE | 目标页面不存在 | 控制台警告，不执行跳转 |
| CONSOLE_LOG | 配置 logMessage | 控制台输出消息 |
| CUSTOM_SCRIPT | 有效脚本 | 脚本正常执行 |
| CUSTOM_SCRIPT | 语法错误脚本 | try-catch 捕获，alert 提示错误 |
| FORM_SUBMIT | 表单存在 | 调用 context.submitForm |
| FORM_RESET | 表单存在 | 调用 context.resetForm |

### 9.3 边界情况测试

| 测试场景 | 预期结果 |
|---------|---------|
| 动作列表为空 | 无操作 |
| 动作 enabled=false | 跳过该动作 |
| 多个动作按序配置 | 按配置顺序执行 |
| 某个动作执行失败 | 后续动作继续执行 |
| 未知 ActionType | 静默忽略，console.warn |
| 编辑模式触发事件 | 不执行任何动作 |
| 预览模式触发事件 | 执行配置的动作 |

---

*文档版本：1.0*  
*最后更新：2026-05-04*
