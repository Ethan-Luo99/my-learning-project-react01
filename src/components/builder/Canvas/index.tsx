import { Text } from '@/components/ui';
import { cn } from '@/utils/classname';
import { ComponentRenderer } from '@/components/builder/ComponentRenderer';
import { useBuilderStore } from '@/store/useBuilderStore';

interface CanvasProps {
  className?: string;
}

const Canvas: React.FC<CanvasProps> = ({ className }) => {
  const { components, selectedComponentId, setSelectedComponentId } = useBuilderStore();

  const handleComponentClick = (id: string) => {
    setSelectedComponentId(id);
    console.log('选择组件:', id);
  };

  const handleCanvasClick = () => {
    setSelectedComponentId(null);
    console.log('取消选择组件');
  };

  return (
    <div
      className={cn(
        'min-h-[600px] bg-white rounded-lg shadow-lg border border-gray-200 p-8',
        className
      )}
      onClick={handleCanvasClick}
    >
      {components.length === 0 ? (
        <div className="flex items-center justify-center h-full min-h-[500px]">
          <Text variant="h3" weight="semibold" color="muted">
            拖拽组件到这里开始搭建
          </Text>
        </div>
      ) : (
        <div className="space-y-4">
          {components.map((component) => (
            <ComponentRenderer
              key={component.id}
              component={component}
              isSelected={component.id === selectedComponentId}
              onClick={() => handleComponentClick(component.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export { Canvas };
export type { CanvasProps };
