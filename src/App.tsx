import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BuilderLayout } from '@/components/builder/Layout';
import { ComponentPanel } from '@/components/builder/ComponentPanel';
import { Canvas } from '@/components/builder/Canvas';
import { PropertyPanel } from '@/components/builder/PropertyPanel';
import { DndContextProvider } from '@/components/builder/DndContext';
import { useBuilderStore } from '@/store/useBuilderStore';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { 
  writeComponentToClipboard, 
  readComponentFromClipboard 
} from '@/utils/clipboard';
import { ToastProvider, useToast } from '@/components/ui';
import { downloadProject, calculateJSONSize, EXPORT_FILE_SIZE_WARNING_LIMIT } from '@/utils/import-export';
import { getStorageWarningMessage, formatStorageSize, estimateLocalStorageUsage } from '@/utils/validation';
import type { ComponentSchema } from '@/types/component';
import type { Project } from '@/utils/storage';

const findComponentById = (
  components: ComponentSchema[],
  id: string
): ComponentSchema | null => {
  for (const comp of components) {
    if (comp.id === id) {
      return comp;
    }
    if ('children' in comp && comp.children && comp.children.length > 0) {
      const found = findComponentById(comp.children, id);
      if (found) return found;
    }
  }
  return null;
};

function AppContent() {
  const navigate = useNavigate();
  const undo = useBuilderStore((state) => state.undo);
  const redo = useBuilderStore((state) => state.redo);
  const removeComponent = useBuilderStore((state) => state.removeComponent);
  const addComponent = useBuilderStore((state) => state.addComponent);
  const setSelectedComponentId = useBuilderStore((state) => state.setSelectedComponentId);
  const canUndo = useBuilderStore((state) => state.canUndo);
  const canRedo = useBuilderStore((state) => state.canRedo);
  const selectedComponentId = useBuilderStore((state) => state.selectedComponentId);
  const saveCurrentProject = useBuilderStore((state) => state.saveCurrentProject);
  const loadLatestProject = useBuilderStore((state) => state.loadLatestProject);
  const currentProjectId = useBuilderStore((state) => state.currentProjectId);
  const projectName = useBuilderStore((state) => state.projectName);
  const saveStatus = useBuilderStore((state) => state.saveStatus);
  const saveErrorMessage = useBuilderStore((state) => state.saveErrorMessage);
  const components = useBuilderStore((state) => state.components);
  const lastSavedAt = useBuilderStore((state) => state.lastSavedAt);
  
  const moveUp = useBuilderStore((state) => state.moveUp);
  const moveDown = useBuilderStore((state) => state.moveDown);
  const moveToTop = useBuilderStore((state) => state.moveToTop);
  const moveToBottom = useBuilderStore((state) => state.moveToBottom);
  const canMoveUp = useBuilderStore((state) => state.canMoveUp);
  const canMoveDown = useBuilderStore((state) => state.canMoveDown);
  
  const loadError = useBuilderStore((state) => state.loadError);
  const isProjectCorrupted = useBuilderStore((state) => state.isProjectCorrupted);
  const clearLoadError = useBuilderStore((state) => state.clearLoadError);

  const toast = useToast();
  const hasLoadedInitialProject = useRef(false);

  useAutoSave();

  const handleDelete = useCallback(() => {
    if (selectedComponentId) {
      removeComponent(selectedComponentId);
    }
  }, [selectedComponentId, removeComponent]);

  const handleCopy = useCallback(async () => {
    if (!selectedComponentId) {
      return;
    }
    
    const componentToCopy = findComponentById(components, selectedComponentId);
    if (!componentToCopy) {
      return;
    }
    
    const success = await writeComponentToClipboard(componentToCopy);
    if (success) {
      toast.success(`已复制: ${componentToCopy.type}`);
    }
  }, [selectedComponentId, components, toast]);

  const handlePaste = useCallback(async () => {
    const pastedComponent = await readComponentFromClipboard();
    if (!pastedComponent) {
      return;
    }
    
    addComponent(pastedComponent);
    setSelectedComponentId(pastedComponent.id);
    
    toast.success(`已粘贴: ${pastedComponent.type}`);
  }, [addComponent, setSelectedComponentId, toast]);

  useKeyboardShortcuts({
    onUndo: undo,
    onRedo: redo,
    onDelete: handleDelete,
    onCopy: handleCopy,
    onPaste: handlePaste,
    enabled: true,
  });

  useEffect(() => {
    if (hasLoadedInitialProject.current) {
      return;
    }
    hasLoadedInitialProject.current = true;
    
    if (!currentProjectId) {
      const hasProject = loadLatestProject();
      if (hasProject) {
        toast.info('已恢复上次编辑的项目');
      }
    }
  }, []);

  useEffect(() => {
    if (saveStatus === 'saved') {
      toast.success('项目已保存');
    } else if (saveStatus === 'error' && saveErrorMessage) {
      toast.error(saveErrorMessage);
    }
  }, [saveStatus, saveErrorMessage, toast]);

  useEffect(() => {
    if (loadError) {
      if (isProjectCorrupted) {
        toast.error(`项目数据损坏: ${loadError}，已创建新的空项目`);
      } else {
        toast.error(`加载失败: ${loadError}`);
      }
      clearLoadError();
    }
  }, [loadError, isProjectCorrupted, clearLoadError, toast]);

  useEffect(() => {
    const storageWarning = getStorageWarningMessage();
    if (storageWarning) {
      const usage = estimateLocalStorageUsage();
      toast.warning(
        `存储空间警告: 已使用 ${formatStorageSize(usage.usedBytes)} / ${formatStorageSize(usage.totalBytes)} (${(usage.usedPercentage * 100).toFixed(0)}%)`,
        8000
      );
    }
  }, [toast]);

  const handleUndo = useCallback(() => {
    undo();
  }, [undo]);

  const handleRedo = useCallback(() => {
    redo();
  }, [redo]);

  const handlePreview = useCallback(() => {
    navigate('/preview');
  }, [navigate]);

  const handleSave = useCallback(() => {
    saveCurrentProject(true);
  }, [saveCurrentProject]);

  const handleClickProjectName = useCallback(() => {
    saveCurrentProject(true);
    navigate('/projects');
  }, [saveCurrentProject, navigate]);

  const handleExport = useCallback(() => {
    const now = new Date().toISOString();
    const project: Project = {
      id: currentProjectId || `export_${Date.now()}`,
      name: projectName,
      components: [...components],
      createdAt: lastSavedAt || now,
      updatedAt: now,
    };

    const jsonString = JSON.stringify(project, null, 2);
    const fileSize = calculateJSONSize(jsonString);

    if (fileSize > EXPORT_FILE_SIZE_WARNING_LIMIT) {
      toast.warning(
        `项目文件较大 (${(fileSize / 1024 / 1024).toFixed(2)}MB)，导出可能需要较长时间`
      );
    }

    try {
      downloadProject(project);
      toast.success(`已导出: "${projectName}"`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : '导出失败，请重试'
      );
    }
  }, [components, currentProjectId, projectName, lastSavedAt, toast]);

  const handleMoveUp = useCallback(() => {
    if (selectedComponentId) {
      moveUp(selectedComponentId);
    }
  }, [selectedComponentId, moveUp]);

  const handleMoveDown = useCallback(() => {
    if (selectedComponentId) {
      moveDown(selectedComponentId);
    }
  }, [selectedComponentId, moveDown]);

  const handleMoveToTop = useCallback(() => {
    if (selectedComponentId) {
      moveToTop(selectedComponentId);
    }
  }, [selectedComponentId, moveToTop]);

  const handleMoveToBottom = useCallback(() => {
    if (selectedComponentId) {
      moveToBottom(selectedComponentId);
    }
  }, [selectedComponentId, moveToBottom]);

  const hasSelectedComponent = selectedComponentId !== null;
  const canMoveUpCurrent = selectedComponentId ? canMoveUp(selectedComponentId) : false;
  const canMoveDownCurrent = selectedComponentId ? canMoveDown(selectedComponentId) : false;

  return (
    <DndContextProvider>
      <BuilderLayout
        leftPanel={<ComponentPanel />}
        canvas={<Canvas />}
        rightPanel={<PropertyPanel />}
        projectName={projectName}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onMoveUp={handleMoveUp}
        onMoveDown={handleMoveDown}
        onMoveToTop={handleMoveToTop}
        onMoveToBottom={handleMoveToBottom}
        canMoveUp={canMoveUpCurrent}
        canMoveDown={canMoveDownCurrent}
        hasSelectedComponent={hasSelectedComponent}
        onPreview={handlePreview}
        onSave={handleSave}
        onExport={handleExport}
        saveStatus={saveStatus}
        onClickProjectName={handleClickProjectName}
      />
    </DndContextProvider>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
