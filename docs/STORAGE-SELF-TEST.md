# Storage 服务自测文档

## 测试概述

本文档描述了如何对 localStorage 存储服务进行手动和自动测试，验证其功能正确性和边界情况处理能力。

---

## 一、测试环境准备

### 1.1 文件位置

| 模块 | 路径 | 说明 |
|------|------|------|
| 存储服务 | `src/utils/storage.ts` | 主实现 |
| 测试代码 | `src/utils/storage.test.ts` | 单元测试 |
| 测试辅助 | `src/utils/test-helpers.ts` | 辅助函数和模拟数据 |

### 1.2 依赖说明

- **运行时**: 需要浏览器环境 (提供 `localStorage` API)
- **TypeScript**: 类型检查通过 `tsc -b` 命令
- **可选测试框架**: 可安装 Vitest 进行自动化测试

### 1.3 关键常量

```typescript
STORAGE_KEY_PREFIX = 'lowcode_builder_project'
PROJECT_LIST_KEY = 'lowcode_builder_project_list'
```

所有测试数据都使用此前缀，可通过 `clearAllTestProjects()` 安全清理。

---

## 二、自动测试执行

### 2.1 方式一：浏览器控制台运行

1. 启动开发服务器：`npm run dev`
2. 打开浏览器访问应用
3. 打开开发者工具 (F12)
4. 在控制台执行：

```javascript
// 导入并运行测试
const { runStorageTests } = await import('/src/utils/storage.test.ts');
const runner = runStorageTests();
runner.printSummary();
```

### 2.2 方式二：创建测试页面

在应用中临时添加测试入口：

```tsx
// 临时添加到 App.tsx 或专用测试页面
import { runStorageTests } from '@/utils/storage.test';

const TestButton = () => (
  <button onClick={() => runStorageTests().printSummary()}>
    运行存储测试
  </button>
);
```

### 2.3 方式三：安装 Vitest（推荐）

```bash
npm install -D vitest @vitest/ui happy-dom
```

创建 `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

运行测试：
```bash
npx vitest run src/utils/storage.test.ts
```

---

## 三、手动测试步骤

### 3.1 测试用例 1：空项目保存与读取

**测试目标**: 验证空组件数组能正确持久化

**测试步骤**:
1. 打开浏览器控制台
2. 执行以下代码：

```javascript
const { saveProject, loadProject } = await import('/src/utils/storage.ts');

// 保存空项目
const saved = saveProject({
  name: '空项目测试',
  components: []
});
console.log('保存结果:', saved);

// 验证结构
console.assert(saved.id, '应该有 ID');
console.assert(saved.name === '空项目测试', '名称正确');
console.assert(saved.components.length === 0, '组件数量为 0');
console.assert(saved.createdAt, '有创建时间');
console.assert(saved.updatedAt, '有更新时间');

// 重新加载
const loaded = loadProject(saved.id);
console.log('加载结果:', loaded);

console.assert(loaded !== null, '应该能加载');
console.assert(loaded.id === saved.id, 'ID 匹配');
console.assert(loaded.components.length === 0, '组件数量仍为 0');
```

**预期结果**:
- `saved` 对象包含完整的 5 个字段
- `loaded` 非 null，数据与保存时完全一致
- localStorage 中存在对应 key

---

### 3.2 测试用例 2：多次修改自动保存触发

**测试目标**: 验证更新操作的 `updatedAt` 递增和 `createdAt` 不变

**测试步骤**:
```javascript
const { saveProject, loadProject } = await import('/src/utils/storage.ts');

// 第一次保存
const v1 = saveProject({
  name: '版本1',
  components: [{ id: 'c1', type: 'Text', props: {}, styles: {} }]
});

console.log('版本 1:', { id: v1.id, createdAt: v1.createdAt, updatedAt: v1.updatedAt });

// 等待 1 秒
await new Promise(r => setTimeout(r, 1000));

// 第二次保存（使用相同 ID）
const v2 = saveProject({
  id: v1.id,
  name: '版本2',
  components: [
    { id: 'c1', type: 'Text', props: {}, styles: {} },
    { id: 'c2', type: 'Button', props: {}, styles: {} }
  ],
  createdAt: v1.createdAt
});

console.log('版本 2:', { id: v2.id, createdAt: v2.createdAt, updatedAt: v2.updatedAt });

// 验证
console.assert(v2.id === v1.id, 'ID 不变');
console.assert(v2.createdAt === v1.createdAt, 'createdAt 不变');
console.assert(new Date(v2.updatedAt) > new Date(v1.updatedAt), 'updatedAt 增加');
console.assert(v2.name === '版本2', '名称更新');
console.assert(v2.components.length === 2, '组件数量更新');
```

**预期结果**:
- `createdAt` 保持不变
- `updatedAt` 递增（晚于第一次的时间）
- 组件数据和名称正确更新

---

### 3.3 测试用例 3：项目数据格式校验

**测试目标**: 验证 JSON 结构完整性，包含所有必需字段

**测试步骤**:
```javascript
const { saveProject } = await import('/src/utils/storage.ts');
const { STORAGE_PREFIX, getProjectKey } = await import('/src/utils/test-helpers.ts');

