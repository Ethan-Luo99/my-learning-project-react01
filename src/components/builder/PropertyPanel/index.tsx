import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Text, Container, Button } from '@/components/ui';
import { cn } from '@/utils/classname';
import { generateId } from '@/utils/id';
import { useBuilderStore } from '@/store/useBuilderStore';
import { 
  ComponentType, 
  type ComponentSchema, 
  type ClickEventConfig, 
  ClickEventType 
} from '@/types/component';
import { getComponentPropertyConfig, type PropertyConfig, SPACING_PROPERTY_KEYS } from '@/constants/propertyConfig';

interface PropertyPanelProps {
  className?: string;
}

interface PropertyEditorProps {
  config: PropertyConfig;
  value: any;
  onChange: (value: any) => void;
}

const HEX_COLOR_PATTERN = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

const isValidHexColor = (color: string): boolean => {
  return HEX_COLOR_PATTERN.test(color);
};

const normalizeHexColor = (color: string): string | null => {
  const match = color.trim().match(HEX_COLOR_PATTERN);
  if (!match) return null;

  let hex = match[1];
  if (hex.length === 3) {
    hex = hex.split('').map((c) => c + c).join('');
  }

  return `#${hex.toLowerCase()}`;
};

const DEBOUNCE_DELAY = 300;

const isContainerComponent = (
  component: ComponentSchema
): component is ComponentSchema & { children?: ComponentSchema[] } => {
  return component.type === ComponentType.Container;
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

const PropertyEditor: React.FC<PropertyEditorProps> = ({ config, value, onChange }) => {
  const { type, placeholder, options } = config;
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const debouncedChange = (newValue: any) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      onChange(newValue);
    }, DEBOUNCE_DELAY);
  };

  const immediateChange = (newValue: any) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    onChange(newValue);
  };

  const renderEditor = () => {
    switch (type) {
      case 'text':
        return (
          <input
            type="text"
            value={value ?? ''}
            onChange={(e) => {
              const textValue = e.target.value;
              debouncedChange(textValue === '' ? undefined : textValue);
            }}
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
              immediateChange(numValue);
            }}
            placeholder={placeholder}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value ?? ''}
            onChange={(e) => {
              const textValue = e.target.value;
              debouncedChange(textValue === '' ? undefined : textValue);
            }}
            placeholder={placeholder}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white resize-none"
          />
        );

      case 'select':
        return (
          <select
            value={value ?? ''}
            onChange={(e) => {
              const selectValue = e.target.value;
              immediateChange(selectValue === '' ? undefined : selectValue);
            }}
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

      case 'color': {
        const normalizedValue = value ? normalizeHexColor(value) : null;
        const displayColor = normalizedValue || '#ffffff';

        const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const textValue = e.target.value;

          if (textValue === '') {
            debouncedChange(undefined);
            return;
          }

          const normalized = normalizeHexColor(textValue);
          if (normalized) {
            debouncedChange(normalized);
          }
        };

        const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          immediateChange(e.target.value);
        };

        return (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={displayColor}
              onChange={handleColorPickerChange}
              className="w-10 h-10 rounded border border-gray-300 cursor-pointer p-0"
            />
            <input
              type="text"
              value={value ?? ''}
              onChange={handleTextInputChange}
              placeholder={placeholder ?? '#ffffff'}
              className={cn(
                'flex-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white',
                value && !isValidHexColor(value) ? 'border-red-500' : 'border-gray-300'
              )}
            />
          </div>
        );
      }

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

interface EventConfigEditorProps {
  eventConfig: ClickEventConfig | undefined;
  onChange: (config: ClickEventConfig | undefined) => void;
}

