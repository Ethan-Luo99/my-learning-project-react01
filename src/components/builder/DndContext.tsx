import React, { useCallback } from 'react';
import {
  DndContext as DndKitContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { ComponentType, type ComponentSchema, type ContainerComponentSchema } from '@/types/component';
import { useBuilderStore } from '../../store/useBuilderStore';

const isContainerComponent = (
  component: ComponentSchema
): component is ContainerComponentSchema => {
  return component.type === ComponentType.Container;
};

interface DndContextProviderProps {
  children: React.ReactNode;
}

export const DndContextProvider: React.FC<DndContextProviderProps> = ({ children }) => {
  const { components, setComponents } = useBuilderStore();

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

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    console.log('Drag started:', active.id);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      console.log('Drag over:', active.id, '->', over.id);
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) {
        return;
      }

      console.log('Drag ended:', active.id, '->', over.id);

      const activeId = String(active.id);
      const overId = String(over.id);

      const findComponentIndex = (
        items: ComponentSchema[],
        id: string
      ): { index: number; parentId: string | null; items: ComponentSchema[] } | null => {
        const index = items.findIndex((item) => item.id === id);
        if (index !== -1) {
          return { index, parentId: null, items };
        }

        for (const item of items) {
          if (isContainerComponent(item) && item.children && item.children.length > 0) {
            const result = findComponentIndex(item.children, id);
            if (result) {
              return { ...result, parentId: item.id };
            }
          }
        }

        return null;
      };

      const activeResult = findComponentIndex(components, activeId);
      const overResult = findComponentIndex(components, overId);

      if (!activeResult || !overResult) {
        return;
      }

      const updateComponentsInTree = (
        items: ComponentSchema[],
        targetItems: ComponentSchema[],
        fromIndex: number,
        toIndex: number,
        targetParentId: string | null
      ): ComponentSchema[] => {
        if (targetParentId === null) {
          const newItems = arrayMove(targetItems, fromIndex, toIndex);
          return newItems;
        }

        return items.map((item) => {
          if (item.id === targetParentId && isContainerComponent(item)) {
            return {
              ...item,
              children: arrayMove(item.children || [], fromIndex, toIndex),
            };
          }
          if (isContainerComponent(item) && item.children && item.children.length > 0) {
            return {
              ...item,
              children: updateComponentsInTree(
                item.children,
                targetItems,
                fromIndex,
                toIndex,
                targetParentId
              ),
            };
          }
          return item;
        });
      };

      if (activeResult.parentId === overResult.parentId) {
        const newComponents = updateComponentsInTree(
          components,
          activeResult.items,
          activeResult.index,
          overResult.index,
          activeResult.parentId
        );
        setComponents(newComponents);
      }
    },
    [components, setComponents]
  );

  return (
    <DndKitContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {children}
      <DragOverlay>
        {null}
      </DragOverlay>
    </DndKitContext>
  );
};

export default DndContextProvider;