const project = saveProject({
  name: '格式验证项目',
  components: [
    {
      id: 'text-1',
      type: 'Text',
      props: { children: '测试' },
      styles: { color: 'red' }
    }
  ]
});

// 直接从 localStorage 读取原始 JSON
const key = getProjectKey(project.id);
const rawJson = localStorage.getItem(key);
console.log('原始 JSON:', rawJson);

// 解析验证
const parsed = JSON.parse(rawJson);

// 必需字段检查
const requiredFields = ['id', 'name', 'components', 'createdAt', 'updatedAt'];
const missing = requiredFields.filter(f => !(f in parsed));

console.assert(missing.length === 0, `缺少字段: ${missing.join(', ')}`);

// 类型检查
console.assert(typeof parsed.id === 'string', 'id 是字符串');
console.assert(typeof parsed.name === 'string', 'name 是字符串');
console.assert(Array.isArray(parsed.components), 'components 是数组');
console.assert(typeof parsed.createdAt === 'string', 'createdAt 是字符串');
console.assert(typeof parsed.updatedAt === 'string', 'updatedAt 是字符串');

// 日期格式检查（ISO 8601）
const datePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
console.assert(datePattern.test(parsed.createdAt), 'createdAt 是 ISO 日期');
console.assert(datePattern.test(parsed.updatedAt), 'updatedAt 是 ISO 日期');

// 数据一致性
console.assert(JSON.stringify(project) === JSON.stringify(parsed), '数据完全一致');
```

**预期结果**:
- 所有 5 个必需字段存在
- 字段类型正确
- 日期格式为 ISO 8601
- 保存的数据与原始数据一致

---

### 3.4 测试用例 4：localStorage 容量超限错误处理

**测试目标**: 验证 `QuotaExceededError` 的捕获和友好提示

**准备**：此测试需要手动填满 localStorage

**测试步骤**:
```javascript
const { saveProject } = await import('/src/utils/storage.ts');

// 辅助函数：填满 localStorage
const fillStorage = () => {
  const chunk = 'x'.repeat(50000); // 50KB 每块
  let count = 0;
  
  while (true) {
    try {
      localStorage.setItem(`fill_${count}`, chunk);
      count++;
    } catch (e) {
      console.log(`填满了 ${count} 块 (约 ${count * 50} KB)`);
      break;
    }
  }
  return count;
};

// 清理函数
const clearFillData = () => {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('fill_')) keys.push(key);
  }
  keys.forEach(k => localStorage.removeItem(k));
};

// 执行测试
try {
  fillStorage();
  
  // 尝试保存项目
  saveProject({
    name: '会失败的项目',
    components: [{ id: 'c1', type: 'Text', props: {}, styles: {} }]
  });
  
  console.error('期望抛出错误但没有抛出！');
  
} catch (error) {
  console.log('捕获的错误:', error);
  
  // 验证错误消息
  console.assert(
    error.message.includes('存储空间已满'),
    `错误消息应该包含'存储空间已满'，实际: ${error.message}`
  );
  
  // 验证有 cause 属性
  console.assert(error.cause !== undefined, '应该有 cause 属性');
  
} finally {
  clearFillData();
}
```

**预期结果**:
- 抛出 `Error` 实例
- 错误消息包含"存储空间已满，请清理一些项目后再试"
- 原始错误被保存在 `error.cause` 中

---

### 3.5 测试用例 5：删除已保存项目

**测试目标**: 验证删除逻辑，包括项目列表更新

**测试步骤**:
```javascript
const { saveProject, loadProject, listProjects, deleteProject } = await import('/src/utils/storage.ts');

// 保存多个项目
const p1 = saveProject({ name: '项目A', components: [] });
const p2 = saveProject({ name: '项目B', components: [] });
const p3 = saveProject({ name: '项目C', components: [] });

console.log('保存后的列表:', listProjects().map(p => p.name));

// 验证初始状态
console.assert(listProjects().length === 3, '初始有 3 个项目');
console.assert(loadProject(p2.id) !== null, '项目B 存在');

// 删除中间项目
const deleted = deleteProject(p2.id);
console.log('删除结果:', deleted);

console.assert(deleted === true, '删除应该返回 true');
console.assert(listProjects().length === 2, '删除后剩 2 个项目');
console.assert(loadProject(p2.id) === null, '项目B 已不存在');

// 验证列表内容
const remaining = listProjects().map(p => p.id);
console.assert(remaining.includes(p1.id), '项目A 存在');
console.assert(!remaining.includes(p2.id), '项目B 不存在');
console.assert(remaining.includes(p3.id), '项目C 存在');

// 幂等性测试：删除已删除的
const deletedAgain = deleteProject(p2.id);
console.assert(deletedAgain === true, '幂等性：删除已删除的仍返回 true');

