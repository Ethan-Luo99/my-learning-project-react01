import * as React from 'react';
import { cn } from '@/utils/classname';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  rows?: number;
  maxLength?: number;
  placeholder?: string;
  resize?: 'none' | 'both' | 'horizontal' | 'vertical';
  error?: boolean;
  errorMessage?: string;
  showCount?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      rows = 4,
      maxLength,
      placeholder,
      resize = 'vertical',
      error = false,
      errorMessage,
      showCount = true,
      value,
      defaultValue,
      onChange,
      disabled = false,
      readOnly = false,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [charCount, setCharCount] = React.useState(0);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    React.useImperativeHandle(ref, () => textareaRef.current!);

    const getResizeClass = (r: string) => {
      switch (r) {
        case 'none':
          return 'resize-none';
        case 'both':
          return 'resize';
        case 'horizontal':
          return 'resize-x';
        case 'vertical':
          return 'resize-y';
        default:
          return 'resize-y';
      }
    };

    React.useEffect(() => {
      if (value !== undefined) {
        setCharCount(String(value).length);
      } else if (defaultValue !== undefined) {
        setCharCount(String(defaultValue).length);
      }
    }, [value, defaultValue]);

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      if (!disabled && !readOnly) {
        setIsFocused(true);
      }
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false);
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      if (maxLength && newValue.length > maxLength) {
        return;
      }
      setCharCount(newValue.length);
      onChange?.(e);
    };

    const textareaClass = cn(
      'w-full px-3 py-2.5 text-base text-gray-900 placeholder:text-gray-400 bg-white rounded-lg border outline-none transition-all duration-200',
      getResizeClass(resize),
      isFocused && 'ring-2 ring-primary-500 ring-offset-2 border-primary-500',
      error
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
        : isFocused
        ? ''
        : 'border-gray-300 hover:border-gray-400',
      disabled && 'bg-gray-100 opacity-60 cursor-not-allowed',
      readOnly && 'bg-gray-50',
      className
    );

    const isOverLimit = maxLength && charCount > maxLength;

    return (
      <div className="w-full">
        <div className="relative">
          <textarea
            ref={textareaRef}
            rows={rows}
            maxLength={maxLength}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            value={value}
            defaultValue={defaultValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={textareaClass}
            {...props}
          />
          {maxLength && showCount && (
            <div
              className={cn(
                'absolute bottom-2 right-3 text-xs',
                isOverLimit ? 'text-red-500' : 'text-gray-400'
              )}
            >
              {charCount}/{maxLength}
            </div>
          )}
        </div>
        {error && errorMessage && (
          <p className="mt-1.5 text-sm text-red-500">{errorMessage}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };
