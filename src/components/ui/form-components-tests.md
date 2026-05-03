# 表单组件自测文档

## 概述

本文档详细描述了 8 个表单组件（Input、Textarea、Select、Checkbox、CheckboxGroup、Radio、RadioGroup、Switch、Form、FormItem）的测试要点和预期行为。

---

## 1. Input 组件

### 组件文件
`src/components/ui/Input.tsx`

### 测试要点

| 测试项 | 预期行为 | 验证方式 |
|--------|----------|----------|
| **基础渲染** | 输入框正确显示，包含边框和内边距 | DOM 检查 |
| **placeholder** | 显示占位符文本，灰色样式 | DOM 检查 |
| **value / defaultValue** | 显示预设值，可编辑 | DOM 检查 |
| **type 属性** | 支持 text/number/email/password 四种类型，行为符合 HTML 标准 | DOM 检查 |
| **maxLength** | 限制最大输入长度 | DOM 检查、输入测试 |
| **clearable** | 有值时显示清除按钮，点击后清空输入 | 视觉检查、交互测试 |
| **disabled** | 显示灰色背景，不可编辑 | DOM 检查 |
| **readOnly** | 只读状态，样式为浅灰色背景 | DOM 检查 |
| **error 状态** | 边框变为红色 | DOM 检查 |
| **errorMessage** | 在输入框下方显示红色错误文字 | DOM 检查 |
| **focus 状态** | 边框高亮，显示 focus ring | 视觉检查 |
| **prefix / suffix** | 前后缀内容正确显示 | DOM 检查 |

### 属性配置

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| type | select | text | 输入类型：text/number/email/password |
| placeholder | text | 请输入内容 | 占位符文本 |
| value | text | - | 受控值 |
| defaultValue | text | - | 默认值 |
| maxLength | number | - | 最大输入长度 |
| clearable | select | false | 是否可清除 |
| disabled | select | false | 是否禁用 |
| readOnly | select | false | 是否只读 |
| error | select | false | 是否错误状态 |
| errorMessage | text | - | 错误消息文本 |

---

## 2. Textarea 组件

### 组件文件
`src/components/ui/Textarea.tsx`

### 测试要点

| 测试项 | 预期行为 | 验证方式 |
|--------|----------|----------|
| **基础渲染** | 多行文本框正确显示，高度由 rows 决定 | DOM 检查 |
| **placeholder** | 显示占位符文本 | DOM 检查 |
| **rows** | 控制文本框的默认高度 | DOM 检查 |
| **resize** | 支持 none/vertical/horizontal/both 四种调整方式 | CSS 检查 |
| **maxLength** | 限制最大输入长度 | DOM 检查 |
| **showCount** | 在右下角显示字数统计（当前/最大） | DOM 检查 |
| **disabled** | 灰色背景，不可编辑 | DOM 检查 |
| **readOnly** | 只读状态，浅灰色背景 | DOM 检查 |
| **error 状态** | 红色边框 | DOM 检查 |
| **errorMessage** | 下方显示红色错误文字 | DOM 检查 |
| **字数超限** | 统计数字变为红色 | 视觉检查 |

### 属性配置

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| placeholder | text | 请输入内容 | 占位符文本 |
| value | text | - | 受控值 |
| defaultValue | text | - | 默认值 |
| rows | number | 4 | 行数 |
| maxLength | number | - | 最大长度 |
| showCount | select | false | 是否显示字数统计 |
| resize | select | vertical | 调整方式 |
| disabled | select | false | 是否禁用 |
| readOnly | select | false | 是否只读 |
| error | select | false | 是否错误状态 |
| errorMessage | text | - | 错误消息 |

---

## 3. Select 组件

### 组件文件
`src/components/ui/Select.tsx`

### 测试要点

| 测试项 | 预期行为 | 验证方式 |
|--------|----------|----------|
| **基础渲染** | 下拉选择器正确显示，带下拉箭头 | DOM 检查 |
| **placeholder** | 无选中值时显示占位符 | DOM 检查 |
| **选项列表** | 点击展开下拉列表，显示所有 options | 交互测试 |
| **单选模式** | 点击选项后关闭下拉，显示选中值 | 交互测试 |
| **多选模式 (multiple)** | 选中项以 tag 形式显示，可单独删除，下拉不自动关闭 | 交互测试 |
| **选中值显示** | 显示选中选项的 label，多选时用逗号分隔或 tag 形式 | DOM 检查 |
| **搜索模式 (searchable)** | 展开后显示搜索框，输入过滤选项 | 交互测试 |
| **可清除 (clearable)** | 有值时显示清除按钮，点击后清空选择 | 交互测试 |
| **disabled** | 灰色背景，不可点击 | DOM 检查 |
| **error 状态** | 红色边框 | DOM 检查 |
| **errorMessage** | 下方显示红色错误文字 | DOM 检查 |
| **空选项列表** | 显示"暂无选项"提示 | DOM 检查 |
| **选项禁用** | 禁用选项变灰，不可点击 | 视觉检查 |
| **全选项匹配高亮** | 选中项有高亮背景和对勾图标 | 视觉检查 |
| **点击外部关闭** | 点击下拉外部区域自动关闭 | 交互测试 |

