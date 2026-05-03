import * as React from 'react';
import type { 
  DataBindingRule, 
  DataBindingContextValue,
  BindingTrigger 
} from '@/types/component';
import { generateId } from '@/utils/id';
import { logger } from '@/utils/logger';

const DataBindingContext = React.createContext<DataBindingContextValue | null>(null);

export const useDataBinding = (): DataBindingContextValue => {
  const context = React.useContext(DataBindingContext);
  if (!context) {
    throw new Error('useDataBinding must be used within a DataBindingProvider');
  }
  return context;
};

interface DataBindingProviderProps {
  children: React.ReactNode;
  initialBindings?: DataBindingRule[];
  onBindingsChange?: (bindings: DataBindingRule[]) => void;
  onUpdateComponent?: (componentId: string, updates: Record<string, any>) => void;
  getComponentProps?: (componentId: string) => Record<string, any> | null;
}

export const DataBindingProvider: React.FC<DataBindingProviderProps> = ({
  children,
  initialBindings = [],
  onBindingsChange,
  onUpdateComponent,
  getComponentProps,
}) => {
  const [bindings, setBindings] = React.useState<DataBindingRule[]>(initialBindings);
  const bindingStackRef = React.useRef<string[]>([]);
  const processedBindingsRef = React.useRef<Set<string>>(new Set());

  React.useEffect(() => {
    setBindings(initialBindings);
  }, [initialBindings]);

  const addBinding = React.useCallback((
    binding: Omit<DataBindingRule, 'id' | 'createdAt' | 'updatedAt'>
  ): string => {
    const now = new Date().toISOString();
    const newBinding: DataBindingRule = {
      ...binding,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };

    const newBindings = [...bindings, newBinding];
    setBindings(newBindings);
    onBindingsChange?.(newBindings);
    
    logger.log('添加数据绑定规则', { binding: newBinding });
    return newBinding.id;
  }, [bindings, onBindingsChange]);

  const updateBinding = React.useCallback((
    id: string,
    updates: Partial<DataBindingRule>
  ) => {
    const now = new Date().toISOString();
    const newBindings = bindings.map((b) => 
      b.id === id ? { ...b, ...updates, updatedAt: now } : b
    );
    setBindings(newBindings);
    onBindingsChange?.(newBindings);
    logger.log('更新数据绑定规则', { id, updates });
  }, [bindings, onBindingsChange]);

  const removeBinding = React.useCallback((id: string) => {
    const newBindings = bindings.filter((b) => b.id !== id);
    setBindings(newBindings);
    onBindingsChange?.(newBindings);
    logger.log('移除数据绑定规则', { id });
  }, [bindings, onBindingsChange]);

  const getBindingsForSource = React.useCallback((sourceId: string): DataBindingRule[] => {
    return bindings.filter((b) => b.sourceId === sourceId && b.enabled);
  }, [bindings]);

  const getBindingsForTarget = React.useCallback((targetId: string): DataBindingRule[] => {
    return bindings.filter((b) => b.targetId === targetId && b.enabled);
  }, [bindings]);

  const detectCycle = React.useCallback((
    startId: string,
    visited: Set<string> = new Set()
  ): boolean => {
    const sourceBindings = bindings.filter((b) => b.sourceId === startId && b.enabled);
    
    for (const binding of sourceBindings) {
      if (visited.has(binding.targetId)) {
        return true;
      }
      visited.add(binding.targetId);
      if (detectCycle(binding.targetId, visited)) {
        return true;
      }
      visited.delete(binding.targetId);
    }
    return false;
  }, [bindings]);

  const isBindingInCycle = React.useCallback((bindingId: string): boolean => {
    const binding = bindings.find((b) => b.id === bindingId);
    if (!binding) return false;

    const visited = new Set<string>();
    visited.add(binding.sourceId);
    visited.add(binding.targetId);
    
    return detectCycle(binding.targetId, visited);
  }, [bindings, detectCycle]);

  const transformValue = React.useCallback((
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
  }, []);

  const getValueByPath = React.useCallback((
    props: Record<string, any>,
    path: string
  ): any => {
    const keys = path.split('.');
    let value: any = props;
    
    for (const key of keys) {
      if (value === null || value === undefined) {
        return undefined;
      }
      value = value[key];
    }
    
    return value;
  }, []);

  const triggerBinding = React.useCallback((
    sourceId: string,
    triggerType: BindingTrigger,
    sourceValue: any
  ) => {
    const sourceBindings = getBindingsForSource(sourceId).filter(
      (b) => b.trigger === triggerType
    );

    if (sourceBindings.length === 0) return;

    for (const binding of sourceBindings) {
      if (processedBindingsRef.current.has(binding.id)) {
        continue;
      }

      if (bindingStackRef.current.includes(binding.id)) {
        logger.warn('检测到循环绑定，跳过执行', { bindingId: binding.id });
        continue;
      }

      if (isBindingInCycle(binding.id)) {
        logger.warn('绑定规则存在循环依赖，跳过执行', { bindingId: binding.id });
        continue;
      }

      bindingStackRef.current.push(binding.id);
      processedBindingsRef.current.add(binding.id);

      try {
        let valueToUse = sourceValue;
        
        if (binding.sourcePath && getComponentProps) {
          const sourceProps = getComponentProps(binding.sourceId);
          if (sourceProps) {
            valueToUse = getValueByPath(sourceProps, binding.sourcePath);
          }
        }

        const transformedValue = transformValue(valueToUse, binding);

        if (onUpdateComponent) {
          const [targetKey, ...nestedKeys] = binding.targetPath.split('.');
          
          if (nestedKeys.length === 0) {
            onUpdateComponent(binding.targetId, { [targetKey]: transformedValue });
          } else {
            const currentProps = getComponentProps?.(binding.targetId) || {};
            let targetValue = { ...currentProps[targetKey] };
            let current = targetValue;
            
            for (let i = 0; i < nestedKeys.length - 1; i++) {
              current[nestedKeys[i]] = { ...current[nestedKeys[i]] };
              current = current[nestedKeys[i]];
            }
            current[nestedKeys[nestedKeys.length - 1]] = transformedValue;
            
            onUpdateComponent(binding.targetId, { [targetKey]: targetValue });
          }

          logger.log('执行数据绑定', {
            bindingId: binding.id,
            sourceId: binding.sourceId,
            targetId: binding.targetId,
            sourceValue: valueToUse,
            transformedValue,
          });
        }
      } catch (error) {
        logger.error('数据绑定执行失败', { bindingId: binding.id, error });
      } finally {
        bindingStackRef.current.pop();
      }
    }

    processedBindingsRef.current.clear();
  }, [getBindingsForSource, isBindingInCycle, transformValue, getValueByPath, onUpdateComponent, getComponentProps]);

  const contextValue: DataBindingContextValue = React.useMemo(() => ({
    bindings,
    addBinding,
    updateBinding,
    removeBinding,
    getBindingsForSource,
    getBindingsForTarget,
    triggerBinding,
    isBindingInCycle,
  }), [
    bindings,
    addBinding,
    updateBinding,
    removeBinding,
    getBindingsForSource,
    getBindingsForTarget,
    triggerBinding,
    isBindingInCycle,
  ]);

  return (
    <DataBindingContext.Provider value={contextValue}>
      {children}
    </DataBindingContext.Provider>
  );
};

export const useFormBinding = (componentId: string) => {
  const context = useDataBinding();

  const sourceBindings = React.useMemo(
    () => context.getBindingsForSource(componentId),
    [context, componentId]
  );

  const targetBindings = React.useMemo(
    () => context.getBindingsForTarget(componentId),
    [context, componentId]
  );

  const trigger = React.useCallback((
    triggerType: BindingTrigger,
    value: any
  ) => {
    context.triggerBinding(componentId, triggerType, value);
  }, [context, componentId]);

  return {
    sourceBindings,
    targetBindings,
    trigger,
    addBinding: context.addBinding,
    updateBinding: context.updateBinding,
    removeBinding: context.removeBinding,
  };
};

export type { DataBindingRule, DataBindingContextValue, BindingTrigger };
