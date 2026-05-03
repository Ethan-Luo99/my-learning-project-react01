import * as React from 'react';
import { cn } from '@/utils/classname';

export interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  activeColor?: string;
  inactiveColor?: string;
  checkedText?: string;
  uncheckedText?: string;
  onChange?: (checked: boolean) => void;
  className?: string;
  style?: React.CSSProperties;
}

const Switch: React.FC<SwitchProps> = ({
  checked,
  defaultChecked = false,
  disabled = false,
  loading = false,
  size = 'md',
  activeColor,
  inactiveColor,
  checkedText,
  uncheckedText,
  onChange,
  className,
  style,
}) => {
  const [internalChecked, setInternalChecked] = React.useState(
    checked ?? defaultChecked
  );

  const isChecked = checked !== undefined ? checked : internalChecked;

  const sizes = {
    sm: {
      wrapper: 'w-9 h-5',
      thumb: 'w-4 h-4',
      translate: 'translate-x-4',
      fontSize: 'text-xs',
    },
    md: {
      wrapper: 'w-11 h-6',
      thumb: 'w-5 h-5',
      translate: 'translate-x-5',
      fontSize: 'text-sm',
    },
    lg: {
      wrapper: 'w-14 h-7',
      thumb: 'w-6 h-6',
      translate: 'translate-x-7',
      fontSize: 'text-base',
    },
  };

  const currentSize = sizes[size];

  const handleClick = () => {
    if (disabled || loading) return;

    const newChecked = !isChecked;
    if (checked === undefined) {
      setInternalChecked(newChecked);
    }
    onChange?.(newChecked);
  };

  const wrapperClass = cn(
    'relative inline-flex items-center rounded-full transition-colors duration-200 cursor-pointer',
    currentSize.wrapper,
    isChecked
      ? (activeColor || 'bg-primary-600')
      : (inactiveColor || 'bg-gray-300'),
    (disabled || loading) && 'opacity-50 cursor-not-allowed',
    className
  );

  const thumbClass = cn(
    'absolute rounded-full bg-white shadow transition-transform duration-200 flex items-center justify-center',
    currentSize.thumb,
    isChecked ? currentSize.translate : 'translate-x-0.5'
  );

  const textClass = cn(
    'absolute text-white font-medium',
    currentSize.fontSize
  );

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isChecked}
      disabled={disabled || loading}
      onClick={handleClick}
      className={wrapperClass}
      style={style}
    >
      {isChecked && checkedText && (
        <span className={cn(textClass, 'left-1.5')}>{checkedText}</span>
      )}
      {!isChecked && uncheckedText && (
        <span className={cn(textClass, 'right-1.5')}>{uncheckedText}</span>
      )}
      <span className={thumbClass}>
        {loading && (
          <svg
            className="animate-spin h-3 w-3 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
      </span>
    </button>
  );
};

Switch.displayName = 'Switch';

export { Switch };
export type { SwitchProps };