### 属性配置

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| placeholder | text | 请选择 | 占位符文本 |
| value | text/number | - | 受控值 |
| defaultValue | text/number | - | 默认值 |
| options | options | 3个默认选项 | 选项列表（多行文本编辑，每行一个 value:label） |
| multiple | select | false | 是否多选 |
| searchable | select | false | 是否可搜索 |
| clearable | select | false | 是否可清除 |
| disabled | select | false | 是否禁用 |
| error | select | false | 是否错误状态 |
| errorMessage | text | - | 错误消息 |

### Options 编辑格式

在属性面板中，options 使用多行文本编辑，格式为：
```
value1:标签一
value2:标签二
value3:标签三
```

- 每行一个选项
- 使用冒号 `:` 分隔 value 和 label
- 如果没有冒号，value 和 label 相同

---

## 4. Checkbox 组件

### 组件文件
`src/components/ui/Checkbox.tsx`

### 测试要点

| 测试项 | 预期行为 | 验证方式 |
|--------|----------|----------|
| **基础渲染** | 复选框和 label 正确显示，水平排列 | DOM 检查 |
| **checked 状态** | 背景变为主题色，显示对勾图标 | 视觉检查 |
| **uncheck 状态** | 白色背景，灰色边框 | 视觉检查 |
| **indeterminate 半选** | 显示中间一条横线（用于全选/部分选中） | 视觉检查 |
| **label 显示** | label 文本在复选框右侧 | DOM 检查 |
| **点击切换** | 点击复选框或 label 切换选中状态 | 交互测试 |
| **disabled** | 整体透明度降低，不可点击 | 视觉检查 |
| **hover 效果** | 未选中时悬停边框变色 | 视觉检查 |

### 属性配置

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| label | text | 选项 | 标签文本 |
| checked | select | false | 是否选中 |
| indeterminate | select | false | 是否半选状态 |
| disabled | select | false | 是否禁用 |

---

## 5. CheckboxGroup 组件

### 组件文件
`src/components/ui/Checkbox.tsx`

### 测试要点

| 测试项 | 预期行为 | 验证方式 |
|--------|----------|----------|
| **基础渲染** | 多个 Checkbox 按指定方向排列 | DOM 检查 |
| **options 渲染** | 每个 option 对应一个 Checkbox，显示对应 label | DOM 检查 |
| **默认选中值** | value 数组中包含的选项显示为选中 | DOM 检查 |
| **全选功能** | 选项 > 1 时显示"全选"Checkbox，点击可全选/取消全选 | 交互测试 |
| **半选状态** | 部分选中时全选框显示半选状态 | 视觉检查 |
| **排列方向 (direction)** | column 垂直排列，row 水平排列 | CSS 检查 |
| **间距 (gap)** | sm/md/lg 三种间距大小 | CSS 检查 |
| **disabled** | 所有子复选框禁用，不可点击 | DOM 检查 |
| **单个选项禁用** | options 中 disabled=true 的选项单独禁用 | 视觉检查 |
| **选中值变更** | 点击选项时更新 value 数组，触发 onChange | 状态检查 |

### 属性配置

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| options | options | 3个默认选项 | 选项列表（多行文本编辑） |
| value | - | [] | 选中值数组 |
| defaultValue | - | [] | 默认选中值 |
| direction | select | column | 排列方向：row/column |
| gap | select | md | 间距：sm/md/lg |
| disabled | select | false | 是否禁用 |

---

## 6. Radio 组件

### 组件文件
`src/components/ui/Radio.tsx`

### 测试要点

