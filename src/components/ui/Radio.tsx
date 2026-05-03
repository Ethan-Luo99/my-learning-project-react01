import * as React from 'react';
import { cn } from '@/utils/classname';

export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean;
  disabled?: boolean;
  label?: string;
  value?: string | number;
  onChange?: (value: string | number) => void;
}

const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, checked = false, disabled = false, label, value, onChange, name, ...props }, ref) => {
    const internalRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => internalRef.current!);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      if (value !== undefined) {
        onChange?.(value);
      }
    };

    const radioWrapperClass = cn(
      'inline-flex items-center gap-2 cursor-pointer select-none',
      disabled && 'opacity-50 cursor-not-allowed',
      className
    );

    const radioClass = cn(
      'relative w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200',
      disabled ? 'cursor-not-allowed' : 'cursor-pointer',
      checked
        ? 'border-primary-600'
        : 'border-gray-300 hover:border-primary-400',
      !disabled && !checked && 'hover:bg-gray-50'
    );

    const radioDotClass = cn(
      'w-2.5 h-2.5 rounded-full bg-primary-600 transition-all duration-200',
      checked ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
    );

    return (
      <label className={radioWrapperClass}>
        <div className="relative">
          <input
            ref={internalRef}
            type="radio"
            checked={checked}
            disabled={disabled}
            name={name}
            onChange={handleChange}
            className="absolute opacity-0 w-full h-full cursor-pointer"
            {...props}
          />
          <div className={radioClass}>
            <div className={radioDotClass} />
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

Radio.displayName = 'Radio';

export interface RadioOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  options: RadioOption[];
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (value: string | number) => void;
  disabled?: boolean;
  direction?: 'row' | 'column';
  gap?: 'sm' | 'md' | 'lg';
  name?: string;
  className?: string;
  style?: React.CSSProperties;
}

const RadioGroup: React.FC<RadioGroupProps> = ({
  options = [],
  value,
  defaultValue,
  onChange,
  disabled = false,
  direction = 'column',
  gap = 'md',
  name,
  className,
  style,
}) => {
  const [internalValue, setInternalValue] = React.useState<string | number | undefined>(
    value ?? defaultValue
  );

  const currentValue = value !== undefined ? value : internalValue;
  const groupName = name || React.useId();

  const gaps = {
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4',
  };

  const handleRadioChange = (optionValue: string | number) => {
    if (disabled) return;

    if (value === undefined) {
      setInternalValue(optionValue);
    }
    onChange?.(optionValue);
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
      {options.map((option) => (
        <Radio
          key={String(option.value)}
          name={groupName}
          value={option.value}
          checked={currentValue === option.value}
          disabled={disabled || option.disabled}
          label={option.label}
          onChange={handleRadioChange}
        />
      ))}
    </div>
  );
};

RadioGroup.displayName = 'RadioGroup';

export { Radio, RadioGroup };
