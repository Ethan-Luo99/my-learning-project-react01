import { 
  ComponentType, 
  ClickEventType,
  type ComponentSchema, 
  type TextComponentSchema, 
  type ButtonComponentSchema, 
  type ContainerComponentSchema, 
  type CardComponentSchema,
  type DividerComponentSchema,
  type TabsComponentSchema,
  type TabPaneComponentSchema,
  type AccordionComponentSchema,
  type AccordionItemComponentSchema,
  type ModalComponentSchema,
  type InputComponentSchema, 
  type TextareaComponentSchema, 
  type SelectComponentSchema, 
  type CheckboxComponentSchema, 
  type CheckboxGroupComponentSchema, 
  type RadioComponentSchema, 
  type RadioGroupComponentSchema, 
  type SwitchComponentSchema, 
  type FormComponentSchema, 
  type FormItemComponentSchema,
  ActionType,
  EventType,
  type ComponentEvents,
  type EventConfig,
  type ActionConfig,
  type ClickEventConfig,
} from '@/types/component';
import { generateId } from './id';

export const createMockTextComponent = (id: string, text: string = '测试文本'): TextComponentSchema => ({
  id,
  type: ComponentType.Text,
  x: 10,
  y: 10,
  width: 200,
  height: 'auto',
  props: {
    children: text,
    variant: 'body',
    weight: 'normal',
    color: 'default',
  },
  styles: {},
});

export const createMockButtonComponent = (id: string, label: string = '测试按钮'): ButtonComponentSchema => ({
  id,
  type: ComponentType.Button,
  x: 10,
  y: 50,
  width: 120,
  height: 44,
  props: {
    children: label,
    variant: 'primary',
    size: 'md',
  },
  styles: {},
});

export const createMockContainerComponent = (id: string, children: ComponentSchema[] = []): ContainerComponentSchema => ({
  id,
  type: ComponentType.Container,
  x: 10,
  y: 100,
  width: 400,
  height: 200,
  props: {
    direction: 'row',
    gap: 'md',
    align: 'center',
    justify: 'start',
    wrap: 'false',
    padding: 'md',
  },
  styles: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
  },
  children,
});

export const createMockCardComponent = (
  id: string,
  children: ComponentSchema[] = [],
  props: Partial<CardComponentSchema['props']> = {}
): CardComponentSchema => ({
  id,
  type: ComponentType.Card,
  x: 10,
  y: 100,
  width: 350,
  height: 'auto',
  props: {
    shadow: 'md',
    padding: 'md',
    bordered: true,
    headerTitle: '卡片标题',
    hoverable: false,
    ...props,
  },
  styles: {
    minHeight: '150px',
  },
  children,
});

export const createMockDividerComponent = (
  id: string,
  props: Partial<DividerComponentSchema['props']> = {}
): DividerComponentSchema => ({
  id,
  type: ComponentType.Divider,
  x: 10,
  y: 10,
  width: '100%',
  height: 'auto',
  props: {
    direction: 'horizontal',
    textPosition: 'center',
    dashed: false,
    plain: false,
    children: '',
    ...props,
  },
  styles: {},
});

export const createMockTabsComponent = (
  id: string,
  children: ComponentSchema[] = [],
  props: Partial<TabsComponentSchema['props']> = {}
): TabsComponentSchema => ({
  id,
  type: ComponentType.Tabs,
  x: 10,
  y: 10,
  width: 500,
  height: 'auto',
  props: {
    tabPosition: 'top',
    type: 'line',
    animated: true,
    addable: false,
    ...props,
  },
  styles: {
    minHeight: '200px',
  },
  children,
});

export const createMockTabPaneComponent = (
  id: string,
  tabKey: string = 'pane1',
  title: string = '标签一',
  children: ComponentSchema[] = [],
  props: Partial<TabPaneComponentSchema['props']> = {}
): TabPaneComponentSchema => ({
  id,
  type: ComponentType.TabPane,
  x: 0,
  y: 0,
  width: '100%',
  height: 'auto',
  props: {
    tabKey,
    title,
    disabled: false,
    closable: false,
    ...props,
  },
  styles: {},
  children,
});

