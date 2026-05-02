# 预览模式自测文档

## 概述

本文档详细说明了预览模式的测试步骤、预期结果和边界情况。预览模式允许用户在不离开构建器的情况下查看页面的真实渲染效果。

---

## 测试环境准备

### 前置条件
1. 开发服务器已启动（`npm run dev`）
2. 浏览器控制台已打开（F12 → Console）
3. 至少有一个测试项目（可以是空项目）

### 测试数据准备
在开始测试前，请确保创建以下测试项目：

1. **空项目**：不添加任何组件
2. **单层组件项目**：添加 2-3 个基础组件（文本、按钮、图片）
3. **嵌套 Container 项目**：创建至少 3 层嵌套的 Container 结构

---

## 测试用例

### 测试用例 1：从 Builder 页面点击预览按钮

**测试步骤：**
1. 导航到 `/builder` 页面
2. 点击页面顶部 Header 中的"预览"按钮

**预期结果：**
- [ ] URL 应该从 `/builder` 变为 `/preview`
- [ ] 页面应该显示预览模式界面，而不是编辑器界面
- [ ] 控制台中不应该有 `console.log('预览操作')` 输出
- [ ] 控制台中不应该有任何错误（`console.error`）

**验证要点：**
- 预览按钮不再只是打印 console.log，而是实际执行路由跳转

---

### 测试用例 2：预览页面没有编辑控件

**测试步骤：**
1. 导航到 `/preview` 页面
2. 仔细观察页面元素

**预期结果：**
- [ ] 没有选中高亮框（编辑模式下选中组件时的蓝色边框 `ring-2 ring-primary-500`）
- [ ] 没有拖拽手柄（编辑模式下的拖拽功能）
- [ ] 没有网格线（编辑模式画布背景的灰色网格）
- [ ] 组件不应该响应点击选择事件
- [ ] 没有左侧组件面板
- [ ] 没有右侧属性面板

**验证要点：**
- 页面应该只显示：
  1. 顶部导航栏（返回编辑按钮、预览模式标题、项目列表按钮）
  2. 浏览器样式的预览窗口（包含关闭/最小化/最大化图标）
  3. 纯渲染的组件内容（无任何编辑交互）

---

### 测试用例 3：返回编辑按钮功能

**测试步骤：**
1. 先在 `/builder` 页面添加一些组件并保存
2. 点击"预览"按钮跳转到 `/preview`
3. 在预览页面点击"返回编辑"按钮

**预期结果：**
- [ ] URL 应该从 `/preview` 变回 `/builder`
- [ ] 之前添加的组件数据应该完全保留，没有丢失
- [ ] 组件的位置、大小、样式应该与预览前完全一致
- [ ] 控制台中不应该有任何错误

**验证要点：**
- 数据在编辑模式和预览模式之间切换时应该完全共享
- 预览模式不应该修改任何 store 中的数据

---

### 测试用例 4：组件树递归渲染（Container 嵌套场景）

**测试步骤：**
1. 在 `/builder` 页面创建以下结构：
   - Container 1（第一层）
     - 文本组件 "第一层文本"
     - Container 2（第二层）
       - 按钮组件 "第二层按钮"
       - Container 3（第三层）
         - 文本组件 "第三层文本"
         - 按钮组件 "第三层按钮"
     - 文本组件 "第一层底部文本"
2. 点击"预览"按钮

**预期结果：**
- [ ] 所有 7 个组件都应该正确渲染（3 个 Container + 4 个基础组件）
- [ ] Container 1 应该包含所有子组件
- [ ] Container 2 应该在 Container 1 内部
- [ ] Container 3 应该在 Container 2 内部
- [ ] 所有文本内容应该正确显示
- [ ] 所有按钮应该正确显示
- [ ] 嵌套层次结构应该保持完整
- [ ] 控制台中不应该有任何错误

**验证要点：**
- ComponentRenderer 的 `renderContainerChildren` 函数应该正确递归渲染
- 3 层嵌套的 Container 都应该正确处理

---

### 测试用例 5：从项目管理页直接预览（URL 参数方式）

**测试步骤：**
1. 导航到 `/projects` 页面
2. 找到一个项目卡片
3. 点击项目卡片上的"预览"按钮（不是"打开"按钮）

**预期结果：**
- [ ] URL 应该变为 `/preview?project=xxx`（xxx 是项目 ID）
- [ ] 页面应该加载该项目的组件数据
- [ ] 不应该加载当前正在编辑的项目（除非点击的是当前项目）
- [ ] 预览页面应该显示该项目的组件
- [ ] 控制台中不应该有任何错误

