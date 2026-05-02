import { Button } from '@/components/ui';
import { cn } from '@/utils/classname';
import type { SaveStatus } from '@/store/useBuilderStore';
import { getKeyboardShortcutsInfo } from '@/hooks/useKeyboardShortcuts';

interface HeaderProps {
  className?: string;
  projectName?: string;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onPreview?: () => void;
  onSave?: () => void;
  onExport?: () => void;
  leftPanelVisible?: boolean;
  rightPanelVisible?: boolean;
  onToggleLeftPanel?: () => void;
  onToggleRightPanel?: () => void;
  isSmallScreen?: boolean;
  saveStatus?: SaveStatus;
  onClickProjectName?: () => void;
}

const UndoIcon = () => (
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
    <path d="M3 7v6h6" />
    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
  </svg>
);

const RedoIcon = () => (
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
    <path d="M21 7v6h-6" />
    <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
  </svg>
);

const PreviewIcon = () => (
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
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const SaveIcon = () => (
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
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17,21 17,13 7,13 7,21" />
    <polyline points="7,3 7,8 15,8" />
  </svg>
);

const LogoIcon = () => (
  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center flex-shrink-0">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  </div>
);

const ChevronLeftIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="15,18 9,12 15,6" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="9,18 15,12 9,6" />
  </svg>
);

const MenuIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="18" x2="20" y2="18" />
  </svg>
);

const SettingsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0-1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const LoaderIcon = () => (
  <svg
    className="animate-spin"
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 13l4 4L19 7" />
  </svg>
);

const ExportIcon = () => (
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
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7,10 12,5 17,10" />
    <line x1="12" y1="5" x2="12" y2="19" />
  </svg>
);

const Header = ({
  className,
  projectName = '未命名项目',
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onPreview,
  onSave,
  onExport,
  leftPanelVisible = true,
  rightPanelVisible = true,
  onToggleLeftPanel,
  onToggleRightPanel,
  isSmallScreen = false,
  saveStatus = 'idle',
  onClickProjectName,
}: HeaderProps) => {
  const getSaveButtonContent = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <>
            <LoaderIcon />
            <span className="hidden sm:inline">保存中...</span>
          </>
        );
      case 'saved':
        return (
          <>
            <CheckIcon />
            <span className="hidden sm:inline">已保存</span>
          </>
        );
      case 'error':
        return (
          <>
            <SaveIcon />
            <span className="hidden sm:inline">重试</span>
          </>
        );
      default:
        return (
          <>
            <SaveIcon />
            <span className="hidden sm:inline">保存</span>
          </>
        );
    }
  };

  const getSaveButtonColor = () => {
    if (saveStatus === 'error') return 'danger' as const;
    return 'default' as const;
  };

  const getSaveButtonVariant = () => {
    if (saveStatus === 'saved') return 'outline' as const;
    return 'primary' as const;
  };

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 shadow-sm z-50 flex items-center',
        isSmallScreen ? 'px-2' : 'px-4',
        'gap-2 md:gap-4',
        className
      )}
    >
      <div className="flex items-center gap-2">
        {onToggleLeftPanel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleLeftPanel}
            className={cn(
              'p-1.5 h-auto w-auto',
              isSmallScreen && (leftPanelVisible ? 'bg-primary-100 text-primary-700' : '')
            )}
            aria-label={leftPanelVisible ? '关闭组件库' : '打开组件库'}
            title={leftPanelVisible ? '关闭组件库' : '打开组件库'}
          >
            {isSmallScreen ? (
              <MenuIcon />
            ) : leftPanelVisible ? (
              <ChevronLeftIcon />
            ) : (
              <ChevronRightIcon />
            )}
          </Button>
        )}
        <LogoIcon />
        <button
          type="button"
          onClick={onClickProjectName}
          className={cn(
            'flex items-center gap-1.5 hover:bg-gray-100 active:bg-gray-200 rounded-lg px-2 py-1 transition-colors',
            onClickProjectName ? 'cursor-pointer' : 'cursor-default'
          )}
          disabled={!onClickProjectName}
        >
          <span className={cn(
            'font-semibold text-gray-900 truncate',
            isSmallScreen ? 'text-sm max-w-[120px]' : 'text-lg'
          )}>
            {projectName}
          </span>
          {onClickProjectName && (
            <ChevronDownIcon className="text-gray-400 flex-shrink-0" />
          )}
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center gap-1 hidden md:flex">
        <Button
          variant="ghost"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          className={cn('gap-1.5', !canUndo && 'opacity-50 cursor-not-allowed')}
          aria-label="撤销"
        >
          <UndoIcon />
          <span className="hidden lg:inline">撤销</span>
          <span className="hidden lg:inline text-xs text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
            {getKeyboardShortcutsInfo().undo.keyLabel}
          </span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRedo}
          disabled={!canRedo}
          className={cn('gap-1.5', !canRedo && 'opacity-50 cursor-not-allowed')}
          aria-label="重做"
        >
          <RedoIcon />
          <span className="hidden lg:inline">重做</span>
          <span className="hidden lg:inline text-xs text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
            {getKeyboardShortcutsInfo().redo.keyLabel}
          </span>
        </Button>
      </div>

      <div className="flex items-center gap-1 md:gap-2">
        {onToggleRightPanel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleRightPanel}
            className={cn(
              'p-1.5 h-auto w-auto',
              !isSmallScreen && 'mr-1',
              isSmallScreen && (rightPanelVisible ? 'bg-primary-100 text-primary-700' : '')
            )}
            aria-label={rightPanelVisible ? '关闭属性面板' : '打开属性面板'}
            title={rightPanelVisible ? '关闭属性面板' : '打开属性面板'}
          >
            {isSmallScreen ? (
              <SettingsIcon />
            ) : rightPanelVisible ? (
              <ChevronRightIcon />
            ) : (
              <ChevronLeftIcon />
            )}
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={onPreview}
          className={cn('gap-1.5', isSmallScreen && 'px-2 py-1')}
          aria-label="预览"
        >
          <PreviewIcon />
          <span className="hidden sm:inline">预览</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          className={cn('gap-1.5', isSmallScreen && 'px-2 py-1')}
          aria-label="导出"
        >
          <ExportIcon />
          <span className="hidden sm:inline">导出</span>
        </Button>
        <Button
          variant={getSaveButtonVariant()}
          color={getSaveButtonColor()}
          size="sm"
          onClick={onSave}
          disabled={saveStatus === 'saving'}
          className={cn(
            'gap-1.5',
            isSmallScreen && 'px-2 py-1',
            saveStatus === 'saving' && 'opacity-70 cursor-not-allowed'
          )}
          aria-label={saveStatus === 'saving' ? '保存中' : saveStatus === 'error' ? '重试保存' : '保存'}
        >
          {getSaveButtonContent()}
        </Button>
      </div>
    </header>
  );
};

export { Header };
export type { HeaderProps };
