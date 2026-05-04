# useMultiSelect Hook 优化自测文档

## 问题概览

### 原始问题

**问题 1：事件监听器频繁重新注册**
- `useEffect` 的依赖项包含 `isShiftKeyPressed` 状态变量
- 每次 Shift 键按下或释放时，effect 的清理函数会移除上一次的 `keydown/keyup` 监听器并重新注册
- 造成频繁的监听器解绑/重新绑定

**问题 2：依赖项问题**
- 事件监听器内部使用 `if (e.key === 'Shift' && !isShiftKeyPressed)` 条件
- 这导致必须将 `isShiftKeyPressed` 添加到 `useEffect` 依赖项
- 形成依赖项循环

**问题 3：回调函数依赖项**
- `handleComponentClick` 和 `handleCanvasClick` 的依赖项中包含 `isShiftKeyPressed`
- 每次 Shift 键状态变化时，这些回调函数都会重新创建

---

## 修复方案

### 使用 useRef 优化

**核心思路：**
1. 使用 `useRef<boolean>` 跟踪 Shift 键状态（用于事件监听器内部）
2. 保留 `useState<boolean>` 用于返回值（外部组件可能需要）
3. `useEffect` 只在挂载时注册一次事件监听器
4. 使用 `useRef` 存储 `options` 参数，避免依赖项问题

### 代码变更对比

**修复前：**
```typescript
const [isShiftKeyPressed, setIsShiftKeyPressed] = useState(false);

useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Shift' && !isShiftKeyPressed) {  // 依赖 isShiftKeyPressed
      setIsShiftKeyPressed(true);
    }
  };
  // ...
  window.addEventListener('keydown', handleKeyDown);
  
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
  };
}, [isShiftKeyPressed]);  // 依赖项包含状态 → 每次变化都重新注册
```

**修复后：**
```typescript
const [isShiftKeyPressed, setIsShiftKeyPressed] = useState(false);
const isShiftKeyPressedRef = useRef(false);  // 新增 ref

useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Shift' && !isShiftKeyPressedRef.current) {  // 使用 ref
      isShiftKeyPressedRef.current = true;  // 同时更新 ref
      setIsShiftKeyPressed(true);           // 和 state
    }
  };
  // ...
  window.addEventListener('keydown', handleKeyDown);
  
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
  };
}, []);  // 依赖项为空 → 只在挂载时注册一次
```

### 完整修改

| 修改点 | 修复前 | 修复后 |
|--------|--------|--------|
| Shift 状态跟踪 | 仅 `useState` | `useState` + `useRef` 双重跟踪 |
| `useEffect` 依赖项 | `[isShiftKeyPressed]` | `[]`（空数组） |
| 事件监听器注册 | 每次 Shift 按键都重新注册 | 只在挂载时注册一次 |
| `handleComponentClick` 依赖 | `[isShiftKeyPressed, ...]` | `[selectedComponentIds, ...]`（移除 isShiftKeyPressed） |
| `handleCanvasClick` 依赖 | `[isShiftKeyPressed, clearSelection, options]` | `[clearSelection]`（使用 ref 访问 options） |

---

## 修改文件

**`src/hooks/useMultiSelect.ts`**

### 新增内容

1. **新增 `isShiftKeyPressedRef`**：用于事件监听器内部跟踪 Shift 键状态
2. **新增 `optionsRef`**：用于存储 `options` 参数，避免回调依赖项问题
3. **新增同步 `optionsRef` 的 `useEffect`**：

```typescript
useEffect(() => {
  optionsRef.current = options;
}, [options]);
```

### 修改内容

1. **事件监听器 `useEffect`**：
   - 依赖项从 `[isShiftKeyPressed]` 改为 `[]`
   - 内部使用 `isShiftKeyPressedRef.current` 替代 `isShiftKeyPressed`

2. **`handleComponentClick` 回调**：
   - 使用 `isShiftKeyPressedRef.current` 替代 `isShiftKeyPressed`
   - 使用 `optionsRef.current.onComponentClick?.(id)` 替代 `options.onComponentClick?.(id)`
   - 依赖项移除 `isShiftKeyPressed` 和 `options`

3. **`handleCanvasClick` 回调**：
   - 使用 `isShiftKeyPressedRef.current` 替代 `isShiftKeyPressed`
   - 使用 `optionsRef.current.onCanvasClick?.()` 替代 `options.onCanvasClick?.()`
   - 依赖项移除 `isShiftKeyPressed` 和 `options`

---

## 手动测试步骤

### 测试 1：Shift+点击多选组件

**前置条件：**
- 开发服务器已启动：`npm run dev`
- 浏览器已打开页面

**测试步骤：**

1. **添加多个组件：**
   - 从组件面板拖入 3 个 Button 组件到画布
   - 确保它们分散在不同位置