export const createMockAccordionComponent = (
  id: string,
  children: ComponentSchema[] = [],
  props: Partial<AccordionComponentSchema['props']> = {}
): AccordionComponentSchema => ({
  id,
  type: ComponentType.Accordion,
  x: 10,
  y: 10,
  width: 500,
  height: 'auto',
  props: {
    multiple: false,
    bordered: true,
    ghost: false,
    ...props,
  },
  styles: {
    minHeight: '100px',
  },
  children,
});

export const createMockAccordionItemComponent = (
  id: string,
  itemKey: string = 'item1',
  title: string = '面板一',
  children: ComponentSchema[] = [],
  props: Partial<AccordionItemComponentSchema['props']> = {}
): AccordionItemComponentSchema => ({
  id,
  type: ComponentType.AccordionItem,
  x: 0,
  y: 0,
  width: '100%',
  height: 'auto',
  props: {
    itemKey,
    title,
    disabled: false,
    defaultExpanded: false,
    ...props,
  },
  styles: {},
  children,
});

export const createMockModalComponent = (
  id: string,
  children: ComponentSchema[] = [],
  props: Partial<ModalComponentSchema['props']> = {}
): ModalComponentSchema => ({
  id,
  type: ComponentType.Modal,
  x: 10,
  y: 10,
  width: 520,
  height: 'auto',
  props: {
    visible: false,
    title: '弹窗标题',
    width: 520,
    centered: true,
    closable: true,
    maskClosable: true,
    closeOnEscape: true,
    okText: '确定',
    cancelText: '取消',
    okVisible: true,
    cancelVisible: true,
    destroyOnClose: false,
    zIndex: 1000,
    ...props,
  },
  styles: {},
  children,
});

export const createMockInputComponent = (
  id: string,
  props: Partial<InputComponentSchema['props']> = {}
): InputComponentSchema => ({
  id,
  type: ComponentType.Input,
  x: 10,
  y: 10,
  width: 300,
  height: 44,
  props: {
    type: 'text',
    placeholder: '请输入内容',
    value: '',
    disabled: false,
    readOnly: false,
    clearable: false,
    error: false,
    ...props,
  },
  styles: {},
});

export const createMockTextareaComponent = (
  id: string,
  props: Partial<TextareaComponentSchema['props']> = {}
): TextareaComponentSchema => ({
  id,
  type: ComponentType.Textarea,
  x: 10,
  y: 10,
  width: 350,
  height: 'auto',
  props: {
    rows: 4,
    placeholder: '请输入内容',
    resize: 'vertical',
    value: '',
    disabled: false,
    readOnly: false,
    showCount: false,
    error: false,
    ...props,
  },
  styles: {},
});

export const createMockSelectComponent = (
  id: string,
  props: Partial<SelectComponentSchema['props']> = {}
): SelectComponentSchema => ({
  id,
  type: ComponentType.Select,
  x: 10,
  y: 10,
  width: 300,
  height: 44,
  props: {
    placeholder: '请选择',
    disabled: false,
    clearable: false,
    searchable: false,
    multiple: false,
    options: [
      { value: 'option1', label: '选项一' },
      { value: 'option2', label: '选项二' },
      { value: 'option3', label: '选项三' },
    ],
    value: undefined,
    ...props,
  },
  styles: {},
});

export const createMockCheckboxComponent = (
  id: string,
  props: Partial<CheckboxComponentSchema['props']> = {}
): CheckboxComponentSchema => ({
  id,
  type: ComponentType.Checkbox,
  x: 10,
  y: 10,
  width: 'auto',
  height: 'auto',
  props: {
    checked: false,
    indeterminate: false,
    disabled: false,
    label: '选项',
    ...props,
  },
  styles: {},
});

export const createMockCheckboxGroupComponent = (
  id: string,
  props: Partial<CheckboxGroupComponentSchema['props']> = {}
): CheckboxGroupComponentSchema => ({
  id,
  type: ComponentType.CheckboxGroup,
  x: 10,
  y: 10,
  width: 250,
  height: 'auto',
  props: {
    options: [
      { value: 'option1', label: '选项一' },
      { value: 'option2', label: '选项二' },
      { value: 'option3', label: '选项三' },
    ],
    value: [],
    disabled: false,
    direction: 'column',
    gap: 'md',
    ...props,
  },
  styles: {},
});

