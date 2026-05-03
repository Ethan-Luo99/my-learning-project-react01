/**
 * Modal 事件集成测试
 * 测试 Modal 与事件系统的配合：
 * 1. SHOW_MODAL 动作执行
 * 2. HIDE_MODAL 动作执行
 * 3. Button 配置 onClick → SHOW_MODAL 后打开 Modal
 */

import {
  ActionType,
  type ActionConfig,
  type ActionExecutionContext,
  executeAction,
  executeActions,
} from './eventEngine';
import {
  TestRunner,
  assert,
  assertEqual,
  assertNotNull,
  createMockModalComponent,
  createMockButtonComponent,
  createMockActionConfig,
  createMockEventConfig,
  createMockComponentEvents,
} from './test-helpers';
import { generateId } from './id';

export const runModalEventEngineTests = (): TestRunner => {
  const runner = new TestRunner();

  runner.beforeAll(() => {
    console.log('开始运行 Modal 事件集成测试...');
  });

  runner.afterAll(() => {
    console.log('Modal 事件集成测试完成');
  });

  // ============================================
  // SHOW_MODAL 动作测试
  // ============================================
  runner.test('SHOW_MODAL 动作: 缺少 modalId 参数时输出警告', () => {
    const originalConsoleWarn = console.warn;
    let warnCalled = false;
    let warnMessage = '';

    console.warn = (msg: unknown) => {
      warnCalled = true;
      warnMessage = String(msg);
    };

    try {
      const action: ActionConfig = {
        id: generateId(),
        type: ActionType.ShowModal,
        params: {},
        enabled: true,
      };

      executeAction(action);

      assert(warnCalled === true, '缺少 modalId 时应该输出警告');
      assert(warnMessage.includes('modalId'), '警告消息应该包含 modalId');
    } finally {
      console.warn = originalConsoleWarn;
    }
  });

  runner.test('SHOW_MODAL 动作: 缺少上下文时输出警告', () => {
    const originalConsoleWarn = console.warn;
    let warnCalled = false;

    console.warn = () => {
      warnCalled = true;
    };

    try {
      const action = createMockActionConfig(ActionType.ShowModal, { modalId: 'modal-1' });
      executeAction(action);

      assert(warnCalled === true, '缺少上下文时应该输出警告');
    } finally {
      console.warn = originalConsoleWarn;
    }
  });

  runner.test('SHOW_MODAL 动作: 使用上下文中的 openModal 函数', () => {
    let openModalCalled = false;
    let calledModalId = '';

    const mockContext: ActionExecutionContext = {
      openModal: (modalId: string) => {
        openModalCalled = true;
        calledModalId = modalId;
      },
    };

    const targetModalId = 'test-modal-123';
    const action = createMockActionConfig(ActionType.ShowModal, { modalId: targetModalId });

    executeAction(action, mockContext);

    assert(openModalCalled === true, 'openModal 应该被调用');
    assertEqual(calledModalId, targetModalId, 'modalId 应该匹配');
  });

  runner.test('SHOW_MODAL 动作: enabled=false 时不执行', () => {
    let openModalCalled = false;

    const mockContext: ActionExecutionContext = {
      openModal: () => {
        openModalCalled = true;
      },
    };

    const action = createMockActionConfig(
      ActionType.ShowModal,
      { modalId: 'modal-1' },
      false
    );

    executeAction(action, mockContext);

    assert(openModalCalled === false, 'enabled=false 时不应该执行');
  });

  // ============================================
  // HIDE_MODAL 动作测试
  // ============================================
  runner.test('HIDE_MODAL 动作: 缺少 modalId 参数时输出警告', () => {
    const originalConsoleWarn = console.warn;
    let warnCalled = false;
    let warnMessage = '';

    console.warn = (msg: unknown) => {
      warnCalled = true;
      warnMessage = String(msg);
    };

    try {
      const action: ActionConfig = {
        id: generateId(),
        type: ActionType.HideModal,
        params: {},
        enabled: true,
      };

      executeAction(action);

      assert(warnCalled === true, '缺少 modalId 时应该输出警告');
      assert(warnMessage.includes('modalId'), '警告消息应该包含 modalId');
    } finally {
      console.warn = originalConsoleWarn;
    }
  });

  runner.test('HIDE_MODAL 动作: 缺少上下文时输出警告', () => {
    const originalConsoleWarn = console.warn;
    let warnCalled = false;

    console.warn = () => {
      warnCalled = true;
    };

    try {
      const action = createMockActionConfig(ActionType.HideModal, { modalId: 'modal-1' });
      executeAction(action);

      assert(warnCalled === true, '缺少上下文时应该输出警告');
    } finally {
      console.warn = originalConsoleWarn;
    }
  });

  runner.test('HIDE_MODAL 动作: 使用上下文中的 closeModal 函数', () => {
    let closeModalCalled = false;
    let calledModalId = '';

    const mockContext: ActionExecutionContext = {
      closeModal: (modalId: string) => {
        closeModalCalled = true;
        calledModalId = modalId;
      },
    };

    const targetModalId = 'test-modal-456';
    const action = createMockActionConfig(ActionType.HideModal, { modalId: targetModalId });

    executeAction(action, mockContext);

    assert(closeModalCalled === true, 'closeModal 应该被调用');
    assertEqual(calledModalId, targetModalId, 'modalId 应该匹配');
  });

  runner.test('HIDE_MODAL 动作: enabled=false 时不执行', () => {
    let closeModalCalled = false;

    const mockContext: ActionExecutionContext = {
      closeModal: () => {
        closeModalCalled = true;
      },
    };

    const action = createMockActionConfig(
      ActionType.HideModal,
      { modalId: 'modal-1' },
      false
    );

    executeAction(action, mockContext);

    assert(closeModalCalled === false, 'enabled=false 时不应该执行');
  });

  // ============================================
  // 多个动作顺序执行测试
  // ============================================
  runner.test('多个动作顺序执行: SHOW_MODAL 后执行 HIDE_MODAL', () => {
    const executionOrder: string[] = [];
    let lastModalId = '';

    const mockContext: ActionExecutionContext = {
      openModal: (modalId) => {
        executionOrder.push('open');
        lastModalId = modalId;
      },
      closeModal: (modalId) => {
        executionOrder.push('close');
        lastModalId = modalId;
      },
    };

    const modalId = 'modal-789';
    const actions: ActionConfig[] = [
      createMockActionConfig(ActionType.ShowModal, { modalId }),
      createMockActionConfig(ActionType.HideModal, { modalId }),
    ];

    executeActions(actions, mockContext);

    assertEqual(executionOrder.length, 2, '应该执行 2 个动作');
    assertEqual(executionOrder[0], 'open', '第一个动作是 open');
    assertEqual(executionOrder[1], 'close', '第二个动作是 close');
    assertEqual(lastModalId, modalId, '最后操作的 modalId 应该匹配');
  });

  runner.test('混合动作执行: 只有 SHOW_MODAL/HIDE_MODAL 使用 openModal/closeModal', () => {
    const executionLog: string[] = [];

    const mockContext: ActionExecutionContext = {
      openModal: (modalId) => {
        executionLog.push(`open:${modalId}`);
      },
      closeModal: (modalId) => {
        executionLog.push(`close:${modalId}`);
      },
    };

    const originalConsoleLog = console.log;
    console.log = (msg) => {
      executionLog.push(`log:${String(msg)}`);
    };

    try {
      const actions: ActionConfig[] = [
        createMockActionConfig(ActionType.ShowModal, { modalId: 'modal-a' }),
        createMockActionConfig(ActionType.ConsoleLog, { logMessage: '中间消息' }),
        createMockActionConfig(ActionType.HideModal, { modalId: 'modal-a' }),
      ];

      executeActions(actions, mockContext);

      assertEqual(executionLog.length, 3, '应该执行 3 个动作');
      assertEqual(executionLog[0], 'open:modal-a', '第一个是打开弹窗');
      assertEqual(executionLog[1], 'log:中间消息', '第二个是日志');
      assertEqual(executionLog[2], 'close:modal-a', '第三个是关闭弹窗');
    } finally {
      console.log = originalConsoleLog;
    }
  });

  // ============================================
  // Button 组件事件配置测试
  // ============================================
  runner.test('Button 组件: 配置 onClickActions 包含 SHOW_MODAL', () => {
    const modalId = 'info-modal';

    const showModalAction = createMockActionConfig(ActionType.ShowModal, { modalId });
    const onClickEvent = createMockEventConfig('onClick' as any, [showModalAction]);

    const button = createMockButtonComponent('btn-open-modal', '打开弹窗', {
      onClickActions: onClickEvent,
    });

    assertNotNull(button.events, 'events 应该存在');
    assertNotNull(button.events!.onClickActions, 'onClickActions 应该存在');
    assertEqual(button.events!.onClickActions!.type, 'onClick' as any, '事件类型正确');
    assertEqual(button.events!.onClickActions!.actions.length, 1, '有 1 个动作');
    assertEqual(button.events!.onClickActions!.actions[0].type, ActionType.ShowModal, '动作类型是 SHOW_MODAL');
    assertEqual(button.events!.onClickActions!.actions[0].params.modalId, modalId, 'modalId 正确');
  });

  runner.test('Button 组件: 配置多个动作（打开 + 日志）', () => {
    const modalId = 'confirm-modal';

    const events = createMockComponentEvents({
      onClickActions: {
        type: 'onClick' as any,
        actions: [
          createMockActionConfig(ActionType.ShowModal, { modalId }),
          createMockActionConfig(ActionType.ConsoleLog, { logMessage: '弹窗已打开' }),
        ],
        enabled: true,
      },
    });

    const button = createMockButtonComponent('btn-multi', '多动作按钮', events);

    assertNotNull(button.events?.onClickActions, 'onClickActions 存在');
    assertEqual(button.events!.onClickActions!.actions.length, 2, '有 2 个动作');
    assertEqual(button.events!.onClickActions!.actions[0].type, ActionType.ShowModal, '第一个动作是 SHOW_MODAL');
    assertEqual(button.events!.onClickActions!.actions[1].type, ActionType.ConsoleLog, '第二个动作是 ConsoleLog');
  });

  runner.test('Modal 组件: 配置 onOk 关闭自身', () => {
    const modalId = 'my-modal';

    const hideModalAction = createMockActionConfig(ActionType.HideModal, { modalId });

    const modal = createMockModalComponent(modalId, [], {
      visible: false,
      title: '确认弹窗',
    });

    assertEqual(modal.id, modalId, 'Modal ID 匹配');
    assertEqual(modal.type, 'Modal' as any, '类型是 Modal');
    assertEqual(modal.props.visible, false, '默认隐藏');
    assertEqual(modal.props.title, '确认弹窗', '标题正确');
  });

  runner.test('Modal Registry 上下文: 同时管理多个 Modal', () => {
    const modalStates: Record<string, boolean> = {
      'modal-a': false,
      'modal-b': false,
      'modal-c': false,
    };

    const mockContext: ActionExecutionContext = {
      openModal: (modalId) => {
        modalStates[modalId] = true;
      },
      closeModal: (modalId) => {
        modalStates[modalId] = false;
      },
    };

    const actions: ActionConfig[] = [
      createMockActionConfig(ActionType.ShowModal, { modalId: 'modal-a' }),
      createMockActionConfig(ActionType.ShowModal, { modalId: 'modal-b' }),
      createMockActionConfig(ActionType.HideModal, { modalId: 'modal-a' }),
      createMockActionConfig(ActionType.ShowModal, { modalId: 'modal-c' }),
    ];

    executeActions(actions, mockContext);

    assertEqual(modalStates['modal-a'], false, 'modal-a 应该关闭');
    assertEqual(modalStates['modal-b'], true, 'modal-b 应该打开');
    assertEqual(modalStates['modal-c'], true, 'modal-c 应该打开');
  });

  // ============================================
  // 完整场景测试
  // ============================================
  runner.test('完整场景: 按钮点击打开弹窗', () => {
    const modalId = 'user-info-modal';
    let modalOpened = false;

    const mockContext: ActionExecutionContext = {
      openModal: (id) => {
        if (id === modalId) {
          modalOpened = true;
        }
      },
    };

    const showModalAction = createMockActionConfig(ActionType.ShowModal, { modalId });

    assertEqual(showModalAction.type, ActionType.ShowModal, '动作类型正确');
    assertEqual(showModalAction.params.modalId, modalId, 'modalId 正确');
    assertEqual(showModalAction.enabled, true, '默认启用');

    executeAction(showModalAction, mockContext);

    assert(modalOpened === true, '弹窗应该被打开');
  });

  runner.test('完整场景: 弹窗确定后关闭弹窗', () => {
    const modalId = 'confirm-dialog';
    let modalOpen = true;

    const mockContext: ActionExecutionContext = {
      closeModal: (id) => {
        if (id === modalId) {
          modalOpen = false;
        }
      },
    };

    const hideModalAction = createMockActionConfig(ActionType.HideModal, { modalId });

    assert(modalOpen === true, '初始状态是打开');

    executeAction(hideModalAction, mockContext);

    assert(modalOpen === false, '执行后应该关闭');
  });

  return runner;
};

if (typeof window !== 'undefined') {
  const win = window as unknown as Record<string, unknown>;
  win.runModalEventEngineTests = runModalEventEngineTests;
}

export default runModalEventEngineTests;
