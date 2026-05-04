import { useState, useCallback, useRef, useEffect } from 'react';
import type { ComponentSchema } from '@/types/component';
import { logger } from '@/utils/logger';
import { getComponentFullBounds } from '@/utils/size';
import type { ComponentBounds } from '@/utils/size';

export type AlignmentType =
  | 'left'
  | 'right'
  | 'centerH'
  | 'top'
  | 'bottom'
  | 'centerV'
  | 'canvasLeft'
  | 'canvasRight'
  | 'canvasTop'
  | 'canvasBottom'
  | 'canvasCenterH'
  | 'canvasCenterV';

export interface AlignmentGuide {
  type: AlignmentType;
  position: number;
  isCanvasEdge: boolean;
  targetComponentId?: string;
}

export interface AlignmentResult {
  guides: AlignmentGuide[];
  snappedX: number;
  snappedY: number;
}

const SNAP_TOLERANCE = 8;

const getComponentBounds = (component: ComponentSchema): ComponentBounds => {
  return getComponentFullBounds(component);
};

interface UseAlignmentGuidesOptions {
  canvasWidth: number;
  canvasHeight: number;
}

interface UseAlignmentGuidesResult {
  activeGuides: AlignmentGuide[];
  isAligning: boolean;
  detectAlignment: (
    draggingComponent: ComponentSchema,
    allComponents: ComponentSchema[],
    currentX: number,
    currentY: number,
    isMultiDrag?: boolean,
    multiDragComponents?: ComponentSchema[]
  ) => AlignmentResult;
  clearGuides: () => void;
}