export const createMockRadioComponent = (
  id: string,
  props: Partial<RadioComponentSchema['props']> = {}
): RadioComponentSchema => ({
  id,
  type: ComponentType.Radio,
  x: 10,
  y: 10,
  width: 'auto',
  height: 'auto',
  props: {
    checked: false,
    disabled: false,
    label: '选项',
    value: 'radio1',
    ...props,
  },
  styles: {},
});

export const createMockRadioGroupComponent = (
  id: string,
  props: Partial<RadioGroupComponentSchema['props']> = {}
): RadioGroupComponentSchema => ({
  id,
  type: ComponentType.RadioGroup,
  x: 10,
  y: 10,
  width: 250,
  height: 'auto',
  props: {
    options: [
      { value: 'option1', label: '选项一' },
      { value: 'option2', label: '选项二' },
      { value: 'option3', label: '选项三' },
    ],
    value: undefined,
    disabled: false,
    direction: 'column',
    gap: 'md',
    ...props,
  },
  styles: {},
});

export const createMockSwitchComponent = (
  id: string,
  props: Partial<SwitchComponentSchema['props']> = {}
): SwitchComponentSchema => ({
  id,
  type: ComponentType.Switch,
  x: 10,
  y: 10,
  width: 'auto',
  height: 'auto',
  props: {
    checked: false,
    defaultChecked: false,
    disabled: false,
    loading: false,
    size: 'md',
    ...props,
  },
  styles: {},
});

export const createMockFormComponent = (
  id: string,
  children: ComponentSchema[] = [],
  props: Partial<FormComponentSchema['props']> = {}
): FormComponentSchema => ({
  id,
  type: ComponentType.Form,
  x: 10,
  y: 10,
  width: 500,
  height: 'auto',
  props: {
    layout: 'vertical',
    labelWidth: 100,
    labelAlign: 'right',
    size: 'md',
    disabled: false,
    ...props,
  },
  styles: {
    padding: '16px',
  },
  children,
});

export const createMockFormItemComponent = (
  id: string,
  children: ComponentSchema[] = [],
  props: Partial<FormItemComponentSchema['props']> = {}
): FormItemComponentSchema => ({
  id,
  type: ComponentType.FormItem,
  x: 10,
  y: 10,
  width: 'auto',
  height: 'auto',
  props: {
    label: '标签',
    required: false,
    error: false,
    help: '',
    name: '',
    ...props,
  },
  styles: {},
  children,
});

export const createMockEmptyComponents = (): ComponentSchema[] => [];

export const createMockSingleComponent = (): ComponentSchema[] => [
  createMockTextComponent('text-1', '单个测试文本'),
];

export const createMockMultipleComponents = (): ComponentSchema[] => [
  createMockTextComponent('text-1', '文本1'),
  createMockButtonComponent('btn-1', '按钮1'),
  createMockTextComponent('text-2', '文本2'),
];

export const createMockNestedComponents = (): ComponentSchema[] => [
  createMockContainerComponent('container-1', [
    createMockTextComponent('nested-text-1', '嵌套文本'),
    createMockButtonComponent('nested-btn-1', '嵌套按钮'),
  ]),
  createMockTextComponent('outside-text', '外部文本'),
];

export const createMockComplexProject = (): ComponentSchema[] => [
  createMockTextComponent('hero-title', '欢迎使用低代码平台'),
  createMockButtonComponent('hero-btn', '立即开始'),
  createMockContainerComponent('feature-section', [
    createMockTextComponent('feature-1', '拖拽组件'),
    createMockTextComponent('feature-2', '实时预览'),
    createMockTextComponent('feature-3', '一键导出'),
  ]),
];

export const createMock3LevelNestedContainer = (): ComponentSchema[] => [
  createMockContainerComponent('level-1-container', [
    createMockTextComponent('level-1-text', '第一层文本'),
    createMockContainerComponent('level-2-container', [
      createMockButtonComponent('level-2-btn', '第二层按钮'),
      createMockContainerComponent('level-3-container', [
        createMockTextComponent('level-3-text', '第三层文本'),
        createMockButtonComponent('level-3-btn', '第三层按钮'),
      ]),
    ]),
    createMockTextComponent('level-1-text-2', '第一层底部文本'),
  ]),
];

