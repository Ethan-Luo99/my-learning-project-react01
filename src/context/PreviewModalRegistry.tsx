import * as React from 'react';

export interface PreviewModalHandle {
  id: string;
  open: () => void;
  close: () => void;
  toggle: () => void;
  isOpen: boolean;
}

interface PreviewModalRegistryContextValue {
  modals: Map<string, PreviewModalHandle>;
  registerModal: (handle: PreviewModalHandle) => void;
  unregisterModal: (id: string) => void;
  getModal: (id: string) => PreviewModalHandle | undefined;
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
  closeAllModals: () => void;
}

const PreviewModalRegistryContext = React.createContext<PreviewModalRegistryContextValue | null>(null);

export const usePreviewModalRegistry = () => {
  const context = React.useContext(PreviewModalRegistryContext);
  if (!context) {
    return {
      modals: new Map(),
      registerModal: () => {},
      unregisterModal: () => {},
      getModal: () => undefined,
      openModal: () => {},
      closeModal: () => {},
      closeAllModals: () => {},
    };
  }
  return context;
};

export const usePreviewModalOpen = () => {
  const registry = usePreviewModalRegistry();
  
  return (modalId: string) => {
    registry.openModal(modalId);
  };
};

export const usePreviewModalClose = () => {
  const registry = usePreviewModalRegistry();
  
  return (modalId: string) => {
    registry.closeModal(modalId);
  };
};

interface PreviewModalRegistryProviderProps {
  children: React.ReactNode;
}

export const PreviewModalRegistryProvider: React.FC<PreviewModalRegistryProviderProps> = ({ children }) => {
  const modalsRef = React.useRef<Map<string, PreviewModalHandle>>(new Map());
  const [, forceUpdate] = React.useState(0);

  const registerModal = React.useCallback((handle: PreviewModalHandle) => {
    modalsRef.current.set(handle.id, handle);
    forceUpdate(n => n + 1);
  }, []);

  const unregisterModal = React.useCallback((id: string) => {
    modalsRef.current.delete(id);
    forceUpdate((n) => n + 1);
  }, []);

  const getModal = React.useCallback((id: string) => {
    return modalsRef.current.get(id);
  }, []);

  const openModal = React.useCallback((modalId: string) => {
    const modal = modalsRef.current.get(modalId);
    if (modal && !modal.isOpen) {
      modal.open();
    }
  }, []);

  const closeModal = React.useCallback((modalId: string) => {
    const modal = modalsRef.current.get(modalId);
    if (modal && modal.isOpen) {
      modal.close();
    }
  }, []);

  const closeAllModals = React.useCallback(() => {
    modalsRef.current.forEach((modal) => {
      if (modal.isOpen) {
        modal.close();
      }
    });
  }, []);

  const contextValue: PreviewModalRegistryContextValue = React.useMemo(() => ({
    modals: new Map(modalsRef.current),
    registerModal,
    unregisterModal,
    getModal,
    openModal,
    closeModal,
    closeAllModals,
  }), [registerModal, unregisterModal, getModal, openModal, closeModal, closeAllModals]);

  return (
    <PreviewModalRegistryContext.Provider value={contextValue}>
      {children}
    </PreviewModalRegistryContext.Provider>
  );
};
