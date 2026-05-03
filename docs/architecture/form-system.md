# 表单系统架构设计文档

## 1. 概述

本表单系统是一个低代码平台的核心组件库，提供了完整的表单组件、验证引擎和数据绑定机制。本文档详细描述了表单系统的架构设计、组件关系、核心机制和扩展方式。

### 1.1 系统目标

- 提供可拖拽、可配置的表单组件（8 个核心组件）
- 支持灵活的验证规则配置和实时验证
- 实现组件间的数据联动（数据绑定）
- 与低代码构建器无缝集成
- 支持预览模式下的真实交互

### 1.2 核心组件列表

| 组件类型 | 描述 | 支持验证 | 支持数据绑定 |
|---------|------|---------|-------------|
| Input | 单行输入框 | ✅ | ✅ |
| Textarea | 多行文本框 | ✅ | ✅ |
| Select | 下拉选择框 | ✅ | ✅ |
| Checkbox | 复选框 | ❌ | ✅ |
| CheckboxGroup | 复选框组 | ❌ | ✅ |
| Radio | 单选框 | ❌ | ✅ |
| RadioGroup | 单选框组 | ❌ | ✅ |
| Switch | 开关 | ❌ | ✅ |
| Form | 表单容器 | ✅（提交/重置） | ❌ |
| FormItem | 表单项 | ✅（错误展示） | ❌ |

---

## 2. 组件族谱图

### 2.1 组件继承关系

在 TypeScript 类型层面，所有表单组件都基于 `ComponentBaseSchema` 扩展：

```
ComponentBaseSchema
  ├── InputComponentSchema
  ├── TextareaComponentSchema
  ├── SelectComponentSchema
  ├── CheckboxComponentSchema
  ├── CheckboxGroupComponentSchema
  ├── RadioComponentSchema
  ├── RadioGroupComponentSchema
  ├── SwitchComponentSchema
  ├── FormComponentSchema (容器组件，包含 children)
  └── FormItemComponentSchema (容器组件，包含 children)
```

### 2.2 组件组合关系

表单组件在实际使用中通常采用以下组合模式：

```
Form (表单容器)
  ├── FormItem (表单项 - 包含标签、可选的验证错误展示)
  │   └── Input/Textarea/Select/Checkbox/CheckboxGroup/Radio/RadioGroup/Switch (实际表单控件)
  │
  ├── FormItem (可选的操作区域)
  │   └── Button (提交按钮)
  │
  └── FormItem (可选的操作区域)
      └── Button (重置按钮)
```

### 2.3 组件类型定义

所有组件类型定义在 `src/types/component.ts` 中：

```typescript
// 核心组件类型枚举
export enum ComponentType {
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
  // ... 其他非表单组件
}

// 组件基础 schema
export interface ComponentBaseSchema {
  id: string;
  type: ComponentType;
  props: Record<string, any>;
  styles: Record<string, string>;
  x?: number;
  y?: number;
  width?: number | string;
  height?: number | string;
  events?: ComponentEvents;
}

// 表单组件 schema 示例
export interface InputComponentSchema extends ComponentBaseSchema {
  type: ComponentType.Input;
  props: Partial<InputProps>;
}

export interface FormComponentSchema extends ComponentBaseSchema {
  type: ComponentType.Form;
  props: Partial<FormProps>;
  children?: ComponentSchema[];  // 容器组件可包含子组件
}
```

### 2.4 组件默认配置

组件默认配置定义在 `src/constants/mockData.ts` 中的 `DEFAULT_COMPONENT_CONFIGS` 对象：

```typescript
export const DEFAULT_COMPONENT_CONFIGS: Record<ComponentType, ComponentConfig> = {
  [ComponentType.Input]: {
    type: ComponentType.Input,
    label: '输入框',
    defaultWidth: 300,
    defaultHeight: 44,
    defaultProps: {
      type: 'text',
      placeholder: '请输入内容',
      disabled: false,
      readOnly: false,
      clearable: false,
      error: false,
    },
    defaultStyles: {},
  },
  // ... 其他组件配置
};
```

---

## 3. 验证引擎设计

验证引擎是表单系统的核心模块，负责处理表单验证规则的配置、执行和错误展示。

### 3.1 核心模块位置

