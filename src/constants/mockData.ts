import { ComponentType, type ComponentSchema, type ComponentConfig, type ComponentPanelItem } from '@/types/component';

export const DEFAULT_COMPONENT_CONFIGS: Record<ComponentType, ComponentConfig> = {
  [ComponentType.Text]: {
    type: ComponentType.Text,
    label: '文本',
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
    defaultProps: {
      src: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20minimalist%20placeholder%20image%20with%20soft%20gradient%20background&image_size=square_hd',
      alt: '图片',
      rounded: 'md',
    },
    defaultStyles: {
      width: '100%',
      maxWidth: '400px',
    },
  },
  [ComponentType.Container]: {
    type: ComponentType.Container,
    label: '容器',
    defaultProps: {
      direction: 'column',
      gap: 'md',
      align: 'stretch',
      justify: 'start',
      padding: 'md',
    },
    defaultStyles: {
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
    },
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
];

export const MOCK_CANVAS_DATA: ComponentSchema[] = [
  {
    id: 'container-1',
    type: ComponentType.Container,
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
        },
      },
      {
        id: 'container-2',
        type: ComponentType.Container,
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
