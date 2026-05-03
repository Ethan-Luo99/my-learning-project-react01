import type { ComponentSchema, DataBindingRule } from '@/types/component';
import { validateProjectData, formatValidationErrors } from '@/utils/validation';

export interface Project {
  id: string;
  name: string;
  components: ComponentSchema[];
  bindings?: DataBindingRule[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMetadata {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  componentCount: number;
}

const STORAGE_KEY_PREFIX = 'lowcode_builder_project';
const PROJECT_LIST_KEY = `${STORAGE_KEY_PREFIX}_list`;

export const generateProjectId = (): string => {
  return `project_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

const getProjectKey = (id: string): string => {
  return `${STORAGE_KEY_PREFIX}_${id}`;
};

const getStoredProjectIds = (): string[] => {
  try {
    const stored = localStorage.getItem(PROJECT_LIST_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const setStoredProjectIds = (ids: string[]): void => {
  try {
    localStorage.setItem(PROJECT_LIST_KEY, JSON.stringify(ids));
  } catch (error) {
    console.error('Failed to save project list:', error);
  }
};

export const saveProject = (
  projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> & {
    id?: string;
    createdAt?: string;
  }
): Project => {
  const now = new Date().toISOString();
  const existingProject = projectData.id
    ? loadProject(projectData.id)
    : null;

  const project: Project = {
    id: projectData.id || generateProjectId(),
    name: projectData.name || '未命名项目',
    components: projectData.components,
    bindings: projectData.bindings || existingProject?.bindings || [],
    createdAt: projectData.createdAt || existingProject?.createdAt || now,
    updatedAt: now,
  };

  const projectKey = getProjectKey(project.id);
  const projectIds = getStoredProjectIds();

  if (!projectIds.includes(project.id)) {
    projectIds.unshift(project.id);
    setStoredProjectIds(projectIds);
  }

  try {
    localStorage.setItem(projectKey, JSON.stringify(project));
    return project;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      throw new Error('存储空间已满，请清理一些项目后再试', { cause: error });
    }
    throw error;
  }
};

export interface LoadProjectResult {
  success: boolean;
  project?: Project;
  validationErrors?: string;
  isCorrupted?: boolean;
}

export const loadProject = (id: string): LoadProjectResult => {
  try {
    const projectKey = getProjectKey(id);
    const stored = localStorage.getItem(projectKey);
    if (!stored) {
      return { success: false };
    }
    
    let parsedData: unknown;
    try {
      parsedData = JSON.parse(stored);
    } catch (parseError) {
      console.error(`JSON parse failed for project ${id}:`, parseError);
      return {
        success: false,
        isCorrupted: true,
        validationErrors: 'JSON 解析失败，项目数据可能已损坏',
      };
    }
    
    const validation = validateProjectData(parsedData);
    
    if (!validation.valid) {
      console.error(`Validation failed for project ${id}:`, validation.errors);
      return {
        success: false,
        isCorrupted: true,
        validationErrors: formatValidationErrors(validation.errors),
      };
    }
    
    const project = parsedData as Project;
    return { success: true, project };
  } catch (error) {
    console.error(`Failed to load project ${id}:`, error);
    return {
      success: false,
      isCorrupted: true,
      validationErrors: error instanceof Error ? error.message : '加载项目时发生未知错误',
    };
  }
};

export const listProjects = (): ProjectMetadata[] => {
  const projectIds = getStoredProjectIds();
  const projects: ProjectMetadata[] = [];

  for (const id of projectIds) {
    const result = loadProject(id);
    if (result.success && result.project) {
      projects.push({
        id: result.project.id,
        name: result.project.name,
        createdAt: result.project.createdAt,
        updatedAt: result.project.updatedAt,
        componentCount: result.project.components.length,
      });
    } else if (result.isCorrupted) {
      console.warn(`Project ${id} is corrupted and will be skipped in list:`, result.validationErrors);
    }
  }

  return projects;
};

export const deleteProject = (id: string): boolean => {
  try {
    const projectKey = getProjectKey(id);
    localStorage.removeItem(projectKey);

    const projectIds = getStoredProjectIds();
    const filteredIds = projectIds.filter((pid) => pid !== id);
    setStoredProjectIds(filteredIds);

    return true;
  } catch (error) {
    console.error(`Failed to delete project ${id}:`, error);
    return false;
  }
};

export const getProjectMetadata = (id: string): ProjectMetadata | null => {
  const result = loadProject(id);
  if (!result.success || !result.project) return null;

  return {
    id: result.project.id,
    name: result.project.name,
    createdAt: result.project.createdAt,
    updatedAt: result.project.updatedAt,
    componentCount: result.project.components.length,
  };
};

export const getLatestProject = (): Project | null => {
  const projects = listProjects();
  if (projects.length === 0) return null;

  const result = loadProject(projects[0].id);
  return result.success && result.project ? result.project : null;
};

export const renameProject = (id: string, newName: string): Project | null => {
  const result = loadProject(id);
  if (!result.success || !result.project) return null;

  return saveProject({
    id: result.project.id,
    name: newName,
    components: result.project.components,
    createdAt: result.project.createdAt,
  });
};

export const createNewEmptyProject = (name?: string): Project => {
  return saveProject({
    name: name || '未命名项目',
    components: [],
  });
};
