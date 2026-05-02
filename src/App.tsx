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
    console.log('预览操作');
  }, []);

  const handleSave = useCallback(() => {
    saveCurrentProject(true);
  }, [saveCurrentProject]);

  const handleClickProjectName = useCallback(() => {
    saveCurrentProject(true);
    navigate('/projects');
  }, [saveCurrentProject, navigate]);

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
