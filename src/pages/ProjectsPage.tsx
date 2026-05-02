import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBuilderStore } from '@/store/useBuilderStore';
import { useToast, ConfirmModal, InputModal, Button } from '@/components/ui';
import { renameProject } from '@/utils/storage';
import type { ProjectMetadata } from '@/utils/storage';
import { cn } from '@/utils/classname';

const formatDate = (isoString: string): string => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins} 分钟前`;
  if (diffHours < 24) return `${diffHours} 小时前`;
  if (diffDays < 7) return `${diffDays} 天前`;

  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

interface ProjectCardProps {
  project: ProjectMetadata;
  isCurrent: boolean;
  onOpen: () => void;
  onRename: () => void;
  onDelete: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  isCurrent,
  onOpen,
  onRename,
  onDelete,
}) => {
  return (
    <div
      className={cn(
        'group relative bg-white rounded-xl border-2 transition-all duration-200',
        isCurrent
          ? 'border-primary-500 shadow-lg shadow-primary-100'
          : 'border-gray-200 hover:border-primary-300 hover:shadow-md cursor-pointer'
      )}
      onClick={isCurrent ? undefined : onOpen}
    >
      {isCurrent && (
        <div className="absolute -top-2 -right-2 bg-primary-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
          当前打开
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate text-lg">
              {project.name}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {project.componentCount} 个组件
            </p>
          </div>
          <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onRename();
              }}
              className="p-1.5 h-auto"
              title="重命名"
            >
              <RenameIcon />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 h-auto text-red-600 hover:bg-red-50"
              title="删除"
            >
              <TrashIcon />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <ClockIcon />
            <span>{formatDate(project.updatedAt)}</span>
          </div>
          <Button
            variant={isCurrent ? 'secondary' : 'primary'}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            className={cn(isCurrent && 'bg-primary-50 text-primary-700')}
          >
            {isCurrent ? '继续编辑' : '打开'}
          </Button>
        </div>
      </div>
    </div>
  );
};

interface EmptyStateProps {
  onNewProject: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onNewProject }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-gray-400"
      >
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <path d="M3 6h18" />
        <path d="M16 10H8" />
        <path d="M16 14H8" />
      </svg>
    </div>
    <h3 className="text-xl font-semibold text-gray-900 mb-2">还没有项目</h3>
    <p className="text-gray-500 mb-6 max-w-sm">
      创建您的第一个低代码项目，开始拖拽构建页面
    </p>
    <Button variant="primary" size="lg" onClick={onNewProject}>
      <PlusIcon />
      新建项目
    </Button>
  </div>
);

const RenameIcon = () => (
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
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);

const TrashIcon = () => (
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
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

const PlusIcon = () => (
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
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
);

const ClockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

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

const LoaderIcon = () => (
  <svg
    className="animate-spin"
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
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [projects, setProjects] = useState<ProjectMetadata[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectMetadata | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [projectToRename, setProjectToRename] = useState<ProjectMetadata | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);

  const listProjects = useBuilderStore((state) => state.listProjects);
  const saveCurrentAndLoadProject = useBuilderStore((state) => state.saveCurrentAndLoadProject);
  const saveCurrentAndCreateNewProject = useBuilderStore((state) => state.saveCurrentAndCreateNewProject);
  const deleteProjectById = useBuilderStore((state) => state.deleteProjectById);
  const renameCurrentProject = useBuilderStore((state) => state.renameCurrentProject);
  const isCurrentProject = useBuilderStore((state) => state.isCurrentProject);
  const currentProjectId = useBuilderStore((state) => state.currentProjectId);

  const refreshProjects = useCallback(() => {
    const list = listProjects();
    setProjects(list);
  }, [listProjects]);

  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  const handleNewProject = () => {
    setIsCreating(true);
    try {
      saveCurrentAndCreateNewProject(`项目 ${projects.length + 1}`);
      toast.success('项目创建成功');
      navigate('/builder');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '创建项目失败');
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenProject = (project: ProjectMetadata) => {
    const success = saveCurrentAndLoadProject(project.id);
    if (success) {
      toast.success('已切换到项目：' + project.name);
      navigate('/builder');
    } else {
      toast.error('无法打开该项目');
    }
  };

  const handleRenameClick = (project: ProjectMetadata) => {
    setProjectToRename(project);
    setRenameModalOpen(true);
  };

  const handleRenameSubmit = (newName: string) => {
    if (!projectToRename) return;

    setIsRenaming(true);

    try {
      if (isCurrentProject(projectToRename.id)) {
        renameCurrentProject(newName);
      } else {
        renameProject(projectToRename.id, newName);
      }

      toast.success('项目已重命名');
      setRenameModalOpen(false);
      setProjectToRename(null);
      refreshProjects();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '重命名失败');
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDeleteClick = (project: ProjectMetadata) => {
    setProjectToDelete(project);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!projectToDelete) return;

    setIsDeleting(true);

    try {
      const success = deleteProjectById(projectToDelete.id);
      if (success) {
        toast.success('项目已删除');
        
        if (projectToDelete.id === currentProjectId) {
          navigate('/projects');
        }
        
        setDeleteModalOpen(false);
        setProjectToDelete(null);
        refreshProjects();
      } else {
        throw new Error('删除失败');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '删除项目失败');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/builder')}
              className="p-2"
            >
              <ArrowLeftIcon />
            </Button>
            <h1 className="text-xl font-bold text-gray-900">项目管理</h1>
          </div>
          <Button
            variant="primary"
            onClick={handleNewProject}
            disabled={isCreating}
          >
            {isCreating ? <LoaderIcon /> : <PlusIcon />}
            {isCreating ? '创建中...' : '新建项目'}
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {projects.length === 0 ? (
          <EmptyState onNewProject={handleNewProject} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isCurrent={isCurrentProject(project.id)}
                onOpen={() => handleOpenProject(project)}
                onRename={() => handleRenameClick(project)}
                onDelete={() => handleDeleteClick(project)}
              />
            ))}
          </div>
        )}
      </main>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setProjectToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="确认删除项目"
        message={
          <div className="space-y-2">
            <p>确定要删除 "<strong>{projectToDelete?.name}</strong>" 吗？</p>
            <p className="text-sm text-gray-500">
              此操作不可撤销，项目及其所有组件数据将被永久删除。
            </p>
          </div>
        }
        confirmText="删除"
        confirmVariant="danger"
        isLoading={isDeleting}
      />

      <InputModal
        isOpen={renameModalOpen}
        onClose={() => {
          setRenameModalOpen(false);
          setProjectToRename(null);
        }}
        onSubmit={handleRenameSubmit}
        title="重命名项目"
        label="项目名称"
        initialValue={projectToRename?.name || ''}
        placeholder="请输入项目名称"
        confirmText="确认"
        isLoading={isRenaming}
        validate={(value) => {
          if (!value.trim()) {
            return '项目名称不能为空';
          }
          if (value.trim().length > 50) {
            return '项目名称不能超过 50 个字符';
          }
          return null;
        }}
      />
    </div>
  );
};

export default ProjectsPage;
