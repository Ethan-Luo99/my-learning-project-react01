import { ComponentType } from '@/types/component';
import type { ValidationRule, ValidationRuleType } from '@/utils/formValidation';

export type ValidationRuleConfig = ValidationRule;

export const VALIDATION_RULE_TYPES: { value: ValidationRuleType; label: string }[] = [
  { value: 'required', label: '必填' },
  { value: 'minLength', label: '最小长度' },
  { value: 'maxLength', label: '最大长度' },
  { value: 'min', label: '最小值' },
  { value: 'max', label: '最大值' },
  { value: 'pattern', label: '正则匹配' },
  { value: 'email', label: '邮箱格式' },
  { value: 'url', label: 'URL格式' },
];

export const SPACING_PROPERTY_KEYS = [
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'paddingTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
] as const;

export interface PropertyConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'color' | 'options';
  options?: { value: string; label: string }[];
  placeholder?: string;
  category: 'basic' | 'props' | 'styles';
  defaultValue?: string | number | any[] | undefined;
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
    defaultValue: 0,
  },
  {
    key: 'y',
    label: 'Y 坐标',
    type: 'number',
    placeholder: '0',
    category: 'basic',
    defaultValue: 0,
  },
  {
    key: 'width',
    label: '宽度',
    type: 'text',
    placeholder: 'auto',
    category: 'basic',
    defaultValue: 'auto',
  },
  {
    key: 'height',
    label: '高度',
    type: 'text',
    placeholder: 'auto',
    category: 'basic',
    defaultValue: 'auto',
  },
];

const createCommonStyleProperties = (): PropertyConfig[] => [
  {
    key: 'backgroundColor',
    label: '背景颜色',
    type: 'color',
    placeholder: '#ffffff',
    category: 'styles',
  },
  {
    key: 'color',
    label: '文字颜色',
    type: 'color',
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
        defaultValue: 'body',
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
        defaultValue: 'normal',
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
        defaultValue: 'default',
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
        defaultValue: 'primary',
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
        defaultValue: 'md',
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
        defaultValue: 'none',
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
        defaultValue: 'row',
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
        defaultValue: 'md',
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
        defaultValue: 'center',
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
        defaultValue: 'start',
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
        defaultValue: 'false',
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
        defaultValue: 'md',
      },
      ...createCommonStyleProperties(),
    ],
  },

  [ComponentType.Card]: {
    type: ComponentType.Card,
    label: '卡片',
    properties: [
      ...createCommonBasicProperties(),
      {
        key: 'shadow',
        label: '阴影',
        type: 'select',
        options: [
          { value: 'none', label: '无' },
          { value: 'sm', label: '小' },
          { value: 'md', label: '中' },
          { value: 'lg', label: '大' },
        ],
        category: 'props',
        defaultValue: 'md',
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
        defaultValue: 'md',
      },
      {
        key: 'bordered',
        label: '显示边框',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'true',
      },
      {
        key: 'headerTitle',
        label: '标题文本',
        type: 'text',
        placeholder: '请输入标题',
        category: 'props',
      },
      {
        key: 'hoverable',
        label: '悬停效果',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'false',
      },
      ...createCommonStyleProperties(),
    ],
  },

  [ComponentType.Divider]: {
    type: ComponentType.Divider,
    label: '分割线',
    properties: [
      ...createCommonBasicProperties(),
      {
        key: 'direction',
        label: '方向',
        type: 'select',
        options: [
          { value: 'horizontal', label: '水平' },
          { value: 'vertical', label: '垂直' },
        ],
        category: 'props',
        defaultValue: 'horizontal',
      },
      {
        key: 'textPosition',
        label: '文字位置',
        type: 'select',
        options: [
          { value: 'left', label: '左' },
          { value: 'center', label: '中' },
          { value: 'right', label: '右' },
        ],
        category: 'props',
        defaultValue: 'center',
      },
      {
        key: 'dashed',
        label: '虚线样式',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'false',
      },
      {
        key: 'plain',
        label: '朴素样式',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'false',
      },
      {
        key: 'children',
        label: '分割线文字',
        type: 'text',
        placeholder: '分割线文字（可选）',
        category: 'props',
      },
      ...createCommonStyleProperties(),
    ],
  },

  [ComponentType.Tabs]: {
    type: ComponentType.Tabs,
    label: '标签页',
    properties: [
      ...createCommonBasicProperties(),
      {
        key: 'tabPosition',
        label: '标签位置',
        type: 'select',
        options: [
          { value: 'top', label: '顶部' },
          { value: 'left', label: '左侧' },
        ],
        category: 'props',
        defaultValue: 'top',
      },
      {
        key: 'type',
        label: '标签类型',
        type: 'select',
        options: [
          { value: 'line', label: '线条' },
          { value: 'card', label: '卡片' },
          { value: 'button', label: '按钮' },
        ],
        category: 'props',
        defaultValue: 'line',
      },
      {
        key: 'animated',
        label: '切换动画',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'true',
      },
      {
        key: 'addable',
        label: '可新增标签',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'false',
      },
      {
        key: 'activeKey',
        label: '当前激活标签',
        type: 'text',
        placeholder: '标签 Key',
        category: 'props',
      },
      ...createCommonStyleProperties(),
    ],
  },

  [ComponentType.TabPane]: {
    type: ComponentType.TabPane,
    label: '标签面板',
    properties: [
      ...createCommonBasicProperties(),
      {
        key: 'tabKey',
        label: '标签 Key',
        type: 'text',
        placeholder: '请输入标签 Key',
        category: 'props',
      },
      {
        key: 'title',
        label: '标签标题',
        type: 'text',
        placeholder: '请输入标签标题',
        category: 'props',
      },
      {
        key: 'disabled',
        label: '禁用',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'false',
      },
      {
        key: 'closable',
        label: '可关闭',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'false',
      },
      ...createCommonStyleProperties(),
    ],
  },

  [ComponentType.Accordion]: {
    type: ComponentType.Accordion,
    label: '折叠面板',
    properties: [
      ...createCommonBasicProperties(),
      {
        key: 'multiple',
        label: '允许多个展开',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'false',
      },
      {
        key: 'bordered',
        label: '显示边框',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'true',
      },
      {
        key: 'ghost',
        label: '无边框背景',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'false',
      },
      {
        key: 'activeKey',
        label: '当前展开项',
        type: 'text',
        placeholder: '面板 Key',
        category: 'props',
      },
      ...createCommonStyleProperties(),
    ],
  },

  [ComponentType.AccordionItem]: {
    type: ComponentType.AccordionItem,
    label: '折叠项',
    properties: [
      ...createCommonBasicProperties(),
      {
        key: 'itemKey',
        label: '面板 Key',
        type: 'text',
        placeholder: '请输入面板 Key',
        category: 'props',
      },
      {
        key: 'title',
        label: '面板标题',
        type: 'text',
        placeholder: '请输入面板标题',
        category: 'props',
      },
      {
        key: 'disabled',
        label: '禁用',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'false',
      },
      {
        key: 'defaultExpanded',
        label: '默认展开',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'false',
      },
      ...createCommonStyleProperties(),
    ],
  },

  [ComponentType.Modal]: {
    type: ComponentType.Modal,
    label: '弹窗',
    properties: [
      ...createCommonBasicProperties(),
      {
        key: 'visible',
        label: '默认显示',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'false',
      },
      {
        key: 'title',
        label: '弹窗标题',
        type: 'text',
        placeholder: '请输入弹窗标题',
        category: 'props',
      },
      {
        key: 'width',
        label: '弹窗宽度',
        type: 'text',
        placeholder: '如：520 或 80%',
        category: 'props',
      },
      {
        key: 'height',
        label: '弹窗高度',
        type: 'text',
        placeholder: '如：400 或 60%',
        category: 'props',
      },
      {
        key: 'centered',
        label: '垂直居中',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'true',
      },
      {
        key: 'closable',
        label: '显示关闭按钮',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'true',
      },
      {
        key: 'maskClosable',
        label: '点击遮罩关闭',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'true',
      },
      {
        key: 'closeOnEscape',
        label: 'ESC键关闭',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'true',
      },
      {
        key: 'okText',
        label: '确定按钮文字',
        type: 'text',
        placeholder: '确定',
        category: 'props',
      },
      {
        key: 'cancelText',
        label: '取消按钮文字',
        type: 'text',
        placeholder: '取消',
        category: 'props',
      },
      {
        key: 'okVisible',
        label: '显示确定按钮',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'true',
      },
      {
        key: 'cancelVisible',
        label: '显示取消按钮',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'true',
      },
      {
        key: 'destroyOnClose',
        label: '关闭时销毁',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'false',
      },
      {
        key: 'zIndex',
        label: '层级',
        type: 'number',
        placeholder: '1000',
        category: 'props',
        defaultValue: 1000,
      },
      ...createCommonStyleProperties(),
    ],
  },

  [ComponentType.Input]: {
    type: ComponentType.Input,
    label: '输入框',
    properties: [
      ...createCommonBasicProperties(),
      {
        key: 'type',
        label: '输入类型',
        type: 'select',
        options: [
          { value: 'text', label: '文本' },
          { value: 'number', label: '数字' },
          { value: 'email', label: '邮箱' },
          { value: 'password', label: '密码' },
        ],
        category: 'props',
        defaultValue: 'text',
      },
      {
        key: 'placeholder',
        label: '占位符',
        type: 'text',
        placeholder: '请输入占位符',
        category: 'props',
      },
      {
        key: 'value',
        label: '默认值',
        type: 'text',
        placeholder: '默认值',
        category: 'props',
      },
      {
        key: 'maxLength',
        label: '最大长度',
        type: 'number',
        placeholder: '不限制',
        category: 'props',
      },
      {
        key: 'clearable',
        label: '可清除',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'false',
      },
      {
        key: 'disabled',
        label: '禁用',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'false',
      },
      {
        key: 'readOnly',
        label: '只读',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'false',
      },
      {
        key: 'error',
        label: '错误状态',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'false',
      },
      {
        key: 'errorMessage',
        label: '错误消息',
        type: 'text',
        placeholder: '请输入错误消息',
        category: 'props',
      },
      {
        key: 'validateOnChange',
        label: '实时验证',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'true',
      },
      {
        key: 'validateOnBlur',
        label: '失焦验证',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'false',
      },
      ...createCommonStyleProperties(),
    ],
  },

  [ComponentType.Textarea]: {
    type: ComponentType.Textarea,
    label: '多行文本',
    properties: [
      ...createCommonBasicProperties(),
      {
        key: 'placeholder',
        label: '占位符',
        type: 'text',
        placeholder: '请输入占位符',
        category: 'props',
      },
      {
        key: 'value',
        label: '默认值',
        type: 'textarea',
        placeholder: '默认值',
        category: 'props',
      },
      {
        key: 'rows',
        label: '行数',
        type: 'number',
        placeholder: '4',
        category: 'props',
        defaultValue: 4,
      },
      {
        key: 'maxLength',
        label: '最大字数',
        type: 'number',
        placeholder: '不限制',
        category: 'props',
      },
      {
        key: 'resize',
        label: '调整大小',
        type: 'select',
        options: [
          { value: 'none', label: '禁止' },
          { value: 'both', label: '双向' },
          { value: 'horizontal', label: '水平' },
          { value: 'vertical', label: '垂直' },
        ],
        category: 'props',
        defaultValue: 'vertical',
      },
      {
        key: 'showCount',
        label: '显示字数统计',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'false',
      },
      {
        key: 'disabled',
        label: '禁用',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'false',
      },
      {
        key: 'readOnly',
        label: '只读',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'false',
      },
      {
        key: 'error',
        label: '错误状态',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'false',
      },
      {
        key: 'errorMessage',
        label: '错误消息',
        type: 'text',
        placeholder: '请输入错误消息',
        category: 'props',
      },
      {
        key: 'validateOnChange',
        label: '实时验证',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'true',
      },
      {
        key: 'validateOnBlur',
        label: '失焦验证',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'false',
      },
      ...createCommonStyleProperties(),
    ],
  },

  [ComponentType.Select]: {
    type: ComponentType.Select,
    label: '下拉选择',
    properties: [
      ...createCommonBasicProperties(),
      {
        key: 'placeholder',
        label: '占位符',
        type: 'text',
        placeholder: '请输入占位符',
        category: 'props',
      },
      {
        key: 'options',
        label: '选项列表',
        type: 'options',
        placeholder: '每行一个选项，格式：value:label\n例如：\noption1:选项一\noption2:选项二',
        category: 'props',
        defaultValue: [
          { value: 'option1', label: '选项一' },
          { value: 'option2', label: '选项二' },
          { value: 'option3', label: '选项三' },
        ],
      },
      {
        key: 'multiple',
        label: '多选',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'false',
      },
      {
        key: 'searchable',
        label: '可搜索',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'false',
      },
      {
        key: 'clearable',
        label: '可清除',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'false',
      },
      {
        key: 'disabled',
        label: '禁用',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'false',
      },
      {
        key: 'error',
        label: '错误状态',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'false',
      },
      {
        key: 'errorMessage',
        label: '错误消息',
        type: 'text',
        placeholder: '请输入错误消息',
        category: 'props',
      },
      {
        key: 'validateOnChange',
        label: '实时验证',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'true',
      },
      {
        key: 'validateOnBlur',
        label: '失焦验证',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'false',
      },
      ...createCommonStyleProperties(),
    ],
  },

  [ComponentType.Checkbox]: {
    type: ComponentType.Checkbox,
    label: '复选框',
    properties: [
      ...createCommonBasicProperties(),
      {
        key: 'label',
        label: '标签文本',
        type: 'text',
        placeholder: '请输入标签文本',
        category: 'props',
      },
      {
        key: 'checked',
        label: '是否选中',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'false',
      },
      {
        key: 'indeterminate',
        label: '半选状态',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'false',
      },
      {
        key: 'disabled',
        label: '禁用',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'false',
      },
      ...createCommonStyleProperties(),
    ],
  },

  [ComponentType.CheckboxGroup]: {
    type: ComponentType.CheckboxGroup,
    label: '复选框组',
    properties: [
      ...createCommonBasicProperties(),
      {
        key: 'options',
        label: '选项列表',
        type: 'options',
        placeholder: '每行一个选项，格式：value:label\n例如：\noption1:选项一\noption2:选项二',
        category: 'props',
        defaultValue: [
          { value: 'option1', label: '选项一' },
          { value: 'option2', label: '选项二' },
          { value: 'option3', label: '选项三' },
        ],
      },
      {
        key: 'direction',
        label: '排列方向',
        type: 'select',
        options: [
          { value: 'row', label: '横向' },
          { value: 'column', label: '纵向' },
        ],
        category: 'props',
        defaultValue: 'column',
      },
      {
        key: 'gap',
        label: '间距',
        type: 'select',
        options: [
          { value: 'sm', label: '小' },
          { value: 'md', label: '中' },
          { value: 'lg', label: '大' },
        ],
        category: 'props',
        defaultValue: 'md',
      },
      {
        key: 'disabled',
        label: '禁用',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'false',
      },
      ...createCommonStyleProperties(),
    ],
  },

  [ComponentType.Radio]: {
    type: ComponentType.Radio,
    label: '单选框',
    properties: [
      ...createCommonBasicProperties(),
      {
        key: 'label',
        label: '标签文本',
        type: 'text',
        placeholder: '请输入标签文本',
        category: 'props',
      },
      {
        key: 'value',
        label: '值',
        type: 'text',
        placeholder: '请输入值',
        category: 'props',
      },
      {
        key: 'checked',
        label: '是否选中',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'false',
      },
      {
        key: 'disabled',
        label: '禁用',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'false',
      },
      ...createCommonStyleProperties(),
    ],
  },

  [ComponentType.RadioGroup]: {
    type: ComponentType.RadioGroup,
    label: '单选框组',
    properties: [
      ...createCommonBasicProperties(),
      {
        key: 'options',
        label: '选项列表',
        type: 'options',
        placeholder: '每行一个选项，格式：value:label\n例如：\noption1:选项一\noption2:选项二',
        category: 'props',
        defaultValue: [
          { value: 'option1', label: '选项一' },
          { value: 'option2', label: '选项二' },
          { value: 'option3', label: '选项三' },
        ],
      },
      {
        key: 'direction',
        label: '排列方向',
        type: 'select',
        options: [
          { value: 'row', label: '横向' },
          { value: 'column', label: '纵向' },
        ],
        category: 'props',
        defaultValue: 'column',
      },
      {
        key: 'gap',
        label: '间距',
        type: 'select',
        options: [
          { value: 'sm', label: '小' },
          { value: 'md', label: '中' },
          { value: 'lg', label: '大' },
        ],
        category: 'props',
        defaultValue: 'md',
      },
      {
        key: 'disabled',
        label: '禁用',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'false',
      },
      ...createCommonStyleProperties(),
    ],
  },

  [ComponentType.Switch]: {
    type: ComponentType.Switch,
    label: '开关',
    properties: [
      ...createCommonBasicProperties(),
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
        defaultValue: 'md',
      },
      {
        key: 'checked',
        label: '是否开启',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'false',
      },
      {
        key: 'disabled',
        label: '禁用',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'false',
      },
      {
        key: 'loading',
        label: '加载状态',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'false',
      },
      {
        key: 'checkedText',
        label: '开启时文本',
        type: 'text',
        placeholder: '开启时显示的文本',
        category: 'props',
      },
      {
        key: 'uncheckedText',
        label: '关闭时文本',
        type: 'text',
        placeholder: '关闭时显示的文本',
        category: 'props',
      },
      {
        key: 'activeColor',
        label: '开启颜色',
        type: 'text',
        placeholder: '#2563eb',
        category: 'props',
      },
      {
        key: 'inactiveColor',
        label: '关闭颜色',
        type: 'text',
        placeholder: '#d1d5db',
        category: 'props',
      },
      ...createCommonStyleProperties(),
    ],
  },

  [ComponentType.Form]: {
    type: ComponentType.Form,
    label: '表单',
    properties: [
      ...createCommonBasicProperties(),
      {
        key: 'id',
        label: '表单 ID',
        type: 'text',
        placeholder: '例如：loginForm',
        category: 'props',
        description: '用于按钮的表单提交/重置事件识别',
      },
      {
        key: 'layout',
        label: '布局方式',
        type: 'select',
        options: [
          { value: 'horizontal', label: '水平' },
          { value: 'vertical', label: '垂直' },
          { value: 'inline', label: '内联' },
        ],
        category: 'props',
        defaultValue: 'vertical',
      },
      {
        key: 'labelWidth',
        label: '标签宽度',
        type: 'number',
        placeholder: '100',
        category: 'props',
        defaultValue: 100,
      },
      {
        key: 'labelAlign',
        label: '标签对齐',
        type: 'select',
        options: [
          { value: 'left', label: '左对齐' },
          { value: 'right', label: '右对齐' },
          { value: 'top', label: '顶部' },
        ],
        category: 'props',
        defaultValue: 'right',
      },
      {
        key: 'size',
        label: '组件尺寸',
        type: 'select',
        options: [
          { value: 'sm', label: '小' },
          { value: 'md', label: '中' },
          { value: 'lg', label: '大' },
        ],
        category: 'props',
        defaultValue: 'md',
      },
      {
        key: 'disabled',
        label: '禁用',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'false',
      },
      ...createCommonStyleProperties(),
    ],
  },

  [ComponentType.FormItem]: {
    type: ComponentType.FormItem,
    label: '表单项',
    properties: [
      ...createCommonBasicProperties(),
      {
        key: 'label',
        label: '标签文本',
        type: 'text',
        placeholder: '请输入标签文本',
        category: 'props',
      },
      {
        key: 'required',
        label: '必填标记',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'false',
      },
      {
        key: 'error',
        label: '错误状态',
        type: 'select',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' },
        ],
        category: 'props',
        defaultValue: 'false',
      },
      {
        key: 'errorMessage',
        label: '错误信息',
        type: 'text',
        placeholder: '请输入错误信息',
        category: 'props',
      },
      {
        key: 'help',
        label: '帮助说明',
        type: 'text',
        placeholder: '请输入帮助说明',
        category: 'props',
      },
      {
        key: 'name',
        label: '字段名',
        type: 'text',
        placeholder: '请输入字段名',
        category: 'props',
      },
      {
        key: 'labelWidth',
        label: '标签宽度',
        type: 'number',
        placeholder: '继承自表单',
        category: 'props',
      },
      {
        key: 'labelAlign',
        label: '标签对齐',
        type: 'select',
        options: [
          { value: 'left', label: '左对齐' },
          { value: 'right', label: '右对齐' },
          { value: 'top', label: '顶部' },
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
