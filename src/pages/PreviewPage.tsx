import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PreviewRenderer } from '@/components/builder/ComponentRenderer';
import { Button, Text } from '@/components/ui';
import { useBuilderStore } from '@/store/useBuilderStore';
import { DEFAULT_POSITION } from '@/constants/dnd';
import type { ComponentSchema, Page } from '@/types/component';
import { cn } from '@/utils/classname';
import { PreviewFormRegistryProvider } from '@/context/PreviewFormRegistry';
import { PreviewBindingProvider } from '@/context/PreviewBindingContext';
import { createEventEngine, type ActionExecutionContext } from '@/utils/eventEngine';

const getSizeValue = (value?: number | string): string | number | undefined => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number') return value;
  return value;
};

interface PreviewCanvasItemProps {
  component: ComponentSchema;
}

const PreviewCanvasItem: React.FC<PreviewCanvasItemProps> = ({ component }) => {
  const width = getSizeValue(component.width);
  const height = getSizeValue(component.height);

  const style: React.CSSProperties = {
    position: 'absolute',
    left: component.x ?? DEFAULT_POSITION.X,
    top: component.y ?? DEFAULT_POSITION.Y,
    width,
    height,
  };

  return (
    <div style={style}>
      <PreviewRenderer component={component} />
    </div>
  );
};

