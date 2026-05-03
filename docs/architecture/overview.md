# A 系列架构综述文档

> 本文档为 React 低代码搭建平台 A 系列功能的完整架构综述，涵盖所有核心模块的设计、依赖关系和数据流。

---

## 文档信息

| 项目 | 内容 |
|------|------|
| 文档版本 | v1.0 |
| 最后更新 | 2026-05-03 |
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

本项目是一个基于 React + TypeScript 的低代码可视化搭建平台，A 系列功能涵盖了从基础编辑到高级数据校验的完整能力。

### 1.1 核心功能模块（5个）

| 模块名称 | 功能描述 | 关键文件 |
|---------|---------|---------|
| **1. 持久化模块 (Storage)** | 负责项目数据的持久化存储，包括 localStorage 操作、项目列表管理、自动保存等。 | `src/utils/storage.ts` |
| **2. 状态管理模块 (Store)** | 核心状态管理，使用 Zustand 管理组件树数据、历史记录、当前项目信息等。 | `src/store/useBuilderStore.ts` |
| **3. 预览模块 (Preview)** | 提供真实渲染的预览模式，支持组件交互（按钮点击、弹窗等）。 | `src/pages/PreviewPage.tsx` |
| **4. 容器拖拽模块 (DnD)** | 基于 DnD Kit 实现的组件拖拽系统，支持拖放到画布、容器嵌套、跨容器移动。 | `src/components/builder/DndContext.tsx` |
| **5. 快捷键模块 (Keyboard Shortcuts)** | 提供撤销、重做、删除、复制、粘贴等核心操作的键盘快捷方式。 | `src/hooks/useKeyboardShortcuts.ts` |

### 1.2 A 系列新增功能模块

| 模块名称 | 功能描述 | 关键文件 |
|---------|---------|---------|
| **层级排序模块 (Layer Ordering)** | 支持组件层级调整：上移、下移、置顶、置底，支持容器内子组件层级独立管理。 | `src/store/useBuilderStore.ts` (内嵌实现) |
| **数据校验模块 (Validation)** | 项目名称校验、组件数据完整性校验、localStorage 容量预估预警。 | `src/utils/validation.ts` |
| **错误处理模块 (Error Handling)** | React ErrorBoundary 错误边界、Toast 提示组件、存储操作反馈。 | `src/components/ui/ErrorBoundary.tsx`, `src/components/ui/Toast.tsx` |
| **导入导出模块 (Import/Export)** | 项目 JSON 文件的导入导出，支持文件大小限制、重名处理、数据格式校验。 | `src/utils/import-export.ts` |

---

## 2. 模块依赖关系

### 2.1 依赖链总览

```
持久化模块 (Storage)
      │
      ▼
项目管理 (Store 中的项目操作)
      │
      ▼
导入导出模块 (Import/Export)
      │
      ▼
预览模块 (Preview)
      │
      ▼
容器拖拽模块 (DnD)
      │
      ▼
快捷键模块 (Keyboard Shortcuts)
      │
      ▼
层级排序模块 (Layer Ordering)
```

### 2.2 依赖关系详细说明

#### 2.2.1 持久化模块 → 项目管理

**依赖方向**：项目管理依赖持久化模块

**说明**：
- Store 中的项目管理功能（`loadProject`、`saveCurrentProject`、`listProjects` 等）直接调用 `src/utils/storage.ts` 中的函数
- 持久化模块是底层基础设施，上层所有模块都通过 Store 或直接调用其功能

