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

  runner.test('层级排序: 3个组件同时存在时上移/下移的索引变化验证', () => {
    const state = useBuilderStore.getState();
    
    const text1 = createMockTextComponent('text-1', '文本1');
    const text2 = createMockTextComponent('text-2', '文本2');
    const text3 = createMockTextComponent('text-3', '文本3');
    
    state.addComponent(text1);
    state.addComponent(text2);
    state.addComponent(text3);
    
    let snapshot = getStoreSnapshot();
    assertEqual(snapshot.components[0].id, 'text-1', '初始顺序: text-1 (索引0)');
    assertEqual(snapshot.components[1].id, 'text-2', '初始顺序: text-2 (索引1)');
    assertEqual(snapshot.components[2].id, 'text-3', '初始顺序: text-3 (索引2)');
    
    const layerInfo1 = state.getComponentLayerInfo('text-1');
    const layerInfo2 = state.getComponentLayerInfo('text-2');
    const layerInfo3 = state.getComponentLayerInfo('text-3');
    
    assertNotNull(layerInfo1, '应该能获取 text-1 的层级信息');
    assertNotNull(layerInfo2, '应该能获取 text-2 的层级信息');
    assertNotNull(layerInfo3, '应该能获取 text-3 的层级信息');
    
    assertEqual(layerInfo1!.currentLayer, 1, 'text-1 当前层级应为 1');
    assertEqual(layerInfo2!.currentLayer, 2, 'text-2 当前层级应为 2');
    assertEqual(layerInfo3!.currentLayer, 3, 'text-3 当前层级应为 3');
    assertEqual(layerInfo1!.totalLayers, 3, '总层级应为 3');
    
    state.moveUp('text-1');
    snapshot = getStoreSnapshot();
    assertEqual(snapshot.components[0].id, 'text-2', 'text-1 上移后，text-2 应该在索引0');
    assertEqual(snapshot.components[1].id, 'text-1', 'text-1 上移后，应该在索引1');
    assertEqual(snapshot.components[2].id, 'text-3', 'text-3 位置不变');
    
    state.moveDown('text-3');
    snapshot = getStoreSnapshot();
    assertEqual(snapshot.components[0].id, 'text-2', 'text-2 位置不变');
    assertEqual(snapshot.components[1].id, 'text-3', 'text-3 下移后，应该在索引1');
    assertEqual(snapshot.components[2].id, 'text-1', 'text-1 应该在索引2');
  });

  runner.test('层级排序: 5个组件时置顶/置底的索引验证', () => {
    const state = useBuilderStore.getState();
    
    const text1 = createMockTextComponent('text-1', '文本1');
    const text2 = createMockTextComponent('text-2', '文本2');
    const text3 = createMockTextComponent('text-3', '文本3');
    const text4 = createMockTextComponent('text-4', '文本4');
    const text5 = createMockTextComponent('text-5', '文本5');
    
    state.addComponent(text1);
    state.addComponent(text2);
    state.addComponent(text3);
    state.addComponent(text4);
    state.addComponent(text5);
    
    let snapshot = getStoreSnapshot();
    assertEqual(snapshot.components[0].id, 'text-1', '初始顺序: text-1 (索引0)');
    assertEqual(snapshot.components[4].id, 'text-5', '初始顺序: text-5 (索引4)');
    
    const layerInfo1 = state.getComponentLayerInfo('text-1');
    const layerInfo5 = state.getComponentLayerInfo('text-5');
    
    assertEqual(layerInfo1!.currentLayer, 1, 'text-1 当前层级应为 1（最底层）');
    assertEqual(layerInfo5!.currentLayer, 5, 'text-5 当前层级应为 5（最顶层）');
    
    state.moveToTop('text-1');
    snapshot = getStoreSnapshot();
    assertEqual(snapshot.components[4].id, 'text-1', 'text-1 置顶后应该在索引4（最顶层）');
    
    const layerInfo1AfterTop = state.getComponentLayerInfo('text-1');
    assertEqual(layerInfo1AfterTop!.currentLayer, 5, 'text-1 置顶后层级应为 5');
    
    state.moveToBottom('text-5');
    snapshot = getStoreSnapshot();
    assertEqual(snapshot.components[0].id, 'text-5', 'text-5 置底后应该在索引0（最底层）');
    
    const layerInfo5AfterBottom = state.getComponentLayerInfo('text-5');
    assertEqual(layerInfo5AfterBottom!.currentLayer, 1, 'text-5 置底后层级应为 1');
    
    state.moveToTop('text-3');
    snapshot = getStoreSnapshot();
    assertEqual(snapshot.components[4].id, 'text-3', 'text-3 置顶后应该在索引4');
  });

  runner.test('层级排序: 组件已经在最顶层时上移和置顶按钮不生效', () => {
    const state = useBuilderStore.getState();
    
    const text1 = createMockTextComponent('text-1', '文本1');
    const text2 = createMockTextComponent('text-2', '文本2');
    const text3 = createMockTextComponent('text-3', '文本3');
    
    state.addComponent(text1);
    state.addComponent(text2);
    state.addComponent(text3);
    
    let snapshot = getStoreSnapshot();
    assertEqual(snapshot.components.length, 3, '应该有3个组件');
    
    assert(state.canMoveUp('text-1') === true, 'text-1 (索引0) 应该可以上移');
    assert(state.canMoveUp('text-2') === true, 'text-2 (索引1) 应该可以上移');
    assert(state.canMoveUp('text-3') === false, 'text-3 (索引2，最顶层) 不应该可以上移');
    
    const originalComponents = [...snapshot.components];
    state.moveUp('text-3');
    snapshot = getStoreSnapshot();
    
    assertEqual(
      JSON.stringify(snapshot.components.map(c => c.id)),
      JSON.stringify(originalComponents.map(c => c.id)),
      'text-3 已经在最顶层，moveUp 不应该改变顺序'
    );
    
    state.moveToTop('text-3');
    snapshot = getStoreSnapshot();
    
    assertEqual(
      JSON.stringify(snapshot.components.map(c => c.id)),
      JSON.stringify(originalComponents.map(c => c.id)),
      'text-3 已经在最顶层，moveToTop 不应该改变顺序'
    );
  });

  runner.test('层级排序: 组件已经在最底层时下移和置底按钮不生效', () => {
    const state = useBuilderStore.getState();
    
    const text1 = createMockTextComponent('text-1', '文本1');
    const text2 = createMockTextComponent('text-2', '文本2');
    const text3 = createMockTextComponent('text-3', '文本3');
    
    state.addComponent(text1);
    state.addComponent(text2);
    state.addComponent(text3);
    
    let snapshot = getStoreSnapshot();
    assertEqual(snapshot.components.length, 3, '应该有3个组件');
    
    assert(state.canMoveDown('text-1') === false, 'text-1 (索引0，最底层) 不应该可以下移');
    assert(state.canMoveDown('text-2') === true, 'text-2 (索引1) 应该可以下移');
    assert(state.canMoveDown('text-3') === true, 'text-3 (索引2) 应该可以下移');
    
    const originalComponents = [...snapshot.components];
    state.moveDown('text-1');
    snapshot = getStoreSnapshot();
    
    assertEqual(
      JSON.stringify(snapshot.components.map(c => c.id)),
      JSON.stringify(originalComponents.map(c => c.id)),
      'text-1 已经在最底层，moveDown 不应该改变顺序'
    );
    
    state.moveToBottom('text-1');
    snapshot = getStoreSnapshot();
    
    assertEqual(
      JSON.stringify(snapshot.components.map(c => c.id)),
      JSON.stringify(originalComponents.map(c => c.id)),
      'text-1 已经在最底层，moveToBottom 不应该改变顺序'
    );
  });

  runner.test('层级排序: Container内子组件的层级调整只能在该Container的children范围内', () => {
    const state = useBuilderStore.getState();
    
    const child1 = createMockTextComponent('child-1', '子组件1');
    const child2 = createMockTextComponent('child-2', '子组件2');
    const child3 = createMockTextComponent('child-3', '子组件3');
    const container = createMockContainerComponent('container-1', [child1, child2, child3]);
    
    const outside1 = createMockTextComponent('outside-1', '外部组件1');
    const outside2 = createMockTextComponent('outside-2', '外部组件2');
    
    state.addComponent(container);
    state.addComponent(outside1);
    state.addComponent(outside2);
    
    let snapshot = getStoreSnapshot();
    assertEqual(snapshot.components.length, 3, '根级别应该有3个组件: container, outside1, outside2');
    
    const containerInStore = findComponentById(snapshot.components, 'container-1') as ContainerComponentSchema;
    assertEqual(containerInStore.children!.length, 3, 'Container 应该有3个子组件');
    assertEqual(containerInStore.children![0].id, 'child-1', '初始顺序: child-1');
    assertEqual(containerInStore.children![1].id, 'child-2', '初始顺序: child-2');
    assertEqual(containerInStore.children![2].id, 'child-3', '初始顺序: child-3');
    
    const child1LayerInfo = state.getComponentLayerInfo('child-1');
    const outside1LayerInfo = state.getComponentLayerInfo('outside-1');
    
    assertEqual(child1LayerInfo!.totalLayers, 3, 'child-1 的同级总数应为 3（Container 内的子组件）');
    assertEqual(outside1LayerInfo!.totalLayers, 3, 'outside-1 的同级总数应为 3（根级别组件）');
    
    state.moveUp('child-1');
    
    snapshot = getStoreSnapshot();
    const containerAfterMoveUp = findComponentById(snapshot.components, 'container-1') as ContainerComponentSchema;
    
    assertEqual(containerAfterMoveUp.children![0].id, 'child-2', 'child-1 上移后，child-2 应该在索引0');
    assertEqual(containerAfterMoveUp.children![1].id, 'child-1', 'child-1 上移后，应该在索引1');
    assertEqual(containerAfterMoveUp.children![2].id, 'child-3', 'child-3 位置不变');
    
    assertEqual(snapshot.components[1].id, 'outside-1', '外部组件 outside-1 位置不变');
    assertEqual(snapshot.components[2].id, 'outside-2', '外部组件 outside-2 位置不变');
    
    state.moveToTop('child-2');
    
    snapshot = getStoreSnapshot();
    const containerAfterMoveToTop = findComponentById(snapshot.components, 'container-1') as ContainerComponentSchema;
    
    assertEqual(containerAfterMoveToTop.children![2].id, 'child-2', 'child-2 置顶后应该在索引2（Container 内最顶层）');
    assertEqual(snapshot.components.length, 3, '根级别组件数量不变');
  });

  runner.test('层级排序: 撤销/重做对层级变更的恢复', () => {
    const state = useBuilderStore.getState();
    
    const text1 = createMockTextComponent('text-1', '文本1');
    const text2 = createMockTextComponent('text-2', '文本2');
    const text3 = createMockTextComponent('text-3', '文本3');
    
    state.addComponent(text1);
    state.addComponent(text2);
    state.addComponent(text3);
    
    let snapshot = getStoreSnapshot();
    const originalOrder = ['text-1', 'text-2', 'text-3'];
    assertEqual(
      JSON.stringify(snapshot.components.map(c => c.id)),
      JSON.stringify(originalOrder),
      '初始顺序正确'
    );
    
    state.moveUp('text-1');
    state.moveToTop('text-3');
    state.moveDown('text-2');
    
    snapshot = getStoreSnapshot();
    assert(snapshot.canUndo, '应该可以撤销');
    
    const orderAfterMoves = snapshot.components.map(c => c.id);
    assert(orderAfterMoves.length === 3, '组件数量不变');
    
    state.undo();
    snapshot = getStoreSnapshot();
    assert(snapshot.canUndo, '仍然可以撤销');
    assert(snapshot.canRedo, '可以重做');
    
    state.undo();
    snapshot = getStoreSnapshot();
    assert(snapshot.canUndo, '仍然可以撤销');
    
    state.undo();
    snapshot = getStoreSnapshot();
    assertEqual(
      JSON.stringify(snapshot.components.map(c => c.id)),
      JSON.stringify(originalOrder),
      '撤销3次后应该回到初始顺序'
    );
    assert(snapshot.canRedo, '可以重做');
    
    state.redo();
    state.redo();
    state.redo();
    
    snapshot = getStoreSnapshot();
    assertEqual(
      JSON.stringify(snapshot.components.map(c => c.id)),
      JSON.stringify(orderAfterMoves),
      '重做3次后应该回到移动后的顺序'
    );
  });

  runner.test('层级排序: 添加/删除组件后层级的显示数字自动更新', () => {
    const state = useBuilderStore.getState();
    
    const text1 = createMockTextComponent('text-1', '文本1');
    const text2 = createMockTextComponent('text-2', '文本2');
    
    state.addComponent(text1);
    state.addComponent(text2);
    
    let layerInfo1 = state.getComponentLayerInfo('text-1');
    let layerInfo2 = state.getComponentLayerInfo('text-2');
    
    assertEqual(layerInfo1!.totalLayers, 2, '添加2个组件后，总层级应为 2');
    assertEqual(layerInfo1!.currentLayer, 1, 'text-1 层级应为 1');
    assertEqual(layerInfo2!.currentLayer, 2, 'text-2 层级应为 2');
    
    const text3 = createMockTextComponent('text-3', '文本3');
    state.addComponent(text3);
    
    layerInfo1 = state.getComponentLayerInfo('text-1');
    layerInfo2 = state.getComponentLayerInfo('text-2');
    let layerInfo3 = state.getComponentLayerInfo('text-3');
    
    assertEqual(layerInfo1!.totalLayers, 3, '添加第3个组件后，总层级应为 3');
    assertEqual(layerInfo1!.currentLayer, 1, 'text-1 层级应为 1');
    assertEqual(layerInfo2!.currentLayer, 2, 'text-2 层级应为 2');
    assertEqual(layerInfo3!.currentLayer, 3, 'text-3 层级应为 3');
    
    state.removeComponent('text-2');
    
    layerInfo1 = state.getComponentLayerInfo('text-1');
    layerInfo3 = state.getComponentLayerInfo('text-3');
    const layerInfo2AfterDelete = state.getComponentLayerInfo('text-2');
    
    assertEqual(layerInfo1!.totalLayers, 2, '删除 text-2 后，总层级应为 2');
    assertEqual(layerInfo1!.currentLayer, 1, 'text-1 层级应为 1');
    assertEqual(layerInfo3!.currentLayer, 2, 'text-3 层级应为 2（因为 text-2 被删除了）');
    assertEqual(layerInfo2AfterDelete, null, 'text-2 被删除后，获取层级信息应返回 null');
    
    state.undo();
    
    layerInfo1 = state.getComponentLayerInfo('text-1');
    layerInfo2 = state.getComponentLayerInfo('text-2');
    layerInfo3 = state.getComponentLayerInfo('text-3');
    
    assertEqual(layerInfo1!.totalLayers, 3, '撤销删除后，总层级应为 3');
    assertEqual(layerInfo1!.currentLayer, 1, 'text-1 层级应为 1');
    assertEqual(layerInfo2!.currentLayer, 2, 'text-2 层级应为 2');
    assertEqual(layerInfo3!.currentLayer, 3, 'text-3 层级应为 3');
  });

  runner.test('层级排序: 单个组件时所有移动操作都不生效', () => {
    const state = useBuilderStore.getState();
    
    const text1 = createMockTextComponent('text-1', '文本1');
    state.addComponent(text1);
    
    let snapshot = getStoreSnapshot();
    assertEqual(snapshot.components.length, 1, '应该只有1个组件');
    
    assert(state.canMoveUp('text-1') === false, '只有1个组件时，不应该可以上移');
    assert(state.canMoveDown('text-1') === false, '只有1个组件时，不应该可以下移');
    
    const layerInfo = state.getComponentLayerInfo('text-1');
    assertEqual(layerInfo!.currentLayer, 1, '当前层级应为 1');
    assertEqual(layerInfo!.totalLayers, 1, '总层级应为 1');
    
    const originalOrder = [...snapshot.components];
    state.moveUp('text-1');
    state.moveDown('text-1');
    state.moveToTop('text-1');
    state.moveToBottom('text-1');
    
    snapshot = getStoreSnapshot();
    assertEqual(
      JSON.stringify(snapshot.components.map(c => c.id)),
      JSON.stringify(originalOrder.map(c => c.id)),
      '所有移动操作都不应该改变顺序'
    );
  });

  return runner;
};

export default runBuilderStoreTests;
