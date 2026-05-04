# 事件系统自测文档

## 修复历史

| 日期 | 修复内容 | 相关 Bug |
|------|----------|----------|
| 2026-05-05 | 修复 SHOW_MODAL/HIDE_MODAL 动作上下文缺失 | Bug 1 |
| 2026-05-05 | 修复 Button 新旧事件系统同时触发 | Bug 2 |

---

## 事件系统架构

### 组件结构

```
ComponentRenderer
├── useClickEventExecutor()      ← 旧版事件系统（ClickEventType）
│   ├── Alert
│   ├── NavigateUrl
│   ├── CustomCode
│   ├── FormSubmit
│   └── FormReset
│
├── useActionExecutor()          ← 新版事件引擎（ActionType）
│   └── actionContext
│       ├── submitForm
│       ├── resetForm
│       ├── navigateToPage
│       ├── openModal            ← 新增（Bug 1 修复）
│       └── closeModal           ← 新增（Bug 1 修复）
│
└── useEventExecutor()           ← 事件执行包装
    └── executeEvent()
```

### Modal 注册机制

```
PreviewModalRegistryContext
├── registerModal(handle)        ← Modal 组件挂载时注册
├── unregisterModal(id)          ← Modal 组件卸载时注销
├── openModal(modalId)           ← 执行 SHOW_MODAL 动作
├── closeModal(modalId)          ← 执行 HIDE_MODAL 动作
└── getModal(id)                  ← 获取 Modal 句柄
```

---

## Bug 修复详情

### Bug 1：SHOW_MODAL 动作链路断裂

#### 问题描述
在属性面板中为 Button 配置 onClick → SHOW_MODAL 动作后，预览模式下点击按钮无法弹出 Modal。

#### 根本原因
`ComponentRenderer.tsx` 中的 `useActionExecutor()` 函数创建的 `actionContext` 缺少 `openModal` 和 `closeModal` 函数：

```typescript
// 修复前
const actionContext: ActionExecutionContext = React.useMemo(() => {
  const globalContext = (window as any).__previewActionContext;
  return {
    submitForm,
    resetForm,
    navigateToPage: globalContext?.navigateToPage,
    // ❌ 缺少 openModal 和 closeModal！
  };
}, [submitForm, resetForm]);
```

当 `eventEngine.ts` 中的 `executeShowModal` 函数尝试调用 `context.openModal()` 时，由于 `context.openModal` 为 `undefined`，只能输出警告日志，无法实际打开 Modal。

#### 完整链路分析

**期望的链路**：
```
Button 点击
    ↓
handlePreviewClick()
    ↓
executeEvent(events?.onClickActions)
    ↓
executeActions(actions, actionContext)
    ↓
executeAction(action, actionContext)
    ↓
executeShowModal(params, context)
    ↓
context.openModal(modalId)  ← 这里断裂了！
    ↓
PreviewModalRegistry.openModal(modalId)
    ↓
Modal 句柄的 open() 方法
    ↓
Modal visible 状态变为 true
    ↓
Modal 显示
```

**实际断裂点**：
```
context.openModal(modalId)  →  context.openModal 是 undefined
                                          ↓
                                   console.warn("缺少 openModal 上下文")
                                          ↓
                                    Modal 无法显示
```

#### 修复方案

**步骤 1：添加导入**
```typescript
import { usePreviewModalRegistry } from '@/context/PreviewModalRegistry';
```

**步骤 2：在 `useActionExecutor` 中获取 modalRegistry**
```typescript
const useActionExecutor = () => {
  const submitForm = usePreviewFormSubmit();
  const resetForm = usePreviewFormReset();
  const modalRegistry = usePreviewModalRegistry();  // 新增
  // ...
};
```

**步骤 3：将 `openModal` 和 `closeModal` 添加到 `actionContext`**
```typescript
const actionContext: ActionExecutionContext = React.useMemo(() => {
  const globalContext = (window as any).__previewActionContext;
  return {
    submitForm,
    resetForm,
    navigateToPage: globalContext?.navigateToPage,
    openModal: modalRegistry.openModal,    // 新增
    closeModal: modalRegistry.closeModal,  // 新增
  };
}, [submitForm, resetForm, modalRegistry.openModal, modalRegistry.closeModal]);
```

