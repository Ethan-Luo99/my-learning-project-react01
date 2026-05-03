/**
 * 事件执行引擎测试
 * 测试核心逻辑：
 * 1. 单个动作按配置正确执行
 * 2. 多个动作按添加顺序依次执行
 * 3. 未知 ActionType 静默忽略不中断后续动作
 * 4. 动作执行异常时被 try-catch 捕获不抛到外部
 */

import {
  ActionType,
  NavigateTarget,
  type ActionConfig,
  type ActionExecutionContext,
  executeAction,
  executeActions,
  createEventEngine,
} from './eventEngine';
import {
  TestRunner,
  assert,
  assertEqual,
  assertNotNull,
  assertThrows,
} from './test-helpers';

const createMockAction = (
  type: ActionType,
  params: Partial<ActionConfig['params']> = {},
  enabled: boolean = true
): ActionConfig => ({
  id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  type,
  params: {
    alertMessage: params.alertMessage,
    targetUrl: params.targetUrl,
    navigateTarget: params.navigateTarget,
    pageId: params.pageId,
    logMessage: params.logMessage,
    customScript: params.customScript,
    formId: params.formId,
  },
  enabled,
});

export const runEventEngineTests = (): TestRunner => {
  const runner = new TestRunner();

  runner.beforeAll(() => {
    console.log('开始运行事件执行引擎测试...');
  });

  runner.afterAll(() => {
    console.log('事件执行引擎测试完成');
  });

  // ============================================
  // 测试 1: 单个动作执行 - enabled=false 时不执行
  // ============================================
  runner.test('单个动作执行: enabled=false 时不执行', () => {
    let wasCalled = false;
    const originalConsoleLog = console.log;
    
    console.log = () => { wasCalled = true; };
    
    try {
      const action = createMockAction(ActionType.ConsoleLog, { logMessage: '测试' }, false);
      executeAction(action);
      
      assert(wasCalled === false, 'enabled=false 时动作不应该执行');
    } finally {
      console.log = originalConsoleLog;
    }
  });

  // ============================================
  // 测试 2: 单个动作执行 - enabled=true 时执行
  // ============================================
  runner.test('单个动作执行: enabled=true 时执行', () => {
    let wasCalled = false;
    let loggedMessage = '';
    const originalConsoleLog = console.log;
    
    console.log = (message: unknown) => { 
      wasCalled = true; 
      loggedMessage = String(message);
    };
    
    try {
      const testMessage = '测试控制台输出';
      const action = createMockAction(ActionType.ConsoleLog, { logMessage: testMessage }, true);
      executeAction(action);
      
      assert(wasCalled === true, 'enabled=true 时动作应该执行');
      assertEqual(loggedMessage, testMessage, '日志消息应该匹配');
    } finally {
      console.log = originalConsoleLog;
    }
  });

  // ============================================
  // 测试 3: 多个动作按添加顺序依次执行
  // ============================================
  runner.test('多个动作按添加顺序依次执行', () => {
    const executionOrder: string[] = [];
    const originalConsoleLog = console.log;
    
    console.log = (message: unknown) => { 
      executionOrder.push(String(message)); 
    };
    
    try {
      const actions: ActionConfig[] = [
        createMockAction(ActionType.ConsoleLog, { logMessage: '动作 1' }, true),
        createMockAction(ActionType.ConsoleLog, { logMessage: '动作 2' }, true),
        createMockAction(ActionType.ConsoleLog, { logMessage: '动作 3' }, true),
      ];
      
      executeActions(actions);
      
      assertEqual(executionOrder.length, 3, '应该执行 3 个动作');
      assertEqual(executionOrder[0], '动作 1', '第一个动作应该是动作 1');
      assertEqual(executionOrder[1], '动作 2', '第二个动作应该是动作 2');
      assertEqual(executionOrder[2], '动作 3', '第三个动作应该是动作 3');
    } finally {
      console.log = originalConsoleLog;
    }
  });

  // ============================================
  // 测试 4: 多个动作混合 enabled 状态
  // ============================================
  runner.test('多个动作混合 enabled 状态时，只执行 enabled=true 的动作', () => {
    const executionOrder: string[] = [];
    const originalConsoleLog = console.log;
    
    console.log = (message: unknown) => { 
      executionOrder.push(String(message)); 
    };
    
    try {
      const actions: ActionConfig[] = [
        createMockAction(ActionType.ConsoleLog, { logMessage: '动作 1 (enabled)' }, true),
        createMockAction(ActionType.ConsoleLog, { logMessage: '动作 2 (disabled)' }, false),
        createMockAction(ActionType.ConsoleLog, { logMessage: '动作 3 (enabled)' }, true),
      ];
      
      executeActions(actions);
      
      assertEqual(executionOrder.length, 2, '应该只执行 2 个 enabled=true 的动作');
      assertEqual(executionOrder[0], '动作 1 (enabled)', '第一个动作应该是动作 1');
      assertEqual(executionOrder[1], '动作 3 (enabled)', '第二个动作应该是动作 3');
    } finally {
      console.log = originalConsoleLog;
    }
  });

  // ============================================
  // 测试 5: 未知 ActionType 静默忽略，不中断后续动作
  // ============================================
  runner.test('未知 ActionType 静默忽略，不中断后续动作', () => {
    const executionOrder: string[] = [];
    const originalConsoleLog = console.log;
    const originalConsoleWarn = console.warn;
    
    console.log = (message: unknown) => { 
      executionOrder.push(String(message)); 
    };
    console.warn = () => {};
    
    try {
      const unknownActionType = 'UNKNOWN_ACTION_TYPE' as ActionType;
      const actions: ActionConfig[] = [
        createMockAction(ActionType.ConsoleLog, { logMessage: '动作 1' }, true),
        {
          id: 'unknown-action',
          type: unknownActionType,
          params: {},
          enabled: true,
        },
        createMockAction(ActionType.ConsoleLog, { logMessage: '动作 3' }, true),
      ];
      
      executeActions(actions);
      
      assertEqual(executionOrder.length, 2, '应该执行 2 个有效的动作');
      assertEqual(executionOrder[0], '动作 1', '第一个动作应该是动作 1');
      assertEqual(executionOrder[1], '动作 3', '第二个动作应该是动作 3');
    } finally {
      console.log = originalConsoleLog;
      console.warn = originalConsoleWarn;
    }
  });

  // ============================================
  // 测试 6: 自定义脚本异常被 try-catch 捕获，不抛到外部
  // ============================================
  runner.test('自定义脚本执行异常被 try-catch 捕获，不抛到外部', () => {
    const originalConsoleError = console.error;
    
    let errorCaught = false;
    
    console.error = () => { errorCaught = true; };
    
    try {
      const action: ActionConfig = {
        id: 'error-script',
        type: ActionType.CustomScript,
        params: {
          customScript: 'throw new Error("故意抛出的错误");',
        },
        enabled: true,
      };
      
      assertThrows(() => {
        executeAction(action);
        throw new Error('脚本内部错误应该被捕获，不应该抛到外部');
      }, '脚本内部错误');

      assert(errorCaught === true, '错误应该被 console.error 记录');
    } finally {
      console.error = originalConsoleError;
    }
  });

  // ============================================
  // 测试 7: createEventEngine 工厂函数
  // ============================================
  runner.test('createEventEngine 工厂函数创建事件引擎实例', () => {
    const executionOrder: string[] = [];
    const originalConsoleLog = console.log;
    
    console.log = (message: unknown) => { 
      executionOrder.push(String(message)); 
    };
    
    try {
      const engine = createEventEngine();
      
      assertNotNull(engine, '事件引擎实例应该存在');
      assert(typeof engine.executeAction === 'function', 'executeAction 应该是函数');
      assert(typeof engine.executeActions === 'function', 'executeActions 应该是函数');
      
      const action = createMockAction(ActionType.ConsoleLog, { logMessage: '引擎测试' }, true);
      engine.executeAction(action);
      
      assertEqual(executionOrder.length, 1, '引擎应该执行动作');
      assertEqual(executionOrder[0], '引擎测试', '执行的消息应该匹配');
    } finally {
      console.log = originalConsoleLog;
    }
  });

  // ============================================
  // 测试 8: 表单操作使用上下文
  // ============================================
  runner.test('表单操作使用上下文中的函数', () => {
    let submitCalled = false;
    let submitFormId: string | undefined;
    let resetCalled = false;
    let resetFormId: string | undefined;
    
    const mockContext: ActionExecutionContext = {
      submitForm: (formId?: string) => {
        submitCalled = true;
        submitFormId = formId;
      },
      resetForm: (formId?: string) => {
        resetCalled = true;
        resetFormId = formId;
      },
    };
    
    const submitAction = createMockAction(ActionType.FormSubmit, { formId: 'testForm' }, true);
    const resetAction = createMockAction(ActionType.FormReset, { formId: 'testForm' }, true);
    
    executeAction(submitAction, mockContext);
    executeAction(resetAction, mockContext);
    
    assert(submitCalled === true, 'submitForm 应该被调用');
    assertEqual(submitFormId, 'testForm', '提交的表单 ID 应该匹配');
    assert(resetCalled === true, 'resetForm 应该被调用');
    assertEqual(resetFormId, 'testForm', '重置的表单 ID 应该匹配');
  });

  // ============================================
  // 测试 9: 表单操作缺少上下文时不报错
  // ============================================
  runner.test('表单操作缺少上下文时不报错，只输出警告', () => {
    const originalConsoleWarn = console.warn;
    let warnCalled = false;
    
    console.warn = () => { warnCalled = true; };
    
    try {
      const submitAction = createMockAction(ActionType.FormSubmit, { formId: 'testForm' }, true);
      
      assertThrows(() => {
        executeAction(submitAction);
        throw new Error('缺少上下文时不应该抛出错误');
      }, '缺少上下文');
      
      assert(warnCalled === true, '缺少上下文时应该输出警告');
    } finally {
      console.warn = originalConsoleWarn;
    }
  });

  // ============================================
  // 测试 10: NavigateUrl 动作 - 新窗口打开
  // ============================================
  runner.test('NavigateUrl 动作 - 新窗口打开', () => {
    const originalWindowOpen = window.open;
    let openCalled = false;
    let openUrl = '';
    let openTarget = '';
    
    window.open = (url: string | URL, target?: string) => {
      openCalled = true;
      openUrl = typeof url === 'string' ? url : url.toString();
      openTarget = target || '';
      return null;
    };
    
    try {
      const action = createMockAction(
        ActionType.NavigateUrl, 
        { targetUrl: 'https://example.com', navigateTarget: NavigateTarget.NewWindow },
        true
      );
      
      executeAction(action);
      
      assert(openCalled === true, 'window.open 应该被调用');
      assertEqual(openUrl, 'https://example.com', 'URL 应该匹配');
      assertEqual(openTarget, '_blank', '目标应该是 _blank');
    } finally {
      window.open = originalWindowOpen;
    }
  });

  // ============================================
  // 测试 11: NavigateUrl 动作 - 当前窗口跳转
  // ============================================
  runner.test('NavigateUrl 动作 - 当前窗口跳转', () => {
    const originalLocationHref = window.location.href;
    let locationChanged = false;
    
    Object.defineProperty(window, 'location', {
      value: {
        get href() { return originalLocationHref; },
        set href(value) { locationChanged = true; }
      },
      configurable: true,
      writable: true
    });
    
    try {
      const action = createMockAction(
        ActionType.NavigateUrl, 
        { targetUrl: 'https://example.com', navigateTarget: NavigateTarget.CurrentWindow },
        true
      );
      
      executeAction(action);
      
      assert(locationChanged === true, 'location.href 应该被设置');
    } finally {
      Object.defineProperty(window, 'location', {
        value: { href: originalLocationHref },
        configurable: true,
        writable: true
      });
    }
  });

  // ============================================
  // 测试 12: ConsoleLog 动作 - 默认消息
  // ============================================
  runner.test('ConsoleLog 动作 - 未提供 logMessage 时使用默认消息', () => {
    let loggedMessage = '';
    const originalConsoleLog = console.log;
    
    console.log = (message: unknown) => { loggedMessage = String(message); };
    
    try {
      const action = createMockAction(ActionType.ConsoleLog, {}, true);
      executeAction(action);
      
      assertEqual(loggedMessage, '事件触发了', '应该使用默认消息');
    } finally {
      console.log = originalConsoleLog;
    }
  });

  // ============================================
  // 测试 13: 空动作列表
  // ============================================
  runner.test('空动作列表不执行任何操作', () => {
    let anyActionExecuted = false;
    const originalConsoleLog = console.log;
    
    console.log = () => { anyActionExecuted = true; };
    
    try {
      executeActions([]);
      
      assert(anyActionExecuted === false, '空列表不应该执行任何动作');
    } finally {
      console.log = originalConsoleLog;
    }
  });

  return runner;
};

if (typeof window !== 'undefined') {
  const win = window as unknown as Record<string, unknown>;
  win.runEventEngineTests = runEventEngineTests;
}

export default runEventEngineTests;
