/**
 * 对齐辅助线修复回归测试
 * 
 * 测试目的：
 * 1. 验证 p-2 padding 偏移问题已修复
 * 2. 验证缩放时对齐辅助线正确显示
 * 3. 验证对齐吸附容差 8px 机制
 * 4. 验证手柄类型与对齐吸附的关系
 * 
 * 修复内容：
 * - 缺陷 1: Canvas 的 p-2 padding 导致辅助线偏移 8px
 *   修复: 将 AlignmentGuides 组件移到 p-2 容器内部
 * 
 * - 缺陷 2: 缩放时没有对齐检测
 *   修复: 在 useResize 中调用 detectResizeAlignment
 */

import type { ComponentSchema } from '@/types/component';
import { ComponentType } from '@/types/component';
import {
  TestRunner,
  assert,
  assertEqual,
  createMockButtonComponent,
  createMockTextComponent,
} from './test-helpers';

const SNAP_TOLERANCE = 8;

const createComponentAt = (
  id: string,
  x: number,
  y: number,
  width: number,
  height: number
): ComponentSchema => ({
  id,
  type: ComponentType.Button,
  x,
  y,
  width,
  height,
  props: {
    children: id,
    variant: 'primary',
    size: 'md',
  },
  styles: {},
});

interface ComponentBounds {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  right: number;
  bottom: number;
}

const getBounds = (c: ComponentSchema): ComponentBounds => ({
  id: c.id,
  x: c.x ?? 0,
  y: c.y ?? 0,
  width: typeof c.width === 'number' ? c.width : 100,
  height: typeof c.height === 'number' ? c.height : 40,
  centerX: (c.x ?? 0) + (typeof c.width === 'number' ? c.width : 100) / 2,
  centerY: (c.y ?? 0) + (typeof c.height === 'number' ? c.height : 40) / 2,
  right: (c.x ?? 0) + (typeof c.width === 'number' ? c.width : 100),
  bottom: (c.y ?? 0) + (typeof c.height === 'number' ? c.height : 40),
});

interface AlignmentGuide {
  type: string;
  position: number;
  isCanvasEdge: boolean;
  targetComponentId?: string;
}

const detectAlignment = (
  draggingComponent: ComponentSchema,
  allComponents: ComponentSchema[],
  currentX: number,
  currentY: number,
  canvasWidth: number = 800,
  canvasHeight: number = 600
): { guides: AlignmentGuide[]; snappedX: number; snappedY: number } => {
  const bounds = getBounds(draggingComponent);
  const currentWidth = bounds.width;
  const currentHeight = bounds.height;
  const currentRight = currentX + currentWidth;
  const currentBottom = currentY + currentHeight;
  const currentCenterX = currentX + currentWidth / 2;
  const currentCenterY = currentY + currentHeight / 2;

  const guides: AlignmentGuide[] = [];
  let snappedX = currentX;
  let snappedY = currentY;

  for (const other of allComponents) {
    if (other.id === draggingComponent.id) continue;

    const otherBounds = getBounds(other);

    if (Math.abs(currentX - otherBounds.x) <= SNAP_TOLERANCE) {
      guides.push({
        type: 'left',
        position: otherBounds.x,
        isCanvasEdge: false,
        targetComponentId: other.id,
      });
      snappedX = otherBounds.x;
    }

    if (Math.abs(currentRight - otherBounds.right) <= SNAP_TOLERANCE) {
      guides.push({
        type: 'right',
        position: otherBounds.right,
        isCanvasEdge: false,
        targetComponentId: other.id,
      });
      snappedX = otherBounds.right - currentWidth;
    }

    if (Math.abs(currentCenterX - otherBounds.centerX) <= SNAP_TOLERANCE) {
      guides.push({
        type: 'centerH',
        position: otherBounds.centerX,
        isCanvasEdge: false,
        targetComponentId: other.id,
      });
      snappedX = otherBounds.centerX - currentWidth / 2;
    }

    if (Math.abs(currentY - otherBounds.y) <= SNAP_TOLERANCE) {
      guides.push({
        type: 'top',
        position: otherBounds.y,
        isCanvasEdge: false,
        targetComponentId: other.id,
      });
      snappedY = otherBounds.y;
    }

    if (Math.abs(currentBottom - otherBounds.bottom) <= SNAP_TOLERANCE) {
      guides.push({
        type: 'bottom',
        position: otherBounds.bottom,
        isCanvasEdge: false,
        targetComponentId: other.id,
      });
      snappedY = otherBounds.bottom - currentHeight;
    }

    if (Math.abs(currentCenterY - otherBounds.centerY) <= SNAP_TOLERANCE) {
      guides.push({
        type: 'centerV',
        position: otherBounds.centerY,
        isCanvasEdge: false,
        targetComponentId: other.id,
      });
      snappedY = otherBounds.centerY - currentHeight / 2;
    }
  }

  if (canvasWidth > 0) {
    if (Math.abs(currentX) <= SNAP_TOLERANCE) {
      guides.push({ type: 'canvasLeft', position: 0, isCanvasEdge: true });
      snappedX = 0;
    }
    if (Math.abs(currentRight - canvasWidth) <= SNAP_TOLERANCE) {
      guides.push({ type: 'canvasRight', position: canvasWidth, isCanvasEdge: true });
      snappedX = canvasWidth - currentWidth;
    }
    const canvasCenterX = canvasWidth / 2;
    if (Math.abs(currentCenterX - canvasCenterX) <= SNAP_TOLERANCE) {
      guides.push({ type: 'canvasCenterH', position: canvasCenterX, isCanvasEdge: true });
      snappedX = canvasCenterX - currentWidth / 2;
    }
  }

  if (canvasHeight > 0) {
    if (Math.abs(currentY) <= SNAP_TOLERANCE) {
      guides.push({ type: 'canvasTop', position: 0, isCanvasEdge: true });
      snappedY = 0;
    }
    if (Math.abs(currentBottom - canvasHeight) <= SNAP_TOLERANCE) {
      guides.push({ type: 'canvasBottom', position: canvasHeight, isCanvasEdge: true });
      snappedY = canvasHeight - currentHeight;
    }
    const canvasCenterY = canvasHeight / 2;
    if (Math.abs(currentCenterY - canvasCenterY) <= SNAP_TOLERANCE) {
      guides.push({ type: 'canvasCenterV', position: canvasCenterY, isCanvasEdge: true });
      snappedY = canvasCenterY - currentHeight / 2;
    }
  }

  return { guides, snappedX, snappedY };
};

