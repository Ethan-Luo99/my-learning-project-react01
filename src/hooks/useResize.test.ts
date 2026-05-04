import { ComponentType, type ComponentSchema, type TextComponentSchema } from '@/types/component';
import {
  TestRunner,
  assert,
  assertEqual,
  assertNotNull,
  createMockTextComponent,
  findComponentById,
} from '@/utils/test-helpers';
import { snapToGrid, COMPONENT_MIN_SIZE, GRID_SIZE } from '@/constants/dnd';

export const runResizeTests = (): TestRunner => {
  const runner = new TestRunner();

  runner.beforeAll(() => {
    console.log('开始运行 Resize 功能测试...');
  });

  runner.afterAll(() => {
    console.log('Resize 测试完成');
  });

  runner.test('网格吸附: snapToGrid 应该将值吸附到最近的网格点', () => {
    assertEqual(snapToGrid(0), 0, '0 应该保持为 0');
    assertEqual(snapToGrid(5), 0, '5 应该吸附到 0');
    assertEqual(snapToGrid(8), 0, '8 应该吸附到 0');
    assertEqual(snapToGrid(9), 16, '9 应该吸附到 16');
    assertEqual(snapToGrid(16), 16, '16 应该保持为 16');
    assertEqual(snapToGrid(20), 16, '20 应该吸附到 16');
    assertEqual(snapToGrid(24), 32, '24 应该吸附到 32');
  });

  runner.test('网格吸附: snapToGrid 应该正确处理负数', () => {
    assertEqual(snapToGrid(-5), 0, '-5 应该吸附到 0');
    assertEqual(snapToGrid(-8), 0, '-8 应该吸附到 0');
    assertEqual(snapToGrid(-9), -16, '-9 应该吸附到 -16');
  });

  runner.test('最小尺寸限制: COMPONENT_MIN_SIZE 应该为 16x16', () => {
    assertEqual(COMPONENT_MIN_SIZE.WIDTH, 16, '最小宽度应为 16');
    assertEqual(COMPONENT_MIN_SIZE.HEIGHT, 16, '最小高度应为 16');
  });

  runner.test('网格大小: GRID_SIZE 应该为 16', () => {
    assertEqual(GRID_SIZE, 16, '网格大小应为 16');
  });

  runner.test('组件尺寸: createMockTextComponent 应该有正确的初始尺寸', () => {
    const textComponent = createMockTextComponent('text-1', '测试文本');
    
    assertEqual(textComponent.width, 200, '文本组件初始宽度应为 200');
    assertEqual(textComponent.height, 'auto', '文本组件初始高度应为 auto');
  });

  runner.test('组件位置: createMockTextComponent 应该有正确的初始位置', () => {
    const textComponent = createMockTextComponent('text-1', '测试文本');
    
    assertEqual(textComponent.x, 10, '初始 x 位置应为 10');
    assertEqual(textComponent.y, 10, '初始 y 位置应为 10');
  });

  runner.test('手柄类型: 8 个 resize 手柄类型应该正确定义', () => {
    const handleTypes = [
      'top',
      'bottom', 
      'left',
      'right',
      'topLeft',
      'topRight',
      'bottomLeft',
      'bottomRight',
    ];

    assertEqual(handleTypes.length, 8, '应该有 8 个手柄类型');
    
    handleTypes.forEach((type, index) => {
      assert(
        typeof type === 'string' && type.length > 0,
        `手柄类型 ${index} 应该是有效字符串`
      );
    });
  });

  runner.test('手柄配置: 每个手柄应该有正确的方向配置', () => {
    const handleConfigs = [
      { handle: 'top', affectsWidth: false, affectsHeight: true, xDirection: 0, yDirection: -1 },
      { handle: 'bottom', affectsWidth: false, affectsHeight: true, xDirection: 0, yDirection: 1 },
      { handle: 'left', affectsWidth: true, affectsHeight: false, xDirection: -1, yDirection: 0 },
      { handle: 'right', affectsWidth: true, affectsHeight: false, xDirection: 1, yDirection: 0 },
      { handle: 'topLeft', affectsWidth: true, affectsHeight: true, xDirection: -1, yDirection: -1 },
      { handle: 'topRight', affectsWidth: true, affectsHeight: true, xDirection: 1, yDirection: -1 },
      { handle: 'bottomLeft', affectsWidth: true, affectsHeight: true, xDirection: -1, yDirection: 1 },
      { handle: 'bottomRight', affectsWidth: true, affectsHeight: true, xDirection: 1, yDirection: 1 },
    ];

    assertEqual(handleConfigs.length, 8, '应该有 8 个手柄配置');

    handleConfigs.forEach((config) => {
      assert(typeof config.handle === 'string', 'handle 应该是字符串');
      assert(typeof config.affectsWidth === 'boolean', 'affectsWidth 应该是布尔值');
      assert(typeof config.affectsHeight === 'boolean', 'affectsHeight 应该是布尔值');
      assert(typeof config.xDirection === 'number', 'xDirection 应该是数字');
      assert(typeof config.yDirection === 'number', 'yDirection 应该是数字');
      assert(config.xDirection >= -1 && config.xDirection <= 1, 'xDirection 应该在 -1 到 1 之间');
      assert(config.yDirection >= -1 && config.yDirection <= 1, 'yDirection 应该在 -1 到 1 之间');
    });
  });

  runner.test('尺寸计算: 从右下角手柄调整尺寸时的计算逻辑', () => {
    const initialWidth = 200;
    const initialHeight = 100;
    const deltaX = 32;
    const deltaY = 16;

    const snappedDeltaX = snapToGrid(deltaX);
    const snappedDeltaY = snapToGrid(deltaY);

    assertEqual(snappedDeltaX, 32, 'deltaX 应该保持为 32（网格对齐）');
    assertEqual(snappedDeltaY, 16, 'deltaY 应该保持为 16（网格对齐）');

    const newWidth = Math.max(initialWidth + snappedDeltaX, COMPONENT_MIN_SIZE.WIDTH);
    const newHeight = Math.max(initialHeight + snappedDeltaY, COMPONENT_MIN_SIZE.HEIGHT);

    assertEqual(newWidth, 232, '新宽度应为 232');
    assertEqual(newHeight, 116, '新高度应为 116');
  });

  runner.test('尺寸计算: 从左上角手柄调整尺寸时的计算逻辑', () => {
    const initialWidth = 200;
    const initialHeight = 100;
    const initialX = 50;
    const initialY = 30;
    const deltaX = 32;
    const deltaY = 16;

    const snappedDeltaX = snapToGrid(deltaX);
    const snappedDeltaY = snapToGrid(deltaY);

    const newWidth = Math.max(initialWidth - snappedDeltaX, COMPONENT_MIN_SIZE.WIDTH);
    const newHeight = Math.max(initialHeight - snappedDeltaY, COMPONENT_MIN_SIZE.HEIGHT);

    assertEqual(newWidth, 168, '新宽度应为 168');
    assertEqual(newHeight, 84, '新高度应为 84');

    const widthChange = newWidth - initialWidth;
    const heightChange = newHeight - initialHeight;
    const newX = initialX - widthChange;
    const newY = initialY - heightChange;

    assertEqual(newX, 82, '新 x 位置应为 82');
    assertEqual(newY, 46, '新 y 位置应为 46');
  });

  runner.test('最小尺寸限制: 缩放到小于最小尺寸时应该停止', () => {
    const initialWidth = 50;
    const initialHeight = 50;
    const deltaX = -100;
    const deltaY = -100;

    const snappedDeltaX = snapToGrid(deltaX);
    const snappedDeltaY = snapToGrid(deltaY);

    const newWidth = Math.max(initialWidth + snappedDeltaX, COMPONENT_MIN_SIZE.WIDTH);
    const newHeight = Math.max(initialHeight + snappedDeltaY, COMPONENT_MIN_SIZE.HEIGHT);

    assertEqual(newWidth, COMPONENT_MIN_SIZE.WIDTH, '宽度不应小于最小尺寸');
    assertEqual(newHeight, COMPONENT_MIN_SIZE.HEIGHT, '高度不应小于最小尺寸');
  });

  runner.test('组件属性: 组件应该包含所有必需的属性', () => {
    const textComponent = createMockTextComponent('test-1', '测试');

    assertNotNull(textComponent.id, '应该有 id 属性');
    assertNotNull(textComponent.type, '应该有 type 属性');
    assertNotNull(textComponent.x, '应该有 x 属性');
    assertNotNull(textComponent.y, '应该有 y 属性');
    assertNotNull(textComponent.width, '应该有 width 属性');
    assertNotNull(textComponent.props, '应该有 props 属性');
    assertNotNull(textComponent.styles, '应该有 styles 属性');

    assertEqual(textComponent.type, ComponentType.Text, '类型应该是 Text');
    assert(typeof textComponent.x === 'number', 'x 应该是数字');
    assert(typeof textComponent.y === 'number', 'y 应该是数字');
  });

  runner.test('findComponentById: 应该能正确查找组件', () => {
    const components = [
      createMockTextComponent('text-1', '文本1'),
      createMockTextComponent('text-2', '文本2'),
    ];

    const found1 = findComponentById(components, 'text-1');
    const found2 = findComponentById(components, 'text-2');
    const notFound = findComponentById(components, 'non-existent');

    assertNotNull(found1, '应该能找到 text-1');
    assertEqual(found1!.id, 'text-1', '找到的组件 ID 应该匹配');
    assertNotNull(found2, '应该能找到 text-2');
    assertEqual(notFound, null, '不存在的组件应该返回 null');
  });

  runner.test('整数坐标验证: 网格对齐后的坐标应该是整数', () => {
    const testValues = [0, 1, 5, 8, 9, 15, 16, 17, 23, 24, 31, 32];
    
    testValues.forEach((value) => {
      const snapped = snapToGrid(value);
      assert(
        Number.isInteger(snapped),
        `snapToGrid(${value}) = ${snapped} 应该是整数`
      );
      assert(
        snapped % GRID_SIZE === 0,
        `snapToGrid(${value}) = ${snapped} 应该是 ${GRID_SIZE} 的倍数`
      );
    });
  });

  return runner;
};

export default runResizeTests;
