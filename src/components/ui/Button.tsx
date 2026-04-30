import * as React from 'react';
import { cn } from '@/utils/classname';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  color?: 'default' | 'primary' | 'danger';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', color = 'primary', ...props }, ref) => {
    const getVariantStyles = (v: string, c: string) => {
      if (c === 'danger') {
        switch (v) {
          case 'primary':
            return 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm';
          case 'secondary':
            return 'bg-red-100 text-red-900 hover:bg-red-200 active:bg-red-300 shadow-sm';
          case 'outline':
            return 'border-2 border-red-600 text-red-600 hover:bg-red-50 active:bg-red-100 bg-transparent';
          case 'ghost':
            return 'text-red-700 hover:bg-red-100 active:bg-red-200 bg-transparent';
          default:
            return '';
        }
      }

      switch (v) {
        case 'primary':
          return 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-sm';
        case 'secondary':
          return 'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300 shadow-sm';
        case 'outline':
          return 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 active:bg-primary-100 bg-transparent';
        case 'ghost':
          return 'text-gray-700 hover:bg-gray-100 active:bg-gray-200 bg-transparent';
        default:
          return '';
      }
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm rounded-md',
      md: 'px-4 py-2 text-base rounded-lg',
      lg: 'px-6 py-3 text-lg rounded-xl',
    };

    const getFocusRingColor = (c: string) => {
      return c === 'danger' ? 'focus:ring-red-500' : 'focus:ring-primary-500';
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          getVariantStyles(variant, color),
          getFocusRingColor(color),
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button };
