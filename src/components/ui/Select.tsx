import * as React from 'react';
import { cn } from '@/utils/classname';
import type { ValidationRule } from '@/utils/formValidation';
import { validateField } from '@/utils/formValidation';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string | number | (string | number)[];
  defaultValue?: string | number | (string | number)[];
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  searchable?: boolean;
  multiple?: boolean;
  onChange?: (value: string | number | (string | number)[] | null, option: SelectOption | SelectOption[] | null) => void;
  onClear?: () => void;
  onSearch?: (keyword: string) => void;
  className?: string;
  style?: React.CSSProperties;
  error?: boolean;
  errorMessage?: string;
  validationRules?: ValidationRule[];
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  onValidationChange?: (error: string | null) => void;
}

const Select: React.FC<SelectProps> = ({
  options = [],
  value: propValue,
  defaultValue,
  placeholder = '请选择',
  disabled = false,
  clearable = false,
  searchable = false,
  multiple = false,
  onChange,
  onClear,
  onSearch,
  className,
  style,
  error: propError = false,
  errorMessage: propErrorMessage,
  validationRules = [],
  validateOnChange = true,
  validateOnBlur = false,
  onValidationChange,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');
  const [internalValue, setInternalValue] = React.useState<string | number | (string | number)[] | null>(
    propValue ?? defaultValue ?? null
  );
  const [internalError, setInternalError] = React.useState<string | null>(null);
  const [touched, setTouched] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const currentValue = propValue !== undefined ? propValue : internalValue;
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

  React.useEffect(() => {
    if (propValue !== undefined) {
      setInternalValue(propValue);
    }
  }, [propValue]);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (isOpen) {
          setIsOpen(false);
          setSearchValue('');
          setTouched(true);
          if (validateOnBlur) {
            handleValidation(currentValue);
          }
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, currentValue, validateOnBlur, handleValidation]);

  React.useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen, searchable]);

  const getSelectedLabel = (): string => {
    if (!currentValue || (Array.isArray(currentValue) && currentValue.length === 0)) {
      return '';
    }

    if (Array.isArray(currentValue)) {
      const labels = currentValue
        .map((v) => options.find((o) => o.value === v))
        .filter((o): o is SelectOption => o !== undefined)
        .map((o) => o.label);
      return labels.join(', ');
    }

    const selectedOption = options.find((o) => o.value === currentValue);
    return selectedOption?.label || '';
  };

  const getSelectedOptions = (): SelectOption[] => {
    if (!currentValue || (Array.isArray(currentValue) && currentValue.length === 0)) {
      return [];
    }

    if (Array.isArray(currentValue)) {
      return currentValue
        .map((v) => options.find((o) => o.value === v))
        .filter((o): o is SelectOption => o !== undefined);
    }

    const selectedOption = options.find((o) => o.value === currentValue);
    return selectedOption ? [selectedOption] : [];
  };

  const isOptionSelected = (optionValue: string | number): boolean => {
    if (!currentValue) return false;
    if (Array.isArray(currentValue)) {
      return currentValue.includes(optionValue);
    }
    return currentValue === optionValue;
  };

  const handleOptionClick = (option: SelectOption, e: React.MouseEvent) => {
    if (option.disabled || disabled) return;

    e.stopPropagation();

    if (multiple) {
      let newValues: (string | number)[];
      if (Array.isArray(currentValue)) {
        if (currentValue.includes(option.value)) {
          newValues = currentValue.filter((v) => v !== option.value);
        } else {
          newValues = [...currentValue, option.value];
        }
      } else {
        newValues = [option.value];
      }

      const newOptions = newValues
        .map((v) => options.find((o) => o.value === v))
        .filter((o): o is SelectOption => o !== undefined);

      setInternalValue(newValues);
      setTouched(true);
      if (validateOnChange) {
        handleValidation(newValues);
      }
      onChange?.(newValues, newOptions);
    } else {
      setInternalValue(option.value);
      setTouched(true);
      if (validateOnChange) {
        handleValidation(option.value);
      }
      onChange?.(option.value, option);
      setIsOpen(false);
      setSearchValue('');
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newValue = multiple ? [] : null;
    setInternalValue(newValue);
    setSearchValue('');
    setTouched(true);
    if (validateOnChange) {
      handleValidation(newValue);
    }
    onChange?.(newValue, null);
    onClear?.();
  };

  const handleRemoveTag = (optionValue: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!Array.isArray(currentValue)) return;

    const newValues = currentValue.filter((v) => v !== optionValue);
    const newOptions = newValues
      .map((v) => options.find((o) => o.value === v))
      .filter((o): o is SelectOption => o !== undefined);

    setInternalValue(newValues);
    setTouched(true);
    if (validateOnChange) {
      handleValidation(newValues);
    }
    onChange?.(newValues, newOptions);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const keyword = e.target.value;
    setSearchValue(keyword);
    onSearch?.(keyword);
  };

  const filteredOptions = searchable
    ? options.filter((o) =>
        o.label.toLowerCase().includes(searchValue.toLowerCase())
      )
    : options;

  const hasValue = Array.isArray(currentValue)
    ? currentValue.length > 0
    : currentValue !== null && currentValue !== undefined && currentValue !== '';

  const showClear = clearable && hasValue && !disabled;

  const selectedOptions = getSelectedOptions();

  const triggerClass = cn(
    'flex items-center w-full min-h-[44px] rounded-lg border bg-white transition-all duration-200 cursor-pointer',
    isOpen && 'ring-2 ring-primary-500 ring-offset-2 border-primary-500',
    effectiveError
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
      : isOpen
      ? ''
      : 'border-gray-300 hover:border-gray-400',
    disabled && 'bg-gray-100 opacity-60 cursor-not-allowed',
    className
  );

  return (
    <div className="w-full">
      <div ref={containerRef} className="relative w-full">
        <div
          className={triggerClass}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          style={style}
        >
          <div className="flex-1 flex flex-wrap items-center gap-1 px-3 py-1.5">
            {multiple && selectedOptions.length > 0 ? (
              <>
                {selectedOptions.map((option) => (
                  <span
                    key={String(option.value)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-sm bg-primary-100 text-primary-700 rounded-md"
                  >
                    {option.label}
                    {!disabled && (
                      <button
                        type="button"
                        onClick={(e) => handleRemoveTag(option.value, e)}
                        className="hover:text-primary-900 transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3 w-3"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    )}
                  </span>
                ))}
                {searchable && isOpen && (
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchValue}
                    onChange={handleSearchChange}
                    placeholder={selectedOptions.length > 0 ? '' : placeholder}
                    className="flex-1 min-w-[80px] outline-none bg-transparent text-sm placeholder:text-gray-400"
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
              </>
            ) : (
              <>
                {hasValue ? (
                  <span className="text-gray-900">{getSelectedLabel()}</span>
                ) : (
                  <span className="text-gray-400">{placeholder}</span>
                )}
                {searchable && isOpen && !multiple && (
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchValue}
                    onChange={handleSearchChange}
                    placeholder={placeholder}
                    className="absolute inset-0 w-full h-full bg-transparent outline-none px-3 py-2.5 text-gray-900 placeholder:text-gray-400"
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
              </>
            )}
          </div>
          <div className="flex items-center pr-3 gap-1">
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
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={cn(
                'h-4 w-4 text-gray-400 transition-transform duration-200',
                isOpen && 'rotate-180'
              )}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        {isOpen && !disabled && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={String(option.value)}
                  onClick={(e) => handleOptionClick(option, e)}
                  className={cn(
                    'flex items-center justify-between px-3 py-2.5 cursor-pointer transition-colors',
                    isOptionSelected(option.value)
                      ? 'bg-primary-50 text-primary-700'
                      : 'hover:bg-gray-50',
                    option.disabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <span className={cn(
                    'text-sm',
                    isOptionSelected(option.value) ? 'font-medium' : ''
                  )}>
                    {option.label}
                  </span>
                  {isOptionSelected(option.value) && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-primary-600"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              ))
            ) : (
              <div className="px-3 py-6 text-center text-gray-400 text-sm">
                暂无选项
              </div>
            )}
          </div>
        )}
      </div>
      {effectiveError && effectiveErrorMessage && (
        <p className="mt-1.5 text-sm text-red-500">{effectiveErrorMessage}</p>
      )}
    </div>
  );
};

Select.displayName = 'Select';

export { Select };
export type { SelectOption, SelectProps };