| 文件 | 职责 |
|------|------|
| `src/utils/formValidation.ts` | 验证引擎核心实现 |
| `src/types/component.ts` | 验证相关类型定义 |
| `src/context/PreviewFormRegistry.tsx` | 预览模式下的表单注册表 |

### 3.2 验证规则类型

验证引擎支持以下验证规则类型：

```typescript
export type ValidationRuleType =
  | 'required'      // 必填验证
  | 'minLength'     // 最小长度验证
  | 'maxLength'     // 最大长度验证
  | 'min'           // 最小值验证
  | 'max'           // 最大值验证
  | 'pattern'       // 正则表达式验证
  | 'email'         // 邮箱格式验证
  | 'url'           // URL 格式验证
  | 'custom';       // 自定义验证函数
```

### 3.3 验证规则数据结构

```typescript
export interface ValidationRule {
  type: ValidationRuleType;       // 规则类型
  message?: string;                // 自定义错误提示
  value?: number | string | boolean | RegExp;  // 规则参数
  customValidator?: (value: any) => boolean | string;  // 自定义验证函数
}

export interface ValidationResult {
  valid: boolean;      // 是否验证通过
  errors: string[];    // 错误消息列表
}

export interface FieldValidationConfig {
  rules: ValidationRule[];        // 验证规则列表
  validateOnChange?: boolean;      // 实时验证（值变化时）
  validateOnBlur?: boolean;        // 失焦验证
}
```

### 3.4 验证执行流程

```
┌─────────────────────────────────────────────────────────────────┐
│                         验证执行流程                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 用户输入/选择值                                              │
│         │                                                       │
│         ▼                                                       │
│  2. 检查验证时机配置                                             │
│     ├── validateOnChange = true  → 立即触发验证                 │
│     ├── validateOnBlur = true    → 失焦时触发验证              │
│     └── 两者都不启用              → 仅提交时验证                 │
│         │                                                       │
│         ▼                                                       │
│  3. 执行 validateField()                                        │
│     ├── 遍历所有 ValidationRule                                  │
│     ├── 根据 type 调用对应的验证函数                             │
│     │   ├── validateRequired()     → 必填验证                   │
│     │   ├── validateEmail()        → 邮箱格式验证               │
│     │   ├── validateMinLength()    → 最小长度验证               │
│     │   ├── validatePattern()      → 正则验证                   │
│     │   └── validateCustom()       → 自定义验证                  │
│     ├── 收集所有错误消息                                          │
│     └── 返回 ValidationResult                                    │
│         │                                                       │
│         ▼                                                       │
│  4. 更新组件状态                                                 │
│     ├── 标记 touched = true                                     │
│     ├── 设置 error = 第一条错误消息                              │
│     └── 更新组件视觉反馈（红色边框/错误文字）                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.5 验证引擎核心函数

#### 3.5.1 单字段验证

```typescript
// 执行单字段验证
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
```

#### 3.5.2 表单级验证

```typescript
// 执行整个表单的验证
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

#### 3.5.3 验证规则执行

```typescript
// 根据规则类型执行对应的验证函数
export const validateRule = (
  value: any,
  rule: ValidationRule
): string | null => {
  switch (rule.type) {
    case 'required':
      return validateRequired(value, rule.message);
    case 'minLength':
      return validateMinLength(value, rule.value as number, rule.message);
    case 'maxLength':
      return validateMaxLength(value, rule.value as number, rule.message);
    case 'min':
      return validateMin(value, rule.value as number, rule.message);
    case 'max':
      return validateMax(value, rule.value as number, rule.message);
    case 'pattern':
      return validatePattern(value, rule.value as string | RegExp, rule.message);
    case 'email':
      return validateEmail(value, rule.message);
    case 'url':
      return validateUrl(value, rule.message);
    case 'custom':
      if (rule.customValidator) {
        return validateCustom(value, rule.customValidator, rule.message);
      }
      return null;
    default:
      return null;
  }
};
```

### 3.6 错误收集与展示

#### 3.6.1 错误状态管理

表单组件内部维护验证状态：

```typescript
export interface FormFieldState {
  value: any;              // 当前值
  error: string | null;    // 错误消息（第一条）
  touched: boolean;        // 是否已交互
  valid: boolean;          // 是否验证通过
  validationResult?: ValidationResult;  // 完整验证结果
}
```

#### 3.6.2 视觉反馈

验证错误通过以下方式展示：

