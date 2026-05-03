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

import { Text, Button, Image, Container, Input, Textarea, Select, Checkbox, CheckboxGroup, Radio, RadioGroup, Switch, Form, FormItem } from '@/components/ui';
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
import { cn } from '@/utils/classname';
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

const isContainerComponent = (
  component: ComponentSchema
): component is ContainerComponentSchema => {
  return (
    component.type === ComponentType.Container ||
    component.type === ComponentType.Form ||
    component.type === ComponentType.FormItem
  );
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

  const executeAction = React.useCallback((action: ActionConfig): void => {
    if (!action.enabled) {
      return;
    }

    switch (action.type) {
      case ActionType.ShowAlert:
        if (action.params.alertMessage) {
          alert(action.params.alertMessage);
        } else {
          alert('事件触发了');
        }
        break;

      case ActionType.NavigateUrl:
        if (action.params.targetUrl) {
          window.open(action.params.targetUrl, '_blank');
        }
        break;

      case ActionType.NavigatePage:
        if (action.params.pageId) {
          console.log('页面跳转:', action.params.pageId);
          alert(`页面跳转功能（预留）: ${action.params.pageId}`);
        }
        break;

      case ActionType.ConsoleLog:
        if (action.params.logMessage) {
          console.log(action.params.logMessage);
        } else {
          console.log('事件触发了');
        }
        break;

      case ActionType.CustomScript:
        if (action.params.customScript) {
          try {
            eval(action.params.customScript);
          } catch (error) {
            console.error('自定义脚本执行错误:', error);
            alert(`脚本执行错误: ${error}`);
          }
        }
        break;

      case ActionType.FormSubmit:
        submitForm(action.params.formId);
        break;

      case ActionType.FormReset:
        resetForm(action.params.formId);
        break;
    }
  }, [submitForm, resetForm]);

  const executeActions = React.useCallback((actions: ActionConfig[]): void => {
    for (const action of actions) {
      executeAction(action);
    }
  }, [executeAction]);

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
      
      const handlePreviewClick = (e: React.MouseEvent) => {
        if (editable) {
          handleWrapperClick(e, onClick);
        } else {
          executeClickEvent(events?.onClick);
          executeEvent(events?.onClickActions);
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
