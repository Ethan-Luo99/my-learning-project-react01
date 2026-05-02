import { ComponentType, type ComponentSchema, type ContainerComponentSchema } from '@/types/component';
import { useBuilderStore } from './useBuilderStore';
import {
  TestRunner,
  assert,
  assertEqual,
  assertNotNull,
  createMockTextComponent,
  createMockButtonComponent,
  createMockContainerComponent,
  findComponentById,
} from '@/utils/test-helpers';

const isContainerComponent = (
  component: ComponentSchema
): component is ContainerComponentSchema => {
  return component.type === ComponentType.Container;
};

interface StoreSnapshot {
  components: ComponentSchema[];
  selectedComponentId: string | null;
  canUndo: boolean;
  canRedo: boolean;
}

const getStoreSnapshot = (): StoreSnapshot => {
  const state = useBuilderStore.getState();
  return {
    components: structuredClone(state.components),
    selectedComponentId: state.selectedComponentId,
    canUndo: state.canUndo,
    canRedo: state.canRedo,
  };
};

const resetStore = (): void => {
  const state = useBuilderStore.getState();
  state.createNewProject();
};

export const runBuilderStoreTests = (): TestRunner => {
  const runner = new TestRunner();

  runner.beforeAll(() => {
    console.log('开始运行 Builder Store 测试...');
  });

  runner.afterAll(() => {
    resetStore();
    console.log('测试完成，已重置 store');
  });

  runner.beforeEach(() => {
    resetStore();
  });

  runner.test('基础: addComponentToParent - 将组件拖入空 Container', () => {
    const state = useBuilderStore.getState();
    
    const container = createMockContainerComponent('container-1', []);
    state.addComponent(container);
    
    const textComponent = createMockTextComponent('text-1', '测试文本');
    
    state.addComponentToParent('container-1', textComponent);
    
    const snapshot = getStoreSnapshot();
    const containerInStore = findComponentById(snapshot.components, 'container-1') as ContainerComponentSchema;
    
    assertNotNull(containerInStore, '应该能找到 Container');
    assert(containerInStore.children !== undefined, 'Container 应该有 children 属性');
    assertEqual(containerInStore.children!.length, 1, 'Container 应该有 1 个子组件');
    assertEqual(containerInStore.children![0].id, 'text-1', '子组件 ID 应该匹配');
  });

  runner.test('基础: addComponentToParent - 将组件拖入已有子组件的 Container', () => {
    const state = useBuilderStore.getState();
    
    const existingChild = createMockTextComponent('existing-text', '已存在的文本');
    const container = createMockContainerComponent('container-1', [existingChild]);
    state.addComponent(container);
    
    const newChild = createMockButtonComponent('new-btn', '新按钮');
    
    state.addComponentToParent('container-1', newChild);
    
    const snapshot = getStoreSnapshot();
    const containerInStore = findComponentById(snapshot.components, 'container-1') as ContainerComponentSchema;
    
    assertEqual(containerInStore.children!.length, 2, 'Container 应该有 2 个子组件');
    assertEqual(containerInStore.children![0].id, 'existing-text', '第一个子组件应该是已存在的');
    assertEqual(containerInStore.children![1].id, 'new-btn', '第二个子组件应该是新添加的');
  });

  runner.test('排序: addComponentToParent - 在指定索引位置插入组件', () => {
    const state = useBuilderStore.getState();
    
    const child1 = createMockTextComponent('text-1', '文本1');
    const child2 = createMockTextComponent('text-2', '文本2');
    const container = createMockContainerComponent('container-1', [child1, child2]);
    state.addComponent(container);
    
    const newChild = createMockButtonComponent('btn-insert', '插入的按钮');
    
    state.addComponentToParent('container-1', newChild, 1);
    
    const snapshot = getStoreSnapshot();
    const containerInStore = findComponentById(snapshot.components, 'container-1') as ContainerComponentSchema;
    
    assertEqual(containerInStore.children!.length, 3, 'Container 应该有 3 个子组件');
    assertEqual(containerInStore.children![0].id, 'text-1', '索引 0 应该是 text-1');
    assertEqual(containerInStore.children![1].id, 'btn-insert', '索引 1 应该是插入的 btn-insert');
    assertEqual(containerInStore.children![2].id, 'text-2', '索引 2 应该是 text-2');
  });

  runner.test('移动: moveComponentToParent - 将组件从根级别拖入 Container', () => {
    const state = useBuilderStore.getState();
    
    const container = createMockContainerComponent('container-1', []);
    const textComponent = createMockTextComponent('text-1', '要移动的文本');
    
    state.addComponent(container);
    state.addComponent(textComponent);
    
    let snapshot = getStoreSnapshot();
    assertEqual(snapshot.components.length, 2, '根级别应该有 2 个组件');
    
    state.moveComponentToParent('text-1', 'container-1');
    
    snapshot = getStoreSnapshot();
    const containerInStore = findComponentById(snapshot.components, 'container-1') as ContainerComponentSchema;
    const textInRoot = findComponentById(snapshot.components, 'text-1');
    
    assertEqual(snapshot.components.length, 1, '根级别应该只有 1 个组件（Container）');
    assertEqual(textInRoot, null, '文本组件不应该在根级别');
    assertEqual(containerInStore.children!.length, 1, 'Container 应该有 1 个子组件');
    assertEqual(containerInStore.children![0].id, 'text-1', '文本组件应该在 Container 内');
  });

  runner.test('移动: moveComponentToParent - 将组件从 Container 拖出到根级别', () => {
    const state = useBuilderStore.getState();
    
    const textComponent = createMockTextComponent('text-1', '要移动的文本');
    const container = createMockContainerComponent('container-1', [textComponent]);
    
    state.addComponent(container);
    
    let snapshot = getStoreSnapshot();
    assertEqual(snapshot.components.length, 1, '根级别应该只有 1 个组件（Container）');
    
    state.moveComponentToParent('text-1', null);
    
    snapshot = getStoreSnapshot();
    const containerInStore = findComponentById(snapshot.components, 'container-1') as ContainerComponentSchema;
    const textInRoot = findComponentById(snapshot.components, 'text-1');
    
    assertEqual(snapshot.components.length, 2, '根级别应该有 2 个组件');
    assertNotNull(textInRoot, '文本组件应该在根级别');
    assertEqual(containerInStore.children!.length, 0, 'Container 应该为空');
  });

  runner.test('移动: moveComponentToParent - 将组件从一个 Container 拖入另一个 Container', () => {
    const state = useBuilderStore.getState();
    
    const textComponent = createMockTextComponent('text-1', '要移动的文本');
    const container1 = createMockContainerComponent('container-1', [textComponent]);
    const container2 = createMockContainerComponent('container-2', []);
    
    state.addComponent(container1);
    state.addComponent(container2);
    
    state.moveComponentToParent('text-1', 'container-2');
    
    const snapshot = getStoreSnapshot();
    const c1 = findComponentById(snapshot.components, 'container-1') as ContainerComponentSchema;
    const c2 = findComponentById(snapshot.components, 'container-2') as ContainerComponentSchema;
    
    assertEqual(c1.children!.length, 0, 'Container 1 应该为空');
    assertEqual(c2.children!.length, 1, 'Container 2 应该有 1 个子组件');
    assertEqual(c2.children![0].id, 'text-1', '文本组件应该在 Container 2 内');
  });

  runner.test('嵌套: 2层嵌套容器 - 将组件从内层拖到外层', () => {
    const state = useBuilderStore.getState();
    
    const innerText = createMockTextComponent('inner-text', '内层文本');
    const innerContainer = createMockContainerComponent('inner-container', [innerText]);
    const outerContainer = createMockContainerComponent('outer-container', [innerContainer]);
    
    state.addComponent(outerContainer);
    
    let snapshot = getStoreSnapshot();
    let outer = findComponentById(snapshot.components, 'outer-container') as ContainerComponentSchema;
    let inner = findComponentById(outer.children!, 'inner-container') as ContainerComponentSchema;
    
    assertEqual(inner.children!.length, 1, '内层 Container 应该有 1 个子组件');
    
    state.moveComponentToParent('inner-text', 'outer-container');
    
    snapshot = getStoreSnapshot();
    outer = findComponentById(snapshot.components, 'outer-container') as ContainerComponentSchema;
    inner = findComponentById(outer.children!, 'inner-container') as ContainerComponentSchema;
    
    assertEqual(inner.children!.length, 0, '内层 Container 应该为空');
    assertEqual(outer.children!.length, 2, '外层 Container 应该有 2 个子组件');
    
    const innerTextInOuter = outer.children!.find(c => c.id === 'inner-text');
    assertNotNull(innerTextInOuter, '文本组件应该在外层 Container 内');
  });

  runner.test('嵌套: 2层嵌套容器 - 将组件从外层拖到内层', () => {
    const state = useBuilderStore.getState();
    
    const outerText = createMockTextComponent('outer-text', '外层文本');
    const innerContainer = createMockContainerComponent('inner-container', []);
    const outerContainer = createMockContainerComponent('outer-container', [outerText, innerContainer]);
    
    state.addComponent(outerContainer);
    
    state.moveComponentToParent('outer-text', 'inner-container');
    
    const snapshot = getStoreSnapshot();
    const outer = findComponentById(snapshot.components, 'outer-container') as ContainerComponentSchema;
    const inner = findComponentById(outer.children!, 'inner-container') as ContainerComponentSchema;
    
    assertEqual(outer.children!.length, 1, '外层 Container 应该只有 1 个子组件（内层 Container）');
    assertEqual(inner.children!.length, 1, '内层 Container 应该有 1 个子组件');
    assertEqual(inner.children![0].id, 'outer-text', '文本组件应该在内层 Container 内');
  });

  runner.test('嵌套: 2层嵌套容器 - 将组件从内层拖到根级别', () => {
    const state = useBuilderStore.getState();
    
    const innerText = createMockTextComponent('inner-text', '内层文本');
    const innerContainer = createMockContainerComponent('inner-container', [innerText]);
    const outerContainer = createMockContainerComponent('outer-container', [innerContainer]);
    
    state.addComponent(outerContainer);
    
    let snapshot = getStoreSnapshot();
    assertEqual(snapshot.components.length, 1, '根级别应该只有 1 个组件（外层 Container）');
    
    state.moveComponentToParent('inner-text', null);
    
    snapshot = getStoreSnapshot();
    const outer = findComponentById(snapshot.components, 'outer-container') as ContainerComponentSchema;
    const inner = findComponentById(outer.children!, 'inner-container') as ContainerComponentSchema;
    const textInRoot = findComponentById(snapshot.components, 'inner-text');
    
    assertEqual(snapshot.components.length, 2, '根级别应该有 2 个组件');
    assertNotNull(textInRoot, '文本组件应该在根级别');
    assertEqual(inner.children!.length, 0, '内层 Container 应该为空');
  });

  runner.test('排序: moveComponentToParent - 在指定索引位置移动组件', () => {
    const state = useBuilderStore.getState();
    
    const child1 = createMockTextComponent('text-1', '文本1');
    const child2 = createMockTextComponent('text-2', '文本2');
    const child3 = createMockTextComponent('text-3', '文本3');
    const container = createMockContainerComponent('container-1', [child1, child2, child3]);
    
    state.addComponent(container);
    
    state.moveComponentToParent('text-3', 'container-1', 0);
    
    const snapshot = getStoreSnapshot();
    const containerInStore = findComponentById(snapshot.components, 'container-1') as ContainerComponentSchema;
    
    assertEqual(containerInStore.children!.length, 3, 'Container 应该有 3 个子组件');
    assertEqual(containerInStore.children![0].id, 'text-3', '索引 0 应该是 text-3（移动到最前面）');
    assertEqual(containerInStore.children![1].id, 'text-1', '索引 1 应该是 text-1');
    assertEqual(containerInStore.children![2].id, 'text-2', '索引 2 应该是 text-2');
  });

  runner.test('撤销/重做: addComponentToParent 后撤销', () => {
    const state = useBuilderStore.getState();
    
    const container = createMockContainerComponent('container-1', []);
    state.addComponent(container);
    
    const snapshotBefore = getStoreSnapshot();
    
    const textComponent = createMockTextComponent('text-1', '测试文本');
    state.addComponentToParent('container-1', textComponent);
    
    let snapshot = getStoreSnapshot();
    const containerWithChild = findComponentById(snapshot.components, 'container-1') as ContainerComponentSchema;
    assertEqual(containerWithChild.children!.length, 1, '添加后 Container 应该有 1 个子组件');
    assert(snapshot.canUndo, '应该可以撤销');
    
    state.undo();
    
    snapshot = getStoreSnapshot();
    const containerAfterUndo = findComponentById(snapshot.components, 'container-1') as ContainerComponentSchema;
    
    assertEqual(containerAfterUndo.children!.length, 0, '撤销后 Container 应该为空');
    assert(snapshot.canRedo, '应该可以重做');
  });

  runner.test('撤销/重做: moveComponentToParent 后撤销和重做', () => {
    const state = useBuilderStore.getState();
    
    const textComponent = createMockTextComponent('text-1', '要移动的文本');
    const container = createMockContainerComponent('container-1', []);
    
    state.addComponent(container);
    state.addComponent(textComponent);
    
    state.moveComponentToParent('text-1', 'container-1');
    
    let snapshot = getStoreSnapshot();
    let containerInStore = findComponentById(snapshot.components, 'container-1') as ContainerComponentSchema;
    assertEqual(containerInStore.children!.length, 1, '移动后 Container 应该有 1 个子组件');
    assert(snapshot.canUndo, '应该可以撤销');
    
    state.undo();
    
    snapshot = getStoreSnapshot();
    containerInStore = findComponentById(snapshot.components, 'container-1') as ContainerComponentSchema;
    let textInRoot = findComponentById(snapshot.components, 'text-1');
    
    assertEqual(containerInStore.children!.length, 0, '撤销后 Container 应该为空');
    assertNotNull(textInRoot, '撤销后文本组件应该在根级别');
    assert(snapshot.canRedo, '应该可以重做');
    
    state.redo();
    
    snapshot = getStoreSnapshot();
    containerInStore = findComponentById(snapshot.components, 'container-1') as ContainerComponentSchema;
    textInRoot = findComponentById(snapshot.components, 'text-1');
    
    assertEqual(containerInStore.children!.length, 1, '重做后 Container 应该有 1 个子组件');
    assertEqual(textInRoot, null, '重做后文本组件不应该在根级别');
  });

  runner.test('边界: 不能将组件拖入自身（Container 拖入自己）', () => {
    const state = useBuilderStore.getState();
    
    const innerText = createMockTextComponent('text-1', '文本');
    const container = createMockContainerComponent('container-1', [innerText]);
    
    state.addComponent(container);
    
    const snapshotBefore = getStoreSnapshot();
    const containerBefore = findComponentById(snapshotBefore.components, 'container-1') as ContainerComponentSchema;
    
    state.moveComponentToParent('container-1', 'container-1');
    
    const snapshotAfter = getStoreSnapshot();
    const containerAfter = findComponentById(snapshotAfter.components, 'container-1') as ContainerComponentSchema;
    
    assertEqual(
      JSON.stringify(containerBefore.children),
      JSON.stringify(containerAfter.children),
      '试图将 Container 拖入自身应该不改变状态'
    );
  });

  runner.test('边界: 移动不存在的组件应该不产生异常', () => {
    const state = useBuilderStore.getState();
    
    const container = createMockContainerComponent('container-1', []);
    state.addComponent(container);
    
    let didThrow = false;
    try {
      state.moveComponentToParent('non-existent-component', 'container-1');
    } catch {
      didThrow = true;
    }
    
    assert(!didThrow, '移动不存在的组件不应该抛出异常');
    
    const snapshot = getStoreSnapshot();
    const containerInStore = findComponentById(snapshot.components, 'container-1') as ContainerComponentSchema;
    
    assertEqual(containerInStore.children!.length, 0, 'Container 应该仍然为空');
  });

  runner.test('边界: 移动到不存在的父容器应该将组件移动到根级别', () => {
    const state = useBuilderStore.getState();
    
    const textComponent = createMockTextComponent('text-1', '文本');
    const container = createMockContainerComponent('container-1', [textComponent]);
    
    state.addComponent(container);
    
    state.moveComponentToParent('text-1', 'non-existent-container');
    
    const snapshot = getStoreSnapshot();
    const containerInStore = findComponentById(snapshot.components, 'container-1') as ContainerComponentSchema;
    const textInRoot = findComponentById(snapshot.components, 'text-1');
    
    assertEqual(containerInStore.children!.length, 0, 'Container 应该为空');
    assertNotNull(textInRoot, '文本组件应该被移动到根级别（因为目标容器不存在）');
  });

  runner.test('排序: 同一 Container 内子组件交换位置（模拟拖拽排序）', () => {
    const state = useBuilderStore.getState();
    
    const child1 = createMockTextComponent('text-1', '文本1');
    const child2 = createMockTextComponent('text-2', '文本2');
    const child3 = createMockTextComponent('text-3', '文本3');
    const container = createMockContainerComponent('container-1', [child1, child2, child3]);
    
    state.addComponent(container);
    
    let snapshot = getStoreSnapshot();
    let containerInStore = findComponentById(snapshot.components, 'container-1') as ContainerComponentSchema;
    
    assertEqual(containerInStore.children![0].id, 'text-1', '初始顺序: text-1, text-2, text-3');
    
    state.moveComponentToParent('text-2', 'container-1', 0);
    
    snapshot = getStoreSnapshot();
    containerInStore = findComponentById(snapshot.components, 'container-1') as ContainerComponentSchema;
    
    assertEqual(containerInStore.children!.length, 3, '子组件数量应该不变');
    assertEqual(containerInStore.children![0].id, 'text-2', 'text-2 应该移到最前面');
    assertEqual(containerInStore.children![1].id, 'text-1', 'text-1 应该在第二位');
    assertEqual(containerInStore.children![2].id, 'text-3', 'text-3 应该在第三位');
  });

  runner.test('复杂场景: 多层级拖拽后撤销/重做的历史记录完整性', () => {
    const state = useBuilderStore.getState();
    
    const innerText = createMockTextComponent('text-1', '文本');
    const innerContainer = createMockContainerComponent('inner-container', [innerText]);
    const outerContainer = createMockContainerComponent('outer-container', [innerContainer]);
    
    state.addComponent(outerContainer);
    
    state.moveComponentToParent('text-1', 'outer-container');
    state.moveComponentToParent('text-1', null);
    state.moveComponentToParent('text-1', 'inner-container');
    
    let snapshot = getStoreSnapshot();
    const outer = findComponentById(snapshot.components, 'outer-container') as ContainerComponentSchema;
    const inner = findComponentById(outer.children!, 'inner-container') as ContainerComponentSchema;
    
    assertEqual(inner.children!.length, 1, '最终文本应该在内层 Container');
    
    assert(snapshot.canUndo, '应该可以撤销');
    
    state.undo();
    snapshot = getStoreSnapshot();
    let textInRoot = findComponentById(snapshot.components, 'text-1');
    assertNotNull(textInRoot, '撤销1次后文本应该在根级别');
    
    state.undo();
    snapshot = getStoreSnapshot();
    outer = findComponentById(snapshot.components, 'outer-container') as ContainerComponentSchema;
    let textInOuter = outer.children!.find(c => c.id === 'text-1');
    assertNotNull(textInOuter, '撤销2次后文本应该在外层 Container');
    
    state.undo();
    snapshot = getStoreSnapshot();
    outer = findComponentById(snapshot.components, 'outer-container') as ContainerComponentSchema;
    inner = findComponentById(outer.children!, 'inner-container') as ContainerComponentSchema;
    assertEqual(inner.children!.length, 1, '撤销3次后文本应该在内层 Container（初始状态）');
    
    assert(snapshot.canRedo, '应该可以重做');
    
    state.redo();
    state.redo();
    state.redo();
    
    snapshot = getStoreSnapshot();
    outer = findComponentById(snapshot.components, 'outer-container') as ContainerComponentSchema;
    inner = findComponentById(outer.children!, 'inner-container') as ContainerComponentSchema;
    assertEqual(inner.children!.length, 1, '重做3次后文本应该回到最终状态');
  });

  return runner;
};

export default runBuilderStoreTests;
