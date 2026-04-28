# 诊断 3：检查实际的坐标计算过程

## 问题背景

组件总是被放置在 (32, 32) 或 (0, 0)，而不是拖拽的实际位置。需要详细检查每一步的计算过程。

## 诊断目的

打印坐标计算的每一步结果，找出为什么最终结果总是 (0, 0) 或 (32, 32)。

## 实际诊断结果（2026-04-28）

### 控制台日志输出

```
=== 【诊断 3】坐标计算详细步骤 ===
输入参数:
  clientX: 0
  clientY: 0
  rect.left: 256
  rect.top: 81
  rect.width: 615
  rect.height: 600
  scrollLeft: 0
  scrollTop: 0

计算步骤 1 - 相对坐标:
  clientX - rect.left = 0 - 256 = -256
  + scrollLeft = -256 + 0 = -256
  relativeX: -256
  relativeY: -81

计算步骤 2 - 边界限制:
  maxX = rect.width - COMPONENT_MIN_SIZE.WIDTH = 615 - 16 = 599
  maxY = rect.height - COMPONENT_MIN_SIZE.HEIGHT = 600 - 16 = 584
  clamp 参数: relativeX = -256 , min = 0, maxX = 599
  clamp 参数: relativeY = -81 , min = 0, maxY = 584
  clamp 后 x: 0
  clamp 后 y: 0

计算步骤 3 - 网格对齐:
  GRID_SIZE: 16
  snapToGrid(x) = Math.round( 0 / 16 ) * 16
  = Math.round( 0 ) * 16
  = 0 * 16
  snapToGrid 后 snappedX: 0
  snapToGrid 后 snappedY: 0

=== 【诊断 3】最终结果 ===
返回坐标: {x: 0, y: 0}
```

### 坐标计算流程图

