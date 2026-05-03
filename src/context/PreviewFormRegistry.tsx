import * as React from 'react';
import type { FormValues, FormErrors } from '@/components/ui/Form';

export interface PreviewFormHandle {
  id: string;
  submitForm: () => void;
  resetForm: () => void;
  validateForm: () => boolean;
  getValues: () => FormValues;
  getErrors: () => FormErrors;
}

interface PreviewFormRegistryContextValue {
  forms: Map<string, PreviewFormHandle>;
  registerForm: (handle: PreviewFormHandle) => void;
  unregisterForm: (id: string) => void;
  getForm: (id: string) => PreviewFormHandle | undefined;
  submitForm: (formId?: string) => void;
  resetForm: (formId?: string) => void;
}

const PreviewFormRegistryContext = React.createContext<PreviewFormRegistryContextValue | null>(null);

export const usePreviewFormRegistry = () => {
  const context = React.useContext(PreviewFormRegistryContext);
  if (!context) {
    return {
      forms: new Map(),
      registerForm: () => {},
      unregisterForm: () => {},
      getForm: () => undefined,
      submitForm: () => {},
      resetForm: () => {},
    };
  }
  return context;
};

export const usePreviewFormSubmit = () => {
  const registry = usePreviewFormRegistry();
  
  return (formId?: string) => {
    if (formId) {
      const form = registry.getForm(formId);
      if (form) {
        form.submitForm();
      }
    } else {
      registry.submitForm();
    }
  };
};

export const usePreviewFormReset = () => {
  const registry = usePreviewFormRegistry();
  
  return (formId?: string) => {
    if (formId) {
      const form = registry.getForm(formId);
      if (form) {
        form.resetForm();
      }
    } else {
      registry.resetForm();
    }
  };
};

interface PreviewFormRegistryProviderProps {
  children: React.ReactNode;
}

export const PreviewFormRegistryProvider: React.FC<PreviewFormRegistryProviderProps> = ({ children }) => {
  const formsRef = React.useRef<Map<string, PreviewFormHandle>>(new Map());
  const [, forceUpdate] = React.useState(0);

  const registerForm = React.useCallback((handle: PreviewFormHandle) => {
    formsRef.current.set(handle.id, handle);
    forceUpdate(n => n + 1);
  }, []);

  const unregisterForm = React.useCallback((id: string) => {
    formsRef.current.delete(id);
    forceUpdate((n) => n + 1);
  }, []);

  const getForm = React.useCallback((id: string) => {
    return formsRef.current.get(id);
  }, []);

  const submitForm = React.useCallback((formId?: string) => {
    if (formId) {
      const form = formsRef.current.get(formId);
      if (form) {
        form.submitForm();
      }
      return;
    }
    
    formsRef.current.forEach((form) => {
      form.submitForm();
    });
  }, []);

  const resetForm = React.useCallback((formId?: string) => {
    if (formId) {
      const form = formsRef.current.get(formId);
      if (form) {
        form.resetForm();
      }
      return;
    }
    
    formsRef.current.forEach((form) => {
      form.resetForm();
    });
  }, []);

  const contextValue: PreviewFormRegistryContextValue = React.useMemo(() => ({
    forms: new Map(formsRef.current),
    registerForm,
    unregisterForm,
    getForm,
    submitForm,
    resetForm,
  }), [registerForm, unregisterForm, getForm, submitForm, resetForm]);

  return (
    <PreviewFormRegistryContext.Provider value={contextValue}>
      {children}
    </PreviewFormRegistryContext.Provider>
  );
};