export const createMockEmptyContainer = (): ComponentSchema[] => [
  createMockContainerComponent('empty-container', []),
];

export const createMockContainerWithMixedChildren = (): ComponentSchema[] => [
  createMockContainerComponent('mixed-container', [
    createMockTextComponent('text-1', '文本1'),
    createMockContainerComponent('nested-container', [
      createMockButtonComponent('btn-1', '嵌套按钮'),
    ]),
    createMockTextComponent('text-2', '文本2'),
  ]),
];

export const countComponents = (components: ComponentSchema[]): number => {
  let count = components.length;
  for (const comp of components) {
    if ('children' in comp && comp.children) {
      count += countComponents(comp.children);
    }
  }
  return count;
};

export const findComponentById = (
  components: ComponentSchema[],
  id: string
): ComponentSchema | null => {
  for (const comp of components) {
    if (comp.id === id) {
      return comp;
    }
    if ('children' in comp && comp.children) {
      const found = findComponentById(comp.children, id);
      if (found) return found;
    }
  }
  return null;
};

export const countContainerDepth = (components: ComponentSchema[]): number => {
  let maxDepth = 0;
  const countDepth = (comps: ComponentSchema[], currentDepth: number): void => {
    for (const comp of comps) {
      if ('children' in comp && comp.children && comp.children.length > 0) {
        maxDepth = Math.max(maxDepth, currentDepth + 1);
        countDepth(comp.children, currentDepth + 1);
      }
    }
  };
  countDepth(components, 1);
  return maxDepth;
};

export const STORAGE_PREFIX = 'lowcode_builder_project';
export const PROJECT_LIST_KEY = `${STORAGE_PREFIX}_list`;

export const getProjectKey = (id: string): string => `${STORAGE_PREFIX}_${id}`;

export const clearAllTestProjects = (): void => {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_PREFIX)) {
      keys.push(key);
    }
  }
  keys.forEach((key) => localStorage.removeItem(key));
};

export const getStorageSize = (): number => {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key) || '';
      total += key.length + value.length;
    }
  }
  return total;
};

export const fillLocalStorage = (targetSize: number): string => {
  const base64Char = 'A';
  let largeString = base64Char.repeat(100000);
  let count = 0;
  
  while (true) {
    try {
      const key = `fill_test_${count}`;
      localStorage.setItem(key, largeString);
      count++;
    } catch {
      break;
    }
  }
  
  return `已填充 ${count} 个大块数据`;
};

export const clearFillData = (): void => {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('fill_test_')) {
      keys.push(key);
    }
  }
  keys.forEach((key) => localStorage.removeItem(key));
};

export interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  error?: unknown;
}

export class TestRunner {
  private results: TestResult[] = [];
  private testCount = 0;
  private passedCount = 0;

  beforeAll(callback: () => void): void {
    callback();
  }

  afterAll(callback: () => void): void {
    callback();
  }

  beforeEach(callback: () => void): void {
    callback();
  }

  test(name: string, testFn: () => void | Promise<void>): void {
    this.testCount++;
    try {
      const result = testFn();
      if (result instanceof Promise) {
        console.warn(`Test "${name}" is async but not awaited in simple test runner`);
      }
      this.results.push({ name, passed: true, message: 'Passed' });
      this.passedCount++;
    } catch (error) {
      this.results.push({ 
        name, 
        passed: false, 
        message: error instanceof Error ? error.message : String(error),
        error 
      });
    }
  }

  getResults(): TestResult[] {
    return [...this.results];
  }

  getSummary(): { total: number; passed: number; failed: number } {
    return {
      total: this.testCount,
      passed: this.passedCount,
      failed: this.testCount - this.passedCount,
    };
  }

  printSummary(): void {
    const summary = this.getSummary();
    console.log('='.repeat(60));
    console.log('测试结果汇总');
    console.log('='.repeat(60));
    
    this.results.forEach((r) => {
      const status = r.passed ? '✓' : '✗';
      console.log(`${status} ${r.name}`);
      if (!r.passed) {
        console.log(`   错误: ${r.message}`);
      }
    });

    console.log('='.repeat(60));
    console.log(`总计: ${summary.total}, 通过: ${summary.passed}, 失败: ${summary.failed}`);
    console.log('='.repeat(60));
  }
}

export const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(message);
  }
};

