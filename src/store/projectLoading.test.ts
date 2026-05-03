import { useBuilderStore } from './useBuilderStore';
import {
  saveProject,
  listProjects,
  deleteProject,
  getLatestProject,
  type Project,
} from '@/utils/storage';
import {
  TestRunner,
  assert,
  assertEqual,
  assertNotNull,
  createMockTextComponent,
  createMockButtonComponent,
  createMockContainerComponent,
  clearAllTestProjects,
  STORAGE_PREFIX,
  type ComponentSchema,
} from '@/utils/test-helpers';

interface StoreSnapshot {
  components: ComponentSchema[];
  selectedComponentId: string | null;
  currentProjectId: string | null;
  projectName: string;
  canUndo: boolean;
  canRedo: boolean;
  currentIndex: number;
  historyLength: number;
}

const getStoreSnapshot = (): StoreSnapshot => {
  const state = useBuilderStore.getState();
  return {
    components: structuredClone(state.components),
    selectedComponentId: state.selectedComponentId,
    currentProjectId: state.currentProjectId,
    projectName: state.projectName,
    canUndo: state.canUndo,
    canRedo: state.canRedo,
    currentIndex: state.currentIndex,
    historyLength: state.history.length,
  };
};

const resetStore = (): void => {
  const state = useBuilderStore.getState();
  state.createNewProject();
};

const createTestProject = (name: string, components: ComponentSchema[]): Project => {
  return saveProject({
    name,
    components,
  });
};

const createSimpleTestProject = (name: string): Project => {
  return createTestProject(name, [
    createMockTextComponent(`${name}-text`, `测试文本 - ${name}`),
  ]);
};

const countComponents = (components: ComponentSchema[]): number => {
  let count = components.length;
  for (const comp of components) {
    if ('children' in comp && comp.children) {
      count += countComponents(comp.children);
    }
  }
  return count;
};

const corruptLocalStorageData = (projectId: string): void => {
  const key = `${STORAGE_PREFIX}_${projectId}`;
  localStorage.setItem(key, 'invalid json {{{{');
};