**关键依赖代码**：
```typescript
// src/store/useBuilderStore.ts 中导入 storage 函数
import {
  saveProject as saveProjectToStorage,
  loadProject as loadProjectFromStorage,
  listProjects as listProjectsFromStorage,
  // ...
} from '@/utils/storage';
```
[useBuilderStore.ts:5-13](file:///g:/Remote/prompt%20program/React01/src/store/useBuilderStore.ts#L5-L13)

#### 2.2.2 项目管理 → 导入导出模块

**依赖方向**：导入导出模块依赖项目管理

**说明**：
- 导入导出模块需要读取和写入项目数据，依赖持久化模块和 Store
- 导入时：解析 JSON → 校验格式 → 调用 `saveProject` 保存
- 导出时：从 Store 读取当前项目 → 序列化为 JSON → 下载

**关键依赖代码**：
```typescript
// src/utils/import-export.ts 中导入 storage 函数
import { saveProject, listProjects, generateProjectId } from '@/utils/storage';
```
[import-export.ts:3](file:///g:/Remote/prompt%20program/React01/src/utils/import-export.ts#L3)

#### 2.2.3 导入导出模块 → 预览模块

**依赖方向**：预览模块依赖导入导出模块的数据流

**说明**：
- 预览模块从 Store 读取组件数据进行渲染
- 导入导出的项目数据最终会流入 Store，被预览模块消费
- 预览模块不直接依赖导入导出模块，而是通过 Store 间接依赖

**数据流**：
```
导入 JSON → Store.components → 预览模块读取并渲染
导出 ← Store.components ← 编辑操作
```

#### 2.2.4 预览模块 → 容器拖拽模块

**依赖方向**：预览模块与拖拽模块共享渲染逻辑

**说明**：
- 预览模块和拖拽模块都使用 `ComponentRenderer` 来渲染组件
- 拖拽模块在编辑模式下工作，预览模块在预览模式下工作
- 两者通过 `editable` 参数控制渲染行为的差异

**关键共享组件**：
```typescript
// src/components/builder/ComponentRenderer/index.tsx
// 两个模式都使用这个渲染器，通过 editable 参数区分

// 编辑模式 (editable=true):
<ComponentRenderer
  component={component}
  isSelected={isSelected}
  onClick={handleClick}
  editable={true}
/>

// 预览模式 (editable=false):
<PreviewRenderer
  component={component}
  // 内部设置 editable=false
/>
```

#### 2.2.5 容器拖拽模块 → 快捷键模块

**依赖方向**：快捷键模块调用拖拽模块触发的 Store 操作

**说明**：
- 拖拽操作会触发组件的添加、移动等操作，这些操作会更新 Store
- 快捷键模块也会触发相同的 Store 操作（删除、复制、粘贴）
- 两者都通过修改 Store 来影响组件树，形成数据层面的关联

**操作对比**：

| 操作类型 | 拖拽模块触发 | 快捷键模块触发 |
|---------|-------------|---------------|
| 添加组件 | ✅ 从组件面板拖拽 | ❌ |
| 删除组件 | ❌ | ✅ Delete/Backspace |
| 复制组件 | ❌ | ✅ Ctrl+C |
| 粘贴组件 | ❌ | ✅ Ctrl+V |
| 移动组件 | ✅ 画布上拖拽 | ❌ |

#### 2.2.6 快捷键模块 → 层级排序模块

**依赖方向**：两者共享 Store 的历史记录系统

**说明**：
- 快捷键的撤销/重做操作与层级排序操作都使用 Store 的历史记录系统
- 层级排序操作（上移、下移等）会创建历史记录
- 快捷键可以撤销/重做这些层级操作

**关键交互**：
```typescript
// 层级排序操作会调用 pushHistory
moveUp: (id) => {
  const { components, pushHistory, canMoveUp } = get();
  // ... 执行移动逻辑
  pushHistory(components, newComponents); // 创建历史记录
  set({ components: newComponents });
}

// 快捷键的撤销操作读取历史记录
undo: () => {
  const { history, currentIndex, canUndo } = get();
  if (!canUndo) return;
  const newIndex = currentIndex - 1;
  const previousState = history[newIndex];
  // 恢复之前的状态（包括层级顺序）
}
```

### 2.3 完整依赖关系图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           模块依赖关系图                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        基础设施层 (Infrastructure)                    │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐│   │
│  │  │   Storage   │  │ Validation  │  │   Types (TypeScript)         ││   │
│  │  │  (持久化)   │  │  (数据校验) │  │   (类型定义)                 ││   │
│  │  └──────┬──────┘  └──────┬──────┘  └─────────────────────────────┘│   │
│  └─────────┼────────────────┼──────────────────────────────────────────┘   │
│            │                │                                               │
│            └────────┬───────┘                                               │
│                     │                                                        │
│                     ▼                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                          状态管理层 (State)                           │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐│   │
│  │  │                    useBuilderStore (Zustand)                      ││   │
│  │  │                                                                  ││   │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   ││   │
│  │  │  │  组件树管理  │  │  历史记录   │  │    项目管理         │   ││   │
│  │  │  │(add/remove/ │  │(undo/redo)  │  │(load/save/list)     │   ││   │
│  │  │  │ update/move)│  │             │  │                     │   ││   │
│  │  │  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘   ││   │
│  │  │         │                │                      │              ││   │
│  │  │         └────────────────┼──────────────────────┘              ││   │
│  │  │                          │                                      ││   │
│  │  │                          ▼                                      ││   │
│  │  │                  ┌─────────────────────┐                      ││   │
│  │  │                  │   层级排序操作       │                      ││   │
│  │  │                  │ (moveUp/moveDown/   │                      ││   │
│  │  │                  │  moveToTop/Bottom)  │                      ││   │
│  │  │                  └──────────┬──────────┘                      ││   │
│  │  └─────────────────────────────┼──────────────────────────────────┘│   │
│  └────────────────────────────────┼───────────────────────────────────┘   │
│                                   │                                          │
│         ┌─────────────────────────┼─────────────────────────┐            │
│         │                         │                         │            │
│         ▼                         ▼                         ▼            │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐ │
│  │   DnD Context    │    │ Keyboard Shortcuts│    │  Import/Export   │ │
│  │   (拖拽模块)      │    │   (快捷键模块)     │    │  (导入导出模块)   │ │
│  │                  │    │                  │    │                  │ │
│  │ 依赖:            │    │ 依赖:            │    │ 依赖:            │ │
│  │ - addComponent   │    │ - undo/redo      │    │ - saveProject    │ │
│  │ - updateComponent│    │ - removeComponent │    │ - listProjects   │ │
│  │ - moveComponentTo│    │ - 剪贴板操作      │    │ - validation     │ │
│  │   Parent         │    │                  │    │                  │ │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘ │
│                                   │                                          │
│                                   ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         渲染层 (Rendering)                              │  │
│  │  ┌──────────────────────────────────────────────────────────────────┐│  │
│  │  │                    ComponentRenderer                                ││  │
│  │  │                                                                  ││  │
│  │  │  editable=true (编辑模式)        editable=false (预览模式)        ││  │
│  │  │  ┌──────────────────┐          ┌──────────────────┐             ││  │
│  │  │  │   Canvas 渲染    │          │   Preview 渲染   │             ││  │
│  │  │  │   (选中高亮)     │          │   (真实交互)      │             ││  │
│  │  │  └──────────────────┘          └──────────────────┘             ││  │
│  │  └──────────────────────────────────────────────────────────────────┘│  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 数据流总览

### 3.1 组件树数据流转路径

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           组件树数据流转图                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                         ┌──────────────┐                                     │
│                         │   本地存储    │                                     │
│                         │ (localStorage)│                                     │
│                         └──────┬───────┘                                     │
│                                │                                             │
│          ┌─────────────────────┼─────────────────────┐                      │
│          │                     │                     │                      │
│          ▼                     │                     ▼                      │
│   ┌──────────────┐            │            ┌──────────────┐                │
│   │  项目加载    │            │            │  项目保存    │                │
│   │ (loadProject)│            │            │(saveCurrent  │                │
│   └──────┬───────┘            │            │  Project)    │                │
│          │                    │            └──────┬───────┘                │
│          │                    │                   │                         │
│          ▼                    │                   ▼                         │
│   ┌──────────────────────────────────────────────────────────────┐          │
│   │                  useBuilderStore (Zustand)                    │          │
│   │                                                                  │          │
│   │  ┌──────────────────────────────────────────────────────────┐│          │
│   │  │                      核心状态                              ││          │
│   │  │                                                           ││          │
│   │  │  components: ComponentSchema[]       ←── 组件树数据       ││          │
│   │  │  selectedComponentId: string | null  ←── 当前选中组件     ││          │
│   │  │  history: HistoryState[]              ←── 历史记录栈       ││          │
│   │  │  currentIndex: number                ←── 当前历史位置     ││          │
│   │  │  currentProjectId: string | null     ←── 当前项目ID       ││          │
│   │  │  projectName: string                 ←── 当前项目名称     ││          │
│   │  │                                                           ││          │
│   │  └──────────────────────────────────────────────────────────┘│          │
│   │                                                                  │          │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐│          │
│   │  │   修改操作   │  │   撤销操作   │  │    层级操作          ││          │
│   │  │             │  │             │  │                     ││          │
│   │  │ addComponent│  │   undo()    │  │  moveUp(id)        ││          │
│   │  │ removeComp- │  │   redo()    │  │  moveDown(id)      ││          │
│   │  │  onent(id)  │  │             │  │  moveToTop(id)     ││          │
│   │  │ updateComp- │  │             │  │  moveToBottom(id)  ││          │
│   │  │  onent(...) │  │             │  │                     ││          │
│   │  │ moveCompo-  │  │             │  │  → 更新组件数组顺序  ││          │
│   │  │  nentTo...  │  │             │  │  → 推送到历史记录   ││          │
│   │  └─────────────┘  └─────────────┘  └─────────────────────┘│          │
│   └──────────────────────────────────────────────────────────────┘          │
│          │                               │                                    │
│          │                               │                                    │
│          ▼                               ▼                                    │
│   ┌──────────────────┐          ┌──────────────────┐                        │
│   │    编辑模式      │          │    预览模式      │                        │
│   │   (editable)    │          │   (preview)     │                        │
│   │                  │          │                  │                        │
│   │  读取:           │          │  读取:           │                        │
│   │  - components    │          │  - components    │                        │
│   │  - selectedId    │          │  - projectName   │                        │
│   │                  │          │                  │                        │
│   │  显示:           │          │  显示:           │                        │
│   │  - 选中高亮       │          │  - 真实渲染       │                        │
│   │  - 拖拽支持       │          │  - 按钮可点击     │                        │
│   │  - 属性编辑       │          │  - 事件执行       │                        │
│   └──────────────────┘          └──────────────────┘                        │
│                                                                              │
│          │                                                               │    │
│          ▼                                                               ▼    │
│   ┌──────────────────┐                                          ┌──────────┐│
│   │   导入/导出      │                                          │  剪贴板  ││
│   │                  │                                          │          ││
│   │  导出:           │                                          │  复制:   ││
│   │  - 从 store 读取 │                                          │  - 从   ││
│   │  - 序列化为 JSON │                                          │    store││
│   │  - 下载为文件    │                                          │    读取  ││
│   │                  │                                          │  粘贴:   ││
│   │  导入:           │                                          │  - 从   ││
│   │  - 读取文件内容  │                                          │    剪贴板││
│   │  - JSON 解析    │                                          │    读取  ││
│   │  - 数据格式校验  │                                          │  - 写入  ││
│   │  - 保存到 store  │                                          │    store ││
│   └──────────────────┘                                          └──────────┘│
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 数据流详细说明

#### 3.2.1 数据流向：本地存储 → Store

**触发场景**：
- 应用启动时加载最新项目
- 用户打开某个项目
- 用户从项目列表选择项目

**关键流程**：
```typescript
// 1. 调用 store 的 loadProject
const success = loadProject(projectId);

// 2. store 内部调用 storage.loadProject
const result = loadProjectFromStorage(projectId);

// 3. storage 从 localStorage 读取并校验
const stored = localStorage.getItem(projectKey);
const parsedData = JSON.parse(stored);
const validation = validateProjectData(parsedData);

// 4. 校验通过后更新 store 状态
set({
  components: result.project.components,
  currentProjectId: result.project.id,
  projectName: result.project.name,
  // ...
});
```

#### 3.2.2 数据流向：Store → 本地存储

**触发场景**：
- 组件变更后自动保存（2秒延迟）
- 用户手动保存
- 切换项目时保存当前项目

**关键流程**：
```typescript
// 1. 调用 store 的 saveCurrentProject
saveCurrentProject();

// 2. store 内部调用 storage.saveProject
const savedProject = saveProjectToStorage({
  id: currentProjectId,
  name: projectName,
  components: structuredClone(components),
});

// 3. storage 序列化并写入 localStorage
const projectKey = getProjectKey(project.id);
localStorage.setItem(projectKey, JSON.stringify(project));

// 4. 更新 store 中的保存状态
set({
  currentProjectId: savedProject.id,
  lastSavedAt: savedProject.updatedAt,
  saveStatus: 'saved',
});
```

#### 3.2.3 数据流向：Store → 编辑模式渲染

**触发场景**：
- 组件数据变更
- 选中状态变更

**关键流程**：
```typescript
// 1. 组件从 store 读取数据
const components = useBuilderStore((state) => state.components);
const selectedComponentId = useBuilderStore((state) => state.selectedComponentId);

// 2. Canvas 组件遍历渲染
{components.map((component) => (
  <CanvasItem
    key={component.id}
    component={component}
    isSelected={component.id === selectedComponentId}
  />
))}

// 3. CanvasItem 使用 ComponentRenderer
<ComponentRenderer
  component={component}
  isSelected={isSelected}
  onClick={() => setSelectedComponentId(component.id)}
  editable={true}
/>
```

#### 3.2.4 数据流向：Store → 预览模式渲染

**触发场景**：
- 用户切换到预览页面
- 从项目列表直接预览某个项目

**关键流程**：
```typescript
// 1. PreviewPage 从 store 读取数据
const components = useBuilderStore((state) => state.components);
const projectName = useBuilderStore((state) => state.projectName);

// 2. 如果 URL 有 project 参数，先加载
useEffect(() => {
  if (projectId && !isCurrentProject(projectId)) {
    loadProject(projectId); // 从 localStorage 加载到 store
  }
}, [projectId]);

// 3. 使用 PreviewRenderer 渲染
{components.map((component) => (
  <PreviewCanvasItem
    key={component.id}
    component={component}
  />
))}

// 4. PreviewCanvasItem 内部
<PreviewRenderer component={component} />
// 等同于:
<ComponentRenderer
  component={component}
  editable={false}  // 关键：禁用编辑模式
/>
```

#### 3.2.5 数据流向：Store ↔ 导入导出

**导出流程**：
```typescript
// 1. 从 store 读取当前项目
const components = useBuilderStore((state) => state.components);
const projectName = useBuilderStore((state) => state.projectName);
const currentProjectId = useBuilderStore((state) => state.currentProjectId);

// 2. 构建导出数据
const projectToExport: Project = {
  id: currentProjectId || generateProjectId(),
  name: projectName,
  components: structuredClone(components),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// 3. 序列化并下载
const jsonString = serializeProject(projectToExport);
downloadProject(projectToExport);
```

**导入流程**：
```typescript
// 1. 读取文件内容
const fileContent = await readFileAsText(selectedFile);

// 2. JSON 解析和校验
const result = importProjectFromJSON(fileContent);

// 3. 校验失败返回错误
if (!result.success) {
  toast.error(`导入失败: ${result.errors[0]?.message}`);
  return;
}

// 4. 校验成功，加载到 store
if (result.project) {
  loadProject(result.project.id);
  toast.success(`成功导入项目: ${result.project.name}`);
}
```

#### 3.2.6 数据流向：Store ↔ 剪贴板

**复制流程**：
```typescript
// 1. 从 store 找到选中的组件
const componentToCopy = findComponentById(components, selectedComponentId);

// 2. 写入剪贴板
const success = await writeComponentToClipboard(componentToCopy);

// 内部实现:
export const writeComponentToClipboard = async (component: ComponentSchema): Promise<boolean> => {
  try {
    const data = JSON.stringify(component);
    await navigator.clipboard.writeText(data);
    return true;
  } catch {
    return false;
  }
};
```

**粘贴流程**：
```typescript
// 1. 从剪贴板读取
const component = await readComponentFromClipboard();

// 2. 如果有效，添加到 store
if (component) {
  const newComponent = {
    ...component,
    id: generateId(component.type.toLowerCase()),
    x: component.x + 20, // 偏移防止重叠
    y: component.y + 20,
  };
  addComponent(newComponent);
  toast.success(`已粘贴: ${component.type}`);
}
```

### 3.3 数据生命周期

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           数据生命周期图                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. 创建阶段                                                                 │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                              │
│     用户操作                    数据状态                                     │
│     ──────────                ──────────                                    │
│     打开应用                   ── 等待加载                                   │
│          │                              │                                   │
│          ▼                              ▼                                   │
│     加载最新项目/创建新项目 ──► components = [] (空画布)                     │
│                                              │                                │
│                                              ▼                                │
│     拖拽添加组件              ──► components.push(newComponent)              │
│                                              │                                │
│                                              ▼                                │
│     自动保存(2秒后)           ──► 写入 localStorage                          │
│                                                                              │
│  2. 修改阶段                                                                 │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                              │
│     用户操作                    数据状态                                     │
│     ──────────                ──────────                                    │
│     移动组件位置               ──► updateComponent({ x, y })                │
│     修改属性                   ──► updateComponent({ props, styles })       │
│     调整层级                   ──► moveUp/moveDown (重排数组)               │
│     删除组件                   ──► removeComponent(id)                       │
│                                              │                                │
│                                              ▼                                │
│     所有修改操作               ──► 推送到 history 栈                          │
│                                              │                                │
│     自动保存触发               ──► 同步到 localStorage                        │
│                                                                              │
│  3. 撤销/重做阶段                                                             │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                              │
│     用户操作                    数据状态                                     │
│     ──────────                ──────────                                    │
│     Ctrl+Z (撤销)             ──► currentIndex -= 1                         │
│                                              │                                │
│                                              ▼                                │
│     从 history 读取           ──► components = history[newIndex].components  │
│                                              │                                │
│     Ctrl+Y (重做)             ──► currentIndex += 1                         │
│                                              │                                │
│     从 history 读取           ──► components = history[newIndex].components  │
│                                                                              │
│  4. 持久化阶段                                                                 │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                              │
│     触发方式                    数据流向                                     │
│     ──────────                ──────────                                    │
│     自动保存(2秒延迟)         ──► Store → localStorage                       │
│     手动保存按钮               ──► Store → localStorage                       │
│     切换项目时                 ──► Store → localStorage (当前)               │
│                                ──► localStorage → Store (新项目)             │
│     导入项目                   ──► 文件 → 校验 → Store → localStorage        │
│     导出项目                   ──► Store → 文件下载                           │
│                                                                              │
│  5. 销毁阶段                                                                 │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                              │
│     用户操作                    数据状态                                     │
│     ──────────                ──────────                                    │
│     删除项目                   ──► localStorage.removeItem(projectKey)       │
│     清除浏览器数据             ──► 所有项目数据丢失                          │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. 模块详细说明

### 4.1 持久化模块 (Storage)

#### 4.1.1 文件位置
`src/utils/storage.ts`

#### 4.1.2 核心接口

```typescript
// 项目数据结构
interface Project {
  id: string;
  name: string;
  components: ComponentSchema[];
  createdAt: string;
  updatedAt: string;
}

// 项目元数据（用于列表展示）
interface ProjectMetadata {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  componentCount: number;
}

// 加载结果（新增数据校验）
interface LoadProjectResult {
  success: boolean;
  project?: Project;
  validationErrors?: string;
  isCorrupted?: boolean;
}
```
[storage.ts:4-24](file:///g:/Remote/prompt%20program/React01/src/utils/storage.ts#L4-L24)

#### 4.1.3 关键函数签名

| 函数名 | 参数 | 返回值 | 功能描述 |
|--------|------|--------|---------|
| `saveProject` | `projectData: Omit<Project, 'id' \| 'createdAt' \| 'updatedAt'> & { id?: string; createdAt?: string }` | `Project` | 保存项目到 localStorage，自动生成 ID 和时间戳 |
| `loadProject` | `id: string` | `LoadProjectResult` | 加载指定项目，包含 JSON 解析和数据校验 |
| `listProjects` | 无 | `ProjectMetadata[]` | 列出所有项目的元数据，跳过损坏的项目 |
| `deleteProject` | `id: string` | `boolean` | 删除指定项目 |
| `getLatestProject` | 无 | `Project \| null` | 获取最近更新的项目 |
| `renameProject` | `id: string, newName: string` | `Project \| null` | 重命名项目 |
| `createNewEmptyProject` | `name?: string` | `Project` | 创建新的空项目 |

#### 4.1.4 存储键命名规则

```typescript
const STORAGE_KEY_PREFIX = 'lowcode_builder_project';
const PROJECT_LIST_KEY = `${STORAGE_KEY_PREFIX}_list`;

// 项目数据键: lowcode_builder_project_{projectId}
const getProjectKey = (id: string): string => {
  return `${STORAGE_KEY_PREFIX}_${id}`;
};
```
[storage.ts:20-29](file:///g:/Remote/prompt%20program/React01/src/utils/storage.ts#L20-L29)

#### 4.1.5 数据校验机制

```typescript
// loadProject 中的校验流程
export const loadProject = (id: string): LoadProjectResult => {
  try {
    // 1. 从 localStorage 读取
    const stored = localStorage.getItem(projectKey);
    
    // 2. JSON 解析
    let parsedData: unknown;
    try {
      parsedData = JSON.parse(stored);
    } catch (parseError) {
      return {
        success: false,
        isCorrupted: true,
        validationErrors: 'JSON 解析失败，项目数据可能已损坏',
      };
    }
    
    // 3. 数据格式校验
    const validation = validateProjectData(parsedData);
    
    if (!validation.valid) {
      return {
        success: false,
        isCorrupted: true,
        validationErrors: formatValidationErrors(validation.errors),
      };
    }
    
    // 4. 校验通过，返回项目数据
    const project = parsedData as Project;
    return { success: true, project };
  } catch (error) {
    return {
      success: false,
      isCorrupted: true,
      validationErrors: error instanceof Error ? error.message : '加载项目时发生未知错误',
    };
  }
};
```
[storage.ts:93-134](file:///g:/Remote/prompt%20program/React01/src/utils/storage.ts#L93-L134)

---

### 4.2 状态管理模块 (Store)

#### 4.2.1 文件位置
`src/store/useBuilderStore.ts`

#### 4.2.2 状态结构

```typescript
interface BuilderState {
  // 组件数据
  components: ComponentSchema[];
  selectedComponentId: string | null;
  
  // 历史记录
  history: HistoryState[];
  currentIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  
  // 项目信息
  currentProjectId: string | null;
  projectName: string;
  saveStatus: SaveStatus; // 'idle' | 'saving' | 'saved' | 'error'
  saveErrorMessage: string | null;
  lastSavedAt: string | null;
  
  // 加载错误状态（新增）
  loadError: string | null;
  isProjectCorrupted: boolean;
}
```
[useBuilderStore.ts:90-144](file:///g:/Remote/prompt%20program/React01/src/store/useBuilderStore.ts#L90-L144)

#### 4.2.3 关键方法签名

**组件管理方法**：

| 方法名 | 参数 | 返回值 | 功能描述 |
|--------|------|--------|---------|
| `addComponent` | `component: ComponentSchema` | `void` | 添加组件到根级别 |
| `addComponentToParent` | `parentId: string \| null, component: ComponentSchema, index?: number` | `void` | 添加组件到指定父容器 |
| `removeComponent` | `id: string` | `void` | 删除组件 |
| `updateComponent` | `id: string, updates: Partial<ComponentSchema>` | `void` | 更新组件属性 |
| `moveComponentToParent` | `componentId: string, newParentId: string \| null, index?: number` | `void` | 移动组件到新的父容器 |

**历史记录方法**：

| 方法名 | 参数 | 返回值 | 功能描述 |
|--------|------|--------|---------|
| `undo` | 无 | `void` | 撤销上一步操作 |
| `redo` | 无 | `void` | 重做已撤销的操作 |
| `pushHistory` | `previousComponents, nextComponents` | `void` | 推送新的历史记录（内部使用） |

**层级排序方法**：

| 方法名 | 参数 | 返回值 | 功能描述 |
|--------|------|--------|---------|
| `moveUp` | `id: string` | `void` | 将组件上移一层（视觉层级提高） |
| `moveDown` | `id: string` | `void` | 将组件下移一层（视觉层级降低） |
| `moveToTop` | `id: string` | `void` | 将组件置顶（视觉层级最高） |
| `moveToBottom` | `id: string` | `void` | 将组件置底（视觉层级最低） |
| `canMoveUp` | `id: string` | `boolean` | 判断组件是否可以上移 |
| `canMoveDown` | `id: string` | `boolean` | 判断组件是否可以下移 |
| `getComponentLayerInfo` | `id: string` | `{ currentLayer: number; totalLayers: number } \| null` | 获取组件的层级信息 |

**项目管理方法**：

| 方法名 | 参数 | 返回值 | 功能描述 |
|--------|------|--------|---------|
| `saveCurrentProject` | `immediate?: boolean` | `void` | 保存当前项目 |
| `loadProject` | `projectId: string` | `boolean` | 加载指定项目 |
| `loadLatestProject` | 无 | `boolean` | 加载最新项目 |
| `createNewProject` | `name?: string` | `void` | 创建新项目 |
| `listProjects` | 无 | `ProjectMetadata[]` | 列出所有项目 |
| `renameCurrentProject` | `newName: string` | `void` | 重命名当前项目 |
| `deleteProjectById` | `projectId: string` | `boolean` | 删除指定项目 |
| `clearLoadError` | 无 | `void` | 清除加载错误状态 |

#### 4.2.4 层级排序实现原理

```typescript
// 核心思路：通过操作数组索引来改变渲染顺序
// 数组中后面的元素会渲染在前面的元素之上（视觉层级更高）

// 查找组件在数组中的位置
const findComponentLocation = (
  components: ComponentSchema[],
  id: string,
  parentId: string | null = null
): ComponentLocation | null => {
  const index = components.findIndex((c) => c.id === id);
  if (index !== -1) {
    return { parentId, index };
  }
  
  // 递归查找 Container 中的子组件
  for (const comp of components) {
    if (isContainerComponent(comp) && comp.children) {
      const location = findComponentLocation(comp.children, id, comp.id);
      if (location) return location;
    }
  }
  return null;
};

// 上移一层（数组索引 +1）
moveUp: (id) => {
  const { components, pushHistory, canMoveUp } = get();
  
  if (!canMoveUp(id)) return;
  
  const location = findComponentLocation(components, id);
  if (!location) return;
  
  const newIndex = location.index + 1;
  const newComponents = reorderComponentInTree(components, id, newIndex);
  
  pushHistory(components, newComponents);
  set({ components: newComponents });
};
```
[useBuilderStore.ts:248-336](file:///g:/Remote/prompt%20program/React01/src/store/useBuilderStore.ts#L248-L336)

---

### 4.3 预览模块 (Preview)

#### 4.3.1 文件位置
- `src/pages/PreviewPage.tsx` - 预览页面
- `src/components/builder/ComponentRenderer/index.tsx` - 组件渲染器

#### 4.3.2 核心接口

```typescript
// ComponentRenderer 参数
interface ComponentRendererProps {
  component: ComponentSchema;
  isSelected?: boolean;      // 编辑模式用：是否选中
  onClick?: (e: React.MouseEvent) => void;  // 编辑模式用：点击回调
  editable?: boolean;        // 关键：是否可编辑
}

// PreviewRenderer 是 ComponentRenderer 的特化
// 内部固定设置: isSelected=false, onClick=undefined, editable=false
const PreviewRenderer: React.FC<{ component: ComponentSchema }> = ({ component }) => (
  <ComponentRenderer
    component={component}
    isSelected={false}
    onClick={undefined}
    editable={false}
  />
);
```

#### 4.3.3 editable 参数的影响

| 特性 | editable=true (编辑模式) | editable=false (预览模式) |
|------|-------------------------|--------------------------|
| 选中高亮 | 显示 `ring-2 ring-primary-500` | 不显示 |
| 点击行为 | 选中组件，显示属性面板 | 执行配置的事件 |
| pointer-events | `pointer-events-none` (组件不可点击) | `auto` (组件可点击) |
| 按钮样式 | 禁用状态样式 | 正常状态样式 |

#### 4.3.4 预览模式事件系统

```typescript
// 支持的事件类型
enum ClickEventType {
  None = 'none',           // 无事件
  Alert = 'alert',          // 弹窗提示
  NavigateUrl = 'navigate_url', // 跳转到 URL
  CustomCode = 'custom_code',   // 自定义代码
}

// 事件配置
interface ClickEventConfig {
  type: ClickEventType;
  alertMessage?: string;       // Alert 类型用
  targetUrl?: string;          // NavigateUrl 类型用
  customCode?: string;         // CustomCode 类型用
}

// 事件执行器
const executeClickEvent = (eventConfig?: ClickEventConfig): void => {
  if (!eventConfig || eventConfig.type === ClickEventType.None) return;
  
  switch (eventConfig.type) {
    case ClickEventType.Alert:
      alert(eventConfig.alertMessage || '按钮被点击了');
      break;
    case ClickEventType.NavigateUrl:
      if (eventConfig.targetUrl) {
        window.open(eventConfig.targetUrl, '_blank');
      }
      break;
    case ClickEventType.CustomCode:
      if (eventConfig.customCode) {
        try {
          eval(eventConfig.customCode);
        } catch (error) {
          console.error('自定义代码执行错误:', error);
        }
      }
      break;
  }
};
```

---

### 4.4 容器拖拽模块 (DnD)

#### 4.4.1 文件位置
`src/components/builder/DndContext.tsx`

#### 4.4.2 核心依赖
```typescript
import {
  DndContext as DndKitContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
```

#### 4.4.3 拖拽场景

| 拖拽源 | 目标位置 | 行为 |
|--------|---------|------|
| 组件面板 | 根画布 | 创建新组件，添加到根级别 |
| 组件面板 | Container 内部 | 创建新组件，添加到 Container 的 children |
| 画布根组件 | 根画布 | 更新组件位置 (x, y) |
| 画布根组件 | Container 内部 | 更新位置 + 移动到 Container |
| Container 子组件 | 根画布 | 更新位置 + 移动到根级别 |
| Container 子组件 | 另一个 Container | 更新位置 + 移动到目标 Container |
| Container 子组件 | 同一 Container 内 | sortable 自动处理顺序 |

#### 4.4.4 关键函数签名

| 函数名 | 参数 | 功能描述 |
|--------|------|---------|
| `handleDragStart` | `event: DragStartEvent` | 拖拽开始，记录拖拽项信息 |
| `handleDragOver` | `event: DragOverEvent` | 拖拽经过，检测是否在画布上 |
| `handleDragMove` | `event: DragMoveEvent` | 拖拽移动，更新鼠标位置 |
| `handleDragEnd` | `event: DragEndEvent` | 拖拽结束，执行放置逻辑 |

#### 4.4.5 放置逻辑核心

```typescript
const handleDragEnd = useCallback(
  (event: DragEndEvent) => {
    const { active, over, point } = event;
    const activeIdStr = String(active.id);
    
    // 判断放置位置类型
    const isOverRootDropZone = effectiveOverId === DROP_ZONE_ID;
    const isOverContainerDropZone = isContainerDropZone(effectiveOverId);
    const isOverSortableItem = isSortableItem(effectiveOverId);
    
    // 场景 1: 从组件面板拖拽新组件
    if (isPanelItem(activeIdStr)) {
      const type = getPanelItemType(activeIdStr);
      const newComponent = createComponentFromType(type, position.x, position.y);
      
      if (isOverContainerDropZone && targetContainerId) {
        addComponentToParent(targetContainerId, newComponent);
      } else {
        addComponent(newComponent);
      }
    }
    
    // 场景 2: 从画布拖拽已有组件
    if (isCanvasItem(activeIdStr)) {
      const actualActiveId = getCanvasItemId(activeIdStr);
      
      // 更新位置
      updateComponent(actualActiveId, {
        x: position.x,
        y: position.y,
      });
      
      // 处理父容器变化
      if (isOverContainerDropZone && targetContainerId) {
        moveComponentToParent(actualActiveId, targetContainerId);
      } else if (isOverRootDropZone) {
        moveComponentToParent(actualActiveId, null);
      }
    }
    
    // 场景 3: 从容器内拖拽 sortable item
    if (isSortableItem(activeIdStr)) {
      // 类似逻辑，处理跨容器移动
    }
  },
  [addComponent, updateComponent, addComponentToParent, moveComponentToParent]
);
```
[DndContext.tsx:343-595](file:///g:/Remote/prompt%20program/React01/src/components/builder/DndContext.tsx#L343-L595)

---

### 4.5 快捷键模块 (Keyboard Shortcuts)

#### 4.5.1 文件位置
`src/hooks/useKeyboardShortcuts.ts`

#### 4.5.2 快捷键映射

| 功能 | Windows/Linux | Mac | 实现函数 |
|------|--------------|-----|---------|
| 撤销 | `Ctrl + Z` | `Cmd + Z` | `onUndo` |
| 重做 | `Ctrl + Y` 或 `Ctrl + Shift + Z` | `Cmd + Y` 或 `Cmd + Shift + Z` | `onRedo` |
| 删除 | `Delete` 或 `Backspace` | `Delete` 或 `Backspace` | `onDelete` |
| 复制 | `Ctrl + C` | `Cmd + C` | `onCopy` |
| 粘贴 | `Ctrl + V` | `Cmd + V` | `onPaste` |

#### 4.5.3 核心接口

```typescript
// Hook 参数
interface KeyboardShortcutsProps {
  onUndo?: () => void;
  onRedo?: () => void;
  onDelete?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  enabled?: boolean;
}

// Hook 返回值
interface KeyboardShortcutsInfo {
  undo: { key: string; display: string; keyLabel: string };
  redo: { key: string; display: string; keyLabel: string };
  delete: { key: string; display: string; keyLabel: string };
  copy: { key: string; display: string; keyLabel: string };
  paste: { key: string; display: string; keyLabel: string };
}
```
[useKeyboardShortcuts.ts:6-41](file:///g:/Remote/prompt%20program/React01/src/hooks/useKeyboardShortcuts.ts#L6-L41)

#### 4.5.4 焦点管理策略

```typescript
// 检测是否在输入元素上
export const isInputElement = (element: HTMLElement | null): boolean => {
  if (!element) return false;
  
  const tagName = element.tagName.toLowerCase();
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true;
  }
  
  if (element.isContentEditable) {
    return true;
  }
  
  return false;
};

// 输入元素中的快捷键行为
if (isInputElement(activeElement)) {
  // 撤销/重做：完全跳过
  if ((key === 'z' || key === 'y') && primaryModifierPressed) {
    return;
  }
  // 删除：完全跳过
  if (key === 'delete' || key === 'backspace') {
    return;
  }
  // 复制/粘贴：跳过，使用浏览器默认行为
  if ((key === 'c' || key === 'v') && primaryModifierPressed) {
    return;
  }
}
```
[useKeyboardShortcuts.ts:43-133](file:///g:/Remote/prompt%20program/React01/src/hooks/useKeyboardShortcuts.ts#L43-L133)

---

### 4.6 数据校验模块 (Validation)

#### 4.6.1 文件位置
`src/utils/validation.ts`

#### 4.6.2 核心接口

```typescript
// 校验错误
interface ValidationError {
  path: string;        // 错误路径，如 "components[0].id"
  message: string;     // 错误描述
}

// 校验结果
interface ValidationResult {
  valid: boolean;       // 是否通过
  errors: ValidationError[];  // 错误列表
  warnings: string[];   // 警告列表
}
```
[validation.ts:4-13](file:///g:/Remote/prompt%20program/React01/src/utils/validation.ts#L4-L13)

#### 4.6.3 校验函数

| 函数名 | 参数 | 返回值 | 校验内容 |
|--------|------|--------|---------|
| `validateProjectName` | `name: string` | `ValidationResult` | 非空、长度限制(50字符)、非法字符 |
| `validateComponent` | `component: unknown` | `ValidationResult` | 单个组件完整性 |
| `validateComponents` | `components: unknown[]` | `ValidationResult` | 组件数组、重复 ID 检测 |
| `validateProjectData` | `data: unknown` | `ValidationResult` | 完整项目数据校验 |

#### 4.6.4 项目名称校验规则

```typescript
const INVALID_NAME_CHARACTERS = /[<>:"/\\|?*]/;
const MAX_NAME_LENGTH = 50;

export const validateProjectName = (name: string): ValidationResult => {
  const errors: ValidationError[] = [];
  const trimmedName = name?.trim() || '';

  // 1. 非空检查
  if (!trimmedName) {
    errors.push({ path: 'name', message: '项目名称不能为空' });
  }

  // 2. 长度检查
  if (trimmedName.length > MAX_NAME_LENGTH) {
    errors.push({
      path: 'name',
      message: `项目名称不能超过 ${MAX_NAME_LENGTH} 个字符`,
    });
  }

  // 3. 非法字符检查
  if (INVALID_NAME_CHARACTERS.test(trimmedName)) {
    errors.push({
      path: 'name',
      message: '项目名称不能包含特殊字符：< > : " / \\ | ? *',
    });
  }

  return { valid: errors.length === 0, errors, warnings: [] };
};
```
[validation.ts:30-62](file:///g:/Remote/prompt%20program/React01/src/utils/validation.ts#L30-L62)

#### 4.6.5 组件数据校验规则

```typescript
const validateComponentSchema = (
  component: unknown,
  path: string = 'components[]'
): ValidationError[] => {
  const errors: ValidationError[] = [];

  // 1. 必须是对象
  if (typeof component !== 'object' || component === null) {
    errors.push({ path, message: '组件必须是对象' });
    return errors;
  }

  const comp = component as Record<string, unknown>;

  // 2. id 校验：非空字符串
  if (!('id' in comp) || typeof comp.id !== 'string' || !comp.id.trim()) {
    errors.push({ path: `${path}.id`, message: '组件必须有非空字符串类型的 id' });
  }

  // 3. type 校验：字符串且是有效类型
  if (!('type' in comp) || typeof comp.type !== 'string') {
    errors.push({ path: `${path}.type`, message: '组件必须有字符串类型的 type' });
  } else if (!VALID_COMPONENT_TYPES.includes(comp.type)) {
    errors.push({ path: `${path}.type`, message: `未知的组件类型: "${comp.type}"` });
  }

  // 4. props 校验：必须是对象
  if (!('props' in comp) || typeof comp.props !== 'object' || comp.props === null) {
    errors.push({ path: `${path}.props`, message: '组件必须有 props 对象' });
  }

  // 5. styles 校验：必须是对象
  if (!('styles' in comp) || typeof comp.styles !== 'object' || comp.styles === null) {
    errors.push({ path: `${path}.styles`, message: '组件必须有 styles 对象' });
  }

  // 6. Container 特殊校验：children 必须是数组
  if (comp.type === ComponentType.Container) {
    if ('children' in comp && !Array.isArray(comp.children)) {
      errors.push({ path: `${path}.children`, message: 'Container 的 children 必须是数组' });
    }
    // 递归校验子组件
    if (Array.isArray(comp.children)) {
      for (let i = 0; i < comp.children.length; i++) {
        const childErrors = validateComponentSchema(
          comp.children[i],
          `${path}.children[${i}]`
        );
        errors.push(...childErrors);
      }
    }
  }

  return errors;
};
```
[validation.ts:64-115](file:///g:/Remote/prompt%20program/React01/src/utils/validation.ts#L64-L115)

#### 4.6.6 存储容量预估

```typescript
const LOCALSTORAGE_QUOTA_MB = 5;           // 5MB 配额
const LOCALSTORAGE_WARNING_THRESHOLD = 0.8; // 80% 时警告

export const estimateLocalStorageUsage = (): {
  usedBytes: number;
  totalBytes: number;
  usedPercentage: number;
  isNearLimit: boolean;
  isOverLimit: boolean;
} => {
  let totalBytes = 0;
  
  // 遍历所有 localStorage 键，估算使用量
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key) || '';
      // 考虑：key 长度 + value 长度(UTF-16 编码) + 额外开销
      totalBytes += key.length + value.length * 2 + LOCALSTORAGE_ESTIMATED_OVERHEAD_PER_KEY;
    }
  }

  const quotaBytes = LOCALSTORAGE_QUOTA_MB * 1024 * 1024;
  const usedPercentage = totalBytes / quotaBytes;

  return {
    usedBytes: totalBytes,
    totalBytes: quotaBytes,
    usedPercentage,
    isNearLimit: usedPercentage >= LOCALSTORAGE_WARNING_THRESHOLD,
    isOverLimit: usedPercentage >= 1,
  };
};
```
[validation.ts:228-259](file:///g:/Remote/prompt%20program/React01/src/utils/validation.ts#L228-L259)

---

### 4.7 错误处理模块 (Error Handling)

#### 4.7.1 文件位置
- `src/components/ui/ErrorBoundary.tsx` - 错误边界
- `src/components/ui/Toast.tsx` - Toast 提示

#### 4.7.2 ErrorBoundary 接口

```typescript
// Props
interface Props {
  children: ReactNode;
  fallback?: ReactNode;  // 可选的自定义错误界面
}

// State
interface State {
  hasError: boolean;
  error: Error | null;
}

// 使用方式
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

#### 4.7.3 ErrorBoundary 生命周期

```typescript
export class ErrorBoundary extends Component<Props, State> {
  // 1. 捕获错误，更新状态（渲染阶段）
  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  // 2. 错误日志记录（副作用阶段）
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  // 3. 重新加载
  handleReload = (): void => {
    window.location.reload();
  };

  // 4. 返回项目列表
  handleGoHome = (): void => {
    window.location.hash = '#/projects';
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // 显示友好的错误界面
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              遇到了一些问题
            </h2>
            <p className="text-gray-600 mb-6">
              应用遇到了意外错误，请尝试重新加载页面。
            </p>
            {/* 显示错误详情 */}
            {this.state.error && (
              <details className="text-left mb-6 p-4 bg-gray-100 rounded-lg">
                <summary className="cursor-pointer text-sm text-gray-600">
                  错误详情
                </summary>
                <pre className="mt-2 text-xs text-gray-500 overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            {/* 操作按钮 */}
            <div className="flex gap-4 justify-center">
              <Button onClick={this.handleReload}>
                重新加载
              </Button>
              <Button variant="outline" onClick={this.handleGoHome}>
                回到项目列表
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
```

#### 4.7.4 Toast 组件接口

```typescript
// Toast 类型
type ToastType = 'success' | 'error' | 'info' | 'warning';

// Toast 消息
interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
}

// useToast Hook 返回值
interface ToastContextValue {
  showToast: (type: ToastType, message: string, duration?: number) => void;
  hideToast: (id: string) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
}
```

#### 4.7.5 Toast 使用方式

```typescript
// 1. 在根组件包裹 ToastProvider
<ToastProvider>
  <App />
</ToastProvider>

// 2. 在组件中使用
const MyComponent = () => {
  const toast = useToast();
  
  const handleSave = async () => {
    try {
      await save();
      toast.success('保存成功');
    } catch (error) {
      toast.error('保存失败');
    }
  };
  
  // 更多用法
  toast.warning('存储空间即将用尽');
  toast.info('已恢复上次编辑');
  
  // 自定义持续时间（默认 3000ms）
  toast.success('保存成功', 5000);  // 5秒后消失
};
```

---

### 4.8 导入导出模块 (Import/Export)

#### 4.8.1 文件位置
`src/utils/import-export.ts`

#### 4.8.2 核心接口

```typescript
// 导入结果
interface ImportResult {
  success: boolean;
  project?: Project;
  errors: ValidationError[];
  warnings: string[];
}

// 大小限制常量
const EXPORT_FILE_SIZE_WARNING_LIMIT = 5 * 1024 * 1024;  // 5MB 警告
const EXPORT_FILE_SIZE_ERROR_LIMIT = 20 * 1024 * 1024;   // 20MB 错误
```
[import-export.ts:5-24](file:///g:/Remote/prompt%20program/React01/src/utils/import-export.ts#L5-L24)

#### 4.8.3 关键函数

| 函数名 | 参数 | 返回值 | 功能描述 |
|--------|------|--------|---------|
| `generateExportFileName` | `projectName: string` | `string` | 生成安全的导出文件名 |
| `serializeProject` | `project: Project` | `string` | 序列化为 JSON 字符串（格式化） |
| `downloadProject` | `project: Project` | `void` | 下载项目为 JSON 文件 |
| `importProjectFromJSON` | `jsonString: string, options?: { forceName?: string }` | `ImportResult` | 解析并导入 JSON 数据 |
| `validateProjectData` | `data: unknown` | `ValidationResult` | 校验项目数据格式 |
| `selectFileForImport` | 无 | `Promise<File \| null>` | 打开文件选择对话框 |
| `readFileAsText` | `file: File` | `Promise<string>` | 读取文件内容为文本 |

#### 4.8.4 导入流程

```typescript
export const importProjectFromJSON = (
  jsonString: string,
  options?: { forceName?: string }
): ImportResult => {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  // 1. JSON 解析
  let parsedData: unknown;
  try {
    parsedData = JSON.parse(jsonString);
  } catch (parseError) {
    return {
      success: false,
      errors: [{ path: '', message: `JSON 解析失败: ${parseError}` }],
      warnings: [],
    };
  }

  // 2. 数据格式校验
  const validation = validateProjectData(parsedData);
  errors.push(...validation.errors);
  warnings.push(...validation.warnings);

  if (!validation.valid) {
    return { success: false, errors, warnings };
  }

  // 3. 处理重名
  const rawName = options?.forceName || data.name || '导入项目';
  const uniqueName = generateUniqueProjectName(rawName);
  
  if (uniqueName !== rawName) {
    warnings.push(`项目名 "${rawName}" 已存在，自动重命名为 "${uniqueName}"`);
  }

  // 4. 标准化组件数据
  const normalizedComponents = normalizeComponents(data.components);

  // 5. 保存到存储
  const newProject: Project = {
    id: generateProjectId(),
    name: uniqueName,
    components: normalizedComponents,
    createdAt: data.createdAt || now,
    updatedAt: now,
  };

  try {
    const savedProject = saveProject(newProject);
    return {
      success: true,
      project: savedProject,
      errors: [],
      warnings,
    };
  } catch (saveError) {
    return {
      success: false,
      errors: [{ path: '', message: `保存项目失败: ${saveError}` }],
      warnings,
    };
  }
};
```
[import-export.ts:248-321](file:///g:/Remote/prompt%20program/React01/src/utils/import-export.ts#L248-L321)

---

## 5. 模块集成点

### 5.1 预览模块如何读取 Store 数据

**集成方式**：通过 Zustand 的 selector 直接读取

```typescript
// src/pages/PreviewPage.tsx

const PreviewPage: React.FC = () => {
  // 1. 从 Store 读取组件数据
  const components = useBuilderStore((state) => state.components);
  const projectName = useBuilderStore((state) => state.projectName);
  
  // 2. Store 方法：加载项目
  const loadProject = useBuilderStore((state) => state.loadProject);
  const isCurrentProject = useBuilderStore((state) => state.isCurrentProject);

  // 3. URL 参数触发加载
  useEffect(() => {
    if (projectId && 
        projectId !== loadedProjectRef.current && 
        !isCurrentProject(projectId)) {
      loadedProjectRef.current = projectId;
      const success = loadProject(projectId);
      // ...
    }
  }, [projectId]);

  // 4. 渲染
  return (
    <div>
      {components.map((component) => (
        <PreviewCanvasItem key={component.id} component={component} />
      ))}
    </div>
  );
};
```

### 5.2 快捷键如何调用 Store 方法

**集成方式**：通过回调函数注入，实现松耦合

```typescript
// 1. 在 App.tsx 中定义回调并传递给 Hook
function AppContent() {
  const undo = useBuilderStore((state) => state.undo);
  const redo = useBuilderStore((state) => state.redo);
  const removeComponent = useBuilderStore((state) => state.removeComponent);
  const selectedComponentId = useBuilderStore((state) => state.selectedComponentId);

  // 定义删除回调
  const handleDelete = useCallback(() => {
    if (selectedComponentId) {
      removeComponent(selectedComponentId);
    }
  }, [selectedComponentId, removeComponent]);

  // 定义复制回调
  const handleCopy = useCallback(async () => {
    if (!selectedComponentId) return;
    const componentToCopy = findComponentById(components, selectedComponentId);
    if (!componentToCopy) return;
    const success = await writeComponentToClipboard(componentToCopy);
    if (success) {
      toast.success(`已复制: ${componentToCopy.type}`);
    }
  }, [selectedComponentId, components, toast]);

  // 传递给 Hook
  useKeyboardShortcuts({
    onUndo: undo,
    onRedo: redo,
    onDelete: handleDelete,
    onCopy: handleCopy,
    onPaste: handlePaste,
    enabled: true,
  });
}
```
[App.tsx:59-100](file:///g:/Remote/prompt%20program/React01/src/App.tsx#L59-L100)

**Hook 内部调用**：
```typescript
// src/hooks/useKeyboardShortcuts.ts
export const useKeyboardShortcuts = ({
  onUndo,
  onRedo,
  onDelete,
  onCopy,
  onPaste,
  enabled = true,
}: KeyboardShortcutsProps = {}) => {
  const handleKeyDown = useCallback(
    async (event: KeyboardEvent) => {
      // ... 检测快捷键组合
      
      // 撤销
      if (primaryModifierPressed && key === 'z' && !shiftPressed) {
        if (onUndo) {
          event.preventDefault();
          onUndo();  // 调用注入的回调
        }
        return;
      }
      
      // 重做
      if (primaryModifierPressed && key === 'y') {
        if (onRedo) {
          event.preventDefault();
          onRedo();
        }
        return;
      }
      
      // 删除
      if (key === 'delete' || key === 'backspace') {
        if (onDelete) {
          event.preventDefault();
          onDelete();
        }
        return;
      }
      
      // 复制
      if (primaryModifierPressed && key === 'c' && !shiftPressed) {
        if (onCopy) {
          event.preventDefault();
          onCopy();
        }
        return;
      }
      
      // 粘贴
      if (primaryModifierPressed && key === 'v' && !shiftPressed) {
        if (onPaste) {
          event.preventDefault();
          onPaste();
        }
        return;
      }
    },
    [enabled, location.pathname, onUndo, onRedo, onDelete, onCopy, onPaste]
  );
};
```
[useKeyboardShortcuts.ts:95-206](file:///g:/Remote/prompt%20program/React01/src/hooks/useKeyboardShortcuts.ts#L95-L206)

### 5.3 层级排序与拖拽系统的交互关系

**共同点**：都操作组件数组的顺序

```typescript
// 层级排序：通过数组索引操作实现
// 数组中后面的元素渲染在前面的元素之上（视觉层级更高）

// 上移一层 = 数组索引 +1
moveUp: (id) => {
  const location = findComponentLocation(components, id);
  const newIndex = location.index + 1;
  const newComponents = reorderComponentInTree(components, id, newIndex);
  // ...
};

// 下移一层 = 数组索引 -1
moveDown: (id) => {
  const location = findComponentLocation(components, id);
  const newIndex = location.index - 1;
  const newComponents = reorderComponentInTree(components, id, newIndex);
  // ...
};
```
[useBuilderStore.ts:810-892](file:///g:/Remote/prompt%20program/React01/src/store/useBuilderStore.ts#L810-L892)

**拖拽系统对层级的影响**：

| 拖拽场景 | 对层级的影响 |
|---------|-------------|
| 从组件面板拖入根画布 | 新组件添加到数组末尾（层级最高） |
| 从组件面板拖入 Container | 新组件添加到 Container 的 children 末尾 |
| 从画布拖拽已存在组件 | 只更新位置 (x, y)，不改变层级 |
| 从容器内拖拽到根画布 | 组件从 Container 移出，添加到根数组末尾 |
| 从容器内拖拽到另一个 Container | 组件移动到目标 Container 的 children 末尾 |
| 同一容器内拖拽排序 | sortable 插件自动调整 children 数组顺序 |

**关键集成点**：
```typescript
// DndContext.tsx 中的放置逻辑
const handleDragEnd = useCallback((event: DragEndEvent) => {
  // 场景 1: 新组件拖入
  if (isPanelItem(activeIdStr)) {
    const newComponent = createComponentFromType(type, position.x, position.y);
    
    if (isOverContainerDropZone && targetContainerId) {
      // 添加到 Container 的 children 末尾
      addComponentToParent(targetContainerId, newComponent);
    } else {
      // 添加到根数组末尾（层级最高）
      addComponent(newComponent);
    }
  }
  
  // 场景 2: 已有组件移动
  if (isCanvasItem(activeIdStr)) {
    // 只更新位置，不改变层级
    updateComponent(actualActiveId, {
      x: position.x,
      y: position.y,
    });
    
    // 如果父容器变化，可能改变层级
    if (isOverContainerDropZone && targetContainerId) {
      moveComponentToParent(actualActiveId, targetContainerId);
    } else if (isOverRootDropZone) {
      moveComponentToParent(actualActiveId, null);
    }
  }
}, [addComponent, updateComponent, addComponentToParent, moveComponentToParent]);
```
[DndContext.tsx:343-595](file:///g:/Remote/prompt%20program/React01/src/components/builder/DndContext.tsx#L343-L595)

### 5.4 数据校验与存储恢复的集成

**存储恢复时的校验流程**：
```typescript
// 1. storage.ts 中 loadProject 执行校验
export const loadProject = (id: string): LoadProjectResult => {
  try {
    const stored = localStorage.getItem(projectKey);
    
    // 2. JSON 解析
    let parsedData: unknown;
    try {
      parsedData = JSON.parse(stored);
    } catch (parseError) {
      return {
        success: false,
        isCorrupted: true,
        validationErrors: 'JSON 解析失败',
      };
    }
    
    // 3. 数据格式校验
    const validation = validateProjectData(parsedData);
    
    if (!validation.valid) {
      return {
        success: false,
        isCorrupted: true,
        validationErrors: formatValidationErrors(validation.errors),
      };
    }
    
    return { success: true, project: parsedData as Project };
  } catch (error) {
    return { success: false, isCorrupted: true, validationErrors: error.message };
  }
};

// 4. store 中处理校验失败
loadProject: (projectId) => {
  const result = loadProjectFromStorage(projectId);
  
  if (!result.success || !result.project) {
    // 设置错误状态，供 UI 层展示
    set({
      loadError: result.validationErrors || '无法加载项目',
      isProjectCorrupted: result.isCorrupted || false,
    });
    return false;
  }
  
  // 校验通过，正常加载
  setComponents(result.project.components);
  set({
    currentProjectId: result.project.id,
    projectName: result.project.name,
    // ...
  });
  return true;
};

// 5. App.tsx 中监听错误并提示
useEffect(() => {
  if (loadError) {
    if (isProjectCorrupted) {
      toast.error(`项目数据损坏: ${loadError}，已创建新的空项目`);
    } else {
      toast.error(`加载失败: ${loadError}`);
    }
    clearLoadError();
  }
}, [loadError, isProjectCorrupted, clearLoadError, toast]);
```
[storage.ts:93-134](file:///g:/Remote/prompt%20program/React01/src/utils/storage.ts#L93-L134)
[useBuilderStore.ts:415-449](file:///g:/Remote/prompt%20program/React01/src/store/useBuilderStore.ts#L415-L449)

### 5.5 存储操作与 Toast 反馈的集成

**集成方式**：在 Store 和页面组件中使用 `useToast` Hook

```typescript
// App.tsx 中的 Toast 反馈示例
function AppContent() {
  const toast = useToast();
  const saveStatus = useBuilderStore((state) => state.saveStatus);
  const saveErrorMessage = useBuilderStore((state) => state.saveErrorMessage);

  // 监听保存状态变化
  useEffect(() => {
    if (saveStatus === 'saved') {
      toast.success('已自动保存');
    } else if (saveStatus === 'error') {
      toast.error(saveErrorMessage || '保存失败');
    }
  }, [saveStatus, saveErrorMessage, toast]);

  // 复制操作反馈
  const handleCopy = useCallback(async () => {
    if (!selectedComponentId) return;
    const componentToCopy = findComponentById(components, selectedComponentId);
    if (!componentToCopy) return;
    
    const success = await writeComponentToClipboard(componentToCopy);
    if (success) {
      toast.success(`已复制: ${componentToCopy.type}`);
    }
  }, [selectedComponentId, components, toast]);

  // 粘贴操作反馈
  const handlePaste = useCallback(async () => {
    const component = await readComponentFromClipboard();
    if (component) {
      const newComponent = {
        ...component,
        id: generateId(component.type.toLowerCase()),
        x: component.x + 20,
        y: component.y + 20,
      };
      addComponent(newComponent);
      toast.success(`已粘贴: ${component.type}`);
    }
  }, [addComponent, toast]);
}
```

**ProjectsPage.tsx 中的存储操作反馈**：
```typescript
// 项目删除
const handleDeleteProject = async (project: ProjectMetadata) => {
  const confirmed = await confirmModal.show({
    title: '确认删除',
    message: `确定要删除项目 "${project.name}" 吗？`,
  });
  
  if (confirmed) {
    const success = deleteProjectById(project.id);
    if (success) {
      toast.success(`已删除项目: ${project.name}`);
      refreshProjects();
    } else {
      toast.error(`删除项目失败: ${project.name}`);
    }
  }
};

// 项目导入
const handleImportProject = async () => {
  const file = await selectFileForImport();
  if (!file) return;
  
  try {
    const fileContent = await readFileAsText(file);
    const result = importProjectFromJSON(fileContent);
    
    if (result.warnings.length > 0) {
      result.warnings.forEach((warning) => {
        toast.warning(warning, 5000);
      });
    }
    
    if (!result.success) {
      toast.error(`导入失败: ${result.errors[0]?.message || '未知错误'}`);
      return;
    }
    
    if (result.project) {
      toast.success(`成功导入项目: ${result.project.name}`);
      navigate(`/builder?project=${result.project.id}`);
    }
  } catch (error) {
    toast.error(`导入失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
};

// 项目重命名
const handleRenameProject = async (project: ProjectMetadata) => {
  const newName = await inputModal.show({
    title: '重命名项目',
    defaultValue: project.name,
    placeholder: '请输入新的项目名称',
  });
  
  if (!newName || newName.trim() === project.name) return;
  
  const nameValidation = validateProjectName(newName);
  if (!nameValidation.valid) {
    toast.error(`无效的项目名称: ${nameValidation.errors[0]?.message}`);
    return;
  }
  
  const success = renameProjectInStorage(project.id, newName.trim());
  if (success) {
    toast.success(`已重命名为: ${newName.trim()}`);
    refreshProjects();
  } else {
    toast.error('重命名失败');
  }
};
```

---

## 6. 已知限制与改进建议

### 6.1 已知限制

#### 6.1.1 localStorage 容量限制

**当前状态**：
- 使用 localStorage 作为唯一存储介质
- 标准配额通常为 5MB（因浏览器而异）
- 存储对象较多时可能超出配额

**影响**：
- 项目数据（包括大量组件、图片 URL 等）可能占用较多空间
- 超出配额时 `setItem` 会抛出 `QuotaExceededError`
- 当前已有容量预警机制，但无法解决根本问题

**相关代码**：
```typescript
// validation.ts 中的容量预估
const LOCALSTORAGE_QUOTA_MB = 5;
const LOCALSTORAGE_WARNING_THRESHOLD = 0.8; // 80% 时警告

// storage.ts 中的配额错误处理
try {
  localStorage.setItem(projectKey, JSON.stringify(project));
  return project;
} catch (error) {
  if (error instanceof DOMException && error.name === 'QuotaExceededError') {
    throw new Error('存储空间已满，请清理一些项目后再试', { cause: error });
  }
  throw error;
}
```
[validation.ts:228-259](file:///g:/Remote/prompt%20program/React01/src/utils/validation.ts#L228-L259)
[storage.ts:75-84](file:///g:/Remote/prompt%20program/React01/src/utils/storage.ts#L75-L84)

#### 6.1.2 缺少服务端存储

**当前状态**：
- 所有数据仅存储在浏览器本地
- 清除浏览器数据会导致项目丢失
- 无法跨设备同步

**影响**：
- 数据安全性依赖浏览器
- 无法实现协作编辑
- 无法跨设备工作

#### 6.1.3 预览模式的 RWD 限制

**当前状态**：
- 预览模式使用固定宽度的画布渲染
- 没有响应式断点模拟
- 无法在不同屏幕尺寸下预览效果

**影响**：
- 无法真实测试页面在不同设备上的表现
- 组件位置是绝对定位，不适合流动布局

#### 6.1.4 组件类型有限

**当前状态**：
- 仅支持 4 种基础组件：Text、Button、Image、Container
- 缺少表单组件（Input、Select、Checkbox 等）
- 缺少高级组件（Table、Chart、Modal 等）

**影响**：
- 无法构建复杂的表单页面
- 无法展示数据列表和图表

#### 6.1.5 历史记录内存占用

**当前状态**：
- 历史记录存储在内存中（Zustand store）
- 最多保存 50 条历史记录
- 每条记录是完整的 components 数组深拷贝

**影响**：
- 组件较多时内存占用较大
- 页面刷新后历史记录丢失

**相关代码**：
```typescript
const MAX_HISTORY_LENGTH = 50;

// 每次操作都深拷贝 components
const stateToSave: HistoryState = {
  components: structuredClone(previousComponents),
  selectedComponentId: selectedComponentId,
};
```
[useBuilderStore.ts:16](file:///g:/Remote/prompt%20program/React01/src/store/useBuilderStore.ts#L16)

### 6.2 后续改进建议

#### 6.2.1 存储层改进建议

**建议 1：实现多存储适配器**

```typescript
// 设计思路：抽象 Storage 接口，支持多种实现

interface StorageAdapter {
  saveProject(project: Project): Promise<Project>;
  loadProject(id: string): Promise<LoadProjectResult>;
  listProjects(): Promise<ProjectMetadata[]>;
  deleteProject(id: string): Promise<boolean>;
}

// localStorage 适配器
class LocalStorageAdapter implements StorageAdapter {
  // 现有实现
}

// IndexedDB 适配器（解决容量问题）
class IndexedDBAdapter implements StorageAdapter {
  // 使用 IndexedDB，支持更大容量
}

// 远程服务适配器（支持跨设备）
class RemoteServiceAdapter implements StorageAdapter {
  // 使用后端 API
  // 需要用户认证
}

// 混合适配器（本地优先，远程同步）
class HybridAdapter implements StorageAdapter {
  private localStorage: LocalStorageAdapter;
  private remoteService: RemoteServiceAdapter;
  
  // 本地保存后异步同步到远程
  // 加载时优先使用远程最新版本
}
```

**建议 2：项目数据压缩**

```typescript
// 设计思路：在保存前压缩数据，减少存储空间

import pako from 'pako'; // zlib 压缩库

// 压缩后保存
export const saveProject = (projectData: ...): Project => {
  const project = { /* ... */ };
  
  // 序列化为 JSON 字符串
  const jsonString = JSON.stringify(project);
  
  // 压缩为 Uint8Array
  const compressed = pako.deflate(jsonString);
  
  // 转换为 Base64 字符串存储
  const base64 = btoa(String.fromCharCode(...compressed));
  
  localStorage.setItem(projectKey, base64);
  return project;
};

// 读取时解压
export const loadProject = (id: string): LoadProjectResult => {
  const stored = localStorage.getItem(projectKey);
  if (!stored) return { success: false };
  
  // Base64 解码
  const compressed = Uint8Array.from(atob(stored), c => c.charCodeAt(0));
  
  // 解压
  const jsonString = pako.inflate(compressed, { to: 'string' });
  
  // 解析和校验
  const parsedData = JSON.parse(jsonString);
  const validation = validateProjectData(parsedData);
  // ...
};
```

**预期收益**：
- 文本数据通常可压缩 70%-90%
- 有效缓解 localStorage 容量问题
- 无需修改上层代码

#### 6.2.2 RWD 预览扩展建议

**建议 1：设备尺寸模拟器**

```typescript
// 设计思路：在预览模式添加设备尺寸选择器

interface DevicePreset {
  name: string;
  width: number;
  height: number;
  icon: string;
}

const devicePresets: DevicePreset[] = [
  { name: '桌面端', width: 1920, height: 1080, icon: '🖥️' },
  { name: '笔记本', width: 1366, height: 768, icon: '💻' },
  { name: '平板横屏', width: 1024, height: 768, icon: '📱' },
  { name: '平板竖屏', width: 768, height: 1024, icon: '📱' },
  { name: '手机横屏', width: 812, height: 375, icon: '📱' },
  { name: '手机竖屏', width: 375, height: 812, icon: '📱' },
  { name: '自定义', width: 0, height: 0, icon: '⚙️' },
];

// 在 PreviewPage 中添加尺寸选择器
const PreviewPage: React.FC = () => {
  const [selectedDevice, setSelectedDevice] = useState<DevicePreset>(devicePresets[0]);
  const [customWidth, setCustomWidth] = useState(1920);
  const [customHeight, setCustomHeight] = useState(1080);
  
  const actualWidth = selectedDevice.name === '自定义' ? customWidth : selectedDevice.width;
  const actualHeight = selectedDevice.name === '自定义' ? customHeight : selectedDevice.height;
  
  return (
    <div>
      {/* 设备选择工具栏 */}
      <div className="device-selector">
        {devicePresets.map((device) => (
          <button
            key={device.name}
            onClick={() => setSelectedDevice(device)}
            className={selectedDevice.name === device.name ? 'active' : ''}
          >
            {device.icon} {device.name}
          </button>
        ))}
      </div>
      
      {/* 可调整大小的预览容器 */}
      <div 
        className="preview-container"
        style={{ 
          width: actualWidth, 
          height: actualHeight,
          transform: `scale(${calculateScale()})`,
          transformOrigin: 'top center'
        }}
      >
        {/* 组件渲染 */}
        {components.map((component) => (
          <PreviewCanvasItem key={component.id} component={component} />
        ))}
      </div>
    </div>
  );
};
```

**建议 2：流动布局支持**

```typescript
// 设计思路：支持两种布局模式

enum LayoutMode {
  Absolute = 'absolute',    // 绝对定位（当前模式）
  Flow = 'flow',            // 流动布局（RWD 友好）
}

// 组件数据结构扩展
interface ComponentSchema {
  // 现有字段
  id: string;
  type: ComponentType;
  props: Record<string, unknown>;
  styles: Record<string, unknown>;
  
  // 绝对定位字段（现有）
  x?: number;
  y?: number;
  width?: number | string;
  height?: number | string;
  
  // 流动布局字段（新增）
  layout?: {
    mode: LayoutMode;
    flex?: {
      flexGrow?: number;
      flexShrink?: number;
      flexBasis?: string;
    };
    grid?: {
      gridColumn?: string;
      gridRow?: string;
    };
    margin?: string;
    padding?: string;
  };
}

// Container 支持多种布局类型
interface ContainerComponentSchema extends ComponentBaseSchema {
  type: ComponentType.Container;
  children: ComponentSchema[];
  
  // 容器布局配置
  containerLayout?: {
    type: 'flex' | 'grid' | 'block';
    flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
    justifyContent?: string;
    alignItems?: string;
    gap?: string;
    gridTemplateColumns?: string;
    gridTemplateRows?: string;
  };
}
```

**预期收益**：
- 可在不同设备尺寸下预览真实效果
- 支持构建真正的响应式页面
- 更接近实际生产环境的渲染

#### 6.2.3 组件系统扩展建议

**建议 1：组件插件系统**

```typescript
// 设计思路：使用插件机制扩展组件类型

interface ComponentPlugin {
  type: string;           // 组件类型标识
  label: string;          // 显示名称
  icon: string;           // 图标
  
  // 渲染器
  renderer: React.ComponentType<{
    component: ComponentSchema;
    editable?: boolean;
    isSelected?: boolean;
    onClick?: () => void;
  }>;
  
  // 默认配置
  defaultProps: Record<string, unknown>;
  defaultStyles: Record<string, unknown>;
  defaultWidth: number;
  defaultHeight: number;
  
  // 属性编辑器
  propertyEditors: PropertyEditor[];
}

// 属性编辑器定义
interface PropertyEditor {
  path: string;           // 如 'props.text' 或 'styles.color'
  label: string;
  type: 'text' | 'number' | 'color' | 'select' | 'textarea';
  options?: { label: string; value: string }[];  // select 类型用
}

// 注册插件
const componentRegistry = new Map<string, ComponentPlugin>();

export function registerComponent(plugin: ComponentPlugin) {
  componentRegistry.set(plugin.type, plugin);
}

// 使用示例
registerComponent({
  type: 'Input',
  label: '输入框',
  icon: '📝',
  renderer: InputComponent,
  defaultProps: { placeholder: '请输入...', type: 'text' },
  defaultStyles: {},
  defaultWidth: 200,
  defaultHeight: 40,
  propertyEditors: [
    { path: 'props.placeholder', label: '占位符', type: 'text' },
    { path: 'props.type', label: '类型', type: 'select', options: [
      { label: '文本', value: 'text' },
      { label: '密码', value: 'password' },
      { label: '邮箱', value: 'email' },
      { label: '数字', value: 'number' },
    ]},
    { path: 'styles.backgroundColor', label: '背景色', type: 'color' },
  ],
});
```

**建议 2：表单组件库**

```typescript
// 建议新增的组件类型

enum ComponentType {
  // 现有组件
  Text = 'Text',
  Button = 'Button',
  Image = 'Image',
  Container = 'Container',
  
  // 建议新增：表单组件
  Input = 'Input',
  Textarea = 'Textarea',
  Select = 'Select',
  Checkbox = 'Checkbox',
  Radio = 'Radio',
  Switch = 'Switch',
  DatePicker = 'DatePicker',
  FileUpload = 'FileUpload',
  
  // 建议新增：高级组件
  Table = 'Table',
  Chart = 'Chart',
  Tabs = 'Tabs',
  Accordion = 'Accordion',
  Modal = 'Modal',
  Toast = 'Toast',
  
  // 建议新增：布局组件
  FlexContainer = 'FlexContainer',
  GridContainer = 'GridContainer',
  Divider = 'Divider',
  Spacer = 'Spacer',
}
```

#### 6.2.4 历史记录改进建议

**建议 1：增量历史记录**

```typescript
// 设计思路：不再存储完整状态，只存储变更操作

// 当前方式（完整存储）
interface HistoryState {
  components: ComponentSchema[];  // 完整拷贝
  selectedComponentId: string | null;
}

// 改进方式（增量存储）
type HistoryOperation = 
  | { type: 'add'; component: ComponentSchema; parentId: string | null; index: number }
  | { type: 'remove'; id: string; previousState: ComponentSchema; previousParent: string | null; previousIndex: number }
  | { type: 'update'; id: string; previousValue: Partial<ComponentSchema>; newValue: Partial<ComponentSchema> }
  | { type: 'move'; id: string; fromParent: string | null; fromIndex: number; toParent: string | null; toIndex: number }
  | { type: 'reorder'; id: string; fromIndex: number; toIndex: number; parentId: string | null };

interface HistoryEntry {
  operations: HistoryOperation[];  // 一组原子操作
  timestamp: number;
}

// 应用操作到当前状态
function applyOperation(components: ComponentSchema[], op: HistoryOperation): ComponentSchema[] {
  switch (op.type) {
    case 'add':
      return addComponentToParentInTree(components, op.parentId, op.component, op.index);
    case 'remove':
      return removeComponentFromTree(components, op.id);
    case 'update':
      return updateComponentInTree(components, op.id, op.newValue);
    case 'move':
      // ...
    case 'reorder':
      // ...
  }
}

// 撤销操作
function invertOperation(op: HistoryOperation): HistoryOperation {
  switch (op.type) {
    case 'add':
      // 撤销添加 = 删除
      return { type: 'remove', id: op.component.id, previousState: op.component, previousParent: op.parentId, previousIndex: op.index };
    case 'remove':
      // 撤销删除 = 添加回原位置
      return { type: 'add', component: op.previousState, parentId: op.previousParent, index: op.previousIndex };
    case 'update':
      // 撤销更新 = 应用旧值
      return { type: 'update', id: op.id, previousValue: op.newValue, newValue: op.previousValue };
    // ...
  }
}
```

**预期收益**：
- 大幅减少内存占用（通常可减少 90% 以上）
- 可支持更多历史记录条数
- 可实现协作编辑（操作同步）

**建议 2：历史记录持久化**

```typescript
// 设计思路：将历史记录也存储到 localStorage 或 IndexedDB

// 页面刷新后恢复历史记录
const loadHistoryFromStorage = (projectId: string): HistoryEntry[] => {
  try {
    const stored = localStorage.getItem(`history_${projectId}`);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveHistoryToStorage = (projectId: string, history: HistoryEntry[]) => {
  try {
    localStorage.setItem(`history_${projectId}`, JSON.stringify(history));
  } catch (error) {
    console.warn('Failed to save history:', error);
  }
};

// 限制历史记录条数
const MAX_PERSISTED_HISTORY = 20;  // 持久化的记录数可以少一些
```

#### 6.2.5 错误处理增强建议

**建议 1：全局错误追踪**

```typescript
// 设计思路：添加 Sentry 或类似的错误追踪服务

// 初始化时配置
if (import.meta.env.PROD) {
  // Sentry.init({ dsn: '...' });
}

// ErrorBoundary 增强
export class ErrorBoundary extends Component<Props, State> {
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // 生产环境上报错误
    if (import.meta.env.PROD) {
      // Sentry.captureException(error, { extra: errorInfo });
    }
    
    // 本地存储错误日志，供用户反馈
    this.logErrorLocally(error, errorInfo);
  }
  
  logErrorLocally(error: Error, errorInfo: ErrorInfo) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
      },
      errorInfo,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
    
    try {
      const logs = JSON.parse(localStorage.getItem('error_logs') || '[]');
      logs.push(errorLog);
      // 只保留最近 10 条
      localStorage.setItem('error_logs', JSON.stringify(logs.slice(-10)));
    } catch {
      // 忽略
    }
  }
}
```

**建议 2：更细粒度的错误边界**

```typescript
// 设计思路：在关键组件周围添加局部错误边界

// 画布级别错误边界
function CanvasErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary 
      fallback={(error) => (
        <div className="canvas-error p-4 text-center">
          <div className="text-4xl mb-2">⚠️</div>
          <p className="text-gray-600">画布渲染出现问题</p>
          <p className="text-sm text-gray-500 mb-4">{error.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-500 text-white rounded"
          >
            刷新页面
          </button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

// 属性面板级别错误边界
function PropertyPanelErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary 
      fallback={(error) => (
        <div className="p-4 text-center">
          <p className="text-gray-600">属性面板加载失败</p>
          <p className="text-sm text-gray-500">{error.message}</p>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

// 使用示例
function App() {
  return (
    <Layout>
      <ComponentPanel />
      <CanvasErrorBoundary>
        <Canvas />
      </CanvasErrorBoundary>
      <PropertyPanelErrorBoundary>
        <PropertyPanel />
      </PropertyPanelErrorBoundary>
    </Layout>
  );
}
```

### 6.3 改进优先级建议

| 优先级 | 改进项 | 影响 | 复杂度 | 推荐时机 |
|--------|--------|------|--------|---------|
| **P0 - 高** | localStorage 容量压缩 | 缓解存储限制 | 中 | 近期 |
| **P0 - 高** | 历史记录持久化 | 刷新不丢失 | 中 | 近期 |
| **P1 - 中** | 多存储适配器 | 解决根本存储问题 | 高 | 中期 |
| **P1 - 中** | 设备尺寸模拟器 | 提升预览体验 | 低 | 中期 |
| **P2 - 低** | 组件插件系统 | 扩展性 | 高 | 长期 |
| **P2 - 低** | 增量历史记录 | 性能优化 | 高 | 长期 |
| **P2 - 低** | 流动布局支持 | RWD 能力 | 高 | 长期 |

---

## 7. 相关文档链接

| 文档 | 路径 | 说明 |
|------|------|------|
| 持久化模块架构设计 | `docs/PERSISTENCE-ARCHITECTURE.md` | 数据持久化、自动保存、项目管理的完整架构说明 |
| 存储服务自测文档 | `docs/STORAGE-SELF-TEST.md` | 存储模块的测试用例、验证步骤、边界情况说明 |
| 预览模式架构设计 | `docs/architecture/PREVIEW-MODE-ARCHITECTURE.md` | 预览模式的渲染策略、事件隔离、数据共享机制 |
| 键盘快捷键架构说明 | `docs/architecture/KEYBOARD-SHORTCUTS-ARCHITECTURE.md` | 快捷键系统的事件处理、焦点管理、跨平台兼容 |
| 容器拖拽功能自测文档 | `docs/容器拖拽功能自测文档.md` | 拖拽功能的测试场景、预期结果、边界情况 |
| 组件层级排序功能自测文档 | `docs/组件层级排序功能自测文档.md` | 层级排序功能的测试用例、验证步骤 |
| 键盘快捷键功能自测文档 | `docs/键盘快捷键功能自测文档.md` | 快捷键功能的测试场景、预期结果 |

---

*文档版本: v1.0*
*最后更新: 2026-05-03*