const EventConfigEditor: React.FC<EventConfigEditorProps> = ({ eventConfig, onChange }) => {
  const [localConfig, setLocalConfig] = useState<ClickEventConfig>({
    type: eventConfig?.type || ClickEventType.None,
    alertMessage: eventConfig?.alertMessage,
    targetUrl: eventConfig?.targetUrl,
    customCode: eventConfig?.customCode,
  });

  useEffect(() => {
    setLocalConfig({
      type: eventConfig?.type || ClickEventType.None,
      alertMessage: eventConfig?.alertMessage,
      targetUrl: eventConfig?.targetUrl,
      customCode: eventConfig?.customCode,
    });
  }, [eventConfig]);

  const handleEventTypeChange = (type: ClickEventType) => {
    const newConfig: ClickEventConfig = {
      ...localConfig,
      type,
    };
    setLocalConfig(newConfig);
    
    if (type === ClickEventType.None) {
      onChange(undefined);
    } else {
      onChange(newConfig);
    }
  };

  const handleAlertMessageChange = (message: string) => {
    const newConfig: ClickEventConfig = {
      ...localConfig,
      alertMessage: message,
    };
    setLocalConfig(newConfig);
    onChange(newConfig);
  };

  const handleTargetUrlChange = (url: string) => {
    const newConfig: ClickEventConfig = {
      ...localConfig,
      targetUrl: url,
    };
    setLocalConfig(newConfig);
    onChange(newConfig);
  };

  const handleCustomCodeChange = (code: string) => {
    const newConfig: ClickEventConfig = {
      ...localConfig,
      customCode: code,
    };
    setLocalConfig(newConfig);
    onChange(newConfig);
  };

  const renderParameterInputs = () => {
    switch (localConfig.type) {
      case ClickEventType.Alert:
        return (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              提示内容
            </label>
            <textarea
              value={localConfig.alertMessage ?? ''}
              onChange={(e) => handleAlertMessageChange(e.target.value)}
              placeholder="请输入提示内容..."
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white resize-none"
            />
          </div>
        );

      case ClickEventType.NavigateUrl:
        return (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              目标 URL
            </label>
            <input
              type="text"
              value={localConfig.targetUrl ?? ''}
              onChange={(e) => handleTargetUrlChange(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
            />
            <p className="mt-1 text-xs text-gray-500">
              点击按钮将在新窗口打开此 URL
            </p>
          </div>
        );

      case ClickEventType.CustomCode:
        return (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              自定义 JavaScript 代码
            </label>
            <textarea
              value={localConfig.customCode ?? ''}
              onChange={(e) => handleCustomCodeChange(e.target.value)}
              placeholder="console.log('按钮被点击了');"
              rows={4}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white resize-none font-mono"
            />
            <div className="mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-xs text-yellow-700">
                ⚠️ 安全警告：自定义代码将使用 eval 执行。仅在预览模式下执行，不会影响真实部署。
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          点击事件类型
        </label>
        <select
          value={localConfig.type}
          onChange={(e) => handleEventTypeChange(e.target.value as ClickEventType)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white appearance-none cursor-pointer"
        >
          <option value={ClickEventType.None}>无（禁用点击）</option>
          <option value={ClickEventType.Alert}>弹窗提示</option>
          <option value={ClickEventType.NavigateUrl}>跳转到 URL</option>
          <option value={ClickEventType.CustomCode}>执行自定义代码</option>
        </select>
      </div>
      {renderParameterInputs()}
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

interface EmptyStateProps {
  components: ComponentSchema[];
  onSelectComponent: (id: string) => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ components, onSelectComponent }) => {
  const hasComponents = components.length > 0;

  const getFirstComponentId = (): string | null => {
    if (components.length === 0) return null;

    const firstComponent = components[0];
    if (isContainerComponent(firstComponent) && firstComponent.children && firstComponent.children.length > 0) {
      return firstComponent.children[0].id;
    }
    return firstComponent.id;
  };

  const handleSelectFirstComponent = () => {
    const firstId = getFirstComponentId();
    if (firstId) {
      onSelectComponent(firstId);
    }
  };

  const getAllComponentIds = (comps: ComponentSchema[]): { id: string; type: ComponentType; label: string }[] => {
    const result: { id: string; type: ComponentType; label: string }[] = [];

    const addComponents = (list: ComponentSchema[]) => {
      for (const comp of list) {
        result.push({
          id: comp.id,
          type: comp.type,
          label: getComponentLabel(comp.type),
        });
        if (isContainerComponent(comp) && comp.children && comp.children.length > 0) {
          addComponents(comp.children);
        }
      }
    };

    addComponents(components);
    return result;
  };

  const allComponents = hasComponents ? getAllComponentIds(components) : [];

  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="text-5xl mb-4 opacity-50">🖱️</div>
      <Text variant="h4" weight="medium" className="mb-2 text-gray-600">
        未选中组件
      </Text>
      <Text variant="body" color="muted" className="max-w-[240px] mb-6">
        请点击画布上的任意组件来查看和编辑其属性
      </Text>

      {hasComponents && (
        <div className="w-full max-w-[280px] space-y-4">
          <Button
            variant="primary"
            size="sm"
            onClick={handleSelectFirstComponent}
            className="w-full"
          >
            选择第一个组件
          </Button>

          {allComponents.length > 1 && (
            <div className="pt-4 border-t border-gray-200">
              <Text variant="caption" color="muted" className="mb-3 block">
                所有组件列表：
              </Text>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {allComponents.map((comp) => (
                  <button
                    key={comp.id}
                    type="button"
                    onClick={() => onSelectComponent(comp.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-base">{getComponentIcon(comp.type)}</span>
                    <span className="text-gray-700">{comp.label}</span>
                    <span className="ml-auto text-xs text-gray-400 truncate max-w-[100px]">
                      {comp.id}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!hasComponents && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <Text variant="caption" color="muted">
            💡 提示：从左侧组件库拖拽组件到画布
          </Text>
        </div>
      )}
    </div>
  );
};

const regenerateComponentIds = (component: ComponentSchema): ComponentSchema => {
  if (component.type === ComponentType.Container && component.children && component.children.length > 0) {
    return {
      ...component,
      id: generateId(component.type.toLowerCase()),
      children: component.children.map(regenerateComponentIds),
    };
  }

  return {
    ...component,
    id: generateId(component.type.toLowerCase()),
  };
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
          ...selectedComponent.props,
          [config.key]: value,
        },
      });
    } else if (config.category === 'styles') {
      updateComponent(selectedComponentId, {
        styles: {
          ...selectedComponent.styles,
          [config.key]: value,
        },
      });
    } else if (config.category === 'basic') {
      updateComponent(selectedComponentId, {
        [config.key]: value,
      } as Partial<ComponentSchema>);
    }
  };

  const handleEventChange = useCallback((eventConfig: ClickEventConfig | undefined) => {
    if (!selectedComponentId || !selectedComponent) return;

    updateComponent(selectedComponentId, {
      events: eventConfig
        ? {
            onClick: eventConfig,
          }
        : undefined,
    });
  }, [selectedComponentId, selectedComponent, updateComponent]);

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
        if (SPACING_PROPERTY_KEYS.includes(prop.key as typeof SPACING_PROPERTY_KEYS[number])) {
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
      value = selectedComponent.props?.[config.key];
    } else if (config.category === 'styles') {
      value = selectedComponent.styles?.[config.key];
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
        <EmptyState
          components={components}
          onSelectComponent={setSelectedComponentId}
        />
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

      {selectedComponent.type === ComponentType.Button && (
        <PropertySection title="事件配置" isEmpty={false}>
          <EventConfigEditor
            eventConfig={selectedComponent.events?.onClick}
            onChange={handleEventChange}
          />
        </PropertySection>
      )}
    </div>
  );
};

export { PropertyPanel };
export type { PropertyPanelProps };