2. **Shift+点击多选：**
   - 点击第一个 Button 组件选中它
   - 按住 `Shift` 键，点击第二个 Button 组件
   - **预期：** 两个 Button 都应该被选中（高亮显示）
   - 按住 `Shift` 键，点击第三个 Button 组件
   - **预期：** 三个 Button 都应该被选中

3. **Shift+点击取消选中：**
   - 按住 `Shift` 键，点击第二个 Button 组件
   - **预期：** 第二个 Button 取消选中，第一个和第三个保持选中

4. **验证多选状态：**
   - 检查 PropertyPanel 是否显示"多选模式"（如果有的话）
   - 或者检查控制台日志中 `selectedComponentIds` 数组

**预期结果：**
- ✅ 按住 Shift 点击组件可以添加到选中集合
- ✅ 按住 Shift 点击已选中组件可以取消选中
- ✅ `selectedComponentIds` 数组包含所有选中组件的 ID

---

### 测试 2：Shift 键释放后点击恢复正常单选

**前置条件：**
- 画布上有多个组件，其中一些处于多选状态

**测试步骤：**

1. **确保多选状态：**
   - 按住 Shift 点击多个组件，确认它们被选中

2. **释放 Shift 键：**
   - 松开 Shift 键

3. **点击未选中组件：**
   - 点击一个未被选中的组件
   - **预期：** 多选状态被取消，只有点击的组件被选中

4. **点击已选中组件：**
   - 按住 Shift 选中多个组件
   - 释放 Shift 键
   - 点击其中一个已选中的组件
   - **预期：** 多选状态被取消，只有点击的组件被选中

**预期结果：**
- ✅ 释放 Shift 键后点击未选中组件 → 取消多选，单选该组件
- ✅ 释放 Shift 键后点击已选中组件 → 取消多选，单选该组件

---

### 测试 3：批量删除选中的多个组件

**前置条件：**
- 画布上有 4 个组件

**测试步骤：**

1. **选中多个组件：**
   - 按住 Shift 点击 3 个组件（例如组件 1、2、4）

2. **执行删除：**
   - 按 `Delete` 键
   - **预期：** 选中的 3 个组件被删除，只剩下组件 3

3. **验证删除结果：**
   - 检查画布：只有组件 3 显示
   - 检查选中状态：没有组件被选中（`selectedComponentIds` 为空）

4. **撤销删除：**
   - 按 `Ctrl+Z` 或点击撤销按钮
   - **预期：** 删除的 3 个组件恢复显示

**预期结果：**
- ✅ 删除后只有未选中的组件保留
- ✅ 删除后选中状态被清空
- ✅ 撤销操作可以恢复删除的组件

---

### 测试 4：点击未选中组件取消多选恢复为单选

**前置条件：**
- 画布上有 3 个组件

**测试步骤：**

1. **创建多选状态：**
   - 按住 Shift 点击组件 1 和组件 2

2. **点击未选中组件：**
   - 不按 Shift，点击组件 3
   - **预期：** 组件 3 被选中，组件 1 和 2 取消选中

3. **验证状态：**
   - 检查高亮：只有组件 3 高亮
   - 检查 `selectedComponentIds`：只包含组件 3 的 ID

4. **创建多选后点击已选中组件：**
   - 按住 Shift 点击组件 1 和组件 2
   - 不按 Shift，点击组件 2（已选中）
   - **预期：** 只有组件 2 被选中，组件 1 取消选中

**预期结果：**
- ✅ 普通点击未选中组件 → 取消多选，单选该组件
- ✅ 普通点击已选中组件 → 取消多选，单选该组件
- ✅ `selectedComponentIds` 数组长度变为 1

---

### 测试 5：点击画布取消选中

**前置条件：**
- 画布上有多个组件，其中一些被选中

**测试步骤：**

1. **选中组件：**
   - 选中一个或多个组件

2. **点击画布空白区域：**
   - 点击画布上没有组件的区域
   - **预期：** 所有选中状态被取消

3. **Shift 模式下点击画布：**
   - 选中多个组件
   - 按住 Shift 键，点击画布空白区域
   - **预期：** 选中状态保持不变（因为 Shift 键按下）

4. **释放 Shift 后点击画布：**
   - 释放 Shift 键
   - 点击画布空白区域
   - **预期：** 选中状态被取消

**预期结果：**
- ✅ 普通点击画布 → 清空选中
- ✅ Shift+点击画布 → 保持选中
- ✅ 释放 Shift 后点击画布 → 清空选中

---

### 测试 6：事件监听器注册优化验证

**测试目标：** 验证事件监听器不会在每次 Shift 按键时重新注册

**测试方法（开发者工具）：**

1. **打开 Chrome DevTools：**
   - 按 `F12` 打开开发者工具
   - 切换到 **Sources** 标签