| 测试项 | 预期行为 | 验证方式 |
|--------|----------|----------|
| **基础渲染** | 圆形单选框和 label 正确显示 | DOM 检查 |
| **checked 状态** | 外圈边框主题色，内部实心圆点 | 视觉检查 |
| **uncheck 状态** | 灰色边框，无内部圆点 | 视觉检查 |
| **label 显示** | label 文本在单选框右侧 | DOM 检查 |
| **点击切换** | 点击单选框或 label 选中（单选不支持取消） | 交互测试 |
| **disabled** | 透明度降低，不可点击 | 视觉检查 |
| **hover 效果** | 未选中时悬停边框变色 | 视觉检查 |

### 属性配置

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| label | text | 选项 | 标签文本 |
| value | text/number | radio1 | 选项值 |
| checked | select | false | 是否选中 |
| disabled | select | false | 是否禁用 |

---

## 7. RadioGroup 组件

### 组件文件
`src/components/ui/Radio.tsx`

### 测试要点

| 测试项 | 预期行为 | 验证方式 |
|--------|----------|----------|
| **基础渲染** | 多个 Radio 按指定方向排列 | DOM 检查 |
| **options 渲染** | 每个 option 对应一个 Radio | DOM 检查 |
| **默认选中值** | 与 value 匹配的 option 显示选中 | DOM 检查 |
| **单选互斥** | 同一时间只能有一个选项被选中 | 交互测试 |
| **排列方向 (direction)** | column 垂直排列，row 水平排列 | CSS 检查 |
| **间距 (gap)** | sm/md/lg 三种间距 | CSS 检查 |
| **disabled** | 所有子单选框禁用 | DOM 检查 |
| **单个选项禁用** | options 中 disabled=true 的选项单独禁用 | 视觉检查 |
| **name 属性** | 组内 Radio 使用相同 name，确保单选互斥 | DOM 检查 |
| **选中值变更** | 点击选项时更新 value，触发 onChange | 状态检查 |

### 属性配置

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| options | options | 3个默认选项 | 选项列表（多行文本编辑） |
| value | text/number | - | 选中值 |
| defaultValue | text/number | - | 默认选中值 |
| direction | select | column | 排列方向：row/column |
| gap | select | md | 间距：sm/md/lg |
| disabled | select | false | 是否禁用 |

---

## 8. Switch 组件

### 组件文件
`src/components/ui/Switch.tsx`

### 测试要点

| 测试项 | 预期行为 | 验证方式 |
|--------|----------|----------|
| **基础渲染** | 开关组件正确显示，圆形滑块 | DOM 检查 |
| **checked 状态** | 背景主题色，滑块在右侧 | 视觉检查 |
| **unchecked 状态** | 背景灰色，滑块在左侧 | 视觉检查 |
| **点击切换** | 点击开关平滑切换状态，有过渡动画 | 交互测试 |
| **尺寸 (size)** | sm 小尺寸、md 中尺寸、lg 大尺寸 | DOM 检查 |
| **自定义颜色** | activeColor 和 inactiveColor 分别控制开/关背景色 | CSS 检查 |
| **loading 状态** | 滑块内显示加载动画，不可点击 | 视觉检查 |
| **disabled** | 透明度降低，不可点击 | 视觉检查 |
| **文字提示** | checkedText 开启时显示在左侧，uncheckedText 关闭时显示在右侧 | DOM 检查 |
| **aria-checked** | 正确设置可访问性属性 | DOM 检查 |

### 属性配置

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| checked | select | false | 是否开启 |
| defaultChecked | select | false | 默认是否开启 |
| size | select | md | 尺寸：sm/md/lg |
| disabled | select | false | 是否禁用 |
| loading | select | false | 是否加载状态 |
| checkedText | text | - | 开启时显示的文字 |
| uncheckedText | text | - | 关闭时显示的文字 |

---

## 9. Form 组件

### 组件文件
`src/components/ui/Form.tsx`

### 测试要点

| 测试项 | 预期行为 | 验证方式 |
|--------|----------|----------|
| **基础渲染** | 作为容器正确渲染，包含子组件 | DOM 检查 |
| **Context 传递** | 通过 FormContext 向子 FormItem 传递配置 | 代码检查 |
| **布局模式 (layout)** | vertical: 垂直堆叠；horizontal: 水平排列；inline: 行内紧凑 | CSS 检查 |
| **labelWidth** | horizontal 布局时，控制 FormItem label 的宽度 | DOM 检查 |
| **labelAlign** | left/right/top 三种对齐方式 | DOM 检查 |
| **size** | 统一下拉表单项的尺寸：sm/md/lg | 代码检查 |
| **disabled** | 批量禁用所有子表单组件 | 代码检查 |
| **onSubmit** | 阻止表单默认提交行为 | 交互测试 |
| **子组件支持** | 支持放置 FormItem、Input、Select 等任意组件 | DOM 检查 |

