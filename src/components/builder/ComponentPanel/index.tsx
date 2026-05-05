import * as React from 'react';
import { Text, Button } from '@/components/ui';
import { cn } from '@/utils/classname';
import { generateId } from '@/utils/id';
import { ComponentType, type ComponentSchema, type ContainerComponentSchema } from '@/types/component';
import { DEFAULT_COMPONENT_CONFIGS, COMPONENT_PANEL_ITEMS } from '@/constants/mockData';
import { useBuilderStore } from '@/store/useBuilderStore';
import { useDraggable } from '@dnd-kit/core';
import { createPanelItemId, DEFAULT_POSITION, GRID_SIZE, snapToGrid } from '@/constants/dnd';
import { CSS } from '@dnd-kit/utilities';
import { logger } from '@/utils/logger';

interface ComponentPanelProps {
  className?: string;
}

const getComponentIcon = (type: ComponentType): string => {
  const icons: Record<ComponentType, string> = {
    [ComponentType.Text]: 'T',
    [ComponentType.Button]: '⬛',
    [ComponentType.Image]: '🖼️',
    [ComponentType.Container]: '📦',
    [ComponentType.Input]: '📝',
    [ComponentType.Textarea]: '📄',
    [ComponentType.Select]: '📋',
    [ComponentType.Checkbox]: '☑️',
    [ComponentType.CheckboxGroup]: '☑️',
    [ComponentType.Radio]: '🔘',
    [ComponentType.RadioGroup]: '🔘',
    [ComponentType.Switch]: '🔄',
    [ComponentType.Form]: '📋',
    [ComponentType.FormItem]: '📝',
  };
  return icons[type];
};

const getComponentWidth = (type: ComponentType): number => {
  const config = DEFAULT_COMPONENT_CONFIGS[type];
  const width = config.defaultWidth;
  if (typeof width === 'number') return width;
  return 100;
};

const getComponentHeight = (type: ComponentType): number => {
  const config = DEFAULT_COMPONENT_CONFIGS[type];
  const height = config.defaultHeight;
  if (typeof height === 'number') return height;
  return 50;
};

const getOccupiedCells = (
  existingComponents: ComponentSchema[],
  gridSize: number
): Set<string> => {
  const cells = new Set<string>();
  existingComponents.forEach((comp) => {
    const compX = comp.x ?? 0;
    const compY = comp.y ?? 0;
    const compWidth = typeof comp.width === 'number' ? comp.width : 100;
    const compHeight = typeof comp.height === 'number' ? comp.height : 50;

    const startGridX = Math.floor(compX / gridSize);
    const startGridY = Math.floor(compY / gridSize);
    const endGridX = Math.ceil((compX + compWidth) / gridSize);
    const endGridY = Math.ceil((compY + compHeight) / gridSize);

    for (let gx = startGridX; gx <= endGridX; gx++) {
      for (let gy = startGridY; gy <= endGridY; gy++) {
        cells.add(`${gx},${gy}`);
      }
    }
  });
  return cells;
};

const findNextAvailablePosition = (
  existingComponents: ComponentSchema[],
  componentType: ComponentType
): { x: number; y: number } => {
  const componentWidth = getComponentWidth(componentType);
  const componentHeight = getComponentHeight(componentType);

  const gridSize = GRID_SIZE;
  const startX = DEFAULT_POSITION.X;
  const startY = DEFAULT_POSITION.Y;

  if (existingComponents.length === 0) {
    return { x: startX, y: startY };
  }

  const occupiedCells = getOccupiedCells(existingComponents, gridSize);

  const componentGridWidth = Math.ceil(componentWidth / gridSize);
  const componentGridHeight = Math.ceil(componentHeight / gridSize);

  for (let gridY = 0; gridY < 100; gridY++) {
    for (let gridX = 0; gridX < 100; gridX++) {
      let isAvailable = true;
      for (let dx = 0; dx < componentGridWidth && isAvailable; dx++) {
        for (let dy = 0; dy < componentGridHeight && isAvailable; dy++) {
          if (occupiedCells.has(`${gridX + dx},${gridY + dy}`)) {
            isAvailable = false;
          }
        }
      }

      if (isAvailable) {
        return {
          x: snapToGrid(Math.max(startX, gridX * gridSize)),
          y: snapToGrid(Math.max(startY, gridY * gridSize)),
        };
      }
    }
  }

  const lastComponent = existingComponents[existingComponents.length - 1];
  const lastX = lastComponent.x ?? DEFAULT_POSITION.X;
  const lastY = lastComponent.y ?? DEFAULT_POSITION.Y;

  return {
    x: snapToGrid(lastX + componentWidth + gridSize * 2),
    y: snapToGrid(lastY),
  };
};

