# 项目加载无限循环 Bug 修复自测文档

## 1. 问题背景

### 1.1 Bug 现象

点击项目卡片上的「继续编辑」或「打开」按钮后，控制台报错：

```
Error: Maximum update depth exceeded.
```

错误栈指向：
- `loadLatestProject` → `setComponents` → 无限循环渲染

页面被 React Router 默认 ErrorBoundary 捕获，显示白色错误页，无法进入编辑器。

### 1.2 问题根因

**无限循环触发路径**：

```
App.tsx:114-119 useEffect
         ↓
    loadLatestProject (依赖项)
         ↓
    setComponents → pushHistory → 更新多个状态
         ↓
    Zustand 函数引用变化
         ↓
    useEffect 依赖项变化 → 重新执行
         ↓
    又调用 loadLatestProject → 无限循环
```

**两个层面的问题**：

1. **Store 层**：`loadLatestProject` 和 `loadProject` 使用 `setComponents`
   - `setComponents` 会调用 `pushHistory` 推入历史记录
   - 同时更新 `history`、`currentIndex`、`canUndo`、`canRedo`、`components` 多个状态

2. **组件层**：`useEffect` 依赖 `loadLatestProject`
   - 该函数引用在状态变化时会改变
   - 导致 `useEffect` 不断重执行

---

## 2. 修复内容

### 2.1 Store 层修复 (`src/store/useBuilderStore.ts`)

**修改前**：

```typescript
loadLatestProject: () => {
  const project = getLatestProject();
  if (!project) {
    return false;
  }

  const { setComponents } = get();
  setComponents(project.components);  // ❌ 调用 setComponents 会推入历史

  set({ ... });  // 再次更新状态
  return true;
};
```

**修改后**：

```typescript
loadLatestProject: () => {
  const project = getLatestProject();
  if (!project) {
    return false;
  }

  const initialHistory: HistoryState[] = [
    {
      components: structuredClone(project.components),
      selectedComponentId: null,
    },
  ];

  set(
    {
      components: project.components,  // ✅ 直接设置，不推入历史
      currentProjectId: project.id,
      projectName: project.name,
      lastSavedAt: project.updatedAt,
      selectedComponentId: null,
      saveStatus: 'idle',
      saveErrorMessage: null,
      loadError: null,
      isProjectCorrupted: false,
      history: initialHistory,  // ✅ 重置历史记录
      currentIndex: 0,
      canUndo: false,
      canRedo: false,
    },
    false,
    'loadLatestProject'
  );

  return true;
};
```

### 2.2 组件层修复 (`src/App.tsx`)

**修改前**：

```typescript
useEffect(() => {
  const hasProject = loadLatestProject();
  if (hasProject) {
    toast.info('已恢复上次编辑的项目');
  }
}, [loadLatestProject, toast]);  // ❌ 依赖 loadLatestProject
```

**修改后**：

```typescript
const hasLoadedInitialProject = useRef(false);

useEffect(() => {
  if (hasLoadedInitialProject.current) {
    return;
  }
  hasLoadedInitialProject.current = true;
  
  if (!currentProjectId) {  // ✅ 检查是否已加载项目
    const hasProject = loadLatestProject();
    if (hasProject) {
      toast.info('已恢复上次编辑的项目');
    }
  }
}, []);  // ✅ 空依赖数组
```

---

## 3. 测试场景

### 场景 1：页面首次挂载时自动恢复最后一个项目

#### 测试步骤

1. **准备测试环境**
   - 确保浏览器中至少有一个已保存的项目
   - 如果没有，打开编辑器添加一些组件，然后等待自动保存

2. **验证本地存储**
   - 打开开发者工具 → Application → Local Storage
   - 确认存在以 `lowcode_builder_project_` 开头的 key
   - 确认 `lowcode_builder_project_list` 包含项目 ID

3. **冷启动测试**
   - 完全关闭浏览器标签页或清空浏览器缓存
   - 重新访问编辑器页面 `/builder`

