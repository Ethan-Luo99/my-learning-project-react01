import { BuilderLayout } from '@/components/builder/Layout';
import { ComponentPanel } from '@/components/builder/ComponentPanel';
import { Canvas } from '@/components/builder/Canvas';
import { PropertyPanel } from '@/components/builder/PropertyPanel';

function App() {
  const handleUndo = () => {
    console.log('撤销操作');
  };

  const handleRedo = () => {
    console.log('重做操作');
  };

  const handlePreview = () => {
    console.log('预览操作');
  };

  const handleSave = () => {
    console.log('保存操作');
  };

  return (
    <BuilderLayout
      leftPanel={<ComponentPanel />}
      canvas={<Canvas />}
      rightPanel={<PropertyPanel />}
      projectName="低代码平台项目"
      onUndo={handleUndo}
      onRedo={handleRedo}
      onPreview={handlePreview}
      onSave={handleSave}
    />
  );
}

export default App;
