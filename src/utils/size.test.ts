import { ComponentType, type ComponentSchema, type TextComponentSchema, type CheckboxComponentSchema } from '@/types/component';
import {
  TestRunner,
  assert,
  assertEqual,
  assertNotNull,
  createMockTextComponent,
  createMockButtonComponent,
  createMockCheckboxComponent,
  createMockRadioComponent,
  createMockSwitchComponent,
  findComponentById,
} from '@/utils/test-helpers';
import { COMPONENT_MIN_SIZE } from '@/constants/dnd';
import {
  getComponentSize,
  getComponentFullBounds,
  isNumericSize,
  DEFAULT_AUTO_WIDTH,
  DEFAULT_AUTO_HEIGHT,
  type ComponentSize,
  type ComponentBounds,
} from '@/utils/size';

export const runSizeTests = (): TestRunner => {
  const runner = new TestRunner();

  runner.beforeAll(() => {
    console.log('开始运行 Size 工具函数测试...');
  });

  runner.afterAll(() => {
    console.log('Size 工具函数测试完成');
  });

  runner.test('isNumericSize: 数值类型应该返回 true', () => {
    assertEqual(isNumericSize(0), true, '0 应该是数值');
    assertEqual(isNumericSize(100), true, '100 应该是数值');
    assertEqual(isNumericSize(-50), true, '-50 应该是数值');
    assertEqual(isNumericSize(1.5), true, '1.5 应该是数值');
  });

  runner.test('isNumericSize: 非数值类型应该返回 false', () => {
    assertEqual(isNumericSize('auto'), false, "'auto' 不应该是数值");
    assertEqual(isNumericSize('100%'), false, "'100%' 不应该是数值");
    assertEqual(isNumericSize(undefined), false, 'undefined 不应该是数值');
    assertEqual(isNumericSize(null as unknown as number), false, 'null 不应该是数值');
  });

  runner.test('DEFAULT_AUTO_WIDTH/HEIGHT: 默认值应该为 100', () => {
    assertEqual(DEFAULT_AUTO_WIDTH, 100, '默认 auto 宽度应该为 100');
    assertEqual(DEFAULT_AUTO_HEIGHT, 100, '默认 auto 高度应该为 100');
  });

  runner.test('COMPONENT_MIN_SIZE: 最小尺寸应该为 16', () => {
    assertEqual(COMPONENT_MIN_SIZE.WIDTH, 16, '最小宽度应该为 16');
    assertEqual(COMPONENT_MIN_SIZE.HEIGHT, 16, '最小高度应该为 16');
  });

  runner.test('getComponentSize: 数值尺寸应该直接返回', () => {
    const component = createMockTextComponent('text-1', '测试文本');
    component.width = 200;
    component.height = 150;

    const size = getComponentSize(component);

    assertEqual(size.width, 200, '宽度应该为 200');
    assertEqual(size.height, 150, '高度应该为 150');
  });

  runner.test('getComponentSize: auto 宽度应该使用默认值 100', () => {
    const component = createMockTextComponent('text-1', '测试文本');
    component.width = 200;
    component.height = 'auto';

    const size = getComponentSize(component);

    assertEqual(size.width, 200, '数值宽度应该直接返回');
    assertEqual(size.height, DEFAULT_AUTO_HEIGHT, 'auto 高度应该使用默认值');
  });

  runner.test('getComponentSize: undefined 尺寸应该使用默认值', () => {
    const component: Partial<TextComponentSchema> = {
      id: 'test-1',
      type: ComponentType.Text,
      props: {},
      styles: {},
    };

    const size = getComponentSize(component as TextComponentSchema);

    assertEqual(size.width, DEFAULT_AUTO_WIDTH, 'undefined 宽度应该使用默认值');
    assertEqual(size.height, DEFAULT_AUTO_HEIGHT, 'undefined 高度应该使用默认值');
  });

  runner.test('getComponentSize: 小于最小尺寸的应该被限制', () => {
    const component = createMockTextComponent('text-1', '测试文本');
    component.width = 10;
    component.height = 5;

    const size = getComponentSize(component);

    assertEqual(size.width, COMPONENT_MIN_SIZE.WIDTH, '宽度应该被限制为最小尺寸');
    assertEqual(size.height, COMPONENT_MIN_SIZE.HEIGHT, '高度应该被限制为最小尺寸');
  });

  runner.test('getComponentSize: Text 组件默认 height 为 auto', () => {
    const component = createMockTextComponent('text-1', '测试文本');

    assertEqual(component.height, 'auto', 'Text 组件默认高度应该为 auto');
    assertEqual(component.width, 200, 'Text 组件默认宽度应该为 200');

    const size = getComponentSize(component);

    assertEqual(size.width, 200, '宽度应该为 200');
    assertEqual(size.height, DEFAULT_AUTO_HEIGHT, 'auto 高度应该使用默认值');
  });

  runner.test('getComponentSize: Checkbox 组件默认尺寸为 auto', () => {
    const component = createMockCheckboxComponent('checkbox-1');

    assertEqual(component.width, 'auto', 'Checkbox 组件默认宽度应该为 auto');
    assertEqual(component.height, 'auto', 'Checkbox 组件默认高度应该为 auto');

    const size = getComponentSize(component);

    assertEqual(size.width, DEFAULT_AUTO_WIDTH, 'auto 宽度应该使用默认值');
    assertEqual(size.height, DEFAULT_AUTO_HEIGHT, 'auto 高度应该使用默认值');
  });

  runner.test('getComponentSize: Radio 组件默认尺寸为 auto', () => {
    const component = createMockRadioComponent('radio-1');

    assertEqual(component.width, 'auto', 'Radio 组件默认宽度应该为 auto');
    assertEqual(component.height, 'auto', 'Radio 组件默认高度应该为 auto');

    const size = getComponentSize(component);

    assertEqual(size.width, DEFAULT_AUTO_WIDTH, 'auto 宽度应该使用默认值');
    assertEqual(size.height, DEFAULT_AUTO_HEIGHT, 'auto 高度应该使用默认值');
  });

  runner.test('getComponentSize: Switch 组件默认尺寸为 auto', () => {
    const component = createMockSwitchComponent('switch-1');

    assertEqual(component.width, 'auto', 'Switch 组件默认宽度应该为 auto');
    assertEqual(component.height, 'auto', 'Switch 组件默认高度应该为 auto');

    const size = getComponentSize(component);

    assertEqual(size.width, DEFAULT_AUTO_WIDTH, 'auto 宽度应该使用默认值');
    assertEqual(size.height, DEFAULT_AUTO_HEIGHT, 'auto 高度应该使用默认值');
  });

  runner.test('getComponentFullBounds: 应该计算完整边界信息', () => {
    const component = createMockTextComponent('text-1', '测试文本');
    component.x = 50;
    component.y = 30;
    component.width = 200;
    component.height = 100;

    const bounds = getComponentFullBounds(component);

    assertEqual(bounds.id, 'text-1', 'ID 应该匹配');
    assertEqual(bounds.x, 50, 'x 应该为 50');
    assertEqual(bounds.y, 30, 'y 应该为 30');
    assertEqual(bounds.width, 200, '宽度应该为 200');
    assertEqual(bounds.height, 100, '高度应该为 100');
    assertEqual(bounds.centerX, 150, '水平中心应该为 150');
    assertEqual(bounds.centerY, 80, '垂直中心应该为 80');
    assertEqual(bounds.right, 250, '右边缘应该为 250');
    assertEqual(bounds.bottom, 130, '下边缘应该为 130');
  });

  runner.test('getComponentFullBounds: auto 尺寸组件的边界计算', () => {
    const component = createMockCheckboxComponent('checkbox-1');
    component.x = 100;
    component.y = 200;

    const bounds = getComponentFullBounds(component);

    assertEqual(bounds.id, 'checkbox-1', 'ID 应该匹配');
    assertEqual(bounds.x, 100, 'x 应该为 100');
    assertEqual(bounds.y, 200, 'y 应该为 200');
    assertEqual(bounds.width, DEFAULT_AUTO_WIDTH, '宽度应该使用默认值');
    assertEqual(bounds.height, DEFAULT_AUTO_HEIGHT, '高度应该使用默认值');
    assertEqual(bounds.centerX, 150, '水平中心应该为 150');
    assertEqual(bounds.centerY, 250, '垂直中心应该为 250');
    assertEqual(bounds.right, 200, '右边缘应该为 200');
    assertEqual(bounds.bottom, 300, '下边缘应该为 300');
  });

  runner.test('getComponentFullBounds: undefined 位置应该默认为 0', () => {
    const component: Partial<CheckboxComponentSchema> = {
      id: 'test-1',
      type: ComponentType.Checkbox,
      width: 'auto',
      height: 'auto',
      props: {},
      styles: {},
    };

    const bounds = getComponentFullBounds(component as CheckboxComponentSchema);

    assertEqual(bounds.x, 0, 'undefined x 应该默认为 0');
    assertEqual(bounds.y, 0, 'undefined y 应该默认为 0');
  });

  runner.test('场景: Text 组件 (width 为 auto) 缩放尺寸计算', () => {
    const component = createMockTextComponent('text-1', '测试文本');
    component.x = 10;
    component.y = 10;
    component.width = 200;
    component.height = 'auto';

    const initialBounds = {
      x: component.x ?? 0,
      y: component.y ?? 0,
      width: getComponentSize(component).width,
      height: getComponentSize(component).height,
    };

    assertEqual(initialBounds.x, 10, '初始 x 应该为 10');
    assertEqual(initialBounds.y, 10, '初始 y 应该为 10');
    assertEqual(initialBounds.width, 200, '初始宽度应该为 200');
    assertEqual(initialBounds.height, DEFAULT_AUTO_HEIGHT, '初始高度应该使用默认值');

    const deltaX = 32;
    const deltaY = 16;
    const handle = 'bottomRight';

    const config = {
      affectsWidth: true,
      affectsHeight: true,
      xDirection: 1,
      yDirection: 1,
    };

    const newWidth = Math.max(initialBounds.width + deltaX, COMPONENT_MIN_SIZE.WIDTH);
    const newHeight = Math.max(initialBounds.height + deltaY, COMPONENT_MIN_SIZE.HEIGHT);

    assertEqual(newWidth, 232, '新宽度应该为 232');
    assertEqual(newHeight, 116, '新高度应该为 116');
  });

  runner.test('场景: Checkbox 组件参与多选对齐的右边缘计算', () => {
    const checkbox = createMockCheckboxComponent('checkbox-1');
    checkbox.x = 50;
    checkbox.y = 100;
    checkbox.width = 'auto';
    checkbox.height = 'auto';

    const textComponent = createMockTextComponent('text-1', '文本组件');
    textComponent.x = 200;
    textComponent.y = 100;
    textComponent.width = 150;
    textComponent.height = 50;

    const checkboxBounds = getComponentFullBounds(checkbox);
    const textBounds = getComponentFullBounds(textComponent);

    assertEqual(checkboxBounds.right, 50 + DEFAULT_AUTO_WIDTH, 'Checkbox 右边缘应该正确计算');
    assertEqual(textBounds.right, 200 + 150, 'Text 右边缘应该正确计算');

    const maxRight = Math.max(checkboxBounds.right, textBounds.right);

    assertEqual(maxRight, 350, '最大右边缘应该为 350');
  });

  runner.test('场景: auto 宽度组件的对齐线吸附位置计算', () => {
    const autoComponent = createMockCheckboxComponent('checkbox-1');
    autoComponent.x = 100;
    autoComponent.y = 100;

    const targetComponent = createMockButtonComponent('btn-1', '目标按钮');
    targetComponent.x = 95;
    targetComponent.y = 200;
    targetComponent.width = 120;
    targetComponent.height = 44;

    const autoBounds = getComponentFullBounds(autoComponent);
    const targetBounds = getComponentFullBounds(targetComponent);

    const SNAP_TOLERANCE = 8;

    const leftDiff = Math.abs(autoBounds.x - targetBounds.x);
    const rightDiff = Math.abs(autoBounds.right - targetBounds.right);
    const centerDiff = Math.abs(autoBounds.centerX - targetBounds.centerX);

    assert(leftDiff <= SNAP_TOLERANCE, '左边缘差异应该在容差内');
    assertEqual(leftDiff, 5, '左边缘差异应该为 5');

    const snappedX = targetBounds.x;
    const snappedCenterX = snappedX + autoBounds.width / 2;

    assertEqual(snappedX, 95, '吸附后 x 应该为 95');
    assertEqual(snappedCenterX, 145, '吸附后水平中心应该为 145');
  });

  runner.test('场景: 兜底逻辑 - 组件未挂载时的安全值', () => {
    const minimalComponent: Partial<ComponentSchema> = {
      id: 'minimal-1',
      type: ComponentType.Text,
      props: {},
      styles: {},
    };

    const size = getComponentSize(minimalComponent as ComponentSchema);

    assertEqual(size.width, DEFAULT_AUTO_WIDTH, '宽度应该使用默认值');
    assertEqual(size.height, DEFAULT_AUTO_HEIGHT, '高度应该使用默认值');
    assert(size.width >= COMPONENT_MIN_SIZE.WIDTH, '宽度应该大于等于最小尺寸');
    assert(size.height >= COMPONENT_MIN_SIZE.HEIGHT, '高度应该大于等于最小尺寸');
  });

  runner.test('场景: 多选对齐操作中 Checkbox 组件的位置计算', () => {
    const checkbox = createMockCheckboxComponent('checkbox-1');
    checkbox.x = 100;
    checkbox.y = 100;
    checkbox.width = 'auto';
    checkbox.height = 'auto';

    const textComponent = createMockTextComponent('text-1', '文本');
    textComponent.x = 300;
    textComponent.y = 100;
    textComponent.width = 200;
    textComponent.height = 50;

    const components = [checkbox, textComponent];

    let minX = Infinity;
    let maxRight = -Infinity;
    let minY = Infinity;
    let maxBottom = -Infinity;

    for (const comp of components) {
      const bounds = getComponentFullBounds(comp);
      
      if (bounds.x < minX) minX = bounds.x;
      if (bounds.right > maxRight) maxRight = bounds.right;
      if (bounds.y < minY) minY = bounds.y;
      if (bounds.bottom > maxBottom) maxBottom = bounds.bottom;
    }

    assertEqual(minX, 100, '最小 x 应该为 100');
    assertEqual(maxRight, 300 + 200, '最大右边缘应该为 500');
    assertEqual(minY, 100, '最小 y 应该为 100');
    assertEqual(maxBottom, Math.max(100 + DEFAULT_AUTO_HEIGHT, 100 + 50), '最大下边缘应该正确');

    const checkboxWidth = getComponentSize(checkbox).width;
    const newXForRightAlign = maxRight - checkboxWidth;

    assertEqual(newXForRightAlign, 500 - DEFAULT_AUTO_WIDTH, '右对齐后 Checkbox 的新 x 位置');
  });

  runner.test('ComponentSize 接口验证', () => {
    const size: ComponentSize = {
      width: 200,
      height: 100,
    };

    assertEqual(size.width, 200, '宽度应该为 200');
    assertEqual(size.height, 100, '高度应该为 100');
  });

  runner.test('ComponentBounds 接口验证', () => {
    const bounds: ComponentBounds = {
      id: 'test-1',
      x: 50,
      y: 30,
      width: 200,
      height: 100,
      centerX: 150,
      centerY: 80,
      right: 250,
      bottom: 130,
    };

    assertEqual(bounds.id, 'test-1', 'ID 应该匹配');
    assertEqual(bounds.x, 50, 'x 应该为 50');
    assertEqual(bounds.y, 30, 'y 应该为 30');
    assertEqual(bounds.width, 200, '宽度应该为 200');
    assertEqual(bounds.height, 100, '高度应该为 100');
    assertEqual(bounds.centerX, 150, '水平中心应该为 150');
    assertEqual(bounds.centerY, 80, '垂直中心应该为 80');
    assertEqual(bounds.right, 250, '右边缘应该为 250');
    assertEqual(bounds.bottom, 130, '下边缘应该为 130');
  });

  runner.test('边界: 宽度为 0 应该被限制为最小尺寸', () => {
    const component = createMockTextComponent('text-1', '测试');
    component.width = 0;
    component.height = 0;

    const size = getComponentSize(component);

    assertEqual(size.width, COMPONENT_MIN_SIZE.WIDTH, '0 宽度应该被限制为最小尺寸');
    assertEqual(size.height, COMPONENT_MIN_SIZE.HEIGHT, '0 高度应该被限制为最小尺寸');
  });

  runner.test('边界: 负数值尺寸应该被限制为最小尺寸', () => {
    const component = createMockTextComponent('text-1', '测试');
    component.width = -100;
    component.height = -50;

    const size = getComponentSize(component);

    assertEqual(size.width, COMPONENT_MIN_SIZE.WIDTH, '负宽度应该被限制为最小尺寸');
    assertEqual(size.height, COMPONENT_MIN_SIZE.HEIGHT, '负高度应该被限制为最小尺寸');
  });

  runner.test('边界: NaN 尺寸应该使用默认值', () => {
    const component = createMockTextComponent('text-1', '测试');
    (component.width as any) = NaN;
    (component.height as any) = NaN;

    const size = getComponentSize(component);

    assertEqual(size.width, DEFAULT_AUTO_WIDTH, 'NaN 宽度应该使用默认值');
    assertEqual(size.height, DEFAULT_AUTO_HEIGHT, 'NaN 高度应该使用默认值');
  });

  return runner;
};

export default runSizeTests;
