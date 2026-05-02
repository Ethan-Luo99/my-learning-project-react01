import { Text, Button, Image, Container } from '@/components/ui';
import { ComponentType, type ComponentSchema, type ContainerComponentSchema } from '@/types/component';
import { cn } from '@/utils/classname';

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
      return (
        <div
          className={wrapperClassName}
          onClick={handleClick}
        >
          <Button
            style={styles}
            className={cn(editable && 'pointer-events-none', buttonClassName)}
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
            {renderContainerChildren()}
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
