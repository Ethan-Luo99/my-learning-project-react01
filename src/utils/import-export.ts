import type { Project, ComponentSchema } from '@/utils/storage';
import { ComponentType } from '@/types/component';
import { saveProject, listProjects, generateProjectId } from '@/utils/storage';

export const EXPORT_FILE_SIZE_WARNING_LIMIT = 5 * 1024 * 1024;
export const EXPORT_FILE_SIZE_ERROR_LIMIT = 20 * 1024 * 1024;

export interface ValidationError {
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export interface ImportResult {
  success: boolean;
  project?: Project;
  errors: ValidationError[];
  warnings: string[];
}

const VALID_COMPONENT_TYPES = [
  ComponentType.Text,
  ComponentType.Button,
  ComponentType.Image,
  ComponentType.Container,
] as string[];

const sanitizeFileName = (name: string): string => {
  return name.replace(/[<>:"/\\|?*]/g, '_').trim();
};

export const generateExportFileName = (projectName: string): string => {
  const timestamp = Date.now();
  const safeName = sanitizeFileName(projectName) || 'project';
  return `${safeName}_${timestamp}.json`;
};

export const serializeProject = (project: Project): string => {
  return JSON.stringify(project, null, 2);
};

export const calculateJSONSize = (jsonString: string): number => {
  return new Blob([jsonString], { type: 'application/json' }).size;
};

export const downloadProject = (project: Project): void => {
  const jsonString = serializeProject(project);
  const fileName = generateExportFileName(project.name);
  const fileSize = calculateJSONSize(jsonString);

  if (fileSize > EXPORT_FILE_SIZE_WARNING_LIMIT) {
    console.warn(
      `Project file is large (${(fileSize / 1024 / 1024).toFixed(2)}MB). Import may take longer.`
    );
  }

  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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
  } else if (!project.name.trim()) {
    errors.push({ path: 'name', message: '项目名称不能为空' });
  }

  if (!('components' in project)) {
    errors.push({ path: 'components', message: '项目必须有 components 字段' });
  } else if (!Array.isArray(project.components)) {
    errors.push({ path: 'components', message: 'components 必须是数组' });
  } else {
    for (let i = 0; i < project.components.length; i++) {
      const componentErrors = validateComponentSchema(
        project.components[i],
        `components[${i}]`
      );
      errors.push(...componentErrors);
    }
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

  const jsonString = JSON.stringify(data);
  const size = calculateJSONSize(jsonString);

  if (size > EXPORT_FILE_SIZE_WARNING_LIMIT) {
    warnings.push(
      `文件较大 (${(size / 1024 / 1024).toFixed(2)}MB)，可能需要更长时间处理`
    );
  }

  if (size > EXPORT_FILE_SIZE_ERROR_LIMIT) {
    errors.push({
      path: '',
      message: `文件过大 (${(size / 1024 / 1024).toFixed(2)}MB)，超出最大限制 ${(EXPORT_FILE_SIZE_ERROR_LIMIT / 1024 / 1024).toFixed(0)}MB`,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

const generateUniqueProjectName = (baseName: string): string => {
  const existingProjects = listProjects();
  const existingNames = new Set(existingProjects.map((p) => p.name.toLowerCase()));

  if (!existingNames.has(baseName.toLowerCase())) {
    return baseName;
  }

  let counter = 1;
  let newName: string;

  do {
    newName = `${baseName} (${counter})`;
    counter++;
  } while (existingNames.has(newName.toLowerCase()));

  return newName;
};

const normalizeComponents = (components: unknown[]): ComponentSchema[] => {
  const normalizeComponent = (comp: unknown): ComponentSchema => {
    const c = comp as Record<string, unknown>;

    const component: Partial<ComponentSchema> = {
      id: typeof c.id === 'string' ? c.id : `comp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: c.type as ComponentType,
      props: typeof c.props === 'object' && c.props !== null ? { ...(c.props as object) } : {},
      styles: typeof c.styles === 'object' && c.styles !== null ? { ...(c.styles as object) } : {},
    };

    if (typeof c.x === 'number') component.x = c.x;
    if (typeof c.y === 'number') component.y = c.y;
    if (typeof c.width === 'number' || typeof c.width === 'string') component.width = c.width as number | string;
    if (typeof c.height === 'number' || typeof c.height === 'string') component.height = c.height as number | string;

    if (c.type === ComponentType.Container && Array.isArray(c.children)) {
      (component as { children?: ComponentSchema[] }).children = c.children.map(normalizeComponent);
    }

    return component as ComponentSchema;
  };

  return components.map(normalizeComponent);
};

export const importProjectFromJSON = (
  jsonString: string,
  options?: { forceName?: string }
): ImportResult => {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  let parsedData: unknown;
  try {
    parsedData = JSON.parse(jsonString);
  } catch (parseError) {
    return {
      success: false,
      errors: [{ path: '', message: `JSON 解析失败: ${parseError instanceof Error ? parseError.message : String(parseError)}` }],
      warnings: [],
    };
  }

  const validation = validateProjectData(parsedData);
  errors.push(...validation.errors);
  warnings.push(...validation.warnings);

  if (!validation.valid) {
    return {
      success: false,
      errors,
      warnings,
    };
  }

  const data = parsedData as Record<string, unknown>;
  const rawName = (options?.forceName || data.name || '导入项目') as string;
  const uniqueName = generateUniqueProjectName(rawName);

  if (uniqueName !== rawName) {
    warnings.push(`项目名 "${rawName}" 已存在，自动重命名为 "${uniqueName}"`);
  }

  const componentsData = Array.isArray(data.components) ? data.components : [];
  const normalizedComponents = normalizeComponents(componentsData);

  const now = new Date().toISOString();
  const createdAt = (data.createdAt as string) || now;
  const updatedAt = now;

  const newProject: Project = {
    id: generateProjectId(),
    name: uniqueName,
    components: normalizedComponents,
    createdAt,
    updatedAt,
  };

  try {
    const savedProject = saveProject(newProject);
    return {
      success: true,
      project: savedProject,
      errors: [],
      warnings,
    };
  } catch (saveError) {
    return {
      success: false,
      errors: [
        {
          path: '',
          message: `保存项目失败: ${saveError instanceof Error ? saveError.message : String(saveError)}`,
        },
      ],
      warnings,
    };
  }
};

export const selectFileForImport = (): Promise<File | null> => {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';

    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0] || null;
      resolve(file);
    };

    input.oncancel = () => {
      resolve(null);
    };

    input.click();
  });
};

export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result as string;
      resolve(content);
    };

    reader.onerror = () => {
      reject(new Error('读取文件失败'));
    };

    reader.readAsText(file);
  });
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