```
┌─────────────────────────────────────────────────────────────────┐
│                    坐标计算流程（错误路径）                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  第 1 层: 事件层                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐       │
│  │ DragEndEvent│    │ DragMoveEvent│    │ DragOverEvent│       │
│  │  .point     │    │  .point      │    │  .point      │       │
│  │  = undefined│───▶│  = ???       │───▶│  = ???       │       │
│  └─────────────┘    └─────────────┘    └─────────────┘       │
│         │                   │                   │                │
│         ▼                   ▼                   ▼                │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐       │
│  │ lastMouse   │    │ lastMouse   │    │ 未更新      │       │
│  │ PositionRef │───▶│ PositionRef │    │             │       │
│  │ 保持初始值  │    │ 保持初始值  │    │             │       │
│  │ {x:0, y:0}  │    │ {x:0, y:0}  │    │             │       │
│  └─────────────┘    └─────────────┘    └─────────────┘       │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  第 2 层: 计算层                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ 输入参数:                                                 │  │
│  │   clientX = 0  (来自 lastMousePositionRef.current.x)    │  │
│  │   clientY = 0  (来自 lastMousePositionRef.current.y)    │  │
│  │   rect.left = 256  (画布在视口中的位置)                  │  │
│  │   rect.top = 81    (画布在视口中的位置)                  │  │
│  └─────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ 计算步骤 1: 相对坐标                                       │  │
│  │   relativeX = clientX - rect.left + scrollLeft          │  │
│  │           = 0 - 256 + 0                                  │  │
│  │           = -256                                          │  │
│  │                                                           │  │
│  │   relativeY = clientY - rect.top + scrollTop            │  │
│  │           = 0 - 81 + 0                                   │  │
│  │           = -81                                           │  │
│  └─────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ 计算步骤 2: 边界限制 (clamp)                              │  │
│  │   maxX = rect.width - COMPONENT_MIN_SIZE.WIDTH          │  │
│  │        = 615 - 16 = 599                                  │  │
│  │                                                           │  │
│  │   x = clamp(relativeX, 0, maxX)                         │  │
│  │     = clamp(-256, 0, 599)                               │  │
│  │     = 0  (因为 -256 < 0，被限制到最小值)                  │  │
│  │                                                           │  │
│  │   y = clamp(relativeY, 0, maxY)                         │  │
│  │     = clamp(-81, 0, 584)                                │  │
│  │     = 0  (因为 -81 < 0，被限制到最小值)                   │  │
│  └─────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ 计算步骤 3: 网格对齐 (snapToGrid)                         │  │
│  │   GRID_SIZE = 16                                          │  │
│  │                                                           │  │
│  │   snappedX = snapToGrid(x)                                │  │
│  │            = snapToGrid(0)                                │  │
│  │            = Math.round(0/16) * 16                       │  │
│  │            = 0 * 16                                       │  │
│  │            = 0                                            │  │
│  │                                                           │  │
│  │   snappedY = snapToGrid(y)                                │  │
│  │            = 0                                            │  │
│  └─────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ 最终结果: { x: 0, y: 0 }                                 │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 根本原因分析

### 问题链

| 层级 | 问题 | 根源 |
|------|------|------|
| **第 1 层** | `DragEndEvent.point` 是 `undefined` | DnD Kit 事件类型问题 |
| **第 2 层** | `lastMousePositionRef` 保持 `{ x: 0, y: 0 }` | `handleDragMove` 没有正确更新 |
| **第 3 层** | `clientX = 0`, `clientY = 0` | 使用了错误的坐标 |
| **第 4 层** | `relativeX = -256`, `relativeY = -81` | 计算出负数 |
| **第 5 层** | `clamp` 后变为 `(0, 0)` | 被限制到边界 |
| **第 6 层** | `snapToGrid(0) = 0` | 最终返回 `(0, 0)` |

### 关键问题

**问题 1：`event.point` 在多个事件中都是 `undefined`**

从日志来看：
- `handleDragEnd` 中的 `point` 是 `undefined`
- `lastMousePositionRef.current` 保持初始值 `{ x: 0, y: 0 }`

这说明：
1. `handleDragMove` 可能没有被调用
2. 或者 `handleDragMove` 中的 `point` 也是 `undefined`
3. 或者 `if (point)` 条件阻止了更新

**问题 2：`if (point)` 条件判断**

```typescript
const handleDragMove = useCallback((event: DragMoveEvent) => {
  const { over, point } = event;

  // ...

  if (point) {  // ⚠️ 如果 point 是 undefined，不会更新
    lastMousePositionRef.current = {
      x: point.x,
      y: point.y,
    };
  }
}, []);
```

如果 `point` 是 `undefined`，`lastMousePositionRef` 就不会被更新。

**问题 3：坐标类型不匹配**

即使 `event.point` 存在，也需要确认它的坐标类型：
- 是页面坐标（`clientX/clientY`）？
- 是相对于拖拽起点的偏移？
- 是相对于某个容器的坐标？

## 为什么用户看到的是 (32, 32) 而不是 (0, 0)

日志显示最终返回的是 `(0, 0)`：
```
✅ 从组件库添加新组件: Button button-01f2d1ab-e0d7-4992-97dc-f6c2b4e32441 位置: (0, 0)
```

但用户说组件被放置在 `(32, 32)`。可能的原因：

### 原因 1：画布内部的 padding

Canvas 组件的内部容器有 `p-2`（8px）的 padding：
```typescript
className={cn(
  'absolute inset-0 p-2',  // 8px padding
  isOver && 'bg-primary-50/30'
)}
```

但 8px padding 无法解释 32px 的偏移。

### 原因 2：不同测试场景

可能在不同的测试中：
- 有时 `canvasElement` 为 `null`，返回 `DEFAULT_POSITION = (32, 32)`
- 有时 `canvasElement` 存在，但坐标是 `(0, 0)`

### 原因 3：渲染时的 `??` 运算符

```typescript
const style: React.CSSProperties = {
  position: 'absolute',
  left: component.x ?? DEFAULT_POSITION.X,  // 0 ?? 32 = 0
  top: component.y ?? DEFAULT_POSITION.Y,   // 0 ?? 32 = 0
  // ...
};
```

`0 ?? 32 = 0`，所以这不是原因。

## 解决方案

### 方案 1：在所有拖拽事件中添加详细日志

确认哪些事件被调用，以及 `point` 的值：

```typescript
const handleDragStart = useCallback((event: DragStartEvent) => {
  const { active } = event;
  const activeIdStr = String(active.id);

  logger.log('=== handleDragStart ===');
  logger.log('event:', event);  // 打印整个事件对象
  logger.log('active.id:', activeIdStr);
  // ...
}, []);

const handleDragOver = useCallback((event: DragOverEvent) => {
  const { over, point } = event;

  logger.log('=== handleDragOver ===');
  logger.log('event:', event);  // 打印整个事件对象
  logger.log('over:', over ? String(over.id) : 'null');
  logger.log('point:', point);  // 检查 point 是否存在
  // ...
}, []);

