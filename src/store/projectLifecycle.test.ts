import { useBuilderStore } from './useBuilderStore';
import {
  saveProject,
  loadProject as loadProjectFromStorage,
  listProjects,
  deleteProject,
  getLatestProject,
  getProjectMetadata,
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
  createMockSingleComponent,
  createMockMultipleComponents,
  createMockNestedComponents,
  type ComponentSchema,
} from '@/utils/test-helpers';
import { serializeProject, calculateJSONSize, validateProjectData } from '@/utils/import-export';

interface StoreSnapshot {
  components: ComponentSchema[];
  selectedComponentId: string | null;
  currentProjectId: string | null;
  projectName: string;
  canUndo: boolean;
  canRedo: boolean;
  currentIndex: number;
  historyLength: number;
  lastSavedAt: string | null;
  saveStatus: string;
  loadError: string | null;
  isProjectCorrupted: boolean;
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
    lastSavedAt: state.lastSavedAt,
    saveStatus: state.saveStatus,
    loadError: state.loadError,
    isProjectCorrupted: state.isProjectCorrupted,
  };
};

const resetStore = (): void => {
  const state = useBuilderStore.getState();
  state.createNewProject();
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

const createTestProject = (name: string, components: ComponentSchema[]): Project => {
  return saveProject({
    name,
    components,
  });
};

export const runProjectLifecycleTests = (): TestRunner => {
  const runner = new TestRunner();

  runner.beforeAll(() => {
    console.log('开始运行项目完整生命周期测试...');
  });

  runner.afterAll(() => {
    clearAllTestProjects();
    resetStore();
    console.log('项目生命周期测试完成，已清理测试数据');
  });

  runner.beforeEach(() => {
    clearAllTestProjects();
    resetStore();
  });

  // ==========================================================================
  // 场景 1：项目完整生命周期
  // ==========================================================================

  runner.test('【生命周期】新建项目 → 保存 → 刷新页面 → 自动恢复', () => {
    const state = useBuilderStore.getState();

    let snapshot = getStoreSnapshot();
    assertEqual(snapshot.currentProjectId, null, '初始状态 currentProjectId 为 null');
    assertEqual(snapshot.projectName, '未命名项目', '初始项目名称为「未命名项目」');

    const textComp = createMockTextComponent('test-text', '测试文本组件');
    const btnComp = createMockButtonComponent('test-btn', '测试按钮组件');

    state.addComponent(textComp);
    state.addComponent(btnComp);

    snapshot = getStoreSnapshot();
    assertEqual(snapshot.components.length, 2, '添加后应该有 2 个组件');
    assertEqual(snapshot.canUndo, true, '添加组件后可以撤销');

    state.saveCurrentProject(true);

    snapshot = getStoreSnapshot();
    assertNotNull(snapshot.currentProjectId, '保存后 currentProjectId 不应为 null');
    assertNotNull(snapshot.lastSavedAt, '保存后 lastSavedAt 不应为 null');

    const projectId = snapshot.currentProjectId!;
    const projectFromStorage = loadProjectFromStorage(projectId);

    assert(projectFromStorage.success, '应该能从存储中加载项目');
    assertNotNull(projectFromStorage.project, '项目数据不应为 null');
    assertEqual(projectFromStorage.project!.components.length, 2, '存储的项目应该有 2 个组件');

    resetStore();

    snapshot = getStoreSnapshot();
    assertEqual(snapshot.currentProjectId, null, '重置后 currentProjectId 为 null');
    assertEqual(snapshot.components.length, 0, '重置后组件为空');

    const result = state.loadLatestProject();

    assert(result === true, 'loadLatestProject 应该返回 true');

    snapshot = getStoreSnapshot();
    assertEqual(snapshot.currentProjectId, projectId, '应该恢复之前的项目 ID');
    assertEqual(snapshot.components.length, 2, '应该恢复 2 个组件');

    const restoredText = snapshot.components.find((c) => c.id === 'test-text');
    const restoredBtn = snapshot.components.find((c) => c.id === 'test-btn');

    assertNotNull(restoredText, '应该恢复文本组件');
    assertNotNull(restoredBtn, '应该恢复按钮组件');
  });

  runner.test('【生命周期】切换到项目列表 → 打开另一个项目', () => {
    const state = useBuilderStore.getState();

    const projectA = createTestProject('项目 A', [
      createMockTextComponent('a-text-1', 'A 文本 1'),
      createMockTextComponent('a-text-2', 'A 文本 2'),
    ]);

    const projectB = createTestProject('项目 B', [
      createMockButtonComponent('b-btn-1', 'B 按钮 1'),
    ]);

    state.loadProject(projectA.id);

    let snapshot = getStoreSnapshot();
    assertEqual(snapshot.currentProjectId, projectA.id, '当前应该是项目 A');
    assertEqual(snapshot.projectName, '项目 A', '项目名称应该是「项目 A」');
    assertEqual(snapshot.components.length, 2, '应该有 2 个组件');

    const result = state.saveCurrentAndLoadProject(projectB.id);

    assert(result === true, '切换项目应该成功');

    snapshot = getStoreSnapshot();
    assertEqual(snapshot.currentProjectId, projectB.id, '当前应该是项目 B');
    assertEqual(snapshot.projectName, '项目 B', '项目名称应该是「项目 B」');
    assertEqual(snapshot.components.length, 1, '应该有 1 个组件');

    const btnInB = snapshot.components.find((c) => c.id === 'b-btn-1');
    assertNotNull(btnInB, '应该找到项目 B 的按钮组件');

    const textInA = snapshot.components.find((c) => c.id === 'a-text-1');
    assertEqual(textInA, undefined, '不应该找到项目 A 的组件');
  });

  runner.test('【生命周期】删除项目 → 确认跳转逻辑', () => {
    const state = useBuilderStore.getState();

    const projectA = createTestProject('项目 A', createMockSingleComponent());
    const projectB = createTestProject('项目 B', createMockMultipleComponents());

    state.loadProject(projectA.id);

    let snapshot = getStoreSnapshot();
    assertEqual(snapshot.currentProjectId, projectA.id, '当前应该是项目 A');

    const deleteResult = state.deleteProjectById(projectA.id);
    assert(deleteResult === true, '删除项目应该返回 true');

    const projectsAfterDelete = listProjects();
    assertEqual(projectsAfterDelete.length, 1, '删除后应该只剩 1 个项目');
    assertEqual(projectsAfterDelete[0].id, projectB.id, '剩余的应该是项目 B');

    snapshot = getStoreSnapshot();
    assertEqual(snapshot.currentProjectId, projectA.id, 'currentProjectId 仍然是已删除的项目（UI 负责跳转）');

    const loadDeletedResult = state.loadProject(projectA.id);
    assertEqual(loadDeletedResult, false, '加载已删除项目应该返回 false');

    snapshot = getStoreSnapshot();
    assertNotNull(snapshot.loadError, '应该设置 loadError');
    assert(snapshot.isProjectCorrupted === true, 'isProjectCorrupted 应该为 true（项目不存在也算损坏）');

    state.clearLoadError();
    snapshot = getStoreSnapshot();
    assertEqual(snapshot.loadError, null, 'loadError 应该被清除');
    assertEqual(snapshot.isProjectCorrupted, false, 'isProjectCorrupted 应该被清除');
  });

  runner.test('【生命周期】创建新项目后状态正确', () => {
    const state = useBuilderStore.getState();

    const existingProject = createTestProject('现有项目', createMockSingleComponent());
    state.loadProject(existingProject.id);

    let snapshot = getStoreSnapshot();
    assertEqual(snapshot.currentProjectId, existingProject.id, '当前应该是现有项目');

    const newProjectId = state.saveCurrentAndCreateNewProject('新建项目');

    snapshot = getStoreSnapshot();
    assertEqual(snapshot.currentProjectId, newProjectId, 'currentProjectId 应该是新项目 ID');
    assertEqual(snapshot.projectName, '新建项目', '项目名称应该是「新建项目」');
    assertEqual(snapshot.components.length, 0, '新项目应该为空画布');
    assertEqual(snapshot.canUndo, false, '新项目不能撤销');
    assertEqual(snapshot.canRedo, false, '新项目不能重做');
    assertEqual(snapshot.historyLength, 1, 'history 长度应该为 1');
    assertEqual(snapshot.currentIndex, 0, 'currentIndex 应该为 0');

    const projects = listProjects();
    assert(projects.length >= 2, '应该至少有 2 个项目');

    const newProjectInList = projects.find((p) => p.id === newProjectId);
    assertNotNull(newProjectInList, '新项目应该在列表中');
    assertEqual(newProjectInList!.name, '新建项目', '项目名称应该匹配');
  });

  // ==========================================================================
  // 场景 2：跨页面导航状态一致性
  // ==========================================================================

  runner.test('【状态一致性】保存后导航到项目列表再打开同一项目', () => {
    const state = useBuilderStore.getState();

    const initialComponents = [
      createMockTextComponent('text-1', '初始文本'),
      createMockButtonComponent('btn-1', '初始按钮'),
    ];

    const project = createTestProject('测试项目', initialComponents);

    state.loadProject(project.id);

    let snapshot = getStoreSnapshot();
    assertEqual(snapshot.components.length, 2, '初始 2 个组件');

    state.addComponent(createMockTextComponent('text-2', '新增文本'));

    snapshot = getStoreSnapshot();
    assertEqual(snapshot.components.length, 3, '添加后 3 个组件');

    state.saveCurrentProject(true);

    resetStore();

    snapshot = getStoreSnapshot();
    assertEqual(snapshot.currentProjectId, null, '重置后 currentProjectId 为 null');

    state.loadProject(project.id);

    snapshot = getStoreSnapshot();
    assertEqual(snapshot.currentProjectId, project.id, '应该恢复项目 ID');
    assertEqual(snapshot.components.length, 3, '应该有 3 个组件（包括新增的）');

    const addedText = snapshot.components.find((c) => c.id === 'text-2');
    assertNotNull(addedText, '新增的文本组件应该被保存并恢复');
  });

  runner.test('【状态一致性】多次修改保存后数据一致性', () => {
    const state = useBuilderStore.getState();

    let project = createTestProject('版本项目', [
      createMockTextComponent('v1-text', '版本 1 文本'),
    ]);

    state.loadProject(project.id);

    state.addComponent(createMockButtonComponent('v1-btn', '版本 1 按钮'));
    state.saveCurrentProject(true);

    let projectFromStorage = loadProjectFromStorage(project.id);
    assertEqual(projectFromStorage.project!.components.length, 2, '版本 1 保存后应该有 2 个组件');

    state.removeComponent('v1-text');
    state.saveCurrentProject(true);

    projectFromStorage = loadProjectFromStorage(project.id);
    assertEqual(projectFromStorage.project!.components.length, 1, '版本 2 保存后应该有 1 个组件');

    const remainingBtn = projectFromStorage.project!.components.find((c) => c.id === 'v1-btn');
    assertNotNull(remainingBtn, '剩下的应该是按钮组件');
  });

  runner.test('【状态一致性】saveCurrentAndLoadProject 保存当前项目', () => {
    const state = useBuilderStore.getState();

    const projectA = createTestProject('项目 A', [
      createMockTextComponent('a-text', 'A 文本'),
    ]);

    const projectB = createTestProject('项目 B', [
      createMockButtonComponent('b-btn', 'B 按钮'),
    ]);

    state.loadProject(projectA.id);

    state.addComponent(createMockButtonComponent('a-btn', '新增 A 按钮'));

    let snapshot = getStoreSnapshot();
    assertEqual(snapshot.components.length, 2, '项目 A 现在有 2 个组件');

    state.saveCurrentAndLoadProject(projectB.id);

    snapshot = getStoreSnapshot();
    assertEqual(snapshot.currentProjectId, projectB.id, '当前应该是项目 B');
    assertEqual(snapshot.components.length, 1, '项目 B 有 1 个组件');

    const projectAFromStorage = loadProjectFromStorage(projectA.id);
    assertEqual(projectAFromStorage.project!.components.length, 2, '项目 A 保存的应该有 2 个组件');

    const addedBtnInA = projectAFromStorage.project!.components.find((c) => c.id === 'a-btn');
    assertNotNull(addedBtnInA, '新增的按钮应该被保存到项目 A');
  });

  // ==========================================================================
  // 场景 3：异常场景
  // ==========================================================================

  runner.test('【异常场景】loadLatestProject 在有 currentProjectId 时返回 false', () => {
    const state = useBuilderStore.getState();

    const project = createTestProject('测试项目', createMockSingleComponent());

    state.loadProject(project.id);

    let snapshot = getStoreSnapshot();
    assertNotNull(snapshot.currentProjectId, 'currentProjectId 不应为 null');

    const result = state.loadLatestProject();

    assertEqual(result, false, '有 currentProjectId 时 loadLatestProject 应该返回 false');

    snapshot = getStoreSnapshot();
    assertEqual(snapshot.currentProjectId, project.id, 'currentProjectId 应该保持不变');
  });

  runner.test('【异常场景】加载不存在的项目 ID 返回 false 并设置错误', () => {
    const state = useBuilderStore.getState();

    const result = state.loadProject('non_existent_project_12345');

    assertEqual(result, false, '加载不存在的项目应该返回 false');

    const snapshot = getStoreSnapshot();
    assertNotNull(snapshot.loadError, '应该设置 loadError');
    assert(snapshot.isProjectCorrupted === true, 'isProjectCorrupted 应该为 true');
  });

  runner.test('【异常场景】clearLoadError 正确清除错误状态', () => {
    const state = useBuilderStore.getState();

    state.loadProject('non_existent_project_12345');

    let snapshot = getStoreSnapshot();
    assertNotNull(snapshot.loadError, '应该有 loadError');
    assert(snapshot.isProjectCorrupted === true, 'isProjectCorrupted 应该为 true');

    state.clearLoadError();

    snapshot = getStoreSnapshot();
    assertEqual(snapshot.loadError, null, 'loadError 应该为 null');
    assertEqual(snapshot.isProjectCorrupted, false, 'isProjectCorrupted 应该为 false');
  });

  runner.test('【异常场景】isCurrentProject 正确判断当前项目', () => {
    const state = useBuilderStore.getState();

    const projectA = createTestProject('项目 A', createMockSingleComponent());
    const projectB = createTestProject('项目 B', createMockSingleComponent());

    state.loadProject(projectA.id);

    assert(state.isCurrentProject(projectA.id) === true, '项目 A 应该是当前项目');
    assert(state.isCurrentProject(projectB.id) === false, '项目 B 不应该是当前项目');

    state.loadProject(projectB.id);

    assert(state.isCurrentProject(projectA.id) === false, '项目 A 不再是当前项目');
    assert(state.isCurrentProject(projectB.id) === true, '项目 B 现在是当前项目');
  });

  runner.test('【异常场景】saveCurrentAndLoadProject 切换到同一项目返回 true', () => {
    const state = useBuilderStore.getState();

    const project = createTestProject('测试项目', createMockSingleComponent());

    state.loadProject(project.id);

    let snapshot = getStoreSnapshot();
    const originalComponents = [...snapshot.components];
    const originalProjectId = snapshot.currentProjectId;

    const result = state.saveCurrentAndLoadProject(project.id);

    assert(result === true, '切换到同一项目应该返回 true');

    snapshot = getStoreSnapshot();
    assertEqual(snapshot.currentProjectId, originalProjectId, 'currentProjectId 应该保持不变');
    assertEqual(
      JSON.stringify(snapshot.components),
      JSON.stringify(originalComponents),
      '组件应该保持不变'
    );
  });

  // ==========================================================================
  // 场景 4：导出和导入功能
  // ==========================================================================

  runner.test('【导入导出】导出数据使用当前加载的项目状态', () => {
    const state = useBuilderStore.getState();

    const components = [
      createMockTextComponent('export-text', '导出文本'),
      createMockButtonComponent('export-btn', '导出按钮'),
      createMockContainerComponent('export-container', [
        createMockTextComponent('nested-text', '嵌套文本'),
      ]),
    ];

    const project = createTestProject('导出测试项目', components);

    state.loadProject(project.id);

    const snapshot = getStoreSnapshot();

    const projectToExport: {
      id: string;
      name: string;
      components: ComponentSchema[];
      createdAt: string;
      updatedAt: string;
    } = {
      id: snapshot.currentProjectId || `export_${Date.now()}`,
      name: snapshot.projectName,
      components: [...snapshot.components],
      createdAt: snapshot.lastSavedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const jsonString = serializeProject(projectToExport as any);

    assert(jsonString.length > 0, '导出的 JSON 字符串不应为空');

    const parsed = JSON.parse(jsonString);

    assertEqual(parsed.name, '导出测试项目', '导出的项目名称应该匹配');
    assertEqual(parsed.id, project.id, '导出的项目 ID 应该匹配');
    assertEqual(parsed.components.length, 3, '导出的组件数量应该是 3');

    const container = parsed.components.find((c: any) => c.id === 'export-container');
    assertNotNull(container, '应该找到容器组件');
    assertEqual(container.children.length, 1, '容器应该有 1 个子组件');
    assertEqual(container.children[0].id, 'nested-text', '嵌套的文本组件 ID 应该匹配');
  });

  runner.test('【导入导出】validateProjectData 正确验证导出数据', () => {
    const state = useBuilderStore.getState();

    const components = [
      createMockTextComponent('valid-text', '有效文本'),
      createMockButtonComponent('valid-btn', '有效按钮'),
    ];

    const project = createTestProject('验证项目', components);

    state.loadProject(project.id);

    const snapshot = getStoreSnapshot();

    const projectToExport: {
      id: string;
      name: string;
      components: ComponentSchema[];
      createdAt: string;
      updatedAt: string;
    } = {
      id: snapshot.currentProjectId || `export_${Date.now()}`,
      name: snapshot.projectName,
      components: [...snapshot.components],
      createdAt: snapshot.lastSavedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const validation = validateProjectData(projectToExport);

    assert(validation.valid === true, '导出的数据应该通过验证');
    assertEqual(validation.errors.length, 0, '不应该有验证错误');
  });

  runner.test('【导入导出】导出嵌套组件数据完整性', () => {
    const state = useBuilderStore.getState();

    const nestedComponents = createMockNestedComponents();
    const project = createTestProject('嵌套项目', nestedComponents);

    state.loadProject(project.id);

    const snapshot = getStoreSnapshot();
    const totalComponents = countComponents(snapshot.components);

    assertEqual(totalComponents, 5, '总共有 5 个组件（包括嵌套）');

    const projectToExport: {
      id: string;
      name: string;
      components: ComponentSchema[];
      createdAt: string;
      updatedAt: string;
    } = {
      id: snapshot.currentProjectId || `export_${Date.now()}`,
      name: snapshot.projectName,
      components: [...snapshot.components],
      createdAt: snapshot.lastSavedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const jsonString = serializeProject(projectToExport as any);
    const parsed = JSON.parse(jsonString);

    const exportedTotal = countComponents(parsed.components);
    assertEqual(exportedTotal, 5, '导出后仍然有 5 个组件');

    const container = parsed.components.find((c: any) => c.id === 'container-1');
    assertNotNull(container, '应该找到 container-1');
    assertEqual(container.children.length, 2, 'container-1 有 2 个子组件');

    const nestedBtn = container.children.find((c: any) => c.id === 'nested-btn-1');
    assertNotNull(nestedBtn, '应该找到嵌套按钮');
  });

  // ==========================================================================
  // 场景 5：循环渲染保护增强验证
  // ==========================================================================

  runner.test('【循环保护】loadProject 后历史记录正确重置', () => {
    const state = useBuilderStore.getState();

    state.addComponent(createMockTextComponent('temp-1', '临时组件 1'));
    state.addComponent(createMockButtonComponent('temp-2', '临时组件 2'));

    let snapshot = getStoreSnapshot();
    assert(snapshot.historyLength > 1, '添加组件后 history 长度大于 1');
    assert(snapshot.canUndo === true, '可以撤销');

    const project = createTestProject('新项目', [
      createMockTextComponent('project-text', '项目文本'),
    ]);

    state.loadProject(project.id);

    snapshot = getStoreSnapshot();
    assertEqual(snapshot.historyLength, 1, '加载项目后 history 长度为 1');
    assertEqual(snapshot.currentIndex, 0, 'currentIndex 为 0');
    assertEqual(snapshot.canUndo, false, '不能撤销');
    assertEqual(snapshot.canRedo, false, '不能重做');

    state.addComponent(createMockButtonComponent('new-btn', '新增按钮'));

    snapshot = getStoreSnapshot();
    assertEqual(snapshot.historyLength, 2, '添加组件后 history 长度为 2');
    assertEqual(snapshot.canUndo, true, '现在可以撤销');
  });

  runner.test('【循环保护】saveCurrentAndCreateNewProject 后历史记录正确重置', () => {
    const state = useBuilderStore.getState();

    const existingProject = createTestProject('现有项目', createMockSingleComponent());
    state.loadProject(existingProject.id);

    state.addComponent(createMockButtonComponent('btn-1', '按钮 1'));
    state.addComponent(createMockButtonComponent('btn-2', '按钮 2'));

    let snapshot = getStoreSnapshot();
    assert(snapshot.historyLength > 1, '添加组件后 history 长度大于 1');

    state.saveCurrentAndCreateNewProject('新项目');

    snapshot = getStoreSnapshot();
    assertEqual(snapshot.historyLength, 1, '新建项目后 history 长度为 1');
    assertEqual(snapshot.currentIndex, 0, 'currentIndex 为 0');
    assertEqual(snapshot.canUndo, false, '不能撤销');
    assertEqual(snapshot.components.length, 0, '新项目为空画布');
  });

  runner.test('【循环保护】多次调用 loadProject 不累积历史记录', () => {
    const state = useBuilderStore.getState();

    const projectA = createTestProject('项目 A', createMockSingleComponent());
    const projectB = createTestProject('项目 B', createMockMultipleComponents());

    for (let i = 0; i < 5; i++) {
      state.loadProject(projectA.id);
      let snapshot = getStoreSnapshot();
      assertEqual(snapshot.historyLength, 1, `第 ${i + 1} 次加载项目 A 后 history 长度为 1`);

      state.loadProject(projectB.id);
      snapshot = getStoreSnapshot();
      assertEqual(snapshot.historyLength, 1, `第 ${i + 1} 次加载项目 B 后 history 长度为 1`);
    }

    const finalSnapshot = getStoreSnapshot();
    assertEqual(finalSnapshot.historyLength, 1, '最终 history 长度为 1');
  });

  runner.test('【循环保护】loadLatestProject 有 currentProjectId 时不改变状态', () => {
    const state = useBuilderStore.getState();

    const projectA = createTestProject('项目 A', [
      createMockTextComponent('a-text', 'A 文本'),
    ]);

    const projectB = createTestProject('项目 B（最新）', [
      createMockButtonComponent('b-btn', 'B 按钮'),
    ]);

    state.loadProject(projectA.id);

    let snapshot = getStoreSnapshot();
    assertEqual(snapshot.currentProjectId, projectA.id, '当前是项目 A');
    assertEqual(snapshot.components.length, 1, '项目 A 有 1 个组件');

    const result = state.loadLatestProject();

    assertEqual(result, false, 'loadLatestProject 返回 false');

    snapshot = getStoreSnapshot();
    assertEqual(snapshot.currentProjectId, projectA.id, 'currentProjectId 保持项目 A');
    assertEqual(snapshot.components.length, 1, '组件数量不变');
    assertEqual(snapshot.projectName, '项目 A', '项目名称不变');
  });

  return runner;
};

export default runProjectLifecycleTests;