### 属性配置

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| layout | select | vertical | 布局模式：vertical/horizontal/inline |
| labelWidth | number | 100 | 标签宽度（horizontal 布局） |
| labelAlign | select | right | 标签对齐：left/right/top |
| size | select | md | 组件尺寸：sm/md/lg |
| disabled | select | false | 是否批量禁用 |

### Context 传递的值

Form 组件通过 Context 向子组件传递以下配置：
- `layout`: 布局模式
- `labelWidth`: 标签宽度
- `labelAlign`: 标签对齐方式
- `size`: 组件尺寸
- `disabled`: 是否禁用

FormItem 组件使用 `useFormContext()` Hook 消费这些配置，并可通过自身 props 覆盖。

---

## 10. FormItem 组件

### 组件文件
`src/components/ui/Form.tsx`

### 测试要点

| 测试项 | 预期行为 | 验证方式 |
|--------|----------|----------|
| **基础渲染** | 正确渲染 label、子组件、错误/帮助信息 | DOM 检查 |
| **label 显示** | 显示标签文本 | DOM 检查 |
| **必填标记 (required)** | label 前显示红色星号 `*` | 视觉检查 |
| **子组件支持** | 作为容器可放置 Input、Select 等任意子组件 | DOM 检查 |
| **label 继承 Form 配置** | 从 Form Context 继承 labelWidth、labelAlign、layout | 代码检查 |
| **label 覆盖 Form 配置** | 自身的 labelWidth、labelAlign 可覆盖 Form 的配置 | 代码检查 |
| **error 状态** | 子组件和错误消息以红色显示 | 视觉检查 |
| **errorMessage** | 子组件下方显示红色错误文本，带警告图标 | DOM 检查 |
| **help 文本** | 子组件下方显示灰色帮助文本（error 时不显示） | DOM 检查 |
| **垂直布局 (vertical)** | label 在子组件上方 | DOM 检查 |
| **水平布局 (horizontal)** | label 在子组件左侧，固定宽度 | DOM 检查 |
| **顶部对齐 (labelAlign: top)** | label 始终在子组件上方 | DOM 检查 |

### 属性配置

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| label | text | 标签 | 标签文本 |
| required | select | false | 是否必填（显示红色星号） |
| error | select | false | 是否错误状态 |
| errorMessage | text | - | 错误消息文本 |
| help | text | - | 帮助文本 |
| name | text | - | 字段名 |
| labelWidth | number | 继承自 Form | 标签宽度（覆盖 Form 配置） |
| labelAlign | select | 继承自 Form | 标签对齐（覆盖 Form 配置） |

---

## 属性面板编辑功能测试

### options 类型属性编辑

Select、CheckboxGroup、RadioGroup 组件的 `options` 属性使用特殊的多行文本编辑方式：

**转换逻辑：**

1. **数组 → 文本**（显示时）：
   - `[{value: 'a', label: '标签A'}, {value: 'b', label: '标签B'}]`
   - 转换为：
   ```
   a:标签A
   b:标签B
   ```

2. **文本 → 数组**（保存时）：
   - 每行解析为一个选项
   - 使用第一个冒号 `:` 分隔 value 和 label
   - 如果没有冒号，value 和 label 相同

**测试要点：**

| 测试项 | 预期行为 | 验证方式 |
|--------|----------|----------|
| **基本转换** | 正确解析 `value:label` 格式 | 单元测试 |
| **无冒号格式** | 解析为 value 和 label 相同 | 单元测试 |
| **多冒号处理** | 只使用第一个冒号分隔，后面的保留在 label 中 | 单元测试 |
| **空白处理** | 自动去除 value 和 label 前后空白 | 单元测试 |
| **空行处理** | 忽略空行和空白行 | 单元测试 |
| **往返转换** | 数组→文本→数组 保持数据一致 | 单元测试 |
| **空输入处理** | 空文本返回 undefined | 单元测试 |
| **undefined/null 处理** | 返回空字符串 | 单元测试 |

### 属性配置分类

每个组件的属性分为三类：

1. **basic** - 基础属性（组件名称、ID 等）
2. **props** - 组件特有属性（组件核心功能属性）
3. **styles** - 样式属性
   - basic: 基础样式（宽、高、边框、背景等）
   - spacing: 间距样式（margin、padding 等）

---

## 组件嵌套测试

### 典型嵌套结构

**Form > FormItem > 表单组件** 是最常见的使用模式：