const handleDragMove = useCallback((event: DragMoveEvent) => {
  const { over, point } = event;

  logger.log('=== handleDragMove ===');
  logger.log('event:', event);  // 打印整个事件对象
  logger.log('over:', over ? String(over.id) : 'null');
  logger.log('point:', point);  // 检查 point 是否存在

  // 即使 point 是 undefined，也要记录
  if (point) {
    lastMousePositionRef.current = {
      x: point.x,
      y: point.y,
    };
    logger.log('已更新 lastMousePositionRef:', lastMousePositionRef.current);
  } else {
    logger.warn('handleDragMove 中 point 是 undefined');
  }
}, []);

const handleDragEnd = useCallback(
  (event: DragEndEvent) => {
    const { active, over, point } = event;

    logger.log('=== handleDragEnd ===');
    logger.log('event:', event);  // 打印整个事件对象
    logger.log('point:', point);  // 检查 point 是否存在
    // ...
  },
  [addComponent, updateComponent]
);
```

### 方案 2：使用全局鼠标位置监听

不依赖 DnD Kit 的 `event.point`，而是自己监听鼠标位置：

```typescript
const globalMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

const handleGlobalPointerMove = useCallback((e: PointerEvent) => {
  globalMousePositionRef.current = { x: e.clientX, y: e.clientY };
}, []);

const handleDragStart = useCallback((event: DragStartEvent) => {
  // ... 现有代码 ...
  window.addEventListener('pointermove', handleGlobalPointerMove);
  logger.log('已添加全局 pointermove 监听');
}, [handleGlobalPointerMove]);

const handleDragEnd = useCallback(
  (event: DragEndEvent) => {
    window.removeEventListener('pointermove', handleGlobalPointerMove);
    logger.log('已移除全局 pointermove 监听');
    
    // 使用全局鼠标位置作为最终备选
    const mouseX = point?.x ?? lastMousePositionRef.current.x ?? globalMousePositionRef.current.x;
    const mouseY = point?.y ?? lastMousePositionRef.current.y ?? globalMousePositionRef.current.y;
    
    logger.log('最终使用的坐标:', { mouseX, mouseY });
    logger.log('  - 来自 event.point:', point?.x ?? 'N/A', point?.y ?? 'N/A');
    logger.log('  - 来自 lastMousePositionRef:', lastMousePositionRef.current.x, lastMousePositionRef.current.y);
    logger.log('  - 来自 globalMousePositionRef:', globalMousePositionRef.current.x, globalMousePositionRef.current.y);
    
    // ...
  },
  [addComponent, updateComponent, handleGlobalPointerMove]
);
```

### 方案 3：检查 DnD Kit 事件类型

查阅 DnD Kit 文档，确认各个事件的 `point` 属性：

| 事件类型 | 是否包含 `point` | 说明 |
|----------|------------------|------|
| `DragStartEvent` | ? | 拖拽开始 |
| `DragMoveEvent` | ? | 拖拽移动 |
| `DragOverEvent` | ? | 拖拽悬停 |
| `DragEndEvent` | ? | 拖拽结束 |

可能需要使用其他方式获取坐标，比如：
- `@dnd-kit/modifiers` 中的坐标转换
- `useSensor` 的配置
- 自定义 modifier

### 方案 4：在 `handleDragOver` 中更新位置

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
  logger.log('point:', point);  // 检查 point 是否存在

  if (!over) {
    isOverDropZoneRef.current = false;
    return;
  }

  const overIdStr = String(over.id);
  const isOverCanvasArea = isOverCanvas(overIdStr);
  isOverDropZoneRef.current = isOverCanvasArea;

  // 如果 point 存在，更新位置
  if (point) {
    lastMousePositionRef.current = {
      x: point.x,
      y: point.y,
    };
    logger.log('handleDragOver 已更新 lastMousePositionRef:', lastMousePositionRef.current);
  }
}, []);
```

## 下一步行动

### 立即执行

1. **在 `handleDragMove` 和 `handleDragOver` 中添加详细日志**
   - 确认这些事件是否被调用
   - 确认 `point` 属性是否存在
   - 确认 `point` 的值

2. **实现全局鼠标位置监听**
   - 作为不依赖 DnD Kit `event.point` 的备选方案

3. **测试修复效果**
   - 拖拽组件到画布
   - 观察日志输出
   - 确认组件是否被放置在正确位置

### 长期优化

1. **查阅 DnD Kit 官方文档**
   - 确认各个事件的 `point` 属性行为
   - 查找推荐的坐标获取方式

2. **考虑使用 `@dnd-kit/modifiers`**
   - `pointerCoordinates` modifier
   - 自定义坐标转换

3. **添加更健壮的错误处理**
   - 多层备选坐标获取
   - 详细的日志记录
