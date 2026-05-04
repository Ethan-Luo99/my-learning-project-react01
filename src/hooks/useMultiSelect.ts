import { useState, useEffect, useCallback, useRef } from 'react';
import { useBuilderStore } from '@/store/useBuilderStore';
import { logger } from '@/utils/logger';

interface UseMultiSelectOptions {
  onComponentClick?: (id: string) => void;
  onCanvasClick?: () => void;
}

interface UseMultiSelectResult {
  isMultiSelectMode: boolean;
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
    addToSelection,
    clearSelection,
    isComponentSelected,
  } = useBuilderStore();

  const [isShiftKeyPressed, setIsShiftKeyPressed] = useState(false);
  const lastClickedIdRef = useRef<string | null>(null);

  const isMultiSelectMode = selectedComponentIds.length > 1 || 
    (selectedComponentIds.length === 1 && selectedComponentId !== selectedComponentIds[0]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift' && !isShiftKeyPressed) {
        setIsShiftKeyPressed(true);
        logger.log('Shift key pressed - multi-select mode enabled');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
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
  }, [isShiftKeyPressed]);

  const handleComponentClick = useCallback((id: string, e?: React.MouseEvent) => {
    const shiftKey = e?.shiftKey || isShiftKeyPressed;
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

    options.onComponentClick?.(id);
  }, [
    isShiftKeyPressed,
    selectedComponentIds,
    isComponentSelected,
    toggleComponentSelection,
    setSelectedComponentId,
    setSelectedComponentIds,
    options,
  ]);

  const handleCanvasClick = useCallback((e?: React.MouseEvent) => {
    const shiftKey = e?.shiftKey || isShiftKeyPressed;

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

    options.onCanvasClick?.();
  }, [isShiftKeyPressed, clearSelection, options]);

  return {
    isMultiSelectMode,
    isShiftKeyPressed,
    handleComponentClick,
    handleCanvasClick,
  };
};

export default useMultiSelect;
