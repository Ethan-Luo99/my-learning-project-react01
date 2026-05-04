import React, { useState, useRef, useCallback, useEffect } from 'react';
import { snapToGrid, clamp, GRID_SIZE, COMPONENT_MIN_SIZE } from '@/constants/dnd';
import type { ComponentSchema } from '@/types/component';
import { useBuilderStore } from '@/store/useBuilderStore';
import { logger } from '@/utils/logger';
import { getComponentSize } from '@/utils/size';

export type ResizeHandle = 
  | 'top' 
  | 'bottom' 
  | 'left' 
  | 'right' 
  | 'topLeft' 
  | 'topRight' 
  | 'bottomLeft' 
  | 'bottomRight';

interface ResizeState {
  isResizing: boolean;
  activeHandle: ResizeHandle | null;
  initialBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  initialMousePosition: {
    x: number;
    y: number;
  } | null;
}

interface UseResizeOptions {
  component: ComponentSchema;
  isSelected: boolean;
}

interface ResizeResult {
  isResizing: boolean;
  activeHandle: ResizeHandle | null;
  handleResizeStart: (handle: ResizeHandle, e: React.MouseEvent) => void;
}

interface HandleConfig {
  affectsWidth: boolean;
  affectsHeight: boolean;
  xDirection: -1 | 0 | 1;
  yDirection: -1 | 0 | 1;
}

const HANDLE_CONFIGS: Record<ResizeHandle, HandleConfig> = {
  top: { affectsWidth: false, affectsHeight: true, xDirection: 0, yDirection: -1 },
  bottom: { affectsWidth: false, affectsHeight: true, xDirection: 0, yDirection: 1 },
  left: { affectsWidth: true, affectsHeight: false, xDirection: -1, yDirection: 0 },
  right: { affectsWidth: true, affectsHeight: false, xDirection: 1, yDirection: 0 },
  topLeft: { affectsWidth: true, affectsHeight: true, xDirection: -1, yDirection: -1 },
  topRight: { affectsWidth: true, affectsHeight: true, xDirection: 1, yDirection: -1 },
  bottomLeft: { affectsWidth: true, affectsHeight: true, xDirection: -1, yDirection: 1 },
  bottomRight: { affectsWidth: true, affectsHeight: true, xDirection: 1, yDirection: 1 },
};

