import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { isPrimaryModifierKey, getPrimaryModifierKeyLabel, getPrimaryModifierKeyDisplay } from '@/utils/platform';
import { logger } from '@/utils/logger';

interface KeyboardShortcutsProps {
  onUndo?: () => void;
  onRedo?: () => void;
  onDelete?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  enabled?: boolean;
}

interface KeyboardShortcutsInfo {
  undo: {
    key: string;
    display: string;
    keyLabel: string;
  };
  redo: {
    key: string;
    display: string;
    keyLabel: string;
  };
  delete: {
    key: string;
    display: string;
    keyLabel: string;
  };
  copy: {
    key: string;
    display: string;
    keyLabel: string;
  };
  paste: {
    key: string;
    display: string;
    keyLabel: string;
  };
}

export const isInputElement = (element: HTMLElement | null): boolean => {
  if (!element) return false;
  
  const tagName = element.tagName.toLowerCase();
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true;
  }
  
  if (element.isContentEditable) {
    return true;
  }
  
  return false;
};

export const isBuilderRoute = (pathname: string): boolean => {
  return pathname === '/builder' || pathname.startsWith('/builder/');
};

export const getKeyboardShortcutsInfo = (): KeyboardShortcutsInfo => {
  const modifierKeyLabel = getPrimaryModifierKeyLabel();
  const modifierKeyDisplay = getPrimaryModifierKeyDisplay();
  
  return {
    undo: {
      key: 'Z',
      display: `${modifierKeyDisplay} + Z`,
      keyLabel: `${modifierKeyLabel}Z`,
    },
    redo: {
      key: 'Y',
      display: `${modifierKeyDisplay} + Y / ${modifierKeyDisplay} + Shift + Z`,
      keyLabel: `${modifierKeyLabel}Y / ${modifierKeyLabel}⇧Z`,
    },
    delete: {
      key: 'Delete/Backspace',
      display: 'Delete / Backspace',
      keyLabel: 'Del',
    },
    copy: {
      key: 'C',
      display: `${modifierKeyDisplay} + C`,
      keyLabel: `${modifierKeyLabel}C`,
    },
    paste: {
      key: 'V',
      display: `${modifierKeyDisplay} + V`,
      keyLabel: `${modifierKeyLabel}V`,
    },
  };
};

export const useKeyboardShortcuts = ({
  onUndo,
  onRedo,
  onDelete,
  onCopy,
  onPaste,
  enabled = true,
}: KeyboardShortcutsProps = {}) => {
  const location = useLocation();
  
  const handleKeyDown = useCallback(
    async (event: KeyboardEvent) => {
      if (!enabled) return;
      
      if (!isBuilderRoute(location.pathname)) {
        return;
      }
      
      const activeElement = document.activeElement as HTMLElement | null;
      
      const primaryModifierPressed = isPrimaryModifierKey(event);
      const shiftPressed = event.shiftKey;
      const key = event.key.toLowerCase();
      
      if (isInputElement(activeElement)) {
        if ((key === 'z' || key === 'y') && primaryModifierPressed) {
          logger.debug('快捷键被跳过：焦点在输入元素上');
          return;
        }
        
        if (key === 'delete' || key === 'backspace') {
          return;
        }
        
        if ((key === 'c' || key === 'v') && primaryModifierPressed) {
          logger.debug('复制/粘贴：焦点在输入元素上，使用浏览器默认行为');
          return;
        }
      }
      
      if (primaryModifierPressed && key === 'c' && !shiftPressed) {
        if (onCopy) {
          event.preventDefault();
          logger.debug('快捷键触发：复制');
          onCopy();
        }
        return;
      }
      
      if (primaryModifierPressed && key === 'v' && !shiftPressed) {
        if (onPaste) {
          event.preventDefault();
          logger.debug('快捷键触发：粘贴');
          onPaste();
        }
        return;
      }
      
      if (primaryModifierPressed && key === 'z' && !shiftPressed) {
        if (onUndo) {
          event.preventDefault();
          logger.debug('快捷键触发：撤销');
          onUndo();
        }
        return;
      }
      
      if (primaryModifierPressed && key === 'y') {
        if (onRedo) {
          event.preventDefault();
          logger.debug('快捷键触发：重做 (Y)');
          onRedo();
        }
        return;
      }
      
      if (primaryModifierPressed && shiftPressed && key === 'z') {
        if (onRedo) {
          event.preventDefault();
          logger.debug('快捷键触发：重做 (Shift+Z)');
          onRedo();
        }
        return;
      }
      
      if (key === 'delete' || key === 'backspace') {
        if (onDelete) {
          event.preventDefault();
          logger.debug('快捷键触发：删除');
          onDelete();
        }
        return;
      }
    },
    [enabled, location.pathname, onUndo, onRedo, onDelete, onCopy, onPaste]
  );
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [handleKeyDown]);
  
  const shortcutsInfo = getKeyboardShortcutsInfo();
  
  return {
    shortcutsInfo,
    isBuilderRoute: isBuilderRoute(location.pathname),
  };
};

export type { KeyboardShortcutsProps, KeyboardShortcutsInfo };