export const useAlignmentGuides = (
  options: UseAlignmentGuidesOptions = { canvasWidth: 0, canvasHeight: 0 }
): UseAlignmentGuidesResult => {
  const { canvasWidth, canvasHeight } = options;

  const [activeGuides, setActiveGuides] = useState<AlignmentGuide[]>([]);
  const [isAligning, setIsAligning] = useState(false);

  const guidesRef = useRef<AlignmentGuide[]>([]);
  const canvasSizeRef = useRef({ canvasWidth, canvasHeight });

  useEffect(() => {
    canvasSizeRef.current = { canvasWidth, canvasHeight };
  }, [canvasWidth, canvasHeight]);

  const clearGuides = useCallback(() => {
    setActiveGuides([]);
    setIsAligning(false);
    guidesRef.current = [];
  }, []);

  const detectAlignment = useCallback(
    (
      draggingComponent: ComponentSchema,
      allComponents: ComponentSchema[],
      currentX: number,
      currentY: number,
      isMultiDrag: boolean = false,
      multiDragComponents: ComponentSchema[] = []
    ): AlignmentResult => {
      const { canvasWidth: cw, canvasHeight: ch } = canvasSizeRef.current;

      const draggingBounds = getComponentBounds(draggingComponent);
      const currentWidth = draggingBounds.width;
      const currentHeight = draggingBounds.height;

      const currentRight = currentX + currentWidth;
      const currentBottom = currentY + currentHeight;
      const currentCenterX = currentX + currentWidth / 2;
      const currentCenterY = currentY + currentHeight / 2;

      const newGuides: AlignmentGuide[] = [];
      let snappedX = currentX;
      let snappedY = currentY;
      let hasAlignment = false;

      const currentMultiDragBounds: ComponentBounds[] = [];
      if (isMultiDrag && multiDragComponents.length > 0) {
        for (const comp of multiDragComponents) {
          if (comp.id !== draggingComponent.id) {
            currentMultiDragBounds.push(getComponentBounds(comp));
          }
        }
      }

      const isComponentInSelection = (id: string): boolean => {
        if (!isMultiDrag) return id === draggingComponent.id;
        if (id === draggingComponent.id) return true;
        return currentMultiDragBounds.some((b) => b.id === id);
      };

      for (const otherComponent of allComponents) {
        if (isComponentInSelection(otherComponent.id)) continue;

        const otherBounds = getComponentBounds(otherComponent);

        if (Math.abs(currentX - otherBounds.x) <= SNAP_TOLERANCE) {
          newGuides.push({
            type: 'left',
            position: otherBounds.x,
            isCanvasEdge: false,
            targetComponentId: otherComponent.id,
          });
          snappedX = otherBounds.x;
          hasAlignment = true;
        }

        if (Math.abs(currentRight - otherBounds.right) <= SNAP_TOLERANCE) {
          newGuides.push({
            type: 'right',
            position: otherBounds.right,
            isCanvasEdge: false,
            targetComponentId: otherComponent.id,
          });
          snappedX = otherBounds.right - currentWidth;
          hasAlignment = true;
        }

        if (Math.abs(currentCenterX - otherBounds.centerX) <= SNAP_TOLERANCE) {
          newGuides.push({
            type: 'centerH',
            position: otherBounds.centerX,
            isCanvasEdge: false,
            targetComponentId: otherComponent.id,
          });
          snappedX = otherBounds.centerX - currentWidth / 2;
          hasAlignment = true;
        }

        if (Math.abs(currentY - otherBounds.y) <= SNAP_TOLERANCE) {
          newGuides.push({
            type: 'top',
            position: otherBounds.y,
            isCanvasEdge: false,
            targetComponentId: otherComponent.id,
          });
          snappedY = otherBounds.y;
          hasAlignment = true;
        }

        if (Math.abs(currentBottom - otherBounds.bottom) <= SNAP_TOLERANCE) {
          newGuides.push({
            type: 'bottom',
            position: otherBounds.bottom,
            isCanvasEdge: false,
            targetComponentId: otherComponent.id,
          });
          snappedY = otherBounds.bottom - currentHeight;
          hasAlignment = true;
        }

        if (Math.abs(currentCenterY - otherBounds.centerY) <= SNAP_TOLERANCE) {
          newGuides.push({
            type: 'centerV',
            position: otherBounds.centerY,
            isCanvasEdge: false,
            targetComponentId: otherComponent.id,
          });
          snappedY = otherBounds.centerY - currentHeight / 2;
          hasAlignment = true;
        }
      }

      if (cw > 0) {
        if (Math.abs(currentX) <= SNAP_TOLERANCE) {
          newGuides.push({
            type: 'canvasLeft',
            position: 0,
            isCanvasEdge: true,
          });
          snappedX = 0;
          hasAlignment = true;
        }

        if (Math.abs(currentRight - cw) <= SNAP_TOLERANCE) {
          newGuides.push({
            type: 'canvasRight',
            position: cw,
            isCanvasEdge: true,
          });
          snappedX = cw - currentWidth;
          hasAlignment = true;
        }

        const canvasCenterX = cw / 2;
        if (Math.abs(currentCenterX - canvasCenterX) <= SNAP_TOLERANCE) {
          newGuides.push({
            type: 'canvasCenterH',
            position: canvasCenterX,
            isCanvasEdge: true,
          });
          snappedX = canvasCenterX - currentWidth / 2;
          hasAlignment = true;
        }
      }

      if (ch > 0) {
        if (Math.abs(currentY) <= SNAP_TOLERANCE) {
          newGuides.push({
            type: 'canvasTop',
            position: 0,
            isCanvasEdge: true,
          });
          snappedY = 0;
          hasAlignment = true;
        }

        if (Math.abs(currentBottom - ch) <= SNAP_TOLERANCE) {
          newGuides.push({
            type: 'canvasBottom',
            position: ch,
            isCanvasEdge: true,
          });
          snappedY = ch - currentHeight;
          hasAlignment = true;
        }

        const canvasCenterY = ch / 2;
        if (Math.abs(currentCenterY - canvasCenterY) <= SNAP_TOLERANCE) {
          newGuides.push({
            type: 'canvasCenterV',
            position: canvasCenterY,
            isCanvasEdge: true,
          });
          snappedY = canvasCenterY - currentHeight / 2;
          hasAlignment = true;
        }
      }

      if (JSON.stringify(newGuides) !== JSON.stringify(guidesRef.current)) {
        guidesRef.current = newGuides;
        setActiveGuides(newGuides);
        setIsAligning(hasAlignment);
      }

      logger.log('Alignment detected:', {
        guides: newGuides,
        currentX,
        currentY,
        snappedX,
        snappedY,
        canvasWidth: cw,
        canvasHeight: ch,
      });

      return {
        guides: newGuides,
        snappedX,
        snappedY,
      };
    },
    []
  );

  return {
    activeGuides,
    isAligning,
    detectAlignment,
    clearGuides,
  };
};

export default useAlignmentGuides;