export const useResize = ({ component, isSelected }: UseResizeOptions): ResizeResult => {
  const { 
    updateComponent, 
    beginHistoryBatch, 
    endHistoryBatch, 
    cancelHistoryBatch 
  } = useBuilderStore();
  
  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    activeHandle: null,
    initialBounds: null,
    initialMousePosition: null,
  });

  const resizeStateRef = useRef<ResizeState>(resizeState);
  resizeStateRef.current = resizeState;

  const componentRef = useRef(component);
  componentRef.current = component;

  const handleResizeStart = useCallback((handle: ResizeHandle, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const currentComponent = componentRef.current;
    const { width, height } = getComponentSize(currentComponent);
    
    const initialBounds = {
      x: currentComponent.x ?? 0,
      y: currentComponent.y ?? 0,
      width,
      height,
    };

    const initialMousePosition = {
      x: e.clientX,
      y: e.clientY,
    };

    const newState: ResizeState = {
      isResizing: true,
      activeHandle: handle,
      initialBounds,
      initialMousePosition,
    };

    setResizeState(newState);
    beginHistoryBatch();
    logger.log('Resize started:', { handle, initialBounds, initialMousePosition });
  }, [beginHistoryBatch]);

  const calculateResize = useCallback((
    handle: ResizeHandle,
    initialBounds: { x: number; y: number; width: number; height: number },
    deltaX: number,
    deltaY: number
  ): { x: number; y: number; width: number; height: number } => {
    const config = HANDLE_CONFIGS[handle];
    let { x, y, width, height } = initialBounds;

    if (config.affectsWidth) {
      const snappedDeltaX = snapToGrid(deltaX);
      
      if (config.xDirection === 1) {
        const newWidth = Math.max(
          width + snappedDeltaX,
          COMPONENT_MIN_SIZE.WIDTH
        );
        width = snapToGrid(newWidth);
      } else if (config.xDirection === -1) {
        const newWidth = Math.max(
          width - snappedDeltaX,
          COMPONENT_MIN_SIZE.WIDTH
        );
        const actualNewWidth = snapToGrid(newWidth);
        const widthChange = actualNewWidth - width;
        x = x - widthChange;
        width = actualNewWidth;
      }
    }

    if (config.affectsHeight) {
      const snappedDeltaY = snapToGrid(deltaY);
      
      if (config.yDirection === 1) {
        const newHeight = Math.max(
          height + snappedDeltaY,
          COMPONENT_MIN_SIZE.HEIGHT
        );
        height = snapToGrid(newHeight);
      } else if (config.yDirection === -1) {
        const newHeight = Math.max(
          height - snappedDeltaY,
          COMPONENT_MIN_SIZE.HEIGHT
        );
        const actualNewHeight = snapToGrid(newHeight);
        const heightChange = actualNewHeight - height;
        y = y - heightChange;
        height = actualNewHeight;
      }
    }

    width = clamp(width, COMPONENT_MIN_SIZE.WIDTH, Infinity);
    height = clamp(height, COMPONENT_MIN_SIZE.HEIGHT, Infinity);

    return { x, y, width, height };
  }, []);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    const state = resizeStateRef.current;
    if (!state.isResizing || !state.activeHandle || !state.initialBounds || !state.initialMousePosition) {
      return;
    }

    const { activeHandle, initialBounds, initialMousePosition } = state;

    const deltaX = e.clientX - initialMousePosition.x;
    const deltaY = e.clientY - initialMousePosition.y;

    const { x, y, width, height } = calculateResize(activeHandle, initialBounds, deltaX, deltaY);

    const updates: Partial<ComponentSchema> = {};
    
    const config = HANDLE_CONFIGS[activeHandle];
    
    if (config.xDirection === -1 && x !== initialBounds.x) {
      updates.x = x;
    }
    if (config.yDirection === -1 && y !== initialBounds.y) {
      updates.y = y;
    }
    
    if (width !== initialBounds.width) {
      updates.width = width;
    }
    if (height !== initialBounds.height) {
      updates.height = height;
    }

    if (Object.keys(updates).length > 0) {
      logger.log('Resize update:', {
        handle: activeHandle,
        updates,
        initialBounds,
        delta: { x: deltaX, y: deltaY },
      });
      
      updateComponent(componentRef.current.id, updates);
    }
  }, [updateComponent, calculateResize]);

  const handleResizeEnd = useCallback(() => {
    const state = resizeStateRef.current;
    if (state.isResizing) {
      logger.log('Resize ended:', { handle: state.activeHandle });
      setResizeState({
        isResizing: false,
        activeHandle: null,
        initialBounds: null,
        initialMousePosition: null,
      });
      endHistoryBatch();
    }
  }, [endHistoryBatch]);

  const handleResizeCancel = useCallback(() => {
    const state = resizeStateRef.current;
    if (state.isResizing) {
      logger.log('Resize canceled:', { handle: state.activeHandle });
      setResizeState({
        isResizing: false,
        activeHandle: null,
        initialBounds: null,
        initialMousePosition: null,
      });
      cancelHistoryBatch();
    }
  }, [cancelHistoryBatch]);

  useEffect(() => {
    if (resizeState.isResizing) {
      const handleMouseMove = (e: MouseEvent) => handleResizeMove(e);
      const handleMouseUp = () => handleResizeEnd();
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleResizeCancel();
        }
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [resizeState.isResizing, handleResizeMove, handleResizeEnd, handleResizeCancel]);

  return {
    isResizing: resizeState.isResizing,
    activeHandle: resizeState.activeHandle,
    handleResizeStart,
  };
};

export default useResize;
