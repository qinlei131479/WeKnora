import { MessagePlugin } from 'tdesign-vue-next'

interface ErrorLike {
  message?: string
  code?: string | number
  status?: number
}

interface HandleErrorOptions {
  showMessage?: boolean
  logToConsole?: boolean
  customMessage?: string | null
  severity?: 'error' | 'warning' | 'info'
}

/**
 * 统一错误处理工具类
 */
export class ErrorHandler {
  /**
   * 处理通用错误
   * @param {Error} error - 错误对象
   * @param {string} context - 错误上下文
   * @param {Object} options - 配置选项
   */
  static handleError(
    error: ErrorLike | null | undefined,
    context = '操作',
    options: HandleErrorOptions = {}
  ): ErrorLike | null | undefined {
    const {
      showMessage = true,
      logToConsole = true,
      customMessage = null,
      severity = 'error'
    } = options

    // 控制台日志
    if (logToConsole) {
      console.error(`${context}失败:`, error)
    }

    // 用户提示
    if (showMessage) {
      const displayMessage = customMessage || this.getErrorMessage(error, context)

      switch (severity) {
        case 'warning':
          MessagePlugin.warning(displayMessage)
          break
        case 'info':
          MessagePlugin.info(displayMessage)
          break
        case 'error':
        default:
          MessagePlugin.error(displayMessage)
          break
      }
    }

    return error
  }

  /**
   * 获取错误消息
   * @param {Error} error - 错误对象
   * @param {string} context - 错误上下文
   * @returns {string} 错误消息
   */
  static getErrorMessage(error: ErrorLike | null | undefined, context: string): string {
    if (error?.message) {
      return `${context}失败: ${error.message}`
    }
    return `${context}失败`
  }

  /**
   * 处理网络请求错误
   * @param {Error} error - 错误对象
   * @param {string} context - 错误上下文
   */
  static handleNetworkError(
    error: ErrorLike | null | undefined,
    context = '网络请求'
  ): ErrorLike | null | undefined {
    let customMessage: string | null = null

    if (error?.code === 'NETWORK_ERROR') {
      customMessage = '网络连接失败，请检查网络设置'
    } else if (error?.status === 401) {
      customMessage = '认证失败，请重新登录'
    } else if (error?.status === 403) {
      customMessage = '权限不足，无法执行此操作'
    } else if (error?.status === 404) {
      customMessage = '请求的资源不存在'
    } else if ((error?.status ?? 0) >= 500) {
      customMessage = '服务器错误，请稍后重试'
    }

    return this.handleError(error, context, { customMessage })
  }

  /**
   * 处理聊天相关错误
   * @param {Error} error - 错误对象
   * @param {string} operation - 操作类型
   */
  static handleChatError(
    error: ErrorLike | null | undefined,
    operation: string
  ): ErrorLike | null | undefined {
    const contextMap: Record<string, string> = {
      send: '发送消息',
      create: '创建对话',
      delete: '删除对话',
      rename: '重命名对话',
      load: '加载对话',
      export: '导出对话',
      stream: '流式处理'
    }

    const context = contextMap[operation] || operation
    return this.handleError(error, context)
  }

  /**
   * 处理验证错误
   * @param {string} message - 验证错误消息
   */
  static handleValidationError(message: string): ErrorLike | null | undefined {
    return this.handleError(new Error(message), '输入验证', {
      severity: 'warning',
      customMessage: message
    })
  }

  /**
   * 处理异步操作错误
   * @param {Function} asyncFn - 异步函数
   * @param {string} context - 错误上下文
   * @param {Object} options - 配置选项
   */
  static async handleAsync<T>(
    asyncFn: () => Promise<T>,
    context: string,
    options: HandleErrorOptions = {}
  ): Promise<T> {
    try {
      return await asyncFn()
    } catch (error) {
      this.handleError(error as ErrorLike, context, options)
      throw error
    }
  }

  /**
   * 创建错误处理装饰器
   * @param {string} context - 错误上下文
   * @param {Object} options - 配置选项
   */
  static createHandler(
    context: string,
    options: HandleErrorOptions = {}
  ): (error: ErrorLike | null | undefined) => ErrorLike | null | undefined {
    return (error) => this.handleError(error, context, options)
  }
}

/**
 * 快捷方法
 */
export const handleChatError = ErrorHandler.handleChatError.bind(ErrorHandler)
export const handleNetworkError = ErrorHandler.handleNetworkError.bind(ErrorHandler)
export const handleValidationError = ErrorHandler.handleValidationError.bind(ErrorHandler)
export const handleAsync = ErrorHandler.handleAsync.bind(ErrorHandler)

export default ErrorHandler
