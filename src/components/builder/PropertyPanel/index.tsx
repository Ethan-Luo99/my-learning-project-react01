import { useMemo } from 'react';
import { Text, Container, Button } from '@/components/ui';
import { cn } from '@/utils/classname';
import { useBuilderStore } from '@/store/useBuilderStore';
import { ComponentType, type ComponentSchema } from '@/types/component';
import { getComponentPropertyConfig, type PropertyConfig } from '@/constants/propertyConfig';

interface PropertyPanelProps {
  className?: string;
}

interface PropertyEditorProps {
  config: PropertyConfig;
  value: any;
  onChange: (value: any) => void;
}

const PropertyEditor: React.FC<PropertyEditorProps> = ({ config, value, onChange }) => {
  const { key, type, placeholder, options } = config;

  const handleChange = (newValue: any) => {
    onChange(newValue);
  };

  const renderEditor = () => {
    switch (type) {
      case 'text':
        return (
          <input
            type="text"
            value={value ?? ''}
            onChange={(e) => handleChange(e.target.value || undefined)}
            placeholder={placeholder}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value ?? ''}
            onChange={(e) => {
              const numValue = e.target.value === '' ? undefined : Number(e.target.value);
              handleChange(numValue);
            }}
            placeholder={placeholder}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value ?? ''}
            onChange={(e) => handleChange(e.target.value || undefined)}
            placeholder={placeholder}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white resize-none"
          />
        );

      case 'select':
        return (
          <select
            value={value ?? ''}
            onChange={(e) => handleChange(e.target.value || undefined)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white appearance-none cursor-pointer"
          >
            <option value="">请选择</option>
            {options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      default:
        return null;
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {config.label}
      </label>
      {renderEditor()}
    </div>
  );
};

interface PropertySectionProps {
  title: string;
  children: React.ReactNode;
  isEmpty?: boolean;
}

const PropertySection: React.FC<PropertySectionProps> = ({ title, children, isEmpty }) => {
  if (isEmpty) {
    return null;
  }

  return (
    <div className="mb-6">
      <Text variant="h4" weight="semibold" className="mb-3 pb-2 border-b border-gray-200">
        {title}
      </Text>
      <div>{children}</div>
    </div>
  );
};

const EmptyState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-5xl mb-4 opacity-50">🖱️</div>
      <Text variant="h4" weight="medium" className="mb-2 text-gray-600">
        未选中组件
      </Text>
      <Text variant="body" color="muted" className="max-w-[200px]">
        请点击画布上的任意组件来查看和编辑其属性
      </Text>
    </div>
  );
};

const getComponentLabel = (type: ComponentType): string => {
  const labels: Record<ComponentType, string> = {
    [ComponentType.Text]: '文本',
    [ComponentType.Button]: '按钮',
    [ComponentType.Image]: '图片',
    [ComponentType.Container]: '容器',
  };
  return labels[type] || '未知组件';
};

const getComponentIcon = (type: ComponentType): string => {
  const icons: Record<ComponentType, string> = {
    [ComponentType.Text]: 'T',
    [ComponentType.Button]: '⬛',
    [ComponentType.Image]: '🖼️',
    [ComponentType.Container]: '📦',
  };
  return icons[type] || '?';
};

const PropertyPanel: React.FC<PropertyPanelProps> = ({ className }) => {
  const { components, selectedComponentId, updateComponent } = useBuilderStore();

  const selectedComponent = useMemo(() => {
    if (!selectedComponentId) return null;

    const findComponent = (list: ComponentSchema[]): ComponentSchema | null => {
      for (const comp of list) {
        if (comp.id === selectedComponentId) {
          return comp;
        }
        if (comp.type === ComponentType.Container && comp.children) {
          const found = findComponent(comp.children);
          if (found) return found;
        }
      }
      return null;
    };

    return findComponent(components);
  }, [components, selectedComponentId]);

  const propertyConfig = useMemo(() => {
    if (!selectedComponent) return null;
    return getComponentPropertyConfig(selectedComponent.type);
  }, [selectedComponent]);

  const handlePropertyChange = (config: PropertyConfig, value: any) => {
    if (!selectedComponentId) return;

    if (config.category === 'props') {
      updateComponent(selectedComponentId, {
        props: {
          ...selectedComponent?.props,
          [config.key]: value,
        },
      });
    } else if (config.category === 'styles') {
      updateComponent(selectedComponentId, {
        styles: {
          ...selectedComponent?.styles,
          [config.key]: value,
        },
      });
    } else if (config.category === 'basic') {
      const updates: Partial<ComponentSchema> = {};
      if (config.key === 'x') updates.x = value;
      else if (config.key === 'y') updates.y = value;
      else if (config.key === 'width') updates.width = value;
      else if (config.key === 'height') updates.height = value;

      updateComponent(selectedComponentId, updates);
    }
  };

  const groupedProperties = useMemo(() => {
    if (!propertyConfig) return null;

    const groups: { basic: PropertyConfig[]; props: PropertyConfig[]; styles: PropertyConfig[] } = {
      basic: [],
      props: [],
      styles: [],
    };

    propertyConfig.properties.forEach((prop) => {
      groups[prop.category].push(prop);
    });

    return groups;
  }, [propertyConfig]);

  const getPropertyValue = (config: PropertyConfig): any => {
    if (!selectedComponent) return undefined;

    if (config.category === 'props') {
      return selectedComponent.props[config.key];
    } else if (config.category === 'styles') {
      return selectedComponent.styles[config.key];
    } else if (config.category === 'basic') {
      return (selectedComponent as any)[config.key];
    }

    return undefined;
  };

  if (!selectedComponent || !propertyConfig || !groupedProperties) {
    return (
      <div className={cn('p-4 h-full overflow-y-auto', className)}>
        <div className="mb-4 pb-3 border-b border-gray-200">
          <Text variant="h3" weight="semibold">
            属性配置
          </Text>
        </div>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className={cn('p-4 h-full overflow-y-auto', className)}>
      <div className="mb-4 pb-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <Text variant="h3" weight="semibold">
            属性配置
          </Text>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
          <span className="text-lg">{getComponentIcon(selectedComponent.type)}</span>
          <div className="flex-1 min-w-0">
            <Text variant="body" weight="medium" className="text-gray-900">
              {getComponentLabel(selectedComponent.type)}
            </Text>
            <Text variant="caption" color="muted" className="truncate block">
              ID: {selectedComponent.id}
            </Text>
          </div>
        </div>
      </div>

      <PropertySection
        title="基础属性"
        isEmpty={groupedProperties.basic.length === 0}
      >
        {groupedProperties.basic.map((config) => (
          <PropertyEditor
            key={config.key}
            config={config}
            value={getPropertyValue(config)}
            onChange={(value) => handlePropertyChange(config, value)}
          />
        ))}
      </PropertySection>

      <PropertySection
        title="组件属性"
        isEmpty={groupedProperties.props.length === 0}
      >
        {groupedProperties.props.map((config) => (
          <PropertyEditor
            key={config.key}
            config={config}
            value={getPropertyValue(config)}
            onChange={(value) => handlePropertyChange(config, value)}
          />
        ))}
      </PropertySection>

      <PropertySection
        title="样式属性"
        isEmpty={groupedProperties.styles.length === 0}
      >
        {groupedProperties.styles.map((config) => (
          <PropertyEditor
            key={config.key}
            config={config}
            value={getPropertyValue(config)}
            onChange={(value) => handlePropertyChange(config, value)}
          />
        ))}
      </PropertySection>
    </div>
  );
};

export { PropertyPanel };
export type { PropertyPanelProps };
