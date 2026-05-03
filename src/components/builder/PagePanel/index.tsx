import { useState } from 'react';
import { Text, Button, Input } from '@/components/ui';
import { cn } from '@/utils/classname';
import { useBuilderStore } from '@/store/useBuilderStore';
import { DEFAULT_HOME_PAGE_ID } from '@/types/component';

interface PagePanelProps {
  className?: string;
}

const PagePanel: React.FC<PagePanelProps> = ({ className }) => {
  const { 
    pages, 
    currentPageId, 
    switchToPage, 
    addPage, 
    removePage, 
    renamePage,
    getPages,
  } = useBuilderStore();

  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleAddPage = () => {
    const newPageId = addPage('新页面');
    setEditingPageId(newPageId);
    setEditingName('新页面');
  };

  const handleRemovePage = (pageId: string) => {
    if (pages.length <= 1) {
      return;
    }
    removePage(pageId);
  };

  const handleStartEdit = (pageId: string, pageName: string) => {
    setEditingPageId(pageId);
    setEditingName(pageName);
  };

  const handleCancelEdit = () => {
    setEditingPageId(null);
    setEditingName('');
  };

  const handleSaveEdit = (pageId: string) => {
    if (editingName.trim()) {
      renamePage(pageId, editingName.trim());
    }
    setEditingPageId(null);
    setEditingName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, pageId: string) => {
    if (e.key === 'Enter') {
      handleSaveEdit(pageId);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const currentPages = getPages();

  return (
    <div className={cn('p-4 border-b border-gray-200', className)}>
      <div className="flex items-center justify-between mb-3">
        <Text variant="h3" weight="semibold">
          页面
        </Text>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddPage}
          className="p-1.5 h-auto"
          title="添加新页面"
        >
          <span className="text-lg">+</span>
        </Button>
      </div>

      <div className="space-y-1">
        {currentPages.map((page) => (
          <div
            key={page.id}
            className={cn(
              'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer group',
              'hover:bg-gray-100 transition-colors duration-150',
              page.id === currentPageId
                ? 'bg-primary-50 text-primary-700 border border-primary-200'
                : 'border border-transparent'
            )}
          >
            <span className="text-sm">
              {page.isHome || page.id === DEFAULT_HOME_PAGE_ID ? '🏠' : '📄'}
            </span>

            {editingPageId === page.id ? (
              <div className="flex-1 flex items-center gap-1">
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, page.id)}
                  className="h-7 text-sm py-1 px-2"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSaveEdit(page.id)}
                  className="p-1 h-auto text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  ✓
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="p-1 h-auto text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                >
                  ✕
                </Button>
              </div>
            ) : (
              <>
                <div
                  className="flex-1"
                  onClick={() => {
                    if (page.id !== currentPageId) {
                      switchToPage(page.id);
                    }
                  }}
                  onDoubleClick={() => handleStartEdit(page.id, page.name)}
                >
                  <Text
                    variant="body-sm"
                    weight={page.id === currentPageId ? 'semibold' : 'normal'}
                    className="truncate"
                  >
                    {page.name}
                  </Text>
                </div>

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStartEdit(page.id, page.name)}
                    className="p-1 h-auto text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    title="重命名"
                  >
                    ✏️
                  </Button>
                  {currentPages.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemovePage(page.id)}
                      className="p-1 h-auto text-red-400 hover:text-red-600 hover:bg-red-50"
                      title="删除页面"
                    >
                      🗑️
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <Text variant="caption" color="muted" className="mt-3 block text-xs text-gray-500">
        单击切换页面，双击重命名
      </Text>
    </div>
  );
};

export { PagePanel };
export type { PagePanelProps };
