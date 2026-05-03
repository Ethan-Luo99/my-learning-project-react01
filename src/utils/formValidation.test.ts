import {
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validateMin,
  validateMax,
  validatePattern,
  validateEmail,
  validateUrl,
  validateCustom,
  validateRule,
  validateField,
  validateForm,
  isFormValid,
  getFirstErrorMessage,
  serializeValidationRules,
  deserializeValidationRules,
  type ValidationRule,
  type ValidationResult,
} from './formValidation';
import {
  TestRunner,
  assert,
  assertEqual,
  assertNotNull,
} from './test-helpers';

export const runFormValidationTests = (): TestRunner => {
  const runner = new TestRunner();

  runner.beforeAll(() => {
    console.log('开始运行 formValidation 验证引擎测试...');
  });

  runner.afterAll(() => {
    console.log('formValidation 验证引擎测试完成');
  });

  runner.test('validateRequired: 空值应该返回错误', () => {
    const error1 = validateRequired('');
    const error2 = validateRequired('   ');
    const error3 = validateRequired(null);
    const error4 = validateRequired(undefined);
    const error5 = validateRequired([]);

    assertNotNull(error1, '空字符串应该返回错误');
    assertNotNull(error2, '只包含空格的字符串应该返回错误');
    assertNotNull(error3, 'null 应该返回错误');
    assertNotNull(error4, 'undefined 应该返回错误');
    assertNotNull(error5, '空数组应该返回错误');

    assertEqual(error1, '此字段为必填项', '默认错误消息');
  });

  runner.test('validateRequired: 非空值应该返回 null', () => {
    const error1 = validateRequired('test');
    const error2 = validateRequired(0);
    const error3 = validateRequired(false);
    const error4 = validateRequired([1, 2, 3]);
    const error5 = validateRequired('  test  ');

    assertEqual(error1, null, '非空字符串应该通过');
    assertEqual(error2, null, '数字 0 应该通过');
    assertEqual(error3, null, 'boolean false 应该通过');
    assertEqual(error4, null, '非空数组应该通过');
    assertEqual(error5, null, '包含空格的非空字符串应该通过');
  });

  runner.test('validateRequired: 自定义错误消息', () => {
    const error = validateRequired('', '请填写此字段');
    assertEqual(error, '请填写此字段', '应该使用自定义错误消息');
  });

  runner.test('validateMinLength: 字符串长度不足应该返回错误', () => {
    const error1 = validateMinLength('abc', 5);
    const error2 = validateMinLength('', 1);

    assertEqual(error1, '最少需要 5 个字符', '长度不足时返回错误');
    assertEqual(error2, null, '空值不触发 minLength 验证');
  });

  runner.test('validateMinLength: 字符串长度满足应该返回 null', () => {
    const error1 = validateMinLength('abcde', 5);
    const error2 = validateMinLength('abcdef', 5);

    assertEqual(error1, null, '刚好等于最小长度应该通过');
    assertEqual(error2, null, '超过最小长度应该通过');
  });

  runner.test('validateMinLength: 自定义错误消息', () => {
    const error = validateMinLength('abc', 5, '至少需要 5 个字符');
    assertEqual(error, '至少需要 5 个字符', '应该使用自定义错误消息');
  });

  runner.test('validateMaxLength: 超长文本应该返回错误', () => {
    const error1 = validateMaxLength('abcdef', 5);
    const error2 = validateMaxLength('1234567890', 5);

    assertEqual(error1, '最多允许 5 个字符', '超长时返回错误');
    assertEqual(error2, '最多允许 5 个字符', '超长时返回错误');
  });

  runner.test('validateMaxLength: 长度符合要求应该返回 null', () => {
    const error1 = validateMaxLength('abcde', 5);
    const error2 = validateMaxLength('abc', 5);
    const error3 = validateMaxLength('', 5);

    assertEqual(error1, null, '刚好等于最大长度应该通过');
    assertEqual(error2, null, '小于最大长度应该通过');
    assertEqual(error3, null, '空值不触发 maxLength 验证');
  });

  runner.test('validateMaxLength: 自定义错误消息', () => {
    const error = validateMaxLength('abcdef', 5, '最多 5 个字符');
    assertEqual(error, '最多 5 个字符', '应该使用自定义错误消息');
  });

  runner.test('validateMin: 数值小于最小值应该返回错误', () => {
    const error1 = validateMin(3, 5);
    const error2 = validateMin(0, 1);

    assertEqual(error1, '最小值为 5', '小于最小值时返回错误');
    assertEqual(error2, '最小值为 1', '小于最小值时返回错误');
  });

  runner.test('validateMin: 数值符合要求应该返回 null', () => {
    const error1 = validateMin(5, 5);
    const error2 = validateMin(10, 5);
    const error3 = validateMin('', 5);

    assertEqual(error1, null, '等于最小值应该通过');
    assertEqual(error2, null, '大于最小值应该通过');
    assertEqual(error3, null, '空值不触发 min 验证');
  });

  runner.test('validateMin: 非数字应该返回错误', () => {
    const error = validateMin('abc', 5);
    assertNotNull(error, '非数字应该返回错误');
  });

  runner.test('validateMax: 数值大于最大值应该返回错误', () => {
    const error1 = validateMax(10, 5);
    const error2 = validateMax(6, 5);

    assertEqual(error1, '最大值为 5', '大于最大值时返回错误');
    assertEqual(error2, '最大值为 5', '大于最大值时返回错误');
  });

  runner.test('validateMax: 数值符合要求应该返回 null', () => {
    const error1 = validateMax(5, 5);
    const error2 = validateMax(3, 5);
    const error3 = validateMax('', 5);

    assertEqual(error1, null, '等于最大值应该通过');
    assertEqual(error2, null, '小于最大值应该通过');
    assertEqual(error3, null, '空值不触发 max 验证');
  });

  runner.test('validatePattern: 不匹配正则应该返回错误', () => {
    const error1 = validatePattern('abc', '^[0-9]+$');
    const error2 = validatePattern('123', /^[a-z]+$/);

    assertEqual(error1, '格式不正确', '不匹配时返回错误');
    assertEqual(error2, '格式不正确', '不匹配时返回错误');
  });

  runner.test('validatePattern: 匹配正则应该返回 null', () => {
    const error1 = validatePattern('123', '^[0-9]+$');
    const error2 = validatePattern('abc', /^[a-z]+$/);
    const error3 = validatePattern('', '^[0-9]+$');

    assertEqual(error1, null, '匹配时通过');
    assertEqual(error2, null, '匹配时通过');
    assertEqual(error3, null, '空值不触发 pattern 验证');
  });

  runner.test('validateEmail: 非法邮箱格式应该返回错误', () => {
    const error1 = validateEmail('test');
    const error2 = validateEmail('test@');
    const error3 = validateEmail('test@.com');
    const error4 = validateEmail('@example.com');

    assertEqual(error1, '请输入有效的邮箱地址', '非法邮箱返回错误');
    assertEqual(error2, '请输入有效的邮箱地址', '非法邮箱返回错误');
    assertEqual(error3, '请输入有效的邮箱地址', '非法邮箱返回错误');
    assertEqual(error4, '请输入有效的邮箱地址', '非法邮箱返回错误');
  });

  runner.test('validateEmail: 合法邮箱格式应该返回 null', () => {
    const error1 = validateEmail('test@example.com');
    const error2 = validateEmail('user.name+tag@domain.co.uk');
    const error3 = validateEmail('');

    assertEqual(error1, null, '合法邮箱通过');
    assertEqual(error2, null, '合法邮箱通过');
    assertEqual(error3, null, '空值不触发 email 验证');
  });

  runner.test('validateUrl: 非法 URL 格式应该返回错误', () => {
    const error1 = validateUrl('not-a-url');
    const error2 = validateUrl('http:/missing-slash');

    assertNotNull(error1, '非法 URL 返回错误');
    assertNotNull(error2, '非法 URL 返回错误');
  });

  runner.test('validateUrl: 合法 URL 格式应该返回 null', () => {
    const error1 = validateUrl('http://example.com');
    const error2 = validateUrl('https://example.com/path?query=1');
    const error3 = validateUrl('example.com');
    const error4 = validateUrl('');

    assertEqual(error1, null, '合法 URL 通过');
    assertEqual(error2, null, '合法 URL 通过');
    assertEqual(error3, null, '不带协议的 URL 通过');
    assertEqual(error4, null, '空值不触发 url 验证');
  });

  runner.test('validateCustom: 返回 false 应该返回错误', () => {
    const validator = (value: string) => value.length > 3;
    const error1 = validateCustom('abc', validator);
    const error2 = validateCustom('abcd', validator);

    assertEqual(error1, '验证失败', '返回 false 时返回错误');
    assertEqual(error2, null, '返回 true 时通过');
  });

  runner.test('validateCustom: 返回字符串应该作为错误消息', () => {
    const validator = (value: string) => {
      if (value.length < 3) {
        return '至少需要 3 个字符';
      }
      return true;
    };
    const error1 = validateCustom('ab', validator);
    const error2 = validateCustom('abcd', validator);

    assertEqual(error1, '至少需要 3 个字符', '返回字符串作为错误消息');
    assertEqual(error2, null, '返回 true 时通过');
  });

  runner.test('validateCustom: 自定义错误消息', () => {
    const validator = () => false;
    const error = validateCustom('test', validator, '自定义验证失败');

    assertEqual(error, '自定义验证失败', '应该使用自定义错误消息');
  });

  runner.test('validateRule: required 规则验证', () => {
    const rule: ValidationRule = { type: 'required' };
    const error1 = validateRule('', rule);
    const error2 = validateRule('test', rule);

    assertNotNull(error1, '空值返回错误');
    assertEqual(error2, null, '非空值通过');
  });

  runner.test('validateRule: email 规则验证', () => {
    const rule: ValidationRule = { type: 'email' };
    const error1 = validateRule('invalid', rule);
    const error2 = validateRule('test@example.com', rule);

    assertNotNull(error1, '非法邮箱返回错误');
    assertEqual(error2, null, '合法邮箱通过');
  });

  runner.test('validateRule: maxLength 规则验证', () => {
    const rule: ValidationRule = { type: 'maxLength', value: 5 };
    const error1 = validateRule('123456', rule);
    const error2 = validateRule('123', rule);

    assertNotNull(error1, '超长返回错误');
    assertEqual(error2, null, '不超长通过');
  });

  runner.test('validateRule: custom 规则验证', () => {
    const rule: ValidationRule = {
      type: 'custom',
      customValidator: (value: string) => value === 'valid',
    };
    const error1 = validateRule('invalid', rule);
    const error2 = validateRule('valid', rule);

    assertNotNull(error1, '验证失败返回错误');
    assertEqual(error2, null, '验证通过');
  });

  runner.test('validateField: 单条规则验证通过', () => {
    const rules: ValidationRule[] = [{ type: 'required' }];
    const result = validateField('test', rules);

    assertEqual(result.valid, true, '验证通过');
    assertEqual(result.errors.length, 0, '没有错误');
  });

  runner.test('validateField: 单条规则验证失败', () => {
    const rules: ValidationRule[] = [{ type: 'required' }];
    const result = validateField('', rules);

    assertEqual(result.valid, false, '验证失败');
    assertEqual(result.errors.length, 1, '有 1 个错误');
  });

  runner.test('validateField: 同一字段多条规则按顺序执行', () => {
    const rules: ValidationRule[] = [
      { type: 'required', message: '必填' },
      { type: 'minLength', value: 3, message: '最少 3 个字符' },
      { type: 'maxLength', value: 10, message: '最多 10 个字符' },
    ];

    const result1 = validateField('', rules);
    const result2 = validateField('ab', rules);
    const result3 = validateField('abcdefghijk', rules);
    const result4 = validateField('valid', rules);

    assertEqual(result1.valid, false, '空值验证失败');
    assertEqual(result1.errors[0], '必填', '第一条规则失败');
    assertEqual(result1.errors.length, 1, '只有第一条规则的错误');

    assertEqual(result2.valid, false, '长度不足验证失败');
    assertEqual(result2.errors[0], '最少 3 个字符', '第二条规则失败');

    assertEqual(result3.valid, false, '超长验证失败');
    assertEqual(result3.errors[0], '最多 10 个字符', '第三条规则失败');

    assertEqual(result4.valid, true, '所有规则通过');
    assertEqual(result4.errors.length, 0, '没有错误');
  });

  runner.test('validateField: 多条规则都失败时收集所有错误', () => {
    const rules: ValidationRule[] = [
      { type: 'minLength', value: 5, message: '最少 5 个字符' },
      { type: 'pattern', value: '^[0-9]+$', message: '必须是数字' },
    ];

    const result = validateField('abc', rules);

    assertEqual(result.valid, false, '验证失败');
    assertEqual(result.errors.length, 2, '收集所有错误');
    assertEqual(result.errors[0], '最少 5 个字符', '第一条错误');
    assertEqual(result.errors[1], '必须是数字', '第二条错误');
  });

  runner.test('validateForm: 所有字段验证通过', () => {
    const fields = {
      username: { value: 'testuser', rules: [{ type: 'required' }] },
      email: { value: 'test@example.com', rules: [{ type: 'email' }] },
    };

    const results = validateForm(fields);

    assertEqual(results.username.valid, true, 'username 通过');
    assertEqual(results.email.valid, true, 'email 通过');
  });

  runner.test('validateForm: 部分字段验证失败', () => {
    const fields = {
      username: { value: '', rules: [{ type: 'required' }] },
      email: { value: 'test@example.com', rules: [{ type: 'email' }] },
    };

    const results = validateForm(fields);

    assertEqual(results.username.valid, false, 'username 失败');
    assertEqual(results.email.valid, true, 'email 通过');
  });

  runner.test('isFormValid: 所有字段通过时返回 true', () => {
    const results: Record<string, ValidationResult> = {
      field1: { valid: true, errors: [] },
      field2: { valid: true, errors: [] },
    };

    assertEqual(isFormValid(results), true, '所有通过时返回 true');
  });

  runner.test('isFormValid: 有字段失败时返回 false', () => {
    const results: Record<string, ValidationResult> = {
      field1: { valid: true, errors: [] },
      field2: { valid: false, errors: ['错误'] },
    };

    assertEqual(isFormValid(results), false, '有失败时返回 false');
  });

  runner.test('getFirstErrorMessage: 返回第一个错误消息', () => {
    const result1: ValidationResult = { valid: false, errors: ['错误1', '错误2', '错误3'] };
    const result2: ValidationResult = { valid: true, errors: [] };

    assertEqual(getFirstErrorMessage(result1), '错误1', '返回第一个错误');
    assertEqual(getFirstErrorMessage(result2), null, '没有错误时返回 null');
  });

  runner.test('serializeValidationRules: 序列化规则（排除 customValidator）', () => {
    const rules: ValidationRule[] = [
      { type: 'required', message: '必填' },
      { type: 'minLength', value: 3, message: '最少 3 个字符' },
      { type: 'custom', customValidator: () => true, message: '自定义验证' },
    ];

    const serialized = serializeValidationRules(rules);
    const parsed = JSON.parse(serialized);

    assertEqual(parsed.length, 3, '有 3 条规则');
    assertEqual(parsed[0].type, 'required', '第一条规则类型正确');
    assertEqual(parsed[2].customValidator, undefined, 'customValidator 被排除');
  });

  runner.test('deserializeValidationRules: 反序列化规则', () => {
    const serialized = JSON.stringify([
      { type: 'required', message: '必填' },
      { type: 'minLength', value: 5, message: '最少 5 个字符' },
    ]);

    const rules = deserializeValidationRules(serialized);

    assertEqual(rules.length, 2, '有 2 条规则');
    assertEqual(rules[0].type, 'required', '第一条规则类型正确');
    assertEqual(rules[1].value, 5, '第二条规则值正确');
  });

  runner.test('deserializeValidationRules: 无效 JSON 返回空数组', () => {
    const rules = deserializeValidationRules('invalid json');
    assertEqual(rules.length, 0, '无效 JSON 返回空数组');
  });

  runner.test('综合测试: 注册表单完整验证流程', () => {
    const usernameRules: ValidationRule[] = [
      { type: 'required', message: '用户名不能为空' },
      { type: 'minLength', value: 3, message: '用户名最少 3 个字符' },
      { type: 'maxLength', value: 20, message: '用户名最多 20 个字符' },
    ];

    const emailRules: ValidationRule[] = [
      { type: 'required', message: '邮箱不能为空' },
      { type: 'email', message: '请输入有效的邮箱地址' },
    ];

    const passwordRules: ValidationRule[] = [
      { type: 'required', message: '密码不能为空' },
      { type: 'minLength', value: 6, message: '密码最少 6 个字符' },
    ];

    const invalidData = {
      username: { value: '', rules: usernameRules },
      email: { value: 'invalid', rules: emailRules },
      password: { value: '123', rules: passwordRules },
    };

    const validData = {
      username: { value: 'testuser', rules: usernameRules },
      email: { value: 'user@example.com', rules: emailRules },
      password: { value: 'password123', rules: passwordRules },
    };

    const invalidResults = validateForm(invalidData);
    const validResults = validateForm(validData);

    assertEqual(isFormValid(invalidResults), false, '无效数据验证失败');
    assertEqual(invalidResults.username.errors[0], '用户名不能为空', '用户名错误');
    assertEqual(invalidResults.email.errors[0], '请输入有效的邮箱地址', '邮箱错误');
    assertEqual(invalidResults.password.errors[0], '密码最少 6 个字符', '密码错误');

    assertEqual(isFormValid(validResults), true, '有效数据验证通过');
  });

  return runner;
};

export default runFormValidationTests;
