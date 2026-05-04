import { useCallback, useRef, useEffect, useMemo } from 'react';
import { Text } from '@/components/ui';
import { cn } from '@/utils/classname';
import { ComponentRenderer } from '@/components/builder/ComponentRenderer';
import { useBuilderStore } from '@/store/useBuilderStore';
import { useDroppable } from '@dnd-kit/core';
import { DROP_ZONE_ID, DEFAULT_POSITION } from '@/constants/dnd';
import { createCanvasItemId } from '@/constants/dnd';
import { CSS } from '@dnd-kit/utilities';
import type { ComponentSchema } from '@/types/component';
import { useDraggable } from '@dnd-kit/core';
import { useCanvasContext } from '@/components/builder/DndContext';
import { logger } from '@/utils/logger';
import { useResize, type ResizeHandle } from '@/hooks/useResize';
import { useMultiSelect } from '@/hooks/useMultiSelect';

interface CanvasProps {
  className?: string;
}

interface FreeCanvasItemProps {
  component: ComponentSchema;
  isSelected: boolean;
  isPrimarySelection: boolean;
  onClick: (e: React.MouseEvent) => void;
}

const getSizeValue = (value?: number | string): string | number | undefined => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number') return value;
  return value;
};

interface ResizeHandleProps {
  handle: ResizeHandle;
  onMouseDown: (e: React.MouseEvent) => void;
  isResizing: boolean;
}

const ResizeHandleComponent: React.FC<ResizeHandleProps> = ({ handle, onMouseDown, isResizing }) => {
  const getHandleStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'absolute',
      backgroundColor: 'white',
      border: '2px solid #3b82f6',
      borderRadius: '2px',
      zIndex: 20,
    };

    const cornerSize = 8;
    const edgeSize = 6;

    switch (handle) {
      case 'topLeft':
        return {
          ...base,
          width: cornerSize,
          height: cornerSize,
          top: -cornerSize / 2,
          left: -cornerSize / 2,
          cursor: 'nwse-resize',
        };
      case 'top':
        return {
          ...base,
          width: '100%',
          height: edgeSize,
          top: -edgeSize / 2,
          left: 0,
          cursor: 'ns-resize',
          backgroundColor: 'transparent',
          border: 'none',
        };
      case 'topRight':
        return {
          ...base,
          width: cornerSize,
          height: cornerSize,
          top: -cornerSize / 2,
          right: -cornerSize / 2,
          cursor: 'nesw-resize',
        };
      case 'right':
        return {
          ...base,
          width: edgeSize,
          height: '100%',
          top: 0,
          right: -edgeSize / 2,
          cursor: 'ew-resize',
          backgroundColor: 'transparent',
          border: 'none',
        };
      case 'bottomRight':
        return {
          ...base,
          width: cornerSize,
          height: cornerSize,
          bottom: -cornerSize / 2,
          right: -cornerSize / 2,
          cursor: 'nwse-resize',
        };
      case 'bottom':
        return {
          ...base,
          width: '100%',
          height: edgeSize,
          bottom: -edgeSize / 2,
          left: 0,
          cursor: 'ns-resize',
          backgroundColor: 'transparent',
          border: 'none',
        };
      case 'bottomLeft':
        return {
          ...base,
          width: cornerSize,
          height: cornerSize,
          bottom: -cornerSize / 2,
          left: -cornerSize / 2,
          cursor: 'nesw-resize',
        };
      case 'left':
        return {
          ...base,
          width: edgeSize,
          height: '100%',
          top: 0,
          left: -edgeSize / 2,
          cursor: 'ew-resize',
          backgroundColor: 'transparent',
          border: 'none',
        };
      default:
        return base;
    }
  };

  return (
    <div
      style={getHandleStyles()}
      onMouseDown={onMouseDown}
      className={cn(
        'transition-all duration-100',
        isResizing && 'bg-blue-500'
      )}
    />
  );
};

interface ResizeHandlesProps {
  isResizing: boolean;
  onResizeStart: (handle: ResizeHandle, e: React.MouseEvent) => void;
}

const ResizeHandles: React.FC<ResizeHandlesProps> = ({ isResizing, onResizeStart }) => {
  const handles: ResizeHandle[] = [
    'top', 'bottom', 'left', 'right',
    'topLeft', 'topRight', 'bottomLeft', 'bottomRight'
  ];

  return (
    <>
      {handles.map((handle) => (
        <ResizeHandleComponent
          key={handle}
          handle={handle}
          isResizing={isResizing}
          onMouseDown={(e) => onResizeStart(handle, e)}
        />
      ))}
    </>
  );
};

const FreeCanvasItem: React.FC<FreeCanvasItemProps> = ({
  component,
  isSelected,
  isPrimarySelection,
  onClick,
}) => {
  const dndId = createCanvasItemId(component.id);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: dndId,
  });

  const { isResizing, handleResizeStart } = useResize({
    component,
    isSelected: isPrimarySelection,
  });

  const width = getSizeValue(component.width);
  const height = getSizeValue(component.height);

  const style: React.CSSProperties = {
    position: 'absolute',
    left: component.x ?? DEFAULT_POSITION.X,
    top: component.y ?? DEFAULT_POSITION.Y,
    width,
    height,
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging || isResizing ? 50 : (isSelected ? 10 : 1),
    transition: 'opacity 0.2s',
  };

  const wrapperClassName = cn(
    'relative transition-all duration-200',
    isDragging && 'scale-95',
    isSelected && 'ring-2 ring-primary-500 ring-offset-2 rounded-lg',
    isPrimarySelection && isSelected && 'ring-2 ring-blue-500 ring-offset-2 rounded-lg'
  );

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(e);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      data-dnd-id={dndId}
      data-component-wrapper="true"
      className={cn(
        'cursor-grab active:cursor-grabbing',
        isResizing && 'cursor-default'
      )}
      onClick={handleClick}
    >
      <div className={wrapperClassName}>
        <ComponentRenderer
          component={component}
          isSelected={isSelected}
          onClick={() => {}}
        />
        {isPrimarySelection && isSelected && !isDragging && (
          <ResizeHandles
            isResizing={isResizing}
            onResizeStart={handleResizeStart}
          />
        )}
      </div>
    </div>
  );
};

