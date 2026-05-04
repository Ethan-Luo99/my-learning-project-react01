/**
 * isContainerComponent 函数回归测试
 * 
 * 测试目的：
 * 1. 验证 isContainerComponent 从共享模块导入后功能正确
 * 2. 验证所有容器类型都被正确识别
 * 3. 验证非容器类型不被误判
 * 
 * 背景：
 * - 原代码中 isContainerComponent 在三个文件中重复定义
 * - 已提取到 src/utils/component.ts 作为共享模块
 * - 以下文件从共享模块导入使用：
 *   - src/store/useBuilderStore.ts
 *   - src/components/builder/ComponentRenderer/index.tsx
 *   - src/components/builder/DndContext.tsx
 */

import { ComponentType, type ComponentSchema } from '@/types/component';
import { isContainerComponent } from './component';
import {
  TestRunner,
  assert,
  assertEqual,
  createMockTextComponent,
  createMockButtonComponent,
  createMockContainerComponent,
  createMockCardComponent,
  createMockTabsComponent,
  createMockTabPaneComponent,
  createMockAccordionComponent,
  createMockAccordionItemComponent,
  createMockModalComponent,
  createMockFormComponent,
  createMockFormItemComponent,
  createMockInputComponent,
  createMockDividerComponent,
} from './test-helpers';

const createMockComponentWithType = (type: ComponentType): ComponentSchema => {
  const baseProps = {
    id: `test-${type.toLowerCase()}`,
    type,
    x: 10,
    y: 10,
    width: 100,
    height: 40,
    props: {},
    styles: {},
  };

  const containerTypes = [
    ComponentType.Container,
    ComponentType.Card,
    ComponentType.Tabs,
    ComponentType.TabPane,
    ComponentType.Accordion,
    ComponentType.AccordionItem,
    ComponentType.Modal,
    ComponentType.Form,
    ComponentType.FormItem,
  ];

  if (containerTypes.includes(type)) {
    return {
      ...baseProps,
      children: [],
    } as ComponentSchema;
  }

  return baseProps as ComponentSchema;
};

