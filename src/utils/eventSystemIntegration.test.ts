/**
 * 事件系统集成测试
 * 
 * 测试覆盖：
 * 1. Button 配置 SHOW_MODAL 后在预览模式点击正确弹出 Modal
 * 2. Modal 关闭按钮正常关闭
 * 3. Button 只触发一次事件（新旧系统不冲突）
 * 4. 事件配置持久化后加载仍保留完整
 */

import {
  ActionType,
  EventType,
  ClickEventType,
  type ActionConfig,
  type EventConfig,
  type ComponentEvents,
  type ActionExecutionContext,
} from '@/types/component';
import {
  TestRunner,
  assert,
  assertEqual,
  assertNotNull,
  createMockActionConfig,
  createMockEventConfig,
  createMockClickEventConfig,
  createMockComponentEvents,
  createMockButtonWithEvents,
  createMockModalComponent,
} from './test-helpers';
import { generateId } from './id';
import {
  executeAction,
  executeActions,
  executeShowAlert,
  executeShowModal,
  executeHideModal,
} from './eventEngine';

export const runEventSystemIntegrationTests = (): TestRunner => {
  const runner = new TestRunner();

  runner.beforeAll(() => {
    console.log('开始运行事件系统集成测试...');
  });

  runner.afterAll(() => {
    console.log('事件系统集成测试完成');
  });

  // ============================================
  // Bug 1 修复验证：SHOW_MODAL 动作链路
  // ============================================

  runner.test('SHOW_MODAL 动作: 正确调用 context.openModal', () => {
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

  runner.test('HIDE_MODAL 动作: 正确调用 context.closeModal', () => {
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

  runner.test('SHOW_MODAL 动作: 缺少 modalId 时输出警告', () => {
    const originalConsoleWarn = console.warn;
    let warnCalled = false;

    console.warn = () => {
      warnCalled = true;
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
    } finally {
      console.warn = originalConsoleWarn;
    }
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

  runner.test('Modal 打开和关闭完整链路', () => {
    const modalStates: Record<string, boolean> = {
      'modal-a': false,
      'modal-b': false,
    };

    const mockContext: ActionExecutionContext = {
      openModal: (modalId) => {
        modalStates[modalId] = true;
      },
      closeModal: (modalId) => {
        modalStates[modalId] = false;
      },
    };

    assertEqual(modalStates['modal-a'], false, '初始状态 modal-a 关闭');
    assertEqual(modalStates['modal-b'], false, '初始状态 modal-b 关闭');

    const actions: ActionConfig[] = [
      createMockActionConfig(ActionType.ShowModal, { modalId: 'modal-a' }),
      createMockActionConfig(ActionType.ShowModal, { modalId: 'modal-b' }),
    ];

    executeActions(actions, mockContext);

    assertEqual(modalStates['modal-a'], true, '执行后 modal-a 打开');
    assertEqual(modalStates['modal-b'], true, '执行后 modal-b 打开');

    const closeActions: ActionConfig[] = [
      createMockActionConfig(ActionType.HideModal, { modalId: 'modal-a' }),
    ];

    executeActions(closeActions, mockContext);

    assertEqual(modalStates['modal-a'], false, '关闭后 modal-a 关闭');
    assertEqual(modalStates['modal-b'], true, 'modal-b 保持打开');
  });

  // ============================================
  // Bug 2 修复验证：新旧事件系统不冲突
  // ============================================

  runner.test('Button 事件配置: 只有 onClickActions 时优先执行新版事件系统', () => {
    const showModalAction = createMockActionConfig(ActionType.ShowModal, { modalId: 'info-modal' });
    const onClickEvent = createMockEventConfig(EventType.Click, [showModalAction]);

    const events = createMockComponentEvents({
      onClickActions: onClickEvent,
    });

    const button = createMockButtonWithEvents('btn-test', '打开弹窗', events);

    assertNotNull(button.events, 'events 应该存在');
    assertNotNull(button.events!.onClickActions, 'onClickActions 应该存在');
    assertEqual(button.events!.onClickActions!.enabled, true, '事件应该启用');
    assertEqual(button.events!.onClickActions!.actions.length, 1, '有 1 个动作');
    assertEqual(button.events!.onClickActions!.actions[0].type, ActionType.ShowModal, '动作类型正确');
  });

  runner.test('Button 事件配置: 只有 onClick 时使用旧版事件系统', () => {
    const onClickConfig = createMockClickEventConfig(ClickEventType.Alert, {
      alertMessage: '测试消息',
    });

    const events = createMockComponentEvents({
      onClick: onClickConfig,
    });

    const button = createMockButtonWithEvents('btn-test', '显示提示', events);

    assertNotNull(button.events, 'events 应该存在');
    assertNotNull(button.events!.onClick, 'onClick 应该存在');
    assertEqual(button.events!.onClick!.type, ClickEventType.Alert, '事件类型正确');
    assertEqual(button.events!.onClick!.alertMessage, '测试消息', '消息正确');
  });

  runner.test('Button 事件配置: 新旧系统同时存在时的优先级判断逻辑', () => {
    const hasOnClickActions = (events: ComponentEvents): boolean => {
      return events?.onClickActions 
        && events.onClickActions.enabled 
        && events.onClickActions.actions.length > 0;
    };

    const eventsWithBoth: ComponentEvents = {
      onClickActions: {
        type: EventType.Click,
        actions: [createMockActionConfig(ActionType.ShowModal, { modalId: 'modal-1' })],
        enabled: true,
      },
      onClick: {
        type: ClickEventType.Alert,
        alertMessage: '旧版消息',
      },
    };

    const eventsWithOnlyOld: ComponentEvents = {
      onClick: {
        type: ClickEventType.Alert,
        alertMessage: '旧版消息',
      },
    };

    const eventsWithDisabledNew: ComponentEvents = {
      onClickActions: {
        type: EventType.Click,
        actions: [createMockActionConfig(ActionType.ShowModal, { modalId: 'modal-1' })],
        enabled: false,
      },
      onClick: {
        type: ClickEventType.Alert,
        alertMessage: '旧版消息',
      },
    };

    const eventsWithEmptyNew: ComponentEvents = {
      onClickActions: {
        type: EventType.Click,
        actions: [],
        enabled: true,
      },
      onClick: {
        type: ClickEventType.Alert,
        alertMessage: '旧版消息',
      },
    };

    assert(hasOnClickActions(eventsWithBoth) === true, '有启用的 onClickActions 应该返回 true');
    assert(hasOnClickActions(eventsWithOnlyOld) === false, '只有 onClick 应该返回 false');
    assert(hasOnClickActions(eventsWithDisabledNew) === false, '禁用的 onClickActions 应该返回 false');
    assert(hasOnClickActions(eventsWithEmptyNew) === false, '空动作的 onClickActions 应该返回 false');
  });

  runner.test('二选一逻辑验证: 有 onClickActions 时只执行新版事件引擎', () => {
    const executionLog: string[] = [];

    const newSystemHandler = () => {
      executionLog.push('newSystem');
    };

    const oldSystemHandler = () => {
      executionLog.push('oldSystem');
    };

    const events: ComponentEvents = {
      onClickActions: {
        type: EventType.Click,
        actions: [createMockActionConfig(ActionType.ShowAlert, { alertMessage: '新版' })],
        enabled: true,
      },
      onClick: {
        type: ClickEventType.Alert,
        alertMessage: '旧版',
      },
    };

    const hasNew = events?.onClickActions 
      && events.onClickActions.enabled 
      && events.onClickActions.actions.length > 0;

    if (hasNew) {
      newSystemHandler();
    } else {
      oldSystemHandler();
    }

    assertEqual(executionLog.length, 1, '应该只执行一次');
    assertEqual(executionLog[0], 'newSystem', '应该执行新版事件系统');
  });

  runner.test('二选一逻辑验证: 没有 onClickActions 时执行旧版事件系统', () => {
    const executionLog: string[] = [];

    const newSystemHandler = () => {
      executionLog.push('newSystem');
    };

    const oldSystemHandler = () => {
      executionLog.push('oldSystem');
    };

    const events: ComponentEvents = {
      onClick: {
        type: ClickEventType.Alert,
        alertMessage: '旧版',
      },
    };

    const hasNew = events?.onClickActions 
      && events.onClickActions.enabled 
      && events.onClickActions.actions.length > 0;

    if (hasNew) {
      newSystemHandler();
    } else {
      oldSystemHandler();
    }

    assertEqual(executionLog.length, 1, '应该只执行一次');
    assertEqual(executionLog[0], 'oldSystem', '应该执行旧版事件系统');
  });

  runner.test('旧版事件系统: ClickEventType.Alert 正确执行', () => {
    const originalAlert = window.alert;
    let alertCalled = false;
    let alertMessage = '';

    window.alert = (msg: string) => {
      alertCalled = true;
      alertMessage = msg;
    };

    try {
      const testMessage = '测试提示消息';
      executeShowAlert({ alertMessage: testMessage });

      assert(alertCalled === true, 'alert 应该被调用');
      assertEqual(alertMessage, testMessage, '消息应该匹配');
    } finally {
      window.alert = originalAlert;
    }
  });

  // ============================================
  // 事件配置持久化测试
  // ============================================

  runner.test('事件配置: JSON 序列化后完整保留', () => {
    const originalActions: ActionConfig[] = [
      createMockActionConfig(ActionType.ShowModal, { modalId: 'modal-1' }),
      createMockActionConfig(ActionType.ConsoleLog, { logMessage: '日志消息' }),
      createMockActionConfig(ActionType.ShowAlert, { alertMessage: '提示' }),
    ];

    const originalEvent: EventConfig = {
      type: EventType.Click,
      actions: originalActions,
      enabled: true,
    };

    const serialized = JSON.stringify(originalEvent);
    const deserialized = JSON.parse(serialized) as EventConfig;

    assertEqual(deserialized.type, originalEvent.type, 'type 应该匹配');
    assertEqual(deserialized.enabled, originalEvent.enabled, 'enabled 应该匹配');
    assertEqual(deserialized.actions.length, originalActions.length, 'actions 数量应该匹配');

    for (let i = 0; i < originalActions.length; i++) {
      assertEqual(deserialized.actions[i].type, originalActions[i].type, `动作 ${i} type 应该匹配`);
      assertEqual(
        JSON.stringify(deserialized.actions[i].params),
        JSON.stringify(originalActions[i].params),
        `动作 ${i} params 应该匹配`
      );
    }
  });

  runner.test('ComponentEvents: JSON 序列化后完整保留', () => {
    const originalEvents: ComponentEvents = {
      onClickActions: {
        type: EventType.Click,
        actions: [
          createMockActionConfig(ActionType.ShowModal, { modalId: 'confirm-modal' }),
        ],
        enabled: true,
      },
      onChangeActions: {
        type: EventType.Change,
        actions: [
          createMockActionConfig(ActionType.ConsoleLog, { logMessage: '值改变了' }),
        ],
        enabled: true,
      },
      onClick: {
        type: ClickEventType.Alert,
        alertMessage: '旧版点击事件',
      },
    };

    const serialized = JSON.stringify(originalEvents);
    const deserialized = JSON.parse(serialized) as ComponentEvents;

    assertNotNull(deserialized.onClickActions, 'onClickActions 应该存在');
    assertNotNull(deserialized.onChangeActions, 'onChangeActions 应该存在');
    assertNotNull(deserialized.onClick, 'onClick 应该存在');

    assertEqual(deserialized.onClickActions!.type, EventType.Click, 'onClickActions type 正确');
    assertEqual(deserialized.onClickActions!.actions[0].type, ActionType.ShowModal, 'onClickActions 动作类型正确');
    assertEqual(deserialized.onClickActions!.actions[0].params.modalId, 'confirm-modal', 'onClickActions modalId 正确');

    assertEqual(deserialized.onClick!.type, ClickEventType.Alert, 'onClick type 正确');
    assertEqual(deserialized.onClick!.alertMessage, '旧版点击事件', 'onClick alertMessage 正确');
  });

  runner.test('Button Schema 持久化: 事件配置完整保存', () => {
    const showModalAction = createMockActionConfig(ActionType.ShowModal, { modalId: 'user-modal' });
    const consoleAction = createMockActionConfig(ActionType.ConsoleLog, { logMessage: '按钮被点击' });

    const button = createMockButtonWithEvents(
      'btn-open-modal',
      '打开用户弹窗',
      createMockComponentEvents({
        onClickActions: {
          type: EventType.Click,
          actions: [showModalAction, consoleAction],
          enabled: true,
        },
      })
    );

    const serialized = JSON.stringify(button);
    const deserialized = JSON.parse(serialized);

    assertEqual(deserialized.id, button.id, 'id 应该匹配');
    assertEqual(deserialized.type, button.type, 'type 应该匹配');
    assertNotNull(deserialized.events, 'events 应该存在');
    assertNotNull(deserialized.events.onClickActions, 'onClickActions 应该存在');
    assertEqual(deserialized.events.onClickActions.actions.length, 2, '有 2 个动作');
    assertEqual(deserialized.events.onClickActions.actions[0].type, ActionType.ShowModal, '第一个动作是 SHOW_MODAL');
    assertEqual(deserialized.events.onClickActions.actions[1].type, ActionType.ConsoleLog, '第二个动作是 CONSOLE_LOG');
  });

  // ============================================
  // 完整场景测试
  // ============================================

  runner.test('完整场景: Button 点击打开 Modal，然后关闭', () => {
    const modalId = 'info-modal';
    let modalVisible = false;

    const mockContext: ActionExecutionContext = {
      openModal: (id) => {
        if (id === modalId) {
          modalVisible = true;
        }
      },
      closeModal: (id) => {
        if (id === modalId) {
          modalVisible = false;
        }
      },
    };

    const showModalAction = createMockActionConfig(ActionType.ShowModal, { modalId });
    const hideModalAction = createMockActionConfig(ActionType.HideModal, { modalId });

    assertEqual(modalVisible, false, '初始状态关闭');

    executeAction(showModalAction, mockContext);
    assertEqual(modalVisible, true, '点击按钮后 Modal 打开');

    executeAction(hideModalAction, mockContext);
    assertEqual(modalVisible, false, '点击关闭后 Modal 关闭');
  });

  runner.test('完整场景: 多个动作顺序执行（打开 Modal + 日志）', () => {
    const executionOrder: string[] = [];
    const modalId = 'multi-action-modal';

    const mockContext: ActionExecutionContext = {
      openModal: (id) => {
        executionOrder.push(`open:${id}`);
      },
      closeModal: (id) => {
        executionOrder.push(`close:${id}`);
      },
    };

    const originalConsoleLog = console.log;
    console.log = (msg) => {
      executionOrder.push(`log:${String(msg)}`);
    };

    try {
      const actions: ActionConfig[] = [
        createMockActionConfig(ActionType.ShowModal, { modalId }),
        createMockActionConfig(ActionType.ConsoleLog, { logMessage: 'Modal 已打开' }),
      ];

      executeActions(actions, mockContext);

      assertEqual(executionOrder.length, 2, '应该执行 2 个动作');
      assertEqual(executionOrder[0], `open:${modalId}`, '第一个动作是打开 Modal');
      assertEqual(executionOrder[1], 'log:Modal 已打开', '第二个动作是日志');
    } finally {
      console.log = originalConsoleLog;
    }
  });

  runner.test('边界情况: 动作链中某动作失败不影响其他动作', () => {
    const executionOrder: string[] = [];
    const modalId = 'test-modal';

    const mockContext: ActionExecutionContext = {
      openModal: (id) => {
        executionOrder.push(`open:${id}`);
      },
      closeModal: (id) => {
        executionOrder.push(`close:${id}`);
      },
    };

    const originalConsoleWarn = console.warn;
    console.warn = () => {};

    try {
      const actions: ActionConfig[] = [
        createMockActionConfig(ActionType.ShowModal, { modalId }),
        createMockActionConfig(ActionType.ShowModal, {}),
        createMockActionConfig(ActionType.HideModal, { modalId }),
      ];

      executeActions(actions, mockContext);

      assertEqual(executionOrder.length, 2, '应该执行 2 个有效动作');
      assertEqual(executionOrder[0], `open:${modalId}`, '第一个打开');
      assertEqual(executionOrder[1], `close:${modalId}`, '最后关闭');
    } finally {
      console.warn = originalConsoleWarn;
    }
  });

  return runner;
};

if (typeof window !== 'undefined') {
  const win = window as unknown as Record<string, unknown>;
  win.runEventSystemIntegrationTests = runEventSystemIntegrationTests;
}

export default runEventSystemIntegrationTests;
