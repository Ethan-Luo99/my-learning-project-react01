/**
 * 高级业务组件测试
 * 测试 Card、Divider、Tabs、Accordion、Modal 五个组件
 */

import {
  TestRunner,
  assert,
  assertEqual,
  assertNotNull,
  createMockCardComponent,
  createMockDividerComponent,
  createMockTabsComponent,
  createMockTabPaneComponent,
  createMockAccordionComponent,
  createMockAccordionItemComponent,
  createMockModalComponent,
  createMockTextComponent,
  createMockButtonComponent,
  countComponents,
} from '@/utils/test-helpers';
import { ComponentType } from '@/types/component';
import { DEFAULT_COMPONENT_CONFIGS } from '@/constants/mockData';

export const runAdvancedComponentsTests = (): TestRunner => {
  const runner = new TestRunner();

  runner.beforeAll(() => {
    console.log('开始运行高级业务组件测试...');
  });

  runner.afterAll(() => {
    console.log('高级业务组件测试完成');
  });

  // ============================================
  // Card 组件测试
  // ============================================
  runner.test('Card 组件: 基础属性验证', () => {
    const card = createMockCardComponent('card-1');

    assertEqual(card.id, 'card-1', 'ID 应该匹配');
    assertEqual(card.type, ComponentType.Card, '类型应该是 Card');
    assertEqual(card.width, 350, '默认宽度应该是 350');
    assertEqual(card.props.shadow, 'md', '默认阴影是 md');
    assertEqual(card.props.padding, 'md', '默认内边距是 md');
    assertEqual(card.props.bordered, true, '默认有边框');
    assertEqual(card.props.headerTitle, '卡片标题', '默认标题');
    assertEqual(card.props.hoverable, false, '默认不可悬停');
  });

  runner.test('Card 组件: 自定义属性', () => {
    const card = createMockCardComponent('card-1', [], {
      headerTitle: '自定义标题',
      shadow: 'lg',
      bordered: false,
      hoverable: true,
    });

    assertEqual(card.props.headerTitle, '自定义标题', '自定义标题');
    assertEqual(card.props.shadow, 'lg', '大阴影');
    assertEqual(card.props.bordered, false, '无边框');
    assertEqual(card.props.hoverable, true, '可悬停');
  });

  runner.test('Card 组件: 支持子组件嵌套', () => {
    const text1 = createMockTextComponent('text-1', '卡片内容1');
    const text2 = createMockTextComponent('text-2', '卡片内容2');
    const button = createMockButtonComponent('btn-1', '卡片按钮');

    const card = createMockCardComponent('card-1', [text1, text2, button]);

    assertNotNull(card.children, 'children 应该存在');
    assertEqual(card.children!.length, 3, '应该有 3 个子组件');
    assertEqual(card.children![0].id, 'text-1', '第一个子组件 ID');
    assertEqual(card.children![1].type, ComponentType.Text, '第二个子组件类型');
    assertEqual(card.children![2].type, ComponentType.Button, '第三个子组件类型');
  });

  runner.test('Card 组件: 支持多层嵌套', () => {
    const nestedText = createMockTextComponent('nested-text', '嵌套文本');
    const innerCard = createMockCardComponent('inner-card', [nestedText], {
      headerTitle: '内嵌卡片',
    });
    const outerCard = createMockCardComponent('outer-card', [innerCard], {
      headerTitle: '外层卡片',
    });

    const totalComponents = countComponents([outerCard]);
    assertEqual(totalComponents, 3, '总共有 3 个组件（外层 Card + 内层 Card + Text）');
  });

  // ============================================
  // Divider 组件测试
  // ============================================
  runner.test('Divider 组件: 基础属性验证', () => {
    const divider = createMockDividerComponent('divider-1');

    assertEqual(divider.id, 'divider-1', 'ID 应该匹配');
    assertEqual(divider.type, ComponentType.Divider, '类型应该是 Divider');
    assertEqual(divider.width, '100%', '默认宽度 100%');
    assertEqual(divider.props.direction, 'horizontal', '默认水平方向');
    assertEqual(divider.props.textPosition, 'center', '默认文字居中');
    assertEqual(divider.props.dashed, false, '默认不是虚线');
    assertEqual(divider.props.plain, false, '默认不是朴素样式');
  });

  runner.test('Divider 组件: 水平方向', () => {
    const divider = createMockDividerComponent('divider-1', {
      direction: 'horizontal',
      children: '分割线文字',
    });

    assertEqual(divider.props.direction, 'horizontal', '水平方向');
    assertEqual(divider.props.children, '分割线文字', '分割线文字');
  });

  runner.test('Divider 组件: 垂直方向', () => {
    const verticalDivider = createMockDividerComponent('divider-v', {
      direction: 'vertical',
    });

    assertEqual(verticalDivider.props.direction, 'vertical', '垂直方向');
  });

  runner.test('Divider 组件: 虚线样式', () => {
    const dashedDivider = createMockDividerComponent('divider-dashed', {
      dashed: true,
    });

    assertEqual(dashedDivider.props.dashed, true, '虚线样式');
  });

  runner.test('Divider 组件: 文字位置', () => {
    const leftDivider = createMockDividerComponent('divider-left', {
      children: '左侧文字',
      textPosition: 'left',
    });
    const rightDivider = createMockDividerComponent('divider-right', {
      children: '右侧文字',
      textPosition: 'right',
    });

    assertEqual(leftDivider.props.textPosition, 'left', '左侧文字');
    assertEqual(rightDivider.props.textPosition, 'right', '右侧文字');
  });

  // ============================================
  // Tabs 组件测试
  // ============================================
  runner.test('Tabs 组件: 基础属性验证', () => {
    const tabs = createMockTabsComponent('tabs-1');

    assertEqual(tabs.id, 'tabs-1', 'ID 应该匹配');
    assertEqual(tabs.type, ComponentType.Tabs, '类型应该是 Tabs');
    assertEqual(tabs.width, 500, '默认宽度 500');
    assertEqual(tabs.props.tabPosition, 'top', '默认标签位置在顶部');
    assertEqual(tabs.props.type, 'line', '默认标签类型是 line');
    assertEqual(tabs.props.animated, true, '默认开启动画');
    assertEqual(tabs.props.addable, false, '默认不可添加标签');
  });

  runner.test('Tabs 组件: 自定义属性', () => {
    const tabs = createMockTabsComponent('tabs-1', [], {
      tabPosition: 'left',
      type: 'card',
      animated: false,
    });

    assertEqual(tabs.props.tabPosition, 'left', '左侧标签');
    assertEqual(tabs.props.type, 'card', '卡片式标签');
    assertEqual(tabs.props.animated, false, '关闭动画');
  });

  runner.test('Tabs 组件: 包含多个 TabPane', () => {
    const tabPane1 = createMockTabPaneComponent('pane-1', 'pane1', '标签一', [
      createMockTextComponent('text-1', '内容一'),
    ]);
    const tabPane2 = createMockTabPaneComponent('pane-2', 'pane2', '标签二', [
      createMockTextComponent('text-2', '内容二'),
    ]);
    const tabPane3 = createMockTabPaneComponent('pane-3', 'pane3', '标签三', [
      createMockButtonComponent('btn-1', '按钮'),
    ]);

    const tabs = createMockTabsComponent('tabs-1', [tabPane1, tabPane2, tabPane3]);

    assertNotNull(tabs.children, 'children 应该存在');
    assertEqual(tabs.children!.length, 3, '应该有 3 个 TabPane');
    assertEqual(tabs.children![0].type, ComponentType.TabPane, '子组件是 TabPane');
    assertEqual(tabs.children![0].props.tabKey, 'pane1', '第一个 TabPane 的 tabKey');
    assertEqual(tabs.children![1].props.title, '标签二', '第二个 TabPane 的 title');
  });

  runner.test('TabPane 组件: 基础属性验证', () => {
    const tabPane = createMockTabPaneComponent('pane-1', 'tab1', '我的标签');

    assertEqual(tabPane.id, 'pane-1', 'ID 应该匹配');
    assertEqual(tabPane.type, ComponentType.TabPane, '类型应该是 TabPane');
    assertEqual(tabPane.props.tabKey, 'tab1', 'tabKey');
    assertEqual(tabPane.props.title, '我的标签', 'title');
    assertEqual(tabPane.props.disabled, false, '默认不禁用');
    assertEqual(tabPane.props.closable, false, '默认不可关闭');
  });

  runner.test('TabPane 组件: 禁用状态', () => {
    const disabledPane = createMockTabPaneComponent('pane-disabled', 'disabled', '禁用标签', [], {
      disabled: true,
    });

    assertEqual(disabledPane.props.disabled, true, '禁用状态');
  });

  runner.test('TabPane 组件: 支持子组件', () => {
    const textContent = createMockTextComponent('content-text', '标签页内容');
    const buttonContent = createMockButtonComponent('content-btn', '操作按钮');

    const tabPane = createMockTabPaneComponent('pane-1', 'pane1', '标签', [
      textContent,
      buttonContent,
    ]);

    assertNotNull(tabPane.children, 'children 应该存在');
    assertEqual(tabPane.children!.length, 2, '有 2 个子组件');
  });

  // ============================================
  // Accordion 组件测试
  // ============================================
  runner.test('Accordion 组件: 基础属性验证', () => {
    const accordion = createMockAccordionComponent('accordion-1');

    assertEqual(accordion.id, 'accordion-1', 'ID 应该匹配');
    assertEqual(accordion.type, ComponentType.Accordion, '类型应该是 Accordion');
    assertEqual(accordion.width, 500, '默认宽度 500');
    assertEqual(accordion.props.multiple, false, '默认不允许多个展开');
    assertEqual(accordion.props.bordered, true, '默认有边框');
    assertEqual(accordion.props.ghost, false, '默认不是幽灵模式');
  });

  runner.test('Accordion 组件: 多展开模式', () => {
    const multiAccordion = createMockAccordionComponent('accordion-1', [], {
      multiple: true,
      bordered: false,
      ghost: true,
    });

    assertEqual(multiAccordion.props.multiple, true, '允许多个展开');
    assertEqual(multiAccordion.props.bordered, false, '无边框');
    assertEqual(multiAccordion.props.ghost, true, '幽灵模式');
  });

  runner.test('Accordion 组件: 包含多个 AccordionItem', () => {
    const item1 = createMockAccordionItemComponent('item-1', 'item1', '面板一', [
      createMockTextComponent('text-1', '内容一'),
    ]);
    const item2 = createMockAccordionItemComponent('item-2', 'item2', '面板二', [
      createMockTextComponent('text-2', '内容二'),
    ]);

    const accordion = createMockAccordionComponent('accordion-1', [item1, item2]);

    assertNotNull(accordion.children, 'children 应该存在');
    assertEqual(accordion.children!.length, 2, '应该有 2 个 AccordionItem');
    assertEqual(accordion.children![0].type, ComponentType.AccordionItem, '子组件是 AccordionItem');
    assertEqual(accordion.children![0].props.itemKey, 'item1', '第一个 itemKey');
    assertEqual(accordion.children![1].props.title, '面板二', '第二个 title');
  });

  runner.test('AccordionItem 组件: 基础属性验证', () => {
    const item = createMockAccordionItemComponent('item-1', 'panel1', '我的面板');

    assertEqual(item.id, 'item-1', 'ID 应该匹配');
    assertEqual(item.type, ComponentType.AccordionItem, '类型应该是 AccordionItem');
    assertEqual(item.props.itemKey, 'panel1', 'itemKey');
    assertEqual(item.props.title, '我的面板', 'title');
    assertEqual(item.props.disabled, false, '默认不禁用');
    assertEqual(item.props.defaultExpanded, false, '默认不展开');
  });

  runner.test('AccordionItem 组件: 默认展开', () => {
    const expandedItem = createMockAccordionItemComponent('item-1', 'p1', '默认展开', [], {
      defaultExpanded: true,
    });

    assertEqual(expandedItem.props.defaultExpanded, true, '默认展开');
  });

  runner.test('AccordionItem 组件: 禁用状态', () => {
    const disabledItem = createMockAccordionItemComponent('item-1', 'p1', '禁用面板', [], {
      disabled: true,
    });

    assertEqual(disabledItem.props.disabled, true, '禁用状态');
  });

  runner.test('AccordionItem 组件: 支持子组件', () => {
    const contentText = createMockTextComponent('content', '折叠面板内容');
    const contentBtn = createMockButtonComponent('btn', '操作');

    const item = createMockAccordionItemComponent('item-1', 'p1', '面板', [
      contentText,
      contentBtn,
    ]);

    assertNotNull(item.children, 'children 应该存在');
    assertEqual(item.children!.length, 2, '有 2 个子组件');
  });

  // ============================================
  // Modal 组件测试
  // ============================================
  runner.test('Modal 组件: 基础属性验证', () => {
    const modal = createMockModalComponent('modal-1');

    assertEqual(modal.id, 'modal-1', 'ID 应该匹配');
    assertEqual(modal.type, ComponentType.Modal, '类型应该是 Modal');
    assertEqual(modal.width, 520, '默认宽度 520');
    assertEqual(modal.props.visible, false, '默认隐藏');
    assertEqual(modal.props.title, '弹窗标题', '默认标题');
    assertEqual(modal.props.width, 520, '弹窗内部宽度 520');
    assertEqual(modal.props.centered, true, '默认垂直居中');
    assertEqual(modal.props.closable, true, '默认显示关闭按钮');
    assertEqual(modal.props.maskClosable, true, '默认点击遮罩可关闭');
    assertEqual(modal.props.closeOnEscape, true, '默认 ESC 可关闭');
    assertEqual(modal.props.okText, '确定', '确定按钮文本');
    assertEqual(modal.props.cancelText, '取消', '取消按钮文本');
    assertEqual(modal.props.okVisible, true, '显示确定按钮');
    assertEqual(modal.props.cancelVisible, true, '显示取消按钮');
    assertEqual(modal.props.destroyOnClose, false, '关闭时不销毁');
    assertEqual(modal.props.zIndex, 1000, '默认 zIndex');
  });

  runner.test('Modal 组件: 自定义属性', () => {
    const modal = createMockModalComponent('modal-1', [], {
      visible: true,
      title: '自定义弹窗标题',
      width: 600,
      centered: false,
      closable: false,
      maskClosable: false,
      okText: '确认',
      cancelText: '放弃',
      okVisible: true,
      cancelVisible: false,
      destroyOnClose: true,
      zIndex: 2000,
    });

    assertEqual(modal.props.visible, true, '可见状态');
    assertEqual(modal.props.title, '自定义弹窗标题', '自定义标题');
    assertEqual(modal.props.width, 600, '自定义宽度');
    assertEqual(modal.props.centered, false, '不垂直居中');
    assertEqual(modal.props.closable, false, '不显示关闭按钮');
    assertEqual(modal.props.maskClosable, false, '点击遮罩不可关闭');
    assertEqual(modal.props.okText, '确认', '确定按钮文本');
    assertEqual(modal.props.cancelText, '放弃', '取消按钮文本');
    assertEqual(modal.props.cancelVisible, false, '隐藏取消按钮');
    assertEqual(modal.props.destroyOnClose, true, '关闭时销毁');
    assertEqual(modal.props.zIndex, 2000, '自定义 zIndex');
  });

  runner.test('Modal 组件: 支持子组件嵌套', () => {
    const modalText = createMockTextComponent('modal-text', '弹窗内容');
    const modalInput = createMockTextComponent('modal-input', '表单输入区');
    const modalBtn = createMockButtonComponent('modal-btn', '弹窗内按钮');

    const modal = createMockModalComponent('modal-1', [
      modalText,
      modalInput,
      modalBtn,
    ]);

    assertNotNull(modal.children, 'children 应该存在');
    assertEqual(modal.children!.length, 3, '有 3 个子组件');
  });

  // ============================================
  // DEFAULT_COMPONENT_CONFIGS 验证
  // ============================================
  runner.test('DEFAULT_COMPONENT_CONFIGS: 所有高级组件配置存在', () => {
    const advancedComponentTypes = [
      ComponentType.Card,
      ComponentType.Divider,
      ComponentType.Tabs,
      ComponentType.TabPane,
      ComponentType.Accordion,
      ComponentType.AccordionItem,
      ComponentType.Modal,
    ];

    advancedComponentTypes.forEach((type) => {
      assertNotNull(DEFAULT_COMPONENT_CONFIGS[type], `${type} 配置应该存在`);
      assertEqual(DEFAULT_COMPONENT_CONFIGS[type].type, type, `${type} 配置类型匹配`);
    });
  });

  runner.test('DEFAULT_COMPONENT_CONFIGS: Card 配置验证', () => {
    const config = DEFAULT_COMPONENT_CONFIGS[ComponentType.Card];

    assertEqual(config.label, '卡片', '标签应该正确');
    assertEqual(config.defaultWidth, 350, '默认宽度');
    assertEqual(config.defaultProps.shadow, 'md', '默认阴影');
    assertEqual(config.defaultProps.headerTitle, '卡片标题', '默认标题');
  });

  runner.test('DEFAULT_COMPONENT_CONFIGS: Divider 配置验证', () => {
    const config = DEFAULT_COMPONENT_CONFIGS[ComponentType.Divider];

    assertEqual(config.label, '分割线', '标签应该正确');
    assertEqual(config.defaultWidth, '100%', '默认宽度');
    assertEqual(config.defaultProps.direction, 'horizontal', '默认水平方向');
  });

  runner.test('DEFAULT_COMPONENT_CONFIGS: Tabs 配置验证', () => {
    const config = DEFAULT_COMPONENT_CONFIGS[ComponentType.Tabs];

    assertEqual(config.label, '标签页', '标签应该正确');
    assertEqual(config.defaultWidth, 500, '默认宽度');
    assertEqual(config.defaultProps.tabPosition, 'top', '默认标签位置');
    assertEqual(config.defaultProps.type, 'line', '默认标签类型');
  });

  runner.test('DEFAULT_COMPONENT_CONFIGS: TabPane 配置验证', () => {
    const config = DEFAULT_COMPONENT_CONFIGS[ComponentType.TabPane];

    assertEqual(config.label, '标签面板', '标签应该正确');
    assertEqual(config.defaultWidth, '100%', '默认宽度');
    assertEqual(config.defaultProps.tabKey, 'pane1', '默认 tabKey');
    assertEqual(config.defaultProps.title, '标签一', '默认标题');
  });

  runner.test('DEFAULT_COMPONENT_CONFIGS: Accordion 配置验证', () => {
    const config = DEFAULT_COMPONENT_CONFIGS[ComponentType.Accordion];

    assertEqual(config.label, '折叠面板', '标签应该正确');
    assertEqual(config.defaultWidth, 500, '默认宽度');
    assertEqual(config.defaultProps.multiple, false, '默认不允许多个展开');
    assertEqual(config.defaultProps.bordered, true, '默认有边框');
  });

  runner.test('DEFAULT_COMPONENT_CONFIGS: AccordionItem 配置验证', () => {
    const config = DEFAULT_COMPONENT_CONFIGS[ComponentType.AccordionItem];

    assertEqual(config.label, '折叠项', '标签应该正确');
    assertEqual(config.defaultWidth, '100%', '默认宽度');
    assertEqual(config.defaultProps.itemKey, 'item1', '默认 itemKey');
    assertEqual(config.defaultProps.title, '面板一', '默认标题');
  });

  runner.test('DEFAULT_COMPONENT_CONFIGS: Modal 配置验证', () => {
    const config = DEFAULT_COMPONENT_CONFIGS[ComponentType.Modal];

    assertEqual(config.label, '弹窗', '标签应该正确');
    assertEqual(config.defaultWidth, 520, '默认宽度');
    assertEqual(config.defaultProps.visible, false, '默认隐藏');
    assertEqual(config.defaultProps.title, '弹窗标题', '默认标题');
    assertEqual(config.defaultProps.okText, '确定', '确定按钮文本');
    assertEqual(config.defaultProps.cancelText, '取消', '取消按钮文本');
  });

  return runner;
};

if (typeof window !== 'undefined') {
  const win = window as unknown as Record<string, unknown>;
  win.runAdvancedComponentsTests = runAdvancedComponentsTests;
}

export default runAdvancedComponentsTests;