export const runProjectLoadingTests = (): TestRunner => {
  const runner = new TestRunner();

  runner.beforeAll(() => {
    console.log('开始运行项目加载测试...');
    console.log('这些测试验证 loadLatestProject 和 loadProject 的修复效果');
  });

  runner.afterAll(() => {
    clearAllTestProjects();
    resetStore();
    console.log('项目加载测试完成，已清理测试数据');
  });

  runner.beforeEach(() => {
    clearAllTestProjects();
    resetStore();
  });

  // ==========================================================================
  // 核心路径测试
  // ==========================================================================

  runner.test('【核心路径】页面首次挂载时自动恢复最后一个项目', () => {
    const project1 = createSimpleTestProject('早期项目');
    const project2 = createTestProject('最新项目', [
      createMockTextComponent('latest-text', '最新项目的文本'),
      createMockButtonComponent('latest-btn', '按钮'),
      createMockContainerComponent('latest-container', [
        createMockTextComponent('nested-text', '嵌套文本'),
      ]),
    ]);

    let snapshot = getStoreSnapshot();
    assertEqual(snapshot.currentProjectId, null, '初始状态 currentProjectId 应该为 null');

    const state = useBuilderStore.getState();
    const result = state.loadLatestProject();

    assert(result === true, 'loadLatestProject 应该返回 true');

    snapshot = getStoreSnapshot();

    assertEqual(snapshot.currentProjectId, project2.id, '应该加载最新保存的项目');
    assertEqual(snapshot.projectName, '最新项目', '项目名称应该匹配');
    assertEqual(snapshot.components.length, 3, '应该有 3 个顶层组件');
    assertEqual(snapshot.selectedComponentId, null, 'selectedComponentId 应该为 null');
  });

  runner.test('【核心路径】loadProject 加载指定项目并重置历史记录', () => {
    const projectA = createTestProject('项目 A', [
      createMockTextComponent('a-text-1', 'A文本1'),
      createMockTextComponent('a-text-2', 'A文本2'),
    ]);

    createSimpleTestProject('项目 B');

    const state = useBuilderStore.getState();

    state.addComponent(createMockTextComponent('temp-text', '临时文本'));
    state.addComponent(createMockButtonComponent('temp-btn', '临时按钮'));

    let snapshot = getStoreSnapshot();
    const componentCountBeforeLoad = snapshot.components.length;
    assert(componentCountBeforeLoad > 0, '加载前应该有临时组件');
    assert(snapshot.canUndo === true, '加载前应该可以撤销');

    const result = state.loadProject(projectA.id);

    assert(result === true, 'loadProject 应该返回 true');

    snapshot = getStoreSnapshot();

    assertEqual(snapshot.currentProjectId, projectA.id, 'currentProjectId 应该匹配');
    assertEqual(snapshot.projectName, '项目 A', '项目名称应该匹配');
    assertEqual(snapshot.components.length, 2, '应该只有项目 A 的 2 个组件');

    assertEqual(snapshot.canUndo, false, '加载后 canUndo 应该为 false');
    assertEqual(snapshot.canRedo, false, '加载后 canRedo 应该为 false');
    assertEqual(snapshot.currentIndex, 0, 'currentIndex 应该为 0');
    assertEqual(snapshot.historyLength, 1, 'history 长度应该为 1（只有初始状态）');
  });

  runner.test('【核心路径】当前已打开项目时切换到另一个项目', () => {
    const projectA = createSimpleTestProject('项目 A');
    const projectB = createTestProject('项目 B', [
      createMockTextComponent('b-text', '项目B的文本'),
      createMockButtonComponent('b-btn', '按钮B'),
    ]);

    const state = useBuilderStore.getState();

    state.loadProject(projectA.id);
    let snapshot = getStoreSnapshot();
    assertEqual(snapshot.currentProjectId, projectA.id, '当前应该是项目 A');

    const result = state.loadProject(projectB.id);

    assert(result === true, 'loadProject 应该返回 true');

    snapshot = getStoreSnapshot();
    assertEqual(snapshot.currentProjectId, projectB.id, '当前应该是项目 B');
    assertEqual(snapshot.projectName, '项目 B', '项目名称应该是 B');
    assertEqual(snapshot.components.length, 2, '应该有 2 个组件');

    const textComp = snapshot.components.find((c) => c.id === 'b-text');
    assertNotNull(textComp, '应该找到项目 B 的文本组件');
  });

  runner.test('【核心路径】saveCurrentAndLoadProject 切换项目时保存当前', () => {
    const projectA = createTestProject('项目 A', [
      createMockTextComponent('a-text', '原始文本'),
    ]);

    const projectB = createSimpleTestProject('项目 B');

    const state = useBuilderStore.getState();

    state.loadProject(projectA.id);

    state.addComponent(createMockButtonComponent('new-btn', '新增按钮'));

    let snapshot = getStoreSnapshot();
    assertEqual(snapshot.components.length, 2, '项目 A 现在有 2 个组件');

    const result = state.saveCurrentAndLoadProject(projectB.id);

    assert(result === true, 'saveCurrentAndLoadProject 应该返回 true');

    snapshot = getStoreSnapshot();
    assertEqual(snapshot.currentProjectId, projectB.id, '当前应该是项目 B');

    state.loadProject(projectA.id);
    snapshot = getStoreSnapshot();
    assertEqual(snapshot.components.length, 2, '重新加载项目 A 时应该有 2 个组件（新增的按钮已保存）');
  });

  runner.test('【核心路径】saveCurrentAndLoadProject 切换到同一项目不做操作', () => {
    const projectA = createSimpleTestProject('项目 A');

    const state = useBuilderStore.getState();

    state.loadProject(projectA.id);
    let snapshot = getStoreSnapshot();
    const originalProjectId = snapshot.currentProjectId;
    const originalComponents = [...snapshot.components];

    state.addComponent(createMockButtonComponent('test-btn', '测试按钮'));

    const result = state.saveCurrentAndLoadProject(projectA.id);

    assert(result === true, '切换到同一项目应该返回 true');

    snapshot = getStoreSnapshot();
    assertEqual(snapshot.currentProjectId, originalProjectId, 'currentProjectId 应该不变');
    assertEqual(snapshot.components.length, 2, '组件应该保持已添加的状态');
  });

  // ==========================================================================
  // 循环渲染保护测试
  // ==========================================================================

  runner.test('【循环渲染保护】loadLatestProject 不应该推入历史记录', () => {
    createSimpleTestProject('测试项目');

    const state = useBuilderStore.getState();

    let snapshot = getStoreSnapshot();
    const historyBefore = snapshot.historyLength;
    const currentIndexBefore = snapshot.currentIndex;

    const result = state.loadLatestProject();
    assert(result === true, '应该加载成功');

    snapshot = getStoreSnapshot();

    assertEqual(snapshot.historyLength, 1, 'history 长度应该为 1（不应该推入新记录）');
    assertEqual(snapshot.currentIndex, 0, 'currentIndex 应该为 0');
    assertEqual(snapshot.canUndo, false, 'canUndo 应该为 false');
  });

  runner.test('【循环渲染保护】loadProject 不应该推入历史记录', () => {
    const project = createSimpleTestProject('测试项目');

    const state = useBuilderStore.getState();

    state.addComponent(createMockTextComponent('temp', '临时'));

    let snapshot = getStoreSnapshot();
    const historyBefore = snapshot.historyLength;
    assert(historyBefore > 1, '添加组件后 history 长度应该大于 1');

    const result = state.loadProject(project.id);
    assert(result === true, '应该加载成功');

    snapshot = getStoreSnapshot();

    assertEqual(snapshot.historyLength, 1, '加载后 history 应该重置为 1');
    assertEqual(snapshot.currentIndex, 0, 'currentIndex 应该为 0');
    assertEqual(snapshot.canUndo, false, 'canUndo 应该为 false');
  });

  runner.test('【循环渲染保护】多次调用 loadLatestProject 不会累积状态变更', () => {
    const project = createTestProject('测试项目', [
      createMockTextComponent('test-text', '测试文本'),
    ]);

    const state = useBuilderStore.getState();

    const stateBeforeLoads = useBuilderStore.getState();
    let callCount = 0;

    const checkNoInfiniteLoop = () => {
      for (let i = 0; i < 10; i++) {
        callCount++;
        const result = state.loadLatestProject();
        assert(result === true, `第 ${i + 1} 次调用应该成功`);

        const snapshot = getStoreSnapshot();
        assertEqual(snapshot.historyLength, 1, `第 ${i + 1} 次调用后 history 长度应该为 1`);
        assertEqual(snapshot.currentIndex, 0, `第 ${i + 1} 次调用后 currentIndex 应该为 0`);
        assertEqual(snapshot.canUndo, false, `第 ${i + 1} 次调用后 canUndo 应该为 false`);
      }
    };

    checkNoInfiniteLoop();

    assertEqual(callCount, 10, '应该完成 10 次调用（无无限循环）');
  });

  runner.test('【循环渲染保护】模拟 useEffect 中重复调用的场景', () => {
    const project = createTestProject('模拟项目', [
      createMockTextComponent('comp-1', '组件1'),
      createMockButtonComponent('comp-2', '组件2'),
    ]);

    const state = useBuilderStore.getState();

    const loadCount = { value: 0 };
    let lastComponents: ComponentSchema[] = [];
    let changesDetected = 0;

    const simulateEffect = () => {
      loadCount.value++;
      const result = state.loadLatestProject();

      if (result) {
        const snapshot = getStoreSnapshot();
        if (JSON.stringify(snapshot.components) !== JSON.stringify(lastComponents)) {
          changesDetected++;
          lastComponents = structuredClone(snapshot.components);
        }
      }
    };

    simulateEffect();
    assertEqual(loadCount.value, 1, '第 1 次调用');
    assertEqual(changesDetected, 1, '第 1 次应该检测到变化');

    for (let i = 0; i < 5; i++) {
      simulateEffect();
    }

    assertEqual(loadCount.value, 6, '总共调用 6 次');
    assertEqual(changesDetected, 1, '后续调用不应该检测到变化');

    const finalSnapshot = getStoreSnapshot();
    assertEqual(finalSnapshot.components.length, 2, '最终应该有 2 个组件');
    assertEqual(finalSnapshot.historyLength, 1, 'history 长度应该为 1');
  });

  runner.test('【循环渲染保护】App.tsx 中 useEffect 逻辑：有 currentProjectId 时不调用 loadLatestProject', () => {
    const project1 = createSimpleTestProject('项目 1');
    const project2 = createSimpleTestProject('项目 2');

    const state = useBuilderStore.getState();

    state.loadProject(project2.id);
    let snapshot = getStoreSnapshot();
    assertEqual(snapshot.currentProjectId, project2.id, '应该已加载项目 2');
    assertEqual(snapshot.projectName, '项目 2', '项目名称应该是 2');

    const simulateAppEffect = () => {
      const hasLoaded = { value: false };
      const currentProjectId = state.currentProjectId;

      if (!hasLoaded.value) {
        hasLoaded.value = true;

        if (!currentProjectId) {
          console.log('调用 loadLatestProject（但这里 currentProjectId 有值）');
        }
      }

      return {
        calledLoadLatest: !currentProjectId,
        hasLoadedValue: hasLoaded.value,
      };
    };

    const result = simulateAppEffect();
    assertEqual(result.calledLoadLatest, false, '因为 currentProjectId 存在，不应该调用 loadLatestProject');

    snapshot = getStoreSnapshot();
    assertEqual(snapshot.currentProjectId, project2.id, '项目 2 应该保持不变');
  });

  // ==========================================================================
  // 边界情况测试
  // ==========================================================================

  runner.test('【边界情况】没有任何已保存项目时 loadLatestProject 返回 false', () => {
    const state = useBuilderStore.getState();

    const latestFromStorage = getLatestProject();
    assertEqual(latestFromStorage, null, '存储中应该没有项目');

    const result = state.loadLatestProject();

    assertEqual(result, false, 'loadLatestProject 应该返回 false');

    const snapshot = getStoreSnapshot();
    assertEqual(snapshot.currentProjectId, null, 'currentProjectId 应该保持 null');
    assertEqual(snapshot.historyLength, 1, 'history 长度应该保持 1');
  });

  runner.test('【边界情况】loadProject 加载不存在的项目返回 false', () => {
    const state = useBuilderStore.getState();

    const result = state.loadProject('non_existent_project_id_12345');

    assertEqual(result, false, 'loadProject 应该返回 false');

    const snapshot = getStoreSnapshot();
    assertEqual(snapshot.currentProjectId, null, 'currentProjectId 应该保持 null');
  });

  runner.test('【边界情况】localStorage 数据格式损坏时友好降级', () => {
    const project = createSimpleTestProject('损坏前的项目');
    corruptLocalStorageData(project.id);

    const state = useBuilderStore.getState();

    const result = state.loadProject(project.id);

    assertEqual(result, false, '加载损坏的数据应该返回 false');

    const snapshot = getStoreSnapshot();
    const loadError = useBuilderStore.getState().loadError;

    assertNotNull(loadError, '应该设置 loadError');
    assert(loadError.length > 0, 'loadError 应该有错误消息');

    assertEqual(useBuilderStore.getState().isProjectCorrupted, true, 'isProjectCorrupted 应该为 true');
  });

  runner.test('【边界情况】当前已加载项目时调用 loadLatestProject 应该加载最新项目（覆盖当前）', () => {
    const oldProject = createSimpleTestProject('旧项目');

    const state = useBuilderStore.getState();

    state.loadProject(oldProject.id);
    let snapshot = getStoreSnapshot();
    assertEqual(snapshot.currentProjectId, oldProject.id, '应该已加载旧项目');

    const newProject = createTestProject('新项目（最新）', [
      createMockTextComponent('new-text', '新项目的文本'),
      createMockButtonComponent('new-btn', '新按钮'),
    ]);

    const result = state.loadLatestProject();

    assert(result === true, 'loadLatestProject 应该返回 true');

    snapshot = getStoreSnapshot();
    assertEqual(snapshot.currentProjectId, newProject.id, '应该切换到最新项目');
    assertEqual(snapshot.projectName, '新项目（最新）', '项目名称应该是最新的');
    assertEqual(snapshot.components.length, 2, '应该有新项目的 2 个组件');
  });

  runner.test('【边界情况】loadLatestProject 返回值：有项目 true，无项目 false', () => {
    const state = useBuilderStore.getState();

    const result1 = state.loadLatestProject();
    assertEqual(result1, false, '没有项目时返回 false');

    const project = createSimpleTestProject('测试项目');

    const result2 = state.loadLatestProject();
    assertEqual(result2, true, '有项目时返回 true');
  });

  runner.test('【边界情况】clearLoadError 应该清除错误状态', () => {
    const project = createSimpleTestProject('测试项目');
    corruptLocalStorageData(project.id);

    const state = useBuilderStore.getState();

    state.loadProject(project.id);

    let hasLoadError = state.loadError !== null;
    let isCorrupted = state.isProjectCorrupted;

    assert(hasLoadError === true, '应该有 loadError');
    assert(isCorrupted === true, 'isProjectCorrupted 应该为 true');

    state.clearLoadError();

    hasLoadError = state.loadError !== null;
    isCorrupted = state.isProjectCorrupted;

    assertEqual(hasLoadError, false, 'loadError 应该被清除');
    assertEqual(isCorrupted, false, 'isProjectCorrupted 应该被清除');
  });

  runner.test('【边界情况】加载项目后操作历史记录应正常工作', () => {
    const project = createTestProject('初始项目', [
      createMockTextComponent('initial-text', '初始文本'),
    ]);

    const state = useBuilderStore.getState();

    state.loadProject(project.id);

    let snapshot = getStoreSnapshot();
    assertEqual(snapshot.canUndo, false, '加载后不能撤销');

    state.addComponent(createMockButtonComponent('new-btn', '新按钮'));

    snapshot = getStoreSnapshot();
    assertEqual(snapshot.canUndo, true, '添加组件后可以撤销');
    assertEqual(snapshot.components.length, 2, '应该有 2 个组件');

    state.undo();

    snapshot = getStoreSnapshot();
    assertEqual(snapshot.components.length, 1, '撤销后应该只有 1 个组件');
    assertEqual(snapshot.canRedo, true, '可以重做');

    state.redo();

    snapshot = getStoreSnapshot();
    assertEqual(snapshot.components.length, 2, '重做后应该有 2 个组件');
  });

  runner.test('【边界情况】加载嵌套组件项目的数据完整性', () => {
    const nestedComponents = [
      createMockTextComponent('root-text', '根文本'),
      createMockContainerComponent('container-1', [
        createMockTextComponent('nested-text-1', '嵌套文本1'),
        createMockContainerComponent('container-2', [
          createMockButtonComponent('deep-btn', '深层按钮'),
        ]),
        createMockTextComponent('nested-text-2', '嵌套文本2'),
      ]),
    ];

    const project = createTestProject('嵌套组件项目', nestedComponents);

    const state = useBuilderStore.getState();
    state.loadProject(project.id);

    const snapshot = getStoreSnapshot();
    const totalComponents = countComponents(snapshot.components);

    assertEqual(snapshot.components.length, 2, '顶层应该有 2 个组件');
    assertEqual(totalComponents, 6, '总共有 6 个组件（包括嵌套）');

    const findById = (comps: ComponentSchema[], id: string): ComponentSchema | null => {
      for (const c of comps) {
        if (c.id === id) return c;
        if ('children' in c && c.children) {
          const found = findById(c.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    const deepBtn = findById(snapshot.components, 'deep-btn');
    assertNotNull(deepBtn, '应该能找到深层按钮组件');
  });

  return runner;
};

export default runProjectLoadingTests;