---

### Bug 2：Button 新旧事件系统同时触发

#### 问题描述
Button 组件在预览模式下点击会同时触发两种事件系统，导致行为重复（例如同时弹出两个 Alert）。

#### 根本原因
`ComponentRenderer.tsx` 中 Button 组件的 `handlePreviewClick` 函数同时调用了两个事件系统：

```typescript
// 修复前
const handlePreviewClick = (e: React.MouseEvent) => {
  if (editable) {
    handleWrapperClick(e, onClick);
  } else {
    executeClickEvent(events?.onClick);      // 旧版事件系统
    executeEvent(events?.onClickActions);    // 新版事件引擎
    // ❌ 两个都执行了！
  }
};
```

#### 事件系统对比

| 特性 | 旧版事件系统 | 新版事件引擎 |
|------|-------------|-------------|
| 配置属性 | `events.onClick` | `events.onClickActions` |
| 类型 | `ClickEventConfig` | `EventConfig` |
| 动作类型 | `ClickEventType` (5种) | `ActionType` (12种) |
| 支持动作链 | ❌ 不支持 | ✅ 支持多个动作顺序执行 |

**旧版事件类型（ClickEventType）**：
- `None` - 无动作
- `Alert` - 弹出提示框
- `NavigateUrl` - 打开链接
- `CustomCode` - 执行自定义代码
- `FormSubmit` - 提交表单
- `FormReset` - 重置表单

**新版事件类型（ActionType）**：
- `SHOW_ALERT` - 弹出提示框
- `NAVIGATE_URL` - 打开链接
- `NAVIGATE_PAGE` - 页面跳转
- `CONSOLE_LOG` - 控制台日志
- `CUSTOM_SCRIPT` - 自定义脚本
- `FORM_SUBMIT` - 提交表单
- `FORM_RESET` - 重置表单
- `SHOW_MODAL` - 打开弹窗 **（新增，旧版不支持）**
- `HIDE_MODAL` - 关闭弹窗 **（新增，旧版不支持）**

#### 修复方案

**步骤 1：判断是否配置了新版事件系统**
```typescript
const hasOnClickActions = events?.onClickActions 
  && events.onClickActions.enabled 
  && events.onClickActions.actions.length > 0;
```

**步骤 2：改为二选一逻辑**
```typescript
const handlePreviewClick = (e: React.MouseEvent) => {
  if (editable) {
    handleWrapperClick(e, onClick);
  } else {
    if (hasOnClickActions) {
      executeEvent(events?.onClickActions);    // 优先执行新版事件引擎
    } else {
      executeClickEvent(events?.onClick);      // 否则执行旧版事件系统
    }
  }
};
```

**优先级规则**：

| `onClickActions` 配置 | 执行哪个系统 |
|----------------------|-------------|
| `enabled=true` 且 `actions.length > 0` | 新版事件引擎 ✅ |
| `enabled=false` | 旧版事件系统 |
| `actions.length === 0` | 旧版事件系统 |
| 未配置 `onClickActions` | 旧版事件系统 |

---

## 完整测试矩阵

### 一、SHOW_MODAL/HIDE_MODAL 动作测试

#### 测试用例 1.1：Button 配置 SHOW_MODAL 后点击打开 Modal

| 项目 | 内容 |
|------|------|
| **场景** | 在属性面板为 Button 配置 onClick → SHOW_MODAL 动作，指定 modalId |
| **前置条件** | 页面上存在对应 modalId 的 Modal 组件 |
| **操作步骤** | 1. 进入预览模式<br>2. 点击 Button |
| **预期结果** | Modal 组件正确显示（visible 状态变为 true） |
| **验证方法** | 检查 Modal 组件是否从隐藏变为显示 |

#### 测试用例 1.2：Modal 关闭按钮正常关闭

| 项目 | 内容 |
|------|------|
| **场景** | Modal 打开后，点击关闭按钮或遮罩层 |
| **前置条件** | Modal 处于打开状态 |
| **操作步骤** | 1. Modal 已打开<br>2. 点击关闭按钮 / 点击遮罩层 |
| **预期结果** | Modal 正确关闭（visible 状态变为 false） |
| **验证方法** | 检查 Modal 组件是否从显示变为隐藏 |