const ArrowLeftIcon = () => (
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
    <path d="M19 12H5" />
    <path d="M12 19l-7-7 7-7" />
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

const HomeIcon = () => (
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
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

interface EmptyStateProps {
  message?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ message = '画布为空' }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
    <div className="text-6xl">📄</div>
    <div className="text-center">
      <h3 className="text-xl font-semibold text-gray-700 mb-2">{message}</h3>
      <p className="text-gray-500">从编辑器添加组件后在此预览</p>
    </div>
  </div>
);

interface PageNavigationProps {
  currentPage: Page | undefined;
  pages: Page[];
  onNavigateToPage: (pageId: string) => void;
  onNavigateToHome: () => void;
  canGoHome: boolean;
}

const PageNavigation: React.FC<PageNavigationProps> = ({
  currentPage,
  pages,
  onNavigateToPage,
  onNavigateToHome,
  canGoHome,
}) => {
  return (
    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={onNavigateToHome}
        disabled={!canGoHome}
        className={cn(
          'p-1.5 h-auto',
          !canGoHome && 'opacity-50 cursor-not-allowed'
        )}
        title="返回首页"
      >
        <HomeIcon />
      </Button>
      <Text variant="body-sm" color="muted" className="text-xs">
        当前页面:
      </Text>
      <Text variant="body-sm" weight="semibold" className="text-sm">
        {currentPage?.name || '首页'}
      </Text>
      {pages.length > 1 && (
        <div className="ml-auto flex items-center gap-1">
          <Text variant="caption" color="muted" className="text-xs hidden sm:inline">
            快速跳转:
          </Text>
          <select
            value={currentPage?.id || ''}
            onChange={(e) => onNavigateToPage(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
          >
            {pages.map((page) => (
              <option key={page.id} value={page.id}>
                {page.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export const PreviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project');

  const storeComponents = useBuilderStore((state) => state.components);
  const storePages = useBuilderStore((state) => state.pages);
  const storeCurrentPageId = useBuilderStore((state) => state.currentPageId);
  const projectName = useBuilderStore((state) => state.projectName);
  const loadProject = useBuilderStore((state) => state.loadProject);
  const isCurrentProject = useBuilderStore((state) => state.isCurrentProject);
  const bindingRules = useBuilderStore((state) => state.bindings);

  const [previewPageId, setPreviewPageId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const loadedProjectRef = useRef<string | null>(null);
  const navigationHistoryRef = useRef<string[]>([]);

  useEffect(() => {
    if (projectId && projectId !== loadedProjectRef.current && !isCurrentProject(projectId)) {
      loadedProjectRef.current = projectId;
      setIsLoading(true);
      setLoadError(null);
      const success = loadProject(projectId);
      if (!success) {
        setLoadError('无法加载指定的项目');
      }
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (storeCurrentPageId && previewPageId === null) {
      setPreviewPageId(storeCurrentPageId);
      navigationHistoryRef.current = [storeCurrentPageId];
    }
  }, [storeCurrentPageId, previewPageId]);

  const handleNavigateToPage = useCallback(
    (pageId: string) => {
      if (!pageId) return;

      const targetPage = storePages.find((p) => p.id === pageId);
      if (!targetPage) {
        console.warn('目标页面不存在:', pageId);
        return;
      }

      setPreviewPageId(pageId);

      if (navigationHistoryRef.current[navigationHistoryRef.current.length - 1] !== pageId) {
        navigationHistoryRef.current.push(pageId);
      }
    },
    [storePages]
  );

  const handleNavigateToHome = useCallback(() => {
    if (storePages.length === 0) return;

    const homePage =
      storePages.find((p) => p.isHome) ||
      storePages[0];

    if (homePage && homePage.id !== previewPageId) {
      setPreviewPageId(homePage.id);
      navigationHistoryRef.current = [homePage.id];
    }
  }, [storePages, previewPageId]);

  const currentPage = storePages.find((p) => p.id === previewPageId);
  const currentComponents = currentPage?.components || storeComponents;
  const canGoHome = storePages.length > 0 && previewPageId !== (storePages.find((p) => p.isHome)?.id || storePages[0]?.id);

  const actionContext: ActionExecutionContext = {
    navigateToPage: handleNavigateToPage,
  };

  useEffect(() => {
    const eventEngine = createEventEngine(actionContext);
    (window as any).__previewEventEngine = eventEngine;
    (window as any).__previewActionContext = actionContext;
  }, [actionContext]);

  const handleBackToEdit = () => {
    navigate('/builder');
  };

  const handleBackToProjects = () => {
    navigate('/projects');
  };

  const displayProjectName = projectId && !isCurrentProject(projectId)
    ? '加载中...'
    : projectName;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToEdit}
              className="p-2 gap-2"
            >
              <ArrowLeftIcon />
              <span className="hidden sm:inline">返回编辑</span>
            </Button>
            <div className="flex items-center gap-2">
              <PreviewIcon />
              <h1 className="text-lg font-bold text-gray-900">预览模式</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden sm:inline">
              {displayProjectName}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackToProjects}
            >
              项目列表
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <div className="flex-1 mx-2">
                <div className="bg-white rounded-md px-3 py-1 text-xs text-gray-500 text-center border border-gray-200">
                  预览: {currentPage?.name || '首页'}
                </div>
              </div>
            </div>

            {storePages.length > 1 && (
              <PageNavigation
                currentPage={currentPage}
                pages={storePages}
                onNavigateToPage={handleNavigateToPage}
                onNavigateToHome={handleNavigateToHome}
                canGoHome={canGoHome}
              />
            )}

            <div
              className={cn(
                'min-h-[600px] relative',
                'bg-white'
              )}
              style={{ minHeight: '600px' }}
            >
              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-4">⏳</div>
                    <p className="text-gray-500">加载项目中...</p>
                  </div>
                </div>
              ) : loadError ? (
                <EmptyState message={loadError} />
              ) : currentComponents.length === 0 ? (
                <EmptyState />
              ) : (
                <PreviewBindingProvider bindingRules={bindingRules}>
                  <PreviewFormRegistryProvider>
                    <div className="absolute inset-0 p-2">
                      {currentComponents.map((component) => (
                        <PreviewCanvasItem
                          key={component.id}
                          component={component}
                        />
                      ))}
                    </div>
                  </PreviewFormRegistryProvider>
                </PreviewBindingProvider>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PreviewPage;
