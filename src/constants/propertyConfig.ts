import { ComponentType } from '@/types/component';

export interface PropertyConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea';
  options?: { value: string; label: string }[];
  placeholder?: string;
  category: 'basic' | 'props' | 'styles';
}

export interface ComponentPropertyConfig {
  type: ComponentType;
  label: string;
  properties: PropertyConfig[];
}

const createCommonBasicProperties = (): PropertyConfig[] => [
  {
    key: 'x',
    label: 'X 坐标',
    type: 'number',
    placeholder: '0',
    category: 'basic',
  },
  {
    key: 'y',
    label: 'Y 坐标',
    type: 'number',
    placeholder: '0',
    category: 'basic',
  },
  {
    key: 'width',
    label: '宽度',
    type: 'text',
    placeholder: 'auto',
    category: 'basic',
  },
  {
    key: 'height',
    label: '高度',
    type: 'text',
    placeholder: 'auto',
    category: 'basic',
  },
];

const createCommonStyleProperties = (): PropertyConfig[] => [
  {
    key: 'backgroundColor',
    label: '背景颜色',
    type: 'text',
    placeholder: '#ffffff',
    category: 'styles',
  },
  {
    key: 'color',
    label: '文字颜色',
    type: 'text',
    placeholder: '#000000',
    category: 'styles',
  },
  {
    key: 'marginTop',
    label: '上边距',
    type: 'text',
    placeholder: '0px',
    category: 'styles',
  },
  {
    key: 'marginBottom',
    label: '下边距',
    type: 'text',
    placeholder: '0px',
    category: 'styles',
  },
  {
    key: 'marginLeft',
    label: '左边距',
    type: 'text',
    placeholder: '0px',
    category: 'styles',
  },
  {
    key: 'marginRight',
    label: '右边距',
    type: 'text',
    placeholder: '0px',
    category: 'styles',
  },
  {
    key: 'paddingTop',
    label: '上内边距',
    type: 'text',
    placeholder: '0px',
    category: 'styles',
  },
  {
    key: 'paddingBottom',
    label: '下内边距',
    type: 'text',
    placeholder: '0px',
    category: 'styles',
  },
  {
    key: 'paddingLeft',
    label: '左内边距',
    type: 'text',
    placeholder: '0px',
    category: 'styles',
  },
  {
    key: 'paddingRight',
    label: '右内边距',
    type: 'text',
    placeholder: '0px',
    category: 'styles',
  },
  {
    key: 'border',
    label: '边框',
    type: 'text',
    placeholder: 'none',
    category: 'styles',
  },
  {
    key: 'borderRadius',
    label: '圆角',
    type: 'text',
    placeholder: '0px',
    category: 'styles',
  },
  {
    key: 'boxShadow',
    label: '阴影',
    type: 'text',
    placeholder: 'none',
    category: 'styles',
  },
  {
    key: 'opacity',
    label: '透明度',
    type: 'number',
    placeholder: '1',
    category: 'styles',
  },
];

