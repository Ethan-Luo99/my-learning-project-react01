import { Text } from '@/components/ui';
import { cn } from '@/utils/classname';

interface PropertyPanelProps {
  className?: string;
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({ className }) => {
  return (
    <div className={cn('p-4', className)}>
      <Text variant="h3" weight="semibold" className="mb-4">
        属性配置
      </Text>
      <Text variant="body" color="muted">
        选中组件后显示属性
      </Text>
    </div>
  );
};

export { PropertyPanel };
export type { PropertyPanelProps };
