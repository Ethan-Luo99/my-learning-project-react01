# 诊断 2：检查画布的 getBoundingClientRect()

## 问题背景

即使 `canvasRef.current` 已正确设置，拖拽组件仍然被放置在画布左上角（32, 32）。

## 诊断目的

确认 `getBoundingClientRect()` 返回的画布位置和尺寸是否正确，以及坐标计算是否考虑了正确的边界。

## 实际诊断结果（2026-04-28）

### 控制台日志输出

```
=== 【诊断 2】getCanvasRelativePosition 诊断 ===
传入的坐标 (clientX, clientY): 0 0
【诊断 2】画布 rect 完整信息: {top: 81, left: 256, right: 871, bottom: 681, width: 615, …}
window.scrollX: 0
window.scrollY: 0
画布滚动位置 (scrollLeft, scrollTop): 0 0
```

### 发现的问题

| 检查项 | 实际值 | 结论 |
|--------|--------|------|
| `clientX` | `0` | ❌ **错误**（应该是几百） |
| `clientY` | `0` | ❌ **错误**（应该是几百） |
| `rect.top` | `81` | ✅ 正常（Header 高度约 80px） |
| `rect.left` | `256` | ✅ 正常（左侧面板宽度） |
| `rect.width` | `615` | ✅ 正常 |
| `rect.height` | `600` | ✅ 正常 |
| `window.scrollX/Y` | `0` | ✅ 正常 |
| `scrollLeft/Top` | `0` | ✅ 正常 |

### 问题分析

**画布的 `rect` 信息是正确的：**
- `rect.top = 81`：画布在视口顶部下方 81px（Header 高度）
- `rect.left = 256`：画布在视口左侧 256px（左侧面板宽度）
- `rect.width = 615`：画布宽度正常
- `rect.height = 600`：画布高度正常

**真正的问题是传入的坐标：**
- `clientX = 0`
- `clientY = 0`

这是因为：
1. `handleDragEnd` 中的 `event.point` 是 `undefined`
2. `lastMousePositionRef.current` 保持初始值 `{ x: 0, y: 0 }`
3. 所以 `mouseX = 0`，`mouseY = 0`

## 坐标计算过程（基于日志）

### 输入参数
```
clientX: 0
clientY: 0
rect.left: 256
rect.top: 81
rect.width: 615
rect.height: 600
scrollLeft: 0
scrollTop: 0
```

### 计算步骤 1 - 相对坐标
```typescript
const relativeX = clientX - rect.left + scrollLeft;
const relativeY = clientY - rect.top + scrollTop;
```

计算结果：
```
relativeX = 0 - 256 + 0 = -256
relativeY = 0 - 81 + 0 = -81
```

### 计算步骤 2 - 边界限制
```typescript
const maxX = rect.width - COMPONENT_MIN_SIZE.WIDTH = 615 - 16 = 599
const maxY = rect.height - COMPONENT_MIN_SIZE.HEIGHT = 600 - 16 = 584

const x = clamp(relativeX, 0, maxX) = clamp(-256, 0, 599) = 0
const y = clamp(relativeY, 0, maxY) = clamp(-81, 0, 584) = 0
```

### 计算步骤 3 - 网格对齐
```typescript
const snappedX = snapToGrid(x) = snapToGrid(0) = 0
const snappedY = snapToGrid(y) = snapToGrid(0) = 0
```

### 最终结果
```
返回坐标: {x: 0, y: 0}
```

## 根本原因总结

| 层级 | 问题 | 结果 |
|------|------|------|
| 第 1 层 | `DragEndEvent.point` 是 `undefined` | 使用 `lastMousePositionRef` |
| 第 2 层 | `lastMousePositionRef` 未被更新 | 使用初始值 `{ x: 0, y: 0 }` |
| 第 3 层 | `clientX = 0, clientY = 0` | 传入错误的坐标 |
| 第 4 层 | `relativeX = -256, relativeY = -81` | 计算出负数 |
| 第 5 层 | `clamp` 后变为 `(0, 0)` | 被限制到边界 |
| 第 6 层 | `snapToGrid(0) = 0` | 最终返回 `(0, 0)` |

## 为什么用户看到的是 (32, 32) 而不是 (0, 0)

日志显示最终返回的是 `(0, 0)`：
```
✅ 从组件库添加新组件: Button button-01f2d1ab-e0d7-4992-97dc-f6c2b4e32441 位置: (0, 0)
```

但用户说组件被放置在 `(32, 32)`。可能的原因：

### 原因 1：`createComponentFromType` 中的 `snapToGrid`