export const assertEqual = <T>(actual: T, expected: T, message: string): void => {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(`${message}\n  实际: ${actualStr}\n  期望: ${expectedStr}`);
  }
};

export const assertNotNull = (value: unknown, message: string): void => {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
};

export const assertThrows = (fn: () => void, expectedMessage?: string): void => {
  let threw = false;
  let actualError: Error | null = null;
  
  try {
    fn();
  } catch (error) {
    threw = true;
    actualError = error instanceof Error ? error : new Error(String(error));
  }
  
  if (!threw) {
    throw new Error('期望抛出错误但没有抛出');
  }
  
  if (expectedMessage && actualError && !actualError.message.includes(expectedMessage)) {
    throw new Error(`错误消息不匹配\n  实际: ${actualError.message}\n  期望包含: ${expectedMessage}`);
  }
};

export const assertDateString = (str: string, message: string): void => {
  const date = new Date(str);
  if (isNaN(date.getTime())) {
    throw new Error(`${message}: "${str}" 不是有效的 ISO 日期字符串`);
  }
};

export const assertProjectStructure = (project: unknown): void => {
  assertNotNull(project, '项目不应该为 null');
  
  const p = project as Record<string, unknown>;
  
  assertNotNull(p.id, '项目应该有 id');
  assert(typeof p.id === 'string', 'id 应该是字符串');
  
  assertNotNull(p.name, '项目应该有 name');
  assert(typeof p.name === 'string', 'name 应该是字符串');
  
  assertNotNull(p.components, '项目应该有 components');
  assert(Array.isArray(p.components), 'components 应该是数组');
  
  assertNotNull(p.createdAt, '项目应该有 createdAt');
  assert(typeof p.createdAt === 'string', 'createdAt 应该是字符串');
  assertDateString(p.createdAt, 'createdAt');
  
  assertNotNull(p.updatedAt, '项目应该有 updatedAt');
  assert(typeof p.updatedAt === 'string', 'updatedAt 应该是字符串');
  assertDateString(p.updatedAt, 'updatedAt');
  
  const createdDate = new Date(p.createdAt);
  const updatedDate = new Date(p.updatedAt);
  assert(
    updatedDate >= createdDate,
    `updatedAt (${p.updatedAt}) 应该大于等于 createdAt (${p.createdAt})`
  );
};

export const assertProjectMetadataStructure = (metadata: unknown): void => {
  assertNotNull(metadata, '元数据不应该为 null');
  
  const m = metadata as Record<string, unknown>;
  
  assertNotNull(m.id, '元数据应该有 id');
  assert(typeof m.id === 'string', 'id 应该是字符串');
  
  assertNotNull(m.name, '元数据应该有 name');
  assert(typeof m.name === 'string', 'name 应该是字符串');
  
  assertNotNull(m.createdAt, '元数据应该有 createdAt');
  assert(typeof m.createdAt === 'string', 'createdAt 应该是字符串');
  assertDateString(m.createdAt, 'createdAt');
  
  assertNotNull(m.updatedAt, '元数据应该有 updatedAt');
  assert(typeof m.updatedAt === 'string', 'updatedAt 应该是字符串');
  assertDateString(m.updatedAt, 'updatedAt');
  
  assertNotNull(m.componentCount, '元数据应该有 componentCount');
  assert(typeof m.componentCount === 'number', 'componentCount 应该是数字');
  assert(m.componentCount >= 0, 'componentCount 应该 >= 0');
};

export const createMockActionConfig = (
  type: ActionType,
  params: Partial<ActionConfig['params']> = {},
  enabled: boolean = true
): ActionConfig => ({
  id: `action-${generateId()}`,
  type,
  params: {
    alertMessage: params.alertMessage,
    targetUrl: params.targetUrl,
    navigateTarget: params.navigateTarget,
    pageId: params.pageId,
    logMessage: params.logMessage,
    customScript: params.customScript,
    formId: params.formId,
    modalId: params.modalId,
  },
  enabled,
});

export const createMockEventConfig = (
  eventType: EventType,
  actions: ActionConfig[] = [],
  enabled: boolean = true
): EventConfig => ({
  type: eventType,
  actions,
  enabled,
});

