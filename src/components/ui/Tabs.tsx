import * as React from 'react';
import { cn } from '@/utils/classname';

export interface TabPaneProps extends React.HTMLAttributes<HTMLDivElement> {
  tabKey?: string;
  title?: string;
  disabled?: boolean;
  closable?: boolean;
}

const TabPane: React.FC<TabPaneProps> = ({
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

TabPane.displayName = 'TabPane';

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  tabPosition?: 'top' | 'left';
  type?: 'line' | 'card' | 'button';
  animated?: boolean;
  addable?: boolean;
  activeKey?: string;
  defaultActiveKey?: string;
  onTabClick?: (key: string) => void;
  onTabClose?: (key: string) => void;
  onAdd?: () => void;
}

interface TabsContextValue {
  activeKey: string;
  setActiveKey: (key: string) => void;
  type: 'line' | 'card' | 'button';
  tabPosition: 'top' | 'left';
  onTabClick?: (key: string) => void;
  onTabClose?: (key: string) => void;
}

const TabsContext = React.createContext<TabsContextValue>({
  activeKey: '',
  setActiveKey: () => {},
  type: 'line',
  tabPosition: 'top',
});

export const useTabsContext = () => React.useContext(TabsContext);

interface TabInfo {
  key: string;
  title: string;
  disabled: boolean;
  closable: boolean;
  pane: React.ReactElement<TabPaneProps>;
}

const Tabs: React.FC<TabsProps> = ({
  className,
  tabPosition = 'top',
  type = 'line',
  animated = true,
  addable = false,
  activeKey: propActiveKey,
  defaultActiveKey,
  onTabClick,
  onTabClose,
  onAdd,
  children,
  ...props
}) => {
  const [internalActiveKey, setInternalActiveKey] = React.useState<string>(() => {
    return propActiveKey ?? defaultActiveKey ?? '';
  });

  const activeKey = propActiveKey ?? internalActiveKey;

  const setActiveKey = React.useCallback(
    (key: string) => {
      if (propActiveKey === undefined) {
        setInternalActiveKey(key);
      }
    },
    [propActiveKey]
  );

  const tabInfos = React.useMemo<TabInfo[]>(() => {
    const infos: TabInfo[] = [];
    React.Children.forEach(children, (child) => {
      if (React.isValidElement<TabPaneProps>(child)) {
        const key = child.props.tabKey ?? String(child.key ?? infos.length);
        infos.push({
          key,
          title: child.props.title ?? `Tab ${infos.length + 1}`,
          disabled: child.props.disabled ?? false,
          closable: child.props.closable ?? false,
          pane: child,
        });
      }
    });
    return infos;
  }, [children]);

  React.useEffect(() => {
    if (tabInfos.length > 0 && !activeKey) {
      setActiveKey(tabInfos[0].key);
    }
  }, [tabInfos, activeKey, setActiveKey]);

  const handleTabClick = (key: string) => {
    if (tabInfos.find((t) => t.key === key)?.disabled) {
      return;
    }
    setActiveKey(key);
    onTabClick?.(key);
  };

  const handleTabClose = (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    onTabClose?.(key);
  };

  const contextValue: TabsContextValue = React.useMemo(
    () => ({
      activeKey,
      setActiveKey,
      type,
      tabPosition,
      onTabClick,
      onTabClose,
    }),
    [activeKey, setActiveKey, type, tabPosition, onTabClick, onTabClose]
  );

  const activePane = tabInfos.find((t) => t.key === activeKey);

  const renderTabBar = () => {
    const isVertical = tabPosition === 'left';

    const tabClass = cn(
      'flex items-center gap-0',
      isVertical ? 'flex-col border-r border-gray-200 pr-1' : 'border-b border-gray-200'
    );

    const getTabItemClass = (info: TabInfo) => {
      const isActive = info.key === activeKey;
      const baseClass = cn(
        'relative px-4 py-2 text-sm cursor-pointer transition-colors duration-200 flex items-center gap-2',
        'select-none',
        info.disabled && 'cursor-not-allowed text-gray-400',
        !info.disabled && !isActive && 'text-gray-600 hover:text-gray-900'
      );

      if (type === 'line') {
        return cn(
          baseClass,
          isActive && 'text-primary-600 font-medium',
          isVertical
            ? isActive
              ? 'border-r-2 border-r-primary-500 bg-primary-50/50'
              : ''
            : ''
        );
      }

      if (type === 'card') {
        return cn(
          baseClass,
          'border border-gray-200 border-b-0 rounded-t-lg mb-px',
          isActive ? 'bg-white text-primary-600 font-medium border-b-white' : 'bg-gray-50',
          !info.disabled && !isActive && 'hover:bg-gray-100'
        );
      }

      if (type === 'button') {
        return cn(
          baseClass,
          'rounded-md mx-0.5 my-1',
          isActive
            ? 'bg-primary-500 text-white font-medium shadow-sm'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        );
      }

      return baseClass;
    };

    const getActiveIndicator = () => {
      if (type !== 'line') return null;

      if (isVertical) {
        return null;
      }

      const activeIndex = tabInfos.findIndex((t) => t.key === activeKey);
      if (activeIndex === -1) return null;

      return (
        <div
          className={cn(
            'absolute bottom-0 h-0.5 bg-primary-500 transition-all duration-300',
            animated && 'transition-all duration-300'
          )}
          style={{
            left: `calc(${activeIndex * 100}% + 8px)`,
            width: 'calc(100% - 16px)',
            maxWidth: '120px',
          }}
        />
      );
    };

    return (
      <div className={cn('relative', isVertical ? 'flex flex-col' : '')}>
        <div className={tabClass}>
          {tabInfos.map((info) => (
            <div
              key={info.key}
              className={getTabItemClass(info)}
              onClick={() => handleTabClick(info.key)}
            >
              <span>{info.title}</span>
              {info.closable && !info.disabled && (
                <button
                  className="ml-1 w-4 h-4 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={(e) => handleTabClose(e, info.key)}
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
              {type === 'line' && !isVertical && info.key === activeKey && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
              )}
            </div>
          ))}
          {addable && (
            <button
              className="ml-2 w-6 h-6 rounded-md border border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-primary-400 hover:text-primary-500 transition-colors"
              onClick={onAdd}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  };

  const isVertical = tabPosition === 'left';

  return (
    <TabsContext.Provider value={contextValue}>
      <div
        className={cn(
          'w-full',
          isVertical ? 'flex flex-row' : 'flex flex-col',
          className
        )}
        {...props}
      >
        {renderTabBar()}
        <div
          className={cn(
            'flex-1 min-w-0',
            isVertical ? 'pl-4' : 'pt-4',
            animated && 'transition-all duration-200'
          )}
        >
          {activePane?.pane}
        </div>
      </div>
    </TabsContext.Provider>
  );
};

Tabs.displayName = 'Tabs';

export { Tabs, TabPane };