**验证要点：**
- PreviewPage 中的 `useEffect` 应该正确处理 `projectId` URL 参数
- `loadProject` 函数应该被正确调用

---

### 测试用例 6：边界情况 - 空画布预览

**测试步骤：**
1. 导航到 `/builder` 页面
2. 确保没有添加任何组件（或删除所有组件）
3. 点击"预览"按钮

**预期结果：**
- [ ] 页面应该显示"画布为空"的空状态
- [ ] 空状态图标（📄）应该显示
- [ ] 提示文字"从编辑器添加组件后在此预览"应该显示
- [ ] 页面不应该崩溃
- [ ] 控制台中不应该有任何错误

**验证要点：**
- PreviewPage 应该正确处理 `components.length === 0` 的情况

---

### 测试用例 7：边界情况 - Container 无子元素

**测试步骤：**
1. 导航到 `/builder` 页面
2. 添加一个 Container 组件
3. **不要**向 Container 添加任何子组件
4. 点击"预览"按钮

**预期结果：**
- [ ] Container 应该正确渲染（显示边框和样式）
- [ ] Container 内部应该是空的
- [ ] 页面不应该崩溃
- [ ] 控制台中不应该有任何错误

**验证要点：**
- ComponentRenderer 的 `renderContainerChildren` 函数应该正确处理 `children` 为空数组或 undefined 的情况
- 代码：
  ```typescript
  const renderContainerChildren = () => {
    if (!isContainerComponent(component)) {
      return undefined;
    }
    const children = component.children;
    if (!children || children.length === 0) {
      return undefined;
    }
    // ...
  };
  ```

---

### 测试用例 8：边界情况 - 不存在的项目 ID

**测试步骤：**
1. 直接在浏览器地址栏输入：`/preview?project=non_existent_id_12345`
2. 按回车访问

**预期结果：**
- [ ] 页面应该显示"无法加载指定的项目"的错误状态
- [ ] 或者显示空画布状态
- [ ] 页面不应该崩溃
- [ ] 控制台中不应该有任何未捕获的错误

**验证要点：**
- PreviewPage 应该正确处理 `loadProject` 返回 `null` 的情况
- 代码：
  ```typescript
  const success = loadProject(projectId);
  if (!success) {
    setLoadError('无法加载指定的项目');
  }
  ```

---

### 测试用例 9：预览页面无 console.error

**测试步骤：**
1. 执行上述所有测试用例
2. 在每个测试步骤中观察浏览器控制台

**预期结果：**
- [ ] 控制台中不应该有任何 `console.error` 输出
- [ ] 不应该有 React 渲染异常（如 "Maximum update depth exceeded"）
- [ ] 不应该有未捕获的 Promise 异常
- [ ] 不应该有路由相关的错误

**验证要点：**
- 特别注意：
  1. 从预览页面返回编辑页面时
  2. 加载不存在的项目 ID 时
  3. 空画布预览时
  4. Container 嵌套渲染时

---

## 自动化测试数据结构验证

虽然项目没有完整的 React 组件测试框架，但我们可以验证测试数据结构的正确性。

### 测试数据 1：3 层嵌套 Container

```typescript
import { 
  createMock3LevelNestedContainer, 
  countComponents, 
  findComponentById,
  countContainerDepth 
} from '@/utils/test-helpers';

const components = createMock3LevelNestedContainer();

// 验证组件总数
// 预期：7 个组件（3 个 Container + 4 个基础组件）
console.log('组件总数:', countComponents(components));

// 验证嵌套深度
// 预期：3 层
console.log('嵌套深度:', countContainerDepth(components));

// 验证各层组件存在
console.log('第一层文本存在:', findComponentById(components, 'level-1-text') !== null);
console.log('第二层按钮存在:', findComponentById(components, 'level-2-btn') !== null);
console.log('第三层文本存在:', findComponentById(components, 'level-3-text') !== null);
console.log('第三层按钮存在:', findComponentById(components, 'level-3-btn') !== null);
```

### 测试数据 2：空 Container

```typescript
import { createMockEmptyContainer, countComponents } from '@/utils/test-helpers';

const components = createMockEmptyContainer();

// 验证
// 预期：1 个组件（只有 Container，没有子组件）
console.log('空 Container 组件数:', countComponents(components));
```

### 测试数据 3：混合子元素 Container

