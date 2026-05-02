let isMacCache: boolean | undefined;
let isIOSCache: boolean | undefined;

export const isMac = (): boolean => {
  if (isMacCache !== undefined) {
    return isMacCache;
  }
  
  if (typeof navigator === 'undefined') {
    isMacCache = false;
    return isMacCache;
  }
  
  isMacCache = navigator.platform.toUpperCase().indexOf('MAC') >= 0 ||
    navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
  
  return isMacCache;
};

export const isIOS = (): boolean => {
  if (isIOSCache !== undefined) {
    return isIOSCache;
  }
  
  if (typeof navigator === 'undefined') {
    isIOSCache = false;
    return isIOSCache;
  }
  
  isIOSCache = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  
  return isIOSCache;
};

export const isApplePlatform = (): boolean => {
  return isMac() || isIOS();
};

export const getPrimaryModifierKeyLabel = (): string => {
  return isApplePlatform() ? '⌘' : 'Ctrl';
};

export const getPrimaryModifierKeyDisplay = (): string => {
  return isApplePlatform() ? 'Cmd' : 'Ctrl';
};

export const isPrimaryModifierKey = (event: KeyboardEvent): boolean => {
  return isApplePlatform() ? event.metaKey : event.ctrlKey;
};
