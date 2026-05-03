import * as React from 'react';
import { cn } from '@/utils/classname';
import type { ValidationRule } from '@/utils/formValidation';
import { validateField } from '@/utils/formValidation';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  rows?: number;
  maxLength?: number;
  placeholder?: string;
  resize?: 'none' | 'both' | 'horizontal' | 'vertical';
  error?: boolean;
  errorMessage?: string;
  showCount?: boolean;
  validationRules?: ValidationRule[];
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  onValidationChange?: (error: string | null) => void;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      rows = 4,
      maxLength,
      placeholder,
      resize = 'vertical',
      error: propError = false,
      errorMessage: propErrorMessage,
      showCount = true,
      value: propValue,
      defaultValue,
      onChange,
      disabled = false,
      readOnly = false,
      validationRules = [],
      validateOnChange = true,
      validateOnBlur = false,
      onValidationChange,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [internalValue, setInternalValue] = React.useState<string>(
      propValue !== undefined ? String(propValue) : defaultValue !== undefined ? String(defaultValue) : ''
    );
    const [internalError, setInternalError] = React.useState<string | null>(null);
    const [touched, setTouched] = React.useState(false);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    const currentValue = propValue !== undefined ? String(propValue) : internalValue;
    const hasValidationRules = validationRules && validationRules.length > 0;

    const validate = React.useCallback((val: any): string | null => {
      if (!hasValidationRules) return null;
      const result = validateField(val, validationRules);
      return result.errors[0] || null;
    }, [validationRules, hasValidationRules]);

    const handleValidation = React.useCallback((val: any) => {
      if (!hasValidationRules) return;
      const error = validate(val);
      setInternalError(error);
      onValidationChange?.(error);
    }, [validate, hasValidationRules, onValidationChange]);

    const effectiveError = propError || (touched && internalError !== null);
    const effectiveErrorMessage = propErrorMessage || internalError;
    const charCount = currentValue.length;

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

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      if (!disabled && !readOnly) {
        setIsFocused(true);
      }
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false);
      setTouched(true);
      if (validateOnBlur) {
        handleValidation(currentValue);
      }
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      
      if (propValue === undefined) {
        setInternalValue(newValue);
      }
      
      if (validateOnChange) {
        handleValidation(newValue);
      }
      
      onChange?.(e);
    };

    const textareaClass = cn(
      'w-full px-3 py-2.5 text-base text-gray-900 placeholder:text-gray-400 bg-white rounded-lg border outline-none transition-all duration-200',
      getResizeClass(resize),
      isFocused && 'ring-2 ring-primary-500 ring-offset-2 border-primary-500',
      effectiveError
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
            value={currentValue}
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
        {effectiveError && effectiveErrorMessage && (
          <p className="mt-1.5 text-sm text-red-500">{effectiveErrorMessage}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };
