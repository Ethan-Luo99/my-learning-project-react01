import { ComponentType } from '@/types/component';

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