```typescript
import { createMockContainerWithMixedChildren, countComponents, countContainerDepth } from '@/utils/test-helpers';

const components = createMockContainerWithMixedChildren();

// 验证
// 预期：5 个组件（2 个 Container + 3 个基础组件）
console.log('混合子元素组件数:', countComponents(components));
// 预期：2 层
console.log('混合子元素嵌套深度:', countContainerDepth(components));
```

---

## 测试检查清单

### 路由跳转测试
- [ ] Builder → Preview 跳转正确
- [ ] Preview → Builder 跳转正确
- [ ] Projects → Preview（带参数）跳转正确
- [ ] Preview → Projects 跳转正确

### 编辑功能禁用测试
- [ ] 无选中高亮框
- [ ] 无拖拽功能
- [ ] 无网格线
- [ ] 无点击选择事件
- [ ] 无组件面板
- [ ] 无属性面板

### 数据完整性测试
- [ ] 切换模式时数据不丢失
- [ ] Store 数据在两个模式间共享
- [ ] 预览模式不修改数据

### 组件渲染测试
- [ ] 单层组件正确渲染
- [ ] 2 层嵌套 Container 正确渲染
- [ ] 3 层嵌套 Container 正确渲染
- [ ] 空 Container 正确渲染
- [ ] Container 混合子元素正确渲染

### 边界情况测试
- [ ] 空画布预览
- [ ] 不存在的项目 ID
- [ ] 无 console.error

---

## 测试结果记录

请在执行测试后填写以下表格：

| 测试用例 | 状态 (✓/✗) | 备注 |
|---------|------------|------|
| 1. Builder → Preview 跳转 | | |
| 2. 无编辑控件 | | |
| 3. 返回编辑且数据不丢失 | | |
| 4. 3 层 Container 嵌套渲染 | | |
| 5. 项目列表直接预览（URL 参数） | | |
| 6. 空画布预览 | | |
| 7. 空 Container 预览 | | |
| 8. 不存在的项目 ID | | |
| 9. 无 console.error | | |

---

## 常见问题排查

### 问题 1：Maximum update depth exceeded

**可能原因：**
- PreviewPage 中的 useEffect 依赖项问题
- 循环调用 loadProject

**解决方案：**
- 使用 useRef 追踪已加载的项目 ID
- 确保 useEffect 依赖项正确

```typescript
// 正确做法
const loadedProjectRef = useRef<string | null>(null);

useEffect(() => {
  if (projectId && projectId !== loadedProjectRef.current && !isCurrentProject(projectId)) {
    loadedProjectRef.current = projectId;
    loadProject(projectId);
  }
}, [projectId]); // 只依赖 projectId
```

### 问题 2：ToastProvider 嵌套问题

**可能原因：**
- App.tsx 中已有 ToastProvider
- 在路由 Layout 中又添加了 ToastProvider

**解决方案：**
- 每个页面自己管理 ToastProvider
- 不在路由 Layout 中添加全局 ToastProvider

### 问题 3：Container 子组件不渲染

**可能原因：**
- renderContainerChildren 函数逻辑问题
- 递归调用时参数传递错误

**解决方案：**
- 检查 isContainerComponent 判断
- 检查 children 数组处理
- 确保递归时传递 editable 参数

```typescript
// 正确做法
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
      onClick={editable && onClick ? (e) => handleWrapperClick(e, onClick) : undefined}
      editable={editable} // 确保传递
    />
  ));
};
```

---

## 附录：相关代码位置

| 功能 | 文件路径 | 关键函数/组件 |
|------|---------|-------------|
| 预览渲染器 | `src/components/builder/ComponentRenderer/index.tsx` | `PreviewRenderer`, `ComponentRenderer` |
| 预览页面 | `src/pages/PreviewPage.tsx` | `PreviewPage` |
| 路由配置 | `src/router/index.tsx` | `router` |
| 预览按钮处理 | `src/App.tsx` | `handlePreview` |
| 项目列表预览 | `src/pages/ProjectsPage.tsx` | `handlePreviewProject` |
| 测试辅助函数 | `src/utils/test-helpers.ts` | `createMock3LevelNestedContainer`, etc. |

---

## 总结

预览模式的核心设计原则：
1. **数据共享**：与编辑模式共享同一个 Zustand store
2. **展示分离**：通过 `editable` 参数控制编辑相关的样式和事件
3. **安全隔离**：预览模式不修改任何数据，只负责渲染
4. **递归完整**：Container 组件的子元素正确递归渲染

执行完所有测试用例后，请确保：
- 所有检查清单项目都已验证
- 控制台没有任何错误
- 边界情况都已覆盖
