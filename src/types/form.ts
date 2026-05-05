/**
 * 表单相关类型定义
 * 此文件用于打破 Form.tsx 与 PreviewFormRegistry.tsx 之间的循环依赖
 */

export interface FormValues {
  [name: string]: any;
}

export interface FormErrors {
  [name: string]: string | null;
}

export interface FormTouched {
  [name: string]: boolean;
}