#### 测试用例 1.3：SHOW_MODAL 动作缺少 modalId

| 项目 | 内容 |
|------|------|
| **场景** | SHOW_MODAL 动作配置中缺少 modalId 参数 |
| **前置条件** | 动作配置中 `params.modalId` 为 undefined |
| **操作步骤** | 执行 SHOW_MODAL 动作 |
| **预期结果** | 控制台输出警告日志，不抛出异常 |
| **验证方法** | 检查 `console.warn` 是否被调用 |

#### 测试用例 1.4：HIDE_MODAL 动作关闭 Modal

| 项目 | 内容 |
|------|------|
| **场景** | Button 配置 onClick → HIDE_MODAL 动作 |
| **前置条件** | Modal 处于打开状态 |
| **操作步骤** | 点击配置了 HIDE_MODAL 的 Button |
| **预期结果** | Modal 正确关闭 |
| **验证方法** | 检查 Modal 是否关闭 |

#### 测试用例 1.5：Modal 注册后才能被操作

| 项目 | 内容 |
|------|------|
| **场景** | SHOW_MODAL 动作指向未注册的 Modal |
| **前置条件** | 页面上不存在指定 modalId 的 Modal |
| **操作步骤** | 执行 SHOW_MODAL 动作 |
| **预期结果** | 静默忽略，不抛出异常 |
| **验证方法** | 检查 `PreviewModalRegistry.getModal(modalId)` 返回 undefined |

#### 测试用例 1.6：动作链中包含多个 Modal 操作

| 项目 | 内容 |
|------|------|
| **场景** | 一个 onClick 配置多个动作：<br>1. SHOW_MODAL(modal-A)<br>2. CONSOLE_LOG<br>3. HIDE_MODAL(modal-B) |
| **前置条件** | modal-A 关闭，modal-B 打开 |
| **操作步骤** | 点击 Button |
| **预期结果** | 1. modal-A 打开<br>2. 控制台输出日志<br>3. modal-B 关闭 |
| **验证方法** | 按顺序检查每个动作的执行结果 |

---

### 二、新旧事件系统互斥测试

#### 测试用例 2.1：只有 onClickActions 时执行新版事件引擎

| 项目 | 内容 |
|------|------|
| **场景** | Button 只配置了 `events.onClickActions` |
| **配置** | `onClickActions.enabled = true`<br>`onClickActions.actions.length > 0` |
| **操作步骤** | 点击 Button |
| **预期结果** | 只执行新版事件引擎的动作，不执行旧版事件系统 |
| **验证方法** | 检查 onClick 配置的动作是否被忽略 |

#### 测试用例 2.2：只有 onClick 时执行旧版事件系统

| 项目 | 内容 |
|------|------|
| **场景** | Button 只配置了 `events.onClick`（旧版） |
| **配置** | `onClickActions` 未配置或 `enabled=false` |
| **操作步骤** | 点击 Button |
| **预期结果** | 执行旧版事件系统的动作 |
| **验证方法** | 检查 Alert/NavigateUrl 等是否正确触发 |

#### 测试用例 2.3：两者都配置时优先执行新版

| 项目 | 内容 |
|------|------|
| **场景** | Button 同时配置了 `onClickActions` 和 `onClick` |
| **配置** | `onClickActions.enabled = true`<br>`onClickActions.actions.length > 0` |
| **操作步骤** | 点击 Button |
| **预期结果** | 只执行新版事件引擎，旧版被忽略 |
| **验证方法** | 检查旧版 onClick 配置的动作是否未执行 |

#### 测试用例 2.4：onClickActions 禁用时执行旧版

| 项目 | 内容 |
|------|------|
| **场景** | `onClickActions.enabled = false` |
| **配置** | 同时配置了 `onClick` |
| **操作步骤** | 点击 Button |
| **预期结果** | 执行旧版事件系统 |
| **验证方法** | 检查旧版动作是否正确触发 |

#### 测试用例 2.5：onClickActions 动作列表为空时执行旧版

| 项目 | 内容 |
|------|------|
| **场景** | `onClickActions.actions.length === 0` |
| **配置** | `onClickActions.enabled = true`<br>但 `actions` 是空数组 |
| **操作步骤** | 点击 Button |
| **预期结果** | 执行旧版事件系统（如果配置了） |
| **验证方法** | 检查旧版动作是否正确触发 |

