import React, { useCallback, useState, useRef, createContext, useContext, useMemo } from 'react';
import {
  DndContext as DndKitContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
  type DragMoveEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { ComponentType, type ComponentSchema, type ContainerComponentSchema } from '@/types/component';
import { useBuilderStore } from '../../store/useBuilderStore';
import {
  isPanelItem,
  isCanvasItem,
  isSortableItem,
  getPanelItemType,
  getCanvasItemId,
  getSortableItemId,
  DROP_ZONE_ID,
  snapToGrid,
  GRID_SIZE,
  DEFAULT_POSITION,
  COMPONENT_MIN_SIZE,
  isOverCanvas,
  clamp,
  isContainerDropZone,
  getContainerIdFromDropZone,
  createSortableItemId,
} from '@/constants/dnd';
import { generateId } from '@/utils/id';
import { DEFAULT_COMPONENT_CONFIGS } from '@/constants/mockData';
import { Text } from '@/components/ui';
import { cn } from '@/utils/classname';
import { logger } from '@/utils/logger';

interface CanvasContextValue {
  canvasRef: React.MutableRefObject<HTMLElement | null>;
  isOverDropZoneRef: React.MutableRefObject<boolean>;
}

const CanvasContext = createContext<CanvasContextValue | null>(null);

export const useCanvasContext = (): CanvasContextValue => {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvasContext must be used within DndContextProvider');
  }
  return context;
};

const isContainerComponent = (
  component: ComponentSchema
): component is ContainerComponentSchema => {
  return (
    component.type === ComponentType.Container ||
    component.type === ComponentType.Card ||
    component.type === ComponentType.Tabs ||
    component.type === ComponentType.TabPane ||
    component.type === ComponentType.Accordion ||
    component.type === ComponentType.AccordionItem ||
    component.type === ComponentType.Modal ||
    component.type === ComponentType.Form ||
    component.type === ComponentType.FormItem
  );
};

const createComponentFromType = (type: string, x: number = DEFAULT_POSITION.X, y: number = DEFAULT_POSITION.Y): ComponentSchema => {
  const componentType = type as ComponentType;
  const config = DEFAULT_COMPONENT_CONFIGS[componentType];
  const id = generateId(type.toLowerCase());

  const component: ComponentSchema = {
    id,
    type: componentType,
    props: { ...config.defaultProps },
    styles: { ...config.defaultStyles },
    x: snapToGrid(x),
    y: snapToGrid(y),
    width: config.defaultWidth,
    height: config.defaultHeight,
  };

  if (
    componentType === ComponentType.Container ||
    componentType === ComponentType.Card ||
    componentType === ComponentType.Tabs ||
    componentType === ComponentType.TabPane ||
    componentType === ComponentType.Accordion ||
    componentType === ComponentType.AccordionItem ||
    componentType === ComponentType.Modal ||
    componentType === ComponentType.Form ||
    componentType === ComponentType.FormItem
  ) {
    (component as ContainerComponentSchema).children = [];
  }

  return component;
};

interface DndContextProviderProps {
  children: React.ReactNode;
}

interface ActiveDragItem {
  id: string;
  type?: string;
  label?: string;
  isFromPanel: boolean;
}

const DragPreview: React.FC<{ item: ActiveDragItem }> = ({ item }) => {
  const getIcon = () => {
    const icons: Record<string, string> = {
      Text: 'T',
      Button: '⬛',
      Image: '🖼️',
      Container: '📦',
      Card: '🃏',
      Divider: '━',
      Tabs: '📑',
      TabPane: '📄',
      Accordion: '🗂️',
      AccordionItem: '📁',
      Modal: '📋',
    };
    return item.type ? icons[item.type] || '?' : '?';
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-3 bg-white shadow-lg rounded-lg border-2',
        'border-primary-400 opacity-90 cursor-grabbing pointer-events-none'
      )}
    >
      <span className="text-xl">{getIcon()}</span>
      <Text variant="body" weight="medium">
        {item.label || item.type || '组件'}
      </Text>
    </div>
  );
};

interface DragPosition {
  x: number;
  y: number;
}

interface MultiDragState {
  activeComponentId: string;
  selectedComponentIds: string[];
  initialPositions: Map<string, { x: number; y: number }>;
  activeComponentInitialX: number;
  activeComponentInitialY: number;
}

