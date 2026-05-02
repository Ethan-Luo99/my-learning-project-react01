import { useEffect, useRef, useCallback } from 'react';
import { useBuilderStore } from '@/store/useBuilderStore';

const SAVE_DELAY_MS = 2000;

export const useAutoSave = () => {
  const components = useBuilderStore((state) => state.components);
  const saveCurrentProject = useBuilderStore((state) => state.saveCurrentProject);
  const saveStatus = useBuilderStore((state) => state.saveStatus);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastComponentsRef = useRef(JSON.stringify(components));

  const triggerSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveCurrentProject(false);
    }, SAVE_DELAY_MS);
  }, [saveCurrentProject]);

  useEffect(() => {
    const currentComponentsStr = JSON.stringify(components);
    if (currentComponentsStr !== lastComponentsRef.current) {
      lastComponentsRef.current = currentComponentsStr;
      triggerSave();
    }
  }, [components, triggerSave]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return { saveStatus, triggerSave };
};