#### 测试用例 2.6：两者都未配置时无动作

| 项目 | 内容 |
|------|------|
| **场景** | Button 未配置任何事件 |
| **操作步骤** | 点击 Button |
| **预期结果** | 无任何动作执行 |
| **验证方法** | 检查是否有 Alert/日志/Modal 操作 |

---

### 三、事件配置持久化测试

#### 测试用例 3.1：ActionConfig JSON 序列化完整性

| 项目 | 内容 |
|------|------|
| **场景** | 保存包含动作配置的组件到 localStorage |
| **测试数据** | 包含 SHOW_MODAL、CONSOLE_LOG、SHOW_ALERT 动作 |
| **操作步骤** | 1. 创建 ActionConfig 对象<br>2. JSON.stringify<br>3. JSON.parse |
| **预期结果** | 序列化/反序列化后所有属性保持完整 |
| **验证字段** | `id`、`type`、`enabled`、`params.*` |

#### 测试用例 3.2：EventConfig JSON 序列化完整性

| 项目 | 内容 |
|------|------|
| **场景** | 事件配置序列化 |
| **测试数据** | `{ type: 'onClick', actions: [...], enabled: true }` |
| **操作步骤** | 序列化 → 反序列化 |
| **预期结果** | 所有属性完整保留 |
| **验证字段** | `type`、`enabled`、`actions[]` |

#### 测试用例 3.3：ComponentEvents JSON 序列化完整性

| 项目 | 内容 |
|------|------|
| **场景** | 组件完整事件配置序列化 |
| **测试数据** | 包含 `onClickActions`、`onChangeActions`、`onClick` |
| **操作步骤** | 保存到 localStorage 后读取 |
| **预期结果** | 所有事件配置完整保留 |
| **验证方法** | 比较序列化前后的对象 |

#### 测试用例 3.4：Button Schema 持久化

| 项目 | 内容 |
|------|------|
| **场景** | 完整 Button 组件 Schema 持久化 |
| **测试数据** | Button 组件配置了 onClickActions |
| **操作步骤** | 1. 创建 Button Schema<br>2. 序列化保存<br>3. 反序列化读取 |
| **预期结果** | 读取后事件配置完整可用 |
| **验证方法** | 检查 `events.onClickActions.actions[0].params.modalId` |

---

### 四、边界情况测试

#### 测试用例 4.1：动作链中某动作失败不影响其他

| 项目 | 内容 |
|------|------|
| **场景** | 动作链包含：SHOW_MODAL(有效) → SHOW_MODAL(无 modalId) → HIDE_MODAL(有效) |
| **操作步骤** | 执行动作链 |
| **预期结果** | 第一个和第三个动作正常执行，第二个输出警告但不中断 |
| **验证方法** | 检查第一个 Modal 打开后又关闭 |

#### 测试用例 4.2：重复打开已打开的 Modal

| 项目 | 内容 |
|------|------|
| **场景** | Modal 已打开，再次执行 SHOW_MODAL |
| **前置条件** | Modal.visible = true |
| **操作步骤** | 执行 SHOW_MODAL(同一 modalId) |
| **预期结果** | 静默忽略，不重复触发 open 事件 |
| **验证方法** | 检查 `modal.isOpen` 检查逻辑是否生效 |

#### 测试用例 4.3：重复关闭已关闭的 Modal

| 项目 | 内容 |
|------|------|
| **场景** | Modal 已关闭，再次执行 HIDE_MODAL |
| **前置条件** | Modal.visible = false |
| **操作步骤** | 执行 HIDE_MODAL(同一 modalId) |
| **预期结果** | 静默忽略 |
| **验证方法** | 检查 `!modal.isOpen` 检查逻辑是否生效 |

#### 测试用例 4.4：Modal onOk 触发关闭动作

| 项目 | 内容 |
|------|------|
| **场景** | Modal 的确定按钮配置了 HIDE_MODAL 动作 |
| **操作步骤** | 1. 打开 Modal<br>2. 点击"确定"按钮 |
| **预期结果** | Modal 关闭 |
| **验证方法** | 检查 `events.onOkActions` 是否被执行 |

