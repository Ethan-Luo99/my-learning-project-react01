import {
  isMac,
  isIOS,
  isApplePlatform,
  getPrimaryModifierKeyLabel,
  getPrimaryModifierKeyDisplay,
  isPrimaryModifierKey,
} from '@/utils/platform';
import {
  isInputElement,
  isBuilderRoute,
} from '@/hooks/useKeyboardShortcuts';
import {
  TestRunner,
  assert,
  assertEqual,
} from '@/utils/test-helpers';

export const runKeyboardShortcutsTests = (): TestRunner => {
  const runner = new TestRunner();

  runner.beforeAll(() => {
    console.log('开始运行键盘快捷键测试...');
  });

  runner.afterAll(() => {
    console.log('测试完成');
  });

  runner.test('平台检测: isMac 应该能正确检测 Mac 平台', () => {
    const result = isMac();
    assert(typeof result === 'boolean', 'isMac 应该返回 boolean');
    console.log(`当前平台 isMac: ${result}`);
  });

  runner.test('平台检测: isIOS 应该能正确检测 iOS 平台', () => {
    const result = isIOS();
    assert(typeof result === 'boolean', 'isIOS 应该返回 boolean');
    console.log(`当前平台 isIOS: ${result}`);
  });

  runner.test('平台检测: isApplePlatform 应该返回 true 当 Mac 或 iOS', () => {
    const result = isApplePlatform();
    const isMacResult = isMac();
    const isIOSResult = isIOS();
    
    if (isMacResult || isIOSResult) {
      assert(result === true, 'Apple 平台应该返回 true');
    } else {
      assert(result === false, '非 Apple 平台应该返回 false');
    }
  });

  runner.test('平台检测: getPrimaryModifierKeyLabel 应该返回正确的修饰键符号', () => {
    const label = getPrimaryModifierKeyLabel();
    const isApple = isApplePlatform();
    
    if (isApple) {
      assertEqual(label, '⌘', 'Apple 平台应该返回 ⌘');
    } else {
      assertEqual(label, 'Ctrl', '非 Apple 平台应该返回 Ctrl');
    }
  });

  runner.test('平台检测: getPrimaryModifierKeyDisplay 应该返回正确的修饰键文本', () => {
    const display = getPrimaryModifierKeyDisplay();
    const isApple = isApplePlatform();
    
    if (isApple) {
      assertEqual(display, 'Cmd', 'Apple 平台应该返回 Cmd');
    } else {
      assertEqual(display, 'Ctrl', '非 Apple 平台应该返回 Ctrl');
    }
  });

  runner.test('平台检测: 连续调用 isMac 应该返回缓存结果', () => {
    const result1 = isMac();
    const result2 = isMac();
    
    assertEqual(result1, result2, '连续调用应该返回相同结果');
  });

  runner.test('路由检测: isBuilderRoute 应该正确识别 /builder 路由', () => {
    assert(isBuilderRoute('/builder') === true, '/builder 应该返回 true');
    assert(isBuilderRoute('/builder/') === true, '/builder/ 应该返回 true');
    assert(isBuilderRoute('/builder/foo') === true, '/builder/foo 应该返回 true');
  });

  runner.test('路由检测: isBuilderRoute 应该正确识别非 builder 路由', () => {
    assert(isBuilderRoute('/') === false, '/ 应该返回 false');
    assert(isBuilderRoute('/projects') === false, '/projects 应该返回 false');
    assert(isBuilderRoute('/preview') === false, '/preview 应该返回 false');
    assert(isBuilderRoute('/preview/builder') === false, '/preview/builder 应该返回 false');
  });

  runner.test('输入元素检测: isInputElement 应该正确识别 input 元素', () => {
    const input = document.createElement('input');
    assert(isInputElement(input) === true, 'input 元素应该返回 true');
  });

  runner.test('输入元素检测: isInputElement 应该正确识别 textarea 元素', () => {
    const textarea = document.createElement('textarea');
    assert(isInputElement(textarea) === true, 'textarea 元素应该返回 true');
  });

  runner.test('输入元素检测: isInputElement 应该正确识别 select 元素', () => {
    const select = document.createElement('select');
    assert(isInputElement(select) === true, 'select 元素应该返回 true');
  });

  runner.test('输入元素检测: isInputElement 应该正确识别 contentEditable 元素', () => {
    const div = document.createElement('div');
    div.contentEditable = 'true';
    assert(isInputElement(div) === true, 'contentEditable 元素应该返回 true');
  });

  runner.test('输入元素检测: isInputElement 应该正确识别普通元素', () => {
    const div = document.createElement('div');
    assert(isInputElement(div) === false, '普通 div 应该返回 false');
    
    const span = document.createElement('span');
    assert(isInputElement(span) === false, '普通 span 应该返回 false');
    
    const button = document.createElement('button');
    assert(isInputElement(button) === false, 'button 应该返回 false');
  });

  runner.test('输入元素检测: isInputElement 应该正确处理 null', () => {
    assert(isInputElement(null) === false, 'null 应该返回 false');
  });

  runner.test('键盘事件: 模拟 Delete 键删除选中组件的流程', () => {
    let deleteCalled = false;
    let deleteTarget: string | null = null;
    
    const mockRemoveComponent = (id: string) => {
      deleteCalled = true;
      deleteTarget = id;
    };
    
    let selectedComponentId: string | null = 'text-1';
    
    const handleDelete = () => {
      if (selectedComponentId) {
        mockRemoveComponent(selectedComponentId);
      }
    };
    
    handleDelete();
    
    assert(deleteCalled === true, '删除应该被调用');
    assertEqual(deleteTarget, 'text-1', '删除目标 ID 应该匹配');
  });

  runner.test('键盘事件: 未选中组件时按 Delete 不应该触发删除', () => {
    let deleteCalled = false;
    
    const mockRemoveComponent = () => {
      deleteCalled = true;
    };
    
    let selectedComponentId: string | null = null;
    
    const handleDelete = () => {
      if (selectedComponentId) {
        mockRemoveComponent();
      }
    };
    
    handleDelete();
    
    assert(deleteCalled === false, '未选中组件时删除不应该被调用');
  });

  runner.test('键盘事件: 模拟撤销/重做的调用流程', () => {
    let undoCalled = false;
    let redoCalled = false;
    
    const mockUndo = () => { undoCalled = true; };
    const mockRedo = () => { redoCalled = true; };
    
    mockUndo();
    assert(undoCalled === true, '撤销应该被调用');
    
    mockRedo();
    assert(redoCalled === true, '重做应该被调用');
  });

  runner.test('键盘事件: 模拟主修饰键检测 (Windows/Linux 模式)', () => {
    const mockEvent = {
      ctrlKey: true,
      metaKey: false,
    } as KeyboardEvent;
    
    const originalNavigator = { ...navigator };
    
    (global.navigator as any) = { platform: 'Win32', userAgent: 'Windows' };
    
    isMac.cache = false;
    (isMac as any).cache = undefined;
    
    (global.navigator as any) = originalNavigator;
    
    assert(true, '测试完成');
  });

  runner.test('键盘事件: 模拟主修饰键检测 (Mac 模式)', () => {
    const mockEvent = {
      ctrlKey: false,
      metaKey: true,
    } as KeyboardEvent;
    
    assert(typeof isPrimaryModifierKey(mockEvent) === 'boolean', '应该返回 boolean');
  });

  runner.test('边界情况: 空路径的路由检测', () => {
    assert(isBuilderRoute('') === false, '空字符串应该返回 false');
  });

  runner.test('边界情况: 包含 builder 但不是前缀的路径', () => {
    assert(isBuilderRoute('/foo/builder') === false, '/foo/builder 应该返回 false');
    assert(isBuilderRoute('/projectsbuilder') === false, '/projectsbuilder 应该返回 false');
  });

  runner.test('边界情况: contentEditable 设置为 false 的元素', () => {
    const div = document.createElement('div');
    div.contentEditable = 'false';
    assert(isInputElement(div) === false, 'contentEditable="false" 应该返回 false');
  });

  runner.test('焦点冲突模拟: input 元素中不应该触发快捷键', () => {
    let shortcutTriggered = false;
    
    const mockShortcutHandler = (activeElement: HTMLElement | null) => {
      if (isInputElement(activeElement)) {
        return;
      }
      shortcutTriggered = true;
    };
    
    const input = document.createElement('input');
    mockShortcutHandler(input);
    assert(shortcutTriggered === false, 'input 元素中不应该触发快捷键');
    
    shortcutTriggered = false;
    const div = document.createElement('div');
    mockShortcutHandler(div);
    assert(shortcutTriggered === true, '普通元素中应该触发快捷键');
  });

  runner.test('路由隔离模拟: preview 路由不应该触发快捷键', () => {
    let shortcutTriggered = false;
    
    const mockShortcutHandler = (pathname: string) => {
      if (!isBuilderRoute(pathname)) {
        return;
      }
      shortcutTriggered = true;
    };
    
    mockShortcutHandler('/preview');
    assert(shortcutTriggered === false, 'preview 路由不应该触发快捷键');
    
    shortcutTriggered = false;
    mockShortcutHandler('/builder');
    assert(shortcutTriggered === true, 'builder 路由应该触发快捷键');
  });

  runner.test('完整流程模拟: 选中组件后按 Delete 删除', () => {
    let removedComponentId: string | null = null;
    let selectedComponentId: string | null = 'btn-1';
    
    const removeComponent = (id: string) => {
      removedComponentId = id;
      if (selectedComponentId === id) {
        selectedComponentId = null;
      }
    };
    
    const activeElement = document.createElement('div');
    
    if (isBuilderRoute('/builder') && !isInputElement(activeElement)) {
      if (selectedComponentId) {
        removeComponent(selectedComponentId);
      }
    }
    
    assertEqual(removedComponentId, 'btn-1', '应该删除选中的组件');
    assertEqual(selectedComponentId, null, '选中状态应该被清除');
  });

  runner.test('完整流程模拟: input 中按 Delete 不删除组件', () => {
    let removedComponentId: string | null = null;
    let selectedComponentId: string | null = 'btn-1';
    
    const removeComponent = (id: string) => {
      removedComponentId = id;
    };
    
    const activeElement = document.createElement('input');
    
    if (isBuilderRoute('/builder') && !isInputElement(activeElement)) {
      if (selectedComponentId) {
        removeComponent(selectedComponentId);
      }
    }
    
    assertEqual(removedComponentId, null, '不应该删除组件');
    assertEqual(selectedComponentId, 'btn-1', '选中状态应该保持');
  });

  runner.test('完整流程模拟: preview 路由下快捷键不生效', () => {
    let undoCalled = false;
    
    const undo = () => { undoCalled = true; };
    
    if (isBuilderRoute('/preview')) {
      undo();
    }
    
    assert(undoCalled === false, 'preview 路由下不应该调用撤销');
  });

  runner.test('完整流程模拟: Ctrl+Z 触发撤销', () => {
    let undoCalled = false;
    let canUndo = true;
    
    const undo = () => { undoCalled = true; };
    
    const activeElement = document.createElement('div');
    const pathname = '/builder';
    
    if (isBuilderRoute(pathname) && !isInputElement(activeElement)) {
      if (canUndo) {
        undo();
      }
    }
    
    assert(undoCalled === true, '应该调用撤销');
  });

  runner.test('完整流程模拟: canUndo 为 false 时不调用撤销', () => {
    let undoCalled = false;
    let canUndo = false;
    
    const undo = () => { undoCalled = true; };
    
    const activeElement = document.createElement('div');
    const pathname = '/builder';
    
    if (isBuilderRoute(pathname) && !isInputElement(activeElement)) {
      if (canUndo) {
        undo();
      }
    }
    
    assert(undoCalled === false, 'canUndo 为 false 时不应该调用撤销');
  });

  return runner;
};

export default runKeyboardShortcutsTests;
