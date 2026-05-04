import type { ComponentSchema, ContainerComponentSchema } from '@/types/component';

export const isContainerComponent = (
  component: ComponentSchema
): component is ContainerComponentSchema => {
  return (
    component.type === 'Container' ||
    component.type === 'Card' ||
    component.type === 'Tabs' ||
    component.type === 'TabPane' ||
    component.type === 'Accordion' ||
    component.type === 'AccordionItem' ||
    component.type === 'Modal' ||
    component.type === 'Form' ||
    component.type === 'FormItem'
  );
};