#### 测试用例 4.5：Modal onCancel 触发关闭动作

| 项目 | 内容 |
|------|------|
| **场景** | Modal 的取消按钮配置了 HIDE_MODAL 动作 |
| **操作步骤** | 1. 打开 Modal<br>2. 点击"取消"按钮或遮罩层 |
| **预期结果** | Modal 关闭 |
| **验证方法** | 检查 `events.onCancelActions` 是否被执行 |

---

### 五、跨组件联动测试

#### 测试用例 5.1：Button 打开 Modal，Modal 内 Button 关闭自身

| 项目 | 内容 |
|------|------|
| **场景** | 完整的 Modal 打开/关闭流程 |
| **组件配置** | - Button-A: SHOW_MODAL(modal-1)<br>- Modal(modal-1) 内包含 Button-B: HIDE_MODAL(modal-1) |
| **操作步骤** | 1. 点击 Button-A<br>2. Modal 打开<br>3. 点击 Modal 内的 Button-B |
| **预期结果** | 1. Modal 打开<br>2. Modal 关闭 |
| **验证方法** | 检查 Modal visible 状态变化 |

#### 测试用例 5.2：一个 Button 控制多个 Modal

| 项目 | 内容 |
|------|------|
| **场景** | Button 配置多个 SHOW_MODAL 动作 |
| **配置** | 动作链：<br>1. SHOW_MODAL(modal-A)<br>2. SHOW_MODAL(modal-B) |
| **操作步骤** | 点击 Button |
| **预期结果** | modal-A 和 modal-B 都打开 |
| **验证方法** | 检查两个 Modal 的 visible 状态 |

#### 测试用例 5.3：一个 Button 打开一个 Modal 并关闭另一个

| 项目 | 内容 |
|------|------|
| **场景** | Modal 互斥显示 |
| **配置** | 动作链：<br>1. HIDE_MODAL(modal-A)<br>2. SHOW_MODAL(modal-B) |
| **前置条件** | modal-A 已打开，modal-B 已关闭 |
| **操作步骤** | 点击 Button |
| **预期结果** | modal-A 关闭，modal-B 打开 |
| **验证方法** | 检查两个 Modal 的 visible 状态 |

---

## 手动验证步骤

### 步骤 1：验证 Bug 1 修复（SHOW_MODAL 链路）

1. **打开低代码编辑器**
2. **添加一个 Modal 组件**
   - 设置 `id` 为 `test-modal-1`
   - 设置 `title` 为 "测试弹窗"
   - 确保 `visible` 默认为 `false`
3. **添加一个 Button 组件**
   - 设置 `content` 为 "打开弹窗"
   - 在属性面板配置 `onClick` 事件：
     - 选择 **新版事件引擎**（onClickActions）
     - 添加动作：`SHOW_MODAL`
     - 设置 `modalId` 为 `test-modal-1`
4. **进入预览模式**
5. **点击 "打开弹窗" 按钮**
6. **验证结果**：
   - ✅ Modal 应该正确显示
   - ❌ 如果不显示，说明 Bug 1 未修复

### 步骤 2：验证 Modal 关闭

1. **在 Modal 中添加一个 Button**
   - 设置 `content` 为 "关闭弹窗"
   - 配置 `onClick` → `HIDE_MODAL` → `modalId: test-modal-1`
2. **预览模式下打开 Modal**
3. **点击 "关闭弹窗" 按钮**
4. **验证结果**：
   - ✅ Modal 应该正确关闭
   - ❌ 如果不关闭，检查动作配置

### 步骤 3：验证 Bug 2 修复（新旧系统不冲突）

1. **添加一个 Button 组件**
   - 设置 `content` 为 "测试冲突"
   - 配置 **新版事件引擎**：
     - `onClickActions` → `SHOW_ALERT` → `alertMessage: "新版消息"`
   - 同时配置 **旧版事件系统**：
     - `onClick` → `Alert` → `alertMessage: "旧版消息"`
2. **进入预览模式**
3. **点击按钮**
4. **验证结果**：
   - ✅ 只弹出一个 Alert，显示 "新版消息"
   - ❌ 如果弹出两个 Alert 或显示 "旧版消息"，说明 Bug 2 未修复

