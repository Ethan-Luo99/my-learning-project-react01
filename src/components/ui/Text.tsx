import * as React from 'react';
import { cn } from '@/utils/classname';

type TextVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'body-sm' | 'body2' | 'caption';

type TextElement =
  | HTMLHeadingElement
  | HTMLParagraphElement
  | HTMLSpanElement
  | HTMLElement;

export interface TextProps extends React.HTMLAttributes<TextElement> {
  variant?: TextVariant;
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'danger' | 'muted';
}

const variantToTag: Record<TextVariant, keyof JSX.IntrinsicElements> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  body: 'p',
  'body-sm': 'p',
  body2: 'p',
  caption: 'span',
};

const Text = React.forwardRef<TextElement, TextProps>(
  (
    { className, variant = 'body', weight = 'normal', color = 'default', ...props },
    ref
  ) => {
    const variants = {
      h1: 'text-4xl leading-tight',
      h2: 'text-3xl leading-tight',
      h3: 'text-2xl leading-snug',
      h4: 'text-xl leading-snug',
      body: 'text-base leading-relaxed',
      'body-sm': 'text-sm leading-normal',
      body2: 'text-base leading-relaxed',
      caption: 'text-sm leading-normal',
    };

    const weights = {
      light: 'font-light',
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    };

    const colors = {
      default: 'text-gray-900',
      primary: 'text-primary-600',
      secondary: 'text-gray-500',
      success: 'text-green-600',
      danger: 'text-red-600',
      muted: 'text-gray-400',
    };

    const Tag = variantToTag[variant] as keyof JSX.IntrinsicElements;

    const Component = React.createElement(
      Tag,
      {
        ...props,
        ref: ref as React.Ref<TextElement>,
        className: cn(
          variants[variant],
          weights[weight],
          colors[color],
          className
        ),
      }
    );

    return Component;
  }
);

Text.displayName = 'Text';

export { Text };
