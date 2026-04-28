const isDevelopment = import.meta.env.DEV;
const envDebug = import.meta.env.VITE_ENABLE_DEBUG;

const shouldLog = (): boolean => {
  if (envDebug === 'true') return true;
  if (envDebug === 'false') return false;
  return isDevelopment;
};

const logger = {
  log: (...args: unknown[]) => {
    if (shouldLog()) {
      console.log(...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (shouldLog()) {
      console.warn(...args);
    }
  },
  error: (...args: unknown[]) => {
    console.error(...args);
  },
  info: (...args: unknown[]) => {
    if (shouldLog()) {
      console.info(...args);
    }
  },
  debug: (...args: unknown[]) => {
    if (shouldLog()) {
      console.debug(...args);
    }
  },
};

export { logger };
