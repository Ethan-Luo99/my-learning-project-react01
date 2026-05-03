import {
  TestRunner,
  assert,
  assertEqual,
  assertNotNull,
} from '@/utils/test-helpers';
import { getComponentPropertyConfig } from '@/constants/propertyConfig';
import { ComponentType, type SelectOption } from '@/types/component';

const optionsArrayToText = (options: { value: string | number; label: string }[] | undefined): string => {
  if (!options || !Array.isArray(options)) {
    return '';
  }
  return options.map((opt) => `${opt.value}:${opt.label}`).join('\n');
};

const optionsTextToArray = (text: string | undefined): { value: string; label: string }[] | undefined => {
  if (!text || typeof text !== 'string') {
    return undefined;
  }
  const lines = text.split('\n').filter((line) => line.trim());
  if (lines.length === 0) {
    return undefined;
  }
  return lines.map((line) => {
    const trimmed = line.trim();
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex > 0) {
      const value = trimmed.slice(0, colonIndex).trim();
      const label = trimmed.slice(colonIndex + 1).trim();
      return { value, label: label || value };
    }
    return { value: trimmed, label: trimmed };
  });
};

export const runPropertyPanelTests = (): TestRunner => {
  const runner = new TestRunner();

  runner.beforeAll(() => {
    console.log('开始运行属性面板测试...');
  });

  runner.afterAll(() => {
    console.log('属性面板测试完成');
  });

  runner.test('optionsArrayToText: 基本转换', () => {
    const options: SelectOption[] = [
      { value: 'option1', label: '选项一' },
      { value: 'option2', label: '选项二' },
    ];

    const text = optionsArrayToText(options);
    assertEqual(text, 'option1:选项一\noption2:选项二', '转换格式正确');
  });

  runner.test('optionsArrayToText: 空数组', () => {
    const text1 = optionsArrayToText([]);
    assertEqual(text1, '', '空数组返回空字符串');

    const text2 = optionsArrayToText(undefined);
    assertEqual(text2, '', 'undefined 返回空字符串');

    const text3 = optionsArrayToText(null as any);
    assertEqual(text3, '', 'null 返回空字符串');
  });

  runner.test('optionsArrayToText: 数字 value', () => {
    const options: SelectOption[] = [
      { value: 1, label: '第一' },
      { value: 2, label: '第二' },
    ];

    const text = optionsArrayToText(options);
    assertEqual(text, '1:第一\n2:第二', '数字 value 转换正确');
  });

  runner.test('optionsTextToArray: 基本解析', () => {
    const text = 'option1:选项一\noption2:选项二\noption3:选项三';
    const result = optionsTextToArray(text);

    assertNotNull(result, '结果不应该为 undefined');
    assertEqual(result!.length, 3, '应该有 3 个选项');
    assertEqual(result![0].value, 'option1', '第一个选项 value');
    assertEqual(result![0].label, '选项一', '第一个选项 label');
    assertEqual(result![1].value, 'option2', '第二个选项 value');
    assertEqual(result![2].value, 'option3', '第三个选项 value');
  });

  runner.test('optionsTextToArray: 无冒号格式（value 和 label 相同）', () => {
    const text = '选项一\n选项二\n选项三';
    const result = optionsTextToArray(text);

    assertNotNull(result, '结果不应该为 undefined');
    assertEqual(result!.length, 3, '应该有 3 个选项');
    assertEqual(result![0].value, '选项一', 'value');
    assertEqual(result![0].label, '选项一', 'label 等于 value');
  });

  runner.test('optionsTextToArray: 空字符串和 undefined', () => {
    const result1 = optionsTextToArray('');
    assert(result1 === undefined, '空字符串返回 undefined');

    const result2 = optionsTextToArray(undefined);
    assert(result2 === undefined, 'undefined 返回 undefined');

    const result3 = optionsTextToArray('   \n\n  \n');
    assert(result3 === undefined, '只有空白字符返回 undefined');
  });

  runner.test('optionsTextToArray: 带空白字符', () => {
    const text = '  option1  :  选项一  \n  option2:选项二  \noption3  :选项三';
    const result = optionsTextToArray(text);

    assertNotNull(result, '结果不应该为 undefined');
    assertEqual(result!.length, 3, '应该有 3 个选项');
    assertEqual(result![0].value, 'option1', 'value 去除空白');
    assertEqual(result![0].label, '选项一', 'label 去除空白');
  });

  runner.test('optionsTextToArray: 单个选项', () => {
    const text = 'single:单个选项';
    const result = optionsTextToArray(text);

    assertNotNull(result, '结果不应该为 undefined');
    assertEqual(result!.length, 1, '应该有 1 个选项');
    assertEqual(result![0].value, 'single', 'value');
    assertEqual(result![0].label, '单个选项', 'label');
  });

  runner.test('optionsTextToArray: 带多个冒号的情况', () => {
    const text = 'value1:label:with:colons\nvalue2:normal label';
    const result = optionsTextToArray(text);

    assertNotNull(result, '结果不应该为 undefined');
    assertEqual(result!.length, 2, '应该有 2 个选项');
    assertEqual(result![0].value, 'value1', '第一个冒号前的是 value');
    assertEqual(result![0].label, 'label:with:colons', '后面的冒号保留在 label 中');
    assertEqual(result![1].value, 'value2', '第二个选项 value');
    assertEqual(result![1].label, 'normal label', '第二个选项 label');
  });

  runner.test('options 往返转换验证', () => {
    const originalOptions: SelectOption[] = [
      { value: 'usa', label: '美国' },
      { value: 'china', label: '中国' },
      { value: 'uk', label: '英国' },
      { value: 'japan', label: '日本' },
    ];

    const text = optionsArrayToText(originalOptions);
    const parsedOptions = optionsTextToArray(text);

    assertNotNull(parsedOptions, '解析结果不应该为 undefined');
    assertEqual(parsedOptions!.length, originalOptions.length, '选项数量相同');

    originalOptions.forEach((opt, index) => {
      assertEqual(parsedOptions![index].value, String(opt.value), `第 ${index + 1} 个选项 value`);
      assertEqual(parsedOptions![index].label, opt.label, `第 ${index + 1} 个选项 label`);
    });
  });

  runner.test('propertyConfig: Input 组件属性配置', () => {
    const config = getComponentPropertyConfig(ComponentType.Input);

    assertNotNull(config, 'Input 配置存在');
    assertEqual(config.type, ComponentType.Input, '类型正确');
    assertEqual(config.label, '输入框', '标签正确');

    const typeProp = config.properties.find((p) => p.key === 'type');
    assertNotNull(typeProp, 'type 属性存在');
    assertEqual(typeProp!.type, 'select', 'type 是 select 类型');

    const placeholderProp = config.properties.find((p) => p.key === 'placeholder');
    assertNotNull(placeholderProp, 'placeholder 属性存在');
    assertEqual(placeholderProp!.type, 'text', 'placeholder 是 text 类型');

    const maxLengthProp = config.properties.find((p) => p.key === 'maxLength');
    assertNotNull(maxLengthProp, 'maxLength 属性存在');
    assertEqual(maxLengthProp!.type, 'number', 'maxLength 是 number 类型');

    const clearableProp = config.properties.find((p) => p.key === 'clearable');
    assertNotNull(clearableProp, 'clearable 属性存在');
    assertEqual(clearableProp!.type, 'select', 'clearable 是 select 类型');
  });

  runner.test('propertyConfig: Select 组件属性配置', () => {
    const config = getComponentPropertyConfig(ComponentType.Select);

    assertNotNull(config, 'Select 配置存在');
    assertEqual(config.type, ComponentType.Select, '类型正确');

    const optionsProp = config.properties.find((p) => p.key === 'options');
    assertNotNull(optionsProp, 'options 属性存在');
    assertEqual(optionsProp!.type, 'options', 'options 是 options 类型');

    const placeholderProp = config.properties.find((p) => p.key === 'placeholder');
    assertNotNull(placeholderProp, 'placeholder 属性存在');

    const multipleProp = config.properties.find((p) => p.key === 'multiple');
    assertNotNull(multipleProp, 'multiple 属性存在');

    const searchableProp = config.properties.find((p) => p.key === 'searchable');
    assertNotNull(searchableProp, 'searchable 属性存在');
  });

  runner.test('propertyConfig: CheckboxGroup 组件属性配置', () => {
    const config = getComponentPropertyConfig(ComponentType.CheckboxGroup);

    assertNotNull(config, 'CheckboxGroup 配置存在');

    const optionsProp = config.properties.find((p) => p.key === 'options');
    assertNotNull(optionsProp, 'options 属性存在');
    assertEqual(optionsProp!.type, 'options', 'options 是 options 类型');

    const directionProp = config.properties.find((p) => p.key === 'direction');
    assertNotNull(directionProp, 'direction 属性存在');

    const gapProp = config.properties.find((p) => p.key === 'gap');
    assertNotNull(gapProp, 'gap 属性存在');
  });

  runner.test('propertyConfig: RadioGroup 组件属性配置', () => {
    const config = getComponentPropertyConfig(ComponentType.RadioGroup);

    assertNotNull(config, 'RadioGroup 配置存在');

    const optionsProp = config.properties.find((p) => p.key === 'options');
    assertNotNull(optionsProp, 'options 属性存在');
    assertEqual(optionsProp!.type, 'options', 'options 是 options 类型');
  });

  runner.test('propertyConfig: FormItem 组件属性配置', () => {
    const config = getComponentPropertyConfig(ComponentType.FormItem);

    assertNotNull(config, 'FormItem 配置存在');

    const labelProp = config.properties.find((p) => p.key === 'label');
    assertNotNull(labelProp, 'label 属性存在');

    const requiredProp = config.properties.find((p) => p.key === 'required');
    assertNotNull(requiredProp, 'required 属性存在');

    const helpProp = config.properties.find((p) => p.key === 'help');
    assertNotNull(helpProp, 'help 属性存在');

    const errorProp = config.properties.find((p) => p.key === 'error');
    assertNotNull(errorProp, 'error 属性存在');
  });

  runner.test('propertyConfig: 所有表单组件配置存在', () => {
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
      const config = getComponentPropertyConfig(type);
      assertNotNull(config, `${type} 配置应该存在`);
      assertEqual(config!.type, type, `${type} 配置类型匹配`);
    });
  });

  runner.test('propertyConfig: Select options 默认值', () => {
    const config = getComponentPropertyConfig(ComponentType.Select);
    const optionsProp = config.properties.find((p) => p.key === 'options');

    assertNotNull(optionsProp, 'options 属性存在');
    assertNotNull(optionsProp!.defaultValue, 'options 有默认值');
    assert(Array.isArray(optionsProp!.defaultValue), 'options 默认值是数组');
    assertEqual((optionsProp!.defaultValue as SelectOption[]).length, 3, '3 个默认选项');
  });

  runner.test('propertyConfig: 组件属性分类正确', () => {
    const inputConfig = getComponentPropertyConfig(ComponentType.Input);

    const basicProps = inputConfig.properties.filter((p) => p.category === 'basic');
    const propsProps = inputConfig.properties.filter((p) => p.category === 'props');
    const styleProps = inputConfig.properties.filter((p) => p.category === 'styles');

    assert(basicProps.length > 0, '有基础属性');
    assert(propsProps.length > 0, '有组件特有属性');
    assert(styleProps.length > 0, '有样式属性');
  });

  return runner;
};

export default runPropertyPanelTests;
