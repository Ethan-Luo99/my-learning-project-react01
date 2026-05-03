import * as React from 'react';
import type { DataBindingRule, BindingTrigger } from '@/types/component';
import { logger } from '@/utils/logger';

interface ComponentState {
  values: Record<string, any>;
  props: Record<string, Record<string, any>>;
}

interface PreviewBindingContextValue {
  componentStates: ComponentState;
  bindingRules: DataBindingRule[];
  getComponentValue: (componentId: string, path?: string) => any;
  setComponentValue: (componentId: string, value: any, path?: string) => void;
  getComponentProp: (componentId: string, propKey: string) => any;
  setComponentProp: (componentId: string, propKey: string, value: any) => void;
  triggerBinding: (sourceId: string, triggerType: BindingTrigger, sourceValue: any) => void;
}

const PreviewBindingContext = React.createContext<PreviewBindingContextValue | null>(null);

export const usePreviewBinding = (): PreviewBindingContextValue => {
  const context = React.useContext(PreviewBindingContext);
  if (!context) {
    throw new Error('usePreviewBinding must be used within a PreviewBindingProvider');
  }
  return context;
};

interface PreviewBindingProviderProps {
  children: React.ReactNode;
  bindingRules: DataBindingRule[];
}

const getValueByPath = (obj: any, path: string): any => {
  if (!path || path === 'value') return obj;
  const keys = path.split('.');
  let value = obj;
  for (const key of keys) {
    if (value === null || value === undefined) {
      return undefined;
    }
    value = value[key];
  }
  return value;
};

const setValueByPath = (obj: any, path: string, value: any): any => {
  if (!path || path === 'value') {
    return value;
  }
  const keys = path.split('.');
  const result = { ...obj };
  let current = result;
  
  for (let i = 0; i < keys.length - 1; i++) {
    current[keys[i]] = { ...current[keys[i]] };
    current = current[keys[i]];
  }
  
  current[keys[keys.length - 1]] = value;
  return result;
};

const transformValue = (
  value: any,
  rule: DataBindingRule
): any => {
  switch (rule.transformType) {
    case 'mapping':
      if (rule.mapping && value !== undefined && value !== null) {
        const key = String(value);
        if (key in rule.mapping) {
          return rule.mapping[key];
        }
      }
      return value;

    case 'custom':
      if (rule.customTransform) {
        try {
          const fn = new Function('value', `return ${rule.customTransform}`);
          return fn(value);
        } catch (error) {
          logger.error('自定义转换函数执行失败', { error, transform: rule.customTransform });
          return value;
        }
      }
      return value;

    case 'direct':
    default:
      return value;
  }
};

export const PreviewBindingProvider: React.FC<PreviewBindingProviderProps> = ({
  children,
  bindingRules,
}) => {
  const [componentStates, setComponentStates] = React.useState<ComponentState>({
    values: {},
    props: {},
  });

  const bindingStackRef = React.useRef<string[]>([]);
  const processedBindingsRef = React.useRef<Set<string>>(new Set());

  const getComponentValue = React.useCallback((componentId: string, path?: string): any => {
    const value = componentStates.values[componentId];
    if (path) {
      return getValueByPath(value, path);
    }
    return value;
  }, [componentStates.values]);

  const setComponentValue = React.useCallback((componentId: string, value: any, path?: string) => {
    setComponentStates((prev) => {
      let newValues = { ...prev.values };
      
      if (path) {
        const currentValue = newValues[componentId];
        newValues[componentId] = setValueByPath(currentValue, path, value);
      } else {
        newValues[componentId] = value;
      }
      
      return {
        ...prev,
        values: newValues,
      };
    });
  }, []);

  const getComponentProp = React.useCallback((componentId: string, propKey: string): any => {
    const props = componentStates.props[componentId];
    return props ? props[propKey] : undefined;
  }, [componentStates.props]);

  const setComponentProp = React.useCallback((componentId: string, propKey: string, value: any) => {
    setComponentStates((prev) => {
      const currentProps = prev.props[componentId] || {};
      return {
        ...prev,
        props: {
          ...prev.props,
          [componentId]: {
            ...currentProps,
            [propKey]: value,
          },
        },
      };
    });
  }, []);

  const triggerBinding = React.useCallback((
    sourceId: string,
    triggerType: BindingTrigger,
    sourceValue: any
  ) => {
    const relevantBindings = bindingRules.filter(
      (rule) => rule.sourceId === sourceId && rule.trigger === triggerType && rule.enabled
    );

    if (relevantBindings.length === 0) return;

    for (const binding of relevantBindings) {
      if (processedBindingsRef.current.has(binding.id)) {
        continue;
      }

      if (bindingStackRef.current.includes(binding.id)) {
        logger.warn('检测到循环绑定，跳过执行', { bindingId: binding.id });
        continue;
      }

      bindingStackRef.current.push(binding.id);
      processedBindingsRef.current.add(binding.id);

      try {
        let valueToUse = sourceValue;
        
        if (binding.sourcePath && binding.sourcePath !== 'value') {
          valueToUse = getValueByPath(sourceValue, binding.sourcePath);
        }

        const transformedValue = transformValue(valueToUse, binding);

        if (binding.targetPath === 'value' || !binding.targetPath) {
          setComponentValue(binding.targetId, transformedValue);
        } else if (binding.targetPath === 'options') {
          setComponentProp(binding.targetId, 'options', transformedValue);
        } else if (binding.targetPath === 'disabled') {
          setComponentProp(binding.targetId, 'disabled', transformedValue);
        } else if (binding.targetPath === 'placeholder') {
          setComponentProp(binding.targetId, 'placeholder', transformedValue);
        } else {
          setComponentProp(binding.targetId, binding.targetPath, transformedValue);
        }

        logger.log('执行数据绑定', {
          bindingId: binding.id,
          sourceId: binding.sourceId,
          targetId: binding.targetId,
          sourceValue: valueToUse,
          transformedValue,
        });

        const chainedBindings = bindingRules.filter(
          (rule) => rule.sourceId === binding.targetId && rule.enabled
        );

        for (const chainedBinding of chainedBindings) {
          triggerBinding(binding.targetId, chainedBinding.trigger, transformedValue);
        }
      } catch (error) {
        logger.error('数据绑定执行失败', { bindingId: binding.id, error });
      } finally {
        bindingStackRef.current.pop();
      }
    }

    processedBindingsRef.current.clear();
  }, [bindingRules, setComponentValue, setComponentProp]);

  const contextValue: PreviewBindingContextValue = React.useMemo(() => ({
    componentStates,
    bindingRules,
    getComponentValue,
    setComponentValue,
    getComponentProp,
    setComponentProp,
    triggerBinding,
  }), [
    componentStates,
    bindingRules,
    getComponentValue,
    setComponentValue,
    getComponentProp,
    setComponentProp,
    triggerBinding,
  ]);

  return (
    <PreviewBindingContext.Provider value={contextValue}>
      {children}
    </PreviewBindingContext.Provider>
  );
};

export { PreviewBindingContext };
export type { PreviewBindingContextValue, PreviewBindingProviderProps };
