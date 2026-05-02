export const DND_PREFIX = {
  PANEL: 'panel',
  CANVAS: 'canvas',
  CONTAINER: 'container-drop',
  SORTABLE: 'sortable',
} as const;

export const DROP_ZONE_ID = 'canvas-drop-zone';

export const GRID_SIZE = 16;

export const DEFAULT_POSITION = {
  X: 32,
  Y: 32,
} as const;

export const CANVAS_PADDING = {
  LEFT: 16,
  TOP: 16,
  RIGHT: 16,
  BOTTOM: 16,
} as const;

export const COMPONENT_MIN_SIZE = {
  WIDTH: 16,
  HEIGHT: 16,
} as const;

export const isPanelItem = (id: string): boolean => {
  return id.startsWith(`${DND_PREFIX.PANEL}-`);
};

export const isCanvasItem = (id: string): boolean => {
  return id.startsWith(`${DND_PREFIX.CANVAS}-`);
};

export const isSortableItem = (id: string): boolean => {
  return id.startsWith(`${DND_PREFIX.SORTABLE}-`);
};

export const isOverCanvas = (overId: string | null): boolean => {
  if (!overId) return false;
  return overId === DROP_ZONE_ID || isCanvasItem(overId) || isContainerDropZone(overId) || isSortableItem(overId);
};

export const getPanelItemType = (id: string): string => {
  return id.replace(`${DND_PREFIX.PANEL}-`, '');
};

export const getCanvasItemId = (id: string): string => {
  return id.replace(`${DND_PREFIX.CANVAS}-`, '');
};

export const getSortableItemId = (id: string): string => {
  return id.replace(`${DND_PREFIX.SORTABLE}-`, '');
};

export const createPanelItemId = (type: string): string => {
  return `${DND_PREFIX.PANEL}-${type}`;
};

export const createCanvasItemId = (id: string): string => {
  return `${DND_PREFIX.CANVAS}-${id}`;
};

export const createSortableItemId = (id: string): string => {
  return `${DND_PREFIX.SORTABLE}-${id}`;
};

export const createContainerDropZoneId = (containerId: string): string => {
  return `${DND_PREFIX.CONTAINER}-${containerId}`;
};

export const isContainerDropZone = (id: string): boolean => {
  return id.startsWith(`${DND_PREFIX.CONTAINER}-`);
};

export const getContainerIdFromDropZone = (dropZoneId: string): string => {
  return dropZoneId.replace(`${DND_PREFIX.CONTAINER}-`, '');
};

export const createSortableContextId = (containerId: string | null): string => {
  return containerId ? `sortable-context-${containerId}` : 'sortable-context-root';
};

export const isSameContainer = (
  activeContainerId: string | null,
  overContainerId: string | null
): boolean => {
  return activeContainerId === overContainerId;
};

export const snapToGrid = (value: number, gridSize: number = GRID_SIZE): number => {
  return Math.round(value / gridSize) * gridSize;
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};
