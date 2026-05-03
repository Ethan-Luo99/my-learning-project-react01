/**
 * 表单验证引擎
 * 详细文档请参考：docs/architecture/form-system.md
 * 
 * 功能：
 * - 支持多种验证规则：required、minLength、maxLength、min、max、pattern、email、url、custom
 * - 单字段验证和表单级验证
 * - 验证规则序列化/反序列化（用于持久化）
 */

export type ValidationRuleType =
  | 'required'
  | 'minLength'
  | 'maxLength'
  | 'min'
  | 'max'
  | 'pattern'
  | 'email'
  | 'url'
  | 'custom';

export interface ValidationRule {
  type: ValidationRuleType;
  message?: string;
  value?: number | string | boolean | RegExp;
  customValidator?: (value: any) => boolean | string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface FieldValidationConfig {
  rules: ValidationRule[];
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_PATTERN = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;

const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
};

export const validateRequired = (
  value: any,
  message?: string
): string | null => {
  if (isEmpty(value)) {
    return message || '此字段为必填项';
  }
  return null;
};

export const validateMinLength = (
  value: any,
  minLength: number,
  message?: string
): string | null => {
  if (isEmpty(value)) return null;
  
  const strValue = String(value);
  if (strValue.length < minLength) {
    return message || `最少需要 ${minLength} 个字符`;
  }
  return null;
};

export const validateMaxLength = (
  value: any,
  maxLength: number,
  message?: string
): string | null => {
  if (isEmpty(value)) return null;
  
  const strValue = String(value);
  if (strValue.length > maxLength) {
    return message || `最多允许 ${maxLength} 个字符`;
  }
  return null;
};

export const validateMin = (
  value: any,
  min: number,
  message?: string
): string | null => {
  if (isEmpty(value)) return null;
  
  const numValue = Number(value);
  if (isNaN(numValue)) {
    return message || '请输入有效的数字';
  }
  if (numValue < min) {
    return message || `最小值为 ${min}`;
  }
  return null;
};

export const validateMax = (
  value: any,
  max: number,
  message?: string
): string | null => {
  if (isEmpty(value)) return null;
  
  const numValue = Number(value);
  if (isNaN(numValue)) {
    return message || '请输入有效的数字';
  }
  if (numValue > max) {
    return message || `最大值为 ${max}`;
  }
  return null;
};

export const validatePattern = (
  value: any,
  pattern: string | RegExp,
  message?: string
): string | null => {
  if (isEmpty(value)) return null;
  
  const strValue = String(value);
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
  if (!regex.test(strValue)) {
    return message || '格式不正确';
  }
  return null;
};

export const validateEmail = (
  value: any,
  message?: string
): string | null => {
  if (isEmpty(value)) return null;
  
  const strValue = String(value);
  if (!EMAIL_PATTERN.test(strValue)) {
    return message || '请输入有效的邮箱地址';
  }
  return null;
};

export const validateUrl = (
  value: any,
  message?: string
): string | null => {
  if (isEmpty(value)) return null;
  
  const strValue = String(value);
  if (!URL_PATTERN.test(strValue)) {
    return message || '请输入有效的URL';
  }
  return null;
};

export const validateCustom = (
  value: any,
  validator: (value: any) => boolean | string,
  message?: string
): string | null => {
  if (isEmpty(value)) return null;
  
  try {
    const result = validator(value);
    if (result === false) {
      return message || '验证失败';
    }
    if (typeof result === 'string') {
      return result;
    }
    return null;
  } catch (error) {
    console.error('自定义验证错误:', error);
    return message || '验证发生错误';
  }
};

export const validateRule = (
  value: any,
  rule: ValidationRule
): string | null => {
  switch (rule.type) {
    case 'required':
      return validateRequired(value, rule.message);
    case 'minLength':
      return validateMinLength(value, rule.value as number, rule.message);
    case 'maxLength':
      return validateMaxLength(value, rule.value as number, rule.message);
    case 'min':
      return validateMin(value, rule.value as number, rule.message);
    case 'max':
      return validateMax(value, rule.value as number, rule.message);
    case 'pattern':
      return validatePattern(value, rule.value as string | RegExp, rule.message);
    case 'email':
      return validateEmail(value, rule.message);
    case 'url':
      return validateUrl(value, rule.message);
    case 'custom':
      if (rule.customValidator) {
        return validateCustom(value, rule.customValidator, rule.message);
      }
      return null;
    default:
      return null;
  }
};

export const validateField = (
  value: any,
  rules: ValidationRule[]
): ValidationResult => {
  const errors: string[] = [];
  
  for (const rule of rules) {
    const error = validateRule(value, rule);
    if (error) {
      errors.push(error);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

export const validateForm = (
  fields: Record<string, { value: any; rules: ValidationRule[] }>
): Record<string, ValidationResult> => {
  const results: Record<string, ValidationResult> = {};
  
  for (const [fieldName, field] of Object.entries(fields)) {
    results[fieldName] = validateField(field.value, field.rules);
  }
  
  return results;
};

export const isFormValid = (
  validationResults: Record<string, ValidationResult>
): boolean => {
  return Object.values(validationResults).every((result) => result.valid);
};

export const getFirstErrorMessage = (
  validationResult: ValidationResult
): string | null => {
  return validationResult.errors[0] || null;
};

export const serializeValidationRules = (rules: ValidationRule[]): string => {
  return JSON.stringify(rules.map(rule => {
    const { customValidator, ...rest } = rule;
    return rest;
  }));
};

export const deserializeValidationRules = (serialized: string): ValidationRule[] => {
  try {
    return JSON.parse(serialized);
  } catch {
    return [];
  }
};
