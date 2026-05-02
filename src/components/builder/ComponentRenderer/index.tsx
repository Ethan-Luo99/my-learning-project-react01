import { Text, Button, Image, Container } from '@/components/ui';
import { 
  ComponentType, 
  type ComponentSchema, 
  type ContainerComponentSchema, 
  type ClickEventConfig,
  ClickEventType
} from '@/types/component';
import { cn } from '@/utils/classname';
import { useDroppable } from '@dnd-kit/core';
import { createContainerDropZoneId } from '@/constants/dnd';
import { logger } from '@/utils/logger';

interface ComponentRendererProps {
  component: ComponentSchema;
  isSelected?: boolean;
  onClick?: ((e: React.MouseEvent) => void) | (() => void);
  editable?: boolean;
}

const isContainerComponent = (
  component: ComponentSchema
): component is ContainerComponentSchema => {
  return component.type === ComponentType.Container;
};

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

const executeClickEvent = (eventConfig?: ClickEventConfig): void => {
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
  }
};

interface ContainerDropZoneProps {
  containerId: string;
  children?: React.ReactNode;
  isEmpty: boolean;
  editable: boolean;
}

const ContainerDropZone: React.FC<ContainerDropZoneProps> = ({
  containerId,
  children,
  isEmpty,
  editable,
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
  });

  if (!editable) {
    return <>{children}</>;
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
        children
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
  const { type, props, styles } = component;

  const wrapperClassName = cn(
    'relative',
    editable && isSelected && 'ring-2 ring-primary-500 ring-offset-2 rounded-lg'
  );

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
      
      const handlePreviewClick = (e: React.MouseEvent) => {
        if (editable) {
          handleWrapperClick(e, onClick);
        } else {
          executeClickEvent(component.events?.onClick);
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
      
      return (
        <div
          className={wrapperClassName}
          onClick={handleClick}
        >
          <Container
            direction={props.direction || 'column'}
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
            >
              {containerChildren && containerChildren.length > 0
                ? containerChildren.map((child) => (
                    <ComponentRenderer
                      key={child.id}
                      component={child}
                      onClick={editable && onClick ? (e) => handleWrapperClick(e, onClick) : undefined}
                      editable={editable}
                    />
                  ))
                : null}
            </ContainerDropZone>
          </Container>
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