1. **组件级别**：
   - Input/Textarea/Select 组件显示红色边框
   - 组件下方显示错误提示文字（errorMessage）

2. **FormItem 级别**：
   - 标签显示红色星号（必填）
   - 底部显示错误信息区域

### 3.7 验证规则序列化

由于验证规则需要持久化到项目数据中，提供了序列化/反序列化函数：

```typescript
// 序列化（去除不可序列化的函数）
export const serializeValidationRules = (rules: ValidationRule[]): string => {
  return JSON.stringify(rules.map(rule => {
    const { customValidator, ...rest } = rule;
    return rest;
  }));
};

// 反序列化
export const deserializeValidationRules = (serialized: string): ValidationRule[] => {
  try {
    return JSON.parse(serialized);
  } catch {
    return [];
  }
};
```

> **注意**：`customValidator` 函数在序列化时会被移除，因为函数无法序列化为 JSON。

---

## 4. 数据绑定设计

数据绑定机制实现了组件间的数据联动，例如：选择国家后城市下拉框自动更新。

### 4.1 核心模块位置

| 文件 | 职责 |
|------|------|
| `src/context/DataBindingContext.tsx` | 编辑模式下的绑定管理 |
| `src/context/PreviewBindingContext.tsx` | 预览模式下的绑定执行 |
| `src/types/component.ts` | 绑定相关类型定义 |

### 4.2 绑定规则数据结构

```typescript
// 绑定触发方式
export enum BindingTrigger {
  Change = 'change',   // 值变更时触发
  Input = 'input',     // 输入时触发（实时）
  Manual = 'manual',   // 手动触发
}

// 可绑定的属性路径
export enum BindingPath {
  Value = 'value',          // 组件值
  Options = 'options',      // 选项列表
  Disabled = 'disabled',    // 禁用状态
  Visible = 'visible',      // 可见性
  Label = 'label',          // 标签
  Placeholder = 'placeholder',  // 占位符
}

// 绑定规则
export interface DataBindingRule {
  id: string;                    // 规则唯一标识
  sourceId: string;              // 源组件 ID
  targetId: string;              // 目标组件 ID
  sourcePath: string;            // 源属性路径
  targetPath: string;            // 目标属性路径
  trigger: BindingTrigger;       // 触发方式
  transformType?: 'direct' | 'mapping' | 'custom';  // 转换方式
  mapping?: Record<string, any>; // 映射表（mapping 转换时）
  customTransform?: string;      // 自定义转换函数代码
  enabled: boolean;              // 是否启用
  label?: string;                // 规则标签
  createdAt: string;             // 创建时间
  updatedAt: string;             // 更新时间
}
```

### 4.3 转换方式说明

| 转换方式 | 说明 | 使用场景 |
|---------|------|---------|
| `direct` | 直接传递值 | 简单的值传递，如输入框 A → 输入框 B |
| `mapping` | 根据映射表转换 | 枚举值映射，如国家代码 → 城市列表 |
| `custom` | 执行自定义函数 | 复杂的逻辑转换，如计算、格式化 |

### 4.4 useFormBinding Hook 数据流

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          useFormBinding 数据流                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────┐                                                    │
│  │   源组件值变更    │                                                    │
│  │  (Select/Input)  │                                                    │
│  └────────┬─────────┘                                                    │
│           │                                                               │
│           ▼                                                               │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                triggerBinding(sourceId, triggerType, value)      │  │
│  │  ┌──────────────────────────────────────────────────────────────┐ │  │
│  │  │ 1. 根据 sourceId 查找匹配的绑定规则                           │ │  │
│  │  │ 2. 检查规则是否启用、触发方式是否匹配                          │ │  │
│  │  │ 3. 检查是否存在循环依赖（防无限循环）                          │ │  │
│  │  │ 4. 根据 transformType 转换值                                  │ │  │
│  │  │    ├── direct: 直接传递                                       │ │  │
│  │  │    ├── mapping: 根据 mapping 表查找                           │ │  │
│  │  │    └── custom: 执行自定义函数                                 │ │  │
│  │  │ 5. 更新目标组件的 targetPath 属性                             │ │  │
│  │  └──────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│           │                                                               │
│           ▼                                                               │
│  ┌──────────────────┐                                                    │
│  │   目标组件更新    │                                                    │
│  │  (options/value) │                                                    │
│  └──────────────────┘                                                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.5 与 Store 的关系

