import { BuilderLayout } from '@/components/builder/Layout';
import { ComponentPanel } from '@/components/builder/ComponentPanel';
import { Canvas } from '@/components/builder/Canvas';
import { PropertyPanel } from '@/components/builder/PropertyPanel';
import { DndContextProvider } from '@/components/builder/DndContext';
import { useBuilderStore } from '@/store/useBuilderStore';

function App() {
  const undo = useBuilderStore((state) => state.undo);
  const redo = useBuilderStore((state) => state.redo);
  const canUndo = useBuilderStore((state) => state.canUndo);
  const canRedo = useBuilderStore((state) => state.canRedo);

  const handleUndo = () => {
    undo();
  };

  const handleRedo = () => {
    redo();
  };

  const handlePreview = () => {
    console.log('预览操作');
  };

  const handleSave = () => {
    console.log('保存操作');
  };

  return (
    <DndContextProvider>
      <BuilderLayout
        leftPanel={<ComponentPanel />}
        canvas={<Canvas />}
        rightPanel={<PropertyPanel />}
        projectName="低代码平台项目"
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onPreview={handlePreview}
        onSave={handleSave}
      />
    </DndContextProvider>
  );
}

export default App;
