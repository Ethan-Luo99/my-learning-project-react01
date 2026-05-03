import * as React from 'react';
import { cn } from '@/utils/classname';

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'horizontal' | 'vertical';
  textPosition?: 'left' | 'center' | 'right';
  dashed?: boolean;
  plain?: boolean;
  children?: React.ReactNode;
}

const Divider = React.forwardRef<HTMLDivElement, DividerProps>(
  (
    {
      className,
      direction = 'horizontal',
      textPosition = 'center',
      dashed = false,
      plain = false,
      children,
      ...props
    },
    ref
  ) => {
    const isVertical = direction === 'vertical';
    const hasContent = children != null && children !== '';

    if (isVertical) {
      return (
        <div
          ref={ref}
          className={cn(
            'inline-flex flex-col items-center',
            'h-full min-h-[1em] mx-2',
            className
          )}
          {...props}
        >
          <div
            className={cn(
              'flex-1 w-px',
              plain ? 'bg-gray-200' : 'bg-gray-300',
              dashed && 'border-l border-dashed bg-transparent'
            )}
          />
          {hasContent && (
            <span
              className={cn(
                'px-2 text-xs',
                plain ? 'text-gray-400' : 'text-gray-500 font-medium'
              )}
            >
              {children}
            </span>
          )}
          <div
            className={cn(
              'flex-1 w-px',
              plain ? 'bg-gray-200' : 'bg-gray-300',
              dashed && 'border-l border-dashed bg-transparent'
            )}
          />
        </div>
      );
    }

    const textPositions = {
      left: 'before:w-8 before:flex-none after:flex-1',
      center: 'before:flex-1 after:flex-1',
      right: 'before:flex-1 after:w-8 after:flex-none',
    };

    if (hasContent) {
      return (
        <div
          ref={ref}
          className={cn(
            'flex items-center w-full my-4',
            textPositions[textPosition],
            className
          )}
          {...props}
        >
          <div
            className={cn(
              'h-px',
              plain ? 'bg-gray-200' : 'bg-gray-300',
              dashed && 'border-t border-dashed bg-transparent'
            )}
          />
          <span
            className={cn(
              'px-4 text-sm',
              plain ? 'text-gray-400' : 'text-gray-600 font-medium'
            )}
          >
            {children}
          </span>
          <div
            className={cn(
              'h-px',
              plain ? 'bg-gray-200' : 'bg-gray-300',
              dashed && 'border-t border-dashed bg-transparent'
            )}
          />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          'w-full my-4 h-px',
          plain ? 'bg-gray-200' : 'bg-gray-300',
          dashed && 'border-t border-dashed bg-transparent h-0',
          className
        )}
        {...props}
      />
    );
  }
);

Divider.displayName = 'Divider';

export { Divider };
