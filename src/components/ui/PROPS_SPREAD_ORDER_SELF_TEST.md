# Props Spread 顺序自测文档

## 问题背景

在 React JSX 中，props 的展开顺序会影响最终的渲染结果：

**错误的做法（会被覆盖）：**
```jsx
<button disabled={computedDisabled} type={computedType} {...restProps} />
```
- 此时 `restProps` 中的 `disabled`、`type` 会覆盖显式设置的值

**正确的做法（显式属性优先）：**
```jsx
<button {...restProps} disabled={computedDisabled} type={computedType} />
```
- 此时显式设置的 `disabled`、`type` 会覆盖 `restProps` 中的值

---

## 修复范围

### 第一轮：基础组件（Base Components）
| 组件 | 状态 | 关键风险属性 |
|------|------|-------------|
| Text.tsx | ✅ 已修复 | className, ref |
| Button.tsx | ✅ 已修复 | disabled, type, className, onClick, ref |
| Image.tsx | ✅ 已修复 | src, alt, onError, onLoad, className, disabled |
| Container.tsx | ✅ 已修复 | className, ref, style |

### 第二轮：表单组件（Form Components）
| 组件 | 状态 | 关键风险属性 |
|------|------|-------------|
| Input.tsx | ✅ 已修复 | value, disabled, placeholder, onChange, onFocus, onBlur, className |
| Textarea.tsx | ✅ 已修复 | value, disabled, placeholder, onChange, className |
| Checkbox.tsx | ✅ 已修复 | checked, disabled, onChange, className |
| Radio.tsx | ✅ 已修复 | checked, disabled, name, onChange, className |
| Select.tsx | ✅ 安全 | 无 {...props} 展开操作符 |
| Switch.tsx | ✅ 安全 | 无 {...props} 展开操作符 |

### 第二轮：高级业务组件（Advanced Components）
| 组件 | 状态 | 关键风险属性 |
|------|------|-------------|
| Card.tsx | ✅ 已修复 | className, ref, style |
| Modal.tsx | ✅ 安全 | 无 {...props} 展开操作符 |

---

## 各组件详细检查清单

### 1. Button 组件检查清单

#### 检查项 1.1：disabled 属性不被覆盖
**场景**：设置 `disabled={true}` 同时传入 `{...restProps}` 其中包含 `disabled={false}`
**预期行为**：按钮应该处于禁用状态（显式的 `disabled={true}` 优先）
**验证方法**：
```jsx
<Button disabled={true} disabled={false} />
// 修复后：按钮应该是禁用的
// 修复前：按钮可能不是禁用的（取决于 props 展开顺序）
```

#### 检查项 1.2：type 属性不被覆盖
**场景**：设置 `variant="danger"` 同时传入 `{...restProps}` 其中包含 `variant="secondary"`
**预期行为**：按钮应该显示 danger 样式（红色背景）
**验证方法**：
```jsx
<Button variant="danger" variant="secondary" />
// 修复后：应该是红色危险按钮
// 修复前：可能显示为 secondary 样式
```

#### 检查项 1.3：className 正确合并
**场景**：设置 `className="custom-class"` 同时传入 `{...restProps}` 其中包含 `className="other-class"`
**预期行为**：通过 `cn()` 函数合并两个 class
**验证方法**：组件应该同时包含基础样式和传入的自定义样式

#### 检查项 1.4：onClick 事件处理器不被覆盖
**场景**：组件内部有包装的 onClick 逻辑，同时传入 `{...restProps}` 其中包含 `onClick`
**预期行为**：显式的 onClick 处理器应该优先执行
**验证方法**：点击按钮时，显式设置的 onClick 应该被调用

---

### 2. Input 组件检查清单

#### 检查项 2.1：placeholder 不被覆盖
**场景**：设置 `placeholder="请输入用户名"` 同时传入 `{...restProps}` 其中包含 `placeholder="其他占位符"`
**预期行为**：输入框显示 "请输入用户名"
**验证方法**：
```jsx
<Input placeholder="请输入用户名" placeholder="其他占位符" />
// 修复后：显示 "请输入用户名"
// 修复前：可能显示 "其他占位符"
```

#### 检查项 2.2：disabled 不被覆盖
**场景**：设置 `disabled={true}` 同时传入 `{...restProps}` 其中包含 `disabled={false}`
**预期行为**：输入框应该是禁用状态
**验证方法**：输入框不能获得焦点，不能输入内容

