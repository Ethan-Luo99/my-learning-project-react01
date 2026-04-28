# 诊断 1：检查 event.point 的坐标值

## 问题背景

尽管已经添加了备用查找机制和 ref 同步优化，但拖拽组件仍然被放置在画布左上角（32, 32）。

已知信息：
- `canvasRef.current` 已正确设置（控制台有日志）
- 备用查找机制已添加
- 组件仍然被放置在左上角

## 诊断目的

确认 DnD Kit 提供的 `event.point` 坐标值是什么，以及 `lastMousePositionRef` 的值。

## 实际诊断结果（2026-04-28）

### 控制台日志输出

```
=== 【诊断 1】handleDragEnd 详细诊断 ===
event.point: undefined
point?.x: undefined
point?.y: undefined
lastMousePositionRef.current: {x: 0, y: 0}
active.id: panel-Button
over: canvas-drop-zone
isOverDropZoneRef.current: true
【诊断 1】最终使用的鼠标坐标 (mouseX, mouseY): 0 0
```

### 发现的问题

| 检查项 | 实际值 | 结论 |
|--------|--------|------|
| `event.point` | `undefined` | ❌ **根本原因** |
| `point?.x` | `undefined` | ❌ 坐标丢失 |
| `point?.y` | `undefined` | ❌ 坐标丢失 |
| `lastMousePositionRef.current` | `{x: 0, y: 0}` | ❌ 未被更新 |
| 最终使用的坐标 | `(0, 0)` | ❌ 错误 |

### 问题分析

**问题 1：`handleDragEnd` 中的 `event.point` 是 `undefined`**
- DnD Kit 的 `DragEndEvent` 可能不包含 `point` 属性
- 或者在某些情况下 `point` 为 `undefined`

**问题 2：`lastMousePositionRef.current` 保持初始值 `{ x: 0, y: 0 }`**
- `lastMousePositionRef` 的初始值是 `{ x: 0, y: 0 }`
- 说明 `handleDragMove` 没有正确更新这个值

**问题 3：`handleDragMove` 可能没有被调用或 `point` 也是 `undefined`**
- 日志中没有看到 `handleDragMove` 的输出
- 或者 `DragMoveEvent` 中的 `point` 也是 `undefined`

## 相关代码

### 当前的坐标获取逻辑

```typescript
const handleDragEnd = useCallback(
  (event: DragEndEvent) => {
    const { active, over, point } = event;

    // ⚠️ 问题：point 可能是 undefined
    const mouseX = point?.x ?? lastMousePositionRef.current.x;
    const mouseY = point?.y ?? lastMousePositionRef.current.y;
    
    // ...
  },
  [addComponent, updateComponent]
);
```

### handleDragMove 函数

```typescript
const handleDragMove = useCallback((event: DragMoveEvent) => {
  const { over, point } = event;

  if (over) {
    const overIdStr = String(over.id);
    const isOverCanvasArea = isOverCanvas(overIdStr);
    isOverDropZoneRef.current = isOverCanvasArea;
  }

  // ⚠️ 问题：如果 point 是 undefined，就不会更新
  if (point) {
    lastMousePositionRef.current = {
      x: point.x,
      y: point.y,
    };
  }
}, []);
```

## 根本原因总结

1. **`DragEndEvent.point` 是 `undefined`**
   - DnD Kit 的 `DragEndEvent` 可能不总是包含 `point` 属性
   - 需要查阅 DnD Kit 文档确认

2. **`lastMousePositionRef` 没有被正确更新**
   - `handleDragMove` 中的 `if (point)` 条件判断
   - 如果 `DragMoveEvent.point` 也是 `undefined`，就不会更新

3. **最终使用了错误的坐标 `(0, 0)`**
   - `mouseX = point?.x ?? 0 = 0`
   - `mouseY = point?.y ?? 0 = 0`

## 解决方案

### 方案 1：检查 DnD Kit 事件类型

查阅 DnD Kit 文档，确认：
- `DragEndEvent` 是否包含 `point` 属性
- `DragMoveEvent` 是否包含 `point` 属性
- 正确的坐标获取方式是什么

### 方案 2：使用 `pointermove` 事件监听鼠标位置

在 `handleDragStart` 时添加全局鼠标位置监听，在 `handleDragEnd` 时移除：

```typescript
const mousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

const handlePointerMove = useCallback((e: PointerEvent) => {
  mousePositionRef.current = { x: e.clientX, y: e.clientY };
}, []);

const handleDragStart = useCallback((event: DragStartEvent) => {
  // ... 现有代码 ...
  window.addEventListener('pointermove', handlePointerMove);
}, [handlePointerMove]);

const handleDragEnd = useCallback(
  (event: DragEndEvent) => {
    window.removeEventListener('pointermove', handlePointerMove);
    // 使用 mousePositionRef.current 作为备选
    const mouseX = point?.x ?? lastMousePositionRef.current.x ?? mousePositionRef.current.x;
    const mouseY = point?.y ?? lastMousePositionRef.current.y ?? mousePositionRef.current.y;
    // ...
  },
  [addComponent, updateComponent, handlePointerMove]
);
```

### 方案 3：使用 `@dnd-kit/modifiers` 中的坐标

DnD Kit 可能通过其他方式提供坐标，比如：
- `useSensor` 的配置
- `modifiers` 中的坐标转换

### 方案 4：在 `handleDragOver` 中更新位置

日志显示 `handleDragOver` 被调用了：
```
=== handleDragOver ===
over: canvas-drop-zone
isOverCanvas: true
```

可以在 `handleDragOver` 中添加坐标更新逻辑。

## 下一步

1. 查阅 DnD Kit 官方文档，确认 `DragEndEvent` 和 `DragMoveEvent` 的接口定义
2. 在 `handleDragMove` 中添加日志，确认是否被调用
3. 实现备用的鼠标位置监听方案
