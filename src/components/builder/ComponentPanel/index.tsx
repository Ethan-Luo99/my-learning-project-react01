import { Text, Button } from '@/components/ui';
import { cn } from '@/utils/classname';
import { generateId } from '@/utils/id';
import { ComponentType, type ComponentSchema } from '@/types/component';
import { DEFAULT_COMPONENT_CONFIGS, COMPONENT_PANEL_ITEMS } from '@/constants/mockData';
import { useBuilderStore } from '@/store/useBuilderStore';

interface ComponentPanelProps {
  className?: string;
}

const getComponentIcon = (type: ComponentType): string => {
  const icons: Record<ComponentType, string> = {
    [ComponentType.Text]: 'T',
    [ComponentType.Button]: '⬛',
    [ComponentType.Image]: '🖼️',
    [ComponentType.Container]: '📦',
  };
  return icons[type];
};

const createComponent = (type: ComponentType): ComponentSchema => {
  const config = DEFAULT_COMPONENT_CONFIGS[type];
  const id = generateId(type.toLowerCase());

  const component: ComponentSchema = {
    id,
    type,
    props: { ...config.defaultProps },
    styles: { ...config.defaultStyles },
  };

  if (type === ComponentType.Container) {
    (component as any).children = [];
  }

  return component;
};

const ComponentPanel: React.FC<ComponentPanelProps> = ({ className }) => {
  const { addComponent } = useBuilderStore();

  const handleComponentClick = (type: ComponentType) => {
    const component = createComponent(type);
    addComponent(component);
    console.log('添加组件:', component.type, component.id);
  };

  const categories = ['basic', 'layout'] as const;

  const categoryLabels: Record<string, string> = {
    basic: '基础组件',
    layout: '布局组件',
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
                <Button
                  key={item.type}
                  variant="ghost"
                  size="md"
                  className={cn(
                    'flex flex-col items-center justify-center gap-2 h-20 w-full',
                    'border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50',
                    'transition-all duration-200 cursor-pointer'
                  )}
                  onClick={() => handleComponentClick(item.type)}
                >
                  <span className="text-2xl">{getComponentIcon(item.type)}</span>
                  <Text variant="caption" weight="medium" className="text-gray-700">
                    {item.label}
                  </Text>
                </Button>
              ))}
            </div>
          </div>
        );
      })}

      <Text variant="caption" color="muted" className="mt-4 block text-center">
        点击组件添加到画布
      </Text>
    </div>
  );
};

export { ComponentPanel, createComponent };
export type { ComponentPanelProps };