#### 检查项 2.3：value（受控值）不被覆盖
**场景**：设置 `value="固定值"` 同时传入 `{...restProps}` 其中包含 `value="其他值"`
**预期行为**：输入框显示 "固定值"
**验证方法**：
```jsx
<Input value="固定值" value="其他值" />
// 修复后：显示 "固定值"
// 修复前：可能显示 "其他值"
```

#### 检查项 2.4：onChange 事件处理器不被覆盖
**场景**：组件内部有包装的 onChange 逻辑（包含验证），同时传入 `{...restProps}` 其中包含 `onChange`
**预期行为**：显式的 onChange 处理器应该被调用，验证逻辑应该执行
**验证方法**：输入内容时，验证逻辑应该触发，onChange 回调应该被调用

#### 检查项 2.5：readOnly 不被覆盖
**场景**：设置 `readOnly={true}` 同时传入 `{...restProps}` 其中包含 `readOnly={false}`
**预期行为**：输入框应该是只读状态（可以获得焦点，但不能编辑）

---

### 3. Select 组件检查清单

**注意**：Select 组件没有使用 `{...props}` 展开操作符，不存在覆盖风险。

#### 检查项 3.1：options 数组正确渲染
**场景**：传入 `options={[{value: 'a', label: '选项A'}]}`
**预期行为**：下拉列表显示正确的选项
**验证方法**：点击下拉框，应该显示 "选项A"

#### 检查项 3.2：value 正确生效
**场景**：设置 `value="a"` 同时 `options` 包含 `{value: 'a', label: '选项A'}`
**预期行为**：选中 "选项A"
**验证方法**：下拉框显示 "选项A" 为选中状态

#### 检查项 3.3：disabled 正确生效
**场景**：设置 `disabled={true}`
**预期行为**：下拉框不能打开，显示禁用样式

---

### 4. Checkbox 组件检查清单

#### 检查项 4.1：checked 不被覆盖
**场景**：设置 `checked={true}` 同时传入 `{...restProps}` 其中包含 `checked={false}`
**预期行为**：复选框应该是选中状态
**验证方法**：
```jsx
<Checkbox checked={true} checked={false} />
// 修复后：显示选中状态
// 修复前：可能显示未选中状态
```

#### 检查项 4.2：disabled 不被覆盖
**场景**：设置 `disabled={true}` 同时传入 `{...restProps}` 其中包含 `disabled={false}`
**预期行为**：复选框应该是禁用状态
**验证方法**：点击复选框没有反应，显示禁用样式

#### 检查项 4.3：onChange 事件处理器不被覆盖
**场景**：设置 `onChange={handler}` 同时传入 `{...restProps}` 其中包含其他 `onChange`
**预期行为**：显式的 onChange 处理器应该被调用
**验证方法**：点击复选框时，handler 应该被调用，参数为正确的 checked 值

---

### 5. Modal 组件检查清单

**注意**：Modal 组件没有使用 `{...props}` 展开操作符，不存在覆盖风险。

#### 检查项 5.1：visible 正确控制显示/隐藏
**场景**：设置 `visible={true}` 或 `visible={false}`
**预期行为**：
- `visible={true}`：弹窗显示
- `visible={false}`：弹窗隐藏
**验证方法**：
```jsx
<Modal visible={true} /> // 应该显示弹窗
<Modal visible={false} /> // 应该隐藏弹窗
```

#### 检查项 5.2：title 正确显示
**场景**：设置 `title="弹窗标题"`
**预期行为**：弹窗头部显示 "弹窗标题"

#### 检查项 5.3：closable 正确生效
**场景**：设置 `closable={false}`
**预期行为**：弹窗不显示关闭按钮

#### 检查项 5.4：maskClosable 正确生效
**场景**：设置 `maskClosable={false}`
**预期行为**：点击遮罩层不能关闭弹窗

---

### 6. Text 组件检查清单

#### 检查项 6.1：className 不被覆盖
**场景**：设置 `className="text-red-500"` 同时传入 `{...restProps}` 其中包含 `className="text-blue-500"`
**预期行为**：通过 `cn()` 合并，组件的基础样式 + 传入的 className
**验证方法**：文本应该有正确的颜色和字体样式

#### 检查项 6.2：variant 正确生效
**场景**：设置 `variant="h1"`
**预期行为**：文本应该是 h1 大小的样式

#### 检查项 6.3：color 正确生效
**场景**：设置 `color="primary"`
**预期行为**：文本应该是主色调

---

### 7. Image 组件检查清单

#### 检查项 7.1：src 不被覆盖
**场景**：设置 `src="/actual-image.png"` 同时传入 `{...restProps}` 其中包含 `src="/other-image.png"`
**预期行为**：加载 "/actual-image.png"
**验证方法**：图片应该显示正确的内容

