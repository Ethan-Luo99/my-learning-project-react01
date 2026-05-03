import * as React from 'react';
import { cn } from '@/utils/classname';

export interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  itemKey?: string;
  title?: string;
  disabled?: boolean;
  defaultExpanded?: boolean;
}

const AccordionItem: React.FC<AccordionItemProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn('w-full', className)} {...props}>
      {children}
    </div>
  );
};

AccordionItem.displayName = 'AccordionItem';

export interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  multiple?: boolean;
  bordered?: boolean;
  ghost?: boolean;
  activeKey?: string | string[];
  defaultActiveKey?: string | string[];
  onChange?: (key: string | string[]) => void;
}

interface AccordionContextValue {
  multiple: boolean;
  activeKeys: Set<string>;
  toggleKey: (key: string) => void;
  bordered: boolean;
  ghost: boolean;
}

const AccordionContext = React.createContext<AccordionContextValue>({
  multiple: false,
  activeKeys: new Set(),
  toggleKey: () => {},
  bordered: true,
  ghost: false,
});

export const useAccordionContext = () => React.useContext(AccordionContext);

interface ItemInfo {
  key: string;
  title: string;
  disabled: boolean;
  defaultExpanded: boolean;
  item: React.ReactElement<AccordionItemProps>;
}

const Accordion: React.FC<AccordionProps> = ({
  className,
  multiple = false,
  bordered = true,
  ghost = false,
  activeKey: propActiveKey,
  defaultActiveKey,
  onChange,
  children,
  ...props
}) => {
  const getInitialActiveKeys = React.useCallback((): Set<string> => {
    const keys = propActiveKey ?? defaultActiveKey;
    if (keys === undefined || keys === null) {
      return new Set();
    }
    if (Array.isArray(keys)) {
      return new Set(keys);
    }
    return new Set([keys]);
  }, [propActiveKey, defaultActiveKey]);

  const [internalActiveKeys, setInternalActiveKeys] = React.useState<Set<string>>(getInitialActiveKeys);

  const activeKeys = React.useMemo((): Set<string> => {
    if (propActiveKey === undefined) {
      return internalActiveKeys;
    }
    if (Array.isArray(propActiveKey)) {
      return new Set(propActiveKey);
    }
    return new Set([propActiveKey]);
  }, [propActiveKey, internalActiveKeys]);

  const toggleKey = React.useCallback(
    (key: string) => {
      const newKeys = new Set(activeKeys);

      if (newKeys.has(key)) {
        newKeys.delete(key);
      } else {
        if (!multiple) {
          newKeys.clear();
        }
        newKeys.add(key);
      }

      if (propActiveKey === undefined) {
        setInternalActiveKeys(newKeys);
      }

      const resultKeys = multiple ? Array.from(newKeys) : (newKeys.size > 0 ? Array.from(newKeys)[0] : '');
      onChange?.(resultKeys);
    },
    [activeKeys, multiple, propActiveKey, onChange]
  );

  const itemInfos = React.useMemo<ItemInfo[]>(() => {
    const infos: ItemInfo[] = [];
    React.Children.forEach(children, (child) => {
      if (React.isValidElement<AccordionItemProps>(child)) {
        const key = child.props.itemKey ?? String(child.key ?? infos.length);
        infos.push({
          key,
          title: child.props.title ?? `面板 ${infos.length + 1}`,
          disabled: child.props.disabled ?? false,
          defaultExpanded: child.props.defaultExpanded ?? false,
          item: child,
        });
      }
    });
    return infos;
  }, [children]);

  React.useEffect(() => {
    if (propActiveKey === undefined) {
      const defaultKeys = new Set<string>();
      itemInfos.forEach((info) => {
        if (info.defaultExpanded) {
          if (!multiple) {
            if (defaultKeys.size === 0) {
              defaultKeys.add(info.key);
            }
          } else {
            defaultKeys.add(info.key);
          }
        }
      });
      if (defaultKeys.size > 0 && internalActiveKeys.size === 0) {
        setInternalActiveKeys(defaultKeys);
      }
    }
  }, [itemInfos, multiple, propActiveKey, internalActiveKeys.size]);

  const contextValue: AccordionContextValue = React.useMemo(
    () => ({
      multiple,
      activeKeys,
      toggleKey,
      bordered,
      ghost,
    }),
    [multiple, activeKeys, toggleKey, bordered, ghost]
  );

  const renderItem = (info: ItemInfo, index: number) => {
    const isExpanded = activeKeys.has(info.key);
    const isFirst = index === 0;
    const isLast = index === itemInfos.length - 1;

    const headerClass = cn(
      'flex items-center justify-between px-4 py-3 cursor-pointer transition-colors duration-200',
      'select-none',
      bordered && !ghost && 'border-b border-gray-200',
      ghost && 'bg-transparent',
      !ghost && !bordered && 'bg-gray-50/50',
      info.disabled ? 'cursor-not-allowed text-gray-400' : 'text-gray-700 hover:bg-gray-50',
      isExpanded && 'bg-gray-50/80'
    );

    const contentClass = cn(
      'overflow-hidden transition-all duration-300',
      isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
    );

    const wrapperClass = cn(
      'w-full',
      bordered && !ghost && 'border border-gray-200',
      bordered && !ghost && !isFirst && 'border-t-0',
      bordered && !ghost && isFirst && 'rounded-t-lg',
      bordered && !ghost && isLast && 'rounded-b-lg',
      ghost && 'border-b border-gray-100 last:border-b-0'
    );

    return (
      <div key={info.key} className={wrapperClass}>
        <div
          className={headerClass}
          onClick={() => {
            if (!info.disabled) {
              toggleKey(info.key);
            }
          }}
        >
          <span className="font-medium text-sm">{info.title}</span>
          <svg
            className={cn(
              'w-4 h-4 transition-transform duration-300 text-gray-400',
              isExpanded && 'rotate-180'
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <div className={contentClass}>
          <div className={cn('px-4 py-4', ghost && 'bg-transparent', !ghost && bordered && 'bg-white')}>
            {info.item}
          </div>
        </div>
      </div>
    );
  };

  return (
    <AccordionContext.Provider value={contextValue}>
      <div className={cn('w-full', className)} {...props}>
        {itemInfos.map((info, index) => renderItem(info, index))}
      </div>
    </AccordionContext.Provider>
  );
};

Accordion.displayName = 'Accordion';

export { Accordion, AccordionItem };
