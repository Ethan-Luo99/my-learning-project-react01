import { useState, useEffect } from 'react';
import { cn } from '@/utils/classname';
import { Header } from '@/components/builder/Header';
import { Toolbar } from '@/components/builder/Toolbar';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { PANEL_WIDTH_PX } from '@/constants/layout';

const BREAKPOINTS = {
  lg: '(min-width: 1024px)',
  md: '(min-width: 768px) and (max-width: 1023px)',
  sm: '(max-width: 767px)',
};

interface BuilderLayoutProps {
  leftPanel: React.ReactNode;
  canvas: React.ReactNode;
  rightPanel: React.ReactNode;
  className?: string;
  projectName?: string;
  onUndo?: () => void;
  onRedo?: () => void;
  onPreview?: () => void;
  onSave?: () => void;
}

const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const BuilderLayout: React.FC<BuilderLayoutProps> = ({
  leftPanel,
  canvas,
  rightPanel,
  className,
  projectName,
  onUndo,
  onRedo,
  onPreview,
  onSave,
}) => {
  const isLargeScreen = useMediaQuery(BREAKPOINTS.lg);
  const isMediumScreen = useMediaQuery(BREAKPOINTS.md);
  const isSmallScreen = useMediaQuery(BREAKPOINTS.sm);

  const [leftPanelVisible, setLeftPanelVisible] = useState(true);
  const [rightPanelVisible, setRightPanelVisible] = useState(true);
  const [userToggledLeft, setUserToggledLeft] = useState(false);
  const [userToggledRight, setUserToggledRight] = useState(false);

  useEffect(() => {
    if (isLargeScreen) {
      if (!userToggledLeft) setLeftPanelVisible(true);
      if (!userToggledRight) setRightPanelVisible(true);
    } else if (isMediumScreen) {
      if (!userToggledLeft) setLeftPanelVisible(true);
      if (!userToggledRight) setRightPanelVisible(false);
    } else if (isSmallScreen) {
      if (!userToggledLeft) setLeftPanelVisible(false);
      if (!userToggledRight) setRightPanelVisible(false);
    }
  }, [isLargeScreen, isMediumScreen, isSmallScreen, userToggledLeft, userToggledRight]);

  useEffect(() => {
    setUserToggledLeft(false);
    setUserToggledRight(false);
  }, [isLargeScreen, isMediumScreen, isSmallScreen]);

  const handleToggleLeftPanel = () => {
    setUserToggledLeft(true);
    setLeftPanelVisible(!leftPanelVisible);
  };

  const handleToggleRightPanel = () => {
    setUserToggledRight(true);
    setRightPanelVisible(!rightPanelVisible);
  };

  const getCanvasStyle = (): React.CSSProperties => {
    if (isSmallScreen) {
      return {};
    }
    return {
      marginLeft: leftPanelVisible ? PANEL_WIDTH_PX.left : 0,
      marginRight: rightPanelVisible ? PANEL_WIDTH_PX.right : 0,
      paddingTop: '56px',
    };
  };

  return (
    <div className={cn('min-h-screen bg-gray-100 overflow-hidden', className)}>
      <Header
        projectName={projectName}
        onUndo={onUndo}
        onRedo={onRedo}
        onPreview={onPreview}
        onSave={onSave}
        leftPanelVisible={leftPanelVisible}
        rightPanelVisible={rightPanelVisible}
        onToggleLeftPanel={handleToggleLeftPanel}
        onToggleRightPanel={handleToggleRightPanel}
        isSmallScreen={isSmallScreen}
      />

      {isSmallScreen && leftPanelVisible && (
        <div
          className="fixed inset-0 bg-black/50 z-30 transition-opacity duration-300"
          onClick={() => setLeftPanelVisible(false)}
        />
      )}
      {isSmallScreen && rightPanelVisible && (
        <div
          className="fixed inset-0 bg-black/50 z-30 transition-opacity duration-300"
          onClick={() => setRightPanelVisible(false)}
        />
      )}

      <div
        className={cn(
          'fixed left-0 top-14 h-[calc(100vh-3.5rem)] transition-all duration-300 ease-in-out z-40',
          isSmallScreen
            ? leftPanelVisible
              ? 'translate-x-0 opacity-100'
              : '-translate-x-full opacity-0'
            : leftPanelVisible
            ? 'translate-x-0 opacity-100'
            : '-translate-x-full opacity-0'
        )}
        style={{ width: isSmallScreen ? '280px' : PANEL_WIDTH_PX.left }}
      >
        <aside className="w-full h-full bg-white border-r border-gray-200 overflow-y-auto">
          {isSmallScreen && (
            <button
              className="absolute top-2 right-2 p-1.5 bg-gray-100 hover:bg-gray-200 rounded-md z-50 transition-colors duration-150"
              onClick={() => setLeftPanelVisible(false)}
              aria-label="关闭左侧面板"
            >
              <CloseIcon />
            </button>
          )}
          {leftPanel}
        </aside>
      </div>

      <div
        className={cn(
          'fixed right-0 top-14 h-[calc(100vh-3.5rem)] transition-all duration-300 ease-in-out z-40',
          isSmallScreen
            ? rightPanelVisible
              ? 'translate-x-0 opacity-100'
              : 'translate-x-full opacity-0'
            : rightPanelVisible
            ? 'translate-x-0 opacity-100'
            : 'translate-x-full opacity-0'
        )}
        style={{ width: isSmallScreen ? '280px' : PANEL_WIDTH_PX.right }}
      >
        <aside className="w-full h-full bg-white border-l border-gray-200 overflow-y-auto">
          {isSmallScreen && (
            <button
              className="absolute top-2 left-2 p-1.5 bg-gray-100 hover:bg-gray-200 rounded-md z-50 transition-colors duration-150"
              onClick={() => setRightPanelVisible(false)}
              aria-label="关闭右侧面板"
            >
              <CloseIcon />
            </button>
          )}
          {rightPanel}
        </aside>
      </div>

      <main
        className={cn(
          'pt-14 transition-all duration-300 ease-in-out h-screen flex flex-col overflow-y-auto',
          isSmallScreen && 'ml-0 mr-0'
        )}
        style={getCanvasStyle()}
      >
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto min-h-full">
            <div className="mb-4 sticky top-0 z-10">
              <Toolbar
                onUndo={onUndo}
                onRedo={onRedo}
                onPreview={onPreview}
                onSave={onSave}
              />
            </div>
            {canvas}
          </div>
        </div>
      </main>
    </div>
  );
};

export { BuilderLayout };
export type { BuilderLayoutProps };
