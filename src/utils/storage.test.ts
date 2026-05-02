import {
  saveProject,
  loadProject,
  listProjects,
  deleteProject,
  getProjectMetadata,
  getLatestProject,
  type Project,
} from './storage';
import {
  createMockEmptyComponents,
  createMockSingleComponent,
  createMockMultipleComponents,
  createMockNestedComponents,
  clearAllTestProjects,
  fillLocalStorage,
  clearFillData,
  TestRunner,
  assert,
  assertEqual,
  assertNotNull,
  assertThrows,
  assertProjectStructure,
  assertProjectMetadataStructure,
} from './test-helpers';

export const runStorageTests = (): TestRunner => {
  const runner = new TestRunner();

  runner.beforeAll(() => {
    console.log('开始运行 Storage 服务测试...');
  });

  runner.afterAll(() => {
    clearAllTestProjects();
    clearFillData();
    console.log('测试完成，已清理测试数据');
  });

  runner.beforeEach(() => {
    clearAllTestProjects();
    clearFillData();
  });

  runner.test('saveProject: 空项目保存并读取', () => {
    const components = createMockEmptyComponents();
    const projectName = '空项目测试';

    const saved = saveProject({ name: projectName, components });

    assertProjectStructure(saved);
    assertEqual(saved.name, projectName, '项目名称应该匹配');
    assertEqual(saved.components.length, 0, '组件数量应该为 0');

    const loaded = loadProject(saved.id);

    assertNotNull(loaded, '应该能加载已保存的项目');
    assertProjectStructure(loaded!);
    assertEqual(loaded!.name, projectName, '加载的项目名称应该匹配');
    assertEqual(loaded!.components.length, 0, '加载的组件数量应该为 0');
  });

  runner.test('saveProject: 单个组件项目保存并读取', () => {
    const components = createMockSingleComponent();
    const projectName = '单个组件项目';

    const saved = saveProject({ name: projectName, components });

    assertProjectStructure(saved);
    assertEqual(saved.components.length, 1, '应该有 1 个组件');
    assertEqual(saved.components[0].id, 'text-1', '组件 ID 应该匹配');

    const loaded = loadProject(saved.id);

    assertNotNull(loaded, '应该能加载已保存的项目');
    assertProjectStructure(loaded!);
    assertEqual(loaded!.components.length, 1, '加载的组件数量应该匹配');
    assertEqual(loaded!.components[0].id, 'text-1', '加载的组件 ID 应该匹配');
  });

  runner.test('saveProject: 多个组件项目保存并读取', () => {
    const components = createMockMultipleComponents();
    const projectName = '多个组件项目';

    const saved = saveProject({ name: projectName, components });

    assertProjectStructure(saved);
    assertEqual(saved.components.length, 3, '应该有 3 个组件');

    const loaded = loadProject(saved.id);

    assertNotNull(loaded, '应该能加载已保存的项目');
    assertProjectStructure(loaded!);
    assertEqual(loaded!.components.length, 3, '加载的组件数量应该匹配');
  });

  runner.test('saveProject: 嵌套组件项目保存并读取', () => {
    const components = createMockNestedComponents();
    const projectName = '嵌套组件项目';

    const saved = saveProject({ name: projectName, components });

    assertProjectStructure(saved);
    assertEqual(saved.components.length, 2, '顶层应该有 2 个组件');

    const loaded = loadProject(saved.id);

    assertNotNull(loaded, '应该能加载已保存的项目');
    assertProjectStructure(loaded!);
    assertEqual(loaded!.components.length, 2, '顶层组件数量应该匹配');

    const container = loaded!.components.find((c) => c.id === 'container-1');
    assertNotNull(container, '应该能找到容器组件');
    assert('children' in container!, '容器组件应该有 children 属性');
    if ('children' in container!) {
      assertEqual(container!.children!.length, 2, '容器应该有 2 个子组件');
    }
  });

  runner.test('saveProject: 已有 ID 时应该更新项目而非创建新 ID', () => {
    const components1 = createMockSingleComponent();
    const projectName = '可更新项目';

    const firstSave = saveProject({ name: projectName, components: components1 });
    const originalId = firstSave.id;

    const newComponents = createMockMultipleComponents();
    const updatedName = '已更新项目';
    const secondSave = saveProject({
      id: originalId,
      name: updatedName,
      components: newComponents,
      createdAt: firstSave.createdAt,
    });

    assertEqual(secondSave.id, originalId, 'ID 应该保持不变');
    assertEqual(secondSave.createdAt, firstSave.createdAt, 'createdAt 应该保持不变');
    assert(
      new Date(secondSave.updatedAt) >= new Date(firstSave.updatedAt),
      'updatedAt 应该更新到更晚的时间'
    );
    assertEqual(secondSave.name, updatedName, '名称应该更新');
    assertEqual(secondSave.components.length, 3, '组件应该更新');

    const loaded = loadProject(originalId);
    assertNotNull(loaded, '应该能通过原始 ID 加载');
    assertEqual(loaded!.name, updatedName, '加载的名称应该是更新后的名称');
  });

  runner.test('loadProject: 加载不存在的 ID 应该返回 null', () => {
    const loaded = loadProject('non_existent_id_12345');
    assertEqual(loaded, null, '不存在的项目应该返回 null');
  });

  runner.test('listProjects: 空存储时应该返回空数组', () => {
    const projects = listProjects();
    assertEqual(projects.length, 0, '空存储时应该返回空数组');
  });

  runner.test('listProjects: 应该按保存顺序返回项目（最新在前）', () => {
    saveProject({ name: '项目 A', components: createMockEmptyComponents() });
    saveProject({ name: '项目 B', components: createMockSingleComponent() });
    saveProject({ name: '项目 C', components: createMockMultipleComponents() });

    const projects = listProjects();

    assertEqual(projects.length, 3, '应该有 3 个项目');
    assertEqual(projects[0].name, '项目 C', '第一个应该是最新保存的项目 C');
    assertEqual(projects[1].name, '项目 B', '第二个应该是项目 B');
    assertEqual(projects[2].name, '项目 A', '第三个应该是项目 A');

    projects.forEach((p) => assertProjectMetadataStructure(p));
  });

  runner.test('listProjects: 应该正确计算 componentCount', () => {
    saveProject({ name: '空项目', components: createMockEmptyComponents() });
    saveProject({ name: '单组件项目', components: createMockSingleComponent() });
    saveProject({ name: '多组件项目', components: createMockMultipleComponents() });

    const projects = listProjects();

    assertEqual(projects.length, 3, '应该有 3 个项目');

    const emptyProject = projects.find((p) => p.name === '空项目');
    const singleProject = projects.find((p) => p.name === '单组件项目');
    const multiProject = projects.find((p) => p.name === '多组件项目');

    assertNotNull(emptyProject, '应该找到空项目');
    assertNotNull(singleProject, '应该找到单组件项目');
    assertNotNull(multiProject, '应该找到多组件项目');

    assertEqual(emptyProject!.componentCount, 0, '空项目 componentCount 应为 0');
    assertEqual(singleProject!.componentCount, 1, '单组件项目 componentCount 应为 1');
    assertEqual(multiProject!.componentCount, 3, '多组件项目 componentCount 应为 3');
  });

  runner.test('deleteProject: 删除存在的项目应该返回 true', () => {
    const saved = saveProject({ name: '待删除项目', components: createMockSingleComponent() });

    const loadedBefore = loadProject(saved.id);
    assertNotNull(loadedBefore, '删除前应该能加载项目');

    const deleted = deleteProject(saved.id);
    assert(deleted === true, '删除应该返回 true');

    const loadedAfter = loadProject(saved.id);
    assertEqual(loadedAfter, null, '删除后应该加载不到项目');

    const projects = listProjects();
    assertEqual(projects.length, 0, '项目列表应该为空');
  });

  runner.test('deleteProject: 删除不存在的项目应该返回 true（幂等性）', () => {
    const deleted = deleteProject('non_existent_id_999');
    assert(deleted === true, '删除不存在的项目应该返回 true');
  });

  runner.test('deleteProject: 项目列表应该正确更新', () => {
    const proj1 = saveProject({ name: '项目1', components: createMockEmptyComponents() });
    const proj2 = saveProject({ name: '项目2', components: createMockSingleComponent() });
    const proj3 = saveProject({ name: '项目3', components: createMockMultipleComponents() });

    let projects = listProjects();
    assertEqual(projects.length, 3, '应该有 3 个项目');

    deleteProject(proj2.id);

    projects = listProjects();
    assertEqual(projects.length, 2, '删除后应该有 2 个项目');

    const ids = projects.map((p) => p.id);
    assert(ids.includes(proj1.id), '应该包含项目1');
    assert(ids.includes(proj3.id), '应该包含项目3');
    assert(!ids.includes(proj2.id), '不应该包含项目2');
  });

  runner.test('getProjectMetadata: 获取存在项目的元数据', () => {
    const saved = saveProject({ name: '元数据测试项目', components: createMockMultipleComponents() });

    const metadata = getProjectMetadata(saved.id);

    assertNotNull(metadata, '应该能获取元数据');
    assertProjectMetadataStructure(metadata!);
    assertEqual(metadata!.id, saved.id, 'ID 应该匹配');
    assertEqual(metadata!.name, saved.name, '名称应该匹配');
    assertEqual(metadata!.createdAt, saved.createdAt, 'createdAt 应该匹配');
    assertEqual(metadata!.updatedAt, saved.updatedAt, 'updatedAt 应该匹配');
    assertEqual(metadata!.componentCount, 3, 'componentCount 应该为 3');
  });

  runner.test('getProjectMetadata: 获取不存在的项目应该返回 null', () => {
    const metadata = getProjectMetadata('non_existent_metadata_id');
    assertEqual(metadata, null, '不存在的项目应该返回 null');
  });

  runner.test('getLatestProject: 空存储时应该返回 null', () => {
    const latest = getLatestProject();
    assertEqual(latest, null, '空存储时应该返回 null');
  });

  runner.test('getLatestProject: 应该返回最新保存的项目', () => {
    saveProject({ name: '最早项目', components: createMockEmptyComponents() });
    saveProject({ name: '中间项目', components: createMockSingleComponent() });
    const lastSaved = saveProject({ name: '最新项目', components: createMockMultipleComponents() });

    const latest = getLatestProject();

    assertNotNull(latest, '应该能获取最新项目');
    assertProjectStructure(latest!);
    assertEqual(latest!.id, lastSaved.id, '应该是最后保存的项目');
    assertEqual(latest!.name, '最新项目', '名称应该匹配');
  });

  runner.test('saveProject: QuotaExceededError 应该被正确捕获', () => {
    const largeComponents = [];
    for (let i = 0; i < 100; i++) {
      largeComponents.push({
        id: `large-comp-${i}`,
        type: 'Text' as const,
        props: { children: 'x'.repeat(1000) },
        styles: {},
      });
    }

    let filled = false;
    try {
      fillLocalStorage(5 * 1024 * 1024);
      filled = true;
    } catch {
      console.log('无法完全填满 localStorage，跳过容量限制测试');
    }

    if (filled) {
      assertThrows(
        () => {
          saveProject({
            name: '大型项目',
            components: largeComponents as any,
          });
        },
        '存储空间已满'
      );
    }
  });

  runner.test('多次修改后的数据一致性', () => {
    const saved = saveProject({
      name: '版本1',
      components: createMockSingleComponent(),
    });

    const v1Id = saved.id;
    const v1CreatedAt = saved.createdAt;

    const v2 = saveProject({
      id: v1Id,
      name: '版本2',
      components: createMockMultipleComponents(),
      createdAt: v1CreatedAt,
    });

    const v3 = saveProject({
      id: v1Id,
      name: '版本3',
      components: createMockNestedComponents(),
      createdAt: v1CreatedAt,
    });

    const loaded = loadProject(v1Id);

    assertNotNull(loaded, '应该能加载项目');
    assertProjectStructure(loaded!);
    assertEqual(loaded!.id, v1Id, 'ID 应该保持一致');
    assertEqual(loaded!.name, '版本3', '应该是最新的名称');
    assertEqual(loaded!.components.length, 2, '应该是最新的组件数据');
    assertEqual(loaded!.createdAt, v1CreatedAt, 'createdAt 应该不变');
    assert(
      new Date(loaded!.updatedAt) >= new Date(v3.updatedAt),
      'updatedAt 应该是最新的'
    );
  });

  runner.test('JSON 序列化和反序列化的完整性', () => {
    const originalComponents = createMockNestedComponents();
    const original = saveProject({
      name: 'JSON 完整性测试',
      components: originalComponents,
    });

    const key = `lowcode_builder_project_${original.id}`;
    const rawJson = localStorage.getItem(key);

    assertNotNull(rawJson, 'localStorage 中应该有原始 JSON');

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawJson!);
    } catch {
      throw new Error('JSON 解析失败');
    }

    assertProjectStructure(parsed);

    const p = parsed as Project;
    assertEqual(p.id, original.id, 'ID 应该匹配');
    assertEqual(p.name, original.name, '名称应该匹配');
    assertEqual(p.createdAt, original.createdAt, 'createdAt 应该匹配');
    assertEqual(p.updatedAt, original.updatedAt, 'updatedAt 应该匹配');
    assertEqual(
      JSON.stringify(p.components),
      JSON.stringify(original.components),
      '组件数据应该完全一致'
    );

    const loaded = loadProject(original.id);
    assertEqual(
      JSON.stringify(loaded),
      JSON.stringify(original),
      'loadProject 应该返回与 saveProject 一致的数据'
    );
  });

  runner.test('空项目名称应该使用默认值', () => {
    const saved = saveProject({
      name: '',
      components: createMockSingleComponent(),
    });

    assertProjectStructure(saved);
    assert(saved.name.length > 0, '名称不应该为空');
  });

  runner.test('undefined 项目名称应该使用默认值', () => {
    const saved = saveProject({
      components: createMockSingleComponent(),
    } as any);

    assertProjectStructure(saved);
    assert(saved.name.length > 0, '名称不应该为空');
  });

  return runner;
};

export default runStorageTests;