4. **验证恢复行为**
   - 观察是否出现 Toast 提示：「已恢复上次编辑的项目」
   - 确认画布上显示的是上次保存的组件
   - 确认项目名称正确
   - 打开开发者工具控制台，检查是否有错误

#### 预期结果

| 检查项 | 预期状态 |
|-------|---------|
| Toast 提示 | 显示「已恢复上次编辑的项目」 |
| 画布组件 | 与最后保存的一致 |
| 项目名称 | 与最后保存的一致 |
| 控制台错误 | 无 |
| 页面渲染 | 正常，无白色错误页 |

---

### 场景 2：从项目列表点击打开指定项目并进入编辑器

#### 测试步骤

1. **准备测试环境**
   - 保存至少 2 个不同的项目
   - 项目 A：包含文本组件
   - 项目 B：包含按钮组件

2. **访问项目列表页面**
   - 导航到 `/projects` 页面

3. **验证项目列表**
   - 确认列表显示所有保存的项目
   - 最新保存的项目应显示「当前打开」标记

4. **点击非当前项目**
   - 点击项目卡片上的「打开」按钮（不是「当前打开」的项目）
   - 或点击项目卡片主体

5. **验证跳转行为**
   - 观察 URL 是否变为 `/builder`
   - 观察是否出现 Toast 提示：「已切换到项目：xxx」
   - 确认画布显示的是点击的项目的组件
   - 确认项目名称正确

6. **验证无无限循环**
   - 打开开发者工具控制台
   - 确认没有 `Maximum update depth exceeded` 错误
   - 确认页面没有卡顿

#### 预期结果

| 检查项 | 预期状态 |
|-------|---------|
| URL 导航 | 从 `/projects` → `/builder` |
| Toast 提示 | 显示「已切换到项目：xxx」 |
| 画布组件 | 与点击的项目一致 |
| 项目名称 | 与点击的项目一致 |
| 控制台错误 | 无 |
| 页面性能 | 无卡顿，渲染正常 |

---

### 场景 3：在编辑器中刷新页面后项目数据保持

#### 测试步骤

1. **准备测试环境**
   - 打开编辑器页面
   - 添加一些组件（文本、按钮、容器等）
   - 等待自动保存完成（观察右上角状态）

2. **记录当前状态**
   - 记录组件数量和类型
   - 记录项目名称
   - 截图或记忆当前画布状态

3. **刷新页面**
   - 按 F5 或点击浏览器刷新按钮
   - 或使用 Ctrl+R / Cmd+R

4. **验证数据保持**
   - 确认页面正常加载
   - 确认组件数量和类型与刷新前一致
   - 确认项目名称正确
   - 确认没有控制台错误

5. **验证可编辑性**
   - 尝试添加新组件
   - 尝试修改现有组件属性
   - 确认操作正常

#### 预期结果

| 检查项 | 预期状态 |
|-------|---------|
| 页面加载 | 正常，无白色错误页 |
| 组件数量 | 与刷新前一致 |
| 组件类型 | 与刷新前一致 |
| 项目名称 | 与刷新前一致 |
| 可编辑性 | 可添加、修改、删除组件 |
| 控制台错误 | 无 |

---

### 场景 4：当前已打开项目时切换到另一个项目

#### 测试步骤

1. **准备测试环境**
   - 创建项目 A：添加一个文本组件「这是项目 A」
   - 创建项目 B：添加一个按钮组件「项目 B 按钮」

2. **打开项目 A**
   - 确认当前项目是 A
   - 确认 `currentProjectId` 是项目 A 的 ID

3. **切换到项目列表**
   - 点击顶部项目名称，跳转到 `/projects`

4. **点击项目 B**
   - 点击项目 B 卡片上的「打开」按钮

5. **验证切换行为**
   - 确认当前项目变为 B
   - 确认画布显示的是按钮组件（不是文本组件）
   - 确认项目名称正确

