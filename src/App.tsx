import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BuilderLayout } from '@/components/builder/Layout';
import { ComponentPanel } from '@/components/builder/ComponentPanel';
import { Canvas } from '@/components/builder/Canvas';
import { PropertyPanel } from '@/components/builder/PropertyPanel';
import { DndContextProvider } from '@/components/builder/DndContext';
import { useBuilderStore } from '@/store/useBuilderStore';
import { useAutoSave } from '@/hooks/useAutoSave';
import { ToastProvider, useToast } from '@/components/ui';
import { downloadProject, calculateJSONSize, EXPORT_FILE_SIZE_WARNING_LIMIT } from '@/utils/import-export';
import type { Project } from '@/utils/storage';

function AppContent() {
  const navigate = useNavigate();
  const undo = useBuilderStore((state) => state.undo);
  const redo = useBuilderStore((state) => state.redo);
  const canUndo = useBuilderStore((state) => state.canUndo);
  const canRedo = useBuilderStore((state) => state.canRedo);
  const saveCurrentProject = useBuilderStore((state) => state.saveCurrentProject);
  const loadLatestProject = useBuilderStore((state) => state.loadLatestProject);
  const projectName = useBuilderStore((state) => state.projectName);
  const saveStatus = useBuilderStore((state) => state.saveStatus);
  const saveErrorMessage = useBuilderStore((state) => state.saveErrorMessage);
  const components = useBuilderStore((state) => state.components);
  const currentProjectId = useBuilderStore((state) => state.currentProjectId);
  const lastSavedAt = useBuilderStore((state) => state.lastSavedAt);

  const toast = useToast();

  useAutoSave();

  useEffect(() => {
    const hasProject = loadLatestProject();
    if (hasProject) {
      toast.info('已恢复上次编辑的项目');
    }
  }, [loadLatestProject, toast]);

  useEffect(() => {
    if (saveStatus === 'saved') {
      toast.success('项目已保存');
    } else if (saveStatus === 'error' && saveErrorMessage) {
      toast.error(saveErrorMessage);
    }
  }, [saveStatus, saveErrorMessage, toast]);

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
