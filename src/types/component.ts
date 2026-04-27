import type { ButtonProps, TextProps, ImageProps, ContainerProps } from '@/components/ui';

export enum ComponentType {
  Text = 'Text',
  Button = 'Button',
  Image = 'Image',
  Container = 'Container',
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
}

export interface ComponentPanelItem {
  type: ComponentType;
  label: string;
  icon?: string;
  category: 'basic' | 'layout' | 'form';
}
