import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ComponentType, type ComponentSchema, type ContainerComponentSchema } from '@/types/component';
import { MOCK_EMPTY_CANVAS } from '@/constants/mockData';

const MAX_HISTORY_LENGTH = 50;

interface HistoryState {
  components: ComponentSchema[];
  selectedComponentId: string | null;
}

const isContainerComponent = (
  component: ComponentSchema
): component is ContainerComponentSchema => {
  return component.type === ComponentType.Container;
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

interface BuilderState {
  components: ComponentSchema[];
  selectedComponentId: string | null;

  history: HistoryState[];
  currentIndex: number;

  setSelectedComponentId: (id: string | null) => void;

  addComponent: (component: ComponentSchema) => void;
  addComponentToParent: (parentId: string | null, component: ComponentSchema) => void;

  removeComponent: (id: string) => void;

  updateComponent: (id: string, updates: Partial<ComponentSchema>) => void;

  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
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
  component: ComponentSchema
): ComponentSchema[] => {
  if (parentId === null) {
    return [...components, component];
  }

  return components.map((comp) => {
    if (comp.id === parentId && isContainerComponent(comp)) {
      return {
        ...comp,
        children: [...(comp.children || []), component],
      };
    }
    if (isContainerComponent(comp) && comp.children && comp.children.length > 0) {
      return {
        ...comp,
        children: addComponentToParentInTree(comp.children, parentId, component),
      };
    }
    return comp;
  });
};

const createInitialHistory = (): HistoryState[] => [
  {
    components: MOCK_EMPTY_CANVAS,
    selectedComponentId: null,
  },
];

export const useBuilderStore = create<BuilderState>()(
  devtools(
    (set, get) => ({
      components: MOCK_EMPTY_CANVAS,
      selectedComponentId: null,

      history: createInitialHistory(),
      currentIndex: 0,
      canUndo: false,
      canRedo: false,

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

      addComponentToParent: (parentId, component) => {
        const { components, pushHistory } = get();
        const newComponents = addComponentToParentInTree(components, parentId, component);
        pushHistory(components, newComponents);
        set(
          (state) => ({
            components: addComponentToParentInTree(state.components, parentId, component),
          }),
          false,
          { type: 'addComponentToParent', parentId, component }
        );
      },

      removeComponent: (id) => {
        const { components, pushHistory } = get();
        const newComponents = removeComponentFromTree(components, id);
        pushHistory(components, newComponents);
        set(
          (state) => ({
            components: removeComponentFromTree(state.components, id),
            selectedComponentId:
              state.selectedComponentId === id ? null : state.selectedComponentId,
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
    }),
    {
      name: 'BuilderStore',
      store: 'builder',
    }
  )
);