#### 检查项 7.2：onError 事件处理器不被覆盖
**场景**：图片加载失败时，组件内部有 fallback 逻辑
**预期行为**：
- 内部的 `handleError` 应该被调用
- 显示 fallback 图片
- loading 状态正确更新
- 用户传入的 `onError` 回调也应该被调用

#### 检查项 7.3：onLoad 事件处理器不被覆盖
**场景**：图片加载成功时
**预期行为**：
- 内部的 `handleLoad` 应该被调用
- loading 状态更新为 false
- 图片从不透明过渡到显示
- 用户传入的 `onLoad` 回调也应该被调用

#### 检查项 7.4：disabled 不被覆盖（如果有）
**场景**：如果组件支持 disabled 状态
**预期行为**：显式设置的 disabled 应该优先

---

### 8. Container 组件检查清单

#### 检查项 8.1：className 不被覆盖
**场景**：设置 `className="custom-container"` 同时传入 `{...restProps}` 其中包含 `className="other-class"`
**预期行为**：通过 `cn()` 合并，flex 布局样式 + 传入的 className

#### 检查项 8.2：direction 正确生效
**场景**：设置 `direction="row"`
**预期行为**：子元素水平排列

#### 检查项 8.3：gap 正确生效
**场景**：设置 `gap="lg"`
**预期行为**：子元素之间有大间距

---

### 9. Textarea 组件检查清单

#### 检查项 9.1：value 不被覆盖
**场景**：设置 `value="多行文本"` 同时传入 `{...restProps}` 其中包含 `value="其他文本"`
**预期行为**：显示 "多行文本"

#### 检查项 9.2：disabled 不被覆盖
**场景**：设置 `disabled={true}` 同时传入 `{...restProps}` 其中包含 `disabled={false}`
**预期行为**：文本域应该是禁用状态

#### 检查项 9.3：placeholder 不被覆盖
**场景**：设置 `placeholder="请输入描述"` 同时传入 `{...restProps}` 其中包含 `placeholder="其他"`
**预期行为**：显示 "请输入描述"

#### 检查项 9.4：onChange 不被覆盖
**场景**：设置 `onChange={handler}` 同时传入 `{...restProps}` 其中包含其他 `onChange`
**预期行为**：显式的 onChange 处理器应该被调用，验证逻辑应该执行

---

### 10. Radio 组件检查清单

#### 检查项 10.1：checked 不被覆盖
**场景**：设置 `checked={true}` 同时传入 `{...restProps}` 其中包含 `checked={false}`
**预期行为**：单选框应该是选中状态

#### 检查项 10.2：disabled 不被覆盖
**场景**：设置 `disabled={true}` 同时传入 `{...restProps}` 其中包含 `disabled={false}`
**预期行为**：单选框应该是禁用状态

#### 检查项 10.3：name 不被覆盖
**场景**：设置 `name="gender-group"` 同时传入 `{...restProps}` 其中包含 `name="other-group"`
**预期行为**：单选框的 name 应该是 "gender-group"
**重要性**：name 决定了哪些单选框是一组的，如果被覆盖，单选框组的互斥逻辑会失效

#### 检查项 10.4：onChange 不被覆盖
**场景**：设置 `onChange={handler}` 同时传入 `{...restProps}` 其中包含其他 `onChange`
**预期行为**：显式的 onChange 处理器应该被调用

---

### 11. Card 组件检查清单

#### 检查项 11.1：className 不被覆盖
**场景**：设置 `className="my-card"` 同时传入 `{...restProps}` 其中包含 `className="other-card"`
**预期行为**：通过 `cn()` 合并，卡片基础样式 + 传入的 className

#### 检查项 11.2：shadow 正确生效
**场景**：设置 `shadow="lg"`
**预期行为**：卡片有大阴影

#### 检查项 11.3：bordered 正确生效
**场景**：设置 `bordered={false}`
**预期行为**：卡片没有边框

#### 检查项 11.4：hoverable 正确生效
**场景**：设置 `hoverable={true}`
**预期行为**：鼠标悬停时卡片有上浮和阴影加深效果

---

### 12. Switch 组件检查清单

**注意**：Switch 组件没有使用 `{...props}` 展开操作符，不存在覆盖风险。

#### 检查项 12.1：checked 正确生效
**场景**：设置 `checked={true}`
**预期行为**：开关处于开启状态

#### 检查项 12.2：disabled 正确生效
**场景**：设置 `disabled={true}`
**预期行为**：开关不能点击，显示禁用样式

