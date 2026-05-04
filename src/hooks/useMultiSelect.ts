import { useState, useEffect, useCallback, useRef } from 'react';
import { useBuilderStore } from '@/store/useBuilderStore';
import { logger } from '@/utils/logger';

interface UseMultiSelectOptions {
  onComponentClick?: (id: string) => void;
  onCanvasClick?: () => void;
}

interface UseMultiSelectResult {
  isShiftKeyPressed: boolean;
  handleComponentClick: (id: string, e?: React.MouseEvent) => void;
  handleCanvasClick: (e?: React.MouseEvent) => void;
}

export const useMultiSelect = (
  options: UseMultiSelectOptions = {}
): UseMultiSelectResult => {
  const {
    selectedComponentId,
    selectedComponentIds,
    setSelectedComponentId,
    setSelectedComponentIds,
    toggleComponentSelection,
    clearSelection,
    isComponentSelected,
  } = useBuilderStore();

  const [isShiftKeyPressed, setIsShiftKeyPressed] = useState(false);
  const isShiftKeyPressedRef = useRef(false);
  const optionsRef = useRef(options);
  const lastClickedIdRef = useRef<string | null>(null);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift' && !isShiftKeyPressedRef.current) {
        isShiftKeyPressedRef.current = true;
        setIsShiftKeyPressed(true);
        logger.log('Shift key pressed - multi-select mode enabled');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        isShiftKeyPressedRef.current = false;
        setIsShiftKeyPressed(false);
        logger.log('Shift key released - multi-select mode disabled');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleComponentClick = useCallback((id: string, e?: React.MouseEvent) => {
    const shiftKey = e?.shiftKey || isShiftKeyPressedRef.current;
    const ctrlKey = e?.ctrlKey || e?.metaKey;

    logger.log('Component clicked:', {
      id,
      shiftKey,
      ctrlKey,
      isSelected: isComponentSelected(id),
      currentSelection: selectedComponentIds,
    });

    if (shiftKey || ctrlKey) {
      toggleComponentSelection(id);
      lastClickedIdRef.current = id;
    } else {
      const isCurrentlySelected = isComponentSelected(id);
      
      if (isCurrentlySelected && selectedComponentIds.length > 0) {
        setSelectedComponentIds([id]);
      } else {
        setSelectedComponentId(id);
      }
      
      lastClickedIdRef.current = id;
    }

    optionsRef.current.onComponentClick?.(id);
  }, [
    selectedComponentIds,
    isComponentSelected,
    toggleComponentSelection,
    setSelectedComponentId,
    setSelectedComponentIds,
  ]);

  const handleCanvasClick = useCallback((e?: React.MouseEvent) => {
    const shiftKey = e?.shiftKey || isShiftKeyPressedRef.current;

    if (e) {
      const target = e.target as HTMLElement;
      if (target.closest('[data-component-wrapper]')) {
        return;
      }
    }

    if (!shiftKey) {
      clearSelection();
      lastClickedIdRef.current = null;
      logger.log('Canvas clicked - selection cleared');
    }

    optionsRef.current.onCanvasClick?.();
  }, [clearSelection]);

  return {
    isShiftKeyPressed,
    handleComponentClick,
    handleCanvasClick,
  };
};

export default useMultiSelect;