export const DndContextProvider: React.FC<DndContextProviderProps> = ({ children }) => {
  const { 
    addComponent, 
    updateComponent, 
    addComponentToParent,
    moveComponentToParent,
    selectedComponentIds,
    selectedComponentId,
    isComponentSelected,
    getSelectedComponents,
    updateSelectedComponents,
  } = useBuilderStore();

  const [activeDragItem, setActiveDragItem] = useState<ActiveDragItem | null>(null);

  const canvasRef = useRef<HTMLElement | null>(null);
  const isOverDropZoneRef = useRef(false);
  const lastMousePositionRef = useRef<DragPosition | null>(null);
  const globalMousePositionRef = useRef<DragPosition>({ x: 0, y: 0 });
  const isDraggingPanelItemRef = useRef(false);
  const multiDragStateRef = useRef<MultiDragState | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleGlobalPointerMove = useCallback((e: PointerEvent) => {
    globalMousePositionRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const getCanvasRelativePosition = (
    clientX: number,
    clientY: number
  ): { x: number; y: number } => {
    logger.log('=== 【诊断 2】getCanvasRelativePosition 诊断 ===');
    logger.log('传入的坐标 (clientX, clientY):', clientX, clientY);

    let canvasElement = canvasRef.current;

    if (!canvasElement) {
      logger.warn('canvasRef.current 为 null，使用备用查找');
      canvasElement = document.querySelector(`[data-dnd-id-container="${DROP_ZONE_ID}"]`) as HTMLElement | null;
    }

    if (!canvasElement) {
      logger.error('未找到画布元素，返回默认位置 (32, 32)');
      return { x: DEFAULT_POSITION.X, y: DEFAULT_POSITION.Y };
    }

    if (!canvasRef.current) {
      canvasRef.current = canvasElement;
      logger.log('已同步 canvasRef.current');
    }

    const rect = canvasElement.getBoundingClientRect();
    logger.log('【诊断 2】画布 rect 完整信息:', {
      top: rect.top,
      left: rect.left,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
      x: rect.x,
      y: rect.y,
    });

    logger.log('window.scrollX:', window.scrollX);
    logger.log('window.scrollY:', window.scrollY);

    const scrollLeft = canvasElement.scrollLeft || 0;
    const scrollTop = canvasElement.scrollTop || 0;
    logger.log('画布滚动位置 (scrollLeft, scrollTop):', scrollLeft, scrollTop);

    logger.log('=== 【诊断 3】坐标计算详细步骤 ===');
    logger.log('输入参数:');
    logger.log('  clientX:', clientX);
    logger.log('  clientY:', clientY);
    logger.log('  rect.left:', rect.left);
    logger.log('  rect.top:', rect.top);
    logger.log('  rect.width:', rect.width);
    logger.log('  rect.height:', rect.height);
    logger.log('  scrollLeft:', scrollLeft);
    logger.log('  scrollTop:', scrollTop);

    const relativeX = clientX - rect.left + scrollLeft;
    const relativeY = clientY - rect.top + scrollTop;

    logger.log('计算步骤 1 - 相对坐标:');
    logger.log('  clientX - rect.left =', clientX, '-', rect.left, '=', clientX - rect.left);
    logger.log('  + scrollLeft =', clientX - rect.left, '+', scrollLeft, '=', relativeX);
    logger.log('  relativeX:', relativeX);
    logger.log('  relativeY:', relativeY);

    const maxX = Math.max(0, rect.width - COMPONENT_MIN_SIZE.WIDTH);
    const maxY = Math.max(0, rect.height - COMPONENT_MIN_SIZE.HEIGHT);

    logger.log('计算步骤 2 - 边界限制:');
    logger.log('  maxX = rect.width - COMPONENT_MIN_SIZE.WIDTH =', rect.width, '-', COMPONENT_MIN_SIZE.WIDTH, '=', maxX);
    logger.log('  maxY = rect.height - COMPONENT_MIN_SIZE.HEIGHT =', rect.height, '-', COMPONENT_MIN_SIZE.HEIGHT, '=', maxY);
    logger.log('  clamp 参数: relativeX =', relativeX, ', min = 0, maxX =', maxX);
    logger.log('  clamp 参数: relativeY =', relativeY, ', min = 0, maxY =', maxY);

    const x = clamp(relativeX, 0, maxX);
    const y = clamp(relativeY, 0, maxY);

    logger.log('  clamp 后 x:', x);
    logger.log('  clamp 后 y:', y);

    logger.log('计算步骤 3 - 网格对齐:');
    logger.log('  GRID_SIZE:', GRID_SIZE);
    logger.log('  snapToGrid(x) = Math.round(', x, '/', GRID_SIZE, ') *', GRID_SIZE);
    logger.log('  = Math.round(', x / GRID_SIZE, ') *', GRID_SIZE);
    logger.log('  =', Math.round(x / GRID_SIZE), '*', GRID_SIZE);

    const snappedX = snapToGrid(x);
    const snappedY = snapToGrid(y);

    logger.log('  snapToGrid 后 snappedX:', snappedX);
    logger.log('  snapToGrid 后 snappedY:', snappedY);

    logger.log('=== 【诊断 3】最终结果 ===');
    logger.log('返回坐标:', { x: snappedX, y: snappedY });

    return { x: snappedX, y: snappedY };
  };

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const activeIdStr = String(active.id);

    logger.log('=== handleDragStart ===');
    logger.log('active.id:', activeIdStr);
    logger.log('isPanelItem:', isPanelItem(activeIdStr));
    logger.log('isSortableItem:', isSortableItem(activeIdStr));

    lastMousePositionRef.current = null;
    window.addEventListener('pointermove', handleGlobalPointerMove);
    logger.log('已添加全局 pointermove 监听');

    isDraggingPanelItemRef.current = isPanelItem(activeIdStr);
    isOverDropZoneRef.current = false;

    if (isCanvasItem(activeIdStr) || isSortableItem(activeIdStr)) {
      const actualActiveId = isCanvasItem(activeIdStr) 
        ? getCanvasItemId(activeIdStr) 
        : getSortableItemId(activeIdStr);
      
      const isActiveSelected = isComponentSelected(actualActiveId);
      const currentSelectedComponents = getSelectedComponents();
      
      logger.log('拖拽开始检测:', {
        actualActiveId,
        isActiveSelected,
        selectedCount: currentSelectedComponents.length,
        selectedComponentIds,
        selectedComponentId,
      });

      if (isActiveSelected && currentSelectedComponents.length > 0) {
        const initialPositions = new Map<string, { x: number; y: number }>();
        let activeComponentInitialX = 0;
        let activeComponentInitialY = 0;

        for (const comp of currentSelectedComponents) {
          const compX = comp.x ?? DEFAULT_POSITION.X;
          const compY = comp.y ?? DEFAULT_POSITION.Y;
          
          initialPositions.set(comp.id, { x: compX, y: compY });
          
          if (comp.id === actualActiveId) {
            activeComponentInitialX = compX;
            activeComponentInitialY = compY;
          }
        }

        multiDragStateRef.current = {
          activeComponentId: actualActiveId,
          selectedComponentIds: currentSelectedComponents.map(c => c.id),
          initialPositions,
          activeComponentInitialX,
          activeComponentInitialY,
        };

        logger.log('多选拖拽初始化:', {
          activeComponentId: actualActiveId,
          selectedComponentIds: currentSelectedComponents.map(c => c.id),
          initialPositions: Object.fromEntries(initialPositions),
          activeComponentInitialX,
          activeComponentInitialY,
        });
      }
    }

    if (isPanelItem(activeIdStr)) {
      const type = getPanelItemType(activeIdStr);
      const config = DEFAULT_COMPONENT_CONFIGS[type as ComponentType];
      setActiveDragItem({
        id: activeIdStr,
        type,
        label: config?.label || type,
        isFromPanel: true,
      });
    } else if (isCanvasItem(activeIdStr)) {
      setActiveDragItem({
        id: activeIdStr,
        isFromPanel: false,
      });
    } else if (isSortableItem(activeIdStr)) {
      setActiveDragItem({
        id: activeIdStr,
        isFromPanel: false,
      });
    }
  }, [handleGlobalPointerMove, isComponentSelected, getSelectedComponents, selectedComponentIds, selectedComponentId]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over, point } = event;

    logger.log('=== handleDragOver ===');
    logger.log('over:', over ? String(over.id) : 'null');
    logger.log('point:', point);

    if (!over) {
      isOverDropZoneRef.current = false;
      return;
    }

    const overIdStr = String(over.id);
    const isOverCanvasArea = isOverCanvas(overIdStr);
    logger.log('isOverCanvas:', isOverCanvasArea);

    isOverDropZoneRef.current = isOverCanvasArea;

    if (point) {
      lastMousePositionRef.current = {
        x: point.x,
        y: point.y,
      };
      logger.log('handleDragOver 已更新 lastMousePositionRef:', lastMousePositionRef.current);
    }
  }, []);

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    const { over, point } = event;

    logger.log('=== handleDragMove ===');
    logger.log('over:', over ? String(over.id) : 'null');
    logger.log('point:', point);

    if (over) {
      const overIdStr = String(over.id);
      const isOverCanvasArea = isOverCanvas(overIdStr);
      isOverDropZoneRef.current = isOverCanvasArea;
    }

    if (point) {
      lastMousePositionRef.current = {
        x: point.x,
        y: point.y,
      };
      logger.log('handleDragMove 已更新 lastMousePositionRef:', lastMousePositionRef.current);
    } else {
      logger.warn('handleDragMove 中 point 是 undefined');
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over, point } = event;

      window.removeEventListener('pointermove', handleGlobalPointerMove);
      logger.log('已移除全局 pointermove 监听');

      logger.log('=== 【诊断 1】handleDragEnd 详细诊断 ===');
      logger.log('event.point:', point);
      logger.log('point?.x:', point?.x);
      logger.log('point?.y:', point?.y);
      logger.log('lastMousePositionRef.current:', lastMousePositionRef.current);
      logger.log('globalMousePositionRef.current:', globalMousePositionRef.current);
      logger.log('active.id:', String(active.id));
      logger.log('over:', over ? String(over.id) : 'null');
      logger.log('isOverDropZoneRef.current:', isOverDropZoneRef.current);

      const mouseX = point?.x ?? lastMousePositionRef.current?.x ?? globalMousePositionRef.current.x;
      const mouseY = point?.y ?? lastMousePositionRef.current?.y ?? globalMousePositionRef.current.y;
      logger.log('坐标来源优先级:');
      logger.log('  - 来自 event.point:', point?.x ?? 'N/A', point?.y ?? 'N/A');
      logger.log('  - 来自 lastMousePositionRef:', lastMousePositionRef.current?.x ?? 'N/A', lastMousePositionRef.current?.y ?? 'N/A');
      logger.log('  - 来自 globalMousePositionRef:', globalMousePositionRef.current.x, globalMousePositionRef.current.y);
      logger.log('【诊断 1】最终使用的鼠标坐标 (mouseX, mouseY):', mouseX, mouseY);

      setActiveDragItem(null);
      isDraggingPanelItemRef.current = false;

      const activeIdStr = String(active.id);
      const effectiveOverId = over ? String(over.id) : null;
      const isOverCanvasArea = isOverCanvas(effectiveOverId);
      const isOverDropZone = isOverDropZoneRef.current;

      logger.log('检查放置位置:');
      logger.log('  - effectiveOverId:', effectiveOverId);
      logger.log('  - isOverCanvas:', isOverCanvasArea);
      logger.log('  - isOverDropZone:', isOverDropZone);

      if (!isOverCanvasArea && !isOverDropZone) {
        logger.log('❌ 不在画布上，不放置组件');
        isOverDropZoneRef.current = false;
        return;
      }

      logger.log('✅ 在画布上，准备放置组件');

      // 判断目标放置位置类型
      const isOverRootDropZone = effectiveOverId === DROP_ZONE_ID;
      const isOverContainerDropZone = effectiveOverId ? isContainerDropZone(effectiveOverId) : false;
      const isOverSortableItem = effectiveOverId ? isSortableItem(effectiveOverId) : false;
      
      // 获取目标 Container ID（如果拖到 Container 内部）
      let targetContainerId: string | null = null;
      if (isOverContainerDropZone && effectiveOverId) {
        targetContainerId = getContainerIdFromDropZone(effectiveOverId);
      }

      logger.log('放置位置类型:', {
        isOverRootDropZone,
        isOverContainerDropZone,
        isOverSortableItem,
        targetContainerId,
      });

      // 处理从组件库拖拽的新组件
      if (isPanelItem(activeIdStr)) {
        const type = getPanelItemType(activeIdStr);
        logger.log('  - 从组件库拖拽，类型:', type);

        const position = getCanvasRelativePosition(mouseX, mouseY);
        const newComponent = createComponentFromType(type, position.x, position.y);

        if (isOverContainerDropZone && targetContainerId) {
          // 拖到 Container 内部
          addComponentToParent(targetContainerId, newComponent);
          logger.log(
            '✅ 从组件库添加新组件到 Container:',
            newComponent.type,
            newComponent.id,
            '父容器:',
            targetContainerId
          );
        } else {
          // 拖到根级别画布
          addComponent(newComponent);
          logger.log(
            '✅ 从组件库添加新组件到根级别:',
            newComponent.type,
            newComponent.id,
            '位置:',
            `(${newComponent.x}, ${newComponent.y})`
          );
        }
        
        isOverDropZoneRef.current = false;
        return;
      }

      // 处理从画布拖拽的已有组件（根级别组件）
      if (isCanvasItem(activeIdStr)) {
        const actualActiveId = getCanvasItemId(activeIdStr);
        const position = getCanvasRelativePosition(mouseX, mouseY);

        // 防止将组件拖入自身（如果拖拽的是 Container）
        if (targetContainerId === actualActiveId) {
          logger.log('⚠️ 不能将组件拖入自身，取消操作');
          isOverDropZoneRef.current = false;
          multiDragStateRef.current = null;
          return;
        }

        // 检查是否是多选拖拽
        const multiDragState = multiDragStateRef.current;
        const isMultiDrag = multiDragState && multiDragState.selectedComponentIds.length > 0;

        if (isMultiDrag && multiDragState) {
          logger.log('=== 多选拖拽处理 ===');
          logger.log('activeComponentId:', multiDragState.activeComponentId);
          logger.log('selectedComponentIds:', multiDragState.selectedComponentIds);
          logger.log('activeComponentInitialX:', multiDragState.activeComponentInitialX);
          logger.log('activeComponentInitialY:', multiDragState.activeComponentInitialY);
          logger.log('newPosition:', position);

          // 计算拖拽的位移量
          const deltaX = position.x - multiDragState.activeComponentInitialX;
          const deltaY = position.y - multiDragState.activeComponentInitialY;

          logger.log('位移量 (deltaX, deltaY):', deltaX, deltaY);

          // 如果位移量为 0，说明没有移动，直接返回
          if (deltaX === 0 && deltaY === 0) {
            logger.log('没有位移，不更新位置');
            multiDragStateRef.current = null;
            isOverDropZoneRef.current = false;
            return;
          }

          // 对于多选拖拽，我们不处理父容器变化（保持原来的父容器）
          // 只更新所有选中组件的位置
          let componentsUpdated = false;
          
          for (const [compId, initialPos] of multiDragState.initialPositions) {
            const newX = snapToGrid(initialPos.x + deltaX);
            const newY = snapToGrid(initialPos.y + deltaY);

            logger.log(`更新组件 ${compId}:`, {
              initialX: initialPos.x,
              initialY: initialPos.y,
              newX,
              newY,
            });

            // 单独更新每个组件
            updateComponent(compId, {
              x: newX,
              y: newY,
            });
            componentsUpdated = true;
          }

          if (componentsUpdated) {
            logger.log('✅ 多选拖拽完成，已更新所有选中组件位置');
          }

          // 清除多选拖拽状态
          multiDragStateRef.current = null;
        } else {
          // 单选拖拽逻辑
          logger.log('单选拖拽处理:', actualActiveId);

          // 更新组件位置（无论拖到哪里，位置都需要更新）
          updateComponent(actualActiveId, {
            x: position.x,
            y: position.y,
          });

          // 处理父容器变化
          if (isOverContainerDropZone && targetContainerId) {
            // 拖到 Container 内部
            moveComponentToParent(actualActiveId, targetContainerId);
            logger.log(
              '✅ 移动组件到 Container:',
              actualActiveId,
              '父容器:',
              targetContainerId,
              '位置:',
              `(${position.x}, ${position.y})`
            );
          } else if (isOverRootDropZone) {
            // 拖到根级别画布
            moveComponentToParent(actualActiveId, null);
            logger.log(
              '✅ 移动组件到根级别:',
              actualActiveId,
              '位置:',
              `(${position.x}, ${position.y})`
            );
          } else if (isOverSortableItem && effectiveOverId) {
            // 拖到另一个 sortable item 上，需要找到它的父容器
            const overComponentId = getSortableItemId(effectiveOverId);
            // 这里需要更复杂的逻辑来确定目标位置
            // 暂时简化处理：移动到根级别
            moveComponentToParent(actualActiveId, null);
            logger.log(
              '移动组件到根级别（拖到 sortable item 上）:',
              actualActiveId
            );
          } else {
            // 拖到其他组件上（只更新位置）
            logger.log(
              '移动组件位置:',
              actualActiveId,
              '新位置:',
              `(${position.x}, ${position.y})`
            );
          }
        }
      }

      // 处理从容器内拖拽的 sortable item
      if (isSortableItem(activeIdStr)) {
        const actualActiveId = getSortableItemId(activeIdStr);
        logger.log('  - 从容器内拖拽 sortable item，ID:', actualActiveId);

        const position = getCanvasRelativePosition(mouseX, mouseY);

        // 防止将组件拖入自身（如果拖拽的是 Container）
        if (targetContainerId === actualActiveId) {
          logger.log('⚠️ 不能将组件拖入自身，取消操作');
          isOverDropZoneRef.current = false;
          return;
        }

        // 场景 1: 拖到根级别画布
        if (isOverRootDropZone) {
          // 更新位置并移动到根级别
          updateComponent(actualActiveId, {
            x: position.x,
            y: position.y,
          });
          moveComponentToParent(actualActiveId, null);
          logger.log(
            '✅ 从容器拖出到根级别:',
            actualActiveId,
            '位置:',
            `(${position.x}, ${position.y})`
          );
        }
        // 场景 2: 拖到另一个 Container 的 drop zone
        else if (isOverContainerDropZone && targetContainerId) {
          // 更新位置并移动到目标容器
          updateComponent(actualActiveId, {
            x: position.x,
            y: position.y,
          });
          moveComponentToParent(actualActiveId, targetContainerId);
          logger.log(
            '✅ 移动组件到另一个 Container:',
            actualActiveId,
            '目标容器:',
            targetContainerId
          );
        }
        // 场景 3: 拖到另一个 sortable item 上（可能是同一容器内排序或跨容器）
        else if (isOverSortableItem && effectiveOverId) {
          const overComponentId = getSortableItemId(effectiveOverId);
          logger.log('拖到另一个 sortable item 上:', overComponentId);

          // 这里需要判断：是同一容器内排序，还是跨容器？
          // 对于 sortable item，over 的 item 也是 sortable item
          // 我们需要确定目标位置

          // 更新位置
          updateComponent(actualActiveId, {
            x: position.x,
            y: position.y,
          });

          // 由于 sortable 的复杂性，这里简化处理：
          // 如果是同一容器，sortable 会自动处理顺序
          // 如果是不同容器，需要移动到目标容器
          
          // 注意：这里的逻辑需要更复杂的处理来确定目标索引
          // 暂时使用 moveComponentToParent 来处理，将组件移动到目标容器的末尾
          // 后续可以优化为在指定位置插入
          
          logger.log('处理 sortable item 拖拽完成:', actualActiveId);
        }
        // 场景 4: 其他情况（拖到其他组件上等）
        else {
          // 更新位置
          updateComponent(actualActiveId, {
            x: position.x,
            y: position.y,
          });
          logger.log(
            '更新 sortable item 位置:',
            actualActiveId,
            '新位置:',
            `(${position.x}, ${position.y})`
          );
        }
      }

      isOverDropZoneRef.current = false;
    },
    [
      addComponent, 
      updateComponent, 
      addComponentToParent, 
      moveComponentToParent,
      handleGlobalPointerMove
    ]
  );

  const contextValue: CanvasContextValue = useMemo(
    () => ({
      canvasRef,
      isOverDropZoneRef,
    }),
    [canvasRef, isOverDropZoneRef]
  );

  return (
    <CanvasContext.Provider value={contextValue}>
      <DndKitContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      >
        {children}
        <DragOverlay>
          {activeDragItem ? <DragPreview item={activeDragItem} /> : null}
        </DragOverlay>
      </DndKitContext>
    </CanvasContext.Provider>
  );
};

export default DndContextProvider;
