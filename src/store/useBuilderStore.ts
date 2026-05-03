import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  ComponentType, 
  type ComponentSchema, 
  type ContainerComponentSchema, 
  type DataBindingRule,
  type Page,
  createDefaultPage,
  createNewPage,
} from '@/types/component';
import { MOCK_EMPTY_CANVAS } from '@/constants/mockData';
import {
  saveProject as saveProjectToStorage,
  loadProject as loadProjectFromStorage,
  getLatestProject,
  listProjects as listProjectsFromStorage,
  renameProject as renameProjectInStorage,
  deleteProject as deleteProjectFromStorage,
  createNewEmptyProject as createNewEmptyProjectInStorage,
} from '@/utils/storage';
import type { ProjectMetadata, LoadProjectResult } from '@/utils/storage';
import { generateId } from '@/utils/id';

const MAX_HISTORY_LENGTH = 50;

interface HistoryState {
  pageId: string;
  components: ComponentSchema[];
  selectedComponentId: string | null;
}

const isContainerComponent = (
  component: ComponentSchema
): component is ContainerComponentSchema => {
  return (
    component.type === ComponentType.Container ||
    component.type === ComponentType.Card ||
    component.type === ComponentType.Tabs ||
    component.type === ComponentType.TabPane ||
    component.type === ComponentType.Accordion ||
    component.type === ComponentType.AccordionItem ||
    component.type === ComponentType.Form ||
    component.type === ComponentType.FormItem
  );
};

const findComponentById = (
  components: ComponentSchema[],
  id: string
): ComponentSchema | null => {
  for (const comp of components) {
    if (comp.id === id) {
      return comp;
    }
    if (isContainerComponent(comp) && comp.children && comp.children.length > 0) {
      const found = findComponentById(comp.children, id);
      if (found) return found;
    }
  }
  return null;
};

interface FindNextComponentResult {
  nextId: string | null;
}