数据绑定规则通过 Zustand Store 管理和持久化：

```typescript
// src/store/useBuilderStore.ts

export interface BuilderState {
  // ... 其他状态
  bindings: DataBindingRule[];  // 绑定规则列表
  
  // 绑定相关方法
  addBinding: (binding: Omit<DataBindingRule, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateBinding: (id: string, updates: Partial<DataBindingRule>) => void;
  removeBinding: (id: string) => void;
  setBindings: (bindings: DataBindingRule[]) => void;
  getBindingsForSource: (sourceId: string) => DataBindingRule[];
  getBindingsForTarget: (targetId: string) => DataBindingRule[];
}
```

### 4.6 防无限循环机制

#### 4.6.1 循环检测策略

系统采用多层防护机制防止无限循环：

1. **执行栈检测**：使用 `bindingStackRef` 记录当前执行中的绑定 ID 栈
2. **已处理集合**：使用 `processedBindingsRef` 记录已处理的绑定 ID
3. **循环检测算法**：使用深度优先搜索（DFS）检测循环依赖

#### 4.6.2 核心实现

```typescript
// src/context/DataBindingContext.tsx

// 执行栈：防止同一绑定被重复执行
const bindingStackRef = React.useRef<string[]>([]);

// 已处理集合：防止无限循环
const processedBindingsRef = React.useRef<Set<string>>(new Set());

// 循环检测：使用 DFS 检测是否存在循环依赖
const detectCycle = React.useCallback((
  startId: string,
  visited: Set<string> = new Set()
): boolean => {
  const sourceBindings = bindings.filter((b) => b.sourceId === startId && b.enabled);
  
  for (const binding of sourceBindings) {
    if (visited.has(binding.targetId)) {
      return true;  // 找到循环
    }
    visited.add(binding.targetId);
    if (detectCycle(binding.targetId, visited)) {
      return true;
    }
    visited.delete(binding.targetId);  // 回溯
  }
  return false;
}, [bindings]);

// 绑定执行时的防护
const triggerBinding = React.useCallback((
  sourceId: string,
  triggerType: BindingTrigger,
  sourceValue: any
) => {
  for (const binding of sourceBindings) {
    // 防护 1：已处理的绑定跳过
    if (processedBindingsRef.current.has(binding.id)) {
      continue;
    }

    // 防护 2：检测执行栈
    if (bindingStackRef.current.includes(binding.id)) {
      logger.warn('检测到循环绑定，跳过执行', { bindingId: binding.id });
      continue;
    }

    // 防护 3：检测循环依赖
    if (isBindingInCycle(binding.id)) {
      logger.warn('绑定规则存在循环依赖，跳过执行', { bindingId: binding.id });
      continue;
    }

    // 入栈执行
    bindingStackRef.current.push(binding.id);
    processedBindingsRef.current.add(binding.id);

    try {
      // 执行绑定逻辑...
    } finally {
      // 出栈
      bindingStackRef.current.pop();
    }
  }

  processedBindingsRef.current.clear();
}, [/* ... */]);
```

### 4.7 编辑模式 vs 预览模式

数据绑定在两种模式下有不同的实现：

| 特性 | 编辑模式 | 预览模式 |
|------|---------|---------|
| Context | `DataBindingContext` | `PreviewBindingContext` |
| 主要职责 | 绑定规则的增删改查 | 绑定规则的实际执行 |
| 组件状态 | 使用 Store 管理 | 使用本地 useState 管理 |
| 触发方式 | 配置时设置 | 实际交互时执行 |

---

## 5. 与构建器的集成

表单组件通过统一的机制与低代码构建器集成。

### 5.1 ComponentRenderer 渲染逻辑

#### 5.1.1 渲染流程

`ComponentRenderer` 组件负责根据 `ComponentSchema` 渲染实际的 UI 组件：

