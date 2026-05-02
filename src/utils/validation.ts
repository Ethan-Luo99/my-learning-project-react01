import type { ComponentSchema } from '@/types/component';
import { ComponentType } from '@/types/component';

export interface ValidationError {
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export interface ProjectData {
  id?: string;
  name: string;
  components: ComponentSchema[];
  createdAt?: string;
  updatedAt?: string;
}

const VALID_COMPONENT_TYPES = [
  ComponentType.Text,
  ComponentType.Button,
  ComponentType.Image,
  ComponentType.Container,
] as string[];

const INVALID_NAME_CHARACTERS = /[<>:"/\\|?*]/;
const MAX_NAME_LENGTH = 50;

export const validateProjectName = (name: string): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  const trimmedName = name?.trim() || '';

  if (!trimmedName) {
    errors.push({ path: 'name', message: '项目名称不能为空' });
  }

  if (trimmedName.length > MAX_NAME_LENGTH) {
    errors.push({
      path: 'name',
      message: `项目名称不能超过 ${MAX_NAME_LENGTH} 个字符（当前 ${trimmedName.length} 个字符）`,
    });
  }

  if (INVALID_NAME_CHARACTERS.test(trimmedName)) {
    errors.push({
      path: 'name',
      message: '项目名称不能包含特殊字符：< > : " / \\ | ? *',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

const validateComponentSchema = (
  component: unknown,
  path: string = 'components[]'
): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (typeof component !== 'object' || component === null) {
    errors.push({ path, message: '组件必须是对象' });
    return errors;
  }

  const comp = component as Record<string, unknown>;

  if (!('id' in comp) || typeof comp.id !== 'string' || !comp.id.trim()) {
    errors.push({ path: `${path}.id`, message: '组件必须有非空字符串类型的 id' });
  }

  if (!('type' in comp) || typeof comp.type !== 'string') {
    errors.push({ path: `${path}.type`, message: '组件必须有字符串类型的 type' });
  } else if (!VALID_COMPONENT_TYPES.includes(comp.type)) {
    errors.push({
      path: `${path}.type`,
      message: `未知的组件类型: "${comp.type}". 有效值: ${VALID_COMPONENT_TYPES.join(', ')}`,
    });
  }

  if (!('props' in comp) || typeof comp.props !== 'object' || comp.props === null) {
    errors.push({ path: `${path}.props`, message: '组件必须有 props 对象' });
  }

  if (!('styles' in comp) || typeof comp.styles !== 'object' || comp.styles === null) {
    errors.push({ path: `${path}.styles`, message: '组件必须有 styles 对象' });
  }

  if (comp.type === ComponentType.Container) {
    if ('children' in comp) {
      if (!Array.isArray(comp.children)) {
        errors.push({ path: `${path}.children`, message: 'Container 组件的 children 必须是数组' });
      } else {
        for (let i = 0; i < comp.children.length; i++) {
          const childErrors = validateComponentSchema(
            comp.children[i],
            `${path}.children[${i}]`
          );
          errors.push(...childErrors);
        }
      }
    }
  }

  return errors;
};

export const validateComponent = (component: unknown): ValidationResult => {
  const errors = validateComponentSchema(component, 'component');
  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
  };
};

export const validateComponents = (components: unknown[]): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  for (let i = 0; i < components.length; i++) {
    const componentErrors = validateComponentSchema(
      components[i],
      `components[${i}]`
    );
    errors.push(...componentErrors);
  }

  const uniqueIds = new Set<string>();
  const checkDuplicateIds = (comps: unknown[], parentPath: string = '') => {
    for (let i = 0; i < comps.length; i++) {
      const comp = comps[i] as Record<string, unknown>;
      const id = comp?.id as string | undefined;
      const currentPath = parentPath ? `${parentPath}[${i}]` : `[${i}]`;
      
      if (id) {
        if (uniqueIds.has(id)) {
          errors.push({
            path: `components${currentPath}.id`,
            message: `重复的组件 ID: "${id}"`,
          });
        } else {
          uniqueIds.add(id);
        }
      }
      
      if (comp?.type === ComponentType.Container && Array.isArray(comp.children)) {
        checkDuplicateIds(comp.children, `${currentPath}.children`);
      }
    }
  };
  
  checkDuplicateIds(components);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

export const validateProjectData = (data: unknown): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  if (typeof data !== 'object' || data === null) {
    return {
      valid: false,
      errors: [{ path: '', message: '项目数据必须是对象' }],
      warnings: [],
    };
  }

  const project = data as Record<string, unknown>;

  if (!('name' in project) || typeof project.name !== 'string') {
    errors.push({ path: 'name', message: '项目必须有字符串类型的 name' });
  } else {
    const nameValidation = validateProjectName(project.name);
    errors.push(...nameValidation.errors);
    warnings.push(...nameValidation.warnings);
  }

  if (!('components' in project)) {
    errors.push({ path: 'components', message: '项目必须有 components 字段' });
  } else if (!Array.isArray(project.components)) {
    errors.push({ path: 'components', message: 'components 必须是数组' });
  } else {
    const componentsValidation = validateComponents(project.components);
    errors.push(...componentsValidation.errors);
    warnings.push(...componentsValidation.warnings);
  }

  if (('createdAt' in project) && typeof project.createdAt !== 'string') {
    errors.push({ path: 'createdAt', message: 'createdAt 必须是字符串（如果存在）' });
  } else if ('createdAt' in project) {
    const date = new Date(project.createdAt as string);
    if (isNaN(date.getTime())) {
      warnings.push(`createdAt "${project.createdAt}" 不是有效的日期格式`);
    }
  }

  if (('updatedAt' in project) && typeof project.updatedAt !== 'string') {
    errors.push({ path: 'updatedAt', message: 'updatedAt 必须是字符串（如果存在）' });
  } else if ('updatedAt' in project) {
    const date = new Date(project.updatedAt as string);
    if (isNaN(date.getTime())) {
      warnings.push(`updatedAt "${project.updatedAt}" 不是有效的日期格式`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

const LOCALSTORAGE_QUOTA_MB = 5;
const LOCALSTORAGE_WARNING_THRESHOLD = 0.8;
const LOCALSTORAGE_ESTIMATED_OVERHEAD_PER_KEY = 50;

export const estimateLocalStorageUsage = (): {
  usedBytes: number;
  totalBytes: number;
  usedPercentage: number;
  isNearLimit: boolean;
  isOverLimit: boolean;
} => {
  let totalBytes = 0;
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key) || '';
      totalBytes += key.length + value.length * 2 + LOCALSTORAGE_ESTIMATED_OVERHEAD_PER_KEY;
    }
  }

  const quotaBytes = LOCALSTORAGE_QUOTA_MB * 1024 * 1024;
  const usedPercentage = totalBytes / quotaBytes;

  return {
    usedBytes: totalBytes,
    totalBytes: quotaBytes,
    usedPercentage,
    isNearLimit: usedPercentage >= LOCALSTORAGE_WARNING_THRESHOLD,
    isOverLimit: usedPercentage >= 1,
  };
};

export const formatStorageSize = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const getStorageWarningMessage = (): string | null => {
  const usage = estimateLocalStorageUsage();
  
  if (usage.isOverLimit) {
    return `存储空间已满 (${formatStorageSize(usage.usedBytes)} / ${formatStorageSize(usage.totalBytes)})，请清理一些项目后再试`;
  }
  
  if (usage.isNearLimit) {
    return `存储空间即将用尽 (${formatStorageSize(usage.usedBytes)} / ${formatStorageSize(usage.totalBytes)}, ${(usage.usedPercentage * 100).toFixed(0)}%)，建议清理一些项目`;
  }
  
  return null;
};

export const sanitizeProjectName = (name: string): string => {
  let result = name?.trim() || '';
  result = result.replace(INVALID_NAME_CHARACTERS, '_');
  if (result.length > MAX_NAME_LENGTH) {
    result = result.substring(0, MAX_NAME_LENGTH);
  }
  return result || '未命名项目';
};

export const formatValidationErrors = (errors: ValidationError[]): string => {
  if (errors.length === 0) return '';

  const lines = errors.map((e) => {
    if (e.path) {
      return `• ${e.path}: ${e.message}`;
    }
    return `• ${e.message}`;
  });

  return lines.join('\n');
};