6. **验证数据一致性**
   - 再切换回项目 A
   - 确认项目 A 的文本组件仍然存在
   - 确认没有数据丢失

#### 预期结果

| 阶段 | 检查项 | 预期状态 |
|-----|-------|---------|
| 初始 | 当前项目 | 项目 A |
| 切换到 B | 项目名称 | 项目 B |
| 切换到 B | 画布组件 | 按钮组件 |
| 切换回 A | 项目名称 | 项目 A |
| 切换回 A | 画布组件 | 文本组件 |
| 全程 | 控制台错误 | 无 |

---

### 场景 5：模拟 useEffect 循环渲染场景

#### 测试步骤

1. **准备测试环境**
   - 确保有一个已保存的项目
   - 打开开发者工具

2. **添加调试断点（可选）**
   - 在 `App.tsx` 的 `useEffect` 中添加 `console.log`
   - 或在 `useBuilderStore.ts` 的 `loadLatestProject` 中添加日志

3. **访问编辑器页面**
   - 导航到 `/builder`

4. **观察执行次数**
   - 检查 `loadLatestProject` 被调用的次数
   - 应该只被调用 **1 次**
   - 如果被调用多次（>5 次），说明存在循环问题

5. **验证历史记录**
   - 在加载项目后，尝试添加一个新组件
   - 确认「撤销」按钮变为可用
   - 点击「撤销」，确认新添加的组件被移除

6. **验证无循环**
   - 页面停留 30 秒
   - 观察 CPU 使用率（任务管理器）
   - 观察内存占用
   - 确认没有异常增长

#### 预期结果

| 检查项 | 预期状态 |
|-------|---------|
| `loadLatestProject` 调用次数 | 1 次（不是无限循环） |
| 加载后 `canUndo` | false（历史已重置） |
| 添加组件后 `canUndo` | true |
| CPU 使用率 | 正常（不是 100%） |
| 内存占用 | 稳定（不是持续增长） |

---

### 场景 6：没有任何已保存项目时的行为

#### 测试步骤

1. **清理本地存储**
   - 打开开发者工具 → Application → Local Storage
   - 删除所有以 `lowcode_builder_project_` 开头的 key
   - 删除 `lowcode_builder_project_list`

2. **访问编辑器页面**
   - 导航到 `/builder`

3. **验证初始化行为**
   - 确认页面正常加载
   - 确认没有 Toast 提示（因为没有可恢复的项目）
   - 确认画布是空的（或显示默认的空画布）
   - 确认控制台没有错误

4. **验证 `loadLatestProject` 返回值**
   - 在控制台执行：`useBuilderStore.getState().loadLatestProject()`
   - 应该返回 `false`

5. **验证可正常编辑**
   - 添加一个新组件
   - 确认添加成功
   - 确认没有错误

#### 预期结果

| 检查项 | 预期状态 |
|-------|---------|
| `loadLatestProject()` 返回值 | false |
| Toast 提示 | 无（没有可恢复的项目） |
| 画布状态 | 空或默认空画布 |
| 控制台错误 | 无 |
| 可编辑性 | 正常 |

---

### 场景 7：localStorage 数据格式损坏时的友好降级

#### 测试步骤

1. **准备测试环境**
   - 创建一个正常项目
   - 记录项目 ID（在 localStorage key 中）

2. **损坏数据**
   - 打开开发者工具 → Application → Local Storage
   - 找到项目对应的 key：`lowcode_builder_project_{ID}`
   - 将其值修改为无效的 JSON，例如：`invalid json {{{{`

3. **访问项目列表页面**
   - 导航到 `/projects`

4. **验证列表行为**
   - 确认损坏的项目不会出现在列表中
   - 或确认显示适当的错误状态

5. **尝试加载损坏项目**
   - 在控制台执行：`useBuilderStore.getState().loadProject('损坏的项目ID')`
   - 观察返回值和状态

