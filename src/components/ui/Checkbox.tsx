import * as React from 'react';
import { cn } from '@/utils/classname';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  label?: string;
  onChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked = false, indeterminate = false, disabled = false, label, onChange, ...props }, ref) => {
    const internalRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => internalRef.current!);

    React.useEffect(() => {
      if (internalRef.current) {
        internalRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      onChange?.(e.target.checked);
    };

    const checkboxWrapperClass = cn(
      'inline-flex items-center gap-2 cursor-pointer select-none',
      disabled && 'opacity-50 cursor-not-allowed',
      className
    );

    const checkboxClass = cn(
      'relative w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200',
      disabled ? 'cursor-not-allowed' : 'cursor-pointer',
      checked || indeterminate
        ? 'bg-primary-600 border-primary-600'
        : 'bg-white border-gray-300 hover:border-primary-400',
      !disabled && !checked && !indeterminate && 'hover:bg-gray-50'
    );

    const checkmarkClass = cn(
      'w-3 h-3 text-white transition-opacity duration-200',
      checked ? 'opacity-100' : 'opacity-0'
    );

    const indeterminateClass = cn(
      'absolute w-2.5 h-0.5 bg-white rounded-sm transition-opacity duration-200',
      indeterminate && !checked ? 'opacity-100' : 'opacity-0'
    );

    return (
      <label className={checkboxWrapperClass}>
        <div className="relative">
          <input
            {...props}
            ref={internalRef}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={handleChange}
            className="absolute opacity-0 w-full h-full cursor-pointer"
          />
          <div className={checkboxClass}>
            <svg
              className={checkmarkClass}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <div className={indeterminateClass} />
          </div>
        </div>
        {label && (
          <span
            className={cn(
              'text-sm text-gray-700',
              disabled && 'text-gray-400'
            )}
          >
            {label}
          </span>
        )}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export interface CheckboxOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface CheckboxGroupProps {
  options: CheckboxOption[];
  value?: (string | number)[];
  defaultValue?: (string | number)[];
  onChange?: (value: (string | number)[]) => void;
  disabled?: boolean;
  direction?: 'row' | 'column';
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  options = [],
  value,
  defaultValue = [],
  onChange,
  disabled = false,
  direction = 'column',
  gap = 'md',
  className,
  style,
}) => {
  const [internalValue, setInternalValue] = React.useState<(string | number)[]>(
    value ?? defaultValue
  );

  const currentValue = value !== undefined ? value : internalValue;

  const gaps = {
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4',
  };

  const isAllChecked = options.length > 0 && options.every((opt) => 
    currentValue.includes(opt.value) && !opt.disabled
  );

  const isIndeterminate = !isAllChecked && 
    options.some((opt) => currentValue.includes(opt.value) && !opt.disabled);

  const handleCheckboxChange = (optionValue: string | number, isChecked: boolean) => {
    if (disabled) return;

    let newValue: (string | number)[];
    if (isChecked) {
      newValue = [...currentValue, optionValue];
    } else {
      newValue = currentValue.filter((v) => v !== optionValue);
    }

    if (value === undefined) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  const handleToggleAll = () => {
    if (disabled) return;

    const enabledOptions = options.filter((opt) => !opt.disabled);
    
    if (isAllChecked) {
      const newValue: (string | number)[] = [];
      if (value === undefined) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);
    } else {
      const newValue = enabledOptions.map((opt) => opt.value);
      if (value === undefined) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);
    }
  };

  return (
    <div
      className={cn(
        'flex',
        direction === 'row' ? 'flex-row flex-wrap' : 'flex-col',
        gaps[gap],
        className
      )}
      style={style}
    >
      {options.length > 1 && (
        <Checkbox
          checked={isAllChecked}
          indeterminate={isIndeterminate}
          disabled={disabled || options.every((opt) => opt.disabled)}
          label="全选"
          onChange={handleToggleAll}
        />
      )}
      {options.map((option) => (
        <Checkbox
          key={String(option.value)}
          checked={currentValue.includes(option.value)}
          disabled={disabled || option.disabled}
          label={option.label}
          onChange={(checked) => handleCheckboxChange(option.value, checked)}
        />
      ))}
    </div>
  );
};

CheckboxGroup.displayName = 'CheckboxGroup';

export { Checkbox, CheckboxGroup };
