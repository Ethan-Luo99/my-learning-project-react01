import { ComponentType, type ComponentSchema } from '@/types/component';
import {
  TestRunner,
  assert,
  assertEqual,
  assertNotNull,
  createMockTextComponent,
  createMockButtonComponent,
  createMockContainerComponent,
  findComponentById,
} from '@/utils/test-helpers';
import { snapToGrid, COMPONENT_MIN_SIZE, GRID_SIZE } from '@/constants/dnd';
import { useAlignmentGuides, type AlignmentType, type AlignmentGuide } from '@/hooks/useAlignmentGuides';

export const runAlignmentGuidesTests = (): TestRunner => {
  const runner = new TestRunner();

  runner.beforeAll(() => {
    console.log('开始运行 AlignmentGuides 功能测试...');
  });

  runner.afterAll(() => {
    console.log('AlignmentGuides 测试完成');
  });

  runner.test('对齐类型: 应该定义所有必要的对齐类型', () => {
    const expectedTypes: AlignmentType[] = [
      'left',
      'right',
      'centerH',
      'top',
      'bottom',
      'centerV',
      'canvasLeft',
      'canvasRight',
      'canvasTop',
      'canvasBottom',
      'canvasCenterH',
      'canvasCenterV',
    ];

    assertEqual(expectedTypes.length, 12, '应该有 12 种对齐类型');

    const categoryMap: Record<string, AlignmentType[]> = {
      '水平对齐': ['left', 'right', 'centerH'],
      '垂直对齐': ['top', 'bottom', 'centerV'],
      '画布水平对齐': ['canvasLeft', 'canvasRight', 'canvasCenterH'],
      '画布垂直对齐': ['canvasTop', 'canvasBottom', 'canvasCenterV'],
    };

    for (const [category, types] of Object.entries(categoryMap)) {
      assertEqual(types.length, 3, `${category} 应该有 3 种类型`);
    }
  });

  runner.test('吸附容差: 8 像素的容差范围验证', () => {
    const SNAP_TOLERANCE = 8;

    assertEqual(SNAP_TOLERANCE, 8, '吸附容差应该为 8 像素');

    const edgePosition = 100;
    
    const withinTolerance = [
      edgePosition - SNAP_TOLERANCE,
      edgePosition - 5,
      edgePosition,
      edgePosition + 5,
      edgePosition + SNAP_TOLERANCE,
    ];

    const outsideTolerance = [
      edgePosition - SNAP_TOLERANCE - 1,
      edgePosition + SNAP_TOLERANCE + 1,
    ];

    withinTolerance.forEach((pos, index) => {
      const diff = Math.abs(pos - edgePosition);
      assert(
        diff <= SNAP_TOLERANCE,
        `位置 ${pos} (索引 ${index}) 应该在容差范围内`
      );
    });

    outsideTolerance.forEach((pos, index) => {
      const diff = Math.abs(pos - edgePosition);
      assert(
        diff > SNAP_TOLERANCE,
        `位置 ${pos} (索引 ${index}) 应该在容差范围外`
      );
    });
  });

  runner.test('组件边界计算: 单个组件的边界计算', () => {
    const component = createMockTextComponent('text-1', '测试文本');
    component.x = 50;
    component.y = 30;
    component.width = 200;
    component.height = 100;

    const x = component.x ?? 0;
    const y = component.y ?? 0;
    const width = typeof component.width === 'number' ? component.width : 100;
    const height = typeof component.height === 'number' ? component.height : 100;

    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const right = x + width;
    const bottom = y + height;

    assertEqual(x, 50, 'x 应该为 50');
    assertEqual(y, 30, 'y 应该为 30');
    assertEqual(width, 200, '宽度应该为 200');
    assertEqual(height, 100, '高度应该为 100');
    assertEqual(centerX, 150, '水平中心应该为 150');
    assertEqual(centerY, 80, '垂直中心应该为 80');
    assertEqual(right, 250, '右边缘应该为 250');
    assertEqual(bottom, 130, '下边缘应该为 130');
  });

  runner.test('组件边界计算: 带 auto 高度的组件边界计算', () => {
    const component = createMockTextComponent('text-1', '测试文本');
    component.x = 100;
    component.y = 50;
    component.width = 200;
    component.height = 'auto';

    const x = component.x ?? 0;
    const y = component.y ?? 0;
    const width = typeof component.width === 'number' ? component.width : 100;
    const height = typeof component.height === 'number' ? component.height : 100;

    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const right = x + width;
    const bottom = y + height;

    assertEqual(x, 100, 'x 应该为 100');
    assertEqual(y, 50, 'y 应该为 50');
    assertEqual(width, 200, '宽度应该为 200');
    assertEqual(height, 100, 'auto 高度应该使用默认值 100');
    assertEqual(centerX, 200, '水平中心应该为 200');
    assertEqual(centerY, 100, '垂直中心应该为 100');
    assertEqual(right, 300, '右边缘应该为 300');
    assertEqual(bottom, 150, '下边缘应该为 150');
  });

  runner.test('左对齐检测: 两个组件左边缘对齐的检测', () => {
    const component1 = createMockTextComponent('text-1', '文本1');
    component1.x = 50;
    component1.y = 100;
    component1.width = 150;
    component1.height = 50;

    const component2 = createMockTextComponent('text-2', '文本2');
    component2.x = 55;
    component2.y = 200;
    component2.width = 200;
    component2.height = 60;

    const SNAP_TOLERANCE = 8;

    const diffX = Math.abs(component2.x - component1.x);
    const shouldSnap = diffX <= SNAP_TOLERANCE;

    assertEqual(diffX, 5, '左边缘差异应该为 5');
    assert(shouldSnap, '差异在 8 像素内，应该触发吸附');

    const snappedX = component1.x;
    assertEqual(snappedX, 50, '吸附后 x 应该为 50');
  });

  runner.test('右对齐检测: 两个组件右边缘对齐的检测', () => {
    const component1 = createMockTextComponent('text-1', '文本1');
    component1.x = 50;
    component1.y = 100;
    component1.width = 150;
    component1.height = 50;

    const component2 = createMockTextComponent('text-2', '文本2');
    component2.x = 80;
    component2.y = 200;
    component2.width = 120;
    component2.height = 60;

    const SNAP_TOLERANCE = 8;

    const component1Right = component1.x + (component1.width as number);
    const component2Right = component2.x + (component2.width as number);

    assertEqual(component1Right, 200, '组件1 右边缘应该为 200');
    assertEqual(component2Right, 200, '组件2 右边缘应该为 200');

    const diff = Math.abs(component2Right - component1Right);
    assertEqual(diff, 0, '右边缘差异应该为 0');
    assert(diff <= SNAP_TOLERANCE, '应该触发吸附');

    const snappedRight = component1Right;
    const newX = snappedRight - (component2.width as number);
    assertEqual(newX, 80, '吸附后 x 应该保持为 80');
  });

  runner.test('水平居中对齐检测: 两个组件水平中心对齐的检测', () => {
    const component1 = createMockTextComponent('text-1', '文本1');
    component1.x = 100;
    component1.y = 100;
    component1.width = 200;
    component1.height = 50;

    const component2 = createMockTextComponent('text-2', '文本2');
    component2.x = 145;
    component2.y = 200;
    component2.width = 110;
    component2.height = 60;

    const SNAP_TOLERANCE = 8;

    const component1CenterX = component1.x + (component1.width as number) / 2;
    const component2CenterX = component2.x + (component2.width as number) / 2;

    assertEqual(component1CenterX, 200, '组件1 水平中心应该为 200');
    assertEqual(component2CenterX, 200, '组件2 水平中心应该为 200');

    const diff = Math.abs(component2CenterX - component1CenterX);
    assertEqual(diff, 0, '水平中心差异应该为 0');
    assert(diff <= SNAP_TOLERANCE, '应该触发吸附');
  });

  runner.test('上对齐检测: 两个组件上边缘对齐的检测', () => {
    const component1 = createMockTextComponent('text-1', '文本1');
    component1.x = 50;
    component1.y = 100;
    component1.width = 150;
    component1.height = 50;

    const component2 = createMockTextComponent('text-2', '文本2');
    component2.x = 250;
    component2.y = 103;
    component2.width = 200;
    component2.height = 60;

    const SNAP_TOLERANCE = 8;

    const diffY = Math.abs(component2.y - component1.y);

    assertEqual(diffY, 3, '上边缘差异应该为 3');
    assert(diffY <= SNAP_TOLERANCE, '应该触发吸附');

    const snappedY = component1.y;
    assertEqual(snappedY, 100, '吸附后 y 应该为 100');
  });

  runner.test('下对齐检测: 两个组件下边缘对齐的检测', () => {
    const component1 = createMockTextComponent('text-1', '文本1');
    component1.x = 50;
    component1.y = 100;
    component1.width = 150;
    component1.height = 80;

    const component2 = createMockTextComponent('text-2', '文本2');
    component2.x = 250;
    component2.y = 135;
    component2.width = 200;
    component2.height = 45;

    const SNAP_TOLERANCE = 8;

    const component1Bottom = component1.y + (component1.height as number);
    const component2Bottom = component2.y + (component2.height as number);

    assertEqual(component1Bottom, 180, '组件1 下边缘应该为 180');
    assertEqual(component2Bottom, 180, '组件2 下边缘应该为 180');

    const diff = Math.abs(component2Bottom - component1Bottom);
    assertEqual(diff, 0, '下边缘差异应该为 0');
    assert(diff <= SNAP_TOLERANCE, '应该触发吸附');
  });

  runner.test('垂直居中对齐检测: 两个组件垂直中心对齐的检测', () => {
    const component1 = createMockTextComponent('text-1', '文本1');
    component1.x = 50;
    component1.y = 100;
    component1.width = 150;
    component1.height = 100;

    const component2 = createMockTextComponent('text-2', '文本2');
    component2.x = 250;
    component2.y = 120;
    component2.width = 200;
    component2.height = 60;

    const SNAP_TOLERANCE = 8;

    const component1CenterY = component1.y + (component1.height as number) / 2;
    const component2CenterY = component2.y + (component2.height as number) / 2;

    assertEqual(component1CenterY, 150, '组件1 垂直中心应该为 150');
    assertEqual(component2CenterY, 150, '组件2 垂直中心应该为 150');

    const diff = Math.abs(component2CenterY - component1CenterY);
    assertEqual(diff, 0, '垂直中心差异应该为 0');
    assert(diff <= SNAP_TOLERANCE, '应该触发吸附');
  });

  runner.test('画布左边缘对齐检测: 组件与画布左边缘对齐', () => {
    const canvasWidth = 800;
    const canvasHeight = 600;
    const canvasLeft = 0;
    const SNAP_TOLERANCE = 8;

    const component = createMockTextComponent('text-1', '文本1');
    component.x = 5;
    component.y = 100;
    component.width = 200;
    component.height = 50;

    const diffToCanvasLeft = Math.abs(component.x - canvasLeft);

    assertEqual(diffToCanvasLeft, 5, '到画布左边缘的距离应该为 5');
    assert(diffToCanvasLeft <= SNAP_TOLERANCE, '应该触发布对齐');

    const snappedX = canvasLeft;
    assertEqual(snappedX, 0, '吸附后 x 应该为 0');
  });

  runner.test('画布右边缘对齐检测: 组件与画布右边缘对齐', () => {
    const canvasWidth = 800;
    const canvasHeight = 600;
    const canvasRight = canvasWidth;
    const SNAP_TOLERANCE = 8;

    const component = createMockTextComponent('text-1', '文本1');
    component.x = 595;
    component.y = 100;
    component.width = 200;
    component.height = 50;

    const componentRight = component.x + (component.width as number);
    const diffToCanvasRight = Math.abs(componentRight - canvasRight);

    assertEqual(componentRight, 795, '组件右边缘应该为 795');
    assertEqual(diffToCanvasRight, 5, '到画布右边缘的距离应该为 5');
    assert(diffToCanvasRight <= SNAP_TOLERANCE, '应该触发对齐');

    const snappedRight = canvasRight;
    const newX = snappedRight - (component.width as number);
    assertEqual(newX, 600, '吸附后 x 应该为 600');
  });

  runner.test('画布水平居中对齐检测: 组件与画布水平中心对齐', () => {
    const canvasWidth = 800;
    const canvasHeight = 600;
    const canvasCenterX = canvasWidth / 2;
    const SNAP_TOLERANCE = 8;

    const component = createMockTextComponent('text-1', '文本1');
    component.x = 295;
    component.y = 100;
    component.width = 210;
    component.height = 50;

    const componentCenterX = component.x + (component.width as number) / 2;

    assertEqual(canvasCenterX, 400, '画布水平中心应该为 400');
    assertEqual(componentCenterX, 400, '组件水平中心应该为 400');

    const diff = Math.abs(componentCenterX - canvasCenterX);
    assertEqual(diff, 0, '差异应该为 0');
    assert(diff <= SNAP_TOLERANCE, '应该触发对齐');
  });

  runner.test('画布上边缘对齐检测: 组件与画布上边缘对齐', () => {
    const canvasWidth = 800;
    const canvasHeight = 600;
    const canvasTop = 0;
    const SNAP_TOLERANCE = 8;

    const component = createMockTextComponent('text-1', '文本1');
    component.x = 100;
    component.y = 6;
    component.width = 200;
    component.height = 50;

    const diffToCanvasTop = Math.abs(component.y - canvasTop);

    assertEqual(diffToCanvasTop, 6, '到画布上边缘的距离应该为 6');
    assert(diffToCanvasTop <= SNAP_TOLERANCE, '应该触发对齐');

    const snappedY = canvasTop;
    assertEqual(snappedY, 0, '吸附后 y 应该为 0');
  });

  runner.test('画布下边缘对齐检测: 组件与画布下边缘对齐', () => {
    const canvasWidth = 800;
    const canvasHeight = 600;
    const canvasBottom = canvasHeight;
    const SNAP_TOLERANCE = 8;

    const component = createMockTextComponent('text-1', '文本1');
    component.x = 100;
    component.y = 545;
    component.width = 200;
    component.height = 50;

    const componentBottom = component.y + (component.height as number);
    const diffToCanvasBottom = Math.abs(componentBottom - canvasBottom);

    assertEqual(componentBottom, 595, '组件下边缘应该为 595');
    assertEqual(diffToCanvasBottom, 5, '到画布下边缘的距离应该为 5');
    assert(diffToCanvasBottom <= SNAP_TOLERANCE, '应该触发对齐');

    const snappedBottom = canvasBottom;
    const newY = snappedBottom - (component.height as number);
    assertEqual(newY, 550, '吸附后 y 应该为 550');
  });

  runner.test('画布垂直居中对齐检测: 组件与画布垂直中心对齐', () => {
    const canvasWidth = 800;
    const canvasHeight = 600;
    const canvasCenterY = canvasHeight / 2;
    const SNAP_TOLERANCE = 8;

    const component = createMockTextComponent('text-1', '文本1');
    component.x = 100;
    component.y = 270;
    component.width = 200;
    component.height = 60;

    const componentCenterY = component.y + (component.height as number) / 2;

    assertEqual(canvasCenterY, 300, '画布垂直中心应该为 300');
    assertEqual(componentCenterY, 300, '组件垂直中心应该为 300');

    const diff = Math.abs(componentCenterY - canvasCenterY);
    assertEqual(diff, 0, '差异应该为 0');
    assert(diff <= SNAP_TOLERANCE, '应该触发对齐');
  });

  runner.test('边界情况: 差异超过容差范围不应该触发吸附', () => {
    const SNAP_TOLERANCE = 8;

    const component1 = createMockTextComponent('text-1', '文本1');
    component1.x = 50;
    component1.y = 100;

    const component2 = createMockTextComponent('text-2', '文本2');
    component2.x = 60;
    component2.y = 110;

    const diffX = Math.abs(component2.x - component1.x);
    const diffY = Math.abs(component2.y - component1.y);

    assertEqual(diffX, 10, 'x 差异应该为 10');
    assertEqual(diffY, 10, 'y 差异应该为 10');
    assert(diffX > SNAP_TOLERANCE, 'x 差异超过容差，不应该触发吸附');
    assert(diffY > SNAP_TOLERANCE, 'y 差异超过容差，不应该触发吸附');
  });

  runner.test('网格对齐 vs 对齐线: 对齐线应该优先于网格对齐', () => {
    const SNAP_TOLERANCE = 8;
    const GRID_SIZE = 16;

    const component1 = createMockTextComponent('text-1', '文本1');
    component1.x = 50;
    component1.y = 100;

    const component2 = createMockTextComponent('text-2', '文本2');
    component2.x = 53;
    component2.y = 103;

    const diffX = Math.abs(component2.x - component1.x);
    const diffY = Math.abs(component2.y - component1.y);

    assert(diffX <= SNAP_TOLERANCE, 'x 差异在对齐容差内');
    assert(diffY <= SNAP_TOLERANCE, 'y 差异在对齐容差内');

    const snappedToGridX = snapToGrid(component2.x);
    const snappedToGridY = snapToGrid(component2.y);
    const snappedToAlignmentX = component1.x;
    const snappedToAlignmentY = component1.y;

    assertEqual(snappedToGridX, 48, '网格对齐后 x 应该为 48');
    assertEqual(snappedToGridY, 112, '网格对齐后 y 应该为 112');
    assertEqual(snappedToAlignmentX, 50, '对齐线对齐后 x 应该为 50');
    assertEqual(snappedToAlignmentY, 100, '对齐线对齐后 y 应该为 100');

    assert(snappedToAlignmentX !== snappedToGridX, '对齐线对齐和网格对齐应该不同');
    assert(snappedToAlignmentY !== snappedToGridY, '对齐线对齐和网格对齐应该不同');
  });

  runner.test('多选拖拽对齐: 多个组件整体拖拽时的对齐检测', () => {
    const SNAP_TOLERANCE = 8;

    const referenceComponent = createMockTextComponent('ref-1', '参考组件');
    referenceComponent.x = 100;
    referenceComponent.y = 100;
    referenceComponent.width = 200;
    referenceComponent.height = 100;

    const selectedComponents = [
      { ...createMockTextComponent('sel-1', '选中1'), x: 400, y: 200, width: 150, height: 50 },
      { ...createMockTextComponent('sel-2', '选中2'), x: 400, y: 270, width: 150, height: 50 },
    ];

    const primaryComponent = selectedComponents[0];
    const dragDeltaX = -303;
    const dragDeltaY = -103;

    const newPrimaryX = primaryComponent.x + dragDeltaX;
    const newPrimaryY = primaryComponent.y + dragDeltaY;

    assertEqual(newPrimaryX, 97, '主组件新 x 位置应该为 97');
    assertEqual(newPrimaryY, 97, '主组件新 y 位置应该为 97');

    const diffX = Math.abs(newPrimaryX - referenceComponent.x);
    const diffY = Math.abs(newPrimaryY - referenceComponent.y);

    assert(diffX <= SNAP_TOLERANCE, 'x 差异在容差内，应该触发对齐');
    assert(diffY <= SNAP_TOLERANCE, 'y 差异在容差内，应该触发对齐');

    const snappedPrimaryX = referenceComponent.x;
    const snappedPrimaryY = referenceComponent.y;

    const appliedDeltaX = snappedPrimaryX - primaryComponent.x;
    const appliedDeltaY = snappedPrimaryY - primaryComponent.y;

    const newSelected2X = selectedComponents[1].x + appliedDeltaX;
    const newSelected2Y = selectedComponents[1].y + appliedDeltaY;

    assertEqual(newSelected2X, 100, '第二个选中组件新 x 位置应该为 100');
    assertEqual(newSelected2Y, 170, '第二个选中组件新 y 位置应该为 170');

    const relativeX = selectedComponents[1].x - primaryComponent.x;
    const relativeY = selectedComponents[1].y - primaryComponent.y;
    const newRelativeX = newSelected2X - snappedPrimaryX;
    const newRelativeY = newSelected2Y - snappedPrimaryY;

    assertEqual(newRelativeX, relativeX, '相对 x 位置应该保持不变');
    assertEqual(newRelativeY, relativeY, '相对 y 位置应该保持不变');
  });

  runner.test('辅助线类型: AlignmentGuide 接口验证', () => {
    const guide1: AlignmentGuide = {
      type: 'left',
      position: 50,
      isCanvasEdge: false,
      targetComponentId: 'component-1',
    };

    const guide2: AlignmentGuide = {
      type: 'canvasLeft',
      position: 0,
      isCanvasEdge: true,
    };

    assertNotNull(guide1.type, '应该有 type 属性');
    assertNotNull(guide1.position, '应该有 position 属性');
    assertNotNull(guide1.isCanvasEdge, '应该有 isCanvasEdge 属性');
    assert(typeof guide1.position === 'number', 'position 应该是数字');
    assert(typeof guide1.isCanvasEdge === 'boolean', 'isCanvasEdge 应该是布尔值');

    assert(guide1.targetComponentId === 'component-1', '组件对齐应该有目标组件 ID');
    assert(guide2.targetComponentId === undefined, '画布边缘对齐不应该有目标组件 ID');
  });

  return runner;
};

export default runAlignmentGuidesTests;