// 删除全部
deleteProject(p1.id);
deleteProject(p3.id);
console.assert(listProjects().length === 0, '全部删除后列表为空');
```

**预期结果**:
- 删除成功返回 `true`
- 删除后 `loadProject` 返回 `null`
- `listProjects` 返回的列表正确更新
- 删除不存在的项目返回 `true`（幂等）

---

## 四、公共方法测试矩阵

| 方法 | 测试场景 | 预期行为 | 测试用例位置 |
|------|----------|----------|--------------|
| `saveProject` | 空项目 | 成功保存，components 为空数组 | storage.test.ts:33 |
| `saveProject` | 单个组件 | 正确保存组件数据 | storage.test.ts:55 |
| `saveProject` | 嵌套组件 | 完整保留嵌套结构 | storage.test.ts:93 |
| `saveProject` | 更新现有 ID | createdAt 不变，updatedAt 递增 | storage.test.ts:118 |
| `saveProject` | 空名称 | 使用默认"未命名项目" | storage.test.ts:408 |
| `saveProject` | undefined 名称 | 使用默认"未命名项目" | storage.test.ts:422 |
| `saveProject` | 存储满 | 抛出友好错误 | storage.test.ts:352 |
| `loadProject` | 存在的 ID | 返回完整 Project 对象 | storage.test.ts:83 |
| `loadProject` | 不存在的 ID | 返回 null | storage.test.ts:146 |
| `listProjects` | 空存储 | 返回空数组 | storage.test.ts:153 |
| `listProjects` | 多项目 | 按保存时间倒序排列 | storage.test.ts:160 |
| `listProjects` | 元数据验证 | componentCount 正确 | storage.test.ts:184 |
| `deleteProject` | 存在的项目 | 返回 true，数据删除 | storage.test.ts:206 |
| `deleteProject` | 不存在的项目 | 返回 true（幂等） | storage.test.ts:234 |
| `deleteProject` | 列表更新 | 从列表中移除 | storage.test.ts:245 |
| `getProjectMetadata` | 存在的项目 | 返回完整元数据 | storage.test.ts:278 |
| `getProjectMetadata` | 不存在的项目 | 返回 null | storage.test.ts:312 |
| `getLatestProject` | 空存储 | 返回 null | storage.test.ts:319 |
| `getLatestProject` | 多项目 | 返回最新保存的 | storage.test.ts:326 |

---

## 五、边界情况测试

### 5.1 极端数据

| 场景 | 测试方法 | 预期 |
|------|----------|------|
| 极大组件树 | 保存 100+ 组件 | 成功，无栈溢出 |
| 极长名称 | 名称长度 1000+ 字符 | 成功保存 |
| 特殊字符 | 名称包含 emoji、中文、特殊符号 | 正确序列化/反序列化 |
| 深度嵌套 | 容器嵌套 10 层 | 结构保持完整 |

### 5.2 并发与竞态

```javascript
// 快速连续保存
const { saveProject } = await import('/src/utils/storage.ts');

const base = saveProject({ name: '并发测试', components: [] });

// 连续 10 次更新
for (let i = 0; i < 10; i++) {
  saveProject({
    id: base.id,
    name: `版本${i}`,
    components: [],
    createdAt: base.createdAt
  });
}

// 验证最后一次保存有效
const { loadProject } = await import('/src/utils/storage.ts');
const final = loadProject(base.id);
console.assert(final.name === '版本9', '最后一次更新生效');
```

---

## 六、清理测试数据

测试完成后，清理 localStorage 中的测试数据：

```javascript
const { clearAllTestProjects } = await import('/src/utils/test-helpers.ts');
clearAllTestProjects();
console.log('测试数据已清理');
```

或者手动在控制台执行：
```javascript
localStorage.clear()  // 谨慎使用，会清除所有数据
```

---

## 七、测试结果记录模板

| 测试项 | 日期 | 结果 | 备注 |
|--------|------|------|------|
| 空项目保存读取 | 2026-05-02 | ✓ 通过 | |
| 多次更新时间戳 | 2026-05-02 | ✓ 通过 | createdAt 保持不变 |
| JSON 结构验证 | 2026-05-02 | ✓ 通过 | 5 字段完整 |
| 容量超限处理 | 2026-05-02 | ✓ 通过 | 错误消息友好 |
| 删除与列表更新 | 2026-05-02 | ✓ 通过 | 幂等性正确 |
| 所有公共方法 | 2026-05-02 | ✓ 通过 | 6 个方法全覆盖 |

---

## 八、已知限制与注意事项

1. **localStorage 容量限制**：通常为 5-10MB，适合存储组件配置，不适合大量图片
2. **同步 API**：所有操作都是同步的，大项目可能阻塞主线程
3. **无加密**：数据以明文 JSON 存储，敏感信息不应放入
4. **浏览器隐私模式**：某些浏览器隐私模式下 localStorage 可能被禁用
5. **跨域限制**：localStorage 是同源策略的，不同域名不共享

---

*文档版本: 1.0*
*最后更新: 2026-05-02*