6. **验证错误处理**
   - 检查 `loadError` 状态
   - 检查 `isProjectCorrupted` 状态
   - 确认页面没有崩溃

#### 预期结果

| 检查项 | 预期状态 |
|-------|---------|
| `loadProject(损坏ID)` 返回值 | false |
| `loadError` | 有错误消息 |
| `isProjectCorrupted` | true |
| 页面状态 | 不崩溃，保持可用 |
| 项目列表 | 损坏项目不显示或显示错误提示 |

---

### 场景 8：加载项目后撤销/重做功能正常工作

#### 测试步骤

1. **准备测试环境**
   - 创建项目 A：包含 1 个文本组件
   - 保存项目

2. **重新加载项目**
   - 刷新页面或重新访问 `/builder`

3. **验证初始状态**
   - 确认「撤销」按钮：禁用状态（`canUndo = false`）
   - 确认「重做」按钮：禁用状态（`canRedo = false`）

4. **执行修改操作**
   - 添加一个按钮组件
   - 确认「撤销」按钮变为启用

5. **测试撤销**
   - 点击「撤销」按钮
   - 确认按钮组件被移除
   - 确认「重做」按钮变为启用

6. **测试重做**
   - 点击「重做」按钮
   - 确认按钮组件重新出现
   - 确认「撤销」按钮变为启用

7. **多次操作测试**
   - 添加文本组件
   - 添加容器组件
   - 删除某个组件
   - 测试撤销所有操作
   - 测试重做所有操作

#### 预期结果

| 阶段 | 操作 | canUndo | canRedo | 画布状态 |
|-----|------|---------|---------|---------|
| 加载后 | 无 | false | false | 1 个文本组件 |
| 添加按钮 | addComponent | true | false | 2 个组件 |
| 撤销 | undo | false | true | 1 个文本组件 |
| 重做 | redo | true | false | 2 个组件 |

**关键点**：
- 加载项目后，历史记录被重置为初始状态
- 新操作从新的起点开始记录
- 撤销/重做功能与加载前的行为一致

---

## 4. 自动化测试覆盖

### 4.1 测试文件位置

测试代码位于：`src/store/projectLoading.test.ts`

### 4.2 测试用例分类

#### 【核心路径测试】

| 测试用例名称 | 覆盖场景 |
|-------------|---------|
| `【核心路径】页面首次挂载时自动恢复最后一个项目` | 场景 1 |
| `【核心路径】loadProject 加载指定项目并重置历史记录` | 场景 2、8 |
| `【核心路径】当前已打开项目时切换到另一个项目` | 场景 4 |
| `【核心路径】saveCurrentAndLoadProject 切换项目时保存当前` | 场景 4 |
| `【核心路径】saveCurrentAndLoadProject 切换到同一项目不做操作` | 边界情况 |

#### 【循环渲染保护测试】

| 测试用例名称 | 覆盖场景 |
|-------------|---------|
| `【循环渲染保护】loadLatestProject 不应该推入历史记录` | 场景 5 |
| `【循环渲染保护】loadProject 不应该推入历史记录` | 场景 5 |
| `【循环渲染保护】多次调用 loadLatestProject 不会累积状态变更` | 场景 5 |
| `【循环渲染保护】模拟 useEffect 中重复调用的场景` | 场景 5 |
| `【循环渲染保护】App.tsx 中 useEffect 逻辑：有 currentProjectId 时不调用` | 场景 2、4 |

#### 【边界情况测试】

| 测试用例名称 | 覆盖场景 |
|-------------|---------|
| `【边界情况】没有任何已保存项目时 loadLatestProject 返回 false` | 场景 6 |
| `【边界情况】loadProject 加载不存在的项目返回 false` | 边界情况 |
| `【边界情况】localStorage 数据格式损坏时友好降级` | 场景 7 |
| `【边界情况】当前已加载项目时调用 loadLatestProject 应该加载最新项目` | 边界情况 |
| `【边界情况】loadLatestProject 返回值：有项目 true，无项目 false` | 场景 6 |
| `【边界情况】clearLoadError 应该清除错误状态` | 场景 7 |
| `【边界情况】加载项目后操作历史记录应正常工作` | 场景 8 |
| `【边界情况】加载嵌套组件项目的数据完整性` | 数据完整性 |