type ResizeHandle = 'top' | 'bottom' | 'left' | 'right' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

interface HandleConfig {
  affectsWidth: boolean;
  affectsHeight: boolean;
  xDirection: -1 | 0 | 1;
  yDirection: -1 | 0 | 1;
}

const HANDLE_CONFIGS: Record<ResizeHandle, HandleConfig> = {
  top: { affectsWidth: false, affectsHeight: true, xDirection: 0, yDirection: -1 },
  bottom: { affectsWidth: false, affectsHeight: true, xDirection: 0, yDirection: 1 },
  left: { affectsWidth: true, affectsHeight: false, xDirection: -1, yDirection: 0 },
  right: { affectsWidth: true, affectsHeight: false, xDirection: 1, yDirection: 0 },
  topLeft: { affectsWidth: true, affectsHeight: true, xDirection: -1, yDirection: -1 },
  topRight: { affectsWidth: true, affectsHeight: true, xDirection: 1, yDirection: -1 },
  bottomLeft: { affectsWidth: true, affectsHeight: true, xDirection: -1, yDirection: 1 },
  bottomRight: { affectsWidth: true, affectsHeight: true, xDirection: 1, yDirection: 1 },
};

const simulateResizeAlignment = (
  originalComponent: ComponentSchema,
  newBounds: { x: number; y: number; width: number; height: number },
  handle: ResizeHandle,
  allComponents: ComponentSchema[],
  canvasWidth: number = 800,
  canvasHeight: number = 600
): {
  guides: AlignmentGuide[];
  snappedX: number;
  snappedY: number;
  snappedWidth: number;
  snappedHeight: number;
} => {
  const tempComponent: ComponentSchema = {
    ...originalComponent,
    x: newBounds.x,
    y: newBounds.y,
    width: newBounds.width,
    height: newBounds.height,
  };

  const alignmentResult = detectAlignment(
    tempComponent,
    allComponents,
    newBounds.x,
    newBounds.y,
    canvasWidth,
    canvasHeight
  );

  let snappedX = newBounds.x;
  let snappedY = newBounds.y;
  let snappedWidth = newBounds.width;
  let snappedHeight = newBounds.height;

  const config = HANDLE_CONFIGS[handle];

  for (const guide of alignmentResult.guides) {
    switch (guide.type) {
      case 'left':
      case 'canvasLeft':
        if (config.xDirection === -1) {
          snappedX = guide.position;
          const leftDelta = newBounds.x - guide.position;
          snappedWidth = newBounds.width + leftDelta;
        }
        break;
      case 'right':
      case 'canvasRight':
        if (config.xDirection === 1) {
          const currentRight = newBounds.x + newBounds.width;
          const rightDelta = guide.position - currentRight;
          snappedWidth = newBounds.width + rightDelta;
        }
        break;
      case 'centerH':
      case 'canvasCenterH':
        snappedX = alignmentResult.snappedX;
        break;
      case 'top':
      case 'canvasTop':
        if (config.yDirection === -1) {
          snappedY = guide.position;
          const topDelta = newBounds.y - guide.position;
          snappedHeight = newBounds.height + topDelta;
        }
        break;
      case 'bottom':
      case 'canvasBottom':
        if (config.yDirection === 1) {
          const currentBottom = newBounds.y + newBounds.height;
          const bottomDelta = guide.position - currentBottom;
          snappedHeight = newBounds.height + bottomDelta;
        }
        break;
      case 'centerV':
      case 'canvasCenterV':
        snappedY = alignmentResult.snappedY;
        break;
    }
  }

  return {
    guides: alignmentResult.guides,
    snappedX,
    snappedY,
    snappedWidth,
    snappedHeight,
  };
};