export const createMockClickEventConfig = (
  type: ClickEventType,
  params: Partial<{
    alertMessage?: string;
    targetUrl?: string;
    formId?: string;
  }> = {}
): ClickEventConfig => ({
  type,
  ...params,
});

export const createMockComponentEvents = (
  configs: {
    onClick?: ClickEventConfig;
    onClickActions?: EventConfig;
    onChangeActions?: EventConfig;
    onSubmitActions?: EventConfig;
    onFocusActions?: EventConfig;
    onBlurActions?: EventConfig;
  } = {}
): ComponentEvents => ({
  ...configs,
});

export const createMockButtonWithEvents = (
  id: string,
  label: string = '测试按钮',
  events?: ComponentEvents
): ButtonComponentSchema => ({
  id,
  type: ComponentType.Button,
  x: 10,
  y: 50,
  width: 120,
  height: 44,
  props: {
    children: label,
    variant: 'primary',
    size: 'md',
  },
  styles: {},
  events,
});

export const createMockInputWithEvents = (
  id: string,
  props: Partial<InputComponentSchema['props']> = {},
  events?: ComponentEvents
): InputComponentSchema => ({
  id,
  type: ComponentType.Input,
  x: 10,
  y: 10,
  width: 300,
  height: 44,
  props: {
    type: 'text',
    placeholder: '请输入内容',
    value: '',
    disabled: false,
    readOnly: false,
    clearable: false,
    error: false,
    ...props,
  },
  styles: {},
  events,
});

export const assertActionConfigEquals = (
  actual: ActionConfig,
  expected: ActionConfig,
  message: string
): void => {
  assertEqual(actual.id, expected.id, `${message}: id 应该匹配`);
  assertEqual(actual.type, expected.type, `${message}: type 应该匹配`);
  assertEqual(actual.enabled, expected.enabled, `${message}: enabled 应该匹配`);
  assertEqual(
    JSON.stringify(actual.params),
    JSON.stringify(expected.params),
    `${message}: params 应该匹配`
  );
};

export const assertEventConfigEquals = (
  actual: EventConfig,
  expected: EventConfig,
  message: string
): void => {
  assertEqual(actual.type, expected.type, `${message}: type 应该匹配`);
  assertEqual(actual.enabled, expected.enabled, `${message}: enabled 应该匹配`);
  assertEqual(
    actual.actions.length,
    expected.actions.length,
    `${message}: actions 数量应该匹配`
  );
  for (let i = 0; i < actual.actions.length; i++) {
    assertActionConfigEquals(
      actual.actions[i],
      expected.actions[i],
      `${message}: 动作 ${i}`
    );
  }
};

export const assertComponentEventsEquals = (
  actual: ComponentEvents,
  expected: ComponentEvents,
  message: string
): void => {
  if (expected.onClick) {
    assertNotNull(actual.onClick, `${message}: onClick 应该存在`);
    assertEqual(
      JSON.stringify(actual.onClick),
      JSON.stringify(expected.onClick),
      `${message}: onClick 应该匹配`
    );
  }
  if (expected.onClickActions) {
    assertNotNull(actual.onClickActions, `${message}: onClickActions 应该存在`);
    assertEventConfigEquals(actual.onClickActions, expected.onClickActions, `${message}: onClickActions`);
  }
  if (expected.onChangeActions) {
    assertNotNull(actual.onChangeActions, `${message}: onChangeActions 应该存在`);
    assertEventConfigEquals(actual.onChangeActions, expected.onChangeActions, `${message}: onChangeActions`);
  }
  if (expected.onSubmitActions) {
    assertNotNull(actual.onSubmitActions, `${message}: onSubmitActions 应该存在`);
    assertEventConfigEquals(actual.onSubmitActions, expected.onSubmitActions, `${message}: onSubmitActions`);
  }
  if (expected.onFocusActions) {
    assertNotNull(actual.onFocusActions, `${message}: onFocusActions 应该存在`);
    assertEventConfigEquals(actual.onFocusActions, expected.onFocusActions, `${message}: onFocusActions`);
  }
  if (expected.onBlurActions) {
    assertNotNull(actual.onBlurActions, `${message}: onBlurActions 应该存在`);
    assertEventConfigEquals(actual.onBlurActions, expected.onBlurActions, `${message}: onBlurActions`);
  }
};
