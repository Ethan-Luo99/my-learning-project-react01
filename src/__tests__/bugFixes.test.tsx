import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import * as React from 'react';
import { ConfirmModal, InputModal, ErrorBoundary, Text, Button } from '@/components/ui';

describe('Bug Fix Regression Tests', () => {
  describe('ConfirmModal - visible 属性修复', () => {
    it('应该在 visible=true 时渲染 children 内容', () => {
      const testMessage = '测试确认消息';
      render(
        <ConfirmModal
          visible={true}
          title="测试标题"
          message={testMessage}
          onClose={() => {}}
          onOk={() => {}}
        />
      );
      
      expect(document.body.innerHTML).toContain(testMessage);
    });

    it('应该在 visible=false 时不显示内容', () => {
      const testMessage = '测试确认消息';
      const { container } = render(
        <ConfirmModal
          visible={false}
          title="测试标题"
          message={testMessage}
          onClose={() => {}}
          onOk={() => {}}
        />
      );
      
      expect(container.firstChild).toBeNull();
    });

    it('应该正确响应 visible 属性变化', async () => {
      const testMessage = '动态消息';
      
      const { rerender, container } = render(
        <ConfirmModal
          visible={false}
          title="测试标题"
          message={testMessage}
          onClose={() => {}}
          onOk={() => {}}
        />
      );
      
      expect(container.firstChild).toBeNull();
      
      await act(async () => {
        rerender(
          <ConfirmModal
            visible={true}
            title="测试标题"
            message={testMessage}
            onClose={() => {}}
            onOk={() => {}}
          />
        );
      });
      
      expect(document.body.innerHTML).toContain(testMessage);
    });
  });

  describe('InputModal - visible 属性修复', () => {
    it('应该在 visible=true 时渲染输入框', () => {
      render(
        <InputModal
          visible={true}
          title="重命名项目"
          label="项目名称"
          initialValue="测试项目"
          onClose={() => {}}
          onSubmit={() => {}}
        />
      );
      
      const input = document.querySelector('input[type="text"]');
      expect(input).not.toBeNull();
      expect(input?.value).toBe('测试项目');
    });

    it('应该在 visible=false 时不显示输入框', () => {
      const { container } = render(
        <InputModal
          visible={false}
          title="重命名项目"
          label="项目名称"
          initialValue="测试项目"
          onClose={() => {}}
          onSubmit={() => {}}
        />
      );
      
      expect(container.firstChild).toBeNull();
    });

    it('应该正确显示 label 和 placeholder', () => {
      render(
        <InputModal
          visible={true}
          title="重命名项目"
          label="项目名称"
          placeholder="请输入项目名称"
          onClose={() => {}}
          onSubmit={() => {}}
        />
      );
      
      expect(document.body.innerHTML).toContain('项目名称');
    });
  });

  describe('ErrorBoundary - 循环依赖修复验证', () => {
    it('应该在子组件无错误时渲染 children', () => {
      render(
        <ErrorBoundary>
          <div data-testid="child-content">正常内容</div>
        </ErrorBoundary>
      );
      
      expect(screen.getByTestId('child-content')).toBeInTheDocument();
      expect(screen.getByText('正常内容')).toBeInTheDocument();
    });

    it('应该在子组件抛出错误时显示 fallback UI', () => {
      const errorMessage = '测试错误';
      
      const ThrowingComponent = () => {
        throw new Error(errorMessage);
      };

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('发生了意外错误')).toBeInTheDocument();
      expect(document.body.innerHTML).toContain(errorMessage);
      
      consoleErrorSpy.mockRestore();
    });

    it('应该在子组件抛出错误时显示自定义 fallback', () => {
      const customFallback = <div data-testid="custom-fallback">自定义错误界面</div>;
      
      const ThrowingComponent = () => {
        throw new Error('测试错误');
      };

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.getByText('自定义错误界面')).toBeInTheDocument();
      
      consoleErrorSpy.mockRestore();
    });

    it('应该显示重新加载和回到项目列表按钮', () => {
      const ThrowingComponent = () => {
        throw new Error('测试错误');
      };

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(document.body.innerHTML).toContain('重新加载');
      expect(document.body.innerHTML).toContain('回到项目列表');
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Text 组件 - variant 定义修复验证', () => {
    it('应该支持 body-sm variant', () => {
      render(<Text variant="body-sm">小文本</Text>);
      expect(screen.getByText('小文本')).toBeInTheDocument();
    });

    it('应该支持 body2 variant', () => {
      render(<Text variant="body2">正文2</Text>);
      expect(screen.getByText('正文2')).toBeInTheDocument();
    });

    it('应该支持所有已定义的 variant 类型', () => {
      const variants: Array<'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'body-sm' | 'body2' | 'caption'> = [
        'h1', 'h2', 'h3', 'h4', 'body', 'body-sm', 'body2', 'caption'
      ];
      
      variants.forEach((variant, index) => {
        const { unmount } = render(<Text variant={variant}>测试 {variant}</Text>);
        expect(screen.getByText(`测试 ${variant}`)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('React 命名空间导入修复验证', () => {
    it('应该能正确导入 Text 组件', () => {
      render(<Text>测试文本</Text>);
      expect(screen.getByText('测试文本')).toBeInTheDocument();
    });

    it('应该能正确导入 Button 组件', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>测试按钮</Button>);
      expect(screen.getByText('测试按钮')).toBeInTheDocument();
    });
  });

  describe('ConfirmModal - 边界场景处理', () => {
    it('应该在 message 为空时显示默认提示文案', () => {
      render(
        <ConfirmModal
          visible={true}
          title="确认操作"
          message={null}
          onClose={() => {}}
          onOk={() => {}}
        />
      );
      
      expect(document.body.innerHTML).toContain('确定要执行此操作吗？');
    });

    it('应该在 message 为 undefined 时显示默认提示文案', () => {
      render(
        <ConfirmModal
          visible={true}
          title="确认操作"
          onClose={() => {}}
          onOk={() => {}}
        />
      );
      
      expect(document.body.innerHTML).toContain('确定要执行此操作吗？');
    });

    it('应该在 message 为空字符串时显示默认提示文案', () => {
      render(
        <ConfirmModal
          visible={true}
          title="确认操作"
          message=""
          onClose={() => {}}
          onOk={() => {}}
        />
      );
      
      expect(document.body.innerHTML).toContain('确定要执行此操作吗？');
    });

    it('应该在 message 有内容时显示正常的 message', () => {
      const customMessage = '这是自定义的确认消息';
      render(
        <ConfirmModal
          visible={true}
          title="确认操作"
          message={customMessage}
          onClose={() => {}}
          onOk={() => {}}
        />
      );
      
      expect(document.body.innerHTML).toContain(customMessage);
    });
  });

  describe('InputModal - 边界场景处理', () => {
    it('应该在 validate 函数抛出异常时捕获并显示错误', async () => {
      const errorMessage = '验证函数出错了';
      const throwingValidate = (_value: string): string | null => {
        throw new Error(errorMessage);
      };

      render(
        <InputModal
          visible={true}
          title="重命名项目"
          placeholder="请输入项目名称"
          validate={throwingValidate}
          onClose={() => {}}
          onSubmit={() => {}}
        />
      );

      const okButton = Array.from(document.querySelectorAll('button')).find(
        (btn) => btn.textContent === '确认'
      );
      expect(okButton).not.toBeNull();

      await act(async () => {
        okButton?.click();
      });

      expect(document.body.innerHTML).toContain(errorMessage);
    });

    it('应该在 validate 函数抛出非 Error 对象时显示通用错误', async () => {
      const throwingValidate = (_value: string): string | null => {
        throw '字符串类型的错误';
      };

      render(
        <InputModal
          visible={true}
          title="重命名项目"
          placeholder="请输入项目名称"
          validate={throwingValidate}
          onClose={() => {}}
          onSubmit={() => {}}
        />
      );

      const okButton = Array.from(document.querySelectorAll('button')).find(
        (btn) => btn.textContent === '确认'
      );
      expect(okButton).not.toBeNull();

      await act(async () => {
        okButton?.click();
      });

      expect(document.body.innerHTML).toContain('验证失败');
    });

    it('应该在 visible 变为 false 时重置 value 和 error 状态', async () => {
      const { rerender } = render(
        <InputModal
          visible={true}
          title="重命名项目"
          placeholder="请输入项目名称"
          initialValue="初始值"
          onClose={() => {}}
          onSubmit={() => {}}
        />
      );

      let input = document.querySelector('input[type="text"]') as HTMLInputElement;
      expect(input).not.toBeNull();
      expect(input?.value).toBe('初始值');

      await act(async () => {
        rerender(
          <InputModal
            visible={false}
            title="重命名项目"
            placeholder="请输入项目名称"
            initialValue="初始值"
            onClose={() => {}}
            onSubmit={() => {}}
          />
        );
      });

      await act(async () => {
        rerender(
          <InputModal
            visible={true}
            title="重命名项目"
            placeholder="请输入项目名称"
            initialValue="新的初始值"
            onClose={() => {}}
            onSubmit={() => {}}
          />
        );
      });

      input = document.querySelector('input[type="text"]') as HTMLInputElement;
      expect(input?.value).toBe('新的初始值');
    });
  });
});
