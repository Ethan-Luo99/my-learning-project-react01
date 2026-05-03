/**
 * 属性面板
 * 详细文档请参考：docs/architecture/form-system.md
 * 
 * 功能：
 * - 组件属性编辑（基础属性、组件属性、样式属性）
 * - 验证规则配置 UI
 * - 数据绑定规则配置 UI
 * - 事件配置 UI
 */

import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Text, Container, Button } from '@/components/ui';
import { cn } from '@/utils/classname';
import { generateId } from '@/utils/id';
import { useBuilderStore } from '@/store/useBuilderStore';
import { 
  ComponentType, 
  type ComponentSchema, 
  type ClickEventConfig, 
  ClickEventType,
  type DataBindingRule,
  BindingTrigger,
  BindingPath,
  ActionType,
  EventType,
  NavigateTarget,
  type EventConfig,
  type ActionConfig,
} from '@/types/component';
import { 
  getComponentPropertyConfig, 
  type PropertyConfig, 
  SPACING_PROPERTY_KEYS,
  VALIDATION_RULE_TYPES 
} from '@/constants/propertyConfig';
import type { ValidationRule, ValidationRuleType } from '@/utils/formValidation';

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

      case 'options': {
        return (
          <div>
            <textarea
              value={value ?? ''}
              onChange={(e) => {
                const textValue = e.target.value;
                debouncedChange(textValue === '' ? undefined : textValue);
              }}
              placeholder={placeholder ?? '每行一个选项，格式：value:label\n例如：\noption1:选项一\noption2:选项二'}
              rows={5}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white resize-none font-mono text-xs leading-relaxed"
            />
            <p className="mt-1 text-xs text-gray-500">
              格式说明：每行一个选项，使用 <code className="bg-gray-100 px-1 rounded">value:label</code> 格式
            </p>
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
    formId: eventConfig?.formId,
  });

  useEffect(() => {
    setLocalConfig({
      type: eventConfig?.type || ClickEventType.None,
      alertMessage: eventConfig?.alertMessage,
      targetUrl: eventConfig?.targetUrl,
      customCode: eventConfig?.customCode,
      formId: eventConfig?.formId,
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

  const handleFormIdChange = (formId: string) => {
    const newConfig: ClickEventConfig = {
      ...localConfig,
      formId: formId || undefined,
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

      case ClickEventType.FormSubmit:
      case ClickEventType.FormReset:
        return (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              表单 ID
            </label>
            <input
              type="text"
              value={localConfig.formId ?? ''}
              onChange={(e) => handleFormIdChange(e.target.value)}
              placeholder="例如：loginForm"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
            />
            <p className="mt-1 text-xs text-gray-500">
              输入要操作的表单 ID。需要与 Form 组件的 ID 属性一致。
            </p>
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
          <option value={ClickEventType.FormSubmit}>表单提交</option>
          <option value={ClickEventType.FormReset}>表单重置</option>
        </select>
      </div>
      {renderParameterInputs()}
    </div>
  );
};

interface ActionEditorProps {
  action: ActionConfig;
  onUpdate: (id: string, updates: Partial<ActionConfig>) => void;
  onRemove: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  isFirst: boolean;
  isLast: boolean;
}

const ActionEditor: React.FC<ActionEditorProps> = ({
  action,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}) => {
  const pages = useBuilderStore((state) => state.pages);
  const currentPageId = useBuilderStore((state) => state.currentPageId);

  const actionTypeOptions = [
    { value: ActionType.ShowAlert, label: '弹窗提示 (SHOW_ALERT)' },
    { value: ActionType.NavigateUrl, label: '跳转链接 (NAVIGATE_URL)' },
    { value: ActionType.NavigatePage, label: '页面跳转 (NAVIGATE_PAGE)' },
    { value: ActionType.ConsoleLog, label: '控制台输出 (CONSOLE_LOG)' },
    { value: ActionType.CustomScript, label: '自定义脚本 (CUSTOM_SCRIPT)' },
    { value: ActionType.FormSubmit, label: '表单提交 (FORM_SUBMIT)' },
    { value: ActionType.FormReset, label: '表单重置 (FORM_RESET)' },
  ];

  const availablePages = pages.filter((page) => page.id !== currentPageId);

  const handleActionTypeChange = (type: ActionType) => {
    onUpdate(action.id, { type });
  };

  const handleParamChange = (key: string, value: string) => {
    onUpdate(action.id, {
      params: {
        ...action.params,
        [key]: value,
      },
    });
  };

  const handleEnabledChange = (enabled: boolean) => {
    onUpdate(action.id, { enabled });
  };

  const renderParamInputs = () => {
    switch (action.type) {
      case ActionType.ShowAlert:
        return (
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              提示内容
            </label>
            <textarea
              value={action.params.alertMessage ?? ''}
              onChange={(e) => handleParamChange('alertMessage', e.target.value)}
              placeholder="请输入提示内容..."
              rows={2}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white resize-none"
            />
          </div>
        );

      case ActionType.NavigateUrl:
        return (
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              目标 URL
            </label>
            <input
              type="text"
              value={action.params.targetUrl ?? ''}
              onChange={(e) => handleParamChange('targetUrl', e.target.value)}
              placeholder="https://example.com"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white mb-2"
            />
            <label className="block text-xs font-medium text-gray-600 mb-1">
              打开方式
            </label>
            <select
              value={action.params.navigateTarget ?? NavigateTarget.NewWindow}
              onChange={(e) => handleParamChange('navigateTarget', e.target.value as NavigateTarget)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white"
            >
              <option value={NavigateTarget.NewWindow}>新窗口打开</option>
              <option value={NavigateTarget.CurrentWindow}>当前窗口跳转</option>
            </select>
          </div>
        );

      case ActionType.NavigatePage:
        return (
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              目标页面
            </label>
            {availablePages.length > 0 ? (
              <select
                value={action.params.pageId ?? ''}
                onChange={(e) => handleParamChange('pageId', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white"
              >
                <option value="">请选择目标页面</option>
                {availablePages.map((page) => (
                  <option key={page.id} value={page.id}>
                    {page.name} ({page.id})
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-2 py-1.5 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded">
                当前项目只有一个页面，无法跳转。请先添加更多页面。
              </div>
            )}
            <p className="mt-1 text-xs text-gray-500">
              选择要跳转到的目标页面
            </p>
          </div>
        );

      case ActionType.ConsoleLog:
        return (
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              日志内容
            </label>
            <input
              type="text"
              value={action.params.logMessage ?? ''}
              onChange={(e) => handleParamChange('logMessage', e.target.value)}
              placeholder="例如：按钮被点击了"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white"
            />
          </div>
        );

      case ActionType.CustomScript:
        return (
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              自定义 JavaScript 代码
            </label>
            <textarea
              value={action.params.customScript ?? ''}
              onChange={(e) => handleParamChange('customScript', e.target.value)}
              placeholder="console.log('自定义脚本执行');"
              rows={3}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white resize-none font-mono"
            />
            <div className="mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-xs text-yellow-700">
                ⚠️ 安全警告：自定义代码将使用 eval 执行。仅在预览模式下执行。
              </p>
            </div>
          </div>
        );

      case ActionType.FormSubmit:
      case ActionType.FormReset:
        return (
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              表单 ID
            </label>
            <input
              type="text"
              value={action.params.formId ?? ''}
              onChange={(e) => handleParamChange('formId', e.target.value)}
              placeholder="例如：loginForm"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white"
            />
            <p className="mt-1 text-xs text-gray-500">
              需要与 Form 组件的 ID 属性一致
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-3 mb-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={action.enabled}
            onChange={(e) => handleEnabledChange(e.target.checked)}
            className="w-4 h-4 text-primary-600 rounded"
          />
          <select
            value={action.type}
            onChange={(e) => handleActionTypeChange(e.target.value as ActionType)}
            className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white"
          >
            {actionTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMoveUp(action.id)}
            disabled={isFirst}
            className={cn(
              'p-1 rounded transition-colors',
              isFirst
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-500 hover:bg-gray-200'
            )}
            title="上移"
          >
            ▲
          </button>
          <button
            type="button"
            onClick={() => onMoveDown(action.id)}
            disabled={isLast}
            className={cn(
              'p-1 rounded transition-colors',
              isLast
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-500 hover:bg-gray-200'
            )}
            title="下移"
          >
            ▼
          </button>
          <button
            type="button"
            onClick={() => onRemove(action.id)}
            className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
            title="删除"
          >
            ✕
          </button>
        </div>
      </div>
      {renderParamInputs()}
    </div>
  );
};

interface AdvancedEventConfigEditorProps {
  componentType: ComponentType;
  events: {
    onClickActions?: EventConfig;
    onChangeActions?: EventConfig;
    onSubmitActions?: EventConfig;
    onFocusActions?: EventConfig;
    onBlurActions?: EventConfig;
  };
  onEventChange: (eventType: EventType, config: EventConfig | undefined) => void;
}

const AdvancedEventConfigEditor: React.FC<AdvancedEventConfigEditorProps> = ({
  componentType,
  events,
  onEventChange,
}) => {
  const supportedEvents = getSupportedEventTypes(componentType);
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(
    supportedEvents.length > 0 ? supportedEvents[0] : null
  );

  const getEventLabel = (eventType: EventType): string => {
    const labels: Record<EventType, string> = {
      [EventType.Click]: '点击事件 (onClick)',
      [EventType.Change]: '变更事件 (onChange)',
      [EventType.Submit]: '提交事件 (onSubmit)',
      [EventType.Focus]: '聚焦事件 (onFocus)',
      [EventType.Blur]: '失焦事件 (onBlur)',
    };
    return labels[eventType] || eventType;
  };

  const getEventConfig = (eventType: EventType): EventConfig | undefined => {
    switch (eventType) {
      case EventType.Click:
        return events.onClickActions;
      case EventType.Change:
        return events.onChangeActions;
      case EventType.Submit:
        return events.onSubmitActions;
      case EventType.Focus:
        return events.onFocusActions;
      case EventType.Blur:
        return events.onBlurActions;
    }
  };

  const handleAddAction = () => {
    if (!selectedEventType) return;

    const currentConfig = getEventConfig(selectedEventType);
    const newAction: ActionConfig = {
      id: generateId('action'),
      type: ActionType.ShowAlert,
      params: {},
      enabled: true,
    };

    const newConfig: EventConfig = {
      type: selectedEventType,
      actions: currentConfig ? [...currentConfig.actions, newAction] : [newAction],
      enabled: currentConfig?.enabled ?? true,
    };

    onEventChange(selectedEventType, newConfig);
  };

  const handleUpdateAction = (eventType: EventType, actionId: string, updates: Partial<ActionConfig>) => {
    const currentConfig = getEventConfig(eventType);
    if (!currentConfig) return;

    const updatedActions = currentConfig.actions.map((action) =>
      action.id === actionId ? { ...action, ...updates } : action
    );

    onEventChange(eventType, {
      ...currentConfig,
      actions: updatedActions,
    });
  };

  const handleRemoveAction = (eventType: EventType, actionId: string) => {
    const currentConfig = getEventConfig(eventType);
    if (!currentConfig) return;

    const updatedActions = currentConfig.actions.filter((action) => action.id !== actionId);

    if (updatedActions.length === 0) {
      onEventChange(eventType, undefined);
    } else {
      onEventChange(eventType, {
        ...currentConfig,
        actions: updatedActions,
      });
    }
  };

  const handleMoveAction = (eventType: EventType, actionId: string, direction: 'up' | 'down') => {
    const currentConfig = getEventConfig(eventType);
    if (!currentConfig || currentConfig.actions.length < 2) return;

    const index = currentConfig.actions.findIndex((action) => action.id === actionId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= currentConfig.actions.length) return;

    const updatedActions = [...currentConfig.actions];
    const [removed] = updatedActions.splice(index, 1);
    updatedActions.splice(newIndex, 0, removed);

    onEventChange(eventType, {
      ...currentConfig,
      actions: updatedActions,
    });
  };

  if (supportedEvents.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center py-4">
        该组件不支持事件配置
      </div>
    );
  }

  return (
    <div>
      {supportedEvents.length > 1 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            选择事件类型
          </label>
          <div className="flex flex-wrap gap-2">
            {supportedEvents.map((eventType) => (
              <button
                key={eventType}
                type="button"
                onClick={() => setSelectedEventType(eventType)}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-md border transition-colors',
                  selectedEventType === eventType
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                )}
              >
                {getEventLabel(eventType)}
                {getEventConfig(eventType) && (
                  <span className="ml-1 text-xs">
                    ({getEventConfig(eventType)?.actions.length || 0})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedEventType && (
        <div>
          <div className="flex items-center justify-between mb-3">
            {supportedEvents.length === 1 && (
              <Text variant="body2" weight="medium" className="text-gray-700">
                {getEventLabel(selectedEventType)}
              </Text>
            )}
            <div className="flex-1" />
          </div>

          {getEventConfig(selectedEventType)?.actions.length === 0 ||
          !getEventConfig(selectedEventType) ? (
            <div className="text-sm text-gray-500 text-center py-4 mb-3 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              暂无动作配置，点击下方按钮添加
            </div>
          ) : (
            <div className="mb-3">
              {getEventConfig(selectedEventType)!.actions.map((action, index) => (
                <ActionEditor
                  key={action.id}
                  action={action}
                  onUpdate={(id, updates) => handleUpdateAction(selectedEventType, id, updates)}
                  onRemove={(id) => handleRemoveAction(selectedEventType, id)}
                  onMoveUp={(id) => handleMoveAction(selectedEventType, id, 'up')}
                  onMoveDown={(id) => handleMoveAction(selectedEventType, id, 'down')}
                  isFirst={index === 0}
                  isLast={index === getEventConfig(selectedEventType)!.actions.length - 1}
                />
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={handleAddAction}
            className="w-full py-2 px-4 text-sm text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg border border-dashed border-primary-300 transition-colors flex items-center justify-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            添加动作
          </button>
        </div>
      )}
    </div>
  );
};

interface ValidationRuleEditorProps {
  rule: ValidationRule & { id: string };
  onUpdate: (id: string, rule: Partial<ValidationRule>) => void;
  onRemove: (id: string) => void;
}

const ValidationRuleEditor: React.FC<ValidationRuleEditorProps> = ({ rule, onUpdate, onRemove }) => {
  const needsValue = ['minLength', 'maxLength', 'min', 'max', 'pattern'].includes(rule.type);

  const handleTypeChange = (type: ValidationRuleType) => {
    onUpdate(rule.id, { type });
  };

  const handleValueChange = (value: string) => {
    let parsedValue: number | string | undefined;
    if (['minLength', 'maxLength', 'min', 'max'].includes(rule.type)) {
      parsedValue = value === '' ? undefined : Number(value);
    } else {
      parsedValue = value || undefined;
    }
    onUpdate(rule.id, { value: parsedValue });
  };

  const handleMessageChange = (message: string) => {
    onUpdate(rule.id, { message: message || undefined });
  };

  return (
    <div className="p-3 mb-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-start gap-2">
        <div className="flex-1 space-y-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">规则类型</label>
            <select
              value={rule.type}
              onChange={(e) => handleTypeChange(e.target.value as ValidationRuleType)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white"
            >
              {VALIDATION_RULE_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {needsValue && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {rule.type === 'minLength' && '最小长度'}
                {rule.type === 'maxLength' && '最大长度'}
                {rule.type === 'min' && '最小值'}
                {rule.type === 'max' && '最大值'}
                {rule.type === 'pattern' && '正则表达式'}
              </label>
              <input
                type={['minLength', 'maxLength', 'min', 'max'].includes(rule.type) ? 'number' : 'text'}
                value={rule.value ?? ''}
                onChange={(e) => handleValueChange(e.target.value)}
                placeholder={
                  rule.type === 'pattern' 
                    ? '例如：^[a-zA-Z]+$' 
                    : '请输入数值'
                }
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">错误提示（可选）</label>
            <input
              type="text"
              value={rule.message ?? ''}
              onChange={(e) => handleMessageChange(e.target.value)}
              placeholder="留空则使用默认提示"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => onRemove(rule.id)}
          className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
          title="删除规则"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

interface ValidationRulesEditorProps {
  rules: (ValidationRule & { id: string })[];
  onChange: (rules: (ValidationRule & { id: string })[]) => void;
}

const ValidationRulesEditor: React.FC<ValidationRulesEditorProps> = ({ rules, onChange }) => {
  const handleAddRule = () => {
    const newRule: ValidationRule & { id: string } = {
      id: generateId('rule'),
      type: 'required',
    };
    onChange([...rules, newRule]);
  };

  const handleUpdateRule = (id: string, updates: Partial<ValidationRule>) => {
    const updatedRules = rules.map((rule) =>
      rule.id === id ? { ...rule, ...updates } : rule
    );
    onChange(updatedRules);
  };

  const handleRemoveRule = (id: string) => {
    const updatedRules = rules.filter((rule) => rule.id !== id);
    onChange(updatedRules);
  };

  return (
    <div>
      {rules.length === 0 && (
        <p className="text-sm text-gray-500 mb-3">暂无验证规则，点击下方按钮添加</p>
      )}

      {rules.map((rule) => (
        <ValidationRuleEditor
          key={rule.id}
          rule={rule}
          onUpdate={handleUpdateRule}
          onRemove={handleRemoveRule}
        />
      ))}

      <button
        type="button"
        onClick={handleAddRule}
        className="w-full py-2 px-4 text-sm text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg border border-dashed border-primary-300 transition-colors flex items-center justify-center gap-1"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        添加验证规则
      </button>
    </div>
  );
};

interface BindingRuleEditorProps {
  binding: DataBindingRule;
  availableComponents: { id: string; label: string; type: ComponentType }[];
  isSource: boolean;
  onUpdate: (updates: Partial<DataBindingRule>) => void;
  onRemove: () => void;
}

const BindingRuleEditor: React.FC<BindingRuleEditorProps> = ({
  binding,
  availableComponents,
  isSource,
  onUpdate,
  onRemove,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const allComponents = React.useMemo(() => {
    const allAvailable = [...availableComponents];
    if (!allAvailable.find((c) => c.id === binding.sourceId)) {
      allAvailable.push({
        id: binding.sourceId,
        label: `组件 ${binding.sourceId}`,
        type: ComponentType.Input,
      });
    }
    if (!allAvailable.find((c) => c.id === binding.targetId)) {
      allAvailable.push({
        id: binding.targetId,
        label: `组件 ${binding.targetId}`,
        type: ComponentType.Input,
      });
    }
    return allAvailable;
  }, [availableComponents, binding.sourceId, binding.targetId]);

  const pathOptions = [
    { value: BindingPath.Value, label: '值 (value)' },
    { value: BindingPath.Options, label: '选项列表 (options)' },
    { value: BindingPath.Disabled, label: '禁用状态 (disabled)' },
    { value: BindingPath.Placeholder, label: '占位符 (placeholder)' },
  ];

  const triggerOptions = [
    { value: BindingTrigger.Change, label: '值变更时 (change)' },
    { value: BindingTrigger.Input, label: '输入时 (input)' },
    { value: BindingTrigger.Manual, label: '手动触发' },
  ];

  const transformOptions = [
    { value: 'direct' as const, label: '直接传递' },
    { value: 'mapping' as const, label: '映射转换' },
    { value: 'custom' as const, label: '自定义函数' },
  ];

  return (
    <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={binding.enabled}
            onChange={(e) => onUpdate({ enabled: e.target.checked })}
            className="w-4 h-4 text-primary-600 rounded"
          />
          <Text variant="body2" weight="medium">
            {isSource ? (
              <>
                → {allComponents.find((c) => c.id === binding.targetId)?.label || binding.targetId}
              </>
            ) : (
              <>
                ← {allComponents.find((c) => c.id === binding.sourceId)?.label || binding.sourceId}
              </>
            )}
          </Text>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-gray-500 hover:text-gray-700"
          >
            {isExpanded ? '▲' : '▼'}
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="p-1 text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
          {isSource ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                目标组件
              </label>
              <select
                value={binding.targetId}
                onChange={(e) => onUpdate({ targetId: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
              >
                {allComponents.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                源组件
              </label>
              <select
                value={binding.sourceId}
                onChange={(e) => onUpdate({ sourceId: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
              >
                {allComponents.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                源属性路径
              </label>
              <select
                value={binding.sourcePath}
                onChange={(e) => onUpdate({ sourcePath: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
              >
                {pathOptions.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                目标属性路径
              </label>
              <select
                value={binding.targetPath}
                onChange={(e) => onUpdate({ targetPath: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
              >
                {pathOptions.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              触发方式
            </label>
            <select
              value={binding.trigger}
              onChange={(e) => onUpdate({ trigger: e.target.value as BindingTrigger })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
            >
              {triggerOptions.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              转换方式
            </label>
            <select
              value={binding.transformType || 'direct'}
              onChange={(e) => onUpdate({ transformType: e.target.value as 'direct' | 'mapping' | 'custom' })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
            >
              {transformOptions.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {binding.transformType === 'mapping' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                映射配置 (JSON格式)
              </label>
              <textarea
                value={binding.mapping ? JSON.stringify(binding.mapping, null, 2) : '{}'}
                onChange={(e) => {
                  try {
                    const mapping = JSON.parse(e.target.value);
                    onUpdate({ mapping });
                  } catch {
                  }
                }}
                placeholder='{"CN": ["北京", "上海"], "US": ["纽约", "洛杉矶"]}'
                rows={4}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md font-mono"
              />
              <p className="mt-1 text-xs text-gray-500">
                格式: {"{"}"源值": ["目标值1", "目标值2"]{"}"}
              </p>
            </div>
          )}

          {binding.transformType === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                自定义转换函数
              </label>
              <textarea
                value={binding.customTransform || 'value'}
                onChange={(e) => onUpdate({ customTransform: e.target.value })}
                placeholder="value.toUpperCase()"
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md font-mono"
              />
              <p className="mt-1 text-xs text-gray-500">
                使用 value 变量表示源值，返回转换后的值
              </p>
            </div>
          )}
        </div>
      )}
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
  const { 
    components, 
    selectedComponentId, 
    updateComponent, 
    removeComponent, 
    setSelectedComponentId, 
    addComponent,
    moveUp,
    moveDown,
    moveToTop,
    moveToBottom,
    canMoveUp,
    canMoveDown,
    getComponentLayerInfo,
    bindings,
    addBinding,
    updateBinding,
    removeBinding,
  } = useBuilderStore();

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

    let finalValue = value;

    if (config.type === 'options') {
      finalValue = optionsTextToArray(value);
    }

    if (config.category === 'props') {
      updateComponent(selectedComponentId, {
        props: {
          ...selectedComponent.props,
          [config.key]: finalValue,
        },
      });
    } else if (config.category === 'styles') {
      updateComponent(selectedComponentId, {
        styles: {
          ...selectedComponent.styles,
          [config.key]: finalValue,
        },
      });
    } else if (config.category === 'basic') {
      updateComponent(selectedComponentId, {
        [config.key]: finalValue,
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

  const handleAdvancedEventChange = useCallback((eventType: EventType, config: EventConfig | undefined) => {
    if (!selectedComponentId || !selectedComponent) return;

    const currentEvents = selectedComponent.events || {};
    let newEvents = { ...currentEvents };

    switch (eventType) {
      case EventType.Click:
        if (config) {
          newEvents.onClickActions = config;
        } else {
          delete newEvents.onClickActions;
        }
        break;
      case EventType.Change:
        if (config) {
          newEvents.onChangeActions = config;
        } else {
          delete newEvents.onChangeActions;
        }
        break;
      case EventType.Submit:
        if (config) {
          newEvents.onSubmitActions = config;
        } else {
          delete newEvents.onSubmitActions;
        }
        break;
      case EventType.Focus:
        if (config) {
          newEvents.onFocusActions = config;
        } else {
          delete newEvents.onFocusActions;
        }
        break;
      case EventType.Blur:
        if (config) {
          newEvents.onBlurActions = config;
        } else {
          delete newEvents.onBlurActions;
        }
        break;
    }

    const hasEvents = Object.keys(newEvents).length > 0;
    updateComponent(selectedComponentId, {
      events: hasEvents ? newEvents : undefined,
    });
  }, [selectedComponentId, selectedComponent, updateComponent]);

  const handleValidationRulesChange = useCallback((rules: (ValidationRule & { id: string })[]) => {
    if (!selectedComponentId || !selectedComponent) return;

    const cleanRules = rules.map(({ id, ...rest }) => rest);

    updateComponent(selectedComponentId, {
      props: {
        ...selectedComponent.props,
        validationRules: cleanRules.length > 0 ? cleanRules : undefined,
      },
    });
  }, [selectedComponentId, selectedComponent, updateComponent]);

  const getValidationRules = (): (ValidationRule & { id: string })[] => {
    if (!selectedComponent) return [];
    const rules = selectedComponent.props?.validationRules;
    if (!rules || !Array.isArray(rules)) return [];
    return rules.map((rule: ValidationRule, index: number) => ({
      ...rule,
      id: `rule-${index}`,
    }));
  };

  const isFormFieldComponent = (type: ComponentType): boolean => {
    return [
      ComponentType.Input,
      ComponentType.Textarea,
      ComponentType.Select,
    ].includes(type);
  };

  const isBindableComponent = (type: ComponentType): boolean => {
    return [
      ComponentType.Input,
      ComponentType.Textarea,
      ComponentType.Select,
      ComponentType.Checkbox,
      ComponentType.CheckboxGroup,
      ComponentType.Radio,
      ComponentType.RadioGroup,
      ComponentType.Switch,
    ].includes(type);
  };

  const getSupportedEventTypes = (type: ComponentType): EventType[] => {
    const eventMap: Record<ComponentType, EventType[]> = {
      [ComponentType.Text]: [],
      [ComponentType.Button]: [EventType.Click],
      [ComponentType.Image]: [],
      [ComponentType.Container]: [],
      [ComponentType.Input]: [EventType.Change, EventType.Focus, EventType.Blur],
      [ComponentType.Textarea]: [EventType.Change, EventType.Focus, EventType.Blur],
      [ComponentType.Select]: [EventType.Change, EventType.Focus, EventType.Blur],
      [ComponentType.Checkbox]: [EventType.Change],
      [ComponentType.CheckboxGroup]: [EventType.Change],
      [ComponentType.Radio]: [EventType.Change],
      [ComponentType.RadioGroup]: [EventType.Change],
      [ComponentType.Switch]: [EventType.Change],
      [ComponentType.Form]: [EventType.Submit],
      [ComponentType.FormItem]: [],
    };
    return eventMap[type] || [];
  };

  const isInteractiveComponent = (type: ComponentType): boolean => {
    return getSupportedEventTypes(type).length > 0;
  };

  const getAvailableComponents = useMemo(() => {
    const result: { id: string; label: string; type: ComponentType }[] = [];
    
    const collectComponents = (list: ComponentSchema[]) => {
      for (const comp of list) {
        if (comp.id !== selectedComponentId && isBindableComponent(comp.type)) {
          result.push({
            id: comp.id,
            label: `${getComponentLabel(comp.type)} (${comp.id})`,
            type: comp.type,
          });
        }
        if (comp.type === ComponentType.Container && comp.children) {
          collectComponents(comp.children);
        }
      }
    };
    
    collectComponents(components);
    return result;
  }, [components, selectedComponentId]);

  const getBindingsForCurrentComponent = useMemo(() => {
    if (!selectedComponentId) return { asSource: [], asTarget: [] };
    return {
      asSource: bindings.filter((b) => b.sourceId === selectedComponentId),
      asTarget: bindings.filter((b) => b.targetId === selectedComponentId),
    };
  }, [bindings, selectedComponentId]);

  const handleAddBinding = (direction: 'source' | 'target') => {
    if (!selectedComponentId) return;

    const newBinding: Omit<DataBindingRule, 'id' | 'createdAt' | 'updatedAt'> = {
      sourceId: direction === 'source' ? selectedComponentId : (getAvailableComponents[0]?.id || ''),
      targetId: direction === 'target' ? selectedComponentId : (getAvailableComponents[0]?.id || ''),
      sourcePath: BindingPath.Value,
      targetPath: BindingPath.Value,
      trigger: BindingTrigger.Change,
      transformType: 'direct',
      enabled: true,
    };

    addBinding(newBinding);
  };

  const handleUpdateBinding = (id: string, updates: Partial<DataBindingRule>) => {
    updateBinding(id, updates);
  };

  const handleRemoveBinding = (id: string) => {
    const confirmed = window.confirm('确定要删除此绑定规则吗？');
    if (confirmed) {
      removeBinding(id);
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

  const optionsArrayToText = (options: { value: string | number; label: string }[] | undefined): string => {
    if (!options || !Array.isArray(options)) {
      return '';
    }
    return options.map((opt) => `${opt.value}:${opt.label}`).join('\n');
  };

  const optionsTextToArray = (text: string | undefined): { value: string; label: string }[] | undefined => {
    if (!text || typeof text !== 'string') {
      return undefined;
    }
    const lines = text.split('\n').filter((line) => line.trim());
    if (lines.length === 0) {
      return undefined;
    }
    return lines.map((line) => {
      const trimmed = line.trim();
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex > 0) {
        const value = trimmed.slice(0, colonIndex).trim();
        const label = trimmed.slice(colonIndex + 1).trim();
        return { value, label: label || value };
      }
      return { value: trimmed, label: trimmed };
    });
  };

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

    if (config.type === 'options') {
      const finalValue = value !== undefined ? value : config.defaultValue;
      return optionsArrayToText(finalValue as { value: string | number; label: string }[]);
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

        {selectedComponentId && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <Text variant="caption" color="muted" weight="medium">
              层级控制
            </Text>
              {(() => {
                const layerInfo = getComponentLayerInfo(selectedComponentId);
                return layerInfo ? (
                  <Text variant="caption" color="muted">
                    层级：{layerInfo.currentLayer} / {layerInfo.totalLayers}
                  </Text>
                ) : null;
              })()}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectedComponentId && moveToTop(selectedComponentId)}
                disabled={!selectedComponentId || !canMoveUp(selectedComponentId)}
                className={cn(
                  'flex-1',
                  (!selectedComponentId || !canMoveUp(selectedComponentId)) && 'opacity-50 cursor-not-allowed'
                )}
              >
                置顶
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectedComponentId && moveUp(selectedComponentId)}
                disabled={!selectedComponentId || !canMoveUp(selectedComponentId)}
                className={cn(
                  'flex-1',
                  (!selectedComponentId || !canMoveUp(selectedComponentId)) && 'opacity-50 cursor-not-allowed'
                )}
              >
                上移
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectedComponentId && moveDown(selectedComponentId)}
                disabled={!selectedComponentId || !canMoveDown(selectedComponentId)}
                className={cn(
                  'flex-1',
                  (!selectedComponentId || !canMoveDown(selectedComponentId)) && 'opacity-50 cursor-not-allowed'
                )}
              >
                下移
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectedComponentId && moveToBottom(selectedComponentId)}
                disabled={!selectedComponentId || !canMoveDown(selectedComponentId)}
                className={cn(
                  'flex-1',
                  (!selectedComponentId || !canMoveDown(selectedComponentId)) && 'opacity-50 cursor-not-allowed'
                )}
              >
                置底
              </Button>
            </div>
          </div>
        )}
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

      {isInteractiveComponent(selectedComponent.type) && (
        <PropertySection title="事件配置" isEmpty={false}>
          <AdvancedEventConfigEditor
            componentType={selectedComponent.type}
            events={{
              onClickActions: selectedComponent.events?.onClickActions,
              onChangeActions: selectedComponent.events?.onChangeActions,
              onSubmitActions: selectedComponent.events?.onSubmitActions,
              onFocusActions: selectedComponent.events?.onFocusActions,
              onBlurActions: selectedComponent.events?.onBlurActions,
            }}
            onEventChange={handleAdvancedEventChange}
          />
        </PropertySection>
      )}

      {isFormFieldComponent(selectedComponent.type) && (
        <PropertySection title="验证规则" isEmpty={false}>
          <ValidationRulesEditor
            rules={getValidationRules()}
            onChange={handleValidationRulesChange}
          />
        </PropertySection>
      )}

      {isBindableComponent(selectedComponent.type) && (
        <PropertySection 
          title="数据绑定" 
          isEmpty={
            getBindingsForCurrentComponent.asSource.length === 0 &&
            getBindingsForCurrentComponent.asTarget.length === 0 &&
            getAvailableComponents.length === 0
          }
        >
          {getBindingsForCurrentComponent.asSource.length > 0 && (
            <div className="mb-4">
              <Text variant="caption" color="muted" weight="medium" className="mb-2">
                作为源组件（当前组件变更时触发）
              </Text>
              {getBindingsForCurrentComponent.asSource.map((binding) => (
                <BindingRuleEditor
                  key={binding.id}
                  binding={binding}
                  availableComponents={getAvailableComponents}
                  isSource={true}
                  onUpdate={(updates) => handleUpdateBinding(binding.id, updates)}
                  onRemove={() => handleRemoveBinding(binding.id)}
                />
              ))}
            </div>
          )}

          {getBindingsForCurrentComponent.asTarget.length > 0 && (
            <div className="mb-4">
              <Text variant="caption" color="muted" weight="medium" className="mb-2">
                作为目标组件（其他组件变更时触发）
              </Text>
              {getBindingsForCurrentComponent.asTarget.map((binding) => (
                <BindingRuleEditor
                  key={binding.id}
                  binding={binding}
                  availableComponents={getAvailableComponents}
                  isSource={false}
                  onUpdate={(updates) => handleUpdateBinding(binding.id, updates)}
                  onRemove={() => handleRemoveBinding(binding.id)}
                />
              ))}
            </div>
          )}

          {getAvailableComponents.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddBinding('source')}
                className="flex-1"
              >
                + 绑定到其他组件
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddBinding('target')}
                className="flex-1"
              >
                + 从其他组件绑定
              </Button>
            </div>
          )}

          {getAvailableComponents.length === 0 && (
            <p className="text-sm text-gray-500">
              画布上没有其他可绑定的组件，请先添加更多表单组件。
            </p>
          )}
        </PropertySection>
      )}
    </div>
  );
};

export { PropertyPanel };
export type { PropertyPanelProps };
