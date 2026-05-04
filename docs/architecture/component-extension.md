# 组件扩展体系 - 新组件接入指南

> 本文档详细描述了在低代码搭建平台中新增一个标准组件的完整流程，以 `ColorPicker`（颜色选择器）组件为示例，说明每一步的代码修改和注册要求。

---

## 文档信息

| 项目 | 内容 |
|------|------|
| 文档版本 | v1.0 |
| 最后更新 | 2026-05-04 |
| 相关功能 | 组件扩展、新组件接入 |
| 示例组件 | ColorPicker（颜色选择器） |

---

## 目录

1. [概述](#1-概述)
2. [文件清单](#2-文件清单)
3. [分步接入指南](#3-分步接入指南)
4. [属性面板配置规则](#4-属性面板配置规则)
5. [ComponentRenderer 注册方式](#5-componentrenderer-注册方式)
6. [容器组件额外处理](#6-容器组件额外处理)
7. [接入检查清单](#7-接入检查清单)
8. [现有组件列表](#8-现有组件列表)

---

## 1. 概述

### 1.1 组件分类

根据组件的功能特性，低代码平台中的组件分为两类：

| 类别 | 说明 | 示例组件 | 额外处理 |
|------|------|---------|---------|
| **普通组件** | 独立渲染，不包含子组件 | Text、Button、Image、Input、ColorPicker | 无 |
| **容器组件** | 可嵌套子组件，支持拖拽放置 | Container、Card、Tabs、Modal、Form | 需要额外注册容器判断 |

### 1.2 接入总流程图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         新组件接入总流程                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  阶段 1：类型定义                                                            │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  src/types/component.ts                                                 │ │
│  │  ───────────────────────────────────────────────────────────────────  │ │
│  │  1. 添加 ComponentType 枚举值                                          │ │
│  │  2. 添加 ComponentSchema 接口定义                                      │ │
│  │  3. （可选）添加相关事件类型                                            │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                      │                                       │
│                                      ▼                                       │
│  阶段 2：UI 组件实现                                                         │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  src/components/ui/ColorPicker.tsx                                     │ │
│  │  ───────────────────────────────────────────────────────────────────  │ │
│  │  1. 实现组件的 React 渲染逻辑                                            │ │
│  │  2. 导出组件和类型                                                       │ │
│  │  3. 支持 editable 参数区分编辑/预览模式                                  │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                      │                                       │
│                                      ▼                                       │
│  阶段 3：UI 导出                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  src/components/ui/index.ts                                             │ │
│  │  ───────────────────────────────────────────────────────────────────  │ │
│  │  1. 导入 ColorPicker 组件                                               │ │
│  │  2. 导出 ColorPicker 组件                                               │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                      │                                       │
│                                      ▼                                       │
│  阶段 4：默认配置                                                           │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  src/constants/mockData.ts                                              │ │
│  │  ───────────────────────────────────────────────────────────────────  │ │
│  │  1. 添加 DEFAULT_COMPONENT_CONFIGS 配置                                │ │
│  │  2. （可选）添加到 COMPONENT_PANEL_ITEMS（组件面板）                    │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                      │                                       │
│                                      ▼                                       │
│  阶段 5：属性面板配置                                                       │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  src/constants/propertyConfig.ts                                        │ │
│  │  ───────────────────────────────────────────────────────────────────  │ │
│  │  1. 添加基础属性（basic）：x、y、width、height                          │ │
│  │  2. 添加组件特有属性（props）：组件自定义属性                             │ │
│  │  3. 添加样式属性（styles）：backgroundColor、color、margin 等           │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                      │                                       │
│                                      ▼                                       │
│  阶段 6：渲染器注册                                                         │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  src/components/builder/ComponentRenderer/index.tsx                     │ │
│  │  ───────────────────────────────────────────────────────────────────  │ │
│  │  1. 导入 ColorPicker 组件                                               │ │
│  │  2. 在 switch 语句中添加渲染 case                                        │ │
│  │  3. 实现渲染逻辑（支持 editable 模式）                                    │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                      │                                       │
│                                      ▼                                       │
│  阶段 7：（容器组件额外处理）                                                 │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  如果是容器组件，还需要：                                                 │ │
│  │  ───────────────────────────────────────────────────────────────────  │ │
│  │  1. src/components/builder/DndContext.tsx                              │ │
│  │     └── isContainerComponent 函数                                       │ │
│  │     └── createComponentFromType 函数                                    │ │
│  │     └── DragPreview 图标                                                │ │
│  │  2. src/store/useBuilderStore.ts                                        │ │
│  │     └── isContainerComponent 函数                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 文件清单

### 2.1 必须修改的文件

接入一个新组件，必须修改以下文件：

| 序号 | 文件路径 | 职责 | 示例修改内容 |
|------|---------|------|-------------|
| 1 | `src/types/component.ts` | 类型定义 | 添加枚举值、Schema 接口 |
| 2 | `src/components/ui/ColorPicker.tsx` | 组件实现 | 新建组件文件 |
| 3 | `src/components/ui/index.ts` | UI 导出 | 导出新组件 |
| 4 | `src/constants/mockData.ts` | 默认配置 | 添加组件默认配置 |
| 5 | `src/constants/propertyConfig.ts` | 属性配置 | 添加属性面板配置 |
| 6 | `src/components/builder/ComponentRenderer/index.tsx` | 渲染器 | 添加渲染逻辑 |

### 2.2 容器组件额外文件

如果新组件是**容器组件**（可嵌套子组件），还需要修改以下文件：

| 序号 | 文件路径 | 职责 | 示例修改内容 |
|------|---------|------|-------------|
| 7 | `src/components/builder/DndContext.tsx` | 拖拽上下文 | 更新容器组件判断 |
| 8 | `src/store/useBuilderStore.ts` | 状态管理 | 更新容器组件判断 |

### 2.3 可选文件

| 序号 | 文件路径 | 职责 | 说明 |
|------|---------|------|------|
| 9 | `src/utils/test-helpers.ts` | 测试辅助 | 添加 Mock 创建函数（可选） |
| 10 | `src/utils/eventEngine.ts` | 事件引擎 | 仅当组件需要新事件类型时 |

---

## 3. 分步接入指南

本节以 **ColorPicker（颜色选择器）** 组件为示例，详细说明每一步的代码修改。

### 3.1 步骤 1：定义组件类型

**文件**: `src/types/component.ts`

#### 3.1.1 添加 ComponentType 枚举值

在 `ComponentType` 枚举中添加新组件类型：

```typescript
// src/types/component.ts

export enum ComponentType {
  // 现有组件...
  Text = 'Text',
  Button = 'Button',
  Image = 'Image',
  Container = 'Container',
  // ...
  
  // 新增 ColorPicker（建议使用帕斯卡命名）
  ColorPicker = 'ColorPicker',
}
```

#### 3.1.2 定义组件 Schema 接口

定义新组件的属性接口和完整 Schema 接口：

```typescript
// src/types/component.ts

// ============================================
// ColorPicker Props Interface
// ============================================
export interface ColorPickerComponentProps {
  // 基础属性
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  
  // 显示属性
  showAlpha?: boolean;        // 是否显示透明度选择
  showInput?: boolean;        // 是否显示输入框
  colorFormat?: 'hex' | 'rgb' | 'hsl';  // 颜色格式
  
  // 预设颜色
  presets?: string[];         // 预设颜色面板
  showPresets?: boolean;      // 是否显示预设面板
  
  // 尺寸
  size?: 'small' | 'middle' | 'large';
}

// ============================================
// ColorPicker Schema Interface
// ============================================
export interface ColorPickerComponentSchema extends BaseComponentSchema {
  type: ComponentType.ColorPicker;
  props: ColorPickerComponentProps;
  // ColorPicker 是普通组件，不支持 children
}
```

#### 3.1.3 更新联合类型（如果需要）

如果有相关的联合类型定义，需要更新：

```typescript
// src/types/component.ts

// 所有组件的联合类型（已包含 BaseComponentSchema，通常不需要显式更新）
// 但如果有特定的联合类型，需要添加

// 示例：表单组件联合类型
export type FormComponentSchema = 
  | InputComponentSchema
  | SelectComponentSchema
  | CheckboxComponentSchema
  | RadioComponentSchema
  | SwitchComponentSchema
  | ColorPickerComponentSchema;  // 新增
```

---

### 3.2 步骤 2：实现 UI 组件

**文件**: `src/components/ui/ColorPicker.tsx` (新建)

#### 3.2.1 组件实现模板

```typescript
// src/components/ui/ColorPicker.tsx
/**
 * ColorPicker 组件
 * 颜色选择器组件
 * 
 * 功能：
 * - 支持选择颜色（支持 hex、rgb、hsl 格式）
 * - 支持透明度选择
 * - 支持预设颜色
 * - 编辑模式下显示占位容器
 * - 预览模式下真实渲染
 */

import React from 'react';
import { cn } from '@/utils/classname';

// ============================================
// Props Interface
// ============================================
export interface ColorPickerProps {
  // 基础属性
  value?: string;
  defaultValue?: string;
  onChange?: (color: string) => void;
  disabled?: boolean;
  readonly?: boolean;
  
  // 显示属性
  showAlpha?: boolean;
  showInput?: boolean;
  colorFormat?: 'hex' | 'rgb' | 'hsl';
  
  // 预设
  presets?: string[];
  showPresets?: boolean;
  
  // 尺寸
  size?: 'small' | 'middle' | 'large';
  
  // 样式
  className?: string;
  style?: React.CSSProperties;
  
  // 编辑模式专用
  editable?: boolean;
}

// ============================================
// 默认值
// ============================================
const defaultPresets = [
  '#F5222D', '#FA541C', '#FA8C16', '#FAAD14', '#FADB14',
  '#A0D911', '#52C41A', '#13C2C2', '#1890FF', '#722ED1',
];

// ============================================
// 工具函数
// ============================================
const formatColor = (color: string, format: 'hex' | 'rgb' | 'hsl'): string => {
  // 简化实现，实际项目中可使用 color 类库
  return color;
};

// ============================================
// ColorPicker Component
// ============================================
export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  defaultValue = '#1890FF',
  onChange,
  disabled = false,
  readonly = false,
  showAlpha = false,
  showInput = true,
  colorFormat = 'hex',
  presets = defaultPresets,
  showPresets = false,
  size = 'middle',
  className,
  style,
  editable = false,
}) => {
  // 内部状态
  const [internalColor, setInternalColor] = React.useState(value || defaultValue);
  const [isOpen, setIsOpen] = React.useState(false);

  // 同步外部 value
  React.useEffect(() => {
    if (value !== undefined) {
      setInternalColor(value);
    }
  }, [value]);

  // 处理颜色变化
  const handleColorChange = (newColor: string) => {
    if (readonly || disabled) return;
    
    const formattedColor = formatColor(newColor, colorFormat);
    setInternalColor(formattedColor);
    
    if (onChange) {
      onChange(formattedColor);
    }
  };

  // 尺寸样式
  const sizeClasses = {
    small: 'w-6 h-6',
    middle: 'w-8 h-8',
    large: 'w-10 h-10',
  };

  // ============================================
  // 编辑模式渲染
  // ============================================
  if (editable) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 border border-dashed border-gray-300 rounded p-2',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        style={style}
      >
        {/* 颜色预览块 */}
        <div
          className={cn(
            'rounded border border-gray-200 flex-shrink-0',
            sizeClasses[size]
          )}
          style={{ backgroundColor: internalColor }}
        />
        
        {/* 颜色值显示（编辑模式占位） */}
        {showInput && (
          <div className="text-sm text-gray-500 flex-1 truncate">
            {internalColor}
          </div>
        )}
        
        {/* 编辑模式提示 */}
        <span className="text-xs text-gray-400">
          颜色选择器
        </span>
      </div>
    );
  }

  // ============================================
  // 预览模式渲染（简化版）
  // ============================================
  const handleClick = () => {
    if (disabled || readonly) return;
    // 实际项目中这里会弹出完整的颜色选择面板
    // 简化实现：使用原生 input type="color"
    setIsOpen(!isOpen);
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2',
        className
      )}
      style={style}
    >
      {/* 颜色选择器触发按钮 */}
      <div
        className={cn(
          'relative cursor-pointer rounded border border-gray-300 transition-colors',
          sizeClasses[size],
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && !readonly && 'hover:border-primary-500'
        )}
        style={{ backgroundColor: internalColor }}
        onClick={handleClick}
      >
        {/* 棋盘格背景（用于透明色显示） */}
        {showAlpha && (
          <div
            className="absolute inset-0 rounded opacity-50"
            style={{
              backgroundImage:
                'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
              backgroundSize: '8px 8px',
              backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
            }}
          />
        )}
      </div>

      {/* 原生颜色输入（隐藏但可点击） */}
      <input
        type="color"
        value={internalColor}
        onChange={(e) => handleColorChange(e.target.value)}
        disabled={disabled || readonly}
        className="absolute opacity-0 w-0 h-0"
        tabIndex={-1}
      />

      {/* 颜色值输入框 */}
      {showInput && (
        <input
          type="text"
          value={internalColor}
          onChange={(e) => handleColorChange(e.target.value)}
          disabled={disabled || readonly}
          className={cn(
            'px-2 py-1 text-sm border border-gray-300 rounded',
            'focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500',
            'w-28',
            disabled && 'bg-gray-100 cursor-not-allowed'
          )}
          placeholder="选择颜色"
        />
      )}

      {/* 预设颜色面板 */}
      {showPresets && presets.length > 0 && (
        <div className="flex gap-1 ml-2">
          {presets.slice(0, 6).map((color, index) => (
            <div
              key={index}
              className="w-4 h-4 rounded border border-gray-200 cursor-pointer hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
              onClick={() => handleColorChange(color)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================
// Default Export
// ============================================
export default ColorPicker;
```

---

### 3.3 步骤 3：UI 组件导出

**文件**: `src/components/ui/index.ts`

在 index.ts 中导入并导出新组件：

```typescript
// src/components/ui/index.ts

// 现有导入...
import { Text } from './Text';
import { Button } from './Button';
import { Image } from './Image';
import { Container } from './Container';
// ...

// 新增 ColorPicker 导入
import { ColorPicker } from './ColorPicker';

// 导出类型（如果需要）
export type { ColorPickerProps } from './ColorPicker';

// 导出组件
export {
  // 现有导出...
  Text,
  Button,
  Image,
  Container,
  // ...
  
  // 新增 ColorPicker 导出
  ColorPicker,
};
```

---

### 3.4 步骤 4：添加默认配置

**文件**: `src/constants/mockData.ts`

#### 3.4.1 添加 DEFAULT_COMPONENT_CONFIGS

添加新组件的默认配置：

```typescript
// src/constants/mockData.ts

import { ComponentType, type ColorPickerComponentSchema } from '@/types/component';

export const DEFAULT_COMPONENT_CONFIGS: Record<
  string,
  {
    type: ComponentType;
    label: string;
    defaultWidth: number | string;
    defaultHeight: number | string;
    defaultProps: ColorPickerComponentSchema['props'];
    defaultStyles?: Record<string, string>;
  }
> = {
  // 现有配置...
  [ComponentType.Text]: {
    type: ComponentType.Text,
    label: '文本',
    defaultWidth: 'auto',
    defaultHeight: 'auto',
    defaultProps: {
      content: '文本',
      fontSize: 'md',
      fontWeight: 'normal',
    },
  },
  
  // ... 其他组件配置
  
  // ============================================
  // 新增 ColorPicker 配置
  // ============================================
  [ComponentType.ColorPicker]: {
    type: ComponentType.ColorPicker,
    label: '颜色选择器',
    defaultWidth: 'auto',
    defaultHeight: 'auto',
    defaultProps: {
      defaultValue: '#1890FF',
      disabled: false,
      readonly: false,
      showAlpha: false,
      showInput: true,
      colorFormat: 'hex',
      showPresets: false,
      size: 'middle',
    },
    defaultStyles: {},
  },
};
```

#### 3.4.2 （可选）添加到组件面板

如果需要在左侧组件面板中显示，添加到 `COMPONENT_PANEL_ITEMS`：

```typescript
// src/constants/mockData.ts

// 组件面板分类配置
export const COMPONENT_PANEL_ITEMS: {
  category: string;
  categoryLabel: string;
  icon: string;
  items: { type: ComponentType; label: string }[];
}[] = [
  // 基础组件分类
  {
    category: 'basic',
    categoryLabel: '基础组件',
    icon: '📦',
    items: [
      { type: ComponentType.Text, label: '文本' },
      { type: ComponentType.Button, label: '按钮' },
      { type: ComponentType.Image, label: '图片' },
      { type: ComponentType.ColorPicker, label: '颜色选择器' },  // 新增
    ],
  },
  
  // 其他分类...
];
```

---

### 3.5 步骤 5：配置属性面板

**文件**: `src/constants/propertyConfig.ts`

属性面板配置决定了组件在属性面板中显示哪些可编辑属性。详见 [4. 属性面板配置规则](#4-属性面板配置规则)。

```typescript
// src/constants/propertyConfig.ts

import { ComponentType } from '@/types/component';

// ============================================
// 组件属性配置数组
// ============================================
export const COMPONENT_PROPERTY_CONFIGS: ComponentPropertyConfig[] = [
  // 现有组件配置...
  
  // ============================================
  // 新增 ColorPicker 配置
  // ============================================
  {
    type: ComponentType.ColorPicker,
    label: '颜色选择器',
    properties: [
      // ─────────────────────────────────────
      // 1. 基础属性 (basic)
      // 使用 createCommonBasicProperties() 生成通用基础属性
      // 包括：x、y、width、height
      // ...（已在函数中包含，不需要重复添加）
      
      // ─────────────────────────────────────
      // 2. 组件特有属性 (props)
      // ─────────────────────────────────────
      
      // 默认值
      {
        key: 'defaultValue',
        label: '默认颜色',
        type: 'color',
        placeholder: '#1890FF',
        category: 'props',
        defaultValue: '#1890FF',
      },
      
      // 占位符
      {
        key: 'placeholder',
        label: '占位符',
        type: 'text',
        placeholder: '请选择颜色',
        category: 'props',
      },
      
      // 禁用状态
      {
        key: 'disabled',
        label: '禁用',
        type: 'options',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'false',
      },
      
      // 只读状态
      {
        key: 'readonly',
        label: '只读',
        type: 'options',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'false',
      },
      
      // 显示透明度
      {
        key: 'showAlpha',
        label: '透明度选择',
        type: 'options',
        options: [
          { value: 'true', label: '显示' },
          { value: 'false', label: '隐藏' },
        ],
        category: 'props',
        defaultValue: 'false',
      },
      
      // 显示输入框
      {
        key: 'showInput',
        label: '颜色输入框',
        type: 'options',
        options: [
          { value: 'true', label: '显示' },
          { value: 'false', label: '隐藏' },
        ],
        category: 'props',
        defaultValue: 'true',
      },
      
      // 颜色格式
      {
        key: 'colorFormat',
        label: '颜色格式',
        type: 'select',
        options: [
          { value: 'hex', label: 'HEX (#1890FF)' },
          { value: 'rgb', label: 'RGB (rgb(24,144,255))' },
          { value: 'hsl', label: 'HSL (hsl(208,100%,55%))' },
        ],
        category: 'props',
        defaultValue: 'hex',
      },
      
      // 显示预设
      {
        key: 'showPresets',
        label: '预设颜色',
        type: 'options',
        options: [
          { value: 'true', label: '显示' },
          { value: 'false', label: '隐藏' },
        ],
        category: 'props',
        defaultValue: 'false',
      },
      
      // 尺寸
      {
        key: 'size',
        label: '尺寸',
        type: 'select',
        options: [
          { value: 'small', label: '小' },
          { value: 'middle', label: '中' },
          { value: 'large', label: '大' },
        ],
        category: 'props',
        defaultValue: 'middle',
      },
      
      // ─────────────────────────────────────
      // 3. 样式属性 (styles)
      // 使用 createCommonStyleProperties() 生成通用样式属性
      // 包括：backgroundColor、color、margin、padding 等
      // ...（已在函数中包含，不需要重复添加）
    ],
  },
];

// ============================================
// 通过类型快速查找配置
// ============================================
export const getPropertyConfigByType = (type: ComponentType): ComponentPropertyConfig | undefined => {
  return COMPONENT_PROPERTY_CONFIGS.find((config) => config.type === type);
};
```

---

### 3.6 步骤 6：注册渲染器

**文件**: `src/components/builder/ComponentRenderer/index.tsx`

#### 3.6.1 导入组件

首先在文件顶部导入新组件：

```typescript
// src/components/builder/ComponentRenderer/index.tsx

// 现有导入...
import { Text, Button, Image, Container, /* ... */ } from '@/components/ui';

// 新增 ColorPicker 导入
import { ColorPicker } from '@/components/ui';
```

#### 3.6.2 添加渲染逻辑

在 `ComponentRenderer` 组件的 switch 语句中添加新的 case：

```typescript
// src/components/builder/ComponentRenderer/index.tsx

const ComponentRenderer: React.FC<ComponentRendererProps> = ({
  component,
  isSelected = false,
  onClick,
  editable = true,
}) => {
  // ... 现有代码
  
  // ============================================
  // 渲染逻辑 switch 语句
  // ============================================
  switch (component.type) {
    // 现有 case...
    
    case ComponentType.Text: {
      // ... Text 渲染逻辑
      break;
    }
    
    case ComponentType.Button: {
      // ... Button 渲染逻辑
      break;
    }
    
    // ... 其他组件 case
    
    // ============================================
    // 新增 ColorPicker case
    // ============================================
    case ComponentType.ColorPicker: {
      const { props, styles, events } = component;
      
      // 处理颜色变化（预览模式）
      const handleChange = (color: string) => {
        if (editable) return;
        
        // 预览模式下执行 onChangeActions
        if (events?.onChangeActions?.enabled) {
          const { executeActions } = useActionExecutor();
          executeActions(events.onChangeActions.actions);
        }
      };
      
      const content = (
        <ColorPicker
          defaultValue={props.defaultValue}
          disabled={props.disabled}
          readonly={props.readonly}
          showAlpha={props.showAlpha}
          showInput={props.showInput}
          colorFormat={props.colorFormat}
          showPresets={props.showPresets}
          size={props.size}
          onChange={handleChange}
          editable={editable}
        />
      );
      
      // 编辑模式包装
      if (editable) {
        return (
          <div
            className={cn(
              'relative cursor-pointer transition-all',
              isSelected && 'ring-2 ring-primary-500 ring-offset-1'
            )}
            style={{
              position: 'absolute',
              left: component.x,
              top: component.y,
              width: component.width,
              height: component.height,
              ...styles,
            }}
            onClick={(e) => handleWrapperClick(e, onClick)}
          >
            {content}
          </div>
        );
      }
      
      // 预览模式
      return (
        <div
          style={{
            position: 'absolute',
            left: component.x,
            top: component.y,
            ...styles,
          }}
        >
          {content}
        </div>
      );
    }
    
    // ... 其他 case
    
    default: {
      // 未知类型的兜底渲染
      return (
        <div
          className={cn(
            'relative border-2 border-dashed border-red-400 bg-red-50 rounded p-4',
            isSelected && 'ring-2 ring-primary-500'
          )}
          style={{
            position: 'absolute',
            left: component.x,
            top: component.y,
            width: component.width,
            height: component.height,
            ...component.styles,
          }}
          onClick={(e) => handleWrapperClick(e, onClick)}
        >
          <div className="text-red-600 text-sm font-medium">
            未知组件类型: {component.type}
          </div>
          <div className="text-red-500 text-xs mt-1">
            ID: {component.id}
          </div>
        </div>
      );
    }
  }
};

export default ComponentRenderer;
```

---

## 4. 属性面板配置规则

### 4.1 属性分类

属性面板中的属性分为三类：

| 类别 | category 值 | 说明 | 示例属性 |
|------|------------|------|---------|
| **基础属性** | `'basic'` | 组件位置和尺寸，所有组件通用 | x、y、width、height |
| **组件特有属性** | `'props'` | 组件自定义的业务属性 | defaultValue、disabled、size 等 |
| **样式属性** | `'styles'` | CSS 样式相关属性 | backgroundColor、margin、padding 等 |

### 4.2 PropertyConfig 接口

```typescript
export interface PropertyConfig {
  key: string;           // 属性键名，对应 props 或 styles 中的字段
  label: string;         // 属性面板显示的标签
  type: 'text'           // 输入类型
      | 'number'         // 数字输入
      | 'select'         // 下拉选择
      | 'textarea'       // 多行文本
      | 'color'          // 颜色选择器
      | 'options';       // 单选选项（是/否）
  
  options?: {            // type 为 select/options 时使用
    value: string;
    label: string;
  }[];
  
  placeholder?: string;  // 输入框占位符
  category: 'basic'      // 属性分类
          | 'props' 
          | 'styles';
  
  defaultValue?: string  // 默认值
              | number 
              | any[] 
              | undefined;
}
```

### 4.3 输入类型详解

#### 4.3.1 text - 文本输入

```typescript
{
  key: 'placeholder',
  label: '占位符',
  type: 'text',
  placeholder: '请输入内容',
  category: 'props',
}
```

#### 4.3.2 number - 数字输入

```typescript
{
  key: 'x',
  label: 'X 坐标',
  type: 'number',
  placeholder: '0',
  category: 'basic',
  defaultValue: 0,
}
```

#### 4.3.3 select - 下拉选择

```typescript
{
  key: 'size',
  label: '尺寸',
  type: 'select',
  options: [
    { value: 'small', label: '小' },
    { value: 'middle', label: '中' },
    { value: 'large', label: '大' },
  ],
  category: 'props',
  defaultValue: 'middle',
}
```

#### 4.3.4 options - 单选选项（是/否）

```typescript
{
  key: 'disabled',
  label: '禁用',
  type: 'options',
  options: [
    { value: 'true', label: '是' },
    { value: 'false', label: '否' },
  ],
  category: 'props',
  defaultValue: 'false',
}
```

#### 4.3.5 textarea - 多行文本

```typescript
{
  key: 'content',
  label: '内容',
  type: 'textarea',
  placeholder: '请输入多行内容...',
  category: 'props',
}
```

#### 4.3.6 color - 颜色选择器

```typescript
{
  key: 'defaultValue',
  label: '默认颜色',
  type: 'color',
  placeholder: '#1890FF',
  category: 'props',
  defaultValue: '#1890FF',
}
```

### 4.4 通用属性生成函数

项目提供了两个函数用于生成通用属性配置：

#### 4.4.1 createCommonBasicProperties

生成基础属性（x、y、width、height）：

```typescript
const createCommonBasicProperties = (): PropertyConfig[] => [
  {
    key: 'x',
    label: 'X 坐标',
    type: 'number',
    placeholder: '0',
    category: 'basic',
    defaultValue: 0,
  },
  {
    key: 'y',
    label: 'Y 坐标',
    type: 'number',
    placeholder: '0',
    category: 'basic',
    defaultValue: 0,
  },
  {
    key: 'width',
    label: '宽度',
    type: 'text',
    placeholder: 'auto',
    category: 'basic',
    defaultValue: 'auto',
  },
  {
    key: 'height',
    label: '高度',
    type: 'text',
    placeholder: 'auto',
    category: 'basic',
    defaultValue: 'auto',
  },
];
```

#### 4.4.2 createCommonStyleProperties

生成通用样式属性：

```typescript
const createCommonStyleProperties = (): PropertyConfig[] => [
  {
    key: 'backgroundColor',
    label: '背景颜色',
    type: 'color',
    placeholder: '#ffffff',
    category: 'styles',
  },
  {
    key: 'color',
    label: '文字颜色',
    type: 'color',
    placeholder: '#000000',
    category: 'styles',
  },
  // ... margin 系列
  { key: 'marginTop', label: '上边距', type: 'text', category: 'styles' },
  { key: 'marginBottom', label: '下边距', type: 'text', category: 'styles' },
  { key: 'marginLeft', label: '左边距', type: 'text', category: 'styles' },
  { key: 'marginRight', label: '右边距', type: 'text', category: 'styles' },
  // ... padding 系列
  { key: 'paddingTop', label: '上内边距', type: 'text', category: 'styles' },
  { key: 'paddingBottom', label: '下内边距', type: 'text', category: 'styles' },
  { key: 'paddingLeft', label: '左内边距', type: 'text', category: 'styles' },
  { key: 'paddingRight', label: '右内边距', type: 'text', category: 'styles' },
];
```

### 4.5 完整配置示例

一个完整的组件属性配置应该包含：

```typescript
{
  type: ComponentType.ColorPicker,
  label: '颜色选择器',
  properties: [
    // 1. 基础属性
    ...createCommonBasicProperties(),
    
    // 2. 组件特有属性
    {
      key: 'defaultValue',
      label: '默认颜色',
      type: 'color',
      category: 'props',
      defaultValue: '#1890FF',
    },
    {
      key: 'disabled',
      label: '禁用',
      type: 'options',
      options: [
        { value: 'true', label: '是' },
        { value: 'false', label: '否' },
      ],
      category: 'props',
      defaultValue: 'false',
    },
    // ... 其他特有属性
    
    // 3. 样式属性
    ...createCommonStyleProperties(),
  ],
}
```

---

## 5. ComponentRenderer 注册方式

### 5.1 渲染器职责

`ComponentRenderer` 负责：

1. 根据 `component.type` 选择对应的 UI 组件
2. 处理编辑模式和预览模式的差异
3. 处理组件选中状态和点击事件
4. 执行组件事件（预览模式）

### 5.2 编辑模式 vs 预览模式

| 特性 | 编辑模式 (editable=true) | 预览模式 (editable=false) |
|------|-------------------------|--------------------------|
| 选中状态 | 显示高亮边框 | 无 |
| 点击行为 | 选中组件，显示属性面板 | 执行配置的事件 |
| 组件交互 | 部分禁用（如按钮不可点击） | 完全可用 |
| 定位方式 | absolute 定位在画布 | absolute 定位 |

### 5.3 普通组件渲染模板

```typescript
case ComponentType.ColorPicker: {
  const { props, styles, events } = component;
  
  // 事件处理函数（预览模式）
  const handleEvent = () => {
    if (editable) return;
    // 执行事件逻辑...
  };
  
  // 组件内容
  const content = (
    <ColorPicker
      defaultValue={props.defaultValue}
      disabled={props.disabled}
      // ... 其他 props
      onChange={handleEvent}
      editable={editable}  // 传递 editable 参数
    />
  );
  
  // 编辑模式包装
  if (editable) {
    return (
      <div
        className={cn(
          'relative cursor-pointer transition-all',
          isSelected && 'ring-2 ring-primary-500 ring-offset-1'
        )}
        style={{
          position: 'absolute',
          left: component.x,
          top: component.y,
          width: component.width,
          height: component.height,
          ...styles,
        }}
        onClick={(e) => handleWrapperClick(e, onClick)}
      >
        {content}
      </div>
    );
  }
  
  // 预览模式
  return (
    <div
      style={{
        position: 'absolute',
        left: component.x,
        top: component.y,
        ...styles,
      }}
    >
      {content}
    </div>
  );
}
```

### 5.4 事件执行集成

如果组件需要支持事件系统，需要集成 `useActionExecutor`：

```typescript
// 在组件渲染逻辑中
const { executeAction, executeActions } = useActionExecutor();

// 示例：Button 的点击事件
const handlePreviewClick = (e: React.MouseEvent) => {
  if (editable) {
    handleWrapperClick(e, onClick);
  } else {
    // 预览模式：执行事件
    // 旧事件系统（向后兼容）
    if (events?.onClick) {
      const executeClickEvent = useClickEventExecutor();
      executeClickEvent(events.onClick);
    }
    
    // 新事件系统
    if (events?.onClickActions?.enabled) {
      executeActions(events.onClickActions.actions);
    }
  }
};
```

---

## 6. 容器组件额外处理

### 6.1 什么是容器组件

容器组件是指可以嵌套子组件的组件，具有以下特征：

1. Schema 中包含 `children: ComponentSchema[]` 属性
2. 实现 `ContainerComponentSchema` 接口
3. 支持拖拽放置其他组件到内部

### 6.2 容器组件类型定义

```typescript
// src/types/component.ts

// 容器组件基接口
export interface ContainerComponentSchema extends BaseComponentSchema {
  children: ComponentSchema[];  // 必须有 children
}

// 具体容器组件
export interface CardComponentSchema extends ContainerComponentSchema {
  type: ComponentType.Card;
  props: CardComponentProps;
}

export interface ModalComponentSchema extends ContainerComponentSchema {
  type: ComponentType.Modal;
  props: ModalComponentProps;
}
```

### 6.3 需要修改的文件

容器组件除了完成普通组件的 6 个步骤外，还需要修改以下文件：

| 文件 | 修改内容 |
|------|---------|
| `src/components/builder/DndContext.tsx` | `isContainerComponent`、`createComponentFromType`、`DragPreview` |
| `src/store/useBuilderStore.ts` | `isContainerComponent` |

### 6.4 DndContext.tsx 修改

#### 6.4.1 isContainerComponent 函数

```typescript
// src/components/builder/DndContext.tsx

const isContainerComponent = (
  component: ComponentSchema
): component is ContainerComponentSchema => {
  return (
    component.type === ComponentType.Container ||
    component.type === ComponentType.Card ||
    component.type === ComponentType.Tabs ||
    component.type === ComponentType.TabPane ||
    component.type === ComponentType.Accordion ||
    component.type === ComponentType.AccordionItem ||
    component.type === ComponentType.Modal ||
    component.type === ComponentType.Form ||
    component.type === ComponentType.FormItem
    // 新增容器组件类型
  );
};
```

#### 6.4.2 createComponentFromType 函数

```typescript
// src/components/builder/DndContext.tsx

const createComponentFromType = (
  type: ComponentType,
  x: number,
  y: number
): ComponentSchema => {
  const config = DEFAULT_COMPONENT_CONFIGS[type];
  const baseComponent: BaseComponentSchema = {
    id: generateId(type.toLowerCase()),
    type,
    x,
    y,
    width: config.defaultWidth,
    height: config.defaultHeight,
    props: { ...config.defaultProps },
    styles: { ...config.defaultStyles },
  };

  // 容器组件需要添加 children 数组
  if (
    componentType === ComponentType.Container ||
    componentType === ComponentType.Card ||
    componentType === ComponentType.Tabs ||
    componentType === ComponentType.TabPane ||
    componentType === ComponentType.Accordion ||
    componentType === ComponentType.AccordionItem ||
    componentType === ComponentType.Modal ||
    componentType === ComponentType.Form ||
    componentType === ComponentType.FormItem
    // 新增容器组件类型
  ) {
    (component as ContainerComponentSchema).children = [];
  }

  return baseComponent;
};
```

#### 6.4.3 DragPreview 图标

```typescript
// src/components/builder/DndContext.tsx

const DragPreview: React.FC<{ item: ActiveDragItem }> = ({ item }) => {
  const getIcon = () => {
    const icons: Record<string, string> = {
      Text: 'T',
      Button: '⬛',
      Image: '🖼️',
      Container: '📦',
      Card: '🃏',
      Divider: '━',
      Tabs: '📑',
      TabPane: '📄',
      Accordion: '🗂️',
      AccordionItem: '📁',
      Modal: '📋',
      Form: '📝',
      // 新增组件图标
    };
    return item.type ? icons[item.type] || '?' : '?';
  };
  // ...
};
```

### 6.5 useBuilderStore.ts 修改

```typescript
// src/store/useBuilderStore.ts

const isContainerComponent = (
  component: ComponentSchema
): component is ContainerComponentSchema => {
  return (
    component.type === ComponentType.Container ||
    component.type === ComponentType.Card ||
    component.type === ComponentType.Tabs ||
    component.type === ComponentType.TabPane ||
    component.type === ComponentType.Accordion ||
    component.type === ComponentType.AccordionItem ||
    component.type === ComponentType.Modal ||
    component.type === ComponentType.Form ||
    component.type === ComponentType.FormItem
    // 新增容器组件类型
  );
};
```

---

## 7. 接入检查清单

### 7.1 普通组件检查清单

| 序号 | 检查项 | 文件路径 | 状态 |
|------|--------|---------|------|
| 1 | 添加 ComponentType 枚举值 | `src/types/component.ts` | ☐ |
| 2 | 定义 Props 接口 | `src/types/component.ts` | ☐ |
| 3 | 定义 Schema 接口 | `src/types/component.ts` | ☐ |
| 4 | 实现 UI 组件 | `src/components/ui/Xxx.tsx` | ☐ |
| 5 | 导出组件 | `src/components/ui/index.ts` | ☐ |
| 6 | 添加 DEFAULT_COMPONENT_CONFIGS | `src/constants/mockData.ts` | ☐ |
| 7 | 添加属性面板配置 | `src/constants/propertyConfig.ts` | ☐ |
| 8 | 导入组件到渲染器 | `src/components/builder/ComponentRenderer/index.tsx` | ☐ |
| 9 | 添加渲染 case | `src/components/builder/ComponentRenderer/index.tsx` | ☐ |
| 10 | 运行类型检查 `npx tsc --noEmit` | - | ☐ |

### 7.2 容器组件额外检查清单

| 序号 | 检查项 | 文件路径 | 状态 |
|------|--------|---------|------|
| 11 | 更新 DndContext 中的 isContainerComponent | `src/components/builder/DndContext.tsx` | ☐ |
| 12 | 更新 DndContext 中的 createComponentFromType | `src/components/builder/DndContext.tsx` | ☐ |
| 13 | 更新 DndContext 中的 DragPreview 图标 | `src/components/builder/DndContext.tsx` | ☐ |
| 14 | 更新 useBuilderStore 中的 isContainerComponent | `src/store/useBuilderStore.ts` | ☐ |

### 7.3 可选检查清单

| 序号 | 检查项 | 文件路径 | 状态 |
|------|--------|---------|------|
| 15 | 添加组件到 COMPONENT_PANEL_ITEMS | `src/constants/mockData.ts` | ☐ |
| 16 | 添加 Mock 组件创建函数 | `src/utils/test-helpers.ts` | ☐ |
| 17 | 编写组件测试 | `src/components/ui/xxx.test.ts` | ☐ |

---

## 8. 现有组件列表

### 8.1 组件统计

截至文档编写日，项目共包含 **13 个组件**：

| 类型 | 数量 | 组件列表 |
|------|------|---------|
| **基础组件** | 3 | Text、Button、Image |
| **容器组件** | 9 | Container、Card、Tabs、TabPane、Accordion、AccordionItem、Modal、Form、FormItem |
| **表单组件** | 7 | Input、Textarea、Select、Checkbox、CheckboxGroup、Radio、RadioGroup、Switch |
| **布局组件** | 1 | Divider |

> 注：部分组件同时属于多个分类（如 Form 既是容器组件也是表单组件）

### 8.2 完整组件清单

| 组件名 | 类型英文 | 分类 | 容器组件 | 说明 |
|--------|---------|------|---------|------|
| 文本 | `Text` | 基础 | ❌ | 纯文本显示组件 |
| 按钮 | `Button` | 基础 | ❌ | 交互按钮组件 |
| 图片 | `Image` | 基础 | ❌ | 图片显示组件 |
| 容器 | `Container` | 布局 | ✅ | 自由布局容器 |
| 卡片 | `Card` | 布局 | ✅ | 卡片式容器 |
| 分割线 | `Divider` | 布局 | ❌ | 水平/垂直分割线 |
| 标签页 | `Tabs` | 布局 | ✅ | 标签页容器 |
| 标签面板 | `TabPane` | 布局 | ✅ | 标签页的单个面板 |
| 折叠面板 | `Accordion` | 布局 | ✅ | 折叠面板容器 |
| 折叠项 | `AccordionItem` | 布局 | ✅ | 折叠面板的单个项 |
| 弹窗 | `Modal` | 布局/交互 | ✅ | 模态弹窗 |
| 输入框 | `Input` | 表单 | ❌ | 单行文本输入 |
| 文本域 | `Textarea` | 表单 | ❌ | 多行文本输入 |
| 下拉框 | `Select` | 表单 | ❌ | 下拉选择 |
| 复选框 | `Checkbox` | 表单 | ❌ | 单个复选框 |
| 复选框组 | `CheckboxGroup` | 表单 | ❌ | 复选框组 |
| 单选框 | `Radio` | 表单 | ❌ | 单个单选框 |
| 单选框组 | `RadioGroup` | 表单 | ❌ | 单选框组 |
| 开关 | `Switch` | 表单 | ❌ | 开关组件 |
| 表单 | `Form` | 表单 | ✅ | 表单容器 |
| 表单项 | `FormItem` | 表单 | ✅ | 表单项容器 |

### 8.3 容器组件层级结构

```
Container（根容器）
├── Card（卡片）
│   └── 任意组件
├── Tabs（标签页）
│   └── TabPane（标签面板）
│       └── 任意组件
├── Accordion（折叠面板）
│   └── AccordionItem（折叠项）
│       └── 任意组件
├── Modal（弹窗）
│   └── 任意组件
└── Form（表单）
    └── FormItem（表单项）
        └── 表单组件/任意组件
```

---

## 9. 常见问题

### 9.1 组件不显示

**可能原因**：
1. 忘记在 `ComponentRenderer` 中添加 case
2. `ComponentType` 枚举值与 `DEFAULT_COMPONENT_CONFIGS` 的 key 不匹配
3. 类型定义错误

**排查步骤**：
1. 检查 `switch (component.type)` 是否有对应的 case
2. 检查枚举值字符串是否一致（区分大小写）
3. 运行 `npx tsc --noEmit` 检查类型错误

### 9.2 属性面板不显示

**可能原因**：
1. 忘记在 `COMPONENT_PROPERTY_CONFIGS` 中添加配置
2. `type` 值与枚举不匹配
3. `getPropertyConfigByType` 函数查找失败

**排查步骤**：
1. 检查 `COMPONENT_PROPERTY_CONFIGS` 数组中是否添加了新组件
2. 检查 `config.type` 是否等于 `ComponentType.Xxx`
3. 在控制台调试 `getPropertyConfigByType(ComponentType.Xxx)`

### 9.3 容器组件无法拖入子组件

**可能原因**：
1. 忘记更新 `isContainerComponent` 函数
2. 忘记在 `createComponentFromType` 中初始化 `children`
3. `DndContext` 中的 `isContainerDropZone` 判断错误

**排查步骤**：
1. 检查 `DndContext.tsx` 中的 `isContainerComponent`
2. 检查 `useBuilderStore.ts` 中的 `isContainerComponent`
3. 检查新创建的组件是否有 `children: []` 属性

### 9.4 预览模式事件不执行

**可能原因**：
1. 渲染器中没有处理 `events`
2. 忘记调用 `executeAction` 或 `executeActions`
3. `editable` 判断错误

**排查步骤**：
1. 检查渲染器中是否解构了 `events`
2. 检查预览模式下是否调用了事件执行函数
3. 确认 `editable=false` 时才执行事件

---

## 附录

### A. 完整代码示例

本文档中以 ColorPicker 为例的完整代码示例可参考：
- `src/components/ui/Input.tsx` - 简单输入组件参考
- `src/components/ui/Select.tsx` - 下拉选择组件参考
- `src/components/ui/Card.tsx` - 容器组件参考
- `src/components/ui/Modal.tsx` - 复杂容器组件参考

### B. 相关文档

- [架构综述文档](./overview.md) - 整体架构说明
- [事件系统文档](./event-system.md) - 事件系统详细说明
- [表单系统文档](./form-system.md) - 表单组件说明

---

**文档版本**：v1.0  
**最后更新**：2026-05-04  
**维护者**：开发团队
