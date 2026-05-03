import {
  TestRunner,
  assert,
  assertEqual,
  assertNotNull,
  createMockInputComponent,
  createMockTextareaComponent,
  createMockSelectComponent,
  createMockCheckboxComponent,
  createMockCheckboxGroupComponent,
  createMockRadioComponent,
  createMockRadioGroupComponent,
  createMockSwitchComponent,
  createMockFormComponent,
  createMockFormItemComponent,
} from '@/utils/test-helpers';
import { ComponentType } from '@/types/component';
import { DEFAULT_COMPONENT_CONFIGS } from '@/constants/mockData';

export const runFormComponentsTests = (): TestRunner => {
  const runner = new TestRunner();

  runner.beforeAll(() => {
    console.log('开始运行表单组件测试...');
  });

  runner.afterAll(() => {
    console.log('表单组件测试完成');
  });

  runner.test('Input 组件: 基础属性验证', () => {
    const input = createMockInputComponent('input-1');

    assertEqual(input.id, 'input-1', 'ID 应该匹配');
    assertEqual(input.type, ComponentType.Input, '类型应该是 Input');
    assertEqual(input.width, 300, '默认宽度应该是 300');
    assertEqual(input.height, 44, '默认高度应该是 44');
    assertEqual(input.props.type, 'text', '默认类型应该是 text');
    assertEqual(input.props.placeholder, '请输入内容', '默认占位符应该正确');
    assertEqual(input.props.disabled, false, '默认不应该禁用');
    assertEqual(input.props.clearable, false, '默认不可清除');
  });

  runner.test('Input 组件: 类型属性测试', () => {
    const inputText = createMockInputComponent('input-1', { type: 'text' });
    const inputPassword = createMockInputComponent('input-2', { type: 'password' });
    const inputNumber = createMockInputComponent('input-3', { type: 'number' });
    const inputEmail = createMockInputComponent('input-4', { type: 'email' });

    assertEqual(inputText.props.type, 'text', 'text 类型');
    assertEqual(inputPassword.props.type, 'password', 'password 类型');
    assertEqual(inputNumber.props.type, 'number', 'number 类型');
    assertEqual(inputEmail.props.type, 'email', 'email 类型');
  });

  runner.test('Input 组件: value 和 defaultValue 属性', () => {
    const inputWithValue = createMockInputComponent('input-1', { value: '测试值' });
    const inputWithDefaultValue = createMockInputComponent('input-2', { defaultValue: '默认值' });

    assertEqual(inputWithValue.props.value, '测试值', 'value 属性应该正确');
    assertEqual(inputWithDefaultValue.props.defaultValue, '默认值', 'defaultValue 属性应该正确');
  });

  runner.test('Input 组件: 状态属性测试', () => {
    const disabledInput = createMockInputComponent('input-1', { disabled: true });
    const readOnlyInput = createMockInputComponent('input-2', { readOnly: true });
    const clearableInput = createMockInputComponent('input-3', { clearable: true });
    const errorInput = createMockInputComponent('input-4', { error: true, errorMessage: '输入错误' });

    assertEqual(disabledInput.props.disabled, true, '禁用状态');
    assertEqual(readOnlyInput.props.readOnly, true, '只读状态');
    assertEqual(clearableInput.props.clearable, true, '可清除状态');
    assertEqual(errorInput.props.error, true, '错误状态');
    assertEqual(errorInput.props.errorMessage, '输入错误', '错误消息');
  });

  runner.test('Input 组件: maxLength 属性', () => {
    const inputWithMaxLength = createMockInputComponent('input-1', { maxLength: 50 });
    const inputWithoutMaxLength = createMockInputComponent('input-2');

    assertEqual(inputWithMaxLength.props.maxLength, 50, 'maxLength 应该正确设置');
    assert(inputWithoutMaxLength.props.maxLength === undefined, '默认没有 maxLength');
  });

  runner.test('Textarea 组件: 基础属性验证', () => {
    const textarea = createMockTextareaComponent('textarea-1');

    assertEqual(textarea.id, 'textarea-1', 'ID 应该匹配');
    assertEqual(textarea.type, ComponentType.Textarea, '类型应该是 Textarea');
    assertEqual(textarea.width, 350, '默认宽度应该是 350');
    assertEqual(textarea.props.rows, 4, '默认行数应该是 4');
    assertEqual(textarea.props.resize, 'vertical', '默认只允许垂直调整大小');
    assertEqual(textarea.props.showCount, false, '默认不显示字数统计');
  });

  runner.test('Textarea 组件: maxLength 和 showCount', () => {
    const textarea = createMockTextareaComponent('textarea-1', {
      maxLength: 200,
      showCount: true,
    });

    assertEqual(textarea.props.maxLength, 200, 'maxLength 应该正确');
    assertEqual(textarea.props.showCount, true, 'showCount 应该正确');
  });

  runner.test('Select 组件: 基础属性验证', () => {
    const select = createMockSelectComponent('select-1');

    assertEqual(select.id, 'select-1', 'ID 应该匹配');
    assertEqual(select.type, ComponentType.Select, '类型应该是 Select');
    assertEqual(select.width, 300, '默认宽度应该是 300');
    assertEqual(select.props.placeholder, '请选择', '默认占位符应该正确');
    assertEqual(select.props.multiple, false, '默认不是多选');
    assertEqual(select.props.searchable, false, '默认不可搜索');
    assertEqual(select.props.clearable, false, '默认不可清除');
  });

  runner.test('Select 组件: options 数组验证', () => {
    const select = createMockSelectComponent('select-1');

    assertNotNull(select.props.options, 'options 不应该为 null');
    assert(Array.isArray(select.props.options), 'options 应该是数组');
    assertEqual(select.props.options!.length, 3, '默认应该有 3 个选项');

    const firstOption = select.props.options![0];
    assertEqual(firstOption.value, 'option1', '第一个选项 value');
    assertEqual(firstOption.label, '选项一', '第一个选项 label');
  });

  runner.test('Select 组件: 自定义 options', () => {
    const customOptions = [
      { value: 'usa', label: '美国' },
      { value: 'china', label: '中国' },
      { value: 'uk', label: '英国' },
    ];

    const select = createMockSelectComponent('select-1', {
      options: customOptions,
    });

    assertEqual(select.props.options!.length, 3, '自定义选项数量');
    assertEqual(select.props.options![1].value, 'china', '第二个选项 value');
    assertEqual(select.props.options![1].label, '中国', '第二个选项 label');
  });

  runner.test('Select 组件: 多选和搜索模式', () => {
    const multipleSelect = createMockSelectComponent('select-1', {
      multiple: true,
      searchable: true,
      value: ['option1', 'option2'],
    });

    assertEqual(multipleSelect.props.multiple, true, '应该是多选');
    assertEqual(multipleSelect.props.searchable, true, '应该可搜索');
    assertEqual(
      JSON.stringify(multipleSelect.props.value),
      JSON.stringify(['option1', 'option2']),
      '多选值应该正确'
    );
  });

  runner.test('Select 组件: value 和 defaultValue', () => {
    const selectWithValue = createMockSelectComponent('select-1', { value: 'option1' });
    const selectWithDefaultValue = createMockSelectComponent('select-2', { defaultValue: 'option2' });

    assertEqual(selectWithValue.props.value, 'option1', 'value 属性');
    assertEqual(selectWithDefaultValue.props.defaultValue, 'option2', 'defaultValue 属性');
  });

  runner.test('Checkbox 组件: 基础属性验证', () => {
    const checkbox = createMockCheckboxComponent('checkbox-1');

    assertEqual(checkbox.id, 'checkbox-1', 'ID 应该匹配');
    assertEqual(checkbox.type, ComponentType.Checkbox, '类型应该是 Checkbox');
    assertEqual(checkbox.props.checked, false, '默认不选中');
    assertEqual(checkbox.props.indeterminate, false, '默认不是半选');
    assertEqual(checkbox.props.disabled, false, '默认不禁用');
    assertEqual(checkbox.props.label, '选项', '默认标签');
  });

  runner.test('Checkbox 组件: 选中和半选状态', () => {
    const checkedCheckbox = createMockCheckboxComponent('checkbox-1', { checked: true });
    const indeterminateCheckbox = createMockCheckboxComponent('checkbox-2', { indeterminate: true });
    const disabledCheckbox = createMockCheckboxComponent('checkbox-3', { disabled: true });

    assertEqual(checkedCheckbox.props.checked, true, '选中状态');
    assertEqual(indeterminateCheckbox.props.indeterminate, true, '半选状态');
    assertEqual(disabledCheckbox.props.disabled, true, '禁用状态');
  });

  runner.test('CheckboxGroup 组件: 基础属性验证', () => {
    const group = createMockCheckboxGroupComponent('checkbox-group-1');

    assertEqual(group.id, 'checkbox-group-1', 'ID 应该匹配');
    assertEqual(group.type, ComponentType.CheckboxGroup, '类型应该是 CheckboxGroup');
    assertEqual(group.props.direction, 'column', '默认纵向排列');
    assertEqual(group.props.gap, 'md', '默认中间距');
    assertEqual(group.props.value!.length, 0, '默认没有选中值');
  });

  runner.test('CheckboxGroup 组件: options 验证', () => {
    const group = createMockCheckboxGroupComponent('checkbox-group-1');

    assertNotNull(group.props.options, 'options 不应该为 null');
    assertEqual(group.props.options!.length, 3, '默认 3 个选项');

    const customGroup = createMockCheckboxGroupComponent('checkbox-group-2', {
      options: [
        { value: 'apple', label: '苹果' },
        { value: 'banana', label: '香蕉' },
      ],
      value: ['apple'],
    });

    assertEqual(customGroup.props.options!.length, 2, '自定义选项数量');
    assertEqual(customGroup.props.value![0], 'apple', '选中值');
  });

  runner.test('CheckboxGroup 组件: 排列方向和间距', () => {
    const horizontalGroup = createMockCheckboxGroupComponent('checkbox-group-1', {
      direction: 'row',
      gap: 'lg',
    });

    assertEqual(horizontalGroup.props.direction, 'row', '横向排列');
    assertEqual(horizontalGroup.props.gap, 'lg', '大间距');
  });

  runner.test('Radio 组件: 基础属性验证', () => {
    const radio = createMockRadioComponent('radio-1');

    assertEqual(radio.id, 'radio-1', 'ID 应该匹配');
    assertEqual(radio.type, ComponentType.Radio, '类型应该是 Radio');
    assertEqual(radio.props.checked, false, '默认不选中');
    assertEqual(radio.props.disabled, false, '默认不禁用');
    assertEqual(radio.props.label, '选项', '默认标签');
    assertEqual(radio.props.value, 'radio1', '默认 value');
  });

  runner.test('Radio 组件: 选中状态', () => {
    const checkedRadio = createMockRadioComponent('radio-1', { checked: true, value: 'option1' });

    assertEqual(checkedRadio.props.checked, true, '选中状态');
    assertEqual(checkedRadio.props.value, 'option1', 'value 属性');
  });

  runner.test('RadioGroup 组件: 基础属性验证', () => {
    const group = createMockRadioGroupComponent('radio-group-1');

    assertEqual(group.id, 'radio-group-1', 'ID 应该匹配');
    assertEqual(group.type, ComponentType.RadioGroup, '类型应该是 RadioGroup');
    assertEqual(group.props.direction, 'column', '默认纵向排列');
    assertEqual(group.props.gap, 'md', '默认中间距');
    assert(group.props.value === undefined, '默认没有选中值');
  });

  runner.test('RadioGroup 组件: options 和选中值', () => {
    const group = createMockRadioGroupComponent('radio-group-1');

    assertNotNull(group.props.options, 'options 不应该为 null');
    assertEqual(group.props.options!.length, 3, '默认 3 个选项');

    const customGroup = createMockRadioGroupComponent('radio-group-2', {
      options: [
        { value: 'male', label: '男' },
        { value: 'female', label: '女' },
      ],
      value: 'male',
    });

    assertEqual(customGroup.props.options!.length, 2, '自定义选项数量');
    assertEqual(customGroup.props.value, 'male', '选中值');
  });

  runner.test('RadioGroup 组件: 排列方向', () => {
    const horizontalGroup = createMockRadioGroupComponent('radio-group-1', {
      direction: 'row',
      gap: 'sm',
    });

    assertEqual(horizontalGroup.props.direction, 'row', '横向排列');
    assertEqual(horizontalGroup.props.gap, 'sm', '小间距');
  });

  runner.test('Switch 组件: 基础属性验证', () => {
    const switchComponent = createMockSwitchComponent('switch-1');

    assertEqual(switchComponent.id, 'switch-1', 'ID 应该匹配');
    assertEqual(switchComponent.type, ComponentType.Switch, '类型应该是 Switch');
    assertEqual(switchComponent.props.checked, false, '默认不开启');
    assertEqual(switchComponent.props.defaultChecked, false, '默认不开启');
    assertEqual(switchComponent.props.disabled, false, '默认不禁用');
    assertEqual(switchComponent.props.loading, false, '默认不是加载状态');
    assertEqual(switchComponent.props.size, 'md', '默认中等尺寸');
  });

  runner.test('Switch 组件: 开启状态和尺寸', () => {
    const checkedSwitch = createMockSwitchComponent('switch-1', { checked: true });
    const smallSwitch = createMockSwitchComponent('switch-2', { size: 'sm' });
    const largeSwitch = createMockSwitchComponent('switch-3', { size: 'lg' });

    assertEqual(checkedSwitch.props.checked, true, '开启状态');
    assertEqual(smallSwitch.props.size, 'sm', '小尺寸');
    assertEqual(largeSwitch.props.size, 'lg', '大尺寸');
  });

  runner.test('Switch 组件: 加载和禁用状态', () => {
    const loadingSwitch = createMockSwitchComponent('switch-1', { loading: true });
    const disabledSwitch = createMockSwitchComponent('switch-2', { disabled: true });

    assertEqual(loadingSwitch.props.loading, true, '加载状态');
    assertEqual(disabledSwitch.props.disabled, true, '禁用状态');
  });

  runner.test('Switch 组件: 文字提示', () => {
    const switchWithText = createMockSwitchComponent('switch-1', {
      checkedText: '开启',
      uncheckedText: '关闭',
    });

    assertEqual(switchWithText.props.checkedText, '开启', '开启文字');
    assertEqual(switchWithText.props.uncheckedText, '关闭', '关闭文字');
  });

  runner.test('Form 组件: 基础属性验证', () => {
    const form = createMockFormComponent('form-1');

    assertEqual(form.id, 'form-1', 'ID 应该匹配');
    assertEqual(form.type, ComponentType.Form, '类型应该是 Form');
    assertEqual(form.width, 500, '默认宽度 500');
    assertEqual(form.props.layout, 'vertical', '默认垂直布局');
    assertEqual(form.props.labelWidth, 100, '默认标签宽度 100');
    assertEqual(form.props.labelAlign, 'right', '默认标签右对齐');
    assertEqual(form.props.size, 'md', '默认中等尺寸');
    assertEqual(form.props.disabled, false, '默认不禁用');
  });

  runner.test('Form 组件: 子组件支持', () => {
    const input = createMockInputComponent('input-1');
    const form = createMockFormComponent('form-1', [input]);

    assertNotNull(form.children, 'children 不应该为 null');
    assertEqual(form.children!.length, 1, '应该有 1 个子组件');
    assertEqual(form.children![0].id, 'input-1', '子组件 ID 应该匹配');
  });

  runner.test('Form 组件: 布局模式', () => {
    const horizontalForm = createMockFormComponent('form-1', [], {
      layout: 'horizontal',
      labelAlign: 'left',
    });
    const inlineForm = createMockFormComponent('form-2', [], {
      layout: 'inline',
    });

    assertEqual(horizontalForm.props.layout, 'horizontal', '水平布局');
    assertEqual(horizontalForm.props.labelAlign, 'left', '标签左对齐');
    assertEqual(inlineForm.props.layout, 'inline', '行内布局');
  });

  runner.test('Form 组件: 尺寸和禁用', () => {
    const smallForm = createMockFormComponent('form-1', [], {
      size: 'sm',
    });
    const disabledForm = createMockFormComponent('form-2', [], {
      disabled: true,
    });

    assertEqual(smallForm.props.size, 'sm', '小尺寸');
    assertEqual(disabledForm.props.disabled, true, '禁用状态');
  });

  runner.test('FormItem 组件: 基础属性验证', () => {
    const formItem = createMockFormItemComponent('form-item-1');

    assertEqual(formItem.id, 'form-item-1', 'ID 应该匹配');
    assertEqual(formItem.type, ComponentType.FormItem, '类型应该是 FormItem');
    assertEqual(formItem.props.label, '标签', '默认标签');
    assertEqual(formItem.props.required, false, '默认不是必填');
    assertEqual(formItem.props.error, false, '默认没有错误');
    assertEqual(formItem.props.help, '', '默认帮助文本为空');
    assertEqual(formItem.props.name, '', '默认 name 为空');
  });

  runner.test('FormItem 组件: 子组件支持', () => {
    const input = createMockInputComponent('input-1');
    const formItem = createMockFormItemComponent('form-item-1', [input]);

    assertNotNull(formItem.children, 'children 不应该为 null');
    assertEqual(formItem.children!.length, 1, '应该有 1 个子组件');
    assertEqual(formItem.children![0].id, 'input-1', '子组件 ID 应该匹配');
  });

  runner.test('FormItem 组件: 必填标记', () => {
    const requiredItem = createMockFormItemComponent('form-item-1', [], {
      required: true,
      label: '用户名',
    });

    assertEqual(requiredItem.props.required, true, '必填');
    assertEqual(requiredItem.props.label, '用户名', '标签');
  });

  runner.test('FormItem 组件: 错误状态', () => {
    const errorItem = createMockFormItemComponent('form-item-1', [], {
      error: true,
      errorMessage: '请输入有效的邮箱地址',
    });

    assertEqual(errorItem.props.error, true, '错误状态');
    assertEqual(errorItem.props.errorMessage, '请输入有效的邮箱地址', '错误消息');
  });

  runner.test('FormItem 组件: 帮助文本', () => {
    const helpItem = createMockFormItemComponent('form-item-1', [], {
      help: '请输入 6-20 位密码',
    });

    assertEqual(helpItem.props.help, '请输入 6-20 位密码', '帮助文本');
  });

  runner.test('FormItem 组件: 标签宽度和对齐覆盖', () => {
    const customItem = createMockFormItemComponent('form-item-1', [], {
      labelWidth: 150,
      labelAlign: 'left',
    });

    assertEqual(customItem.props.labelWidth, 150, '自定义标签宽度');
    assertEqual(customItem.props.labelAlign, 'left', '自定义标签对齐');
  });

  runner.test('表单组件嵌套: Form > FormItem > Input', () => {
    const input = createMockInputComponent('input-1', { placeholder: '请输入用户名' });
    const formItem = createMockFormItemComponent('form-item-1', [input], {
      label: '用户名',
      required: true,
    });
    const form = createMockFormComponent('form-1', [formItem], {
      layout: 'horizontal',
    });

    assertEqual(form.type, ComponentType.Form, '外层是 Form');
    assertEqual(form.children!.length, 1, 'Form 有 1 个子组件');
    assertEqual(form.children![0].type, ComponentType.FormItem, '子组件是 FormItem');

    const nestedFormItem = form.children![0] as ReturnType<typeof createMockFormItemComponent>;
    assertEqual(nestedFormItem.props.label, '用户名', 'FormItem 标签');
    assertEqual(nestedFormItem.props.required, true, 'FormItem 必填');
    assertEqual(nestedFormItem.children!.length, 1, 'FormItem 有 1 个子组件');

    const nestedInput = nestedFormItem.children![0] as ReturnType<typeof createMockInputComponent>;
    assertEqual(nestedInput.type, ComponentType.Input, '最内层是 Input');
    assertEqual(nestedInput.props.placeholder, '请输入用户名', 'Input 占位符');
  });

  runner.test('表单组件嵌套: Form 包含多个 FormItem', () => {
    const formItem1 = createMockFormItemComponent('form-item-1', [
      createMockInputComponent('input-1'),
    ], { label: '用户名' });

    const formItem2 = createMockFormItemComponent('form-item-2', [
      createMockInputComponent('input-2', { type: 'password' }),
    ], { label: '密码', required: true });

    const formItem3 = createMockFormItemComponent('form-item-3', [
      createMockSelectComponent('select-1'),
    ], { label: '性别' });

    const form = createMockFormComponent('form-1', [formItem1, formItem2, formItem3]);

    assertEqual(form.children!.length, 3, 'Form 有 3 个 FormItem');
    assertEqual(form.children![0].props.label, '用户名', '第一个 FormItem');
    assertEqual(form.children![1].props.required, true, '第二个 FormItem 必填');
    assertEqual(form.children![2].children![0].type, ComponentType.Select, '第三个 FormItem 包含 Select');
  });

  runner.test('DEFAULT_COMPONENT_CONFIGS: 所有表单组件配置存在', () => {
    const formComponentTypes = [
      ComponentType.Input,
      ComponentType.Textarea,
      ComponentType.Select,
      ComponentType.Checkbox,
      ComponentType.CheckboxGroup,
      ComponentType.Radio,
      ComponentType.RadioGroup,
      ComponentType.Switch,
      ComponentType.Form,
      ComponentType.FormItem,
    ];

    formComponentTypes.forEach((type) => {
      assertNotNull(DEFAULT_COMPONENT_CONFIGS[type], `${type} 配置应该存在`);
      assertEqual(DEFAULT_COMPONENT_CONFIGS[type].type, type, `${type} 配置类型匹配`);
    });
  });

  runner.test('DEFAULT_COMPONENT_CONFIGS: Input 配置验证', () => {
    const config = DEFAULT_COMPONENT_CONFIGS[ComponentType.Input];

    assertEqual(config.label, '输入框', '标签应该正确');
    assertEqual(config.defaultWidth, 300, '默认宽度');
    assertEqual(config.defaultProps.type, 'text', '默认类型');
    assertEqual(config.defaultProps.placeholder, '请输入内容', '默认占位符');
  });

  runner.test('DEFAULT_COMPONENT_CONFIGS: Select 配置验证', () => {
    const config = DEFAULT_COMPONENT_CONFIGS[ComponentType.Select];

    assertEqual(config.label, '下拉选择', '标签应该正确');
    assertEqual(config.defaultWidth, 300, '默认宽度');
    assertEqual(config.defaultProps.placeholder, '请选择', '默认占位符');
    assertNotNull(config.defaultProps.options, 'options 存在');
    assertEqual(config.defaultProps.options.length, 3, '3 个默认选项');
  });

  runner.test('DEFAULT_COMPONENT_CONFIGS: CheckboxGroup 和 RadioGroup 配置', () => {
    const checkboxGroupConfig = DEFAULT_COMPONENT_CONFIGS[ComponentType.CheckboxGroup];
    const radioGroupConfig = DEFAULT_COMPONENT_CONFIGS[ComponentType.RadioGroup];

    assertEqual(checkboxGroupConfig.label, '复选框组', '复选框组标签');
    assertEqual(radioGroupConfig.label, '单选框组', '单选框组标签');
    assertEqual(checkboxGroupConfig.defaultProps.direction, 'column', '默认纵向排列');
    assertEqual(radioGroupConfig.defaultProps.direction, 'column', '默认纵向排列');
    assertNotNull(checkboxGroupConfig.defaultProps.options, 'options 存在');
    assertNotNull(radioGroupConfig.defaultProps.options, 'options 存在');
  });

  runner.test('DEFAULT_COMPONENT_CONFIGS: Form 和 FormItem 配置', () => {
    const formConfig = DEFAULT_COMPONENT_CONFIGS[ComponentType.Form];
    const formItemConfig = DEFAULT_COMPONENT_CONFIGS[ComponentType.FormItem];

    assertEqual(formConfig.label, '表单', 'Form 标签');
    assertEqual(formItemConfig.label, '表单项', 'FormItem 标签');
    assertEqual(formConfig.defaultWidth, 500, 'Form 默认宽度');
    assertEqual(formConfig.defaultProps.layout, 'vertical', 'Form 默认布局');
    assertEqual(formConfig.defaultProps.labelWidth, 100, 'Form 默认标签宽度');
    assertEqual(formItemConfig.defaultProps.label, '标签', 'FormItem 默认标签');
    assertEqual(formItemConfig.defaultProps.required, false, 'FormItem 默认非必填');
  });

  return runner;
};

export default runFormComponentsTests;
