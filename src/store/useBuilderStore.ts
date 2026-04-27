import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ComponentType, type ComponentSchema, type ContainerComponentSchema } from '@/types/component';
import { MOCK_CANVAS_DATA } from '@/constants/mockData';

const isContainerComponent = (
  component: ComponentSchema
): component is ContainerComponentSchema => {
  return component.type === ComponentType.Container;
};

interface BuilderState {
  components: ComponentSchema[];
  selectedComponentId: string | null;

  setComponents: (components: ComponentSchema[]) => void;
  setSelectedComponentId: (id: string | null) => void;

  addComponent: (component: ComponentSchema) => void;
  addComponentToParent: (parentId: string | null, component: ComponentSchema) => void;

  removeComponent: (id: string) => void;

  updateComponent: (id: string, updates: Partial<ComponentSchema>) => void;
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

export const useBuilderStore = create<BuilderState>()(
  devtools(
    (set) => ({
      components: MOCK_CANVAS_DATA,
      selectedComponentId: null,

      setComponents: (components) => set({ components }, false, 'setComponents'),
      setSelectedComponentId: (id) =>
        set({ selectedComponentId: id }, false, 'setSelectedComponentId'),

      addComponent: (component) =>
        set(
          (state) => ({
            components: [...state.components, component],
          }),
          false,
          { type: 'addComponent', component }
        ),

      addComponentToParent: (parentId, component) =>
        set(
          (state) => ({
            components: addComponentToParentInTree(state.components, parentId, component),
          }),
          false,
          { type: 'addComponentToParent', parentId, component }
        ),

      removeComponent: (id) =>
        set(
          (state) => ({
            components: removeComponentFromTree(state.components, id),
            selectedComponentId:
              state.selectedComponentId === id ? null : state.selectedComponentId,
          }),
          false,
          { type: 'removeComponent', id }
        ),

      updateComponent: (id, updates) =>
        set(
          (state) => ({
            components: updateComponentInTree(state.components, id, updates),
          }),
          false,
          { type: 'updateComponent', id, updates }
        ),
    }),
    {
      name: 'BuilderStore',
      store: 'builder',
    }
  )
);
