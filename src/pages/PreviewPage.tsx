import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PreviewRenderer } from '@/components/builder/ComponentRenderer';
import { Button } from '@/components/ui';
import { useBuilderStore } from '@/store/useBuilderStore';
import { DEFAULT_POSITION } from '@/constants/dnd';
import type { ComponentSchema } from '@/types/component';
import { cn } from '@/utils/classname';

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

export const PreviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project');

  const components = useBuilderStore((state) => state.components);
  const projectName = useBuilderStore((state) => state.projectName);
  const loadProject = useBuilderStore((state) => state.loadProject);
  const isCurrentProject = useBuilderStore((state) => state.isCurrentProject);

  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const loadedProjectRef = useRef<string | null>(null);

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
                  预览页面
                </div>
              </div>
            </div>

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
              ) : components.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="absolute inset-0 p-2">
                  {components.map((component) => (
                    <PreviewCanvasItem
                      key={component.id}
                      component={component}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PreviewPage;