```
Form (layout: vertical/horizontal)
  ├── FormItem (label: '用户名', required: true)
  │       └── Input
  ├── FormItem (label: '密码', required: true)
  │       └── Input (type: password)
  ├── FormItem (label: '性别')
  │       └── RadioGroup
  ├── FormItem (label: '兴趣')
  │       └── CheckboxGroup
  └── FormItem (label: '地区')
          └── Select
```

### 嵌套测试要点

| 测试项 | 预期行为 | 验证方式 |
|--------|----------|----------|
| **层级结构正确** | Form 包含 FormItem，FormItem 包含子表单组件 | DOM 检查 |
| **Context 穿透** | Form 的配置正确传递到所有子 FormItem | 代码检查 |
| **FormItem 覆盖** | FormItem 的 labelWidth/labelAlign 可覆盖 Form 的配置 | 代码检查 |
| **required 星号** | FormItem 设置 required 后，label 前显示红色星号 | 视觉检查 |
| **错误显示** | FormItem 设置 error 后，子组件和错误消息变红 | 视觉检查 |
| **帮助文本** | FormItem 设置 help 后，子组件下方显示灰色帮助文本 | DOM 检查 |
| **水平布局** | horizontal 布局时，label 在左，组件在右 | DOM 检查 |
| **标签宽度** | labelWidth 控制水平布局时标签的宽度 | DOM 检查 |
| **标签对齐** | labelAlign 控制标签文本对齐方式 | DOM 检查 |

---

## 快速自测清单

### 渲染测试

- [ ] Input 显示 placeholder 和默认值
- [ ] Textarea 显示多行和字数统计
- [ ] Select 显示选项列表和选中值
- [ ] Checkbox 显示 label 和选中状态
- [ ] CheckboxGroup 显示全选功能
- [ ] Radio 显示单选状态
- [ ] RadioGroup 显示单选互斥
- [ ] Switch 显示开关状态
- [ ] Form 正确布局子组件
- [ ] FormItem 显示 label、required 星号、error 信息

### 属性编辑测试

- [ ] 修改 Input 的 placeholder 后画布更新
- [ ] 修改 Input 的 type 后输入行为变化
- [ ] 修改 Input 的 maxLength 后输入被限制
- [ ] 切换 Input 的 clearable 开关
- [ ] 修改 Select 的 placeholder
- [ ] 编辑 Select 的 options（多行文本）后选项列表变化
- [ ] 切换 Select 的 multiple 开关
- [ ] 切换 Select 的 searchable 开关
- [ ] 编辑 CheckboxGroup/RadioGroup 的 options
- [ ] 修改 FormItem 的 label 后标签更新
- [ ] 切换 FormItem 的 required 开关
- [ ] 修改 FormItem 的 help 文本
- [ ] 修改 FormItem 的 errorMessage

### 交互测试

- [ ] Input 可输入文本
- [ ] Input clearable 时可点击清除
- [ ] Select 点击展开下拉
- [ ] Select 选择选项后显示选中值
- [ ] Select 多选时显示 tags
- [ ] Checkbox 点击切换选中状态
- [ ] CheckboxGroup 点击全选/取消全选
- [ ] Radio 点击选中（单选）
- [ ] Switch 点击切换开关状态
- [ ] 禁用状态下组件不可交互

---

## 相关文件

| 文件路径 | 说明 |
|----------|------|
| `src/components/ui/Input.tsx` | Input 组件实现 |
| `src/components/ui/Textarea.tsx` | Textarea 组件实现 |
| `src/components/ui/Select.tsx` | Select 组件实现 |
| `src/components/ui/Checkbox.tsx` | Checkbox/CheckboxGroup 组件实现 |
| `src/components/ui/Radio.tsx` | Radio/RadioGroup 组件实现 |
| `src/components/ui/Switch.tsx` | Switch 组件实现 |
| `src/components/ui/Form.tsx` | Form/FormItem 组件实现 |
| `src/constants/propertyConfig.ts` | 属性面板配置 |
| `src/constants/mockData.ts` | 默认组件配置 |
| `src/types/component.ts` | 组件类型定义 |
| `src/utils/test-helpers.ts` | 测试辅助函数（含 mock 组件） |
| `src/components/ui/formComponents.test.ts` | 表单组件测试 |
| `src/components/builder/PropertyPanel/propertyPanel.test.ts` | 属性面板测试 |

---

## 测试状态

- 单元测试：✅ 已编写
- 类型检查：✅ 已通过
- 文档：✅ 已完成