export const COMPONENT_PROPERTY_CONFIGS: Record<ComponentType, ComponentPropertyConfig> = {
  [ComponentType.Text]: {
    type: ComponentType.Text,
    label: '文本',
    properties: [
      ...createCommonBasicProperties(),
      {
        key: 'children',
        label: '文本内容',
        type: 'textarea',
        placeholder: '请输入文本内容',
        category: 'props',
      },
      {
        key: 'variant',
        label: '文本样式',
        type: 'select',
        options: [
          { value: 'h1', label: '标题 1' },
          { value: 'h2', label: '标题 2' },
          { value: 'h3', label: '标题 3' },
          { value: 'h4', label: '标题 4' },
          { value: 'body', label: '正文' },
          { value: 'caption', label: '说明文字' },
        ],
        category: 'props',
      },
      {
        key: 'weight',
        label: '字重',
        type: 'select',
        options: [
          { value: 'light', label: '细' },
          { value: 'normal', label: '正常' },
          { value: 'medium', label: '中等' },
          { value: 'semibold', label: '半粗' },
          { value: 'bold', label: '粗' },
        ],
        category: 'props',
      },
      {
        key: 'color',
        label: '颜色',
        type: 'select',
        options: [
          { value: 'default', label: '默认' },
          { value: 'primary', label: '主色' },
          { value: 'secondary', label: '次要' },
          { value: 'success', label: '成功' },
          { value: 'danger', label: '危险' },
          { value: 'muted', label: '弱色' },
        ],
        category: 'props',
      },
      ...createCommonStyleProperties(),
    ],
  },

  [ComponentType.Button]: {
    type: ComponentType.Button,
    label: '按钮',
    properties: [
      ...createCommonBasicProperties(),
      {
        key: 'children',
        label: '按钮文本',
        type: 'text',
        placeholder: '请输入按钮文本',
        category: 'props',
      },
      {
        key: 'variant',
        label: '样式',
        type: 'select',
        options: [
          { value: 'primary', label: '主按钮' },
          { value: 'secondary', label: '次要按钮' },
          { value: 'outline', label: '边框按钮' },
          { value: 'ghost', label: '幽灵按钮' },
        ],
        category: 'props',
      },
      {
        key: 'size',
        label: '尺寸',
        type: 'select',
        options: [
          { value: 'sm', label: '小' },
          { value: 'md', label: '中' },
          { value: 'lg', label: '大' },
        ],
        category: 'props',
      },
      ...createCommonStyleProperties(),
    ],
  },

  [ComponentType.Image]: {
    type: ComponentType.Image,
    label: '图片',
    properties: [
      ...createCommonBasicProperties(),
      {
        key: 'src',
        label: '图片地址',
        type: 'text',
        placeholder: 'https://...',
        category: 'props',
      },
      {
        key: 'alt',
        label: '替代文本',
        type: 'text',
        placeholder: '图片描述',
        category: 'props',
      },
      {
        key: 'rounded',
        label: '圆角',
        type: 'select',
        options: [
          { value: 'none', label: '无' },
          { value: 'sm', label: '小' },
          { value: 'md', label: '中' },
          { value: 'lg', label: '大' },
          { value: 'full', label: '圆形' },
        ],
        category: 'props',
      },
      ...createCommonStyleProperties(),
    ],
  },

  [ComponentType.Container]: {
    type: ComponentType.Container,
    label: '容器',
    properties: [
      ...createCommonBasicProperties(),
      {
        key: 'direction',
        label: '排列方向',
        type: 'select',
        options: [
          { value: 'row', label: '横向' },
          { value: 'column', label: '纵向' },
          { value: 'row-reverse', label: '横向反向' },
          { value: 'column-reverse', label: '纵向反向' },
        ],
        category: 'props',
      },
      {
        key: 'gap',
        label: '间距',
        type: 'select',
        options: [
          { value: 'none', label: '无' },
          { value: 'xs', label: '极小' },
          { value: 'sm', label: '小' },
          { value: 'md', label: '中' },
          { value: 'lg', label: '大' },
          { value: 'xl', label: '极大' },
        ],
        category: 'props',
      },
      {
        key: 'align',
        label: '垂直对齐',
        type: 'select',
        options: [
          { value: 'start', label: '顶部' },
          { value: 'center', label: '居中' },
          { value: 'end', label: '底部' },
          { value: 'stretch', label: '拉伸' },
        ],
        category: 'props',
      },
      {
        key: 'justify',
        label: '水平对齐',
        type: 'select',
        options: [
          { value: 'start', label: '起点' },
          { value: 'center', label: '居中' },
          { value: 'end', label: '终点' },
          { value: 'between', label: '两端' },
          { value: 'around', label: '周围' },
          { value: 'evenly', label: '均匀' },
        ],
        category: 'props',
      },
      {
        key: 'wrap',
        label: '换行',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
      },
      {
        key: 'padding',
        label: '内边距',
        type: 'select',
        options: [
          { value: 'none', label: '无' },
          { value: 'sm', label: '小' },
          { value: 'md', label: '中' },
          { value: 'lg', label: '大' },
        ],
        category: 'props',
      },
      ...createCommonStyleProperties(),
    ],
  },
};

export const getComponentPropertyConfig = (type: ComponentType): ComponentPropertyConfig => {
  return COMPONENT_PROPERTY_CONFIGS[type];
};