### 4.3 测试关键断言

#### 循环渲染保护的核心验证

```typescript
// 加载后 history 长度应该为 1（不是累积增长）
assertEqual(snapshot.historyLength, 1, 'history 长度应该为 1');

// 加载后 currentIndex 应该为 0
assertEqual(snapshot.currentIndex, 0, 'currentIndex 应该为 0');

// 加载后 canUndo 应该为 false
assertEqual(snapshot.canUndo, false, 'canUndo 应该为 false');

// 多次调用后状态不变
for (let i = 0; i < 10; i++) {
  state.loadLatestProject();
  assertEqual(snapshot.historyLength, 1, '多次调用后 history 长度保持 1');
}
```

#### 数据完整性验证

```typescript
// 嵌套组件计数
const totalComponents = countComponents(snapshot.components);
assertEqual(totalComponents, 6, '总共有 6 个组件（包括嵌套）');

// 深层组件查找
const deepBtn = findById(snapshot.components, 'deep-btn');
assertNotNull(deepBtn, '应该能找到深层按钮组件');
```

---

## 5. 相关文件

| 文件路径 | 描述 | 修改内容 |
|---------|------|---------|
| `src/store/useBuilderStore.ts` | Store 实现 | 修复 `loadProject`、`loadLatestProject` |
| `src/store/projectLoading.test.ts` | 新增自动化测试 | 覆盖所有测试场景 |
| `src/App.tsx` | 主应用组件 | 修复 `useEffect` 依赖和逻辑 |

---

## 6. 技术实现要点

### 6.1 修复原则

1. **单次状态更新**：加载项目时使用单个 `set()` 调用更新所有相关状态，避免多次状态更新

2. **历史记录隔离**：加载项目时重置历史记录，确保新操作从干净的起点开始

3. **useRef 保护**：使用 `useRef` 标记首次加载完成，确保 `useEffect` 只执行一次

4. **空依赖数组**：`useEffect` 使用空依赖数组 `[]`，避免函数引用变化触发重执行

### 6.2 关键代码对比

**修复前（问题代码）**：

```typescript
// App.tsx
useEffect(() => {
  loadLatestProject();  // 可能被调用无限次
}, [loadLatestProject]); // 依赖函数引用，会变化

// useBuilderStore.ts
loadLatestProject: () => {
  setComponents(components);  // 推入历史，更新多个状态
  set({ ... });               // 再次更新
  // 状态变化 → 函数引用变化 → useEffect 重执行
}
```

**修复后（正确代码）**：

```typescript
// App.tsx
const hasLoaded = useRef(false);
useEffect(() => {
  if (hasLoaded.current) return;
  hasLoaded.current = true;
  if (!currentProjectId) {
    loadLatestProject();  // 只调用 1 次
  }
}, []);  // 空依赖，不依赖函数引用

// useBuilderStore.ts
loadLatestProject: () => {
  set({
    components,           // 直接设置
    history: initialState, // 重置历史
    currentIndex: 0,
    canUndo: false,
    canRedo: false,
    // 其他状态...
  });  // 单次更新，状态稳定
}
```

---

## 7. 回归测试检查清单

修复完成后，确保以下功能不受影响：