2. **设置断点：**
   - 在 `useMultiSelect.ts` 中找到以下代码：
   ```typescript
   window.addEventListener('keydown', handleKeyDown);
   window.addEventListener('keyup', handleKeyUp);
   ```
   - 在这些行设置断点

3. **测试：**
   - 刷新页面
   - **预期：** 断点只在页面加载时触发一次
   - 按 Shift 键多次
   - **预期：** 断点不会再触发（如果触发说明监听器被重新注册了）

4. **替代方法 - 日志验证：**
   - 在 `handleKeyDown` 和 `handleKeyUp` 中添加临时日志
   - 或者观察控制台中 `Shift key pressed/released` 的日志
   - **预期：** 日志只在实际按键时出现，不应该有"添加/移除监听器"的日志

**预期结果：**
- ✅ 页面加载时只注册一次事件监听器
- ✅ Shift 键按下/释放时不会重新注册监听器
- ✅ 事件监听器保持稳定

---

## 单元测试

### 测试文件

**位置：** `src/hooks/useMultiSelect.test.ts`

### 新增测试用例

| 测试用例 | 验证内容 |
|----------|----------|
| `Shift+点击多选: 连续 Shift+点击应该切换多个组件的选中状态` | 多选功能正常 |
| `Shift+点击多选: 再次 Shift+点击已选中组件应该取消选中` | 取消选中功能正常 |
| `取消多选: 点击未选中组件应该取消多选并选中该组件` | 单选恢复功能正常 |
| `批量删除: 删除多个选中组件后应该清空选中状态` | 批量删除功能正常 |
| `点击画布: 非 Shift 模式下点击画布应该清空选中状态` | 画布点击功能正常 |
| `点击已选中组件: 点击已选中的单个组件应该保持选中状态` | 单选保持功能正常 |
| `Ctrl/Cmd 多选: toggleComponentSelection 应该支持多选` | toggle 功能正常 |
| `空组件列表: clearSelection 在空列表时不应该报错` | 边界情况处理 |
| `selectedComponentId 同步: 选中单个组件时 selectedComponentId 应该同步` | 状态同步 |

### 运行测试

```typescript
// 在浏览器控制台中执行
const runner = runMultiSelectTests();
runner.printSummary();
```

---

## 快速验证清单

### 代码检查

- [ ] `useEffect` 的依赖项为空数组 `[]`
- [ ] 使用 `isShiftKeyPressedRef` 替代 `isShiftKeyPressed` 在事件监听器中
- [ ] `handleComponentClick` 和 `handleCanvasClick` 使用 `optionsRef`
- [ ] TypeScript 编译无错误：`npx tsc --noEmit`

### 功能验证

- [ ] Shift+点击可以多选组件
- [ ] 释放 Shift 后点击恢复单选
- [ ] 按 Delete 可以批量删除选中组件
- [ ] 点击画布空白区域取消选中
- [ ] 点击未选中组件取消多选并单选该组件

---

## 问题排查

### 问题：Shift+点击不工作

**可能原因：**
1. `isShiftKeyPressedRef` 没有正确同步
2. 事件监听器没有正确注册
3. `toggleComponentSelection` 功能异常

**排查步骤：**
1. 检查 `isShiftKeyPressedRef.current` 的值
2. 检查控制台日志 `Shift key pressed/released`
3. 验证 `useBuilderStore.getState().toggleComponentSelection` 正常工作

### 问题：多选状态下点击组件不恢复单选

**可能原因：**
1. `handleComponentClick` 中没有正确区分 Shift 状态
2. 回调函数依赖项问题导致函数没有正确更新

**排查步骤：**
1. 检查 `isShiftKeyPressedRef.current` 在点击时的值
2. 验证 `setSelectedComponentId` 被正确调用

---

## 总结

### 修复收益

1. **性能提升：** 事件监听器只注册一次，避免频繁的绑定/解绑
2. **代码更清晰：** 使用 `useRef` 分离"用于渲染的状态"和"用于逻辑跟踪的状态"
3. **回调稳定性：** `handleComponentClick` 和 `handleCanvasClick` 不再依赖 `isShiftKeyPressed`，避免不必要的重新创建

### 技术要点

- **`useState` vs `useRef`：**
  - `useState`：触发重新渲染，用于影响 UI 的状态
  - `useRef`：不触发重新渲染，用于内部逻辑跟踪

- **useEffect 依赖项优化：**
  - 使用 `useRef` 可以避免将某些状态添加到依赖项
  - 但要注意：`useRef` 的更新不会触发 `useEffect` 重新运行

- **事件监听器最佳实践：**
  - 只在挂载时注册一次
  - 使用 `useRef` 跟踪内部状态
  - 在组件卸载时正确清理

---

*文档生成时间：2026-05-05*
