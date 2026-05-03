import * as React from 'react';
import { cn } from '@/utils/classname';
import type { ValidationRule } from '@/utils/formValidation';
import { validateField } from '@/utils/formValidation';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  type?: 'text' | 'number' | 'email' | 'password';
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  clearable?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  error?: boolean;
  errorMessage?: string;
  onClear?: () => void;
  validationRules?: ValidationRule[];
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  onValidationChange?: (error: string | null) => void;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      placeholder,
      disabled = false,
      readOnly = false,
      clearable = false,
      prefix,
      suffix,
      error: propError = false,
      errorMessage: propErrorMessage,
      value: propValue,
      defaultValue,
      onChange,
      onClear,
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
    const inputRef = React.useRef<HTMLInputElement>(null);

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

    React.useImperativeHandle(ref, () => inputRef.current!);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      if (!disabled && !readOnly) {
        setIsFocused(true);
      }
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setTouched(true);
      if (validateOnBlur) {
        handleValidation(currentValue);
      }
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      
      if (propValue === undefined) {
        setInternalValue(newValue);
      }
      
      if (validateOnChange) {
        handleValidation(newValue);
      }
      
      onChange?.(e);
    };

    const handleClear = () => {
      if (disabled || readOnly) return;
      const event = {
        target: { value: '' },
        currentTarget: { value: '' },
      } as React.ChangeEvent<HTMLInputElement>;
      
      if (propValue === undefined) {
        setInternalValue('');
      }
      
      if (validateOnChange || validateOnBlur) {
        setTouched(true);
        handleValidation('');
      }
      
      onChange?.(event);
      onClear?.();
      inputRef.current?.focus();
    };

    const hasValue = currentValue !== '';
    const showClear = clearable && hasValue && !disabled && !readOnly;

    const inputWrapperClass = cn(
      'flex items-center w-full rounded-lg border bg-white transition-all duration-200',
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

    const inputClass = cn(
      'flex-1 w-full px-3 py-2.5 text-base text-gray-900 placeholder:text-gray-400 bg-transparent outline-none',
      prefix && 'pl-0',
      suffix && 'pr-0',
      disabled && 'cursor-not-allowed'
    );

    return (
      <div className="w-full">
        <div className={inputWrapperClass}>
          {prefix && (
            <div className="flex items-center pl-3 text-gray-500 pointer-events-none">
              {prefix}
            </div>
          )}
          <input
            ref={inputRef}
            type={type}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            value={currentValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={inputClass}
            {...props}
          />
          <div className="flex items-center pr-3 gap-2">
            {showClear && (
              <button
                type="button"
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                tabIndex={-1}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
            {suffix && (
              <div className="text-gray-500 pointer-events-none">
                {suffix}
              </div>
            )}
          </div>
        </div>
        {effectiveError && effectiveErrorMessage && (
          <p className="mt-1.5 text-sm text-red-500">{effectiveErrorMessage}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
