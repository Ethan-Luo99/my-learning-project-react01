# B 系列架构综述文档

> 本文档为 React 低代码搭建平台 B 系列功能的完整架构综述，涵盖表单组件体系、事件交互系统、高级业务组件、画布交互增强四个核心模块的设计、依赖关系和数据流。

---

## 文档信息

| 项目 | 内容 |
|------|------|
| 文档版本 | v1.0 |
| 最后更新 | 2026-05-04 |
| 作者 | 开发团队 |
| 状态 | 稳定 |

---

## 目录

1. [功能总览](#1-功能总览)
2. [模块依赖关系](#2-模块依赖关系)
3. [数据流总览](#3-数据流总览)
4. [模块详细说明](#4-模块详细说明)
5. [模块集成点](#5-模块集成点)
6. [已知限制与改进建议](#6-已知限制与改进建议)

---

## 1. 功能总览

B 系列是 React01 低代码平台的核心功能扩展，包含四个独立但紧密集成的模块，总计提供 **13 个新组件** + **1 套事件系统** + **3 个画布增强功能**。

### 1.1 B 系列模块概览

| 模块名称 | 功能描述 | 新增组件/功能数 | 关键特性 |
|---------|---------|----------------|---------|
| **表单组件体系** | 提供完整的表单输入、验证、数据绑定能力 | 10 个组件 | 实时验证、多种验证规则、数据联动 |
| **事件交互系统** | 统一的事件-动作执行引擎 | 1 套系统 | 5 种事件类型、10 种动作类型 |
| **高级业务组件** | 复杂业务场景下的组合组件 | 5 个组件 | 容器嵌套、标签页、手风琴、弹窗 |
| **画布交互增强** | 提升画布编辑效率的交互功能 | 3 个功能 | 智能对齐、多选操作、组件缩放 |

### 1.2 13 个新组件清单

#### 表单组件（10 个）

| 组件类型 | 组件名 | 功能描述 | 支持特性 |
|---------|--------|---------|---------|
| Input | 输入框 | 单行文本输入 | ✅ 验证 ✅ 数据绑定 ✅ 事件 |
| Textarea | 多行文本框 | 多行文本输入 | ✅ 验证 ✅ 数据绑定 ✅ 事件 |
| Select | 下拉选择 | 下拉选择器 | ✅ 验证 ✅ 数据绑定 ✅ 事件 |
| Checkbox | 复选框 | 单个复选框 | ❌ 验证 ✅ 数据绑定 ✅ 事件 |
| CheckboxGroup | 复选框组 | 多个复选框组合 | ❌ 验证 ✅ 数据绑定 ✅ 事件 |
| Radio | 单选框 | 单个单选框 | ❌ 验证 ✅ 数据绑定 ✅ 事件 |
| RadioGroup | 单选框组 | 多个单选框组合 | ❌ 验证 ✅ 数据绑定 ✅ 事件 |
| Switch | 开关 | 开关切换控件 | ❌ 验证 ✅ 数据绑定 ✅ 事件 |
| Form | 表单容器 | 表单整体容器 | ✅ 提交验证 ❌ 数据绑定 |
| FormItem | 表单项 | 表单项包装器 | ✅ 错误展示 ❌ 数据绑定 |

#### 高级业务组件（5 个）

| 组件类型 | 组件名 | 功能描述 | 支持特性 |
|---------|--------|---------|---------|
| Card | 卡片 | 内容卡片容器 | ✅ 嵌套 ✅ 阴影 ✅ 边框 |
| Divider | 分割线 | 水平/垂直分割线 | ✅ 文字 ✅ 虚线 |
| Tabs | 标签页 | 标签页容器 | ✅ 嵌套 ✅ 动画 ✅ 可添加 |
| TabPane | 标签面板 | 标签页内容面板 | ✅ 禁用 ✅ 可关闭 |
| Accordion | 手风琴 | 折叠面板容器 | ✅ 嵌套 ✅ 多项展开 |
| AccordionItem | 手风琴面板 | 手风琴内容面板 | ✅ 默认展开 ✅ 禁用 |
| Modal | 弹窗 | 对话框组件 | ✅ 嵌套 ✅ 事件 ✅ 自定义按钮 |

### 1.3 事件交互系统

事件系统采用"事件-动作"模型，支持 5 种事件类型和 10 种动作类型：

#### 事件类型

| 事件类型 | 触发时机 | 适用组件 |
|---------|---------|---------|
| `onClick` | 组件被点击 | 所有组件 |
| `onChange` | 组件值变更 | 表单组件（Input、Select、Checkbox 等） |
| `onSubmit` | 表单提交 | Form 组件 |
| `onFocus` | 组件获得焦点 | 表单组件 |
| `onBlur` | 组件失去焦点 | 表单组件 |

#### 动作类型

| 动作类型 | 功能描述 | 必需参数 |
|---------|---------|---------|
| `SHOW_ALERT` | 显示弹窗提示 | `alertMessage` |
| `NAVIGATE_URL` | 跳转到外部 URL | `targetUrl`, `navigateTarget` |
| `NAVIGATE_PAGE` | 跳转到项目内页面 | `pageId` |
| `CONSOLE_LOG` | 控制台输出 | `logMessage` |
| `CUSTOM_SCRIPT` | 执行自定义脚本 | `customScript` |
| `FORM_SUBMIT` | 提交表单 | `formId` |
| `FORM_RESET` | 重置表单 | `formId` |
| `SHOW_MODAL` | 显示弹窗 | `modalId` |
| `HIDE_MODAL` | 隐藏弹窗 | `modalId` |

### 1.4 画布交互增强（3 个功能）

| 功能名称 | 功能描述 | 关键特性 |
|---------|---------|---------|
| **智能对齐辅助线** | 拖拽时自动检测对齐关系并显示辅助线 | 12 种对齐类型、8 像素吸附容差、对齐优先于网格 |
| **组件多选操作** | 支持同时选择多个组件进行批量操作 | Shift+点击添加/移除、批量删除、批量复制粘贴 |
| **组件缩放功能** | 支持 8 方向拖拽调整组件尺寸 | 最小尺寸限制、网格吸附、ESC 取消 |

---

## 2. 模块依赖关系

### 2.1 依赖链总览

B 系列四个模块形成清晰的依赖递进关系：

```
┌─────────────────────────────────────────────────────────────────┐
│                        模块依赖关系图                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  表单组件体系  │ ──▶ │  验证引擎   │ ──▶ │  数据绑定   │
│ (Form Components) │     │ (Validation)  │     │ (Data Binding)│
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────┐
│                   事件交互系统                            │
│              (Event Interaction System)                  │
└─────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│                   组件扩展（高级业务组件）                 │
│              (Component Extension)                        │
└─────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│                   画布交互增强                            │
│              (Canvas Interaction Enhancement)            │
└─────────────────────────────────────────────────────────┘
```

### 2.2 依赖关系详细说明

#### 2.2.1 表单组件 → 验证引擎

**依赖方向**：表单组件依赖验证引擎

**说明**：
- 所有表单组件（Input、Textarea、Select 等）都可以配置验证规则
- 验证规则通过 `validationRules` 属性传入组件
- 组件在 `onChange` 或 `onBlur` 时触发验证引擎进行校验

**关键代码**：
```typescript
// src/types/component.ts 中定义的验证规则类型
export interface ValidationRule {
  type: ValidationRuleType;  // 'required' | 'minLength' | 'maxLength' | ... | 'custom'
  message?: string;
  value?: number | string | boolean | RegExp;
  customValidator?: (value: any) => boolean | string;
}

// src/components/builder/ComponentRenderer/index.tsx 中 Input 组件的验证配置
<Input
  validationRules={props.validationRules}
  validateOnChange={validateOnChange}
  validateOnBlur={validateOnBlur}
  // ...
/>
```
[component.ts:22-27](file:///g:/Remote/prompt%20program/React01/src/types/component.ts#L22-L27)

#### 2.2.2 验证引擎 → 数据绑定

**依赖方向**：数据绑定可独立工作，验证引擎为数据联动提供质量保障

**说明**：
- 数据绑定机制独立于验证引擎，可以单独使用
- 但在实际场景中，通常先验证通过后再触发数据绑定
- 表单提交时会先执行验证，验证通过后才会执行绑定和事件动作

**数据流**：
```
用户输入值 → onChange 触发
              │
              ▼
         验证引擎检查
      (validateOnChange=true)
              │
     ┌────────┴────────┐
     ▼                 ▼
  验证失败           验证成功
  (显示错误)          │
                    ▼
              数据绑定触发
              (triggerBinding)
```

#### 2.2.3 数据绑定 → 事件系统

**依赖方向**：事件系统可以消费数据绑定的值，也可以独立触发

**说明**：
- 数据绑定和事件系统是两个独立但协同工作的系统
- 数据绑定主要处理组件间的数据联动
- 事件系统处理用户交互触发的业务逻辑
- 两者都通过 `onChange` 等事件触发点进行消费

**触发顺序**：
```typescript
// src/components/builder/ComponentRenderer/index.tsx 中的 handleValueChange
const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const newValue = e.target.value;
  triggerValueChange(newValue);  // 1. 先触发数据绑定
  if (!editable) {
    executeEvent(events?.onChangeActions);  // 2. 再执行事件动作
  }
  // ...
};
```
[ComponentRenderer/index.tsx:986-995](file:///g:/Remote/prompt%20program/React01/src/components/builder/ComponentRenderer/index.tsx#L986-L995)

#### 2.2.4 事件系统 → 组件扩展（高级业务组件）

**依赖方向**：高级业务组件依赖事件系统实现交互

**说明**：
- 高级业务组件（Card、Tabs、Accordion、Modal 等）都可以配置事件
- Modal 组件支持特殊的 `onOkActions` 和 `onCancelActions` 事件
- 事件系统提供统一的动作执行上下文，包括表单提交、页面跳转、弹窗控制等

**关键代码**：
```typescript
// Modal 组件的事件处理
case ComponentType.Modal: {
  // ...
  const handleOk = () => {
    executeEvent(events?.onOkActions);
  };
  
  const handleCancel = () => {
    executeEvent(events?.onCancelActions);
  };
  // ...
}
```
[ComponentRenderer/index.tsx:912-918](file:///g:/Remote/prompt%20program/React01/src/components/builder/ComponentRenderer/index.tsx#L912-L918)

#### 2.2.5 组件扩展 → 画布交互增强

**依赖方向**：画布交互增强功能作用于所有组件（包括基础和高级组件）

**说明**：
- 画布交互增强（对齐辅助线、多选、缩放）是画布层面的通用功能
- 所有类型的组件（基础组件、表单组件、高级业务组件）都可以使用这些功能
- 这些功能不依赖组件的具体实现，只依赖组件的位置和尺寸属性

**影响范围**：
```
画布交互增强功能
       │
       ├──▶ 所有组件类型
       │       ├── 基础组件（Text、Button、Image、Container）
       │       ├── 表单组件（Input、Select、Checkbox...）
       │       └── 高级组件（Card、Tabs、Accordion、Modal）
       │
       └──▶ 特殊行为
               ├── 对齐辅助线：基于组件位置计算
               ├── 多选操作：基于选中状态管理
               └── 缩放功能：基于尺寸属性调整
```

---

## 3. 数据流总览

### 3.1 核心数据流图

```
┌─────────────────────────────────────────────────────────────────────┐
│                        B 系列数据流总览                               │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                           编辑模式 (Editable)                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐           │
│  │  组件拖拽    │ ──▶ │  对齐检测   │ ──▶ │  位置更新   │           │
│  │  (DnD-Kit)  │     │(Alignment) │     │  (Store)    │           │
│  └─────────────┘     └─────────────┘     └─────────────┘           │
│         │                   │                   │                     │
│         ▼                   ▼                   ▼                     │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐           │
│  │  多选状态    │ ──▶ │  历史记录   │ ──▶ │  自动保存   │           │
│  │(MultiSelect)│     │ (History)   │     │ (AutoSave)  │           │
│  └─────────────┘     └─────────────┘     └─────────────┘           │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         预览模式 (Preview)                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────┐                                                      │
│  │ 用户交互    │ (点击、输入、选择)                                    │
│  └──────┬──────┘                                                      │
│         │                                                              │
│         ▼                                                              │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                    ComponentRenderer (editable=false)            ││
│  └─────────────────────────────────────────────────────────────────┘│
│         │                                                              │
│    ┌────┴────┐                                                        │
│    ▼         ▼                                                        │
│  onChange  onClick                                                    │
│    │         │                                                        │
│    ▼         ▼                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                      数据绑定上下文 (PreviewBinding)               ││
│  │  - getComponentValue()  读取组件值                                ││
│  │  - setComponentValue()  设置组件值                                ││
│  │  - triggerBinding()     触发数据联动                              ││
│  └─────────────────────────────────────────────────────────────────┘│
│         │                                                              │
│         ▼                                                              │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                      表单注册上下文 (PreviewFormRegistry)          ││
│  │  - submitForm()  表单提交                                         ││
│  │  - resetForm()   表单重置                                         ││
│  │  - validate()    表单验证                                         ││
│  └─────────────────────────────────────────────────────────────────┘│
│         │                                                              │
│         ▼                                                              │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                      事件引擎 (EventEngine)                        ││
│  │  - executeAction()   执行单个动作                                 ││
│  │  - executeActions()  按顺序执行多个动作                           ││
│  │  - 动作类型：SHOW_ALERT、NAVIGATE_URL、FORM_SUBMIT 等            ││
│  └─────────────────────────────────────────────────────────────────┘│
│         │                                                              │
│         ▼                                                              │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                      验证引擎 (formValidation)                     ││
│  │  - validateField()  单字段验证                                    ││
│  │  - validateForm()   表单级验证                                    ││
│  │  - 验证规则：required、minLength、pattern、email 等               ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 表单数据详细流转路径

#### 3.2.1 编辑模式下的数据存储

```
编辑模式数据流：

用户配置组件属性
       │
       ▼
┌──────────────────┐
│   PropertyPanel  │  (属性面板编辑)
│  (右侧属性面板)  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  useBuilderStore │  (Zustand 状态管理)
│  - components[]  │
│  - selectedId    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  useAutoSave     │  (自动保存 Hook)
│  - 2秒防抖        │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   localStorage   │  (持久化存储)
│  - projects[]    │
│  - currentProject│
└──────────────────┘
```

#### 3.2.2 预览模式下的用户交互数据流

```
预览模式 - 用户交互完整流程：

┌────────────────────────────────────────────────────────────────────┐
│                        用户输入/点击                                  │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│              ComponentRenderer.handleValueChange()                  │
│                                                                      │
│  1. 获取新值: newValue = e.target.value                             │
│  2. 触发数据绑定: triggerValueChange(newValue)                      │
│  3. 执行事件动作: executeEvent(events?.onChangeActions)            │
│  4. 调用用户回调: restInputProps.onChange(e)                        │
└────────────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │  数据绑定     │  │  事件引擎     │  │  验证引擎     │
    │ (DataBinding)│  │ (EventEngine) │  │ (Validation)  │
    └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
           │                 │                 │
           ▼                 ▼                 ▼
    ┌─────────────────────────────────────────────────────────────┐
    │                     PreviewBindingContext                      │
    │                                                                 │
    │  triggerBinding(componentId, BindingTrigger.Change, newValue)│
    │         │                                                       │
    │         ▼                                                       │
    │  ┌─────────────────────────────────────────────────────────┐ │
    │  │  查找该组件作为源的所有绑定规则                            │ │
    │  │  getBindingsForSource(sourceId).filter(b =>              │ │
    │  │    b.trigger === triggerType && b.enabled                │ │
    │  │  )                                                        │ │
    │  └─────────────────────────────────────────────────────────┘ │
    │         │                                                       │
    │         ▼                                                       │
    │  ┌─────────────────────────────────────────────────────────┐ │
    │  │  循环依赖检测 (防止无限循环)                               │ │
    │  │  - 执行栈检测: bindingStackRef                           │ │
    │  │  - 已处理检测: processedBindingsRef                      │ │
    │  │  - 循环依赖检测: isBindingInCycle()                      │ │
    │  └─────────────────────────────────────────────────────────┘ │
    │         │                                                       │
    │         ▼                                                       │
    │  ┌─────────────────────────────────────────────────────────┐ │
    │  │  值转换 (三种转换方式)                                    │ │
    │  │                                                           │ │
    │  │  1. direct: 直接传递值                                   │ │
    │  │  2. mapping: 根据映射表转换值                             │ │
    │  │     例: { "active": true, "inactive": false }          │ │
    │  │  3. custom: 执行自定义转换函数                            │ │
    │  │     例: "value.toUpperCase()"                            │ │
    │  └─────────────────────────────────────────────────────────┘ │
    │         │                                                       │
    │         ▼                                                       │
    │  ┌─────────────────────────────────────────────────────────┐ │
    │  │  更新目标组件                                             │ │
    │  │  onUpdateComponent(targetId, { [targetPath]: value })   │ │
    │  └─────────────────────────────────────────────────────────┘ │
    └─────────────────────────────────────────────────────────────┘
```

#### 3.2.3 表单提交数据流

```
表单提交流程：

┌────────────────────────────────────────────────────────────────────┐
│                    用户点击提交按钮                                  │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│              Button 组件的 handlePreviewClick()                     │
│                                                                      │
│  executeClickEvent(events?.onClick)  // 旧事件系统（向后兼容）     │
│  executeEvent(events?.onClickActions)  // 新事件系统               │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│                   事件引擎执行 FORM_SUBMIT 动作                      │
│                                                                      │
│  executeAction({                                                    │
│    type: ActionType.FormSubmit,                                    │
│    params: { formId: 'form_123' },                                │
│    enabled: true                                                   │
│  }, actionContext)                                                  │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│              ActionExecutionContext.submitForm()                     │
│                                                                      │
│  来自 PreviewFormRegistry 上下文：                                   │
│  const submitForm = usePreviewFormSubmit();                         │
│                                                                      │
│  actionContext = {                                                   │
│    submitForm: (formId) => { /* 提交逻辑 */ },                     │
│    resetForm: (formId) => { /* 重置逻辑 */ },                      │
│    navigateToPage: (pageId) => { /* 页面跳转 */ },                 │
│    openModal: (modalId) => { /* 打开弹窗 */ },                     │
│    closeModal: (modalId) => { /* 关闭弹窗 */ }                     │
│  }                                                                   │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│              PreviewFormRegistry.submitForm()                        │
│                                                                      │
│  1. 查找指定 formId 的表单组件                                       │
│  2. 收集表单内所有字段的当前值                                        │
│  3. 执行表单级验证 (validateForm)                                    │
│  4. 如果验证通过，触发 onSubmitActions 事件                          │
│  5. 调用 Form 组件的 onSubmit 回调                                   │
└────────────────────────────────────────────────────────────────────┘
```

---

## 4. 模块详细说明

### 4.1 模块一：表单组件体系

#### 4.1.1 核心目标

表单组件体系是低代码平台的核心输入能力，提供完整的表单输入、验证、数据绑定功能，支持复杂的业务表单场景。

#### 4.1.2 关键文件列表

| 文件路径 | 职责说明 | 关键内容 |
|---------|---------|---------|
| `src/types/component.ts` | 类型定义 | 组件类型枚举、Schema 定义、验证规则、数据绑定规则 |
| `src/components/ui/Input.tsx` | 输入框组件 | 单行文本输入、密码、数字、邮箱等类型 |
| `src/components/ui/Textarea.tsx` | 多行文本框 | 多行文本输入、自动高度、字数统计 |
| `src/components/ui/Select.tsx` | 下拉选择 | 单选/多选、搜索、可清除 |
| `src/components/ui/Checkbox.tsx` | 复选框 | 单个复选框、不确定状态 |
| `src/components/ui/CheckboxGroup.tsx` | 复选框组 | 多选组合、水平/垂直布局 |
| `src/components/ui/Radio.tsx` | 单选框 | 单个单选框 |
| `src/components/ui/RadioGroup.tsx` | 单选框组 | 单选组合、水平/垂直布局 |
| `src/components/ui/Switch.tsx` | 开关 | 开关切换、加载状态 |
| `src/components/ui/Form.tsx` | 表单容器 | 表单提交/重置、布局控制 |
| `src/components/ui/FormItem.tsx` | 表单项 | 标签、错误展示、必填标识 |
| `src/constants/mockData.ts` | 默认配置 | 所有表单组件的默认属性配置 |

#### 4.1.3 核心接口签名

##### ComponentType 枚举

```typescript
// src/types/component.ts
export enum ComponentType {
  // 基础组件
  Text = 'Text',
  Button = 'Button',
  Image = 'Image',
  Container = 'Container',
  
  // 高级业务组件
  Card = 'Card',
  Divider = 'Divider',
  Tabs = 'Tabs',
  TabPane = 'TabPane',
  Accordion = 'Accordion',
  AccordionItem = 'AccordionItem',
  Modal = 'Modal',
  
  // 表单组件
  Input = 'Input',
  Textarea = 'Textarea',
  Select = 'Select',
  Checkbox = 'Checkbox',
  CheckboxGroup = 'CheckboxGroup',
  Radio = 'Radio',
  RadioGroup = 'RadioGroup',
  Switch = 'Switch',
  Form = 'Form',
  FormItem = 'FormItem',
}
```
[component.ts:77-99](file:///g:/Remote/prompt%20program/React01/src/types/component.ts#L77-L99)

##### 表单组件 Schema 示例

```typescript
// src/types/component.ts
export interface InputComponentSchema extends ComponentBaseSchema {
  type: ComponentType.Input;
  props: Partial<InputProps>;
}

export interface ComponentBaseSchema {
  id: string;
  type: ComponentType;
  props: Record<string, any>;
  styles: Record<string, string>;
  x?: number;           // 画布 X 坐标
  y?: number;           // 画布 Y 坐标
  width?: number | string;
  height?: number | string;
  events?: ComponentEvents;  // 事件配置
}
```
[component.ts:182-192](file:///g:/Remote/prompt%20program/React01/src/types/component.ts#L182-L192)

### 4.2 模块二：验证引擎

#### 4.2.1 核心目标

验证引擎提供统一的表单验证机制，支持多种验证规则、多触发时机、自定义验证函数，确保表单数据的完整性和正确性。

#### 4.2.2 关键文件列表

| 文件路径 | 职责说明 | 关键内容 |
|---------|---------|---------|
| `src/utils/formValidation.ts` | 验证引擎核心 | 所有验证规则实现、单字段/表单级验证 API |
| `src/types/component.ts` | 类型定义 | ValidationRule、ValidationResult、FieldValidationConfig |

#### 4.2.3 核心接口签名

##### ValidationRule 接口

```typescript
// src/utils/formValidation.ts
export type ValidationRuleType =
  | 'required'
  | 'minLength'
  | 'maxLength'
  | 'min'
  | 'max'
  | 'pattern'
  | 'email'
  | 'url'
  | 'custom';

export interface ValidationRule {
  type: ValidationRuleType;
  message?: string;           // 自定义错误消息
  value?: number | string | boolean | RegExp;  // 规则参数值
  customValidator?: (value: any) => boolean | string;  // 自定义验证函数
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
```
[formValidation.ts:11-32](file:///g:/Remote/prompt%20program/React01/src/utils/formValidation.ts#L11-L32)

##### 验证规则说明

| 规则类型 | 参数 | 描述 | 默认错误消息 |
|---------|------|------|-------------|
| `required` | 无 | 必填验证 | "此字段为必填项" |
| `minLength` | `value: number` | 最小长度 | "最少需要 {n} 个字符" |
| `maxLength` | `value: number` | 最大长度 | "最多允许 {n} 个字符" |
| `min` | `value: number` | 最小值 | "最小值为 {n}" |
| `max` | `value: number` | 最大值 | "最大值为 {n}" |
| `pattern` | `value: string\|RegExp` | 正则匹配 | "格式不正确" |
| `email` | 无 | 邮箱格式 | "请输入有效的邮箱地址" |
| `url` | 无 | URL 格式 | "请输入有效的 URL" |
| `custom` | `customValidator` | 自定义验证 | "验证失败" |

##### 核心 API

```typescript
// src/utils/formValidation.ts

// 单字段验证
export const validateField = (
  value: any,
  rules: ValidationRule[]
): ValidationResult => {
  const errors: string[] = [];
  for (const rule of rules) {
    const error = validateRule(value, rule);
    if (error) {
      errors.push(error);
    }
  }
  return {
    valid: errors.length === 0,
    errors,
  };
};

// 表单级验证
export const validateForm = (
  fields: Record<string, { value: any; rules: ValidationRule[] }>
): Record<string, ValidationResult> => {
  const results: Record<string, ValidationResult> = {};
  for (const [fieldName, field] of Object.entries(fields)) {
    results[fieldName] = validateField(field.value, field.rules);
  }
  return results;
};
```
[formValidation.ts:216-245](file:///g:/Remote/prompt%20program/React01/src/utils/formValidation.ts#L216-L245)

### 4.3 模块三：数据绑定

#### 4.3.1 核心目标

数据绑定模块实现组件间的数据联动能力，支持配置源组件和目标组件之间的值映射关系，实现无代码的数据联动效果。

#### 4.3.2 关键文件列表

| 文件路径 | 职责说明 | 关键内容 |
|---------|---------|---------|
| `src/context/DataBindingContext.tsx` | 编辑模式绑定上下文 | 绑定规则管理、触发绑定、循环依赖检测 |
| `src/context/PreviewBindingContext.tsx` | 预览模式绑定上下文 | 预览模式下的值存储和绑定触发 |
| `src/types/component.ts` | 类型定义 | DataBindingRule、BindingTrigger、BindingPath |

#### 4.3.3 核心接口签名

##### DataBindingRule 接口

```typescript
// src/types/component.ts
export enum BindingTrigger {
  Change = 'change',  // 值变更时触发
  Input = 'input',    // 输入过程中触发
  Manual = 'manual',  // 手动触发
}

export enum BindingPath {
  Value = 'value',
  Options = 'options',
  Disabled = 'disabled',
  Visible = 'visible',
  Label = 'label',
  Placeholder = 'placeholder',
}

export interface DataBindingRule {
  id: string;                    // 规则唯一标识
  sourceId: string;              // 源组件 ID
  targetId: string;              // 目标组件 ID
  sourcePath: string;            // 源属性路径
  targetPath: string;            // 目标属性路径
  trigger: BindingTrigger;       // 触发时机
  transformType?: 'direct' | 'mapping' | 'custom';  // 值转换方式
  mapping?: Record<string, any>; // 映射表
  customTransform?: string;      // 自定义转换函数代码
  enabled: boolean;              // 是否启用
  label?: string;                // 规则标签
  createdAt: string;
  updatedAt: string;
}
```
[component.ts:21-50](file:///g:/Remote/prompt%20program/React01/src/types/component.ts#L21-L50)

#### 4.3.4 值转换方式

```typescript
// src/context/DataBindingContext.tsx
const transformValue = React.useCallback((
  value: any,
  rule: DataBindingRule
): any => {
  switch (rule.transformType) {
    case 'mapping':
      if (rule.mapping && value !== undefined && value !== null) {
        const key = String(value);
        if (key in rule.mapping) {
          return rule.mapping[key];
        }
      }
      return value;

    case 'custom':
      if (rule.customTransform) {
        try {
          const fn = new Function('value', `return ${rule.customTransform}`);
          return fn(value);
        } catch (error) {
          logger.error('自定义转换函数执行失败', { error, transform: rule.customTransform });
          return value;
        }
      }
      return value;

    case 'direct':
    default:
      return value;
  }
}, []);
```
[DataBindingContext.tsx:131-161](file:///g:/Remote/prompt%20program/React01/src/context/DataBindingContext.tsx#L131-L161)

### 4.4 模块四：事件交互系统

#### 4.4.1 核心目标

事件交互系统提供统一的"事件-动作"执行机制，支持为组件配置各种交互行为，实现无代码的业务逻辑编排。

#### 4.4.2 关键文件列表

| 文件路径 | 职责说明 | 关键内容 |
|---------|---------|---------|
| `src/utils/eventEngine.ts` | 事件引擎核心 | 动作执行器、事件上下文、动作工厂 |
| `src/types/component.ts` | 类型定义 | ActionType、EventType、ActionConfig、EventConfig |
| `src/context/PreviewFormRegistry.tsx` | 表单注册表单 | 表单提交/重置的上下文实现 |
| `src/context/PreviewModalRegistry.tsx` | 弹窗注册表单 | 弹窗显示/隐藏的上下文实现 |

#### 4.4.3 核心接口签名

##### 事件和动作类型

```typescript
// src/types/component.ts
export enum EventType {
  Click = 'onClick',
  Change = 'onChange',
  Submit = 'onSubmit',
  Focus = 'onFocus',
  Blur = 'onBlur',
}

export enum ActionType {
  ShowAlert = 'SHOW_ALERT',
  NavigateUrl = 'NAVIGATE_URL',
  NavigatePage = 'NAVIGATE_PAGE',
  ConsoleLog = 'CONSOLE_LOG',
  CustomScript = 'CUSTOM_SCRIPT',
  FormSubmit = 'FORM_SUBMIT',
  FormReset = 'FORM_RESET',
  ShowModal = 'SHOW_MODAL',
  HideModal = 'HIDE_MODAL',
}
```
[component.ts:118-128](file:///g:/Remote/prompt%20program/React01/src/types/component.ts#L118-L128)

##### 执行上下文接口

```typescript
// src/utils/eventEngine.ts
export interface ActionExecutionContext {
  submitForm?: (formId?: string) => void;
  resetForm?: (formId?: string) => void;
  navigateToPage?: (pageId: string) => void;
  openModal?: (modalId: string) => void;
  closeModal?: (modalId: string) => void;
}
```
[eventEngine.ts:8-14](file:///g:/Remote/prompt%20program/React01/src/utils/eventEngine.ts#L8-L14)

#### 4.4.4 核心执行 API

```typescript
// src/utils/eventEngine.ts

// 执行单个动作
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
    // ... 其他动作类型
    default:
      console.warn('未知的动作类型:', action.type);
  }
};

// 按顺序执行多个动作
export const executeActions = (
  actions: ActionConfig[],
  context?: ActionExecutionContext
): void => {
  for (const action of actions) {
    executeAction(action, context);
  }
};
```
[eventEngine.ts:144-201](file:///g:/Remote/prompt%20program/React01/src/utils/eventEngine.ts#L144-L201)

### 4.5 模块五：高级业务组件

#### 4.5.1 核心目标

高级业务组件提供复杂业务场景下的容器组件，支持内容嵌套、状态管理、事件交互，满足卡片、标签页、手风琴、弹窗等常见 UI 模式。

#### 4.5.2 关键文件列表

| 文件路径 | 职责说明 | 关键内容 |
|---------|---------|---------|
| `src/components/ui/Card.tsx` | 卡片组件 | 阴影、边框、头部标题、悬停效果 |
| `src/components/ui/Divider.tsx` | 分割线组件 | 水平/垂直方向、文字位置、虚线样式 |
| `src/components/ui/Tabs.tsx` | 标签页组件 | 标签切换、动画、可添加标签 |
| `src/components/ui/Accordion.tsx` | 手风琴组件 | 折叠/展开、多项展开 |
| `src/components/ui/Modal.tsx` | 弹窗组件 | 对话框、确认框、输入框 |

### 4.6 模块六：画布交互增强

#### 4.6.1 核心目标

画布交互增强提供提升编辑效率的交互功能，包括智能对齐辅助线、组件多选操作、组件缩放功能，让低代码编辑更加直观和高效。

#### 4.6.2 关键文件列表

| 文件路径 | 职责说明 | 关键内容 |
|---------|---------|---------|
| `src/hooks/useAlignmentGuides.ts` | 对齐辅助线 Hook | 对齐检测、辅助线计算、吸附逻辑 |
| `src/hooks/useMultiSelect.ts` | 多选操作 Hook | Shift+点击、选中状态管理、批量操作 |
| `src/hooks/useResize.ts` | 组件缩放 Hook | 8 方向手柄、尺寸计算、最小尺寸限制 |
| `src/components/builder/DndContext.tsx` | 拖拽上下文 | 集成对齐辅助线到拖拽流程 |
| `src/components/builder/Canvas/index.tsx` | 画布组件 | 渲染对齐辅助线、集成缩放手柄 |

#### 4.6.3 核心接口签名

##### 对齐辅助线

```typescript
// src/hooks/useAlignmentGuides.ts
export type AlignmentType =
  | 'left'           // 左边缘对齐
  | 'right'          // 右边缘对齐
  | 'centerH'        // 水平居中对齐
  | 'top'            // 上边缘对齐
  | 'bottom'         // 下边缘对齐
  | 'centerV'        // 垂直居中对齐
  | 'canvasLeft'     // 画布左边缘对齐
  | 'canvasRight'    // 画布右边缘对齐
  | 'canvasTop'      // 画布上边缘对齐
  | 'canvasBottom'   // 画布下边缘对齐
  | 'canvasCenterH'  // 画布水平居中对齐
  | 'canvasCenterV'; // 画布垂直居中对齐

export interface AlignmentGuide {
  type: AlignmentType;
  position: number;           // 辅助线位置坐标
  isCanvasEdge: boolean;      // 是否为画布边缘对齐
  targetComponentId?: string; // 对齐的目标组件 ID
}

export interface AlignmentResult {
  guides: AlignmentGuide[];   // 激活的辅助线列表
  snappedX: number;           // 吸附后的 X 坐标
  snappedY: number;           // 吸附后的 Y 坐标
}

// 吸附容差（像素）
const SNAP_TOLERANCE = 8;
```
[useAlignmentGuides.ts:5-44](file:///g:/Remote/prompt%20program/React01/src/hooks/useAlignmentGuides.ts#L5-L44)

##### 组件缩放

```typescript
// src/hooks/useResize.ts
export type ResizeHandle = 
  | 'top' 
  | 'bottom' 
  | 'left' 
  | 'right' 
  | 'topLeft' 
  | 'topRight' 
  | 'bottomLeft' 
  | 'bottomRight';

// 手柄配置
const HANDLE_CONFIGS: Record<ResizeHandle, HandleConfig> = {
  top: { affectsWidth: false, affectsHeight: true, xDirection: 0, yDirection: -1 },
  bottom: { affectsWidth: false, affectsHeight: true, xDirection: 0, yDirection: 1 },
  left: { affectsWidth: true, affectsHeight: false, xDirection: -1, yDirection: 0 },
  right: { affectsWidth: true, affectsHeight: false, xDirection: 1, yDirection: 0 },
  topLeft: { affectsWidth: true, affectsHeight: true, xDirection: -1, yDirection: -1 },
  topRight: { affectsWidth: true, affectsHeight: true, xDirection: 1, yDirection: -1 },
  bottomLeft: { affectsWidth: true, affectsHeight: true, xDirection: -1, yDirection: 1 },
  bottomRight: { affectsWidth: true, affectsHeight: true, xDirection: 1, yDirection: 1 },
};

// 最小尺寸限制
const COMPONENT_MIN_SIZE = {
  WIDTH: 16,
  HEIGHT: 16,
};
```
[useResize.ts:7-59](file:///g:/Remote/prompt%20program/React01/src/hooks/useResize.ts#L7-L59)

---

## 5. 模块集成点

### 5.1 事件引擎消费表单组件的 onChange

#### 5.1.1 集成机制

事件引擎与表单组件的集成发生在 `ComponentRenderer` 中，通过统一的事件处理函数实现：

```typescript
// src/components/builder/ComponentRenderer/index.tsx
case ComponentType.Input: {
  // ...
  
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    triggerValueChange(newValue);  // 1. 触发数据绑定
    if (!editable) {
      executeEvent(events?.onChangeActions);  // 2. 执行事件动作
    }
    if (restInputProps.onChange) {
      restInputProps.onChange(e);  // 3. 调用用户自定义回调
    }
  };
  
  // ...
  <Input
    onChange={handleValueChange}
    // ...
  />
}
```
[ComponentRenderer/index.tsx:986-1044](file:///g:/Remote/prompt%20program/React01/src/components/builder/ComponentRenderer/index.tsx#L986-L1044)

### 5.2 预览模式渲染表单组件和高级组件

#### 5.2.1 模式切换机制

`ComponentRenderer` 通过 `editable` 参数控制编辑/预览模式：

```typescript
// src/components/builder/ComponentRenderer/index.tsx
const ComponentRenderer: React.FC<ComponentRendererProps> = ({
  component,
  isSelected = false,
  onClick,
  editable = true,  // 默认编辑模式
}) => {
  const previewBinding = React.useContext(PreviewBindingContext);
  const isPreviewMode = !editable && previewBinding !== null;
  
  // 预览模式下：
  // - 组件可交互（pointer-events 不阻止）
  // - 集成数据绑定
  // - 执行事件动作
  // - 表单组件可输入、可选择
  
  // 编辑模式下：
  // - 组件不可交互（pointer-events: none）
  // - 显示选中高亮
  // - 支持拖拽和缩放
};
```
[ComponentRenderer/index.tsx:334-347](file:///g:/Remote/prompt%20program/React01/src/components/builder/ComponentRenderer/index.tsx#L334-L347)

### 5.3 画布缩放与现有拖拽系统的关系

#### 5.3.1 两者关系

```
┌─────────────────────────────────────────────────────────────────┐
│                      画布交互系统关系图                            │
└─────────────────────────────────────────────────────────────────┘

                    组件选中状态
                           │
            ┌──────────────┴──────────────┐
            ▼                             ▼
     ┌───────────────┐              ┌───────────────┐
     │  拖拽系统      │              │  缩放功能      │
     │  (DnD-Kit)    │              │  (useResize)   │
     └───────┬───────┘              └───────┬───────┘
             │                               │
             ▼                               ▼
     ┌───────────────┐              ┌───────────────┐
     │ 位置调整 (x,y)│              │ 尺寸调整       │
     │ 对齐辅助线检测 │              │ (width,height)│
     │ 容器嵌套拖拽  │              │ 8 方向手柄     │
     └───────────────┘              └───────────────┘
             │                               │
             └───────────────┬───────────────┘
                             ▼
                    状态同步 (useBuilderStore)
```

---

## 6. 已知限制与改进建议

### 6.1 已知限制

#### 6.1.1 表单组件限制

| 限制项 | 当前状态 | 影响范围 |
|-------|---------|---------|
| **性能 - 大量表单验证** | 同步验证，无防抖 | 表单字段较多时可能影响输入流畅度 |
| **异步验证** | 仅支持同步验证规则 | 无法支持需要后端接口的验证 |
| **验证规则复用** | 每个字段独立配置 | 相同验证规则需要重复配置 |
| **表单数据收集** | 依赖手动绑定 | 无法自动收集表单内所有字段值 |

#### 6.1.2 数据绑定限制

| 限制项 | 当前状态 | 影响范围 |
|-------|---------|---------|
| **绑定方向** | 仅支持单向绑定 | 无法实现双向绑定场景 |
| **批量更新** | 逐个更新目标组件 | 多个绑定规则触发时无批量优化 |
| **条件绑定** | 无条件判断能力 | 无法实现"当源值大于 0 时才绑定" |

#### 6.1.3 事件系统限制

| 限制项 | 当前状态 | 影响范围 |
|-------|---------|---------|
| **动作执行顺序** | 同步按顺序执行 | 无法支持异步动作 |
| **动作依赖** | 动作间无数据传递 | 前一个动作的结果无法作为后一个动作的输入 |
| **条件执行** | 无条件判断能力 | 无法实现"当表单验证通过才提交" |

#### 6.1.4 画布交互限制

| 限制项 | 当前状态 | 影响范围 |
|-------|---------|---------|
| **对齐辅助线** | 仅在拖拽时显示 | 缩放时不显示对齐辅助线 |
| **多选操作** | Shift+点击 | 不支持框选（拉框选择） |
| **组件缩放** | 单组件缩放 | 不支持多选后批量缩放 |

### 6.2 后续改进建议

#### 6.2.1 表单组件性能优化

**建议**：
1. **添加防抖验证**：对于 `validateOnChange`，添加 300ms 防抖，避免输入过程中频繁验证
2. **虚拟滚动**：表单字段数量超过 50 个时，考虑使用虚拟滚动
3. **验证结果缓存**：相同值的验证结果可以缓存，避免重复计算

**实现示例**：
```typescript
// 建议的防抖验证实现
import { debounce } from 'lodash';

const debouncedValidate = debounce((value, rules) => {
  return validateField(value, rules);
}, 300);
```

#### 6.2.2 扩展验证规则

**建议**：
1. **添加异步验证支持**：支持 `async` 类型的验证规则，可以调用后端接口
2. **验证规则模板**：提供常用验证规则模板（手机号、身份证号、密码强度等）
3. **表单级验证**：支持跨字段验证（如"密码确认"需要等于"密码"）

**新增验证规则示例**：
```typescript
// 建议的新验证规则类型
export type ValidationRuleType =
  | 'required'
  | 'minLength'
  | 'maxLength'
  // ... 现有规则
  | 'phone'        // 手机号
  | 'idCard'       // 身份证号
  | 'password'     // 密码强度
  | 'sameAs'       // 等于另一个字段
  | 'async';       // 异步验证
```

#### 6.2.3 更多高级组件扩展

**建议**：

##### 表格组件 (Table)
- 功能：数据展示、排序、分页、筛选、行选择
- 特性：
  - 支持静态数据和动态数据绑定
  - 支持列配置（排序、筛选、自定义渲染）
  - 支持行选择（单选/多选）
  - 支持分页（前端分页/后端分页）

##### 树形控件 (Tree)
- 功能：层级数据展示、节点展开/折叠、节点选择
- 特性：
  - 支持嵌套数据结构
  - 支持节点勾选（父子联动）
  - 支持拖拽调整节点顺序
  - 支持搜索过滤

##### 数据展示组件
- **图表组件**：集成 ECharts 或 Chart.js，支持柱状图、折线图、饼图等
- **数据列表**：支持虚拟滚动的大数据列表
- **时间线**：时间轴样式的内容展示

#### 6.2.4 事件系统增强

**建议**：
1. **异步动作支持**：支持 `async/await` 动作，如等待接口返回后再执行后续动作
2. **动作数据流**：支持动作间的数据传递，前一个动作的返回值作为后一个动作的输入
3. **条件执行**：支持 `if/else` 条件判断，根据不同条件执行不同动作
4. **循环执行**：支持 `for/forEach` 循环，对数组数据批量执行动作

**条件执行示例**：
```typescript
// 建议的条件动作配置
{
  type: 'IF_THEN_ELSE',
  condition: 'formData.isValid === true',
  thenActions: [
    { type: 'FORM_SUBMIT', params: { formId: 'form1' } },
    { type: 'SHOW_ALERT', params: { alertMessage: '提交成功' } }
  ],
  elseActions: [
    { type: 'SHOW_ALERT', params: { alertMessage: '请检查表单填写' } }
  ]
}
```

#### 6.2.5 画布交互增强

**建议**：
1. **框选功能**：支持鼠标拉框选择多个组件
2. **对齐工具栏**：提供对齐按钮（左对齐、右对齐、水平居中、垂直居中、等宽、等高、等间距）
3. **网格吸附增强**：支持自定义网格大小，可开关网格吸附
4. **缩放时对齐**：缩放组件时也显示对齐辅助线

#### 6.2.6 数据绑定增强

**建议**：
1. **双向绑定**：支持 `source ↔ target` 的双向绑定
2. **表达式绑定**：支持 `{{source.value + target.value}}` 形式的表达式
3. **数组操作**：支持对数组类型数据的元素级绑定
4. **绑定调试**：提供绑定执行日志，方便排查问题

---

## 附录

### A. 相关文档索引

| 文档路径 | 描述 |
|---------|------|
| `docs/architecture/overview.md` | A 系列架构综述文档 |
| `docs/architecture/form-system.md` | 表单系统架构设计文档 |
| `docs/architecture/event-system.md` | 事件系统架构设计文档 |
| `docs/PERSISTENCE-ARCHITECTURE.md` | 持久化模块架构设计 |
| `docs/architecture/PREVIEW-MODE-ARCHITECTURE.md` | 预览模式架构设计 |
| `docs/architecture/KEYBOARD-SHORTCUTS-ARCHITECTURE.md` | 键盘快捷键架构说明 |

### B. 自测文档索引

| 文档路径 | 描述 |
|---------|------|
| `src/docs/CANVAS_INTERACTIONS_SELF_TEST.md` | 画布交互增强功能自测文档 |
| `docs/事件交互系统自测文档.md` | 事件系统自测文档 |
| `docs/表单验证引擎自测文档.md` | 表单验证引擎自测文档 |
| `docs/高级业务组件自测文档.md` | 高级业务组件自测文档 |

### C. 测试文件索引

| 文件路径 | 描述 |
|---------|------|
| `src/hooks/useAlignmentGuides.test.ts` | 对齐辅助线功能单元测试 |
| `src/hooks/useResize.test.ts` | 缩放功能单元测试 |
| `src/hooks/useMultiSelect.test.ts` | 多选功能单元测试 |
| `src/utils/eventEngine.test.ts` | 事件引擎单元测试 |
| `src/utils/formValidation.test.ts` | 表单验证引擎单元测试 |
| `src/components/ui/formComponents.test.ts` | 表单组件单元测试 |
| `src/components/ui/advancedComponents.test.ts` | 高级组件单元测试 |

---

> 本文档由开发团队维护，如有问题请查阅相关自测文档或提交 Issue。
