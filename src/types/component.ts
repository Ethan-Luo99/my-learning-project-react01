import type { ButtonProps, TextProps, ImageProps, ContainerProps } from '@/components/ui';

export enum ComponentType {
  Text = 'Text',
  Button = 'Button',
  Image = 'Image',
  Container = 'Container',
}

export enum ClickEventType {
  None = 'none',
  Alert = 'alert',
  NavigateUrl = 'navigate_url',
  CustomCode = 'custom_code',
}

export interface ClickEventConfig {
  type: ClickEventType;
  alertMessage?: string;
  targetUrl?: string;
  customCode?: string;
}

export interface ComponentEvents {
  onClick?: ClickEventConfig;
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

export type ComponentSchema =
  | TextComponentSchema
  | ButtonComponentSchema
  | ImageComponentSchema
  | ContainerComponentSchema;

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
