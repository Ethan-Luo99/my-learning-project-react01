import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/utils/classname';
import { Button } from '@/components/ui/Button';

export interface ModalProps {
  visible?: boolean;
  title?: React.ReactNode;
  width?: number | string;
  height?: number | string;
  centered?: boolean;
  closable?: boolean;
  maskClosable?: boolean;
  closeOnEscape?: boolean;
  footer?: React.ReactNode | null;
  okText?: string;
  cancelText?: string;
  okVisible?: boolean;
  cancelVisible?: boolean;
  destroyOnClose?: boolean;
  zIndex?: number;
  maskStyle?: React.CSSProperties;
  bodyStyle?: React.CSSProperties;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  onOk?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

const Modal: React.FC<ModalProps> = ({
  visible = false,
  title,
  width = 520,
  height,
  centered = false,
  closable = true,
  maskClosable = true,
  closeOnEscape = true,
  footer,
  okText = '确定',
  cancelText = '取消',
  okVisible = true,
  cancelVisible = true,
  destroyOnClose = false,
  zIndex = 1000,
  maskStyle,
  bodyStyle,
  className,
  style,
  children,
  onOk,
  onCancel,
  onClose,
}) => {
  const [isOpen, setIsOpen] = React.useState(visible);
  const [hasBeenOpen, setHasBeenOpen] = React.useState(visible);

  React.useEffect(() => {
    if (visible) {
      setIsOpen(true);
      setHasBeenOpen(true);
    } else if (!visible && isOpen) {
      setIsOpen(false);
    }
  }, [visible, isOpen]);

  React.useEffect(() => {
    if (!closeOnEscape || !isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape]);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = React.useCallback(() => {
    setIsOpen(false);
    onCancel?.();
    onClose?.();
  }, [onCancel, onClose]);

  const handleOk = React.useCallback(() => {
    onOk?.();
  }, [onOk]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && maskClosable) {
      handleClose();
    }
  };

  const getWidthStyle = () => {
    if (typeof width === 'number') {
      return { width: `${width}px` };
    }
    return { width };
  };

  const getHeightStyle = () => {
    if (!height) return {};
    if (typeof height === 'number') {
      return { height: `${height}px` };
    }
    return { height };
  };

  const renderFooter = () => {
    if (footer === null) {
      return null;
    }

    if (footer) {
      return (
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          {footer}
        </div>
      );
    }

    if (!okVisible && !cancelVisible) {
      return null;
    }

    return (
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
        {cancelVisible && (
          <Button variant="secondary" onClick={handleClose}>
            {cancelText}
          </Button>
        )}
        {okVisible && (
          <Button variant="primary" onClick={handleOk}>
            {okText}
          </Button>
        )}
      </div>
    );
  };

  const shouldRenderContent = destroyOnClose ? isOpen : hasBeenOpen;

  if (!shouldRenderContent) {
    return null;
  }

  const modalContent = (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex items-center justify-center',
        !isOpen && 'pointer-events-none'
      )}
      style={{ zIndex }}
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={cn(
          'absolute inset-0 backdrop-blur-sm transition-opacity duration-200',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', ...maskStyle }}
      />
      <div
        className={cn(
          'relative bg-white rounded-xl shadow-2xl w-full mx-4 flex flex-col overflow-hidden',
          'transition-all duration-200',
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
          centered ? 'my-8' : 'mt-8 mb-auto',
          className
        )}
        style={{
          ...getWidthStyle(),
          ...getHeightStyle(),
          ...style,
          maxHeight: centered ? 'calc(100vh - 64px)' : 'calc(100vh - 32px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {closable && (
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="关闭"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        <div
          className={cn(
            'flex-1 overflow-auto',
            title ? '' : 'rounded-t-xl'
          )}
          style={bodyStyle}
        >
          <div className="px-6 py-4">{children}</div>
        </div>
        {renderFooter()}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

Modal.displayName = 'Modal';

export interface ConfirmModalProps {
  visible?: boolean;
  title: string;
  message: React.ReactNode;
  okText?: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'danger' | 'primary';
  okVisible?: boolean;
  cancelVisible?: boolean;
  closable?: boolean;
  maskClosable?: boolean;
  isLoading?: boolean;
  width?: number | string;
  onOk?: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible = false,
  title,
  message,
  okText = '确认',
  confirmText,
  cancelText = '取消',
  confirmVariant = 'danger',
  okVisible = true,
  cancelVisible = true,
  closable = true,
  maskClosable = true,
  isLoading = false,
  width = 420,
  onOk,
  onConfirm,
  onCancel,
  onClose,
}) => {
  const actualOkText = confirmText ?? okText;
  const actualOnOk = onConfirm ?? onOk;

  return (
    <Modal
      visible={visible}
      title={title}
      width={width}
      centered={true}
      closable={closable}
      maskClosable={maskClosable}
      okText={actualOkText}
      cancelText={cancelText}
      okVisible={okVisible}
      cancelVisible={cancelVisible}
      onOk={actualOnOk}
      onCancel={onCancel}
      onClose={onClose}
    >
      <div className="text-gray-600">{message}</div>
    </Modal>
  );
};

ConfirmModal.displayName = 'ConfirmModal';

export interface InputModalProps {
  visible?: boolean;
  title: string;
  label?: string;
  placeholder?: string;
  initialValue?: string;
  okText?: string;
  confirmText?: string;
  cancelText?: string;
  closable?: boolean;
  maskClosable?: boolean;
  isLoading?: boolean;
  width?: number | string;
  validate?: (value: string) => string | null;
  onSubmit?: (value: string) => void;
  onCancel?: () => void;
  onClose?: () => void;
}

const InputModal: React.FC<InputModalProps> = ({
  visible = false,
  title,
  label,
  placeholder = '',
  initialValue = '',
  okText = '确认',
  confirmText,
  cancelText = '取消',
  closable = true,
  maskClosable = true,
  isLoading = false,
  width = 420,
  validate,
  onSubmit,
  onCancel,
  onClose,
}) => {
  const [value, setValue] = React.useState(initialValue);
  const [error, setError] = React.useState<string | null>(null);
  const actualOkText = confirmText ?? okText;

  React.useEffect(() => {
    if (visible) {
      setValue(initialValue);
      setError(null);
    }
  }, [visible, initialValue]);

  const handleSubmit = () => {
    if (validate) {
      const validationError = validate(value);
      if (validationError) {
        setError(validationError);
        return;
      }
    }
    onSubmit?.(value);
  };

  return (
    <Modal
      visible={visible}
      title={title}
      width={width}
      centered={true}
      closable={closable}
      maskClosable={maskClosable}
      okText={actualOkText}
      cancelText={cancelText}
      onOk={handleSubmit}
      onCancel={onCancel}
      onClose={onClose}
    >
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-gray-700">{label}</label>
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          placeholder={placeholder}
          className={cn(
            'w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors',
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
          )}
          autoFocus
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  );
};

InputModal.displayName = 'InputModal';

const LoaderIcon = () => (
  <svg
    className="animate-spin"
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export { Modal, ConfirmModal, InputModal, LoaderIcon };
