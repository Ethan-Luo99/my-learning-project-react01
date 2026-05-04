import { ComponentType, type ComponentSchema, type TextComponentSchema } from '@/types/component';
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
import { useBuilderStore } from '@/store/useBuilderStore';

export const runMultiSelectTests = (): TestRunner => {
  const runner = new TestRunner();

  runner.beforeAll(() => {
    console.log('开始运行 MultiSelect 功能测试...');
  });

  runner.afterAll(() => {
    const state = useBuilderStore.getState();
    state.createNewProject();
    console.log('MultiSelect 测试完成，已重置 store');
  });

  runner.beforeEach(() => {
    const state = useBuilderStore.getState();
    state.createNewProject();
  });

  runner.test('多选状态: selectedComponentIds 初始应该为空数组', () => {
    const state = useBuilderStore.getState();
    
    assertEqual(state.selectedComponentIds.length, 0, '初始选中组件 ID 数组应该为空');
    assert(Array.isArray(state.selectedComponentIds), 'selectedComponentIds 应该是数组');
  });

  runner.test('多选状态: isComponentSelected 应该正确检测选中状态', () => {
    const state = useBuilderStore.getState();
    
    const textComponent = createMockTextComponent('text-1', '文本1');
    state.addComponent(textComponent);
    
    assert(state.isComponentSelected('text-1') === false, '未选中时应该返回 false');
    
    state.setSelectedComponentId('text-1');
    assert(state.isComponentSelected('text-1') === true, '选中后 shouldComponentSelected 应该返回 true');
  });

  runner.test('多选状态: getSelectedComponents 初始应该返回空数组', () => {
    const state = useBuilderStore.getState();
    
    const selectedComponents = state.getSelectedComponents();
    
    assert(Array.isArray(selectedComponents), 'getSelectedComponents 应该返回数组');
    assertEqual(selectedComponents.length, 0, '初始选中组件数组应该为空');
  });

  runner.test('多选状态: 选中单个组件后 getSelectedComponents 应该返回该组件', () => {
    const state = useBuilderStore.getState();
    
    const textComponent = createMockTextComponent('text-1', '文本1');
    state.addComponent(textComponent);
    
    state.setSelectedComponentId('text-1');
    
    const selectedComponents = state.getSelectedComponents();
    
    assertEqual(selectedComponents.length, 1, '应该有 1 个选中组件');
    assertEqual(selectedComponents[0].id, 'text-1', '选中组件 ID 应该匹配');
  });

  runner.test('多选状态: toggleComponentSelection 应该切换选中状态', () => {
    const state = useBuilderStore.getState();
    
    const textComponent = createMockTextComponent('text-1', '文本1');
    state.addComponent(textComponent);
    
    assert(state.isComponentSelected('text-1') === false, '初始未选中');
    
    state.toggleComponentSelection('text-1');
    assert(state.isComponentSelected('text-1') === true, 'toggle 后应该选中');
    
    state.toggleComponentSelection('text-1');
    assert(state.isComponentSelected('text-1') === false, '再次 toggle 后应该取消选中');
  });

  runner.test('多选状态: addToSelection 应该添加组件到选中状态', () => {
    const state = useBuilderStore.getState();
    
    const text1 = createMockTextComponent('text-1', '文本1');
    const text2 = createMockTextComponent('text-2', '文本2');
    state.addComponent(text1);
    state.addComponent(text2);
    
    state.addToSelection('text-1');
    assert(state.isComponentSelected('text-1') === true, 'text-1 应该被选中');
    
    state.addToSelection('text-2');
    assert(state.isComponentSelected('text-1') === true, 'text-1 仍然应该被选中');
    assert(state.isComponentSelected('text-2') === true, 'text-2 应该被选中');
    
    const selectedComponents = state.getSelectedComponents();
    assertEqual(selectedComponents.length, 2, '应该有 2 个选中组件');
  });

  runner.test('多选状态: removeFromSelection 应该从选中状态移除组件', () => {
    const state = useBuilderStore.getState();
    
    const text1 = createMockTextComponent('text-1', '文本1');
    const text2 = createMockTextComponent('text-2', '文本2');
    const text3 = createMockTextComponent('text-3', '文本3');
    state.addComponent(text1);
    state.addComponent(text2);
    state.addComponent(text3);
    
    state.addToSelection('text-1');
    state.addToSelection('text-2');
    state.addToSelection('text-3');
    
    assertEqual(state.getSelectedComponents().length, 3, '应该有 3 个选中组件');
    
    state.removeFromSelection('text-2');
    assert(state.isComponentSelected('text-2') === false, 'text-2 应该被移除');
    assertEqual(state.getSelectedComponents().length, 2, '应该有 2 个选中组件');
    assert(state.isComponentSelected('text-1') === true, 'text-1 仍然选中');
    assert(state.isComponentSelected('text-3') === true, 'text-3 仍然选中');
  });

  runner.test('多选状态: clearSelection 应该清空所有选中状态', () => {
    const state = useBuilderStore.getState();
    
    const text1 = createMockTextComponent('text-1', '文本1');
    const text2 = createMockTextComponent('text-2', '文本2');
    const text3 = createMockTextComponent('text-3', '文本3');
    state.addComponent(text1);
    state.addComponent(text2);
    state.addComponent(text3);
    
    state.addToSelection('text-1');
    state.addToSelection('text-2');
    state.addToSelection('text-3');
    
    assertEqual(state.getSelectedComponents().length, 3, '应该有 3 个选中组件');
    
    state.clearSelection();
    
    assertEqual(state.getSelectedComponents().length, 0, 'clearSelection 后应该没有选中组件');
    assert(state.isComponentSelected('text-1') === false, 'text-1 应该取消选中');
    assert(state.isComponentSelected('text-2') === false, 'text-2 应该取消选中');
    assert(state.isComponentSelected('text-3') === false, 'text-3 应该取消选中');
  });

  runner.test('多选状态: setSelectedComponentIds 应该设置选中组件 ID 数组', () => {
    const state = useBuilderStore.getState();
    
    const text1 = createMockTextComponent('text-1', '文本1');
    const text2 = createMockTextComponent('text-2', '文本2');
    const text3 = createMockTextComponent('text-3', '文本3');
    state.addComponent(text1);
    state.addComponent(text2);
    state.addComponent(text3);
    
    state.setSelectedComponentIds(['text-1', 'text-3']);
    
    assert(state.isComponentSelected('text-1') === true, 'text-1 应该被选中');
    assert(state.isComponentSelected('text-2') === false, 'text-2 不应该被选中');
    assert(state.isComponentSelected('text-3') === true, 'text-3 应该被选中');
    
    const selectedComponents = state.getSelectedComponents();
    assertEqual(selectedComponents.length, 2, '应该有 2 个选中组件');
  });

  runner.test('批量删除: removeSelectedComponents 应该删除所有选中组件', () => {
    const state = useBuilderStore.getState();
    
    const text1 = createMockTextComponent('text-1', '文本1');
    const text2 = createMockTextComponent('text-2', '文本2');
    const text3 = createMockTextComponent('text-3', '文本3');
    state.addComponent(text1);
    state.addComponent(text2);
    state.addComponent(text3);
    
    assertEqual(state.components.length, 3, '应该有 3 个组件');
    
    state.addToSelection('text-1');
    state.addToSelection('text-3');
    
    state.removeSelectedComponents();
    
    assertEqual(state.components.length, 1, '应该只剩下 1 个组件');
    
    const remainingComponent = findComponentById(state.components, 'text-2');
    assertNotNull(remainingComponent, 'text-2 应该保留');
    
    const removed1 = findComponentById(state.components, 'text-1');
    const removed3 = findComponentById(state.components, 'text-3');
    assertEqual(removed1, null, 'text-1 应该被删除');
    assertEqual(removed3, null, 'text-3 应该被删除');
  });

  runner.test('批量删除: 删除所有选中组件后应该清空选中状态', () => {
    const state = useBuilderStore.getState();
    
    const text1 = createMockTextComponent('text-1', '文本1');
    const text2 = createMockTextComponent('text-2', '文本2');
    state.addComponent(text1);
    state.addComponent(text2);
    
    state.addToSelection('text-1');
    state.addToSelection('text-2');
    
    assertEqual(state.getSelectedComponents().length, 2, '应该有 2 个选中组件');
    
    state.removeSelectedComponents();
    
    assertEqual(state.getSelectedComponents().length, 0, '删除后选中状态应该为空');
  });

  runner.test('批量层级调整: moveSelectedComponentsUp 应该上移所有选中组件', () => {
    const state = useBuilderStore.getState();
    
    const text1 = createMockTextComponent('text-1', '文本1');
    const text2 = createMockTextComponent('text-2', '文本2');
    const text3 = createMockTextComponent('text-3', '文本3');
    const text4 = createMockTextComponent('text-4', '文本4');
    state.addComponent(text1);
    state.addComponent(text2);
    state.addComponent(text3);
    state.addComponent(text4);
    
    assertEqual(state.components[0].id, 'text-1', '初始顺序: text-1 (索引0)');
    assertEqual(state.components[1].id, 'text-2', '初始顺序: text-2 (索引1)');
    assertEqual(state.components[2].id, 'text-3', '初始顺序: text-3 (索引2)');
    assertEqual(state.components[3].id, 'text-4', '初始顺序: text-4 (索引3)');
    
    state.addToSelection('text-1');
    state.addToSelection('text-3');
    
    state.moveSelectedComponentsUp();
    
    assertEqual(state.components[0].id, 'text-2', '上移后 text-2 应该在索引0');
    assertEqual(state.components[1].id, 'text-1', '上移后 text-1 应该在索引1');
    assertEqual(state.components[2].id, 'text-4', '上移后 text-4 应该在索引2');
    assertEqual(state.components[3].id, 'text-3', '上移后 text-3 应该在索引3');
  });

  runner.test('批量层级调整: moveSelectedComponentsDown 应该下移所有选中组件', () => {
    const state = useBuilderStore.getState();
    
    const text1 = createMockTextComponent('text-1', '文本1');
    const text2 = createMockTextComponent('text-2', '文本2');
    const text3 = createMockTextComponent('text-3', '文本3');
    const text4 = createMockTextComponent('text-4', '文本4');
    state.addComponent(text1);
    state.addComponent(text2);
    state.addComponent(text3);
    state.addComponent(text4);
    
    state.addToSelection('text-2');
    state.addToSelection('text-4');
    
    state.moveSelectedComponentsDown();
    
    assertEqual(state.components[0].id, 'text-1', '下移后 text-1 应该在索引0');
    assertEqual(state.components[1].id, 'text-2', '下移后 text-2 应该在索引1');
    assertEqual(state.components[2].id, 'text-3', '下移后 text-3 应该在索引2');
    assertEqual(state.components[3].id, 'text-4', '下移后 text-4 应该在索引3');
  });

  runner.test('批量层级调整: moveSelectedComponentsToTop 应该置顶所有选中组件', () => {
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
    
    state.addToSelection('text-2');
    state.addToSelection('text-4');
    
    state.moveSelectedComponentsToTop();
    
    const lastIndex = state.components.length - 1;
    assert(
      state.components[lastIndex - 1].id === 'text-2' || state.components[lastIndex - 1].id === 'text-4',
      '选中的组件应该在顶层'
    );
    assert(
      state.components[lastIndex].id === 'text-2' || state.components[lastIndex].id === 'text-4',
      '选中的组件应该在顶层'
    );
  });

  runner.test('批量层级调整: moveSelectedComponentsToBottom 应该置底所有选中组件', () => {
    const state = useBuilderStore.getState();
    
    const text1 = createMockTextComponent('text-1', '文本1');
    const text2 = createMockTextComponent('text-2', '文本2');
    const text3 = createMockTextComponent('text-3', '文本3');
    const text4 = createMockTextComponent('text-4', '文本4');
    state.addComponent(text1);
    state.addComponent(text2);
    state.addComponent(text3);
    state.addComponent(text4);
    
    state.addToSelection('text-2');
    state.addToSelection('text-4');
    
    state.moveSelectedComponentsToBottom();
    
    assert(
      state.components[0].id === 'text-2' || state.components[0].id === 'text-4',
      '选中的组件应该在底层'
    );
    assert(
      state.components[1].id === 'text-2' || state.components[1].id === 'text-4',
      '选中的组件应该在底层'
    );
  });

  runner.test('主选中组件: selectedComponentId 应该在多选时指向第一个选中组件', () => {
    const state = useBuilderStore.getState();
    
    const text1 = createMockTextComponent('text-1', '文本1');
    const text2 = createMockTextComponent('text-2', '文本2');
    const text3 = createMockTextComponent('text-3', '文本3');
    state.addComponent(text1);
    state.addComponent(text2);
    state.addComponent(text3);
    
    state.setSelectedComponentId('text-1');
    assertEqual(state.selectedComponentId, 'text-1', 'selectedComponentId 应该是 text-1');
    
    state.addToSelection('text-2');
    assertEqual(state.selectedComponentId, 'text-1', '添加选中后 selectedComponentId 应该保持不变');
    
    const selectedComponents = state.getSelectedComponents();
    assertEqual(selectedComponents.length, 2, '应该有 2 个选中组件');
  });

  runner.test('撤销/重做: 多选状态应该随撤销/重做恢复', () => {
    const state = useBuilderStore.getState();
    
    const text1 = createMockTextComponent('text-1', '文本1');
    const text2 = createMockTextComponent('text-2', '文本2');
    state.addComponent(text1);
    state.addComponent(text2);
    
    state.addToSelection('text-1');
    state.addToSelection('text-2');
    
    state.removeSelectedComponents();
    
    assertEqual(state.components.length, 0, '删除后应该没有组件');
    assert(state.canUndo, '应该可以撤销');
    
    state.undo();
    
    assertEqual(state.components.length, 2, '撤销后应该有 2 个组件');
    
    const restored1 = findComponentById(state.components, 'text-1');
    const restored2 = findComponentById(state.components, 'text-2');
    assertNotNull(restored1, 'text-1 应该被恢复');
    assertNotNull(restored2, 'text-2 应该被恢复');
  });

  runner.test('边界情况: 选中不存在的组件 ID 不应该导致错误', () => {
    const state = useBuilderStore.getState();
    
    let didThrow = false;
    try {
      state.addToSelection('non-existent-component');
    } catch {
      didThrow = true;
    }
    
    assert(!didThrow, '选中不存在的组件不应该抛出错误');
    assertEqual(state.getSelectedComponents().length, 0, '选中不存在的组件后选中数组应该为空');
  });

  runner.test('边界情况: 取消选中不存在的组件不应该导致错误', () => {
    const state = useBuilderStore.getState();
    
    const text1 = createMockTextComponent('text-1', '文本1');
    state.addComponent(text1);
    state.addToSelection('text-1');
    
    assertEqual(state.getSelectedComponents().length, 1, '应该有 1 个选中组件');
    
    let didThrow = false;
    try {
      state.removeFromSelection('non-existent-component');
    } catch {
      didThrow = true;
    }
    
    assert(!didThrow, '取消选中不存在的组件不应该抛出错误');
    assertEqual(state.getSelectedComponents().length, 1, '选中组件数量应该保持不变');
  });

  runner.test('Shift+点击多选: 连续 Shift+点击应该切换多个组件的选中状态', () => {
    const state = useBuilderStore.getState();
    
    const text1 = createMockTextComponent('text-1', '文本1');
    const text2 = createMockTextComponent('text-2', '文本2');
    const text3 = createMockTextComponent('text-3', '文本3');
    state.addComponent(text1);
    state.addComponent(text2);
    state.addComponent(text3);
    
    assertEqual(state.getSelectedComponents().length, 0, '初始没有选中组件');
    
    state.toggleComponentSelection('text-1');
    assert(state.isComponentSelected('text-1') === true, 'text-1 应该被选中');
    assertEqual(state.getSelectedComponents().length, 1, '应该有 1 个选中组件');
    
    state.toggleComponentSelection('text-2');
    assert(state.isComponentSelected('text-1') === true, 'text-1 仍然应该被选中');
    assert(state.isComponentSelected('text-2') === true, 'text-2 应该被选中');
    assertEqual(state.getSelectedComponents().length, 2, '应该有 2 个选中组件');
    
    state.toggleComponentSelection('text-3');
    assertEqual(state.getSelectedComponents().length, 3, '应该有 3 个选中组件');
  });

  runner.test('Shift+点击多选: 再次 Shift+点击已选中组件应该取消选中', () => {
    const state = useBuilderStore.getState();
    
    const text1 = createMockTextComponent('text-1', '文本1');
    const text2 = createMockTextComponent('text-2', '文本2');
    state.addComponent(text1);
    state.addComponent(text2);
    
    state.toggleComponentSelection('text-1');
    state.toggleComponentSelection('text-2');
    
    assertEqual(state.getSelectedComponents().length, 2, '应该有 2 个选中组件');
    
    state.toggleComponentSelection('text-1');
    
    assert(state.isComponentSelected('text-1') === false, 'text-1 应该取消选中');
    assert(state.isComponentSelected('text-2') === true, 'text-2 仍然应该被选中');
    assertEqual(state.getSelectedComponents().length, 1, '应该只剩下 1 个选中组件');
  });

  runner.test('取消多选: 点击未选中组件应该取消多选并选中该组件', () => {
    const state = useBuilderStore.getState();
    
    const text1 = createMockTextComponent('text-1', '文本1');
    const text2 = createMockTextComponent('text-2', '文本2');
    const text3 = createMockTextComponent('text-3', '文本3');
    state.addComponent(text1);
    state.addComponent(text2);
    state.addComponent(text3);
    
    state.addToSelection('text-1');
    state.addToSelection('text-2');
    
    assertEqual(state.getSelectedComponents().length, 2, '应该有 2 个选中组件');
    
    state.setSelectedComponentId('text-3');
    
    assert(state.isComponentSelected('text-3') === true, 'text-3 应该被选中');
    assert(state.isComponentSelected('text-1') === false, 'text-1 应该取消选中');
    assert(state.isComponentSelected('text-2') === false, 'text-2 应该取消选中');
    assertEqual(state.getSelectedComponents().length, 1, '应该只剩下 1 个选中组件');
  });

  runner.test('批量删除: 删除多个选中组件后应该清空选中状态', () => {
    const state = useBuilderStore.getState();
    
    const text1 = createMockTextComponent('text-1', '文本1');
    const text2 = createMockTextComponent('text-2', '文本2');
    const text3 = createMockTextComponent('text-3', '文本3');
    const text4 = createMockTextComponent('text-4', '文本4');
    state.addComponent(text1);
    state.addComponent(text2);
    state.addComponent(text3);
    state.addComponent(text4);
    
    assertEqual(state.components.length, 4, '初始有 4 个组件');
    
    state.addToSelection('text-1');
    state.addToSelection('text-2');
    state.addToSelection('text-4');
    
    assertEqual(state.getSelectedComponents().length, 3, '应该有 3 个选中组件');
    
    state.removeSelectedComponents();
    
    assertEqual(state.components.length, 1, '应该只剩下 1 个组件');
    
    const remaining = findComponentById(state.components, 'text-3');
    assertNotNull(remaining, 'text-3 应该保留');
    
    assertEqual(state.getSelectedComponents().length, 0, '删除后选中状态应该为空');
    assert(state.isComponentSelected('text-3') === false, 'text-3 不应该被选中');
  });

  runner.test('点击画布: 非 Shift 模式下点击画布应该清空选中状态', () => {
    const state = useBuilderStore.getState();
    
    const text1 = createMockTextComponent('text-1', '文本1');
    const text2 = createMockTextComponent('text-2', '文本2');
    state.addComponent(text1);
    state.addComponent(text2);
    
    state.addToSelection('text-1');
    state.addToSelection('text-2');
    
    assertEqual(state.getSelectedComponents().length, 2, '应该有 2 个选中组件');
    
    state.clearSelection();
    
    assertEqual(state.getSelectedComponents().length, 0, 'clearSelection 后应该没有选中组件');
  });

  runner.test('点击已选中组件: 点击已选中的单个组件应该保持选中状态', () => {
    const state = useBuilderStore.getState();
    
    const text1 = createMockTextComponent('text-1', '文本1');
    state.addComponent(text1);
    
    state.setSelectedComponentId('text-1');
    
    assert(state.isComponentSelected('text-1') === true, 'text-1 应该被选中');
    
    state.setSelectedComponentIds(['text-1']);
    
    assert(state.isComponentSelected('text-1') === true, 'text-1 仍然应该被选中');
    assertEqual(state.getSelectedComponents().length, 1, '应该有 1 个选中组件');
  });

  runner.test('Ctrl/Cmd 多选: toggleComponentSelection 应该支持多选', () => {
    const state = useBuilderStore.getState();
    
    const text1 = createMockTextComponent('text-1', '文本1');
    const text2 = createMockTextComponent('text-2', '文本2');
    const text3 = createMockTextComponent('text-3', '文本3');
    state.addComponent(text1);
    state.addComponent(text2);
    state.addComponent(text3);
    
    state.toggleComponentSelection('text-1');
    assert(state.isComponentSelected('text-1') === true, 'text-1 选中');
    
    state.toggleComponentSelection('text-2');
    assert(state.isComponentSelected('text-1') === true, 'text-1 保持选中');
    assert(state.isComponentSelected('text-2') === true, 'text-2 选中');
    
    state.toggleComponentSelection('text-2');
    assert(state.isComponentSelected('text-2') === false, 'text-2 取消选中');
    assertEqual(state.getSelectedComponents().length, 1, '应该只有 1 个选中');
  });

  runner.test('空组件列表: clearSelection 在空列表时不应该报错', () => {
    const state = useBuilderStore.getState();
    
    assertEqual(state.components.length, 0, '初始没有组件');
    assertEqual(state.getSelectedComponents().length, 0, '初始没有选中组件');
    
    let didThrow = false;
    try {
      state.clearSelection();
    } catch {
      didThrow = true;
    }
    
    assert(!didThrow, 'clearSelection 不应该抛出错误');
  });

  runner.test('selectedComponentId 同步: 选中单个组件时 selectedComponentId 应该同步', () => {
    const state = useBuilderStore.getState();
    
    const text1 = createMockTextComponent('text-1', '文本1');
    const text2 = createMockTextComponent('text-2', '文本2');
    state.addComponent(text1);
    state.addComponent(text2);
    
    state.setSelectedComponentId('text-1');
    assertEqual(state.selectedComponentId, 'text-1', 'selectedComponentId 应该是 text-1');
    
    state.addToSelection('text-2');
    assertEqual(state.selectedComponentId, 'text-1', 'selectedComponentId 应该保持不变');
    
    state.setSelectedComponentId('text-2');
    assertEqual(state.selectedComponentId, 'text-2', 'selectedComponentId 应该更新为 text-2');
    assert(state.isComponentSelected('text-1') === false, 'text-1 应该取消选中');
  });

  return runner;
};

export default runMultiSelectTests;
