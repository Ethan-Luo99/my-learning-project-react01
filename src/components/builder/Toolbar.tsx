import * as React from 'react';
import { Button, Container } from '@/components/ui';
import { cn } from '@/utils/classname';

interface ToolbarProps {
  className?: string;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onMoveToTop?: () => void;
  onMoveToBottom?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  hasSelectedComponent?: boolean;
  onPreview?: () => void;
  onSave?: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  className,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onMoveUp,
  onMoveDown,
  onMoveToTop,
  onMoveToBottom,
  canMoveUp = false,
  canMoveDown = false,
  hasSelectedComponent = false,
  onPreview,
  onSave,
}) => {
  return (
    <div className={cn('bg-white border-b border-gray-200 px-4 py-2', className)}>
      <Container direction="row" gap="md" justify="between" align="center">
        <Container direction="row" gap="sm">
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
          
          <div className="w-px h-6 bg-gray-300 mx-1" />
          
          <Button
            variant="outline"
            size="sm"
            onClick={onMoveToTop}
            disabled={!hasSelectedComponent || !canMoveUp}
            className={cn(
              (!hasSelectedComponent || !canMoveUp) && 'opacity-50 cursor-not-allowed'
            )}
          >
            置顶
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onMoveUp}
            disabled={!hasSelectedComponent || !canMoveUp}
            className={cn(
              (!hasSelectedComponent || !canMoveUp) && 'opacity-50 cursor-not-allowed'
            )}
          >
            上移
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onMoveDown}
            disabled={!hasSelectedComponent || !canMoveDown}
            className={cn(
              (!hasSelectedComponent || !canMoveDown) && 'opacity-50 cursor-not-allowed'
            )}
          >
            下移
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onMoveToBottom}
            disabled={!hasSelectedComponent || !canMoveDown}
            className={cn(
              (!hasSelectedComponent || !canMoveDown) && 'opacity-50 cursor-not-allowed'
            )}
          >
            置底
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
