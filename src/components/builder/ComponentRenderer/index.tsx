/**
 * 组件渲染器
 * 详细文档请参考：docs/architecture/form-system.md
 * 
 * 功能：
 * - 根据 ComponentSchema 动态渲染组件
 * - 支持编辑模式和预览模式
 * - 预览模式下集成数据绑定和表单验证
 * - 表单组件（Input/Select/Checkbox 等）支持值变更触发绑定
 */

import { Text, Button, Image, Container, Card, Divider, Tabs, TabPane, Accordion, AccordionItem, Modal, Input, Textarea, Select, Checkbox, CheckboxGroup, Radio, RadioGroup, Switch, Form, FormItem } from '@/components/ui';
import { 
  ComponentType, 
  type ComponentSchema, 
  type ContainerComponentSchema, 
  type ClickEventConfig,
  ClickEventType,
  BindingTrigger,
  ActionType,
  EventType,
  type EventConfig,
  type ActionConfig,
} from '@/types/component';
import { isContainerComponent } from '@/utils/component';
import { usePreviewModalRegistry } from '@/context/PreviewModalRegistry';
import { cn } from '@/utils/classname';
import { 
  executeAction as executeActionFromEngine, 
  executeActions as executeActionsFromEngine, 
  type ActionExecutionContext,
} from '@/utils/eventEngine';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy, verticalListSortingStrategy, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { createContainerDropZoneId, createSortableItemId } from '@/constants/dnd';
import { logger } from '@/utils/logger';
import { usePreviewFormSubmit, usePreviewFormReset } from '@/context/PreviewFormRegistry';
import { PreviewBindingContext } from '@/context/PreviewBindingContext';


interface ComponentRendererProps {
  component: ComponentSchema;
  isSelected?: boolean;
  onClick?: ((e: React.MouseEvent) => void) | (() => void);
  editable?: boolean;
}

const getTextContent = (component: ComponentSchema): React.ReactNode => {
  const props = component.props;
  return (props as any).content || (props as any).children || '文本';
};

const getButtonContent = (component: ComponentSchema): React.ReactNode => {
  const props = component.props;
  return (props as any).content || (props as any).children || '按钮';
};

const handleWrapperClick = (
  e: React.MouseEvent,
  onClick?: ((e: React.MouseEvent) => void) | (() => void)
) => {
  e.stopPropagation();
  if (onClick) {
    (onClick as (e?: React.MouseEvent) => void)(e);
  }
};

const useClickEventExecutor = () => {
  const submitForm = usePreviewFormSubmit();
  const resetForm = usePreviewFormReset();

  return React.useCallback((eventConfig?: ClickEventConfig): void => {
    if (!eventConfig || eventConfig.type === ClickEventType.None) {
      return;
    }

    switch (eventConfig.type) {
      case ClickEventType.Alert:
        if (eventConfig.alertMessage) {
          alert(eventConfig.alertMessage);
        } else {
          alert('按钮被点击了');
        }
        break;

      case ClickEventType.NavigateUrl:
        if (eventConfig.targetUrl) {
          window.open(eventConfig.targetUrl, '_blank');
        }
        break;

      case ClickEventType.CustomCode:
        if (eventConfig.customCode) {
          try {
            eval(eventConfig.customCode);
          } catch (error) {
            console.error('自定义代码执行错误:', error);
            alert(`代码执行错误: ${error}`);
          }
        }
        break;

      case ClickEventType.FormSubmit:
        submitForm(eventConfig.formId);
        break;

      case ClickEventType.FormReset:
        resetForm(eventConfig.formId);
        break;
    }
  }, [submitForm, resetForm]);
};

const useActionExecutor = () => {
  const submitForm = usePreviewFormSubmit();
  const resetForm = usePreviewFormReset();
  const modalRegistry = usePreviewModalRegistry();

  const actionContext: ActionExecutionContext = React.useMemo(() => {
    const globalContext = (window as any).__previewActionContext as ActionExecutionContext | undefined;
    return {
      submitForm,
      resetForm,
      navigateToPage: globalContext?.navigateToPage,
      openModal: modalRegistry.openModal,
      closeModal: modalRegistry.closeModal,
    };
  }, [submitForm, resetForm, modalRegistry.openModal, modalRegistry.closeModal]);

  const executeAction = React.useCallback((action: ActionConfig): void => {
    executeActionFromEngine(action, actionContext);
  }, [actionContext]);

  const executeActions = React.useCallback((actions: ActionConfig[]): void => {
    executeActionsFromEngine(actions, actionContext);
  }, [actionContext]);

  return { executeAction, executeActions };
};

interface EventExecutorProps {
  events: {
    onClickActions?: EventConfig;
    onChangeActions?: EventConfig;
    onSubmitActions?: EventConfig;
    onFocusActions?: EventConfig;
    onBlurActions?: EventConfig;
  };
}

const useEventExecutor = () => {
  const { executeActions } = useActionExecutor();

  const executeEvent = React.useCallback((eventConfig: EventConfig | undefined): void => {
    if (!eventConfig || !eventConfig.enabled || eventConfig.actions.length === 0) {
      return;
    }
    executeActions(eventConfig.actions);
  }, [executeActions]);

  return { executeEvent };
};

