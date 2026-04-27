import { v4 as uuidv4 } from 'uuid';

export const generateId = (prefix?: string): string => {
  const id = uuidv4();
  return prefix ? `${prefix}-${id}` : id;
};

export const generateShortId = (): string => {
  return uuidv4().slice(0, 8);
};