const findNextComponentAfterDelete = (
  components: ComponentSchema[],
  deletedId: string
): FindNextComponentResult => {
  const findInList = (
    list: ComponentSchema[],
    parentId: string | null
  ): FindNextComponentResult | null => {
    const index = list.findIndex((c) => c.id === deletedId);

    if (index !== -1) {
      if (list.length > 1) {
        if (index < list.length - 1) {
          return { nextId: list[index + 1].id };
        }
        return { nextId: list[index - 1].id };
      }
      return { nextId: parentId };
    }

    for (const comp of list) {
      if (isContainerComponent(comp) && comp.children && comp.children.length > 0) {
        const result = findInList(comp.children, comp.id);
        if (result) {
          if (result.nextId !== null) {
            return result;
          }
          return { nextId: comp.id };
        }
      }
    }

    return null;
  };

  const result = findInList(components, null);
  return result || { nextId: null };
};

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface BuilderState {
  pages: Page[];
  currentPageId: string;
  components: ComponentSchema[];
  selectedComponentId: string | null;
  bindings: DataBindingRule[];

  history: HistoryState[];
  currentIndex: number;

  currentProjectId: string | null;
  projectName: string;
  saveStatus: SaveStatus;
  saveErrorMessage: string | null;
  lastSavedAt: string | null;
  
  loadError: string | null;
  isProjectCorrupted: boolean;

  setSelectedComponentId: (id: string | null) => void;

  addComponent: (component: ComponentSchema) => void;
  addComponentToParent: (parentId: string | null, component: ComponentSchema, index?: number) => void;

  removeComponent: (id: string) => void;
  moveComponentToParent: (componentId: string, newParentId: string | null, index?: number) => void;

  updateComponent: (id: string, updates: Partial<ComponentSchema>) => void;

  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  moveUp: (id: string) => void;
  moveDown: (id: string) => void;
  moveToTop: (id: string) => void;
  moveToBottom: (id: string) => void;

  canMoveUp: (id: string) => boolean;
  canMoveDown: (id: string) => boolean;
  getComponentLayerInfo: (id: string) => { currentLayer: number; totalLayers: number } | null;

  saveCurrentProject: (immediate?: boolean) => void;
  loadProject: (projectId: string) => boolean;
  loadLatestProject: () => boolean;
  createNewProject: (name?: string) => void;
  setProjectName: (name: string) => void;
  setSaveStatus: (status: SaveStatus, errorMessage?: string) => void;
  clearLoadError: () => void;

  listProjects: () => ProjectMetadata[];
  renameCurrentProject: (newName: string) => void;
  deleteProjectById: (projectId: string) => boolean;
  saveCurrentAndCreateNewProject: (name?: string) => string;
  saveCurrentAndLoadProject: (projectId: string) => boolean;
  isCurrentProject: (projectId: string) => boolean;

  addBinding: (binding: Omit<DataBindingRule, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateBinding: (id: string, updates: Partial<DataBindingRule>) => void;
  removeBinding: (id: string) => void;
  setBindings: (bindings: DataBindingRule[]) => void;
  getBindingsForSource: (sourceId: string) => DataBindingRule[];
  getBindingsForTarget: (targetId: string) => DataBindingRule[];

  getCurrentPage: () => Page | undefined;
  getPages: () => Page[];
  addPage: (name?: string) => string;
  removePage: (pageId: string) => boolean;
  switchToPage: (pageId: string) => void;
  renamePage: (pageId: string, newName: string) => void;
  syncCurrentPageToPages: () => void;
}

const updateComponentInTree = (
  components: ComponentSchema[],
  id: string,
  updates: Partial<ComponentSchema>
): ComponentSchema[] => {
  return components.map((comp) => {
    if (comp.id === id) {
      return { ...comp, ...updates };
    }
    if (isContainerComponent(comp) && comp.children && comp.children.length > 0) {
      return {
        ...comp,
        children: updateComponentInTree(comp.children, id, updates),
      };
    }
    return comp;
  });
};

const removeComponentFromTree = (
  components: ComponentSchema[],
  id: string
): ComponentSchema[] => {
  return components
    .filter((comp) => comp.id !== id)
    .map((comp) => {
      if (isContainerComponent(comp) && comp.children && comp.children.length > 0) {
        return {
          ...comp,
          children: removeComponentFromTree(comp.children, id),
        };
      }
      return comp;
    });
};

const addComponentToParentInTree = (
  components: ComponentSchema[],
  parentId: string | null,
  component: ComponentSchema,
  index?: number
): ComponentSchema[] => {
  if (parentId === null) {
    if (index !== undefined && index >= 0) {
      const newComponents = [...components];
      newComponents.splice(index, 0, component);
      return newComponents;
    }
    return [...components, component];
  }

  return components.map((comp) => {
    if (comp.id === parentId && isContainerComponent(comp)) {
      const children = [...(comp.children || [])];
      if (index !== undefined && index >= 0) {
        children.splice(index, 0, component);
      } else {
        children.push(component);
      }
      return {
        ...comp,
        children,
      };
    }
    if (isContainerComponent(comp) && comp.children && comp.children.length > 0) {
      return {
        ...comp,
        children: addComponentToParentInTree(comp.children, parentId, component, index),
      };
    }
    return comp;
  });
};

const findComponentInTree = (
  components: ComponentSchema[],
  id: string
): ComponentSchema | null => {
  for (const comp of components) {
    if (comp.id === id) {
      return comp;
    }
    if (isContainerComponent(comp) && comp.children && comp.children.length > 0) {
      const found = findComponentInTree(comp.children, id);
      if (found) {
        return found;
      }
    }
  }
  return null;
};

interface ExtractResult {
  components: ComponentSchema[];
  extracted: ComponentSchema | null;
}

interface ComponentLocation {
  parentId: string | null;
  index: number;
}

const findComponentLocation = (
  components: ComponentSchema[],
  id: string,
  parentId: string | null = null
): ComponentLocation | null => {
  const index = components.findIndex((c) => c.id === id);
  if (index !== -1) {
    return { parentId, index };
  }

  for (const comp of components) {
    if (isContainerComponent(comp) && comp.children && comp.children.length > 0) {
      const location = findComponentLocation(comp.children, id, comp.id);
      if (location) {
        return location;
      }
    }
  }

  return null;
};

const getSiblingsList = (
  components: ComponentSchema[],
  parentId: string | null
): ComponentSchema[] => {
  if (parentId === null) {
    return components;
  }

  const parent = findComponentById(components, parentId);
  if (parent && isContainerComponent(parent) && parent.children) {
    return parent.children;
  }

  return [];
};

const extractComponentFromTree = (
  components: ComponentSchema[],
  id: string
): ExtractResult => {
  let extracted: ComponentSchema | null = null;

  const newComponents = components
    .filter((comp) => {
      if (comp.id === id) {
        extracted = comp;
        return false;
      }
      return true;
    })
    .map((comp) => {
      if (isContainerComponent(comp) && comp.children && comp.children.length > 0) {
        const result = extractComponentFromTree(comp.children, id);
        if (result.extracted) {
          extracted = result.extracted;
        }
        return {
          ...comp,
          children: result.components,
        };
      }
      return comp;
    });

  return { components: newComponents, extracted };
};

const reorderComponentInTree = (
  components: ComponentSchema[],
  id: string,
  newIndex: number
): ComponentSchema[] => {
  const location = findComponentLocation(components, id);
  if (!location) return components;

  const { parentId, index } = location;

  const extractResult = extractComponentFromTree(components, id);
  if (!extractResult.extracted) return components;

  return addComponentToParentInTree(
    extractResult.components,
    parentId,
    extractResult.extracted,
    newIndex
  );
};

const createInitialPages = (): Page[] => {
  const defaultPage = createDefaultPage();
  defaultPage.components = [...MOCK_EMPTY_CANVAS];
  return [defaultPage];
};

const createInitialHistory = (): HistoryState[] => {
  const pages = createInitialPages();
  return [
    {
      pageId: pages[0].id,
      components: [...pages[0].components],
      selectedComponentId: null,
    },
  ];
};

export const useBuilderStore = create<BuilderState>()(
  devtools(
    (set, get) => {
      const initialPages = createInitialPages();
      
      return {
        pages: initialPages,
        currentPageId: initialPages[0].id,
        components: initialPages[0].components,
        selectedComponentId: null,
        bindings: [],

        history: createInitialHistory(),
        currentIndex: 0,
        canUndo: false,
        canRedo: false,

        currentProjectId: null,
        projectName: '未命名项目',
        saveStatus: 'idle',
        saveErrorMessage: null,
        lastSavedAt: null,
        
        loadError: null,
        isProjectCorrupted: false,

        getCurrentPage: () => {
          const { pages, currentPageId } = get();
          return pages.find(p => p.id === currentPageId);
        },

        getPages: () => {
          return get().pages;
        },

        syncCurrentPageToPages: () => {
          const { pages, currentPageId, components } = get();
          const now = new Date().toISOString();
          
          const updatedPages = pages.map(page => {
            if (page.id === currentPageId) {
              return {
                ...page,
                components: structuredClone(components),
                updatedAt: now,
              };
            }
            return page;
          });

          set({ pages: updatedPages }, false, 'syncCurrentPageToPages');
        },

        addPage: (name) => {
          const { syncCurrentPageToPages } = get();
          syncCurrentPageToPages();

          const newPage = createNewPage(name);
          const { pages } = get();
          const updatedPages = [...pages, newPage];

          set(
            {
              pages: updatedPages,
              currentPageId: newPage.id,
              components: newPage.components,
              selectedComponentId: null,
            },
            false,
            'addPage'
          );

          return newPage.id;
        },

        removePage: (pageId) => {
          const { pages, currentPageId, syncCurrentPageToPages } = get();
          
          if (pages.length <= 1) {
            console.warn('Cannot remove the last page');
            return false;
          }

          const pageIndex = pages.findIndex(p => p.id === pageId);
          if (pageIndex === -1) {
            return false;
          }

          syncCurrentPageToPages();

          const updatedPages = pages.filter(p => p.id !== pageId);
          let newCurrentPageId = currentPageId;
          
          if (currentPageId === pageId) {
            const newIndex = Math.min(pageIndex, updatedPages.length - 1);
            newCurrentPageId = updatedPages[newIndex].id;
          }

          const targetPage = updatedPages.find(p => p.id === newCurrentPageId);

          set(
            {
              pages: updatedPages,
              currentPageId: newCurrentPageId,
              components: targetPage ? targetPage.components : [],
              selectedComponentId: null,
            },
            false,
            'removePage'
          );

          return true;
        },

        switchToPage: (pageId) => {
          const { pages, currentPageId, syncCurrentPageToPages } = get();
          
          if (pageId === currentPageId) {
            return;
          }

          const targetPage = pages.find(p => p.id === pageId);
          if (!targetPage) {
            console.warn(`Page not found: ${pageId}`);
            return;
          }

          syncCurrentPageToPages();

          set(
            {
              currentPageId: pageId,
              components: structuredClone(targetPage.components),
              selectedComponentId: null,
            },
            false,
            'switchToPage'
          );
        },

        renamePage: (pageId, newName) => {
          const { pages, currentPageId } = get();
          
          const updatedPages = pages.map(page => {
            if (page.id === pageId) {
              return {
                ...page,
                name: newName,
                updatedAt: new Date().toISOString(),
              };
            }
            return page;
          });

          set({ pages: updatedPages }, false, 'renamePage');
        },

        setSaveStatus: (status, errorMessage) => {
        set(
          {
            saveStatus: status,
            saveErrorMessage: errorMessage || null,
            ...(status === 'saved' ? { lastSavedAt: new Date().toISOString() } : {}),
          },
          false,
          'setSaveStatus'
        );
      },

      setProjectName: (name) => {
        set({ projectName: name }, false, 'setProjectName');
        get().saveCurrentProject(true);
      },

      saveCurrentProject: (_immediate = false) => {
        const { bindings, currentProjectId, projectName, setSaveStatus, syncCurrentPageToPages, pages, currentPageId } = get();

        syncCurrentPageToPages();

        setSaveStatus('saving');

        try {
          const savedProject = saveProjectToStorage({
            id: currentProjectId || undefined,
            name: projectName,
            pages: structuredClone(pages),
            currentPageId,
            components: structuredClone(get().components),
            bindings: structuredClone(bindings),
          });

          set(
            {
              currentProjectId: savedProject.id,
              lastSavedAt: savedProject.updatedAt,
            },
            false,
            'saveCurrentProject'
          );
          setSaveStatus('saved');

          setTimeout(() => {
            setSaveStatus('idle');
          }, 2000);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : '保存失败，请重试';
          setSaveStatus('error', errorMessage);
          console.error('Save project failed:', error);
        }
      },

      loadProject: (projectId) => {
        const result = loadProjectFromStorage(projectId);
        
        if (!result.success || !result.project) {
          set(
            {
              loadError: result.validationErrors || '无法加载项目',
              isProjectCorrupted: result.isCorrupted || false,
            },
            false,
            'loadProject_failed'
          );
          return false;
        }

        const { pages, currentPageId: projectCurrentPageId, components: projectComponents } = result.project;
        
        const currentPage = pages.find(p => p.id === projectCurrentPageId) || pages[0];

        const initialHistory: HistoryState[] = [
          {
            pageId: currentPage.id,
            components: structuredClone(currentPage.components),
            selectedComponentId: null,
          },
        ];

        set(
          {
            pages: [...pages],
            currentPageId: currentPage.id,
            components: currentPage.components,
            bindings: result.project.bindings || [],
            currentProjectId: result.project.id,
            projectName: result.project.name,
            lastSavedAt: result.project.updatedAt,
            selectedComponentId: null,
            saveStatus: 'idle',
            saveErrorMessage: null,
            loadError: null,
            isProjectCorrupted: false,
            history: initialHistory,
            currentIndex: 0,
            canUndo: false,
            canRedo: false,
          },
          false,
          'loadProject'
        );

        return true;
      },

      loadLatestProject: () => {
        const { currentProjectId } = get();
        
        if (currentProjectId) {
          return false;
        }

        const project = getLatestProject();
        if (!project) {
          return false;
        }

        const { pages, currentPageId: projectCurrentPageId } = project;
        const currentPage = pages.find(p => p.id === projectCurrentPageId) || pages[0];

        const initialHistory: HistoryState[] = [
          {
            pageId: currentPage.id,
            components: structuredClone(currentPage.components),
            selectedComponentId: null,
          },
        ];

        set(
          {
            pages: [...pages],
            currentPageId: currentPage.id,
            components: currentPage.components,
            bindings: project.bindings || [],
            currentProjectId: project.id,
            projectName: project.name,
            lastSavedAt: project.updatedAt,
            selectedComponentId: null,
            saveStatus: 'idle',
            saveErrorMessage: null,
            loadError: null,
            isProjectCorrupted: false,
            history: initialHistory,
            currentIndex: 0,
            canUndo: false,
            canRedo: false,
          },
          false,
          'loadLatestProject'
        );

        return true;
      },
      
      clearLoadError: () => {
        set(
          {
            loadError: null,
            isProjectCorrupted: false,
          },
          false,
          'clearLoadError'
        );
      },

      createNewProject: (name = '未命名项目') => {
        const newPages = createInitialPages();
        
        set(
          {
            pages: newPages,
            currentPageId: newPages[0].id,
            components: newPages[0].components,
            selectedComponentId: null,
            bindings: [],
            history: createInitialHistory(),
            currentIndex: 0,
            canUndo: false,
            canRedo: false,
            currentProjectId: null,
            projectName: name,
            saveStatus: 'idle',
            saveErrorMessage: null,
            lastSavedAt: null,
          },
          false,
          'createNewProject'
        );
      },

      listProjects: () => {
        return listProjectsFromStorage();
      },

      renameCurrentProject: (newName) => {
        const { currentProjectId } = get();
        if (!currentProjectId) {
          get().saveCurrentProject(true);
          return;
        }

        const updatedProject = renameProjectInStorage(currentProjectId, newName);
        if (updatedProject) {
          set(
            {
              projectName: newName,
              lastSavedAt: updatedProject.updatedAt,
            },
            false,
            'renameCurrentProject'
          );
        }
      },

      deleteProjectById: (projectId) => {
        return deleteProjectFromStorage(projectId);
      },

      saveCurrentAndCreateNewProject: (name) => {
        const { saveCurrentProject } = get();
        saveCurrentProject(true);

        const newProject = createNewEmptyProjectInStorage(name);
        
        set(
          {
            components: MOCK_EMPTY_CANVAS,
            selectedComponentId: null,
            bindings: [],
            history: createInitialHistory(),
            currentIndex: 0,
            canUndo: false,
            canRedo: false,
            currentProjectId: newProject.id,
            projectName: newProject.name,
            saveStatus: 'idle',
            saveErrorMessage: null,
            lastSavedAt: newProject.updatedAt,
          },
          false,
          'saveCurrentAndCreateNewProject'
        );

        return newProject.id;
      },

      saveCurrentAndLoadProject: (projectId) => {
        const { currentProjectId, saveCurrentProject, loadProject } = get();

        if (currentProjectId && currentProjectId !== projectId) {
          saveCurrentProject(true);
        }

        if (currentProjectId === projectId) {
          return true;
        }

        return loadProject(projectId);
      },

      isCurrentProject: (projectId) => {
        const { currentProjectId } = get();
        return currentProjectId === projectId;
      },

      pushHistory: (previousComponents, nextComponents) => {
        const { history, currentIndex, selectedComponentId } = get();

        const newHistory = history.slice(0, currentIndex + 1);

        const stateToSave: HistoryState = {
          components: structuredClone(previousComponents),
          selectedComponentId: selectedComponentId,
        };

        const shouldSave =
          JSON.stringify(previousComponents) !== JSON.stringify(nextComponents);

        if (!shouldSave) {
          return;
        }

        newHistory.push(stateToSave);

        if (newHistory.length > MAX_HISTORY_LENGTH) {
          newHistory.shift();
        }

        const newCurrentIndex = newHistory.length - 1;

        set(
          {
            history: newHistory,
            currentIndex: newCurrentIndex,
            canUndo: newCurrentIndex > 0,
            canRedo: newCurrentIndex < newHistory.length - 1,
          },
          false,
          'pushHistory'
        );
      },

      undo: () => {
        const { history, currentIndex, canUndo } = get();

        if (!canUndo) return;

        const newIndex = currentIndex - 1;
        const previousState = history[newIndex];
        const newComponents = structuredClone(previousState.components);
        
        let newSelectedComponentId = previousState.selectedComponentId;
        if (newSelectedComponentId !== null) {
          const componentExists = findComponentById(newComponents, newSelectedComponentId) !== null;
          if (!componentExists) {
            newSelectedComponentId = null;
          }
        }

        set(
          {
            components: newComponents,
            selectedComponentId: newSelectedComponentId,
            currentIndex: newIndex,
            canUndo: newIndex > 0,
            canRedo: newIndex < history.length - 1,
          },
          false,
          'undo'
        );
      },

      redo: () => {
        const { history, currentIndex, canRedo } = get();

        if (!canRedo) return;

        const newIndex = currentIndex + 1;
        const nextState = history[newIndex];
        const newComponents = structuredClone(nextState.components);
        
        let newSelectedComponentId = nextState.selectedComponentId;
        if (newSelectedComponentId !== null) {
          const componentExists = findComponentById(newComponents, newSelectedComponentId) !== null;
          if (!componentExists) {
            newSelectedComponentId = null;
          }
        }

        set(
          {
            components: newComponents,
            selectedComponentId: newSelectedComponentId,
            currentIndex: newIndex,
            canUndo: newIndex > 0,
            canRedo: newIndex < history.length - 1,
          },
          false,
          'redo'
        );
      },

      setComponents: (components) => {
        const { pushHistory } = get();
        const previousComponents = get().components;
        pushHistory(previousComponents, components);
        set({ components }, false, 'setComponents');
      },

      setSelectedComponentId: (id) => {
        set({ selectedComponentId: id }, false, 'setSelectedComponentId');
      },

      addComponent: (component) => {
        const { components, pushHistory } = get();
        const newComponents = [...components, component];
        pushHistory(components, newComponents);
        set(
          (state) => ({
            components: [...state.components, component],
          }),
          false,
          { type: 'addComponent', component }
        );
      },

      addComponentToParent: (parentId, component, index) => {
        const { components, pushHistory } = get();
        const newComponents = addComponentToParentInTree(components, parentId, component, index);
        pushHistory(components, newComponents);
        set(
          (state) => ({
            components: addComponentToParentInTree(state.components, parentId, component, index),
          }),
          false,
          { type: 'addComponentToParent', parentId, component, index }
        );
      },

      removeComponent: (id) => {
        const { components, pushHistory, selectedComponentId } = get();
        const newComponents = removeComponentFromTree(components, id);
        pushHistory(components, newComponents);

        let newSelectedComponentId = selectedComponentId;
        if (selectedComponentId === id) {
          const { nextId } = findNextComponentAfterDelete(components, id);
          newSelectedComponentId = nextId;
        }

        set(
          (state) => ({
            components: removeComponentFromTree(state.components, id),
            selectedComponentId: newSelectedComponentId,
          }),
          false,
          { type: 'removeComponent', id }
        );
      },

      updateComponent: (id, updates) => {
        const { components, pushHistory } = get();
        const newComponents = updateComponentInTree(components, id, updates);
        pushHistory(components, newComponents);
        set(
          (state) => ({
            components: updateComponentInTree(state.components, id, updates),
          }),
          false,
          { type: 'updateComponent', id, updates }
        );
      },

      moveComponentToParent: (componentId, newParentId, index) => {
        const { components, pushHistory } = get();
        
        const extractResult = extractComponentFromTree(components, componentId);
        
        if (!extractResult.extracted) {
          logger.warn('moveComponentToParent: 未找到组件', componentId);
          return;
        }

        const newComponents = addComponentToParentInTree(
          extractResult.components,
          newParentId,
          extractResult.extracted,
          index
        );

        pushHistory(components, newComponents);
        set(
          (state) => {
            const currentExtractResult = extractComponentFromTree(state.components, componentId);
            if (!currentExtractResult.extracted) {
              return state;
            }
            const movedComponents = addComponentToParentInTree(
              currentExtractResult.components,
              newParentId,
              currentExtractResult.extracted,
              index
            );
            return { components: movedComponents };
          },
          false,
          { type: 'moveComponentToParent', componentId, newParentId, index }
        );
      },

      canMoveUp: (id) => {
        const { components } = get();
        const location = findComponentLocation(components, id);
        if (!location) return false;

        const siblings = getSiblingsList(components, location.parentId);
        return location.index < siblings.length - 1;
      },

      canMoveDown: (id) => {
        const { components } = get();
        const location = findComponentLocation(components, id);
        if (!location) return false;

        return location.index > 0;
      },

      getComponentLayerInfo: (id) => {
        const { components } = get();
        const location = findComponentLocation(components, id);
        if (!location) return null;

        const siblings = getSiblingsList(components, location.parentId);
        return {
          currentLayer: location.index + 1,
          totalLayers: siblings.length,
        };
      },

      moveUp: (id) => {
        const { components, pushHistory, canMoveUp } = get();
        
        if (!canMoveUp(id)) return;

        const location = findComponentLocation(components, id);
        if (!location) return;

        const newIndex = location.index + 1;
        const newComponents = reorderComponentInTree(components, id, newIndex);
        
        pushHistory(components, newComponents);
        set(
          (state) => ({
            components: reorderComponentInTree(state.components, id, newIndex),
          }),
          false,
          { type: 'moveUp', id, newIndex }
        );
      },

      moveDown: (id) => {
        const { components, pushHistory, canMoveDown } = get();
        
        if (!canMoveDown(id)) return;

        const location = findComponentLocation(components, id);
        if (!location) return;

        const newIndex = location.index - 1;
        const newComponents = reorderComponentInTree(components, id, newIndex);
        
        pushHistory(components, newComponents);
        set(
          (state) => ({
            components: reorderComponentInTree(state.components, id, newIndex),
          }),
          false,
          { type: 'moveDown', id, newIndex }
        );
      },

      moveToTop: (id) => {
        const { components, pushHistory, canMoveUp } = get();
        
        if (!canMoveUp(id)) return;

        const location = findComponentLocation(components, id);
        if (!location) return;

        const siblings = getSiblingsList(components, location.parentId);
        const newIndex = siblings.length - 1;
        const newComponents = reorderComponentInTree(components, id, newIndex);
        
        pushHistory(components, newComponents);
        set(
          (state) => ({
            components: reorderComponentInTree(state.components, id, newIndex),
          }),
          false,
          { type: 'moveToTop', id, newIndex }
        );
      },

      moveToBottom: (id) => {
        const { components, pushHistory, canMoveDown } = get();
        
        if (!canMoveDown(id)) return;

        const location = findComponentLocation(components, id);
        if (!location) return;

        const newIndex = 0;
        const newComponents = reorderComponentInTree(components, id, newIndex);
        
        pushHistory(components, newComponents);
        set(
          (state) => ({
            components: reorderComponentInTree(state.components, id, newIndex),
          }),
          false,
          { type: 'moveToBottom', id, newIndex }
        );
      },

      addBinding: (binding) => {
        const { bindings, saveCurrentProject } = get();
        const now = new Date().toISOString();
        const newBinding: DataBindingRule = {
          ...binding,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        const newBindings = [...bindings, newBinding];
        set({ bindings: newBindings }, false, { type: 'addBinding', binding: newBinding });
        saveCurrentProject(true);
        return newBinding.id;
      },

      updateBinding: (id, updates) => {
        const { bindings, saveCurrentProject } = get();
        const now = new Date().toISOString();
        const newBindings = bindings.map((b) =>
          b.id === id ? { ...b, ...updates, updatedAt: now } : b
        );
        set({ bindings: newBindings }, false, { type: 'updateBinding', id, updates });
        saveCurrentProject(true);
      },

      removeBinding: (id) => {
        const { bindings, saveCurrentProject } = get();
        const newBindings = bindings.filter((b) => b.id !== id);
        set({ bindings: newBindings }, false, { type: 'removeBinding', id });
        saveCurrentProject(true);
      },

      setBindings: (bindings) => {
        const { saveCurrentProject } = get();
        set({ bindings }, false, 'setBindings');
        saveCurrentProject(true);
      },

      getBindingsForSource: (sourceId) => {
        const { bindings } = get();
        return bindings.filter((b) => b.sourceId === sourceId && b.enabled);
      },

      getBindingsForTarget: (targetId) => {
        const { bindings } = get();
        return bindings.filter((b) => b.targetId === targetId && b.enabled);
      },
    }),
    {
      name: 'BuilderStore',
      store: 'builder',
    }
  )
);