interface SortableContainerChildProps {
  component: ComponentSchema;
  isSelected: boolean;
  onClick?: () => void;
  editable: boolean;
  index: number;
}

const SortableContainerChild: React.FC<SortableContainerChildProps> = ({
  component,
  isSelected,
  onClick,
  editable,
  index,
}) => {
  const sortableId = createSortableItemId(component.id);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: sortableId,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 50 : (isSelected ? 10 : 1),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'cursor-grab active:cursor-grabbing transition-all duration-200 relative',
        isDragging && 'scale-95'
      )}
    >
      {isDragging && (
        <div className="absolute -inset-1 border-2 border-dashed border-primary-400 rounded-lg pointer-events-none" />
      )}
      <ComponentRenderer
        component={component}
        isSelected={isSelected}
        onClick={onClick}
        editable={editable}
      />
    </div>
  );
};

interface ContainerDropZoneProps {
  containerId: string;
  children?: React.ReactNode;
  isEmpty: boolean;
  editable: boolean;
  childComponents?: ComponentSchema[];
  selectedComponentId?: string | null;
  onComponentClick?: (id: string) => void;
  direction?: 'row' | 'column';
}

const ContainerDropZone: React.FC<ContainerDropZoneProps> = ({
  containerId,
  isEmpty,
  editable,
  childComponents = [],
  selectedComponentId,
  onComponentClick,
  direction = 'column',
}) => {
  const dropZoneId = createContainerDropZoneId(containerId);

  const { setNodeRef, isOver, active } = useDroppable({
    id: dropZoneId,
  });

  logger.log('ContainerDropZone 渲染:', {
    containerId,
    dropZoneId,
    isOver,
    active: active ? String(active.id) : null,
    childCount: childComponents.length,
  });

  const sortableIds = childComponents.map((child) => createSortableItemId(child.id));

  const sortingStrategy = direction === 'row' ? horizontalListSortingStrategy : verticalListSortingStrategy;

  if (!editable) {
    return (
      <>
        {childComponents.map((child) => (
          <ComponentRenderer
            key={child.id}
            component={child}
            isSelected={false}
            editable={false}
          />
        ))}
      </>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'w-full h-full min-h-[40px] transition-all duration-200',
        isOver && 'ring-2 ring-primary-500 ring-inset bg-primary-50/50',
        isEmpty && 'flex items-center justify-center'
      )}
      data-container-drop-zone={containerId}
    >
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center gap-2 p-4 pointer-events-none">
          <span className={cn(
            'text-3xl transition-transform duration-300',
            isOver && 'scale-110 animate-bounce'
          )}>
            {isOver ? '✅' : '📦'}
          </span>
          <Text
            variant="caption"
            color="muted"
            className={cn(
              'text-center',
              isOver ? 'text-primary-600' : 'text-gray-400'
            )}
          >
            {isOver ? '释放组件到这里' : '拖入组件到这里'}
          </Text>
        </div>
      ) : (
        <SortableContext items={sortableIds} strategy={sortingStrategy}>
          {childComponents.map((child, index) => (
            <SortableContainerChild
              key={child.id}
              component={child}
              isSelected={child.id === selectedComponentId}
              onClick={onComponentClick ? () => onComponentClick(child.id) : undefined}
              editable={editable}
              index={index}
            />
          ))}
        </SortableContext>
      )}
    </div>
  );
};

