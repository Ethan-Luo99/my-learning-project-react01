import * as React from 'react';
import { cn } from '@/utils/classname';
import type { ValidationRule, ValidationResult } from '@/utils/formValidation';
import { validateField, isFormValid } from '@/utils/formValidation';

export interface FormContextValue {
  layout: 'horizontal' | 'vertical' | 'inline';
  labelWidth: number | string;
  labelAlign: 'left' | 'right' | 'top';
  size: 'sm' | 'md' | 'lg';
  disabled: boolean;
}

export interface FormFieldState {
  value: any;
  error: string | null;
  touched: boolean;
  valid: boolean;
  validationResult?: ValidationResult;
}

export interface FormFieldConfig {
  name: string;
  rules?: ValidationRule[];
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  initialValue?: any;
}

export interface FormValues {
  [name: string]: any;
}

export interface FormErrors {
  [name: string]: string | null;
}

export interface FormTouched {
  [name: string]: boolean;
}

export interface FormValidationContextValue {
  values: FormValues;
  errors: FormErrors;
  touched: FormTouched;
  isValid: boolean;
  isSubmitting: boolean;
  setFieldValue: (name: string, value: any, shouldValidate?: boolean) => void;
  setFieldTouched: (name: string, touched?: boolean, shouldValidate?: boolean) => void;
  setFieldError: (name: string, error: string | null) => void;
  validateField: (name: string) => void;
  validateForm: () => boolean;
  resetForm: () => void;
  submitForm: () => void;
  registerField: (config: FormFieldConfig) => void;
  unregisterField: (name: string) => void;
  getFieldState: (name: string) => FormFieldState | undefined;
}

const FormContext = React.createContext<FormContextValue>({
  layout: 'vertical',
  labelWidth: 100,
  labelAlign: 'right',
  size: 'md',
  disabled: false,
});

const FormValidationContext = React.createContext<FormValidationContextValue | null>(null);

export const useFormContext = () => React.useContext(FormContext);
export const useFormValidationContext = () => React.useContext(FormValidationContext);

export interface UseFormFieldProps {
  name: string;
  rules?: ValidationRule[];
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  initialValue?: any;
}

export const useFormField = ({
  name,
  rules = [],
  validateOnChange = true,
  validateOnBlur = false,
  initialValue,
}: UseFormFieldProps) => {
  const formContext = useFormValidationContext();
  const [localValue, setLocalValue] = React.useState<any>(initialValue);
  const [localError, setLocalError] = React.useState<string | null>(null);
  const [localTouched, setLocalTouched] = React.useState(false);

  const validate = React.useCallback((value: any): string | null => {
    if (rules.length === 0) return null;
    const result = validateField(value, rules);
    return result.errors[0] || null;
  }, [rules]);

  if (formContext) {
    const fieldState = formContext.getFieldState(name);
    
    React.useEffect(() => {
      formContext.registerField({
        name,
        rules,
        validateOnChange,
        validateOnBlur,
        initialValue,
      });
      return () => formContext.unregisterField(name);
    }, [formContext, name, rules, validateOnChange, validateOnBlur, initialValue]);

    const value = fieldState?.value ?? initialValue;
    const error = fieldState?.error ?? null;
    const touched = fieldState?.touched ?? false;

    const handleChange = (newValue: any) => {
      formContext.setFieldValue(name, newValue, validateOnChange);
    };

    const handleBlur = () => {
      formContext.setFieldTouched(name, true, validateOnBlur);
    };

    return {
      value,
      error,
      touched,
      setValue: handleChange,
      setTouched: handleBlur,
      setError: (err: string | null) => formContext.setFieldError(name, err),
      validate: () => {
        formContext.validateField(name);
      },
    };
  }

  const handleChange = (newValue: any) => {
    setLocalValue(newValue);
    if (validateOnChange) {
      setLocalError(validate(newValue));
    }
  };

  const handleBlur = () => {
    setLocalTouched(true);
    if (validateOnBlur) {
      setLocalError(validate(localValue));
    }
  };

  return {
    value: localValue,
    error: localError,
    touched: localTouched,
    setValue: handleChange,
    setTouched: handleBlur,
    setError: setLocalError,
    validate: () => {
      setLocalError(validate(localValue));
      setLocalTouched(true);
    },
  };
};

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  layout?: 'horizontal' | 'vertical' | 'inline';
  labelWidth?: number | string;
  labelAlign?: 'left' | 'right' | 'top';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  initialValues?: FormValues;
  onSubmit?: (values: FormValues, isValid: boolean) => void;
  onValidate?: (errors: FormErrors) => void;
  children?: React.ReactNode;
}