```typescript
const createComponentFromType = (type: string, x: number = DEFAULT_POSITION.X, y: number = DEFAULT_POSITION.Y): ComponentSchema => {
  // ...
  x: snapToGrid(x),  // snapToGrid(0) = 0
  y: snapToGrid(y),  // snapToGrid(0) = 0
  // ...
};
```

`snapToGrid(0) = 0`，所以这不是原因。

### 原因 2：渲染时的偏移

可能在 `FreeCanvasItem` 组件中有额外的偏移：

```typescript
const style: React.CSSProperties = {
  position: 'absolute',
  left: component.x ?? DEFAULT_POSITION.X,  // 如果 x 是 0，用 0
  top: component.y ?? DEFAULT_POSITION.Y,   // 如果 y 是 0，用 0
  // ...
};
```

但 `0 ?? 32 = 0`，所以这也不是原因。

### 原因 3：画布的 padding

从 Canvas 的样式来看：
```typescript
className={cn(
  'absolute inset-0 p-2',  // p-2 = 8px padding
  isOver && 'bg-primary-50/30'
)}
```

画布内部有 `p-2`（8px）的 padding，这可能导致视觉上的偏移。

### 原因 4：多次测试的混淆

用户可能在不同的测试中看到了不同的结果：
- 有时返回 `(0, 0)`
- 有时返回 `(32, 32)`（当 `DEFAULT_POSITION` 被使用时）

需要进一步确认。

## 解决方案

### 核心问题

**`event.point` 在 `DragEndEvent` 中是 `undefined`**，需要找到正确的坐标获取方式。

### 方案 1：使用全局鼠标位置监听

在拖拽开始时添加 `pointermove` 事件监听，实时记录鼠标位置：

```typescript
const globalMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

const handleGlobalPointerMove = useCallback((e: PointerEvent) => {
  globalMousePositionRef.current = { x: e.clientX, y: e.clientY };
}, []);

const handleDragStart = useCallback((event: DragStartEvent) => {
  // ... 现有代码 ...
  window.addEventListener('pointermove', handleGlobalPointerMove);
}, [handleGlobalPointerMove]);

const handleDragEnd = useCallback(
  (event: DragEndEvent) => {
    window.removeEventListener('pointermove', handleGlobalPointerMove);
    
    // 使用全局鼠标位置作为最终备选
    const mouseX = point?.x ?? lastMousePositionRef.current.x ?? globalMousePositionRef.current.x;
    const mouseY = point?.y ?? lastMousePositionRef.current.y ?? globalMousePositionRef.current.y;
    
    // ...
  },
  [addComponent, updateComponent, handleGlobalPointerMove]
);
```

### 方案 2：检查 `handleDragMove` 是否被调用

在 `handleDragMove` 中添加日志，确认是否被调用：

```typescript
const handleDragMove = useCallback((event: DragMoveEvent) => {
  const { over, point } = event;

  logger.log('=== handleDragMove 被调用 ===');
  logger.log('point:', point);
  logger.log('over:', over ? String(over.id) : 'null');

  if (over) {
    const overIdStr = String(over.id);
    const isOverCanvasArea = isOverCanvas(overIdStr);
    isOverDropZoneRef.current = isOverCanvasArea;
  }

  // 移除 if (point) 条件，即使 point 是 undefined 也要记录
  logger.log('handleDragMove 中的 point:', point);
  if (point) {
    lastMousePositionRef.current = {
      x: point.x,
      y: point.y,
    };
    logger.log('已更新 lastMousePositionRef:', lastMousePositionRef.current);
  }
}, []);
```

### 方案 3：使用 `handleDragOver` 更新位置

日志显示 `handleDragOver` 被调用了：
```
=== handleDragOver ===
over: canvas-drop-zone
isOverCanvas: true
```

可以在 `handleDragOver` 中添加坐标更新逻辑：

```typescript
const handleDragOver = useCallback((event: DragOverEvent) => {
  const { over, point } = event;

  logger.log('=== handleDragOver ===');
  logger.log('over:', over ? String(over.id) : 'null');
  logger.log('point:', point);  // 检查 point 是否存在

  if (!over) {
    isOverDropZoneRef.current = false;
    return;
  }

  const overIdStr = String(over.id);
  const isOverCanvasArea = isOverCanvas(overIdStr);
  logger.log('isOverCanvas:', isOverCanvasArea);

  isOverDropZoneRef.current = isOverCanvasArea;

  // 如果 point 存在，更新位置
  if (point) {
    lastMousePositionRef.current = {
      x: point.x,
      y: point.y,
    };
  }
}, []);
```

## 下一步

1. **在 `handleDragMove` 和 `handleDragOver` 中添加详细日志**，确认：
   - 这些事件是否被调用
   - `point` 属性是否存在
   - `point` 的值是什么

2. **实现全局鼠标位置监听**，作为最终备选方案

3. **测试修复效果**
