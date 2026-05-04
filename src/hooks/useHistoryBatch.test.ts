import { ComponentType, type ComponentSchema } from '@/types/component';
import { useBuilderStore } from '@/store/useBuilderStore';
import {
  TestRunner,
  assert,
  assertEqual,
  assertNotNull,
  createMockTextComponent,
  createMockButtonComponent,
  findComponentById,
} from '@/utils/test-helpers';

interface StoreSnapshot {
  components: ComponentSchema[];
  history: unknown[];
  currentIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  isInHistoryBatch: boolean;
  batchStartComponents: ComponentSchema[] | null;
}

const getStoreSnapshot = (): StoreSnapshot => {
  const state = useBuilderStore.getState();
  return {
    components: structuredClone(state.components),
    history: structuredClone(state.history),
    currentIndex: state.currentIndex,
    canUndo: state.canUndo,
    canRedo: state.canRedo,
    isInHistoryBatch: state.isInHistoryBatch,
    batchStartComponents: state.batchStartComponents ? structuredClone(state.batchStartComponents) : null,
  };
};

const resetStore = (): void => {
  const state = useBuilderStore.getState();
  state.createNewProject();
};

const getHistoryLength = (): number => {
  return useBuilderStore.getState().history.length;
};

export const runHistoryBatchTests = (): TestRunner => {
  const runner = new TestRunner();

  runner.beforeAll(() => {
    console.log('开始运行 批量历史记录 功能测试...');
  });

  runner.afterAll(() => {
    resetStore();
    console.log('批量历史记录 测试完成，已重置 store');
  });

  runner.beforeEach(() => {
    resetStore();
  });

  runner.test('基础: beginHistoryBatch 应该设置 isInHistoryBatch 为 true', () => {
    const state = useBuilderStore.getState();
    
    assertEqual(state.isInHistoryBatch, false, '初始状态 isInHistoryBatch 应该为 false');
    assertEqual(state.batchStartComponents, null, '初始状态 batchStartComponents 应该为 null');
    
    state.beginHistoryBatch();
    
    const snapshot = getStoreSnapshot();
    assertEqual(snapshot.isInHistoryBatch, true, 'beginHistoryBatch 后 isInHistoryBatch 应该为 true');
    assertNotNull(snapshot.batchStartComponents, 'beginHistoryBatch 后 batchStartComponents 不应该为 null');
  });

  runner.test('基础: endHistoryBatch 应该设置 isInHistoryBatch 为 false', () => {
    const state = useBuilderStore.getState();
    
    state.beginHistoryBatch();
    assertEqual(getStoreSnapshot().isInHistoryBatch, true, 'beginHistoryBatch 后 isInHistoryBatch 应该为 true');
    
    state.endHistoryBatch();
    
    const snapshot = getStoreSnapshot();
    assertEqual(snapshot.isInHistoryBatch, false, 'endHistoryBatch 后 isInHistoryBatch 应该为 false');
    assertEqual(snapshot.batchStartComponents, null, 'endHistoryBatch 后 batchStartComponents 应该为 null');
  });

  runner.test('基础: cancelHistoryBatch 应该取消批量模式而不记录历史', () => {
    const state = useBuilderStore.getState();
    
    state.beginHistoryBatch();
    assertEqual(getStoreSnapshot().isInHistoryBatch, true, 'beginHistoryBatch 后 isInHistoryBatch 应该为 true');
    
    state.cancelHistoryBatch();
    
    const snapshot = getStoreSnapshot();
    assertEqual(snapshot.isInHistoryBatch, false, 'cancelHistoryBatch 后 isInHistoryBatch 应该为 false');
    assertEqual(snapshot.batchStartComponents, null, 'cancelHistoryBatch 后 batchStartComponents 应该为 null');
  });

  runner.test('核心: 批量模式下 pushHistory 不应该记录历史', () => {
    const state = useBuilderStore.getState();
    
    const textComponent = createMockTextComponent('text-1', '测试文本');
    state.addComponent(textComponent);
    
    const historyLengthAfterAdd = getHistoryLength();
    assert(historyLengthAfterAdd > 0, '添加组件后历史长度应该大于 0');
    
    state.beginHistoryBatch();
    
    state.updateComponent('text-1', { x: 100, y: 100 });
    
    const historyLengthDuringBatch = getHistoryLength();
    assertEqual(
      historyLengthDuringBatch,
      historyLengthAfterAdd,
      '批量模式下 updateComponent 不应该增加历史长度'
    );
  });

  runner.test('核心: endHistoryBatch 应该只记录一次历史变化', () => {
    const state = useBuilderStore.getState();
    
    const textComponent = createMockTextComponent('text-1', '测试文本');
    state.addComponent(textComponent);
    
    const historyLengthAfterAdd = getHistoryLength();
    const originalHistoryLength = historyLengthAfterAdd;
    
    state.beginHistoryBatch();
    
    state.updateComponent('text-1', { x: 100, y: 100 });
    state.updateComponent('text-1', { x: 200, y: 200 });
    state.updateComponent('text-1', { x: 300, y: 300 });
    
    const historyLengthDuringBatch = getHistoryLength();
    assertEqual(
      historyLengthDuringBatch,
      originalHistoryLength,
      '批量模式下多次 updateComponent 不应该增加历史长度'
    );
    
    state.endHistoryBatch();
    
    const historyLengthAfterEnd = getHistoryLength();
    assertEqual(
      historyLengthAfterEnd,
      originalHistoryLength + 1,
      'endHistoryBatch 后应该只增加 1 条历史记录'
    );
  });

  runner.test('模拟缩放: 缩放过程中 history 长度保持不变', () => {
    const state = useBuilderStore.getState();
    
    const textComponent = createMockTextComponent('text-1', '测试文本');
    state.addComponent(textComponent);
    
    const historyLengthAfterAdd = getHistoryLength();
    const originalHistoryLength = historyLengthAfterAdd;
    
    state.beginHistoryBatch();
    
    state.updateComponent('text-1', { width: 250, height: 60 });
    assertEqual(getHistoryLength(), originalHistoryLength, '第一次缩放后历史长度不变');
    
    state.updateComponent('text-1', { width: 300, height: 80 });
    assertEqual(getHistoryLength(), originalHistoryLength, '第二次缩放后历史长度不变');
    
    state.updateComponent('text-1', { width: 350, height: 100 });
    assertEqual(getHistoryLength(), originalHistoryLength, '第三次缩放后历史长度不变');
    
    state.endHistoryBatch();
    
    const historyLengthAfterEnd = getHistoryLength();
    assertEqual(
      historyLengthAfterEnd,
      originalHistoryLength + 1,
      '缩放结束后应该只增加 1 条历史记录'
    );
  });

  runner.test('模拟拖拽: 拖拽过程中 history 长度保持不变', () => {
    const state = useBuilderStore.getState();
    
    const textComponent = createMockTextComponent('text-1', '测试文本');
    state.addComponent(textComponent);
    
    const historyLengthAfterAdd = getHistoryLength();
    const originalHistoryLength = historyLengthAfterAdd;
    
    state.beginHistoryBatch();
    
    state.updateComponent('text-1', { x: 50, y: 50 });
    assertEqual(getHistoryLength(), originalHistoryLength, '第一次移动后历史长度不变');
    
    state.updateComponent('text-1', { x: 100, y: 100 });
    assertEqual(getHistoryLength(), originalHistoryLength, '第二次移动后历史长度不变');
    
    state.updateComponent('text-1', { x: 150, y: 150 });
    assertEqual(getHistoryLength(), originalHistoryLength, '第三次移动后历史长度不变');
    
    state.endHistoryBatch();
    
    const historyLengthAfterEnd = getHistoryLength();
    assertEqual(
      historyLengthAfterEnd,
      originalHistoryLength + 1,
      '拖拽结束后应该只增加 1 条历史记录'
    );
  });

  runner.test('模拟多选拖拽: 多个组件拖拽后 endHistoryBatch 只记录一次', () => {
    const state = useBuilderStore.getState();
    
    const textComponent1 = createMockTextComponent('text-1', '文本1');
    const textComponent2 = createMockTextComponent('text-2', '文本2');
    const textComponent3 = createMockTextComponent('text-3', '文本3');
    
    state.addComponent(textComponent1);
    state.addComponent(textComponent2);
    state.addComponent(textComponent3);
    
    const historyLengthAfterAdd = getHistoryLength();
    const originalHistoryLength = historyLengthAfterAdd;
    
    state.beginHistoryBatch();
    
    state.updateComponent('text-1', { x: 100, y: 100 });
    state.updateComponent('text-2', { x: 200, y: 100 });
    state.updateComponent('text-3', { x: 300, y: 100 });
    assertEqual(getHistoryLength(), originalHistoryLength, '第一次批量移动后历史长度不变');
    
    state.updateComponent('text-1', { x: 150, y: 150 });
    state.updateComponent('text-2', { x: 250, y: 150 });
    state.updateComponent('text-3', { x: 350, y: 150 });
    assertEqual(getHistoryLength(), originalHistoryLength, '第二次批量移动后历史长度不变');
    
    state.endHistoryBatch();
    
    const historyLengthAfterEnd = getHistoryLength();
    assertEqual(
      historyLengthAfterEnd,
      originalHistoryLength + 1,
      '多选拖拽结束后应该只增加 1 条历史记录'
    );
  });

  runner.test('撤销验证: 缩放后撤销应该回到缩放前状态', () => {
    const state = useBuilderStore.getState();
    
    const textComponent = createMockTextComponent('text-1', '测试文本');
    textComponent.x = 10;
    textComponent.y = 10;
    textComponent.width = 200;
    state.addComponent(textComponent);
    
    const snapshotBeforeResize = getStoreSnapshot();
    const componentBeforeResize = findComponentById(snapshotBeforeResize.components, 'text-1');
    assertNotNull(componentBeforeResize, '应该能找到组件');
    
    state.beginHistoryBatch();
    
    state.updateComponent('text-1', { x: 50, y: 50, width: 300, height: 100 });
    state.updateComponent('text-1', { x: 100, y: 100, width: 400, height: 150 });
    
    state.endHistoryBatch();
    
    const snapshotAfterResize = getStoreSnapshot();
    const componentAfterResize = findComponentById(snapshotAfterResize.components, 'text-1');
    assertNotNull(componentAfterResize, '应该能找到组件');
    assert(componentAfterResize.width === 400, '缩放后宽度应该是 400');
    assert(componentAfterResize.x === 100, '缩放后 x 应该是 100');
    
    assert(snapshotAfterResize.canUndo, '应该可以撤销');
    
    state.undo();
    
    const snapshotAfterUndo = getStoreSnapshot();
    const componentAfterUndo = findComponentById(snapshotAfterUndo.components, 'text-1');
    assertNotNull(componentAfterUndo, '应该能找到组件');
    
    assertEqual(
      componentAfterUndo.x,
      componentBeforeResize.x,
      '撤销后 x 应该回到缩放前的值'
    );
    assertEqual(
      componentAfterUndo.width,
      componentBeforeResize.width,
      '撤销后 width 应该回到缩放前的值'
    );
  });

  runner.test('撤销验证: 拖拽后撤销应该回到拖拽前位置', () => {
    const state = useBuilderStore.getState();
    
    const textComponent = createMockTextComponent('text-1', '测试文本');
    textComponent.x = 10;
    textComponent.y = 10;
    state.addComponent(textComponent);
    
    const snapshotBeforeDrag = getStoreSnapshot();
    const componentBeforeDrag = findComponentById(snapshotBeforeDrag.components, 'text-1');
    assertNotNull(componentBeforeDrag, '应该能找到组件');
    
    state.beginHistoryBatch();
    
    state.updateComponent('text-1', { x: 50, y: 50 });
    state.updateComponent('text-1', { x: 100, y: 100 });
    state.updateComponent('text-1', { x: 200, y: 200 });
    
    state.endHistoryBatch();
    
    const snapshotAfterDrag = getStoreSnapshot();
    const componentAfterDrag = findComponentById(snapshotAfterDrag.components, 'text-1');
    assertNotNull(componentAfterDrag, '应该能找到组件');
    assert(componentAfterDrag.x === 200, '拖拽后 x 应该是 200');
    assert(componentAfterDrag.y === 200, '拖拽后 y 应该是 200');
    
    assert(snapshotAfterDrag.canUndo, '应该可以撤销');
    
    state.undo();
    
    const snapshotAfterUndo = getStoreSnapshot();
    const componentAfterUndo = findComponentById(snapshotAfterUndo.components, 'text-1');
    assertNotNull(componentAfterUndo, '应该能找到组件');
    
    assertEqual(
      componentAfterUndo.x,
      componentBeforeDrag.x,
      '撤销后 x 应该回到拖拽前的值'
    );
    assertEqual(
      componentAfterUndo.y,
      componentBeforeDrag.y,
      '撤销后 y 应该回到拖拽前的值'
    );
  });

  runner.test('撤销验证: 多选拖拽后撤销应该回到拖拽前位置', () => {
    const state = useBuilderStore.getState();
    
    const textComponent1 = createMockTextComponent('text-1', '文本1');
    textComponent1.x = 10;
    textComponent1.y = 10;
    
    const textComponent2 = createMockTextComponent('text-2', '文本2');
    textComponent2.x = 100;
    textComponent2.y = 10;
    
    state.addComponent(textComponent1);
    state.addComponent(textComponent2);
    
    const snapshotBeforeDrag = getStoreSnapshot();
    const comp1Before = findComponentById(snapshotBeforeDrag.components, 'text-1');
    const comp2Before = findComponentById(snapshotBeforeDrag.components, 'text-2');
    assertNotNull(comp1Before, '应该能找到组件1');
    assertNotNull(comp2Before, '应该能找到组件2');
    
    state.beginHistoryBatch();
    
    state.updateComponent('text-1', { x: 200, y: 200 });
    state.updateComponent('text-2', { x: 300, y: 200 });
    
    state.updateComponent('text-1', { x: 250, y: 250 });
    state.updateComponent('text-2', { x: 350, y: 250 });
    
    state.endHistoryBatch();
    
    const snapshotAfterDrag = getStoreSnapshot();
    const comp1After = findComponentById(snapshotAfterDrag.components, 'text-1');
    const comp2After = findComponentById(snapshotAfterDrag.components, 'text-2');
    assertNotNull(comp1After, '应该能找到组件1');
    assertNotNull(comp2After, '应该能找到组件2');
    
    assert(comp1After.x === 250, '组件1拖拽后 x 应该是 250');
    assert(comp2After.x === 350, '组件2拖拽后 x 应该是 350');
    
    assert(snapshotAfterDrag.canUndo, '应该可以撤销');
    
    state.undo();
    
    const snapshotAfterUndo = getStoreSnapshot();
    const comp1AfterUndo = findComponentById(snapshotAfterUndo.components, 'text-1');
    const comp2AfterUndo = findComponentById(snapshotAfterUndo.components, 'text-2');
    assertNotNull(comp1AfterUndo, '应该能找到组件1');
    assertNotNull(comp2AfterUndo, '应该能找到组件2');
    
    assertEqual(comp1AfterUndo.x, comp1Before.x, '组件1撤销后 x 应该回到拖拽前的值');
    assertEqual(comp1AfterUndo.y, comp1Before.y, '组件1撤销后 y 应该回到拖拽前的值');
    assertEqual(comp2AfterUndo.x, comp2Before.x, '组件2撤销后 x 应该回到拖拽前的值');
    assertEqual(comp2AfterUndo.y, comp2Before.y, '组件2撤销后 y 应该回到拖拽前的值');
  });

  runner.test('cancelHistoryBatch: 取消后不记录历史', () => {
    const state = useBuilderStore.getState();
    
    const textComponent = createMockTextComponent('text-1', '测试文本');
    state.addComponent(textComponent);
    
    const historyLengthAfterAdd = getHistoryLength();
    const originalHistoryLength = historyLengthAfterAdd;
    
    state.beginHistoryBatch();
    
    state.updateComponent('text-1', { x: 100, y: 100 });
    state.updateComponent('text-1', { x: 200, y: 200 });
    
    assertEqual(getHistoryLength(), originalHistoryLength, '批量模式下历史长度不变');
    
    state.cancelHistoryBatch();
    
    assertEqual(getHistoryLength(), originalHistoryLength, 'cancelHistoryBatch 后历史长度不变');
    
    const snapshot = getStoreSnapshot();
    assertEqual(snapshot.isInHistoryBatch, false, 'cancelHistoryBatch 后 isInHistoryBatch 应该为 false');
  });

  runner.test('重做验证: endHistoryBatch 后可以重做', () => {
    const state = useBuilderStore.getState();
    
    const textComponent = createMockTextComponent('text-1', '测试文本');
    textComponent.x = 10;
    textComponent.y = 10;
    state.addComponent(textComponent);
    
    const snapshotBefore = getStoreSnapshot();
    const componentBefore = findComponentById(snapshotBefore.components, 'text-1');
    assertNotNull(componentBefore, '应该能找到组件');
    
    state.beginHistoryBatch();
    state.updateComponent('text-1', { x: 200, y: 200 });
    state.endHistoryBatch();
    
    const snapshotAfter = getStoreSnapshot();
    const componentAfter = findComponentById(snapshotAfter.components, 'text-1');
    assertNotNull(componentAfter, '应该能找到组件');
    
    assert(snapshotAfter.canUndo, '应该可以撤销');
    
    state.undo();
    
    const snapshotAfterUndo = getStoreSnapshot();
    const componentAfterUndo = findComponentById(snapshotAfterUndo.components, 'text-1');
    assertNotNull(componentAfterUndo, '应该能找到组件');
    
    assert(snapshotAfterUndo.canRedo, '应该可以重做');
    assertEqual(componentAfterUndo.x, componentBefore.x, '撤销后 x 应该回到原始值');
    
    state.redo();
    
    const snapshotAfterRedo = getStoreSnapshot();
    const componentAfterRedo = findComponentById(snapshotAfterRedo.components, 'text-1');
    assertNotNull(componentAfterRedo, '应该能找到组件');
    
    assertEqual(componentAfterRedo.x, 200, '重做后 x 应该是 200');
  });

  runner.test('嵌套批量操作: 连续多次 beginHistoryBatch 后 endHistoryBatch', () => {
    const state = useBuilderStore.getState();
    
    const textComponent = createMockTextComponent('text-1', '测试文本');
    state.addComponent(textComponent);
    
    const historyLengthAfterAdd = getHistoryLength();
    const originalHistoryLength = historyLengthAfterAdd;
    
    state.beginHistoryBatch();
    state.updateComponent('text-1', { x: 100, y: 100 });
    
    state.beginHistoryBatch();
    state.updateComponent('text-1', { x: 200, y: 200 });
    
    assertEqual(getHistoryLength(), originalHistoryLength, '嵌套批量模式下历史长度不变');
    
    state.endHistoryBatch();
    
    const historyLengthAfterEnd = getHistoryLength();
    assertEqual(
      historyLengthAfterEnd,
      originalHistoryLength + 1,
      'endHistoryBatch 后应该只增加 1 条历史记录'
    );
    
    const snapshot = getStoreSnapshot();
    assertEqual(snapshot.isInHistoryBatch, false, 'endHistoryBatch 后 isInHistoryBatch 应该为 false');
  });

  runner.test('历史记录洪水防护: 模拟 100 次 mousemove 只记录 1 条历史', () => {
    const state = useBuilderStore.getState();
    
    const textComponent = createMockTextComponent('text-1', '测试文本');
    state.addComponent(textComponent);
    
    const historyLengthAfterAdd = getHistoryLength();
    const originalHistoryLength = historyLengthAfterAdd;
    
    state.beginHistoryBatch();
    
    for (let i = 0; i < 100; i++) {
      state.updateComponent('text-1', { x: i * 10, y: i * 10 });
    }
    
    const historyLengthDuringBatch = getHistoryLength();
    assertEqual(
      historyLengthDuringBatch,
      originalHistoryLength,
      '100 次 updateComponent 后历史长度应该不变'
    );
    
    state.endHistoryBatch();
    
    const historyLengthAfterEnd = getHistoryLength();
    assertEqual(
      historyLengthAfterEnd,
      originalHistoryLength + 1,
      'endHistoryBatch 后应该只增加 1 条历史记录'
    );
    
    const snapshot = getStoreSnapshot();
    const component = findComponentById(snapshot.components, 'text-1');
    assertNotNull(component, '应该能找到组件');
    assertEqual(component.x, 990, '最后一次更新的 x 应该是 990');
    assertEqual(component.y, 990, '最后一次更新的 y 应该是 990');
  });

  return runner;
};

export default runHistoryBatchTests;
