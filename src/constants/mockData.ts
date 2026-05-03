import { ComponentType, type ComponentSchema, type ComponentConfig, type ComponentPanelItem } from '@/types/component';

export const DEFAULT_COMPONENT_CONFIGS: Record<ComponentType, ComponentConfig> = {
  [ComponentType.Text]: {
    type: ComponentType.Text,
    label: '文本',
    defaultWidth: 200,
    defaultHeight: 'auto',
    defaultProps: {
      children: '文本内容',
      variant: 'body',
      weight: 'normal',
      color: 'default',
    },
    defaultStyles: {},
  },
  [ComponentType.Button]: {
    type: ComponentType.Button,
    label: '按钮',
    defaultWidth: 120,
    defaultHeight: 44,
    defaultProps: {
      children: '按钮',
      variant: 'primary',
      size: 'md',
    },
    defaultStyles: {},
  },
  [ComponentType.Image]: {
    type: ComponentType.Image,
    label: '图片',
    defaultWidth: 300,
    defaultHeight: 200,
    defaultProps: {
      src: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20minimalist%20placeholder%20image%20with%20soft%20gradient%20background&image_size=square_hd',
      alt: '图片',
      rounded: 'md',
    },
    defaultStyles: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
  },
  [ComponentType.Container]: {
    type: ComponentType.Container,
    label: '容器',
    defaultWidth: 400,
    defaultHeight: 200,
    defaultProps: {
      direction: 'row',
      gap: 'md',
      align: 'center',
      justify: 'start',
      wrap: 'false',
      padding: 'md',
    },
    defaultStyles: {
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
    },
  },
  [ComponentType.Input]: {
    type: ComponentType.Input,
    label: '输入框',
    defaultWidth: 300,
    defaultHeight: 44,
    defaultProps: {
      type: 'text',
      placeholder: '请输入内容',
      disabled: false,
      readOnly: false,
      clearable: false,
      error: false,
    },
    defaultStyles: {},
  },
  [ComponentType.Textarea]: {
    type: ComponentType.Textarea,
    label: '多行文本',
    defaultWidth: 350,
    defaultHeight: 'auto',
    defaultProps: {
      rows: 4,
      placeholder: '请输入内容',
      resize: 'vertical',
      disabled: false,
      readOnly: false,
      showCount: false,
      error: false,
    },
    defaultStyles: {},
  },
  [ComponentType.Select]: {
    type: ComponentType.Select,
    label: '下拉选择',
    defaultWidth: 300,
    defaultHeight: 44,
    defaultProps: {
      placeholder: '请选择',
      disabled: false,
      clearable: false,
      searchable: false,
      multiple: false,
      options: [
        { value: 'option1', label: '选项一' },
        { value: 'option2', label: '选项二' },
        { value: 'option3', label: '选项三' },
      ],
    },
    defaultStyles: {},
  },
};

export const COMPONENT_PANEL_ITEMS: ComponentPanelItem[] = [
  {
    type: ComponentType.Text,
    label: '文本',
    category: 'basic',
  },
  {
    type: ComponentType.Button,
    label: '按钮',
    category: 'basic',
  },
  {
    type: ComponentType.Image,
    label: '图片',
    category: 'basic',
  },
  {
    type: ComponentType.Container,
    label: '容器',
    category: 'layout',
  },
  {
    type: ComponentType.Input,
    label: '输入框',
    category: 'form',
  },
  {
    type: ComponentType.Textarea,
    label: '多行文本',
    category: 'form',
  },
  {
    type: ComponentType.Select,
    label: '下拉选择',
    category: 'form',
  },
];

export const MOCK_CANVAS_DATA: ComponentSchema[] = [
  {
    id: 'container-1',
    type: ComponentType.Container,
    x: 32,
    y: 32,
    width: 600,
    height: 'auto',
    props: {
      direction: 'column',
      gap: 'lg',
      align: 'center',
      justify: 'center',
      padding: 'lg',
    },
    styles: {
      minHeight: '400px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '16px',
    },
    children: [
      {
        id: 'text-1',
        type: ComponentType.Text,
        x: 0,
        y: 0,
        width: 'auto',
        height: 'auto',
        props: {
          children: '欢迎使用页面构建器',
          variant: 'h1',
          weight: 'bold',
          color: 'default',
        },
        styles: {
          color: '#ffffff',
          textAlign: 'center',
          marginBottom: '16px',
        },
      },
      {
        id: 'text-2',
        type: ComponentType.Text,
        x: 0,
        y: 0,
        width: 500,
        height: 'auto',
        props: {
          children: '拖拽左侧组件到画布开始创建您的页面',
          variant: 'body',
          weight: 'normal',
          color: 'muted',
        },
        styles: {
          color: 'rgba(255, 255, 255, 0.8)',
          textAlign: 'center',
          maxWidth: '500px',
        },
      },
      {
        id: 'image-1',
        type: ComponentType.Image,
        x: 0,
        y: 0,
        width: 600,
        height: 340,
        props: {
          src: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20website%20builder%20interface%20with%20drag%20and%20drop%20components%20clean%20minimalist%20design&image_size=landscape_16_9',
          alt: '构建器示例',
          rounded: 'lg',
        },
        styles: {
          width: '100%',
          maxWidth: '600px',
          marginTop: '32px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          objectFit: 'cover',
        },
      },
      {
        id: 'container-2',
        type: ComponentType.Container,
        x: 0,
        y: 0,
        width: 'auto',
        height: 'auto',
        props: {
          direction: 'row',
          gap: 'lg',
          align: 'center',
          justify: 'center',
          padding: 'none',
        },
        styles: {
          marginTop: '32px',
        },
        children: [
          {
            id: 'button-1',
            type: ComponentType.Button,
            x: 0,
            y: 0,
            width: 140,
            height: 48,
            props: {
              children: '开始创建',
              variant: 'primary',
              size: 'lg',
            },
            styles: {
              backgroundColor: '#ffffff',
              color: '#667eea',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            },
          },
          {
            id: 'button-2',
            type: ComponentType.Button,
            x: 0,
            y: 0,
            width: 140,
            height: 48,
            props: {
              children: '查看示例',
              variant: 'outline',
              size: 'lg',
            },
            styles: {
              borderColor: '#ffffff',
              color: '#ffffff',
            },
          },
        ],
      },
    ],
  },
];

export const MOCK_EMPTY_CANVAS: ComponentSchema[] = [];
