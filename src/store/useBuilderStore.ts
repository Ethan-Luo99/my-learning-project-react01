import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ComponentType, type ComponentSchema, type ContainerComponentSchema } from '@/types/component';
import { MOCK_EMPTY_CANVAS } from '@/constants/mockData';

const MAX_HISTORY_LENGTH = 50;

interface HistoryState {
  components: ComponentSchema[];
}

const isContainerComponent = (
  component: ComponentSchema
): component is ContainerComponentSchema => {
  return component.type === ComponentType.Container;
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

      pushHistory: (newComponents) => {
        const { components, history, currentIndex } = get();

        const newHistory = history.slice(0, currentIndex + 1);

        const currentState: HistoryState = {
          components: structuredClone(components),
        };

        let shouldSave = false;

        if (newComponents) {
          shouldSave = JSON.stringify(components) !== JSON.stringify(newComponents);
        } else {
          const lastState = newHistory[newHistory.length - 1];
          shouldSave =
            JSON.stringify(lastState.components) !== JSON.stringify(currentState.components);
        }

        if (!shouldSave) {
          return;
        }

        newHistory.push(currentState);

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

        set(
          {
            components: structuredClone(previousState.components),
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

        set(
          {
            components: structuredClone(nextState.components),
            currentIndex: newIndex,
            canUndo: true,
            canRedo: newIndex < history.length - 1,
          },
          false,
          'redo'
        );
      },

      setComponents: (components) => {
        const { pushHistory } = get();
        pushHistory(components);
        set({ components }, false, 'setComponents');
      },

      setSelectedComponentId: (id) => {
        set({ selectedComponentId: id }, false, 'setSelectedComponentId');
      },

      addComponent: (component) => {
        const { components, pushHistory } = get();
        const newComponents = [...components, component];
        pushHistory(newComponents);
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
        pushHistory(newComponents);
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
        pushHistory(newComponents);
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
        pushHistory(newComponents);
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