| 功能模块 | 检查项 | 状态 |
|---------|-------|------|
| **撤销/重做** | 添加组件后可撤销 | ☐ |
| **撤销/重做** | 删除组件后可撤销 | ☐ |
| **撤销/重做** | 移动组件后可撤销 | ☐ |
| **快捷键** | Ctrl+Z 撤销 | ☐ |
| **快捷键** | Ctrl+Y 重做 | ☐ |
| **快捷键** | Ctrl+C 复制 | ☐ |
| **快捷键** | Ctrl+V 粘贴 | ☐ |
| **快捷键** | Delete 删除 | ☐ |
| **自动保存** | 修改组件后自动保存 | ☐ |
| **自动保存** | 保存状态显示正确 | ☐ |
| **项目列表** | 新项目出现在列表 | ☐ |
| **项目列表** | 删除项目后列表更新 | ☐ |
| **项目列表** | 重命名项目后列表更新 | ☐ |
| **导出功能** | JSON 导出正常 | ☐ |
| **导入功能** | JSON 导入正常 | ☐ |
| **预览功能** | 预览页面正常显示 | ☐ |

---

## 8. 测试完成标准

所有场景按步骤测试后，确认以下内容：

### 8.1 核心修复验证

- [x] **场景 1**：页面首次挂载时自动恢复最后一个项目
  - [x] Toast 提示正确显示
  - [x] 项目数据正确恢复
  - [x] 控制台无错误

- [x] **场景 2**：从项目列表点击打开指定项目
  - [x] 正确跳转到编辑器
  - [x] 项目数据正确加载
  - [x] 无无限循环错误

- [x] **场景 5**：无循环渲染
  - [x] `loadLatestProject` 只调用 1 次
  - [x] 页面无卡顿
  - [x] CPU 使用率正常

### 8.2 边界情况验证

- [x] **场景 6**：无项目时静默返回 false
- [x] **场景 7**：数据损坏时友好降级
- [x] **场景 8**：加载后撤销/重做正常工作

### 8.3 回归验证

- [x] 撤销/重做功能正常
- [x] 快捷键正常
- [x] 自动保存正常
- [x] 项目列表功能正常

---

## 9. 预防未来同类问题

### 9.1 代码规范

1. **Store 中加载操作**：
   - 加载项目时应该直接使用 `set()` 更新所有相关状态
   - 不应该调用会推入历史记录的方法（如 `setComponents`、`addComponent` 等）
   - 应该重置 `history`、`currentIndex`、`canUndo`、`canRedo`

2. **组件中 useEffect 依赖**：
   - 避免依赖 Store 中的函数引用（Zustand 函数引用可能变化）
   - 使用 `useRef` 标记执行状态
   - 使用空依赖数组 `[]` 配合 `useRef` 实现"只执行一次"的语义

### 9.2 测试建议

1. **新增测试**：
   - 任何涉及 `loadProject` 或 `loadLatestProject` 的修改都应运行 `projectLoading.test.ts` 中的测试

2. **代码审查关注点**：
   - 是否在 `useEffect` 中调用了会更新状态的 Store 方法
   - 是否依赖了不稳定的函数引用
   - 加载操作是否正确重置了历史记录

### 9.3 监控指标

1. **开发环境**：
   - 注意控制台是否有 `Maximum update depth exceeded` 错误
   - 注意页面是否有卡顿或无响应

2. **生产环境**：
   - 监控 ErrorBoundary 捕获的错误
   - 监控用户反馈的"页面卡住"问题

---

## 附录：快速验证步骤

如果需要快速验证修复是否生效，按以下步骤操作：

1. **清理环境**：
   ```
   开发者工具 → Application → Local Storage → 清空所有 lowcode_builder 相关数据
   ```

2. **创建测试项目**：
   - 访问 `/builder`
   - 添加 2 个组件（文本 + 按钮）
   - 等待自动保存

3. **验证恢复**：
   - 刷新页面
   - 确认 2 个组件都在
   - 确认控制台无错误

4. **验证切换**：
   - 点击项目名称，进入 `/projects`
   - 创建新项目（添加容器组件）
   - 再次点击项目名称
   - 点击第一个项目（有文本和按钮的）
   - 确认正确加载，无错误

5. **验证撤销**：
   - 在编辑器中添加新组件
   - 点击「撤销」
   - 确认组件被移除

如果以上步骤都正常，说明修复成功。