interface EmptyStateProps {
  isOver: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({ isOver }) => {
  return (
    <div
      className={cn(
        'absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none',
        'transition-all duration-300',
        isOver
          ? 'bg-primary-50/80'
          : ''
      )}
    >
      <div
        className={cn(
          'text-6xl transition-transform duration-300',
          isOver && 'scale-110 animate-bounce'
        )}
      >
        {isOver ? '✅' : '📦'}
      </div>
      <div className="text-center">
        <Text
          variant="h3"
          weight="semibold"
          className={cn(
            'mb-2 transition-colors duration-300',
            isOver ? 'text-primary-600' : 'text-gray-600'
          )}
        >
          {isOver ? '释放组件到这里' : '画布为空'}
        </Text>
        <Text
          variant="body"
          color="muted"
          className={cn(
            'transition-colors duration-300',
            isOver ? 'text-primary-500' : 'text-gray-400'
          )}
        >
          {isOver ? '松开鼠标放置组件' : '从左侧组件库拖拽组件到画布任意位置'}
        </Text>
      </div>
      <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
        <div className="flex items-center gap-1 px-3 py-1.5 bg-white/80 rounded-lg border border-gray-200 shadow-sm backdrop-blur-sm">
          <span className="text-sm">T</span>
          <Text variant="caption" color="muted">文本</Text>
        </div>
        <div className="flex items-center gap-1 px-3 py-1.5 bg-white/80 rounded-lg border border-gray-200 shadow-sm backdrop-blur-sm">
          <span className="text-sm">⬛</span>
          <Text variant="caption" color="muted">按钮</Text>
        </div>
        <div className="flex items-center gap-1 px-3 py-1.5 bg-white/80 rounded-lg border border-gray-200 shadow-sm backdrop-blur-sm">
          <span className="text-sm">🖼️</span>
          <Text variant="caption" color="muted">图片</Text>
        </div>
        <div className="flex items-center gap-1 px-3 py-1.5 bg-white/80 rounded-lg border border-gray-200 shadow-sm backdrop-blur-sm">
          <span className="text-sm">📦</span>
          <Text variant="caption" color="muted">容器</Text>
        </div>
      </div>
    </div>
  );
};

const Canvas: React.FC<CanvasProps> = ({ className }) => {
  const { 
    components, 
    selectedComponentId, 
    selectedComponentIds,
    isComponentSelected,
  } = useBuilderStore();
  const { canvasRef } = useCanvasContext();
  const nodeRef = useRef<HTMLElement | null>(null);

  const { setNodeRef, isOver } = useDroppable({
    id: DROP_ZONE_ID,
  });

  const { 
    handleComponentClick: multiSelectHandleComponentClick, 
    handleCanvasClick: multiSelectHandleCanvasClick,
    isShiftKeyPressed,
  } = useMultiSelect();

  const handleSetNodeRef = useCallback(
    (node: HTMLElement | null) => {
      setNodeRef(node);
      nodeRef.current = node;
      if (node) {
        canvasRef.current = node;
        logger.log('Canvas: canvasRef.current 已设置');
      }
    },
    [setNodeRef, canvasRef]
  );

  useEffect(() => {
    if (nodeRef.current && !canvasRef.current) {
      canvasRef.current = nodeRef.current;
      logger.log('Canvas useEffect: 同步 canvasRef.current');
    }
  }, [canvasRef]);

  const handleComponentClick = (id: string, e?: React.MouseEvent) => {
    multiSelectHandleComponentClick(id, e);
    logger.log('选择组件:', id, { isShift: e?.shiftKey || isShiftKeyPressed });
  };

  const handleCanvasClick = (e?: React.MouseEvent) => {
    multiSelectHandleCanvasClick(e);
    logger.log('取消选择组件');
  };

  return (
    <div
      ref={handleSetNodeRef}
      data-dnd-id-container={DROP_ZONE_ID}
      className={cn(
        'min-h-[600px] bg-white rounded-lg shadow-lg border transition-all duration-300 relative overflow-hidden',
        isOver
          ? 'border-primary-400 ring-2 ring-primary-100 bg-primary-50/10'
          : 'border-gray-200',
        className
      )}
      onClick={handleCanvasClick}
      style={{ minHeight: '600px' }}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(to right, #d1d5db 1px, transparent 1px),
            linear-gradient(to bottom, #d1d5db 1px, transparent 1px)
          `,
          backgroundSize: '16px 16px',
        }}
      />

      {components.length === 0 ? (
        <EmptyState isOver={isOver} />
      ) : (
        <>
          <div
            className={cn(
              'absolute inset-0 p-2',
              isOver && 'bg-primary-50/30'
            )}
          >
            {components.map((component) => {
              const isSelected = isComponentSelected(component.id);
              const isPrimarySelection = component.id === selectedComponentId;
              
              return (
                <FreeCanvasItem
                  key={component.id}
                  component={component}
                  isSelected={isSelected}
                  isPrimarySelection={isPrimarySelection}
                  onClick={(e) => handleComponentClick(component.id, e)}
                />
              );
            })}
          </div>

          {isOver && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
              <div className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg shadow-lg">
                <Text variant="body" weight="medium">
                  释放组件到这里放置
                </Text>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export { Canvas, EmptyState, FreeCanvasItem };
export type { CanvasProps };
