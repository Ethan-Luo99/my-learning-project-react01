import { useMemo, useState } from 'react';
import { Text, Container, Button } from '@/components/ui';
import { cn } from '@/utils/classname';
import { generateId } from '@/utils/id';
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
            onChange={(e) => handleChange(e.target.value)}
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
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white resize-none"
          />
        );

      case 'select':
        return (
          <select
            value={value ?? ''}
            onChange={(e) => handleChange(e.target.value)}
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

      case 'color':
        return (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={value || '#000000'}
              onChange={(e) => handleChange(e.target.value)}
              className="w-10 h-10 rounded border border-gray-300 cursor-pointer p-0"
            />
            <input
              type="text"
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={placeholder || '#000000'}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
            />
          </div>
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

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
      >
        <span>{title}</span>
        <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      {isOpen && (
        <div className="mt-2 pl-2 border-l-2 border-gray-200">
          {children}
        </div>
      )}
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

const regenerateComponentIds = (component: ComponentSchema): ComponentSchema => {
  const newComponent = { ...component };
  newComponent.id = generateId(newComponent.type.toLowerCase());

  if (newComponent.type === ComponentType.Container && newComponent.children && newComponent.children.length > 0) {
    newComponent.children = newComponent.children.map(regenerateComponentIds);
  }

  return newComponent;
};

const PropertyPanel: React.FC<PropertyPanelProps> = ({ className }) => {
  const { components, selectedComponentId, updateComponent, removeComponent, setSelectedComponentId, addComponent } = useBuilderStore();

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
    if (!selectedComponentId || !selectedComponent) return;

    if (config.category === 'props') {
      updateComponent(selectedComponentId, {
        props: {
          ...(selectedComponent.props || {}),
          [config.key]: value,
        },
      });
    } else if (config.category === 'styles') {
      updateComponent(selectedComponentId, {
        styles: {
          ...(selectedComponent.styles || {}),
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

  const handleDelete = () => {
    if (!selectedComponentId) return;

    const confirmed = window.confirm('确定要删除此组件吗？删除后可通过撤销恢复。');
    if (confirmed) {
      removeComponent(selectedComponentId);
      setSelectedComponentId(null);
    }
  };

  const handleDuplicate = () => {
    if (!selectedComponent) return;

    const clonedComponent = structuredClone(selectedComponent) as ComponentSchema;
    const regeneratedComponent = regenerateComponentIds(clonedComponent);

    if (regeneratedComponent.x !== undefined) {
      regeneratedComponent.x = regeneratedComponent.x + 10;
    }
    if (regeneratedComponent.y !== undefined) {
      regeneratedComponent.y = regeneratedComponent.y + 10;
    }

    addComponent(regeneratedComponent);
    setSelectedComponentId(regeneratedComponent.id);
  };

  const groupedProperties = useMemo(() => {
    if (!propertyConfig) return null;

    const spacingKeys = ['marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight'];

    const groups: { 
      basic: PropertyConfig[]; 
      props: PropertyConfig[]; 
      styles: { basic: PropertyConfig[]; spacing: PropertyConfig[] };
    } = {
      basic: [],
      props: [],
      styles: { basic: [], spacing: [] },
    };

    propertyConfig.properties.forEach((prop) => {
      if (prop.category === 'styles') {
        if (spacingKeys.includes(prop.key)) {
          groups.styles.spacing.push(prop);
        } else {
          groups.styles.basic.push(prop);
        }
      } else {
        groups[prop.category].push(prop);
      }
    });

    return groups;
  }, [propertyConfig]);

  const getPropertyValue = (config: PropertyConfig): any => {
    if (!selectedComponent) return config.defaultValue;

    let value: any;

    if (config.category === 'props') {
      value = selectedComponent.props[config.key];
    } else if (config.category === 'styles') {
      value = selectedComponent.styles[config.key];
    } else if (config.category === 'basic') {
      value = (selectedComponent as any)[config.key];
    }

    return value !== undefined ? value : config.defaultValue;
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

        <div className="mt-3 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDuplicate}
            className="flex-1"
          >
            复制组件
          </Button>
          <Button
            variant="outline"
            color="danger"
            size="sm"
            onClick={handleDelete}
            className="flex-1"
          >
            删除组件
          </Button>
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
        isEmpty={groupedProperties.styles.basic.length === 0 && groupedProperties.styles.spacing.length === 0}
      >
        {groupedProperties.styles.basic.map((config) => (
          <PropertyEditor
            key={config.key}
            config={config}
            value={getPropertyValue(config)}
            onChange={(value) => handlePropertyChange(config, value)}
          />
        ))}
        
        {groupedProperties.styles.spacing.length > 0 && (
          <CollapsibleSection title="间距设置">
            {groupedProperties.styles.spacing.map((config) => (
              <PropertyEditor
                key={config.key}
                config={config}
                value={getPropertyValue(config)}
                onChange={(value) => handlePropertyChange(config, value)}
              />
            ))}
          </CollapsibleSection>
        )}
      </PropertySection>
    </div>
  );
};

export { PropertyPanel };
export type { PropertyPanelProps };
