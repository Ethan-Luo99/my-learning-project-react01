/**
 * 事件执行引擎
 * 负责解析事件配置并按序执行动作
 */

import { ActionType, NavigateTarget, type ActionConfig } from '@/types/component';

export interface ActionExecutionContext {
  submitForm?: (formId?: string) => void;
  resetForm?: (formId?: string) => void;
}

export const executeShowAlert = (params: ActionConfig['params']): void => {
  if (params.alertMessage) {
    alert(params.alertMessage);
  } else {
    alert('事件触发了');
  }
};

export const executeNavigateUrl = (params: ActionConfig['params']): void => {
  if (!params.targetUrl) {
    console.warn('NAVIGATE_URL 动作缺少 targetUrl 参数');
    return;
  }

  const target = params.navigateTarget || NavigateTarget.NewWindow;
  
  try {
    if (target === NavigateTarget.NewWindow) {
      window.open(params.targetUrl, '_blank');
    } else {
      window.location.href = params.targetUrl;
    }
  } catch (error) {
    console.error('NAVIGATE_URL 执行错误:', error);
  }
};

export const executeNavigatePage = (params: ActionConfig['params']): void => {
  if (!params.pageId) {
    console.warn('NAVIGATE_PAGE 动作缺少 pageId 参数');
    return;
  }

  console.log('页面跳转:', params.pageId);
  alert(`页面跳转功能（预留）: ${params.pageId}`);
};

export const executeConsoleLog = (params: ActionConfig['params']): void => {
  if (params.logMessage) {
    console.log(params.logMessage);
  } else {
    console.log('事件触发了');
  }
};

export const executeCustomScript = (params: ActionConfig['params']): void => {
  if (!params.customScript) {
    return;
  }

  try {
    const scriptFn = new Function(params.customScript);
    scriptFn();
  } catch (error) {
    console.error('CUSTOM_SCRIPT 执行错误:', error);
    alert(`脚本执行错误: ${error}`);
  }
};

export const executeFormSubmit = (
  params: ActionConfig['params'],
  context?: ActionExecutionContext
): void => {
  if (context?.submitForm) {
    context.submitForm(params.formId);
  } else {
    console.warn('FORM_SUBMIT 动作缺少 submitForm 上下文');
    if (params.formId) {
      console.log('表单提交（模拟）:', params.formId);
    }
  }
};

export const executeFormReset = (
  params: ActionConfig['params'],
  context?: ActionExecutionContext
): void => {
  if (context?.resetForm) {
    context.resetForm(params.formId);
  } else {
    console.warn('FORM_RESET 动作缺少 resetForm 上下文');
    if (params.formId) {
      console.log('表单重置（模拟）:', params.formId);
    }
  }
};

export const executeAction = (
  action: ActionConfig,
  context?: ActionExecutionContext
): void => {
  if (!action.enabled) {
    return;
  }

  switch (action.type) {
    case ActionType.ShowAlert:
      executeShowAlert(action.params);
      break;

    case ActionType.NavigateUrl:
      executeNavigateUrl(action.params);
      break;

    case ActionType.NavigatePage:
      executeNavigatePage(action.params);
      break;

    case ActionType.ConsoleLog:
      executeConsoleLog(action.params);
      break;

    case ActionType.CustomScript:
      executeCustomScript(action.params);
      break;

    case ActionType.FormSubmit:
      executeFormSubmit(action.params, context);
      break;

    case ActionType.FormReset:
      executeFormReset(action.params, context);
      break;

    default:
      console.warn('未知的动作类型:', action.type);
  }
};

export const executeActions = (
  actions: ActionConfig[],
  context?: ActionExecutionContext
): void => {
  for (const action of actions) {
    executeAction(action, context);
  }
};

export interface EventEngine {
  executeAction: (action: ActionConfig) => void;
  executeActions: (actions: ActionConfig[]) => void;
}

export const createEventEngine = (context?: ActionExecutionContext): EventEngine => {
  return {
    executeAction: (action: ActionConfig) => executeAction(action, context),
    executeActions: (actions: ActionConfig[]) => executeActions(actions, context),
  };
};

export { ActionType, NavigateTarget, type ActionConfig };