### 步骤 4：验证旧版事件系统兜底

1. **添加一个 Button 组件**
   - 设置 `content` 为 "测试旧版"
   - 配置 **旧版事件系统**：
     - `onClick` → `Alert` → `alertMessage: "旧版兜底"`
   - **不配置** `onClickActions`
2. **进入预览模式**
3. **点击按钮**
4. **验证结果**：
   - ✅ 弹出 Alert，显示 "旧版兜底"

### 步骤 5：验证事件配置持久化

1. **配置一个包含复杂事件链的 Button**
   - 动作 1：`SHOW_MODAL` → `modalId: modal-1`
   - 动作 2：`CONSOLE_LOG` → `logMessage: "Button 被点击"`
   - 动作 3：`SHOW_ALERT` → `alertMessage: "欢迎"`
2. **保存项目到 localStorage**
3. **刷新页面**
4. **重新加载项目**
5. **验证结果**：
   - ✅ 所有事件配置完整保留
   - ✅ 点击按钮时按顺序执行所有动作

---

## 测试文件位置

| 文件路径 | 测试内容 |
|----------|----------|
| `src/utils/eventSystemIntegration.test.ts` | 事件系统集成测试 |
| `src/utils/modalEventEngine.test.ts` | Modal 事件引擎测试（已有） |
| `src/utils/eventEngine.ts` | 事件引擎实现 |

## 相关文件

| 文件路径 | 修改内容 |
|----------|----------|
| `src/components/builder/ComponentRenderer/index.tsx` | ✅ 导入 `usePreviewModalRegistry`<br>✅ `actionContext` 添加 `openModal`/`closeModal`<br>✅ Button 事件处理改为二选一 |
| `src/context/PreviewModalRegistry.tsx` | ✅ Modal 注册管理（原有） |
| `src/utils/eventEngine.ts` | ✅ 事件执行引擎（原有） |

---

## 附录：ActionType 完整列表

| 动作类型 | 说明 | 必需参数 | 依赖上下文 |
|----------|------|----------|------------|
| `SHOW_ALERT` | 弹出提示框 | `alertMessage` | 无 |
| `NAVIGATE_URL` | 打开链接 | `targetUrl` | 无 |
| `NAVIGATE_PAGE` | 页面跳转 | `pageId` | `navigateToPage` |
| `CONSOLE_LOG` | 控制台日志 | `logMessage` | 无 |
| `CUSTOM_SCRIPT` | 自定义脚本 | `customScript` | 无 |
| `FORM_SUBMIT` | 提交表单 | `formId` | `submitForm` |
| `FORM_RESET` | 重置表单 | `formId` | `resetForm` |
| `SHOW_MODAL` | 打开弹窗 | `modalId` | `openModal` ✅ |
| `HIDE_MODAL` | 关闭弹窗 | `modalId` | `closeModal` ✅ |

## 附录：ClickEventType 完整列表（旧版）

| 事件类型 | 说明 | 必需参数 |
|----------|------|----------|
| `None` | 无动作 | 无 |
| `Alert` | 弹出提示框 | `alertMessage` |
| `NavigateUrl` | 打开链接 | `targetUrl` |
| `CustomCode` | 执行自定义代码 | `customCode` |
| `FormSubmit` | 提交表单 | `formId` |
| `FormReset` | 重置表单 | `formId` |

---

## 自测清单

### 🔴 高优先级（必须验证）

- [ ] Button 配置 SHOW_MODAL 后点击能打开 Modal
- [ ] Modal 关闭按钮能正常关闭
- [ ] Button 同时配置新旧系统时只执行新版
- [ ] Button 只配置旧系统时能正常执行

### 🟡 中优先级（建议验证）

- [ ] SHOW_MODAL 缺少 modalId 时只输出警告不崩溃
- [ ] HIDE_MODAL 能正确关闭已打开的 Modal
- [ ] 动作链按顺序执行
- [ ] 动作链中某动作失败不影响其他

### 🟢 低优先级（可选验证）

- [ ] 事件配置序列化/反序列化完整
- [ ] Modal onOk/onCancel 动作正确执行
- [ ] 一个 Button 控制多个 Modal
- [ ] 重复打开/关闭静默忽略

---

**最后更新**：2026-05-05
