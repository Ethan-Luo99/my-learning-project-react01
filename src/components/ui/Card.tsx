import * as React from 'react';
import { cn } from '@/utils/classname';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  bordered?: boolean;
  headerTitle?: string;
  hoverable?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      shadow = 'md',
      padding = 'md',
      bordered = true,
      headerTitle,
      hoverable = false,
      children,
      ...props
    },
    ref
  ) => {
    const shadows = {
      none: 'shadow-none',
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg',
    };

    const paddings = {
      none: 'p-0',
      sm: 'p-2',
      md: 'p-4',
      lg: 'p-6',
    };

    const bodyPaddings = {
      none: '',
      sm: 'px-2 py-1',
      md: 'px-4 py-3',
      lg: 'px-6 py-4',
    };

    return (
      <div
        {...props}
        ref={ref}
        className={cn(
          'bg-white rounded-lg transition-all duration-200',
          shadows[shadow],
          bordered && 'border border-gray-200',
          hoverable && 'hover:shadow-lg hover:-translate-y-0.5 cursor-pointer',
          className
        )}
      >
        {headerTitle && (
          <div
            className={cn(
              'flex items-center border-b border-gray-200 font-semibold text-gray-800',
              bodyPaddings[padding],
              padding === 'none' ? 'py-2 px-3' : ''
            )}
          >
            {headerTitle}
          </div>
        )}
        <div className={cn(paddings[padding])}>
          {children}
        </div>
      </div>
    );
  }
);

Card.displayName = 'Card';

export { Card };
