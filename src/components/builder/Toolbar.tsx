import { Button, Container } from '@/components/ui';
import { cn } from '@/utils/classname';

interface ToolbarProps {
  className?: string;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onPreview?: () => void;
  onSave?: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  className,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onPreview,
  onSave,
}) => {
  return (
    <div className={cn('bg-white border-b border-gray-200 px-4 py-2', className)}>
      <Container direction="row" gap="md" justify="between" align="center">
        <Container direction="row" gap="md">
          <Button
            variant="outline"
            size="sm"
            onClick={onUndo}
            disabled={!canUndo}
            className={cn(!canUndo && 'opacity-50 cursor-not-allowed')}
          >
            撤销
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRedo}
            disabled={!canRedo}
            className={cn(!canRedo && 'opacity-50 cursor-not-allowed')}
          >
            重做
          </Button>
        </Container>

        <Container direction="row" gap="md">
          <Button variant="outline" size="sm" onClick={onPreview}>
            预览
          </Button>
          <Button variant="primary" size="sm" onClick={onSave}>
            保存
          </Button>
        </Container>
      </Container>
    </div>
  );
};

export { Toolbar };
export type { ToolbarProps };
