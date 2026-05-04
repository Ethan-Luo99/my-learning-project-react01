import type { ComponentBaseSchema } from '@/types/component';
import { COMPONENT_MIN_SIZE } from '@/constants/dnd';

export interface ComponentSize {
  width: number;
  height: number;
}

export interface ComponentBounds {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  right: number;
  bottom: number;
}

export const DEFAULT_AUTO_WIDTH = 100;
export const DEFAULT_AUTO_HEIGHT = 100;

export const isNumericSize = (size: number | string | undefined): size is number => {
  return typeof size === 'number' && !isNaN(size);
};

export const getComponentSize = (
  component: ComponentBaseSchema,
  element?: HTMLElement | null
): ComponentSize => {
  let width: number;
  let height: number;

  if (element && element.getBoundingClientRect) {
    const rect = element.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    return { width, height };
  }

  if (isNumericSize(component.width)) {
    width = component.width;
  } else {
    width = DEFAULT_AUTO_WIDTH;
  }

  if (isNumericSize(component.height)) {
    height = component.height;
  } else {
    height = DEFAULT_AUTO_HEIGHT;
  }

  width = Math.max(width, COMPONENT_MIN_SIZE.WIDTH);
  height = Math.max(height, COMPONENT_MIN_SIZE.HEIGHT);

  return { width, height };
};

export const getComponentFullBounds = (
  component: ComponentBaseSchema,
  element?: HTMLElement | null
): ComponentBounds => {
  const x = component.x ?? 0;
  const y = component.y ?? 0;
  const { width, height } = getComponentSize(component, element);

  return {
    id: component.id,
    x,
    y,
    width,
    height,
    centerX: x + width / 2,
    centerY: y + height / 2,
    right: x + width,
    bottom: y + height,
  };
};

export default {
  getComponentSize,
  getComponentFullBounds,
  isNumericSize,
  DEFAULT_AUTO_WIDTH,
  DEFAULT_AUTO_HEIGHT,
};