const createComponent = (type: ComponentType, x: number = DEFAULT_POSITION.X, y: number = DEFAULT_POSITION.Y): ComponentSchema => {
  const config = DEFAULT_COMPONENT_CONFIGS[type];
  const id = generateId(type.toLowerCase());

  const component: ComponentSchema = {
    id,
    type,
    props: { ...config.defaultProps },
    styles: { ...config.defaultStyles },
    x: snapToGrid(x),
    y: snapToGrid(y),
    width: config.defaultWidth,
    height: config.defaultHeight,
  };

  if (type === ComponentType.Container) {
    (component as ContainerComponentSchema).children = [];
  }

  return component;
};

interface DraggableComponentItemProps {
  type: ComponentType;
  label: string;
}

const DraggableComponentItem: React.FC<DraggableComponentItemProps> = ({ type, label }) => {
  const { addComponent, components } = useBuilderStore();
  const dndId = createPanelItemId(type);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: dndId,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto' as any,
  };

  const handleClick = () => {
    const position = findNextAvailablePosition(components, type);
    const component = createComponent(type, position.x, position.y);
    addComponent(component);
    logger.log('点击添加组件:', component.type, component.id, '位置:', position);
  };

  return (
    <Button
      ref={setNodeRef}
      variant="ghost"
      size="md"
      className={cn(
        'flex flex-col items-center justify-center gap-2 h-20 w-full',
        'border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50',
        'transition-all duration-200 cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-50 scale-95'
      )}
      style={style}
      {...listeners}
      {...attributes}
      onClick={handleClick}
    >
      <span className="text-2xl">{getComponentIcon(type)}</span>
      <Text variant="caption" weight="medium" className="text-gray-700">
        {label}
      </Text>
    </Button>
  );
};

const ComponentPanel: React.FC<ComponentPanelProps> = ({ className }) => {
  const categories = ['basic', 'layout', 'form'] as const;

  const categoryLabels: Record<string, string> = {
    basic: '基础组件',
    layout: '布局组件',
    form: '表单组件',
  };

  return (
    <div className={cn('p-4 overflow-y-auto h-full', className)}>
      <Text variant="h3" weight="semibold" className="mb-6">
        组件库
      </Text>

      {categories.map((category) => {
        const categoryItems = COMPONENT_PANEL_ITEMS.filter((item) => item.category === category);
        if (categoryItems.length === 0) return null;

        return (
          <div key={category} className="mb-6">
            <Text variant="caption" weight="semibold" color="muted" className="mb-3 block uppercase tracking-wider">
              {categoryLabels[category]}
            </Text>
            <div className="grid grid-cols-2 gap-3">
              {categoryItems.map((item) => (
                <DraggableComponentItem
                  key={item.type}
                  type={item.type}
                  label={item.label}
                />
              ))}
            </div>
          </div>
        );
      })}

      <Text variant="caption" color="muted" className="mt-4 block text-center">
        拖拽或点击组件添加到画布
      </Text>
    </div>
  );
};

export { ComponentPanel, createComponent, findNextAvailablePosition };
export type { ComponentPanelProps };