export const runComponentUtilsTests = (): TestRunner => {
  const runner = new TestRunner();

  runner.beforeAll(() => {
    console.log('开始运行 Component Utils 回归测试...');
    console.log('测试目标: isContainerComponent 函数');
  });

  runner.test('容器类型: Container 应该被识别为容器组件', () => {
    const component = createMockContainerComponent('test-container', []);
    assert(isContainerComponent(component), 'Container 应该是容器组件');
  });

  runner.test('容器类型: Card 应该被识别为容器组件', () => {
    const component = createMockCardComponent('test-card', []);
    assert(isContainerComponent(component), 'Card 应该是容器组件');
  });

  runner.test('容器类型: Tabs 应该被识别为容器组件', () => {
    const component = createMockTabsComponent('test-tabs', []);
    assert(isContainerComponent(component), 'Tabs 应该是容器组件');
  });

  runner.test('容器类型: TabPane 应该被识别为容器组件', () => {
    const component = createMockTabPaneComponent('test-tabpane', 'pane1', '标签一', []);
    assert(isContainerComponent(component), 'TabPane 应该是容器组件');
  });

  runner.test('容器类型: Accordion 应该被识别为容器组件', () => {
    const component = createMockAccordionComponent('test-accordion', []);
    assert(isContainerComponent(component), 'Accordion 应该是容器组件');
  });

  runner.test('容器类型: AccordionItem 应该被识别为容器组件', () => {
    const component = createMockAccordionItemComponent('test-accordion-item', 'item1', '面板一', []);
    assert(isContainerComponent(component), 'AccordionItem 应该是容器组件');
  });

  runner.test('容器类型: Modal 应该被识别为容器组件', () => {
    const component = createMockModalComponent('test-modal', []);
    assert(isContainerComponent(component), 'Modal 应该是容器组件');
  });

  runner.test('容器类型: Form 应该被识别为容器组件', () => {
    const component = createMockFormComponent('test-form', []);
    assert(isContainerComponent(component), 'Form 应该是容器组件');
  });

  runner.test('容器类型: FormItem 应该被识别为容器组件', () => {
    const component = createMockFormItemComponent('test-form-item', []);
    assert(isContainerComponent(component), 'FormItem 应该是容器组件');
  });

  runner.test('非容器类型: Text 不应该被识别为容器组件', () => {
    const component = createMockTextComponent('test-text', '测试文本');
    assert(!isContainerComponent(component), 'Text 不应该是容器组件');
  });

  runner.test('非容器类型: Button 不应该被识别为容器组件', () => {
    const component = createMockButtonComponent('test-btn', '按钮');
    assert(!isContainerComponent(component), 'Button 不应该是容器组件');
  });

  runner.test('非容器类型: Input 不应该被识别为容器组件', () => {
    const component = createMockInputComponent('test-input');
    assert(!isContainerComponent(component), 'Input 不应该是容器组件');
  });

  runner.test('非容器类型: Divider 不应该被识别为容器组件', () => {
    const component = createMockDividerComponent('test-divider');
    assert(!isContainerComponent(component), 'Divider 不应该是容器组件');
  });

  runner.test('边界测试: 所有容器类型全覆盖验证', () => {
    const containerTypes = [
      ComponentType.Container,
      ComponentType.Card,
      ComponentType.Tabs,
      ComponentType.TabPane,
      ComponentType.Accordion,
      ComponentType.AccordionItem,
      ComponentType.Modal,
      ComponentType.Form,
      ComponentType.FormItem,
    ];

    const nonContainerTypes = [
      ComponentType.Text,
      ComponentType.Button,
      ComponentType.Image,
      ComponentType.Divider,
      ComponentType.Input,
      ComponentType.Textarea,
      ComponentType.Select,
      ComponentType.Checkbox,
      ComponentType.CheckboxGroup,
      ComponentType.Radio,
      ComponentType.RadioGroup,
      ComponentType.Switch,
    ];

    containerTypes.forEach((type) => {
      const component = createMockComponentWithType(type);
      assert(
        isContainerComponent(component),
        `${type} 应该被识别为容器组件`
      );
    });

    nonContainerTypes.forEach((type) => {
      const component = createMockComponentWithType(type);
      assert(
        !isContainerComponent(component),
        `${type} 不应该被识别为容器组件`
      );
    });
  });

  runner.test('类型守卫: isContainerComponent 应该正确缩小类型', () => {
    const container = createMockContainerComponent('test-container', [
      createMockTextComponent('nested-text', '嵌套文本'),
    ]);

    if (isContainerComponent(container)) {
      assert(container.children !== undefined, '容器组件应该有 children 属性');
      assertEqual(container.children.length, 1, 'Container 应该有 1 个子组件');
    } else {
      assert(false, 'Container 应该被识别为容器组件');
    }
  });

  runner.test('回归验证: 有子组件的容器组件', () => {
    const nestedContainer = createMockContainerComponent('parent-container', [
      createMockContainerComponent('child-container', [
        createMockTextComponent('deep-text', '深层文本'),
      ]),
    ]);

    assert(isContainerComponent(nestedContainer), '父容器应该被识别');
    
    if (isContainerComponent(nestedContainer)) {
      const childContainer = nestedContainer.children[0];
      assert(isContainerComponent(childContainer), '子容器也应该被识别');
    }
  });

  runner.test('空容器: 空的容器组件仍应被识别', () => {
    const emptyContainer = createMockContainerComponent('empty-container', []);
    assert(isContainerComponent(emptyContainer), '空的 Container 仍应被识别为容器组件');
  });

  return runner;
};

if (typeof window !== 'undefined') {
  const win = window as unknown as Record<string, unknown>;
  win.runComponentUtilsTests = runComponentUtilsTests;
}

export default runComponentUtilsTests;