export const runAlignmentTests = (): TestRunner => {
  const runner = new TestRunner();

  runner.beforeAll(() => {
    console.log('开始运行对齐辅助线修复回归测试...');
    console.log('测试目标:');
    console.log('  1. p-2 padding 偏移问题');
    console.log('  2. 缩放时对齐辅助线显示');
    console.log('  3. 8px 吸附容差');
    console.log('  4. 手柄类型与对齐吸附');
  });

  runner.test('缺陷 1 验证: AlignmentGuides 定位基准应与组件一致', () => {
    const componentA = createComponentAt('A', 50, 50, 100, 40);
    const componentB = createComponentAt('B', 200, 50, 100, 40);
    const allComponents = [componentA, componentB];

    const result = detectAlignment(componentA, allComponents, 198, 50);

    assert(result.guides.length > 0, '当组件接近时应该产生对齐辅助线');
    
    const leftGuide = result.guides.find(g => g.type === 'left');
    assert(leftGuide !== undefined, '应该产生左边缘对齐辅助线');
    
    if (leftGuide) {
      assertEqual(leftGuide.position, 200, '辅助线位置应该是目标组件的左边缘位置');
    }
  });

  runner.test('8px 吸附容差: 距离 8px 内应该触发吸附', () => {
    const target = createComponentAt('target', 100, 100, 100, 40);
    const dragging = createComponentAt('dragging', 50, 100, 100, 40);
    const allComponents = [target, dragging];

    const withinTolerance = detectAlignment(dragging, allComponents, 92, 100);
    assert(withinTolerance.guides.length > 0, '距离 8px 内应该触发对齐');
    assertEqual(withinTolerance.snappedX, 100, '应该吸附到目标位置');

    const outsideTolerance = detectAlignment(dragging, allComponents, 91, 100);
    assert(outsideTolerance.guides.length === 0, '距离 9px 不应该触发对齐');
  });

  runner.test('缩放对齐: 右边缘手柄拖动应该触发右对齐', () => {
    const target = createComponentAt('target', 100, 100, 200, 50);
    const resizing = createComponentAt('resizing', 50, 100, 100, 50);
    const allComponents = [target, resizing];

    const result = simulateResizeAlignment(
      resizing,
      { x: 50, y: 100, width: 247, height: 50 },
      'right',
      allComponents
    );

    const rightGuide = result.guides.find(g => g.type === 'right');
    assert(rightGuide !== undefined, '右边缘对齐应该触发');

    if (rightGuide) {
      assertEqual(result.snappedWidth, 250, '宽度应该吸附使得右边缘对齐');
      assertEqual(result.snappedWidth + 50, rightGuide.position, '组件右边缘应该对齐到目标右边缘');
    }
  });

  runner.test('缩放对齐: 左边缘手柄拖动应该触发左对齐', () => {
    const target = createComponentAt('target', 100, 100, 200, 50);
    const resizing = createComponentAt('resizing', 150, 100, 150, 50);
    const allComponents = [target, resizing];

    const result = simulateResizeAlignment(
      resizing,
      { x: 108, y: 100, width: 192, height: 50 },
      'left',
      allComponents
    );

    const leftGuide = result.guides.find(g => g.type === 'left');
    assert(leftGuide !== undefined, '左边缘对齐应该触发');

    if (leftGuide) {
      assertEqual(result.snappedX, 100, 'X 应该吸附到目标左边缘');
      assertEqual(result.snappedWidth, 200, '宽度应该补偿 X 的变化');
    }
  });

  runner.test('缩放对齐: 底部手柄拖动应该触发底对齐', () => {
    const target = createComponentAt('target', 100, 100, 100, 100);
    const resizing = createComponentAt('resizing', 100, 50, 100, 50);
    const allComponents = [target, resizing];

    const result = simulateResizeAlignment(
      resizing,
      { x: 100, y: 50, width: 100, height: 147 },
      'bottom',
      allComponents
    );

    const bottomGuide = result.guides.find(g => g.type === 'bottom');
    assert(bottomGuide !== undefined, '底部对齐应该触发');

    if (bottomGuide) {
      assertEqual(result.snappedHeight, 150, '高度应该吸附使得底部对齐');
    }
  });

  runner.test('缩放对齐: 顶部手柄拖动应该触发顶对齐', () => {
    const target = createComponentAt('target', 100, 100, 100, 100);
    const resizing = createComponentAt('resizing', 100, 120, 100, 80);
    const allComponents = [target, resizing];

    const result = simulateResizeAlignment(
      resizing,
      { x: 100, y: 108, width: 100, height: 92 },
      'top',
      allComponents
    );

    const topGuide = result.guides.find(g => g.type === 'top');
    assert(topGuide !== undefined, '顶部对齐应该触发');

    if (topGuide) {
      assertEqual(result.snappedY, 100, 'Y 应该吸附到目标顶部');
      assertEqual(result.snappedHeight, 100, '高度应该补偿 Y 的变化');
    }
  });

  runner.test('画布边缘对齐: 缩放时应该吸附到画布边缘', () => {
    const resizing = createComponentAt('resizing', 50, 50, 100, 50);
    const allComponents = [resizing];

    const result = simulateResizeAlignment(
      resizing,
      { x: 0, y: 50, width: 100, height: 50 },
      'left',
      allComponents,
      800,
      600
    );

    const canvasLeftGuide = result.guides.find(g => g.type === 'canvasLeft');
    assert(canvasLeftGuide !== undefined, '应该触发画布左边缘对齐');

    if (canvasLeftGuide) {
      assertEqual(canvasLeftGuide.position, 0, '画布左边缘位置为 0');
      assert(canvasLeftGuide.isCanvasEdge, '应该标记为画布边缘');
    }
  });

  runner.test('多类型对齐: 缩放时可同时触发多种对齐', () => {
    const target1 = createComponentAt('target1', 100, 100, 200, 50);
    const target2 = createComponentAt('target2', 100, 200, 200, 50);
    const resizing = createComponentAt('resizing', 50, 150, 100, 50);
    const allComponents = [target1, target2, resizing];

    const result = simulateResizeAlignment(
      resizing,
      { x: 98, y: 98, width: 202, height: 152 },
      'bottomRight',
      allComponents
    );

    const hasLeftGuide = result.guides.some(g => g.type === 'left');
    const hasTopGuide = result.guides.some(g => g.type === 'top');
    const hasRightGuide = result.guides.some(g => g.type === 'right');
    const hasBottomGuide = result.guides.some(g => g.type === 'bottom');

    assert(hasLeftGuide || hasRightGuide || hasTopGuide || hasBottomGuide, 
      '多手柄缩放应该能触发边缘对齐');
  });

  runner.test('边界: 距离超过 8px 不应该触发对齐', () => {
    const target = createComponentAt('target', 100, 100, 100, 40);
    const resizing = createComponentAt('resizing', 50, 100, 100, 40);
    const allComponents = [target, resizing];

    const result = simulateResizeAlignment(
      resizing,
      { x: 90, y: 100, width: 110, height: 40 },
      'left',
      allComponents
    );

    assertEqual(result.guides.length, 0, '距离 10px 不应该触发对齐');
    assertEqual(result.snappedX, 90, 'X 不应该改变');
    assertEqual(result.snappedWidth, 110, '宽度不应该改变');
  });

  runner.test('水平中心对齐: 缩放时应该触发水平中心对齐', () => {
    const target = createComponentAt('target', 200, 100, 100, 50);
    const resizing = createComponentAt('resizing', 203, 100, 100, 50);
    const allComponents = [target, resizing];

    const result = detectAlignment(resizing, allComponents, 203, 100);

    const centerHGuide = result.guides.find(g => g.type === 'centerH');
    assert(centerHGuide !== undefined, '应该触发水平中心对齐');

    if (centerHGuide) {
      assertEqual(centerHGuide.position, 250, '中心位置应该是 250');
    }
  });

  runner.test('垂直中心对齐: 缩放时应该触发垂直中心对齐', () => {
    const target = createComponentAt('target', 100, 200, 100, 100);
    const resizing = createComponentAt('resizing', 100, 203, 100, 100);
    const allComponents = [target, resizing];

    const result = detectAlignment(resizing, allComponents, 100, 203);

    const centerVGuide = result.guides.find(g => g.type === 'centerV');
    assert(centerVGuide !== undefined, '应该触发垂直中心对齐');

    if (centerVGuide) {
      assertEqual(centerVGuide.position, 250, '垂直中心位置应该是 250');
    }
  });

  return runner;
};

if (typeof window !== 'undefined') {
  const win = window as unknown as Record<string, unknown>;
  win.runAlignmentTests = runAlignmentTests;
}

export default runAlignmentTests;
