import type { ComponentSchema, ContainerComponentSchema } from '@/types/component';
import { ComponentType } from '@/types/component';
import { generateId } from '@/utils/id';
import { logger } from '@/utils/logger';

export const CLIPBOARD_DATA_FORMAT = 'application/x-lowcode-component';

export interface ComponentClipboardData {
  version: string;
  timestamp: number;
  originalId?: string;
  originalX?: number;
  originalY?: number;
  component: Omit<ComponentSchema, 'id'> & { 
    children?: Array<Omit<ComponentSchema, 'id'>>;
  };
}

export const isContainerComponent = (
  component: ComponentSchema | (Omit<ComponentSchema, 'id'> & { children?: any[] })
): component is ContainerComponentSchema => {
  return component.type === ComponentType.Container;
};

export const serializeComponentForClipboard = (component: ComponentSchema): string => {
  const cloned = structuredClone(component);
  
  const removeIdRecursive = (
    comp: ComponentSchema | (Omit<ComponentSchema, 'id'> & { children?: any[] })
  ): Omit<ComponentSchema, 'id'> & { children?: any[] } => {
    const { id, ...rest } = comp as ComponentSchema;
    
    if (isContainerComponent(comp) && comp.children && comp.children.length > 0) {
      return {
        ...rest,
        children: comp.children.map((child) => removeIdRecursive(child)),
      };
    }
    
    return rest;
  };
  
  const dataWithoutId = removeIdRecursive(cloned);
  
  const clipboardData: ComponentClipboardData = {
    version: '1.0',
    timestamp: Date.now(),
    originalId: component.id,
    originalX: component.x,
    originalY: component.y,
    component: dataWithoutId,
  };
  
  return JSON.stringify(clipboardData);
};

export const parseClipboardData = (jsonString: string): ComponentClipboardData | null => {
  try {
    const data = JSON.parse(jsonString) as ComponentClipboardData;
    
    if (
      !data ||
      data.version !== '1.0' ||
      !data.component ||
      !data.component.type
    ) {
      return null;
    }
    
    return data;
  } catch (error) {
    logger.debug('解析剪贴板数据失败:', error);
    return null;
  }
};

const PASTE_OFFSET_X = 24;
const PASTE_OFFSET_Y = 24;

export const regenerateComponentIds = (
  componentData: Omit<ComponentSchema, 'id'> & { children?: any[] },
  baseOffsetX: number = 0,
  baseOffsetY: number = 0
): ComponentSchema => {
  const newId = generateId();
  
  let newX: number | undefined = componentData.x;
  let newY: number | undefined = componentData.y;
  
  if (newX !== undefined) {
    newX = newX + baseOffsetX;
  }
  if (newY !== undefined) {
    newY = newY + baseOffsetY;
  }
  
  const newComponent: ComponentSchema = {
    ...componentData,
    id: newId,
    x: newX,
    y: newY,
  } as ComponentSchema;
  
  if (isContainerComponent(componentData) && componentData.children && componentData.children.length > 0) {
    (newComponent as ContainerComponentSchema).children = componentData.children.map((child) =>
      regenerateComponentIds(child, baseOffsetX, baseOffsetY)
    );
  }
  
  return newComponent;
};

export const createComponentForPaste = (
  clipboardData: ComponentClipboardData,
  customOffsetX?: number,
  customOffsetY?: number
): ComponentSchema => {
  const offsetX = customOffsetX ?? PASTE_OFFSET_X;
  const offsetY = customOffsetY ?? PASTE_OFFSET_Y;
  
  return regenerateComponentIds(clipboardData.component, offsetX, offsetY);
};

export const writeComponentToClipboard = async (component: ComponentSchema): Promise<boolean> => {
  try {
    const jsonString = serializeComponentForClipboard(component);
    
    const clipboardItem = new ClipboardItem({
      'text/plain': jsonString,
      [CLIPBOARD_DATA_FORMAT]: jsonString,
    } as any);
    
    await navigator.clipboard.write([clipboardItem]);
    
    await navigator.clipboard.writeText(jsonString);
    
    logger.log('组件已复制到剪贴板:', component.type, component.id);
    return true;
  } catch (error) {
    logger.warn('写入剪贴板失败:', error);
    
    try {
      const jsonString = serializeComponentForClipboard(component);
      await navigator.clipboard.writeText(jsonString);
      logger.log('组件已复制到剪贴板（纯文本模式）:', component.type);
      return true;
    } catch (fallbackError) {
      logger.error('剪贴板写入完全失败:', fallbackError);
      return false;
    }
  }
};

export const readComponentFromClipboard = async (): Promise<ComponentSchema | null> => {
  try {
    const items = await navigator.clipboard.read();
    
    for (const item of items) {
      if (item.types.includes(CLIPBOARD_DATA_FORMAT)) {
        const blob = await item.getType(CLIPBOARD_DATA_FORMAT);
        const text = await blob.text();
        const data = parseClipboardData(text);
        if (data) {
          return createComponentForPaste(data);
        }
      }
      
      if (item.types.includes('text/plain')) {
        const blob = await item.getType('text/plain');
        const text = await blob.text();
        const data = parseClipboardData(text);
        if (data) {
          return createComponentForPaste(data);
        }
      }
    }
    
    return null;
  } catch (error) {
    logger.debug('使用高级剪贴板 API 读取失败，尝试备用方法:', error);
    
    try {
      const text = await navigator.clipboard.readText();
      const data = parseClipboardData(text);
      if (data) {
        return createComponentForPaste(data);
      }
      return null;
    } catch (fallbackError) {
      logger.warn('读取剪贴板失败:', fallbackError);
      return null;
    }
  }
};

export const hasValidClipboardData = async (): Promise<boolean> => {
  const component = await readComponentFromClipboard();
  return component !== null;
};