```
┌──────────────────────────────────────────────────────────────────────┐
│                     ComponentRenderer 渲染流程                         │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  输入: ComponentSchema                                               │
│  {                                                                    │
│    id: "input-1",                                                    │
│    type: ComponentType.Input,                                        │
│    props: { placeholder: "请输入", disabled: false, ... },          │
│    styles: { width: "300px", ... },                                 │
│    // ...                                                            │
│  }                                                                    │
│                                                                      │
│  流程:                                                               │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ 1. 检查 editable 参数                                          │  │
│  │    ├── editable = true  → 编辑模式                             │  │
│  │    │   ├── 组件可拖拽、可选中                                   │  │
│  │    │   ├── 指针事件禁用 (pointer-events-none)                 │  │
│  │    │   └── 使用 useSortable 包裹                               │  │
│  │    │                                                            │  │
│  │    └── editable = false → 预览模式                             │  │
│  │        ├── 组件可真实交互                                       │  │
│  │        ├── 使用 PreviewBindingContext                          │  │
│  │        └── 使用 PreviewFormRegistryContext                    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  2. 根据 type 进入对应的 switch case                                 │
│  3. 从 schema 中提取 props 和 styles                                 │
│  4. 处理数据绑定（预览模式）                                          │
│     ├── 获取 Context 中的绑定值                                     │
│     ├── 监听 onChange 触发绑定                                       │
│     └── 应用绑定到目标组件                                            │
│  5. 渲染实际的 UI 组件                                                │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

#### 5.1.2 表单组件渲染示例

```typescript
// src/components/builder/ComponentRenderer/index.tsx

case ComponentType.Select: {
  const { className: selectClassName, ...restSelectProps } = props;
  
  // 预览模式下：从绑定 Context 获取动态值
  const bindingValue = getBindingValue();  // 当前选中值
  const bindingOptions = getBindingProp('options');  // 选项列表（可能动态更新）
  const bindingDisabled = getBindingProp('disabled');

  // 预览模式下：值变更时触发绑定
  const handleValueChange = (value: any) => {
    triggerValueChange(value);  // 更新 Context 中的值并触发绑定
    if (restSelectProps.onChange) {
      restSelectProps.onChange(value);
    }
  };

  const options = bindingOptions || props.options || [/* 默认选项 */];

  return (
    <Select
      options={options}
      value={bindingValue !== undefined ? bindingValue : props.value}
      disabled={bindingDisabled !== undefined ? bindingDisabled : (props.disabled || editable)}
      onChange={handleValueChange}
      // ... 其他属性
    />
  );
}
```

### 5.2 属性面板配置注册

#### 5.2.1 属性配置结构

组件的可配置属性通过 `getComponentPropertyConfig` 函数注册：

```typescript
// src/constants/propertyConfig.ts

export interface PropertyConfig {
  key: string;           // 属性键名
  label: string;         // 显示标签
  type: 'text' | 'number' | 'select' | 'color' | 'options' | 'textarea';
  category: 'basic' | 'props' | 'styles';  // 属性分类
  options?: { value: string | number; label: string }[];  // 选择型选项
  defaultValue?: any;    // 默认值
  placeholder?: string;  // 占位符
}

// 获取组件的属性配置
export const getComponentPropertyConfig = (
  type: ComponentType
): { type: ComponentType; label: string; properties: PropertyConfig[] } | null => {
  const configs: Record<ComponentType, { type: ComponentType; label: string; properties: PropertyConfig[] }> = {
    [ComponentType.Input]: {
      type: ComponentType.Input,
      label: '输入框',
      properties: [
        { key: 'placeholder', label: '占位符', type: 'text', category: 'props', placeholder: '请输入内容' },
        { key: 'type', label: '输入类型', type: 'select', category: 'props', options: [
          { value: 'text', label: '文本' },
          { value: 'password', label: '密码' },
          { value: 'number', label: '数字' },
          { value: 'email', label: '邮箱' },
        ]},
        { key: 'disabled', label: '禁用', type: 'select', category: 'props', options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ], defaultValue: 'false'},
        { key: 'maxLength', label: '最大长度', type: 'number', category: 'props', placeholder: '无限制' },
        // ... 其他属性
      ],
    },
    // ... 其他组件配置
  };
  
  return configs[type] || null;
};
```

#### 5.2.2 属性面板渲染流程

```
┌──────────────────────────────────────────────────────────────────────┐
│                     PropertyPanel 渲染流程                             │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. 获取当前选中的组件                                               │
│     selectedComponent = useBuilderStore((s) => s.selectedComponent) │
│                                                                      │
│  2. 根据组件类型获取属性配置                                          │
│     propertyConfig = getComponentPropertyConfig(selectedComponent.type) │
│                                                                      │
│  3. 按分类渲染属性编辑器                                              │
│     ├── 基础属性（basic）：id、位置、大小等                         │
│     ├── 组件属性（props）：组件特有属性                               │
│     └── 样式属性（styles）：颜色、间距等                             │
│                                                                      │
│  4. 渲染特定组件的扩展区域                                            │
│     ├── Button：事件配置区（点击事件）                                │
│     ├── Input/Textarea/Select：验证规则配置区                       │
│     └── 所有可绑定组件：数据绑定配置区                                │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

