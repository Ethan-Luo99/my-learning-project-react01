# 持久化模块架构设计文档

## 文档信息

| 项目 | 内容 |
|------|------|
| 文档版本 | v1.1 |
| 最后更新 | 2026-05-02 |
| 作者 | 开发团队 |
| 状态 | 稳定 |

---

## 目录

1. [概述](#1-概述)
2. [数据流架构](#2-数据流架构)
3. [序列化方案](#3-序列化方案)
4. [版本兼容策略](#4-版本兼容策略)
5. [错误处理体系](#5-错误处理体系)
6. [项目管理模块集成](#6-项目管理模块集成)
7. [导入导出功能设计](#7-导入导出功能设计)
8. [关键模块说明](#8-关键模块说明)

---

## 1. 概述

### 1.1 设计目标

持久化模块的核心目标是：

1. **数据可靠性**：确保用户编辑的内容不会因为页面刷新或关闭而丢失
2. **可管理性**：支持多项目管理，用户可以创建、切换、删除项目
3. **可迁移性**：通过导入导出功能，实现项目数据的备份和迁移
4. **可扩展性**：数据格式设计为未来的版本升级预留兼容能力

### 1.2 模块边界

```
┌─────────────────────────────────────────────────────────────┐
│                      用户界面层                              │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────────────┐  │
│  │   Header    │  │  Projects   │  │   Toast 提示      │  │
│  │ (保存/导出)  │  │   (管理)    │  │   (用户反馈)      │  │
│  └─────────────┘  └─────────────┘  └───────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      状态管理层 (Zustand)                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              useBuilderStore                          │   │
│  │  - components (组件树状态)                            │   │
│  │  - currentProjectId (当前项目ID)                      │   │
│  │  - projectName (项目名称)                              │   │
│  │  - saveStatus (保存状态)                               │   │
│  │  - saveCurrentProject() (立即保存)                    │   │
│  │  - saveCurrentAndLoadProject() (切换项目)             │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          │
            ┌─────────────┼─────────────┐
            ▼             ▼             ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  useAutoSave  │  │  storage.ts   │  │import-export  │
│  (自动保存Hook)│  │  (核心存储)   │  │  (导入导出)   │
└───────────────┘  └───────────────┘  └───────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    localStorage (浏览器持久化存储)               │
│                                                              │
│  Keys:                                                      │
│  - lowcode_builder_project_list      (项目ID列表索引)       │
│  - lowcode_builder_project_<id>     (单个项目数据)         │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 数据流架构

### 2.1 数据流图

#### 2.1.1 持久化数据流（组件变更 → 存储）

```
用户操作 (拖拽/删除/修改属性/撤销重做)
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│              Zustand Store (components 数组变更)             │
│  通过 addComponent/removeComponent/updateComponent 等方法     │
└──────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│              useAutoSave Hook (自动保存监听)                   │
│                                                              │
│  useEffect(() => {                                            │
│    if (JSON.stringify(components) !== lastComponents) {      │
│      triggerSave()  // 启动防抖定时器                          │
│    }                                                          │
│  }, [components])                                             │
│                                                              │
│  防抖策略: 2秒内多次变更合并为一次保存                           │
│  saveTimeoutRef.current = setTimeout(() => {                │
│    saveCurrentProject(false)                                  │
│  }, 2000)                                                     │
└──────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│              storage.ts - saveProject()                        │
│                                                              │
│  1. 生成/更新 Project 对象:                                   │
│     { id, name, components, createdAt, updatedAt }            │
│                                                              │
│  2. 更新项目列表索引 (新项目时):                                │
│     localStorage.setItem('lowcode_builder_project_list',...) │
│                                                              │
│  3. 保存项目数据:                                             │
│     localStorage.setItem(`lowcode_builder_project_${id}`,...)│
└──────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│              UI 状态更新 (saveStatus 反馈)                     │
│                                                              │
│  saveStatus: 'saving' → 'saved' (2秒后自动恢复为'idle')    │
│  saveErrorMessage: 如失败则设置错误信息                         │
│  lastSavedAt: 更新最后保存时间戳                               │
│  Toast 提示: "项目已保存" 或错误消息                           │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 自动保存防抖策略

#### 2.2.1 防抖参数

```typescript
const SAVE_DELAY_MS = 2000;  // 2 秒延迟
```

#### 2.2.2 立即保存场景

以下场景会跳过防抖，立即执行保存：

| 场景 | 触发方式 | 说明 |
|------|---------|------|
| 用户点击"保存"按钮 | `saveCurrentProject(true)` | 明确的保存意图 |
| 切换项目 | `saveCurrentAndLoadProject()` | 切换前必须保存 |
| 创建新项目 | `saveCurrentAndCreateNewProject()` | 创建前必须保存 |
| 重命名项目 | `setProjectName()` → `saveCurrentProject(true)` | 名称变更立即保存 |
| 导出项目前 | 导出时构建当前 Project 对象 | 导出使用最新数据 |

### 2.3 页面初始化数据恢复流程

#### 2.3.1 恢复优先级

```
┌─────────────────────────────────────────────────────────────┐
│ 优先级 1: 检查 URL 参数（预留，暂未实现）                     │
│           ?projectId=xxx                                     │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼ (无)
┌─────────────────────────────────────────────────────────────┐
│ 优先级 2: 检查 localStorage 中的项目列表                      │
│                                                              │
│  有项目 → 加载列表中最新的项目 (projects[0])                  │
│  无项目 → 使用默认空画布 MOCK_EMPTY_CANVAS (空数组)          │
└─────────────────────────────────────────────────────────────┘
```

#### 2.3.2 恢复时的状态重置

恢复项目时，以下状态会被重置：

| 状态 | 重置值 | 原因 |
|------|--------|------|
| `selectedComponentId` | `null` | 恢复时不应保持之前的选中状态 |
| `saveStatus` | `'idle'` | 恢复后状态重置 |
| `history` | 重新创建 | 历史记录只对当前编辑会话有效 |
| `currentIndex` | `0` | 历史记录索引重置 |

---

## 3. 序列化方案

### 3.1 需要持久化的数据

#### 3.1.1 Project 数据结构

```typescript
interface Project {
  id: string;           // 唯一标识: project_时间戳_随机字符串
  name: string;         // 项目名称，用于展示
  createdAt: string;   // ISO 8601 格式，首次创建时设置
  updatedAt: string;   // ISO 8601 格式，每次保存更新
  components: ComponentSchema[];  // 组件树数据
}
```

#### 3.1.2 ComponentSchema 数据结构

```typescript
interface ComponentBaseSchema {
  id: string;           // 组件唯一 ID
  type: ComponentType;   // Text | Button | Image | Container
  
  // 布局位置
  x?: number;
  y?: number;
  width?: number | string;
  height?: number | string;
  
  // 业务数据
  props: Record<string, any>;
  styles: Record<string, string>;
}

interface ContainerComponentSchema extends ComponentBaseSchema {
  type: ComponentType.Container;
  children?: ComponentSchema[];  // 容器组件的子组件
}
```

### 3.2 不需要持久化的数据

| 状态 | 不持久化的原因 |
|------|--------------|
| `selectedComponentId` | UI 交互状态，每次打开页面时用户重新选择 |
| `history` | 撤销/重做历史，仅当前编辑会话有效 |
| `currentIndex` | 历史记录索引，同上 |
| `saveStatus` | 临时状态，指示保存中/已保存/错误 |
| `saveErrorMessage` | 临时错误信息 |
| `leftPanelVisible` | UI 布局状态，响应式设计自动调整 |
| `rightPanelVisible` | UI 布局状态，响应式设计自动调整 |

### 3.3 设计决策说明

#### 3.3.1 为什么不持久化 selectedComponentId？

- 用户重新打开页面时，从"干净"状态开始更好
- 组件可能被删除，保存的 ID 可能指向不存在的组件
- 不需要处理选中状态的验证逻辑

#### 3.3.2 为什么不持久化撤销/重做历史？

- 历史记录可能很大，每次操作保存完整的组件树快照
- 历史记录的版本兼容问题更复杂
- 用户预期撤销/重做是"当前编辑会话"的功能

---

## 4. 版本兼容策略

### 4.1 版本字段设计

当前数据格式（v1.0）没有 `version` 字段。为了未来兼容性，建议在 `Project` 接口中添加：

```typescript
// 建议的扩展：

interface Project {
  id: string;
  name: string;
  components: ComponentSchema[];
  createdAt: string;
  updatedAt: string;
  
  version: number;  // 数据格式版本号，从 1 开始
}
```

### 4.2 迁移函数接口规范

#### 4.2.1 迁移接口设计

```typescript
interface MigrationFn {
  (data: Record<string, unknown>): Record<string, unknown>;
}

const migrations: Record<number, MigrationFn> = {
  // 示例：
  // 2: migrateFromV1ToV2,
  // 3: migrateFromV2ToV3,
};

const CURRENT_SCHEMA_VERSION = 1;

const migrateToCurrentVersion = (
  data: Record<string, unknown>
): Record<string, unknown> => {
  const dataVersion = typeof data.version === 'number' 
    ? data.version 
    : 1;  // 无 version 字段视为版本 1

  if (dataVersion >= CURRENT_SCHEMA_VERSION) {
    return data;
  }

  let migratedData = { ...data };
  
  for (
    let targetVersion = dataVersion + 1; 
    targetVersion <= CURRENT_SCHEMA_VERSION; 
    targetVersion++
  ) {
    const migrationFn = migrations[targetVersion];
    if (migrationFn) {
      migratedData = migrationFn(migratedData);
      migratedData.version = targetVersion;
    }
  }

  return migratedData;
};
```

### 4.3 版本兼容性检查清单

开发新功能涉及数据格式变更时，应检查：

- [ ] 是否需要增加版本号？
- [ ] 是否需要编写迁移函数？
- [ ] 迁移函数是否递归处理嵌套结构？
- [ ] 文档是否更新？

---

## 5. 错误处理体系

### 5.1 存储失败降级策略

#### 5.1.1 可能的失败场景

| 失败场景 | 原因 | 降级策略 |
|---------|------|---------|
| `QuotaExceededError` | localStorage 容量已满 | 提示用户清理项目 |
| `SecurityError` | 隐私模式/跨域限制 | 提示用户检查浏览器设置 |
| JSON 解析失败 | 数据损坏 | 返回 null，不阻塞应用 |

#### 5.1.2 失败后的用户操作选项

当保存失败时，用户仍然可以：

1. **点击"重试"按钮** - 再次调用 saveCurrentProject(true)
2. **导出项目备份** - Header 的"导出"按钮，直接从内存中构建 Project 对象下载，绕过 localStorage 容量限制
3. **切换到项目管理页面** - 删除一些项目释放空间
4. **继续编辑 (在内存中)** - 组件状态仍然在 Zustand store 中，只是无法持久化

### 5.2 QuotaExceededError 捕获方式

#### 5.2.1 捕获实现

```typescript
try {
  localStorage.setItem(projectKey, JSON.stringify(project));
  return project;
} catch (error) {
  if (
    error instanceof DOMException && 
    (
      error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||  // Firefox
      (error as { code?: number }).code === 22  // 旧浏览器
    )
  ) {
    throw new Error('存储空间已满，请清理一些项目后再试', { 
      cause: error 
    });
  }
  throw error;
}
```

#### 5.2.2 浏览器兼容性

| 浏览器 | 错误名称 | 错误代码 |
|--------|---------|---------|
| Chrome/Edge | `QuotaExceededError` | - |
| Firefox | `QuotaExceededError` 或 `NS_ERROR_DOM_QUOTA_REACHED` | - |
| Safari | `QuotaExceededError` | - |

### 5.3 用户提示交互设计

#### 5.3.1 saveStatus 枚举

| 状态 | UI 表现 |
|------|---------|
| `'idle'` | 默认状态，显示"保存"按钮 |
| `'saving'` | 按钮显示"保存中..." + 加载图标，按钮禁用 |
| `'saved'` | 按钮显示"已保存" + 勾选图标，变体变为 outline，2秒后自动恢复 |
| `'error'` | 按钮显示"重试" + 保存图标，颜色变为红色，点击重试保存 |

#### 5.3.2 Toast 提示策略

| 场景 | Toast 类型 | 消息示例 |
|------|-----------|-----------|
| 自动保存成功 | `success` | "项目已保存" |
| 容量超限 | `error` | "存储空间已满，请清理一些项目后再试" |
| 项目创建 | `success` | "项目创建成功" |
| 导入成功 | `success` | "导入成功: xxx" |
| 导入格式错误 | `error` | "导入失败: components[0].type: 未知的组件类型..." |
| 大文件警告 | `warning` | "文件较大，导入可能需要较长时间" |

---

## 6. 项目管理模块集成

### 6.1 项目列表数据源

#### 6.1.1 数据结构设计

项目列表使用**索引 + 详情**分离存储：

```
localStorage:

Key: lowcode_builder_project_list
Value: ["project_xxx_001", "project_xxx_002", ...]
作用: 项目 ID 列表，按保存时间倒序排列

Key: lowcode_builder_project_{id}
Value: { id, name, components, createdAt, updatedAt }
作用: 单个项目的完整数据
```

#### 6.1.2 为什么这样设计？

- 列表加载时只读取元数据，不读取完整的组件树，性能更好
- 项目顺序可以独立于项目数据修改
- 最新的项目在最前面，符合用户预期

### 6.2 编辑器数据同步方式

#### 6.2.1 项目切换流程

```
用户点击"打开"某个项目
         │
         ▼
saveCurrentAndLoadProject(targetProjectId)
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  步骤 1: 检查是否是当前项目                                   │
│          if (currentProjectId === targetProjectId)            │
│            return true;  // 无需切换                           │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  步骤 2: 保存当前项目 (如果有)                                 │
│          if (currentProjectId)                                │
│            saveCurrentProject(true);  // 立即保存，跳过防抖    │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  步骤 3: 加载目标项目并恢复状态                                │
│          - 从 localStorage 读取项目数据                       │
│          - 恢复 components 数组到 store                       │
│          - 更新 currentProjectId / projectName / lastSavedAt │
│          - 重置 selectedComponentId 为 null                    │
│          - 重置 history 历史记录                              │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
Toast 提示: "已切换到项目：xxx"
导航到 /builder (如果在 ProjectsPage)
```

#### 6.2.2 删除项目的特殊处理

```typescript
// 检查删除的是否是当前打开的项目
if (projectToDelete.id === currentProjectId) {
  // 是当前项目，导航到项目管理页面
  navigate('/projects');
  // 注意: 此时编辑器的 store 中的 currentProjectId 仍然是被删除的 ID
  // 用户下次进入编辑器时会恢复为最新项目或空画布
}
```

---

## 7. 导入导出功能设计

### 7.1 导出功能

#### 7.1.1 导出数据流

```
用户点击 Header 的 "导出" 按钮
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  1. 构建 Project 对象 (从 store 状态)                        │
│     {                                                        │
│       id: currentProjectId || `export_${timestamp}`,          │
│       name: projectName,                                     │
│       components: [...components],                           │
│       createdAt: lastSavedAt || now,                       │
│       updatedAt: now,                                       │
│     }                                                        │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  2. 检查文件大小                                              │
│     if (size > 5MB) → toast.warning("文件较大...")          │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  3. 生成文件名并下载                                          │
│     文件名格式: "项目名_时间戳.json"                          │
│     示例: "我的着陆页_1777710450000.json"                   │
│                                                              │
│     创建 Blob 和下载链接                                       │
│     触发浏览器下载                                             │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
Toast 提示: "已导出: xxx"
```

#### 7.1.2 文件名处理

```typescript
// 非法字符替换规则:
const sanitizeFileName = (name: string): string => {
  // 替换 Windows/macOS/Linux 文件名非法字符
  // 非法字符: < > : " / \ | ? *
  return name.replace(/[<>:"/\\|?*]/g, '_').trim();
};

// 示例:
// "我的<项目>: 测试" → "我的_项目__ 测试"
```

### 7.2 导入功能

#### 7.2.1 导入数据流

```
用户点击 "导入项目" 按钮
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  1. 打开文件选择对话框                                        │
│     (用户选择 .json 文件)                                    │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  2. 文件类型和大小验证                                        │
│                                                              │
│  - 文件名必须以 .json 结尾                                    │
│    不满足 → toast.error("请选择 .json 格式的项目文件")       │
│                                                              │
│  - 文件大小不能超过 20MB                                     │
│    超过 → toast.error("文件过大，最大限制 20MB")            │
│                                                              │
│  - 文件大小超过 5MB 给出警告                                  │
│    超过 → toast.warning("文件较大，导入可能需要较长时间")      │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  3. 读取文件内容并解析                                        │
│     const jsonString = await readFileAsText(file);          │
│     try { JSON.parse(jsonString) }                            │
│     catch → "导入失败: JSON 解析失败"                         │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  4. 格式验证 (validateProjectData)                           │
│                                                              │
│  项目级别:                                                   │
│  - 必须是对象                                                │
│  - name 必须是非空字符串                                     │
│  - components 必须是数组                                     │
│                                                              │
│  组件级别 (递归):                                            │
│  - id 必须是非空字符串                                       │
│  - type 必须是有效值                                         │
│    (Text/Button/Image/Container)                           │
│  - props 必须是对象                                          │
│  - styles 必须是对象                                         │
│  - Container 的 children 必须是数组                          │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  5. 检查重名并自动重命名                                      │
│                                                              │
│  if (项目名 "我的项目" 已存在)                                │
│    → 自动重命名为 "我的项目 (1)"                              │
│    → toast.warning("项目名已存在，自动重命名为...")          │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  6. 保存到 localStorage 并切换                                │
│                                                              │
│  - 调用 saveProject() 保存                                   │
│  - 调用 saveCurrentAndLoadProject() 切换到导入的项目         │
│  - 导航到 /builder                                            │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
Toast 提示: "导入成功: xxx"
```

#### 7.2.2 重名处理逻辑

```typescript
// 重名自动追加序号:

const generateUniqueProjectName = (baseName: string): string => {
  const existingNames = new Set(
    existingProjects.map((p) => p.name.toLowerCase())
  );

  // 名称不存在，直接使用
  if (!existingNames.has(baseName.toLowerCase())) {
    return baseName;
  }

  // 名称存在，追加序号
  let counter = 1;
  do {
    newName = `${baseName} (${counter})`;
    counter++;
  } while (existingNames.has(newName.toLowerCase()));

  return newName;
};
```

### 7.3 格式验证规则

#### 7.3.1 验证层级

```
validateProjectData(data)
│
├── 项目级别验证
│   ├── 必须是对象
│   ├── name 必须是非空字符串
│   ├── components 必须是数组
│   └── createdAt/updatedAt (可选) 必须是有效日期字符串
│
├── 组件级别验证 (递归)
│   ├── 必须是对象
│   ├── id 必须是非空字符串
│   ├── type 必须是有效值 (Text/Button/Image/Container)
│   ├── props 必须是对象
│   ├── styles 必须是对象
│   └── Container 的 children 必须是数组
│       └── 递归验证每个子组件
│
└── 文件大小验证
    ├── ⚠️ > 5MB: 警告
    └── ❌ > 20MB: 拒绝导入
```

#### 7.3.2 验证错误消息格式

```typescript
// 错误使用 path 定位具体位置:

// 示例错误消息:
// "components[0].type: 未知的组件类型: \"InvalidType\""
// "components[2].props: props 必须是对象"
// "components[1].children[0].id: 组件必须有非空字符串类型的 id"
```

---

## 8. 关键模块说明

### 8.1 storage.ts - 核心存储服务

#### 8.1.1 文件位置

```
src/utils/storage.ts
```

#### 8.1.2 核心函数列表

| 函数 | 用途 | 导出 |
|------|------|------|
| `saveProject(projectData)` | 保存项目到 localStorage | ✅ |
| `loadProject(id)` | 加载单个项目 | ✅ |
| `listProjects()` | 获取所有项目元数据列表 | ✅ |
| `deleteProject(id)` | 删除项目 | ✅ |
| `getProjectMetadata(id)` | 获取项目元数据 | ✅ |
| `getLatestProject()` | 获取最近保存的项目 | ✅ |
| `renameProject(id, newName)` | 重命名项目 | ✅ |
| `createNewEmptyProject(name?)` | 创建空项目 | ✅ |

### 8.2 useAutoSave.ts - 自动保存 Hook

#### 8.2.1 文件位置

```
src/hooks/useAutoSave.ts
```

#### 8.2.2 使用方式

```typescript
function App() {
  useAutoSave();  // 调用即可，自动监听 components 变化
  
  return <BuilderLayout ... />;
}
```

### 8.3 import-export.ts - 导入导出服务

#### 8.3.1 文件位置

```
src/utils/import-export.ts
```

#### 8.3.2 大小常量

```typescript
const EXPORT_FILE_SIZE_WARNING_LIMIT = 5 * 1024 * 1024;  // 5MB
const EXPORT_FILE_SIZE_ERROR_LIMIT = 20 * 1024 * 1024;   // 20MB
```

### 8.4 useBuilderStore.ts - 状态管理集成

#### 8.4.1 文件位置

```
src/store/useBuilderStore.ts
```

#### 8.4.2 持久化相关方法

| 方法 | 用途 |
|------|------|
| `saveCurrentAndCreateNewProject(name?)` | 保存当前并创建新项目 |
| `saveCurrentAndLoadProject(projectId)` | 保存当前并加载其他项目 |
| `isCurrentProject(projectId)` | 检查是否是当前项目 |

---

*文档版本: v1.1*
*最后更新: 2026-05-02*
