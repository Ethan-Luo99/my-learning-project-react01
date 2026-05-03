import * as React from 'react';
import { cn } from '@/utils/classname';

export interface FormContextValue {
  layout: 'horizontal' | 'vertical' | 'inline';
  labelWidth: number | string;
  labelAlign: 'left' | 'right' | 'top';
  size: 'sm' | 'md' | 'lg';
  disabled: boolean;
}

const FormContext = React.createContext<FormContextValue>({
  layout: 'vertical',
  labelWidth: 100,
  labelAlign: 'right',
  size: 'md',
  disabled: false,
});

export const useFormContext = () => React.useContext(FormContext);

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  layout?: 'horizontal' | 'vertical' | 'inline';
  labelWidth?: number | string;
  labelAlign?: 'left' | 'right' | 'top';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children?: React.ReactNode;
}

const Form: React.FC<FormProps> = ({
  layout = 'vertical',
  labelWidth = 100,
  labelAlign = 'right',
  size = 'md',
  disabled = false,
  children,
  className,
  onSubmit,
  ...props
}) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit?.(e);
  };

  const contextValue: FormContextValue = {
    layout,
    labelWidth,
    labelAlign,
    size,
    disabled,
  };

  const formClass = cn(
    'w-full',
    layout === 'inline' && 'flex flex-wrap items-end gap-4',
    className
  );

  return (
    <FormContext.Provider value={contextValue}>
      <form
        className={formClass}
        onSubmit={handleSubmit}
        {...props}
      >
        {children}
      </form>
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