#### 5.2.3 验证规则配置 UI

```typescript
// src/components/builder/PropertyPanel/index.tsx

// 判断是否为表单项组件（支持验证）
const isFormFieldComponent = (type: ComponentType): boolean => {
  return [
    ComponentType.Input,
    ComponentType.Textarea,
    ComponentType.Select,
  ].includes(type);
};

// 渲染验证规则配置区
{isFormFieldComponent(selectedComponent.type) && (
  <PropertySection title="验证规则" isEmpty={false}>
    <ValidationRulesEditor
      rules={getValidationRules()}
      onChange={handleValidationRulesChange}
    />
  </PropertySection>
)}
```

#### 5.2.4 数据绑定配置 UI

```typescript
// 判断是否为可绑定组件
const isBindableComponent = (type: ComponentType): boolean => {
  return [
    ComponentType.Input,
    ComponentType.Textarea,
    ComponentType.Select,
    ComponentType.Checkbox,
    ComponentType.CheckboxGroup,
    ComponentType.Radio,
    ComponentType.RadioGroup,
    ComponentType.Switch,
  ].includes(type);
};

// 渲染数据绑定配置区
{isBindableComponent(selectedComponent.type) && (
  <PropertySection title="数据绑定" isEmpty={/* ... */}>
    {/* 作为源组件的绑定规则 */}
    {getBindingsForCurrentComponent.asSource.map((binding) => (
      <BindingRuleEditor
        key={binding.id}
        binding={binding}
        isSource={true}
        // ...
      />
    ))}
    
    {/* 作为目标组件的绑定规则 */}
    {getBindingsForCurrentComponent.asTarget.map((binding) => (
      <BindingRuleEditor
        key={binding.id}
        binding={binding}
        isSource={false}
        // ...
      />
    ))}
    
    {/* 添加绑定按钮 */}
    <button onClick={() => handleAddBinding('source')}>
      绑定到其他组件
    </button>
    <button onClick={() => handleAddBinding('target')}>
      从其他组件绑定
    </button>
  </PropertySection>
)}
```

### 5.3 组件面板集成

表单组件通过 `COMPONENT_PANEL_ITEMS` 注册到组件面板：

```typescript
// src/constants/mockData.ts

export const COMPONENT_PANEL_ITEMS: ComponentPanelItem[] = [
  // 基础组件
  { type: ComponentType.Text, label: '文本', category: 'basic' },
  { type: ComponentType.Button, label: '按钮', category: 'basic' },
  { type: ComponentType.Image, label: '图片', category: 'basic' },
  { type: ComponentType.Container, label: '容器', category: 'layout' },
  
  // 表单组件
  { type: ComponentType.Input, label: '输入框', category: 'form' },
  { type: ComponentType.Textarea, label: '多行文本', category: 'form' },
  { type: ComponentType.Select, label: '下拉选择', category: 'form' },
  { type: ComponentType.Checkbox, label: '复选框', category: 'form' },
  { type: ComponentType.CheckboxGroup, label: '复选框组', category: 'form' },
  { type: ComponentType.Radio, label: '单选框', category: 'form' },
  { type: ComponentType.RadioGroup, label: '单选框组', category: 'form' },
  { type: ComponentType.Switch, label: '开关', category: 'form' },
  { type: ComponentType.Form, label: '表单', category: 'form' },
  { type: ComponentType.FormItem, label: '表单项', category: 'form' },
];
```

---

## 6. 验证规则扩展指南

### 6.1 验证引擎的可扩展性

验证引擎采用**策略模式**设计，新增验证规则需要修改以下位置：

1. `src/utils/formValidation.ts` - 验证规则类型和验证函数
2. `src/constants/propertyConfig.ts` - 属性面板中的规则类型选项

### 6.2 新增验证规则步骤

假设要新增一个 `phone`（手机号）验证规则：

#### 步骤 1：扩展验证规则类型