interface RegisteredField {
  config: FormFieldConfig;
}

const Form: React.FC<FormProps> = ({
  layout = 'vertical',
  labelWidth = 100,
  labelAlign = 'right',
  size = 'md',
  disabled = false,
  initialValues = {},
  onSubmit,
  onValidate,
  children,
  className,
  ...props
}) => {
  const [values, setValues] = React.useState<FormValues>(initialValues);
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [touched, setTouched] = React.useState<FormTouched>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const registeredFieldsRef = React.useRef<Map<string, RegisteredField>>(new Map());

  const registeredFields = registeredFieldsRef.current;

  const getFieldRules = React.useCallback((name: string): ValidationRule[] => {
    return registeredFields.get(name)?.config.rules || [];
  }, [registeredFields]);

  const validateFieldValue = React.useCallback((name: string, value: any): string | null => {
    const rules = getFieldRules(name);
    if (rules.length === 0) return null;
    const result = validateField(value, rules);
    return result.errors[0] || null;
  }, [getFieldRules]);

  const validateAllFields = React.useCallback((): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    registeredFields.forEach((field, name) => {
      const value = values[name] ?? field.config.initialValue;
      const error = validateFieldValue(name, value);
      newErrors[name] = error;
      if (error) {
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched((prev) => {
      const newTouched = { ...prev };
      registeredFields.forEach((_, name) => {
        newTouched[name] = true;
      });
      return newTouched;
    });

    onValidate?.(newErrors);
    return isValid;
  }, [values, registeredFields, validateFieldValue, onValidate]);

  const setFieldValue = React.useCallback((name: string, value: any, shouldValidate = true) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    
    if (shouldValidate) {
      const error = validateFieldValue(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  }, [validateFieldValue]);

  const setFieldTouched = React.useCallback((name: string, touched = true, shouldValidate = false) => {
    setTouched((prev) => ({ ...prev, [name]: touched }));
    
    if (shouldValidate && touched) {
      const value = values[name];
      const error = validateFieldValue(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  }, [values, validateFieldValue]);

  const setFieldError = React.useCallback((name: string, error: string | null) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  const validateField = React.useCallback((name: string) => {
    const value = values[name];
    const error = validateFieldValue(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
    setTouched((prev) => ({ ...prev, [name]: true }));
  }, [values, validateFieldValue]);

  const validateForm = React.useCallback((): boolean => {
    return validateAllFields();
  }, [validateAllFields]);

  const resetForm = React.useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const submitForm = React.useCallback(() => {
    setIsSubmitting(true);
    
    const isValid = validateAllFields();
    
    const finalValues: FormValues = {};
    registeredFields.forEach((field, name) => {
      finalValues[name] = values[name] ?? field.config.initialValue;
    });

    onSubmit?.(finalValues, isValid);
    setIsSubmitting(false);
  }, [values, registeredFields, validateAllFields, onSubmit]);

  const registerField = React.useCallback((config: FormFieldConfig) => {
    registeredFields.set(config.name, { config });
    
    if (config.initialValue !== undefined && values[config.name] === undefined) {
      setValues((prev) => ({ ...prev, [config.name]: config.initialValue }));
    }
  }, [values, registeredFields]);

  const unregisterField = React.useCallback((name: string) => {
    registeredFields.delete(name);
  }, [registeredFields]);

  const getFieldState = React.useCallback((name: string): FormFieldState | undefined => {
    const fieldConfig = registeredFields.get(name)?.config;
    if (!fieldConfig) return undefined;

    const value = values[name] ?? fieldConfig.initialValue;
    const error = errors[name] ?? null;
    const isTouched = touched[name] ?? false;
    const validationResult = validateField(value, getFieldRules(name));

    return {
      value,
      error,
      touched: isTouched,
      valid: validationResult.valid,
      validationResult,
    };
  }, [values, errors, touched, registeredFields, getFieldRules]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitForm();
  };

  const contextValue: FormContextValue = {
    layout,
    labelWidth,
    labelAlign,
    size,
    disabled,
  };

  const validationContextValue: FormValidationContextValue = {
    values,
    errors,
    touched,
    isValid: Object.values(errors).every((e) => e === null || e === undefined),
    isSubmitting,
    setFieldValue,
    setFieldTouched,
    setFieldError,
    validateField,
    validateForm,
    resetForm,
    submitForm,
    registerField,
    unregisterField,
    getFieldState,
  };

  const formClass = cn(
    'w-full',
    layout === 'inline' && 'flex flex-wrap items-end gap-4',
    className
  );

  return (
    <FormContext.Provider value={contextValue}>
      <FormValidationContext.Provider value={validationContextValue}>
        <form
          className={formClass}
          onSubmit={handleSubmit}
          {...props}
        >
          {children}
        </form>
      </FormValidationContext.Provider>
    </FormContext.Provider>
  );
};

Form.displayName = 'Form';

export interface FormItemProps {
  label?: string;
  required?: boolean;
  error?: boolean;
  errorMessage?: string;
  help?: string;
  name?: string;
  labelWidth?: number | string;
  labelAlign?: 'left' | 'right' | 'top';
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

const FormItem: React.FC<FormItemProps> = ({
  label,
  required = false,
  error = false,
  errorMessage,
  help,
  name,
  labelWidth: propLabelWidth,
  labelAlign: propLabelAlign,
  className,
  style,
  children,
}) => {
  const context = useFormContext();
  const labelWidth = propLabelWidth ?? context.labelWidth;
  const labelAlign = propLabelAlign ?? context.labelAlign;
  const layout = context.layout;

  const renderLabel = () => {
    if (!label) return null;

    const labelClass = cn(
      'text-sm font-medium text-gray-700 flex-shrink-0',
      layout === 'horizontal' && 'py-2.5',
      labelAlign === 'right' && 'text-right',
      labelAlign === 'left' && 'text-left'
    );

    return (
      <label
        className={labelClass}
        style={{
          width: layout === 'horizontal' ? (typeof labelWidth === 'number' ? `${labelWidth}px` : labelWidth) : undefined,
        }}
      >
        {required && (
          <span className="text-red-500 mr-1.5 leading-none">*</span>
        )}
        {label}
      </label>
    );
  };

  const renderContent = () => {
    return (
      <div className="flex-1 min-w-0">
        {children}
        {(error && errorMessage) && (
          <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {errorMessage}
          </p>
        )}
        {help && !error && (
          <p className="mt-1.5 text-sm text-gray-500">{help}</p>
        )}
      </div>
    );
  };

  const wrapperClass = cn(
    'w-full',
    layout === 'horizontal' ? 'flex items-start gap-3' : 'flex flex-col gap-1.5',
    layout === 'inline' && 'w-auto flex-col',
    className
  );

  return (
    <div
      className={wrapperClass}
      style={style}
    >
      {labelAlign === 'top' ? (
        <>
          {renderLabel()}
          {renderContent()}
        </>
      ) : (
        <>
          {renderLabel()}
          {renderContent()}
        </>
      )}
    </div>
  );
};

FormItem.displayName = 'FormItem';

export { Form, FormItem };
