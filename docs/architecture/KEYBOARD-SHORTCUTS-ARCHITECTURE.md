# 键盘快捷键系统架构说明

## 1. 概述

本文件详细说明了 React 可视化编辑器项目中键盘快捷键系统的设计与实现。该系统为用户提供了撤销、重做、删除、复制、粘贴等核心操作的快捷方式，并确保跨平台兼容性和良好的用户体验。

---

## 2. 核心架构设计

### 2.1 useKeyboardShortcuts Hook

`useKeyboardShortcuts` 是快捷键系统的核心 Hook，位于 `src/hooks/useKeyboardShortcuts.ts`。

#### 事件注册机制

- **注册方式**：使用 React 的 `useEffect` Hook 在 `window` 对象上注册 `keydown` 事件监听器
- **捕获阶段**：使用 `{ capture: true }` 选项，确保事件在捕获阶段处理，优先于目标元素的事件处理
- **事件处理函数**：通过 `useCallback` 包装，确保依赖项变化时才重新创建

```typescript
useEffect(() => {
  window.addEventListener('keydown', handleKeyDown, { capture: true });
  
  return () => {
    window.removeEventListener('keydown', handleKeyDown, { capture: true });
  };
}, [handleKeyDown]);
```
[useKeyboardShortcuts.ts:192-198](file:///g:/Remote/prompt%20program/React01/src/hooks/useKeyboardShortcuts.ts#L192-L198)

#### 事件清理机制

- **自动清理**：`useEffect` 的返回函数会在组件卸载时自动执行，移除事件监听器
- **避免内存泄漏**：确保即使组件多次挂载/卸载，也不会累积多个事件监听器
- **依赖项管理**：`handleKeyDown` 作为依赖项，确保回调函数更新时重新注册事件

---

## 3. 快捷键映射表

以下是所有注册的快捷键及其对应功能：

| 功能 | Windows/Linux 快捷键 | Mac 快捷键 | 描述 |
|------|---------------------|------------|------|
| **撤销** | `Ctrl + Z` | `Cmd + Z` | 撤销上一步操作 |
| **重做** | `Ctrl + Y` 或 `Ctrl + Shift + Z` | `Cmd + Y` 或 `Cmd + Shift + Z` | 重做已撤销的操作 |
| **删除** | `Delete` 或 `Backspace` | `Delete` 或 `Backspace` | 删除当前选中的组件 |
| **复制** | `Ctrl + C` | `Cmd + C` | 复制当前选中的组件到剪贴板 |
| **粘贴** | `Ctrl + V` | `Cmd + V` | 从剪贴板粘贴组件到画布 |

### 快捷键信息获取

系统提供了 `getKeyboardShortcutsInfo()` 函数，用于动态获取快捷键信息，支持跨平台显示：

```typescript
export const getKeyboardShortcutsInfo = (): KeyboardShortcutsInfo => {
  const modifierKeyLabel = getPrimaryModifierKeyLabel();
  const modifierKeyDisplay = getPrimaryModifierKeyDisplay();
  
  return {
    undo: {
      key: 'Z',
      display: `${modifierKeyDisplay} + Z`,
      keyLabel: `${modifierKeyLabel}Z`,
    },
    // ... 其他快捷键
  };
};
```
[useKeyboardShortcuts.ts:62-93](file:///g:/Remote/prompt%20program/React01/src/hooks/useKeyboardShortcuts.ts#L62-L93)

---

## 4. 焦点管理策略

### 4.1 输入元素检测

系统使用 `isInputElement()` 函数来检测当前焦点是否在输入元素上，以避免快捷键与输入框的默认行为冲突。

#### 检测逻辑

```typescript
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
```
[useKeyboardShortcuts.ts:43-56](file:///g:/Remote/prompt%20program/React01/src/hooks/useKeyboardShortcuts.ts#L43-L56)

#### 检测范围

1. **标准表单元素**：
   - `<input>` 元素
   - `<textarea>` 元素
   - `<select>` 元素

2. **可编辑元素**：
   - 设置了 `contentEditable="true"` 的元素

### 4.2 焦点冲突处理

当焦点在输入元素上时，系统会智能地跳过某些快捷键：

| 快捷键类型 | 输入元素中的行为 |
|-----------|------------------|
| **撤销/重做** (Z/Y) | 完全跳过，不触发自定义逻辑 |
| **删除** (Delete/Backspace) | 完全跳过，允许输入框的默认删除行为 |
| **复制/粘贴** (C/V) | 跳过自定义逻辑，使用浏览器默认行为 |

#### 实现代码

```typescript
if (isInputElement(activeElement)) {
  if ((key === 'z' || key === 'y') && primaryModifierPressed) {
    logger.debug('快捷键被跳过：焦点在输入元素上');
    return;
  }
  
  if (key === 'delete' || key === 'backspace') {
    return;
  }
  
  if ((key === 'c' || key === 'v') && primaryModifierPressed) {
    logger.debug('复制/粘贴：焦点在输入元素上，使用浏览器默认行为');
    return;
  }
}
```
[useKeyboardShortcuts.ts:119-133](file:///g:/Remote/prompt%20program/React01/src/hooks/useKeyboardShortcuts.ts#L119-L133)

### 4.3 路由隔离

快捷键系统只在编辑器路由下生效：

```typescript
export const isBuilderRoute = (pathname: string): boolean => {
  return pathname === '/builder' || pathname.startsWith('/builder/');
};
```
[useKeyboardShortcuts.ts:58-60](file:///g:/Remote/prompt%20program/React01/src/hooks/useKeyboardShortcuts.ts#L58-L60)

- **生效路由**：`/builder` 和 `/builder/*`
- **失效路由**：`/preview`、`/projects` 等其他路由

---

## 5. 跨平台兼容策略

### 5.1 平台检测

系统使用 `src/utils/platform.ts` 中的工具函数进行平台检测：

#### 检测函数

```typescript
export const isMac = (): boolean => {
  if (isMacCache !== undefined) {
    return isMacCache;
  }
  
  if (typeof navigator === 'undefined') {
    isMacCache = false;
    return isMacCache;
  }
  
  isMacCache = navigator.platform.toUpperCase().indexOf('MAC') >= 0 ||
    navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
  
  return isMacCache;
};

export const isApplePlatform = (): boolean => {
  return isMac() || isIOS();
};
```
[platform.ts:4-37](file:///g:/Remote/prompt%20program/React01/src/utils/platform.ts#L4-L37)

#### 缓存机制

- **性能优化**：平台检测结果会被缓存，避免重复检测
- **SSR 兼容**：检测 `navigator` 是否存在，兼容服务端渲染环境

### 5.2 修饰键映射

| 平台 | 主修饰键 | 事件属性 |
|------|---------|---------|
| **Mac / iOS** | Command (⌘) | `event.metaKey` |
| **Windows / Linux** | Control (Ctrl) | `event.ctrlKey` |

#### 检测实现

```typescript
export const isPrimaryModifierKey = (event: KeyboardEvent): boolean => {
  return isApplePlatform() ? event.metaKey : event.ctrlKey;
};
```
[platform.ts:47-49](file:///g:/Remote/prompt%20program/React01/src/utils/platform.ts#L47-L49)

### 5.3 显示格式

系统提供了两种显示格式，用于不同的 UI 场景：

#### 符号格式（用于紧凑显示）

```typescript
export const getPrimaryModifierKeyLabel = (): string => {
  return isApplePlatform() ? '⌘' : 'Ctrl';
};
```
[platform.ts:39-41](file:///g:/Remote/prompt%20program/React01/src/utils/platform.ts#L39-L41)

- Mac: `⌘`
- Windows: `Ctrl`

#### 文本格式（用于详细说明）

```typescript
export const getPrimaryModifierKeyDisplay = (): string => {
  return isApplePlatform() ? 'Cmd' : 'Ctrl';
};
```
[platform.ts:43-45](file:///g:/Remote/prompt%20program/React01/src/utils/platform.ts#L43-L45)

- Mac: `Cmd`
- Windows: `Ctrl`

---

## 6. 快捷键与 Store 操作的集成

### 6.1 集成方式

快捷键系统通过回调函数与 Store 操作集成，实现了良好的解耦：

#### Hook 调用示例

```typescript
// 在 App.tsx 中
useKeyboardShortcuts({
  onUndo: undo,
  onRedo: redo,
  onDelete: handleDelete,
  onCopy: handleCopy,
  onPaste: handlePaste,
  enabled: true,
});
```
[App.tsx:93-100](file:///g:/Remote/prompt%20program/React01/src/App.tsx#L93-L100)

#### 回调函数定义

```typescript
const handleDelete = useCallback(() => {
  if (selectedComponentId) {
    removeComponent(selectedComponentId);
  }
}, [selectedComponentId, removeComponent]);

const handleCopy = useCallback(async () => {
  if (!selectedComponentId) return;
  
  const componentToCopy = findComponentById(components, selectedComponentId);
  if (!componentToCopy) return;
  
  const success = await writeComponentToClipboard(componentToCopy);
  if (success) {
    toast.success(`已复制: ${componentToCopy.type}`);
  }
}, [selectedComponentId, components, toast]);
```
[App.tsx:59-79](file:///g:/Remote/prompt%20program/React01/src/App.tsx#L59-L79)

### 6.2 防止重复历史记录

#### 问题分析

当用户通过快捷键触发撤销/重做时，需要确保：
1. **撤销操作** 不会创建新的历史记录
2. **重做操作** 不会创建新的历史记录
3. 只有**修改操作**（添加、删除、更新组件）才会创建历史记录

#### Store 中的历史管理机制

**历史记录创建逻辑**：

```typescript
pushHistory: (previousComponents, nextComponents) => {
  const { history, currentIndex, selectedComponentId } = get();

  // 只保留当前索引之前的历史（丢弃未来的重做历史）
  const newHistory = history.slice(0, currentIndex + 1);

  const stateToSave: HistoryState = {
    components: structuredClone(previousComponents),
    selectedComponentId: selectedComponentId,
  };

  // 关键：只有当组件实际发生变化时才保存
  const shouldSave =
    JSON.stringify(previousComponents) !== JSON.stringify(nextComponents);

  if (!shouldSave) {
    return; // 没有变化，不创建历史记录
  }

  newHistory.push(stateToSave);

  // 限制历史记录长度
  if (newHistory.length > MAX_HISTORY_LENGTH) {
    newHistory.shift();
  }

  const newCurrentIndex = newHistory.length - 1;

  set(
    {
      history: newHistory,
      currentIndex: newCurrentIndex,
      canUndo: newCurrentIndex > 0,
      canRedo: newCurrentIndex < newHistory.length - 1,
    },
    false,
    'pushHistory'
  );
},
```
[useBuilderStore.ts:499-534](file:///g:/Remote/prompt%20program/React01/src/store/useBuilderStore.ts#L499-L534)

**撤销/重做实现**：

```typescript
undo: () => {
  const { history, currentIndex, canUndo } = get();

  if (!canUndo) return;

  // 只是移动索引，不创建新历史记录
  const newIndex = currentIndex - 1;
  const previousState = history[newIndex];
  const newComponents = structuredClone(previousState.components);
  
  // ... 恢复选中状态

  set(
    {
      components: newComponents,
      selectedComponentId: newSelectedComponentId,
      currentIndex: newIndex,
      canUndo: newIndex > 0,
      canRedo: newIndex < history.length - 1,
    },
    false,
    'undo' // 注意：这里没有调用 pushHistory
  );
},
```
[useBuilderStore.ts:536-564](file:///g:/Remote/prompt%20program/React01/src/store/useBuilderStore.ts#L536-L564)

#### 关键设计要点

| 操作类型 | 是否调用 pushHistory | 是否创建新历史记录 |
|---------|---------------------|-------------------|
| **修改操作** (addComponent, removeComponent, updateComponent) | ✅ 是 | ✅ 是 |
| **撤销操作** (undo) | ❌ 否 | ❌ 否 |
| **重做操作** (redo) | ❌ 否 | ❌ 否 |

#### 工作流程

1. **用户执行修改操作**（如添加组件）：
   - 调用 `addComponent()` → 内部调用 `pushHistory()`
   - `pushHistory()` 比较 `previousComponents` 和 `nextComponents`
   - 如果不同，创建新的历史记录条目

2. **用户按 Ctrl+Z 撤销**：
   - 快捷键触发 `onUndo` 回调 → 调用 `undo()`
   - `undo()` 只是将 `currentIndex` 减 1，恢复对应历史状态
   - **不调用** `pushHistory()`，不会创建新记录

3. **用户按 Ctrl+Y 重做**：
   - 快捷键触发 `onRedo` 回调 → 调用 `redo()`
   - `redo()` 只是将 `currentIndex` 加 1，恢复对应历史状态
   - **不调用** `pushHistory()`，不会创建新记录

#### 历史记录长度限制

```typescript
const MAX_HISTORY_LENGTH = 50;
```
[useBuilderStore.ts:16](file:///g:/Remote/prompt%20program/React01/src/store/useBuilderStore.ts#L16)

- 最多保存 50 条历史记录
- 超出限制时，最早的记录会被移除（FIFO）

---

## 7. 未来扩展指南

### 7.1 新增快捷键的步骤

假设我们要新增一个 **"全选"** 快捷键（`Ctrl+A` / `Cmd+A`），需要按照以下步骤修改：

#### 步骤 1：修改 Hook 接口定义

在 `src/hooks/useKeyboardShortcuts.ts` 中：

1. 更新 `KeyboardShortcutsProps` 接口，添加新的回调函数：
```typescript
interface KeyboardShortcutsProps {
  onUndo?: () => void;
  onRedo?: () => void;
  onDelete?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onSelectAll?: () => void; // 新增：全选回调
  enabled?: boolean;
}
```

2. 更新 `KeyboardShortcutsInfo` 接口，添加新的快捷键信息：
```typescript
interface KeyboardShortcutsInfo {
  // ... 现有的快捷键
  selectAll: {
    key: string;
    display: string;
    keyLabel: string;
  };
}
```

3. 更新 `getKeyboardShortcutsInfo()` 函数：
```typescript
export const getKeyboardShortcutsInfo = (): KeyboardShortcutsInfo => {
  const modifierKeyLabel = getPrimaryModifierKeyLabel();
  const modifierKeyDisplay = getPrimaryModifierKeyDisplay();
  
  return {
    // ... 现有的快捷键
    selectAll: {
      key: 'A',
      display: `${modifierKeyDisplay} + A`,
      keyLabel: `${modifierKeyLabel}A`,
    },
  };
};
```

#### 步骤 2：添加按键检测逻辑

在 `handleKeyDown` 函数中添加新的快捷键处理：

```typescript
export const useKeyboardShortcuts = ({
  onUndo,
  onRedo,
  onDelete,
  onCopy,
  onPaste,
  onSelectAll, // 新增参数
  enabled = true,
}: KeyboardShortcutsProps = {}) => {
  // ...
  
  const handleKeyDown = useCallback(
    async (event: KeyboardEvent) => {
      // ... 现有的检查逻辑
      
      // 新增：全选快捷键
      if (primaryModifierPressed && key === 'a' && !shiftPressed) {
        if (onSelectAll) {
          event.preventDefault();
          logger.debug('快捷键触发：全选');
          onSelectAll();
        }
        return;
      }
      
      // ... 现有的快捷键处理
    },
    // 更新依赖项
    [enabled, location.pathname, onUndo, onRedo, onDelete, onCopy, onPaste, onSelectAll]
  );
  
  // ...
};
```

#### 步骤 3：在调用处传递回调

在 `src/App.tsx` 中添加全选的实现逻辑：

```typescript
function AppContent() {
  // ... 现有的 state
  const components = useBuilderStore((state) => state.components);
  const setSelectedComponentId = useBuilderStore((state) => state.setSelectedComponentId);
  
  // 新增：全选所有组件
  const handleSelectAll = useCallback(() => {
    // 示例：选择画布上的第一个组件
    // 实际实现可能需要选择所有组件或有其他逻辑
    if (components.length > 0) {
      setSelectedComponentId(components[0].id);
    }
  }, [components, setSelectedComponentId]);
  
  // 更新 Hook 调用
  useKeyboardShortcuts({
    onUndo: undo,
    onRedo: redo,
    onDelete: handleDelete,
    onCopy: handleCopy,
    onPaste: handlePaste,
    onSelectAll: handleSelectAll, // 新增
    enabled: true,
  });
  
  // ...
}
```

#### 步骤 4：添加测试用例

在 `src/hooks/useKeyboardShortcuts.test.ts` 中添加测试：

```typescript
runner.test('快捷键: 全选功能测试', () => {
  let selectAllCalled = false;
  
  const mockSelectAll = () => {
    selectAllCalled = true;
  };
  
  const activeElement = document.createElement('div');
  const pathname = '/builder';
  
  if (isBuilderRoute(pathname) && !isInputElement(activeElement)) {
    mockSelectAll();
  }
  
  assert(selectAllCalled === true, '全选应该被调用');
});
```

### 7.2 需要修改的文件清单

| 文件路径 | 修改内容 | 必要性 |
|---------|---------|--------|
| `src/hooks/useKeyboardShortcuts.ts` | 添加接口定义、快捷键检测、回调参数 | **必须** |
| `src/App.tsx` | 实现回调函数并传递给 Hook | **必须** |
| `src/hooks/useKeyboardShortcuts.test.ts` | 添加测试用例 | **建议** |
| `src/utils/platform.ts` | （通常不需要修改，除非需要新的平台检测） | 可选 |

### 7.3 设计原则

在新增快捷键时，请遵循以下原则：

1. **跨平台一致性**：
   - 使用 `isPrimaryModifierKey()` 检测主修饰键
   - 使用 `getPrimaryModifierKeyLabel()` 和 `getPrimaryModifierKeyDisplay()` 获取显示文本

2. **焦点安全**：
   - 考虑快捷键在输入元素中的行为
   - 如果是与文本编辑相关的快捷键（如全选），可能需要在输入元素中跳过

3. **事件阻止**：
   - 使用 `event.preventDefault()` 阻止浏览器默认行为（如果需要）
   - 例如：`Ctrl+A` 的默认行为是全选页面文本，可能需要阻止

4. **日志记录**：
   - 使用 `logger.debug()` 记录快捷键触发，便于调试

5. **依赖项管理**：
   - 确保新的回调函数添加到 `useCallback` 的依赖数组中
   - 确保 `handleKeyDown` 的依赖数组包含所有回调

---

## 8. 架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                        键盘快捷键系统架构                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐                                                    │
│  │   用户输入    │                                                    │
│  │  (键盘事件)   │                                                    │
│  └──────┬───────┘                                                    │
│         │                                                            │
│         ▼                                                            │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              useKeyboardShortcuts Hook                         │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │ 1. 路由检查 (isBuilderRoute)                            │  │  │
│  │  │    - 只在 /builder 路由下生效                            │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │ 2. 焦点检查 (isInputElement)                            │  │  │
│  │  │    - 检测 input/textarea/select/contentEditable         │  │  │
│  │  │    - 在输入元素中跳过特定快捷键                           │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │ 3. 平台检测 (platform utils)                             │  │  │
│  │  │    - isApplePlatform() → 区分 Mac/Windows               │  │  │
│  │  │    - isPrimaryModifierKey() → metaKey/ctrlKey           │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │ 4. 快捷键匹配                                             │  │  │
│  │  │    - Z/Y → 撤销/重做                                      │  │  │
│  │  │    - Delete/Backspace → 删除                             │  │  │
│  │  │    - C/V → 复制/粘贴                                      │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│         │                                                            │
│         ▼                                                            │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                      回调函数执行                               │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ ┌──────┐│  │
│  │  │ onUndo   │ │ onRedo   │ │ onDelete │ │ onCopy │ │onPaste││  │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └───┬────┘ └──┬───┘│  │
│  └───────┼─────────────┼─────────────┼────────────┼─────────┼────┘  │
│          │             │             │            │         │       │
│          ▼             ▼             ▼            ▼         ▼       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   useBuilderStore (Zustand)                   │   │
│  │  ┌────────────────────────────────────────────────────────┐  │   │
│  │  │ 历史管理系统                                              │  │   │
│  │  │  - pushHistory() → 仅在修改时创建记录                    │  │   │
│  │  │  - undo() / redo() → 仅移动索引，不创建记录              │  │   │
│  │  │  - MAX_HISTORY_LENGTH = 50                              │  │   │
│  │  └────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 9. 相关文件

| 文件路径 | 描述 |
|---------|------|
| `src/hooks/useKeyboardShortcuts.ts` | 核心快捷键 Hook 实现 |
| `src/hooks/useKeyboardShortcuts.test.ts` | 快捷键系统测试用例 |
| `src/utils/platform.ts` | 平台检测和修饰键工具函数 |
| `src/store/useBuilderStore.ts` | 状态管理和历史记录系统 |
| `src/App.tsx` | Hook 调用和回调函数实现 |
| `docs/键盘快捷键功能自测文档.md` | 功能测试文档 |

---

## 10. 总结

本快捷键系统具有以下设计特点：

1. **模块化设计**：通过自定义 Hook 实现，易于维护和扩展
2. **跨平台兼容**：自动检测平台，正确映射 Command 和 Control 键
3. **智能焦点管理**：在输入元素中自动跳过冲突快捷键
4. **路由隔离**：只在编辑器页面生效，不影响其他页面
5. **安全的历史记录**：撤销/重做操作不会创建重复的历史记录
6. **易于扩展**：清晰的接口设计，新增快捷键只需修改少量文件

该系统为用户提供了流畅的快捷键体验，同时保持了代码的可维护性和可扩展性。