```typescript
// src/utils/formValidation.ts

// 1.1 更新 ValidationRuleType
export type ValidationRuleType =
  | 'required'
  | 'minLength'
  | 'maxLength'
  | 'min'
  | 'max'
  | 'pattern'
  | 'email'
  | 'url'
  | 'custom'
  | 'phone';  // 新增

// 1.2 定义手机号正则
const PHONE_PATTERN = /^1[3-9]\d{9}$/;

// 1.3 实现验证函数
export const validatePhone = (
  value: any,
  message?: string
): string | null => {
  if (isEmpty(value)) return null;  // 空值跳过（由 required 规则处理）
  
  const strValue = String(value);
  if (!PHONE_PATTERN.test(strValue)) {
    return message || '请输入有效的手机号';
  }
  return null;
};
```

#### 步骤 2：注册到规则执行器

```typescript
// src/utils/formValidation.ts

// 更新 validateRule 函数
export const validateRule = (
  value: any,
  rule: ValidationRule
): string | null => {
  switch (rule.type) {
    case 'required':
      return validateRequired(value, rule.message);
    // ... 其他规则
    case 'url':
      return validateUrl(value, rule.message);
    case 'phone':  // 新增 case
      return validatePhone(value, rule.message);
    case 'custom':
      if (rule.customValidator) {
        return validateCustom(value, rule.customValidator, rule.message);
      }
      return null;
    default:
      return null;
  }
};
```

#### 步骤 3：添加到属性面板选项

```typescript
// src/constants/propertyConfig.ts

// 查找 VALIDATION_RULE_TYPES 并添加新选项
export const VALIDATION_RULE_TYPES = [
  { value: 'required', label: '必填' },
  { value: 'minLength', label: '最小长度' },
  { value: 'maxLength', label: '最大长度' },
  { value: 'min', label: '最小值' },
  { value: 'max', label: '最大值' },
  { value: 'pattern', label: '正则匹配' },
  { value: 'email', label: '邮箱格式' },
  { value: 'url', label: 'URL 格式' },
  { value: 'phone', label: '手机号格式' },  // 新增
  { value: 'custom', label: '自定义' },
];
```

#### 步骤 4：（可选）配置规则参数

如果新规则需要参数（如 `minLength` 需要数值），需要在 `ValidationRuleEditor` 中添加相应的 UI：

```typescript
// src/components/builder/PropertyPanel/index.tsx

const ValidationRuleEditor: React.FC<ValidationRuleEditorProps> = ({ rule, onUpdate, onRemove }) => {
  // 检查规则是否需要参数输入
  const needsValue = ['minLength', 'maxLength', 'min', 'max', 'pattern', 'phone'].includes(rule.type);
  
  // 如果 phone 规则不需要参数（使用固定正则），则不需要添加
  // 如果需要支持自定义区号等，则需要添加
};
```

### 6.3 自定义验证规则示例

除了扩展内置规则类型，用户还可以使用 `custom` 规则类型进行一次性自定义验证：

#### 场景：验证密码强度

```typescript
// 在属性面板中配置：
// 规则类型：自定义
// 错误提示：密码强度不足，需要包含大小写字母和数字

// 实际的验证逻辑（在组件内部执行）
const validatePasswordStrength = (value: string): boolean | string => {
  if (value.length < 8) {
    return '密码长度至少8位';
  }
  if (!/[a-z]/.test(value)) {
    return '密码需要包含小写字母';
  }
  if (!/[A-Z]/.test(value)) {
    return '密码需要包含大写字母';
  }
  if (!/[0-9]/.test(value)) {
    return '密码需要包含数字';
  }
  return true;
};
```

### 6.4 验证规则执行顺序

验证规则按配置顺序执行，所有失败的规则都会被收集：

```typescript
// 示例：配置了 3 条规则
const rules: ValidationRule[] = [
  { type: 'required', message: '此字段必填' },
  { type: 'minLength', value: 6, message: '至少6个字符' },
  { type: 'email', message: '请输入有效邮箱' },
];

// 输入："" → 空字符串
validateField("", rules);
// 结果：{ valid: false, errors: ['此字段必填'] }
// 注意：空值只触发 required 规则，其他规则被跳过

// 输入："abc"
validateField("abc", rules);
// 结果：{ valid: false, errors: ['至少6个字符', '请输入有效邮箱'] }
// 注意：两条规则都失败，收集所有错误
```

