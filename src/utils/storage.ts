import type { ComponentSchema } from '@/types/component';

export interface Project {
  id: string;
  name: string;
  components: ComponentSchema[];
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

export const loadProject = (id: string): Project | null => {
  try {
    const projectKey = getProjectKey(id);
    const stored = localStorage.getItem(projectKey);
    if (!stored) return null;
    return JSON.parse(stored) as Project;
  } catch (error) {
    console.error(`Failed to load project ${id}:`, error);
    return null;
  }
};

export const listProjects = (): ProjectMetadata[] => {
  const projectIds = getStoredProjectIds();
  const projects: ProjectMetadata[] = [];

  for (const id of projectIds) {
    const project = loadProject(id);
    if (project) {
      projects.push({
        id: project.id,
        name: project.name,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        componentCount: project.components.length,
      });
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
  const project = loadProject(id);
  if (!project) return null;

  return {
    id: project.id,
    name: project.name,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    componentCount: project.components.length,
  };
};

export const getLatestProject = (): Project | null => {
  const projects = listProjects();
  if (projects.length === 0) return null;

  return loadProject(projects[0].id);
};

export const renameProject = (id: string, newName: string): Project | null => {
  const project = loadProject(id);
  if (!project) return null;

  return saveProject({
    id: project.id,
    name: newName,
    components: project.components,
    createdAt: project.createdAt,
  });
};

export const createNewEmptyProject = (name?: string): Project => {
  return saveProject({
    name: name || '未命名项目',
    components: [],
  });
};
