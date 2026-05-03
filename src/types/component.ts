/**
 * 表单系统类型定义
 * 详细文档请参考：docs/architecture/form-system.md
 * 
 * 包含：
 * - 组件类型枚举（ComponentType）
 * - 验证规则类型（ValidationRuleType、ValidationTrigger）
 * - 数据绑定类型（BindingTrigger、BindingPath、DataBindingRule）
 * - 组件 Schema 定义
 */

import type { ButtonProps, TextProps, ImageProps, ContainerProps, InputProps, TextareaProps, SelectProps, CheckboxProps, CheckboxGroupProps, RadioProps, RadioGroupProps, SwitchProps, FormProps, FormItemProps } from '@/components/ui';
import type { ValidationRule, ValidationResult } from '@/utils/formValidation';

export enum ValidationTrigger {
  Change = 'change',
  Blur = 'blur',
  Submit = 'submit',
}

export enum BindingTrigger {
  Change = 'change',
  Input = 'input',
  Manual = 'manual',
}

export enum BindingPath {
  Value = 'value',
  Options = 'options',
  Disabled = 'disabled',
  Visible = 'visible',
  Label = 'label',
  Placeholder = 'placeholder',
}

export interface DataBindingRule {
  id: string;
  sourceId: string;
  targetId: string;
  sourcePath: string;
  targetPath: string;
  trigger: BindingTrigger;
  transformType?: 'direct' | 'mapping' | 'custom';
  mapping?: Record<string, any>;
  customTransform?: string;
  enabled: boolean;
  label?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DataBindingContextValue {
  bindings: DataBindingRule[];
  addBinding: (binding: Omit<DataBindingRule, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateBinding: (id: string, updates: Partial<DataBindingRule>) => void;
  removeBinding: (id: string) => void;
  getBindingsForSource: (sourceId: string) => DataBindingRule[];
  getBindingsForTarget: (targetId: string) => DataBindingRule[];
  triggerBinding: (sourceId: string, triggerType: BindingTrigger, sourceValue: any) => void;
  isBindingInCycle: (bindingId: string) => boolean;
}

export interface FieldValidationConfig {
  rules: ValidationRule[];
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export interface FormFieldState {
  value: any;
  error: string | null;
  touched: boolean;
  valid: boolean;
  validationResult?: ValidationResult;
}

export enum ComponentType {
  Text = 'Text',
  Button = 'Button',
  Image = 'Image',
  Container = 'Container',
  Input = 'Input',
  Textarea = 'Textarea',
  Select = 'Select',
  Checkbox = 'Checkbox',
  CheckboxGroup = 'CheckboxGroup',
  Radio = 'Radio',
  RadioGroup = 'RadioGroup',
  Switch = 'Switch',
  Form = 'Form',
  FormItem = 'FormItem',
}

export enum ClickEventType {
  None = 'none',
  Alert = 'alert',
  NavigateUrl = 'navigate_url',
  CustomCode = 'custom_code',
  FormSubmit = 'form_submit',
  FormReset = 'form_reset',
}

export interface ClickEventConfig {
  type: ClickEventType;
  alertMessage?: string;
  targetUrl?: string;
  customCode?: string;
  formId?: string;
}

export enum ActionType {
  ShowAlert = 'SHOW_ALERT',
  NavigateUrl = 'NAVIGATE_URL',
  NavigatePage = 'NAVIGATE_PAGE',
  ConsoleLog = 'CONSOLE_LOG',
  CustomScript = 'CUSTOM_SCRIPT',
  FormSubmit = 'FORM_SUBMIT',
  FormReset = 'FORM_RESET',
}

export enum NavigateTarget {
  NewWindow = '_blank',
  CurrentWindow = '_self',
}

export interface ActionConfig {
  id: string;
  type: ActionType;
  params: {
    alertMessage?: string;
    targetUrl?: string;
    navigateTarget?: NavigateTarget;
    pageId?: string;
    logMessage?: string;
    customScript?: string;
    formId?: string;
  };
  enabled: boolean;
}

export enum EventType {
  Click = 'onClick',
  Change = 'onChange',
  Submit = 'onSubmit',
  Focus = 'onFocus',
  Blur = 'onBlur',
}

export interface EventConfig {
  type: EventType;
  actions: ActionConfig[];
  enabled: boolean;
}

export interface ComponentEvents {
  onClick?: ClickEventConfig;
  onClickActions?: EventConfig;
  onChangeActions?: EventConfig;
  onSubmitActions?: EventConfig;
  onFocusActions?: EventConfig;
  onBlurActions?: EventConfig;
}

export type ComponentVariant =
  | ButtonProps['variant']
  | TextProps['variant']
  | ImageProps['rounded']
  | ContainerProps['direction'];

export type ComponentSize = ButtonProps['size'] | ImageProps['rounded'];

export interface ComponentBaseSchema {
  id: string;
  type: ComponentType;
  props: Record<string, any>;
  styles: Record<string, string>;
  x?: number;
  y?: number;
  width?: number | string;
  height?: number | string;
  events?: ComponentEvents;
}

export interface TextComponentSchema extends ComponentBaseSchema {
  type: ComponentType.Text;
  props: Partial<TextProps>;
}

export interface ButtonComponentSchema extends ComponentBaseSchema {
  type: ComponentType.Button;
  props: Partial<ButtonProps>;
}

export interface ImageComponentSchema extends ComponentBaseSchema {
  type: ComponentType.Image;
  props: Partial<ImageProps>;
}

export interface ContainerComponentSchema extends ComponentBaseSchema {
  type: ComponentType.Container;
  props: Partial<ContainerProps>;
  children?: ComponentSchema[];
}

export interface InputComponentSchema extends ComponentBaseSchema {
  type: ComponentType.Input;
  props: Partial<InputProps>;
}

export interface TextareaComponentSchema extends ComponentBaseSchema {
  type: ComponentType.Textarea;
  props: Partial<TextareaProps>;
}

export interface SelectComponentSchema extends ComponentBaseSchema {
  type: ComponentType.Select;
  props: Partial<SelectProps>;
}

export interface CheckboxComponentSchema extends ComponentBaseSchema {
  type: ComponentType.Checkbox;
  props: Partial<CheckboxProps>;
}

export interface CheckboxGroupComponentSchema extends ComponentBaseSchema {
  type: ComponentType.CheckboxGroup;
  props: Partial<CheckboxGroupProps>;
}

export interface RadioComponentSchema extends ComponentBaseSchema {
  type: ComponentType.Radio;
  props: Partial<RadioProps>;
}

export interface RadioGroupComponentSchema extends ComponentBaseSchema {
  type: ComponentType.RadioGroup;
  props: Partial<RadioGroupProps>;
}

export interface SwitchComponentSchema extends ComponentBaseSchema {
  type: ComponentType.Switch;
  props: Partial<SwitchProps>;
}

export interface FormComponentSchema extends ComponentBaseSchema {
  type: ComponentType.Form;
  props: Partial<FormProps>;
  children?: ComponentSchema[];
}

export interface FormItemComponentSchema extends ComponentBaseSchema {
  type: ComponentType.FormItem;
  props: Partial<FormItemProps>;
  children?: ComponentSchema[];
}

export type ComponentSchema =
  | TextComponentSchema
  | ButtonComponentSchema
  | ImageComponentSchema
  | ContainerComponentSchema
  | InputComponentSchema
  | TextareaComponentSchema
  | SelectComponentSchema
  | CheckboxComponentSchema
  | CheckboxGroupComponentSchema
  | RadioComponentSchema
  | RadioGroupComponentSchema
  | SwitchComponentSchema
  | FormComponentSchema
  | FormItemComponentSchema;

export interface ComponentConfig {
  type: ComponentType;
  label: string;
  icon?: string;
  defaultProps: Record<string, any>;
  defaultStyles: Record<string, string>;
  defaultWidth?: number | string;
  defaultHeight?: number | string;
}

export interface ComponentPanelItem {
  type: ComponentType;
  label: string;
  icon?: string;
  category: 'basic' | 'layout' | 'form';
}