const ComponentRenderer: React.FC<ComponentRendererProps> = ({
  component,
  isSelected = false,
  onClick,
  editable = true,
}) => {
  const { type, props, styles, events } = component;
  const executeClickEvent = useClickEventExecutor();
  const { executeEvent } = useEventExecutor();
  const componentId = component.id;

  const previewBinding = React.useContext(PreviewBindingContext);
  const isPreviewMode = !editable && previewBinding !== null;

  const wrapperClassName = cn(
    'relative',
    editable && isSelected && 'ring-2 ring-primary-500 ring-offset-2 rounded-lg'
  );

  const getBindingValue = (path?: string) => {
    if (!isPreviewMode || !previewBinding) return undefined;
    return previewBinding.getComponentValue(componentId, path);
  };

  const getBindingProp = (propKey: string) => {
    if (!isPreviewMode || !previewBinding) return undefined;
    return previewBinding.getComponentProp(componentId, propKey);
  };

  const triggerValueChange = (newValue: any) => {
    if (!isPreviewMode || !previewBinding) return;
    previewBinding.setComponentValue(componentId, newValue);
    previewBinding.triggerBinding(componentId, BindingTrigger.Change, newValue);
  };

  const triggerInputChange = (newValue: any) => {
    if (!isPreviewMode || !previewBinding) return;
    previewBinding.setComponentValue(componentId, newValue);
    previewBinding.triggerBinding(componentId, BindingTrigger.Input, newValue);
  };

  const renderContainerChildren = () => {
    if (!isContainerComponent(component)) {
      return undefined;
    }
    const children = component.children;
    if (!children || children.length === 0) {
      return undefined;
    }
    return children.map((child) => (
      <ComponentRenderer
        key={child.id}
        component={child}
        onClick={editable && onClick ? (e) => handleWrapperClick(e, onClick) : undefined}
        editable={editable}
      />
    ));
  };

  const handleClick = editable && onClick ? (e: React.MouseEvent) => handleWrapperClick(e, onClick) : undefined;

  switch (type) {
    case ComponentType.Text: {
      const { className: textClassName, ...restTextProps } = props;
      return (
        <div
          className={wrapperClassName}
          onClick={handleClick}
        >
          <Text
            style={styles}
            className={cn(editable && 'pointer-events-none', textClassName)}
            {...restTextProps}
          >
            {getTextContent(component)}
          </Text>
        </div>
      );
    }

    case ComponentType.Button: {
      const { className: buttonClassName, ...restButtonProps } = props;
      
      const hasOnClickActions = events?.onClickActions 
        && events.onClickActions.enabled 
        && events.onClickActions.actions.length > 0;
      
      const handlePreviewClick = (e: React.MouseEvent) => {
        if (editable) {
          handleWrapperClick(e, onClick);
        } else {
          if (hasOnClickActions) {
            executeEvent(events?.onClickActions);
          } else {
            executeClickEvent(events?.onClick);
          }
        }
      };

      return (
        <div
          className={wrapperClassName}
          onClick={editable ? handleClick : undefined}
        >
          <Button
            style={styles}
            className={cn(editable && 'pointer-events-none', buttonClassName)}
            onClick={!editable ? handlePreviewClick : undefined}
            {...restButtonProps}
          >
            {getButtonContent(component)}
          </Button>
        </div>
      );
    }

    case ComponentType.Image: {
      const { className: imageClassName, ...restImageProps } = props;
      return (
        <div
          className={wrapperClassName}
          onClick={handleClick}
        >
          <Image
            src={
              props.src ||
              'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20minimalist%20placeholder%20image%20with%20soft%20gradient%20background&image_size=square_hd'
            }
            alt={props.alt || '图片'}
            style={styles}
            rounded={props.rounded || 'md'}
            className={cn(editable && 'pointer-events-none', imageClassName)}
            {...restImageProps}
          />
        </div>
      );
    }

    case ComponentType.Container: {
      const { className: containerClassName, ...restContainerProps } = props;
      const isEmptyContainer = !isContainerComponent(component) || 
        !component.children || 
        component.children.length === 0;
      
      const containerChildren = isContainerComponent(component) ? component.children : [];
      const direction = (props.direction as 'row' | 'column') || 'column';
      
      const handleChildClick = (childId: string) => {
        if (editable && onClick) {
          onClick();
        }
      };
      
      return (
        <div
          className={wrapperClassName}
          onClick={handleClick}
        >
          <Container
            direction={direction}
            gap={props.gap || 'md'}
            align={props.align || 'stretch'}
            justify={props.justify || 'start'}
            padding={props.padding || 'none'}
            style={styles}
            className={containerClassName}
            {...restContainerProps}
          >
            <ContainerDropZone
              containerId={component.id}
              isEmpty={isEmptyContainer}
              editable={editable}
              childComponents={containerChildren}
              selectedComponentId={isSelected ? null : undefined}
              onComponentClick={handleChildClick}
              direction={direction}
            />
          </Container>
        </div>
      );
    }

    case ComponentType.Card: {
      const { className: cardClassName, ...restCardProps } = props;
      const isEmptyCard = !isContainerComponent(component) || 
        !component.children || 
        component.children.length === 0;
      
      const cardChildren = isContainerComponent(component) ? component.children : [];
      
      const handleChildClick = (childId: string) => {
        if (editable && onClick) {
          onClick();
        }
      };
      
      const shadow = (props.shadow as CardProps['shadow']) || 'md';
      const padding = (props.padding as CardProps['padding']) || 'md';
      const bordered = props.bordered === true || props.bordered === 'true';
      const hoverable = props.hoverable === true || props.hoverable === 'true';
      
      return (
        <div
          className={wrapperClassName}
          onClick={handleClick}
        >
          <Card
            shadow={shadow}
            padding={padding}
            bordered={bordered}
            headerTitle={props.headerTitle}
            hoverable={hoverable}
            style={styles}
            className={cardClassName}
            {...restCardProps}
          >
            <ContainerDropZone
              containerId={component.id}
              isEmpty={isEmptyCard}
              editable={editable}
              childComponents={cardChildren}
              selectedComponentId={isSelected ? null : undefined}
              onComponentClick={handleChildClick}
              direction="column"
            />
          </Card>
        </div>
      );
    }

    case ComponentType.Divider: {
      const { className: dividerClassName, ...restDividerProps } = props;
      
      const direction = (props.direction as DividerProps['direction']) || 'horizontal';
      const textPosition = (props.textPosition as DividerProps['textPosition']) || 'center';
      const dashed = props.dashed === true || props.dashed === 'true';
      const plain = props.plain === true || props.plain === 'true';
      const children = props.children;
      
      return (
        <div
          className={wrapperClassName}
          onClick={handleClick}
        >
          <Divider
            direction={direction}
            textPosition={textPosition}
            dashed={dashed}
            plain={plain}
            style={styles}
            className={cn(editable && 'pointer-events-none', dividerClassName)}
            {...restDividerProps}
          >
            {children}
          </Divider>
        </div>
      );
    }

    case ComponentType.Tabs: {
      const { className: tabsClassName, ...restTabsProps } = props;
      const isEmptyTabs = !isContainerComponent(component) || 
        !component.children || 
        component.children.length === 0;
      
      const tabsChildren = isContainerComponent(component) ? component.children : [];
      
      const handleChildClick = (childId: string) => {
        if (editable && onClick) {
          onClick();
        }
      };
      
      const tabPosition = (props.tabPosition as 'top' | 'left') || 'top';
      const type = (props.type as 'line' | 'card' | 'button') || 'line';
      const animated = props.animated !== false && props.animated !== 'false';
      const addable = props.addable === true || props.addable === 'true';
      const activeKey = props.activeKey as string | undefined;
      
      const tabPanes = tabsChildren.filter((child) => child.type === ComponentType.TabPane);
      
      const renderTabPanes = () => {
        return tabPanes.map((pane) => {
          const paneKey = (pane.props.tabKey as string) || pane.id;
          const isActive = !activeKey ? pane === tabPanes[0] : paneKey === activeKey;
          
          if (!isActive && editable) {
            return null;
          }
          
          const paneTitle = (pane.props.title as string) || '标签';
          const paneDisabled = pane.props.disabled === true || pane.props.disabled === 'true';
          const paneClosable = pane.props.closable === true || pane.props.closable === 'true';
          
          const paneChildren = isContainerComponent(pane) ? pane.children : [];
          const isEmptyPane = !paneChildren || paneChildren.length === 0;
          
          return (
            <TabPane
              key={pane.id}
              tabKey={paneKey}
              title={paneTitle}
              disabled={paneDisabled}
              closable={paneClosable}
            >
              <ContainerDropZone
                containerId={pane.id}
                isEmpty={isEmptyPane}
                editable={editable}
                childComponents={paneChildren}
                selectedComponentId={isSelected ? null : undefined}
                onComponentClick={handleChildClick}
                direction="column"
              />
            </TabPane>
          );
        });
      };
      
      return (
        <div
          className={wrapperClassName}
          onClick={handleClick}
        >
          <Tabs
            tabPosition={tabPosition}
            type={type}
            animated={animated}
            addable={addable}
            activeKey={activeKey}
            style={styles}
            className={tabsClassName}
            {...restTabsProps}
          >
            {renderTabPanes()}
          </Tabs>
        </div>
      );
    }

    case ComponentType.TabPane: {
      const { className: paneClassName, ...restPaneProps } = props;
      const isEmptyPane = !isContainerComponent(component) || 
        !component.children || 
        component.children.length === 0;
      
      const paneChildren = isContainerComponent(component) ? component.children : [];
      
      const handleChildClick = (childId: string) => {
        if (editable && onClick) {
          onClick();
        }
      };
      
      const tabKey = (props.tabKey as string) || component.id;
      const title = (props.title as string) || '标签';
      const disabled = props.disabled === true || props.disabled === 'true';
      const closable = props.closable === true || props.closable === 'true';
      
      return (
        <div
          className={wrapperClassName}
          onClick={handleClick}
        >
          <TabPane
            tabKey={tabKey}
            title={title}
            disabled={disabled}
            closable={closable}
            style={styles}
            className={paneClassName}
            {...restPaneProps}
          >
            <ContainerDropZone
              containerId={component.id}
              isEmpty={isEmptyPane}
              editable={editable}
              childComponents={paneChildren}
              selectedComponentId={isSelected ? null : undefined}
              onComponentClick={handleChildClick}
              direction="column"
            />
          </TabPane>
        </div>
      );
    }

    case ComponentType.Accordion: {
      const { className: accordionClassName, ...restAccordionProps } = props;
      const isEmptyAccordion = !isContainerComponent(component) || 
        !component.children || 
        component.children.length === 0;
      
      const accordionChildren = isContainerComponent(component) ? component.children : [];
      
      const handleChildClick = (childId: string) => {
        if (editable && onClick) {
          onClick();
        }
      };
      
      const multiple = props.multiple === true || props.multiple === 'true';
      const bordered = props.bordered !== false && props.bordered !== 'false';
      const ghost = props.ghost === true || props.ghost === 'true';
      const activeKey = props.activeKey as string | string[] | undefined;
      
      const accordionItems = accordionChildren.filter((child) => child.type === ComponentType.AccordionItem);
      
      const renderAccordionItems = () => {
        return accordionItems.map((item) => {
          const itemKey = (item.props.itemKey as string) || item.id;
          const itemTitle = (item.props.title as string) || '面板';
          const itemDisabled = item.props.disabled === true || item.props.disabled === 'true';
          const itemDefaultExpanded = item.props.defaultExpanded === true || item.props.defaultExpanded === 'true';
          
          const itemChildren = isContainerComponent(item) ? item.children : [];
          const isEmptyItem = !itemChildren || itemChildren.length === 0;
          
          return (
            <AccordionItem
              key={item.id}
              itemKey={itemKey}
              title={itemTitle}
              disabled={itemDisabled}
              defaultExpanded={itemDefaultExpanded}
            >
              <ContainerDropZone
                containerId={item.id}
                isEmpty={isEmptyItem}
                editable={editable}
                childComponents={itemChildren}
                selectedComponentId={isSelected ? null : undefined}
                onComponentClick={handleChildClick}
                direction="column"
              />
            </AccordionItem>
          );
        });
      };
      
      return (
        <div
          className={wrapperClassName}
          onClick={handleClick}
        >
          <Accordion
            multiple={multiple}
            bordered={bordered}
            ghost={ghost}
            activeKey={activeKey}
            style={styles}
            className={accordionClassName}
            {...restAccordionProps}
          >
            {renderAccordionItems()}
          </Accordion>
        </div>
      );
    }

    case ComponentType.AccordionItem: {
      const { className: itemClassName, ...restItemProps } = props;
      const isEmptyItem = !isContainerComponent(component) || 
        !component.children || 
        component.children.length === 0;
      
      const itemChildren = isContainerComponent(component) ? component.children : [];
      
      const handleChildClick = (childId: string) => {
        if (editable && onClick) {
          onClick();
        }
      };
      
      const itemKey = (props.itemKey as string) || component.id;
      const title = (props.title as string) || '面板';
      const disabled = props.disabled === true || props.disabled === 'true';
      const defaultExpanded = props.defaultExpanded === true || props.defaultExpanded === 'true';
      
      return (
        <div
          className={wrapperClassName}
          onClick={handleClick}
        >
          <AccordionItem
            itemKey={itemKey}
            title={title}
            disabled={disabled}
            defaultExpanded={defaultExpanded}
            style={styles}
            className={itemClassName}
            {...restItemProps}
          >
            <ContainerDropZone
              containerId={component.id}
              isEmpty={isEmptyItem}
              editable={editable}
              childComponents={itemChildren}
              selectedComponentId={isSelected ? null : undefined}
              onComponentClick={handleChildClick}
              direction="column"
            />
          </AccordionItem>
        </div>
      );
    }

    case ComponentType.Modal: {
      const { className: modalClassName, ...restModalProps } = props;
      const isEmptyModal = !isContainerComponent(component) || 
        !component.children || 
        component.children.length === 0;
      
      const modalChildren = isContainerComponent(component) ? component.children : [];
      
      const handleChildClick = (childId: string) => {
        if (editable && onClick) {
          onClick();
        }
      };
      
      const visible = props.visible === true || props.visible === 'true';
      const title = props.title as string | undefined;
      const centered = props.centered !== false && props.centered !== 'false';
      const closable = props.closable !== false && props.closable !== 'false';
      const maskClosable = props.maskClosable !== false && props.maskClosable !== 'false';
      const closeOnEscape = props.closeOnEscape !== false && props.closeOnEscape !== 'false';
      const okText = (props.okText as string) || '确定';
      const cancelText = (props.cancelText as string) || '取消';
      const okVisible = props.okVisible !== false && props.okVisible !== 'false';
      const cancelVisible = props.cancelVisible !== false && props.cancelVisible !== 'false';
      const destroyOnClose = props.destroyOnClose === true || props.destroyOnClose === 'true';
      const zIndex = (props.zIndex as number) || 1000;
      
      let width = props.width;
      if (typeof width === 'string' && !isNaN(Number(width))) {
        width = Number(width);
      }
      let height = props.height;
      if (typeof height === 'string' && !isNaN(Number(height))) {
        height = Number(height);
      }
      
      if (editable) {
        return (
          <div
            className={wrapperClassName}
            onClick={handleClick}
          >
            <div
              className={cn(
                'w-full p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50',
                'hover:border-primary-400 hover:bg-gray-100 transition-colors'
              )}
              style={styles}
            >
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-700">
                  {title || '弹窗（点击编辑）'}
                </span>
                <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">
                  Modal
                </span>
              </div>
              <ContainerDropZone
                containerId={component.id}
                isEmpty={isEmptyModal}
                editable={editable}
                childComponents={modalChildren}
                selectedComponentId={isSelected ? null : undefined}
                onComponentClick={handleChildClick}
                direction="column"
              />
              <div className="mt-3 pt-3 border-t border-gray-200 flex justify-end gap-2">
                <span className="text-xs text-gray-400">
                  {cancelVisible && `取消按钮: ${cancelText}`}
                  {cancelVisible && okVisible && ' | '}
                  {okVisible && `确定按钮: ${okText}`}
                </span>
              </div>
            </div>
          </div>
        );
      }
      
      const handleOk = () => {
        executeEvent(events?.onOkActions);
      };
      
      const handleCancel = () => {
        executeEvent(events?.onCancelActions);
      };
      
      return (
        <>
          <div
            className={cn(wrapperClassName, 'hidden')}
            onClick={handleClick}
          >
            <div
              className="w-full p-4 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50"
              style={styles}
            >
              <span className="text-sm text-gray-400">
                Modal 已挂载（通过事件控制显示）
              </span>
            </div>
          </div>
          <Modal
            visible={visible}
            title={title}
            width={width}
            height={height}
            centered={centered}
            closable={closable}
            maskClosable={maskClosable}
            closeOnEscape={closeOnEscape}
            okText={okText}
            cancelText={cancelText}
            okVisible={okVisible}
            cancelVisible={cancelVisible}
            destroyOnClose={destroyOnClose}
            zIndex={zIndex}
            className={modalClassName}
            onOk={handleOk}
            onCancel={handleCancel}
            {...restModalProps}
          >
            <ContainerDropZone
              containerId={component.id}
              isEmpty={isEmptyModal}
              editable={editable}
              childComponents={modalChildren}
              selectedComponentId={isSelected ? null : undefined}
              onComponentClick={handleChildClick}
              direction="column"
            />
          </Modal>
        </>
      );
    }

    case ComponentType.Input: {
      const { className: inputClassName, ...restInputProps } = props;
      const validateOnChange = props.validateOnChange === true || props.validateOnChange === 'true';
      const validateOnBlur = props.validateOnBlur === true || props.validateOnBlur === 'true';
      
      const bindingValue = getBindingValue();
      const bindingPlaceholder = getBindingProp('placeholder');
      const bindingDisabled = getBindingProp('disabled');

      const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        triggerInputChange(newValue);
        if (restInputProps.onChange) {
          restInputProps.onChange(e);
        }
      };

      const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        triggerValueChange(newValue);
        if (!editable) {
          executeEvent(events?.onChangeActions);
        }
        if (restInputProps.onChange) {
          restInputProps.onChange(e);
        }
      };

      const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        if (!editable) {
          executeEvent(events?.onFocusActions);
        }
        if (restInputProps.onFocus) {
          restInputProps.onFocus(e);
        }
      };

      const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        if (!editable) {
          executeEvent(events?.onBlurActions);
        }
        if (restInputProps.onBlur) {
          restInputProps.onBlur(e);
        }
      };
      
      return (
        <div
          className={wrapperClassName}
          onClick={handleClick}
        >
          <Input
            style={styles}
            className={cn(editable && 'pointer-events-none', inputClassName)}
            type={props.type || 'text'}
            placeholder={bindingPlaceholder || props.placeholder || '请输入内容'}
            disabled={bindingDisabled !== undefined ? bindingDisabled : (props.disabled || editable)}
            readOnly={props.readOnly || editable}
            clearable={props.clearable || false}
            error={props.error || false}
            errorMessage={props.errorMessage}
            validationRules={props.validationRules}
            validateOnChange={validateOnChange}
            validateOnBlur={validateOnBlur}
            value={bindingValue !== undefined ? bindingValue : props.value}
            defaultValue={props.defaultValue}
            maxLength={props.maxLength}
            onChange={handleValueChange}
            onInput={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...restInputProps}
          />
        </div>
      );
    }

    case ComponentType.Textarea: {
      const { className: textareaClassName, ...restTextareaProps } = props;
      const validateOnChange = props.validateOnChange === true || props.validateOnChange === 'true';
      const validateOnBlur = props.validateOnBlur === true || props.validateOnBlur === 'true';
      
      const bindingValue = getBindingValue();
      const bindingPlaceholder = getBindingProp('placeholder');
      const bindingDisabled = getBindingProp('disabled');

      const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        triggerInputChange(newValue);
        if (restTextareaProps.onChange) {
          restTextareaProps.onChange(e);
        }
      };

      const handleValueChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        triggerValueChange(newValue);
        if (!editable) {
          executeEvent(events?.onChangeActions);
        }
        if (restTextareaProps.onChange) {
          restTextareaProps.onChange(e);
        }
      };

      const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
        if (!editable) {
          executeEvent(events?.onFocusActions);
        }
        if (restTextareaProps.onFocus) {
          restTextareaProps.onFocus(e);
        }
      };

      const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
        if (!editable) {
          executeEvent(events?.onBlurActions);
        }
        if (restTextareaProps.onBlur) {
          restTextareaProps.onBlur(e);
        }
      };
      
      return (
        <div
          className={wrapperClassName}
          onClick={handleClick}
        >
          <Textarea
            style={styles}
            className={cn(editable && 'pointer-events-none', textareaClassName)}
            rows={props.rows || 4}
            placeholder={bindingPlaceholder || props.placeholder || '请输入内容'}
            resize={props.resize || 'vertical'}
            disabled={bindingDisabled !== undefined ? bindingDisabled : (props.disabled || editable)}
            readOnly={props.readOnly || editable}
            showCount={props.showCount || false}
            error={props.error || false}
            errorMessage={props.errorMessage}
            maxLength={props.maxLength}
            validationRules={props.validationRules}
            validateOnChange={validateOnChange}
            validateOnBlur={validateOnBlur}
            value={bindingValue !== undefined ? bindingValue : props.value}
            defaultValue={props.defaultValue}
            onChange={handleValueChange}
            onInput={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...restTextareaProps}
          />
        </div>
      );
    }

    case ComponentType.Select: {
      const { className: selectClassName, ...restSelectProps } = props;
      const bindingOptions = getBindingProp('options');
      const options = bindingOptions || props.options || [
        { value: 'option1', label: '选项一' },
        { value: 'option2', label: '选项二' },
        { value: 'option3', label: '选项三' },
      ];
      const validateOnChange = props.validateOnChange === true || props.validateOnChange === 'true';
      const validateOnBlur = props.validateOnBlur === true || props.validateOnBlur === 'true';
      
      const bindingValue = getBindingValue();
      const bindingPlaceholder = getBindingProp('placeholder');
      const bindingDisabled = getBindingProp('disabled');

      const handleValueChange = (value: any) => {
        triggerValueChange(value);
        if (!editable) {
          executeEvent(events?.onChangeActions);
        }
        if (restSelectProps.onChange) {
          restSelectProps.onChange(value);
        }
      };

      const handleFocus = (e: React.FocusEvent<HTMLSelectElement>) => {
        if (!editable) {
          executeEvent(events?.onFocusActions);
        }
        if (restSelectProps.onFocus) {
          restSelectProps.onFocus(e);
        }
      };

      const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
        if (!editable) {
          executeEvent(events?.onBlurActions);
        }
        if (restSelectProps.onBlur) {
          restSelectProps.onBlur(e);
        }
      };
      
      return (
        <div
          className={wrapperClassName}
          onClick={handleClick}
        >
          <Select
            style={styles}
            className={cn(editable && 'pointer-events-none', selectClassName)}
            options={options}
            placeholder={bindingPlaceholder || props.placeholder || '请选择'}
            disabled={bindingDisabled !== undefined ? bindingDisabled : (props.disabled || editable)}
            clearable={props.clearable || false}
            searchable={props.searchable || false}
            multiple={props.multiple || false}
            error={props.error || false}
            errorMessage={props.errorMessage}
            validationRules={props.validationRules}
            validateOnChange={validateOnChange}
            validateOnBlur={validateOnBlur}
            value={bindingValue !== undefined ? bindingValue : props.value}
            defaultValue={props.defaultValue}
            onChange={handleValueChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...restSelectProps}
          />
        </div>
      );
    }

    case ComponentType.Checkbox: {
      const { className: checkboxClassName, ...restCheckboxProps } = props;
      const bindingValue = getBindingValue();
      const bindingDisabled = getBindingProp('disabled');
      
      const isChecked = bindingValue !== undefined ? bindingValue : (props.checked === true || props.checked === 'true');
      const isIndeterminate = props.indeterminate === true || props.indeterminate === 'true';
      const isDisabled = bindingDisabled !== undefined ? bindingDisabled : (props.disabled === true || props.disabled === 'true');

      const handleChange = (checked: boolean) => {
        triggerValueChange(checked);
        if (!editable) {
          executeEvent(events?.onChangeActions);
        }
        if (restCheckboxProps.onChange) {
          restCheckboxProps.onChange(checked);
        }
      };

      return (
        <div
          className={wrapperClassName}
          onClick={handleClick}
        >
          <Checkbox
            style={styles}
            className={cn(checkboxClassName)}
            checked={isChecked}
            indeterminate={isIndeterminate}
            disabled={isDisabled || editable}
            label={props.label}
            onChange={handleChange}
            {...restCheckboxProps}
          />
        </div>
      );
    }

    case ComponentType.CheckboxGroup: {
      const { className: checkboxGroupClassName, ...restCheckboxGroupProps } = props;
      const bindingValue = getBindingValue();
      const bindingOptions = getBindingProp('options');
      const bindingDisabled = getBindingProp('disabled');
      
      const options = bindingOptions || props.options || [
        { value: 'option1', label: '选项一' },
        { value: 'option2', label: '选项二' },
        { value: 'option3', label: '选项三' },
      ];
      const isDisabled = bindingDisabled !== undefined ? bindingDisabled : (props.disabled === true || props.disabled === 'true');

      const handleChange = (value: any[]) => {
        triggerValueChange(value);
        if (!editable) {
          executeEvent(events?.onChangeActions);
        }
        if (restCheckboxGroupProps.onChange) {
          restCheckboxGroupProps.onChange(value);
        }
      };

      return (
        <div
          className={wrapperClassName}
          onClick={handleClick}
        >
          <CheckboxGroup
            style={styles}
            className={cn(checkboxGroupClassName)}
            options={options}
            value={bindingValue !== undefined ? bindingValue : (props.value || [])}
            disabled={isDisabled || editable}
            direction={props.direction || 'column'}
            gap={props.gap || 'md'}
            onChange={handleChange}
            {...restCheckboxGroupProps}
          />
        </div>
      );
    }

    case ComponentType.Radio: {
      const { className: radioClassName, ...restRadioProps } = props;
      const bindingValue = getBindingValue();
      const bindingDisabled = getBindingProp('disabled');
      
      const isChecked = bindingValue !== undefined ? bindingValue : (props.checked === true || props.checked === 'true');
      const isDisabled = bindingDisabled !== undefined ? bindingDisabled : (props.disabled === true || props.disabled === 'true');

      const handleChange = (checked: boolean) => {
        triggerValueChange(checked);
        if (!editable) {
          executeEvent(events?.onChangeActions);
        }
        if (restRadioProps.onChange) {
          restRadioProps.onChange(checked);
        }
      };

      return (
        <div
          className={wrapperClassName}
          onClick={handleClick}
        >
          <Radio
            style={styles}
            className={cn(radioClassName)}
            checked={isChecked}
            disabled={isDisabled || editable}
            label={props.label}
            value={props.value}
            onChange={handleChange}
            {...restRadioProps}
          />
        </div>
      );
    }

    case ComponentType.RadioGroup: {
      const { className: radioGroupClassName, ...restRadioGroupProps } = props;
      const bindingValue = getBindingValue();
      const bindingOptions = getBindingProp('options');
      const bindingDisabled = getBindingProp('disabled');
      
      const options = bindingOptions || props.options || [
        { value: 'option1', label: '选项一' },
        { value: 'option2', label: '选项二' },
        { value: 'option3', label: '选项三' },
      ];
      const isDisabled = bindingDisabled !== undefined ? bindingDisabled : (props.disabled === true || props.disabled === 'true');

      const handleChange = (value: any) => {
        triggerValueChange(value);
        if (!editable) {
          executeEvent(events?.onChangeActions);
        }
        if (restRadioGroupProps.onChange) {
          restRadioGroupProps.onChange(value);
        }
      };

      return (
        <div
          className={wrapperClassName}
          onClick={handleClick}
        >
          <RadioGroup
            style={styles}
            className={cn(radioGroupClassName)}
            options={options}
            value={bindingValue !== undefined ? bindingValue : props.value}
            disabled={isDisabled || editable}
            direction={props.direction || 'column'}
            gap={props.gap || 'md'}
            onChange={handleChange}
            {...restRadioGroupProps}
          />
        </div>
      );
    }

    case ComponentType.Switch: {
      const { className: switchClassName, ...restSwitchProps } = props;
      const bindingValue = getBindingValue();
      const bindingDisabled = getBindingProp('disabled');
      
      const isChecked = bindingValue !== undefined ? bindingValue : (props.checked === true || props.checked === 'true');
      const isDisabled = bindingDisabled !== undefined ? bindingDisabled : (props.disabled === true || props.disabled === 'true');
      const isLoading = props.loading === true || props.loading === 'true';

      const handleChange = (checked: boolean) => {
        triggerValueChange(checked);
        if (!editable) {
          executeEvent(events?.onChangeActions);
        }
        if (restSwitchProps.onChange) {
          restSwitchProps.onChange(checked);
        }
      };

      return (
        <div
          className={wrapperClassName}
          onClick={handleClick}
        >
          <Switch
            style={styles}
            className={cn(switchClassName)}
            checked={isChecked}
            defaultChecked={props.defaultChecked || false}
            disabled={isDisabled || editable}
            loading={isLoading}
            size={props.size || 'md'}
            activeColor={props.activeColor}
            inactiveColor={props.inactiveColor}
            checkedText={props.checkedText}
            uncheckedText={props.uncheckedText}
            onChange={handleChange}
            {...restSwitchProps}
          />
        </div>
      );
    }

    case ComponentType.Form: {
      const { className: formClassName, ...restFormProps } = props;
      const isEmptyContainer = !isContainerComponent(component) || 
        !component.children || 
        component.children.length === 0;
      
      const containerChildren = isContainerComponent(component) ? component.children : [];
      
      const handleChildClick = (childId: string) => {
        if (editable && onClick) {
          onClick();
        }
      };
      
      const handleFormSubmit = (values: any, isValid: boolean) => {
        if (!editable) {
          executeEvent(events?.onSubmitActions);
        }
        if (restFormProps.onSubmit) {
          restFormProps.onSubmit(values, isValid);
        }
      };
      
      const layout = (props.layout as 'horizontal' | 'vertical' | 'inline') || 'vertical';
      const direction = layout === 'horizontal' ? 'row' : 'column';
      
      return (
        <div
          className={wrapperClassName}
          onClick={handleClick}
        >
          <Form
            layout={layout}
            labelWidth={props.labelWidth || 100}
            labelAlign={props.labelAlign || 'right'}
            size={props.size || 'md'}
            disabled={props.disabled || editable}
            style={styles}
            className={formClassName}
            onSubmit={handleFormSubmit}
            {...restFormProps}
          >
            <ContainerDropZone
              containerId={component.id}
              isEmpty={isEmptyContainer}
              editable={editable}
              childComponents={containerChildren}
              selectedComponentId={isSelected ? null : undefined}
              onComponentClick={handleChildClick}
              direction={direction}
            />
          </Form>
        </div>
      );
    }

    case ComponentType.FormItem: {
      const { className: formItemClassName, ...restFormItemProps } = props;
      const isEmptyContainer = !isContainerComponent(component) || 
        !component.children || 
        component.children.length === 0;
      
      const containerChildren = isContainerComponent(component) ? component.children : [];
      
      const handleChildClick = (childId: string) => {
        if (editable && onClick) {
          onClick();
        }
      };
      
      const isRequired = props.required === true || props.required === 'true';
      const isError = props.error === true || props.error === 'true';
      
      return (
        <div
          className={wrapperClassName}
          onClick={handleClick}
        >
          <FormItem
            label={props.label}
            required={isRequired}
            error={isError}
            errorMessage={props.errorMessage}
            help={props.help}
            name={props.name}
            labelWidth={props.labelWidth}
            labelAlign={props.labelAlign}
            style={styles}
            className={cn(editable && 'pointer-events-none', formItemClassName)}
            {...restFormItemProps}
          >
            <ContainerDropZone
              containerId={component.id}
              isEmpty={isEmptyContainer}
              editable={editable}
              childComponents={containerChildren}
              selectedComponentId={isSelected ? null : undefined}
              onComponentClick={handleChildClick}
              direction="column"
            />
          </FormItem>
        </div>
      );
    }

    default:
      return null;
  }
};

const PreviewRenderer: React.FC<Omit<ComponentRendererProps, 'isSelected' | 'onClick' | 'editable'>> = ({
  component,
}) => {
  return (
    <ComponentRenderer
      component={component}
      isSelected={false}
      onClick={undefined}
      editable={false}
    />
  );
};

export { ComponentRenderer, PreviewRenderer, isContainerComponent, handleWrapperClick };
export type { ComponentRendererProps };