---

## 7. 数据流总结

### 7.1 编辑模式数据流

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  属性面板     │ ───▶ │  Zustand     │ ───▶ │  本地存储     │
│ (配置修改)   │      │   Store      │      │ (持久化)     │
└──────────────┘      └──────────────┘      └──────────────┘
       │
       ▼
┌──────────────┐
│ ComponentRenderer│
│   (重新渲染)    │
└──────────────┘
```

### 7.2 预览模式数据流

```
┌──────────────┐      ┌──────────────────┐      ┌──────────────┐
│  用户交互     │ ───▶ │ PreviewBinding   │ ───▶ │  目标组件     │
│ (选择/输入)  │      │    Context       │      │ (动态更新)    │
└──────────────┘      └──────────────────┘      └──────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ PreviewFormRegistry│
                    │    Context       │
                    │ (表单收集/验证)   │
                    └──────────────────┘
```

---

## 8. 关键文件索引

| 文件路径 | 说明 |
|---------|------|
| `src/types/component.ts` | 组件类型、验证类型、绑定类型定义 |
| `src/utils/formValidation.ts` | 验证引擎核心实现 |
| `src/context/DataBindingContext.tsx` | 编辑模式数据绑定上下文 |
| `src/context/PreviewBindingContext.tsx` | 预览模式数据绑定上下文 |
| `src/context/PreviewFormRegistry.tsx` | 预览模式表单注册表 |
| `src/components/builder/ComponentRenderer/index.tsx` | 组件渲染器 |
| `src/components/builder/PropertyPanel/index.tsx` | 属性面板 |
| `src/constants/mockData.ts` | 组件默认配置、组件面板配置 |
| `src/constants/propertyConfig.ts` | 属性配置定义 |
| `src/store/useBuilderStore.ts` | 全局状态管理 |
| `src/pages/PreviewPage.tsx` | 预览页面 |

---

## 9. 使用示例

### 9.1 国家-城市联动示例

#### 步骤 1：添加组件

1. 从组件面板拖拽两个 **Select** 组件到画布
2. 第一个命名为"国家选择"，配置选项：
   ```json
   [
     { "value": "cn", "label": "中国" },
     { "value": "us", "label": "美国" }
   ]
   ```
3. 第二个命名为"城市选择"

#### 步骤 2：配置数据绑定

1. 选中"国家选择"组件
2. 在属性面板找到"数据绑定"区域
3. 点击"绑定到其他组件"
4. 配置：
   - **目标组件**：选择"城市选择"
   - **源属性路径**：`value`
   - **目标属性路径**：`options`
   - **触发方式**：`change`
   - **转换方式**：`mapping`
   - **映射配置**：
     ```json
     {
       "cn": [
         { "value": "beijing", "label": "北京" },
         { "value": "shanghai", "label": "上海" },
         { "value": "guangzhou", "label": "广州" }
       ],
       "us": [
         { "value": "newyork", "label": "纽约" },
         { "value": "losangeles", "label": "洛杉矶" },
         { "value": "chicago", "label": "芝加哥" }
       ]
     }
     ```

#### 步骤 3：测试

1. 点击"预览"按钮
2. 在"国家选择"中选择"中国"
3. 观察"城市选择"的选项更新为北京、上海、广州
4. 选择"美国"，选项更新为纽约、洛杉矶、芝加哥

### 9.2 表单验证示例

#### 步骤 1：配置表单

1. 添加 **Form** 组件
2. 在 Form 内部添加 **FormItem**
3. 在 FormItem 内部添加 **Input** 组件

#### 步骤 2：配置验证规则

1. 选中 Input 组件
2. 在属性面板找到"验证规则"区域
3. 点击"添加验证规则"
4. 配置：
   - 规则类型：`必填`
   - 错误提示：`用户名不能为空`
5. 再次点击"添加验证规则"
6. 配置：
   - 规则类型：`最小长度`
   - 数值：`3`
   - 错误提示：`用户名至少3个字符`

#### 步骤 3：测试

1. 点击"预览"按钮
2. 不输入任何内容直接提交 → 显示"用户名不能为空"
3. 输入"ab" → 显示"用户名至少3个字符"
4. 输入"abc" → 验证通过

---

*文档版本：1.0*  
*最后更新：2026-05-03*