#### 检查项 12.3：loading 正确生效
**场景**：设置 `loading={true}`
**预期行为**：开关显示加载动画

---

## 高风险属性优先级列表

以下属性如果被覆盖，可能导致严重的功能问题，按风险等级排序：

### 🔴 高风险（功能失效）
| 属性 | 影响 | 受影响组件 |
|------|------|-----------|
| `value` | 受控组件状态管理失效 | Input, Textarea, Select |
| `checked` | 复选框/单选框状态异常 | Checkbox, Radio, Switch |
| `disabled` | 已禁用的组件可能被用户操作 | Button, Input, Textarea, Checkbox, Radio, Select, Switch |
| `onChange` | 状态变更无法触发，验证逻辑失效 | Input, Textarea, Checkbox, Radio, Select, Switch |
| `onClick` | 按钮无法响应点击 | Button |
| `onError` | Image 组件 fallback 失效 | Image |
| `onLoad` | Image 组件 loading 状态异常 | Image |

### 🟡 中风险（样式/体验问题）
| 属性 | 影响 | 受影响组件 |
|------|------|-----------|
| `className` | 组件样式异常 | 所有使用 className 的组件 |
| `style` | 内联样式被覆盖 | 所有使用 style 的组件 |
| `name` | 单选框组互斥逻辑失效 | Radio, RadioGroup |

### 🟢 低风险（显示问题）
| 属性 | 影响 | 受影响组件 |
|------|------|-----------|
| `placeholder` | 占位符显示不正确 | Input, Textarea, Select |
| `ref` | 组件引用异常（通常会被合并） | 所有使用 ref 的组件 |
| `id` | 元素 ID 被覆盖 | 所有有 id 属性的组件 |

---

## 手动验证步骤

### 步骤 1：检查代码结构
对于每个修复的组件，检查 JSX 代码：

**正确模式：**
```jsx
<element
  {...props}           // 第一个位置
  ref={ref}             // 第二个位置
  className={cn(...)}   // 第三个位置
  // 其他显式属性...
/>
```

**错误模式（已修复）：**
```jsx
<element
  ref={ref}
  className={cn(...)}
  // 其他显式属性...
  {...props}           // 错误：在最后
/>
```

### 步骤 2：创建测试场景
在测试页面或 Storybook 中创建以下测试用例：

```jsx
// 测试 Button disabled 覆盖
<Button 
  disabled={true} 
  // 模拟传入的 restProps 包含 disabled={false}
/>

// 测试 Input placeholder 覆盖
<Input 
  placeholder="正确的占位符" 
  value="测试值"
  disabled={false}
/>

// 测试 Checkbox checked 覆盖
<Checkbox 
  checked={true} 
  label="应该选中"
/>

// 测试 Image onError 不被覆盖
<Image 
  src="/invalid-image.png" 
  fallback="/fallback.png"
/>
```

### 步骤 3：验证行为
1. **Button**：点击应该没有反应，显示禁用样式
2. **Input**：显示正确的占位符，不能输入（如果 disabled=true）
3. **Checkbox**：显示选中状态
4. **Image**：加载失败时显示 fallback 图片，loading 状态正确

---

## 自动化测试

运行集成测试文件：
```
src/components/ui/propsSpreadOrder.test.ts
```

该测试文件包含：
- 基础组件顺序验证
- 表单组件顺序验证  
- 高级组件顺序验证
- 覆盖风险分析
- 修复状态汇总

---

## 修复统计

| 类别 | 已修复 | 安全（无 spread） | 总计 |
|------|--------|------------------|------|
| 基础组件 | 4 | 0 | 4 |
| 表单组件 | 4 | 2 | 6 |
| 高级组件 | 1 | 1 | 2 |
| **总计** | **9** | **3** | **12** |

**修复日期**：2026-05-04

---

## 后续建议

1. **代码审查**：在 PR 中增加 props spread 顺序的检查项
2. **ESLint 规则**：考虑添加自定义 ESLint 规则，强制 `{...props}` 必须放在显式属性之前
3. **测试覆盖**：为每个组件添加单元测试，验证关键属性的优先级
4. **文档更新**：在组件文档中说明 props 的优先级规则

---

## 参考

- [React 官方文档 - JSX 展开属性](https://react.dev/learn/writing-markup-with-jsx#spreading-props)
- [React 官方文档 - 组件 props](https://react.dev/learn/passing-props-to-a-component)

**关键要点**：在 JSX 中，后面的属性会覆盖前面的属性。因此，`{...props}` 应该放在显式属性之前，这样显式属性才能优先生效。
