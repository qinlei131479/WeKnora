// src/utils/request.js
import axios from "axios";
import { generateRandomString, MAX_FILE_SIZE_MB } from "./index";
import i18n from '@/i18n'
import { getApiBaseUrl } from './api-base';
import { localizeApiErrorCode, localizeBackendErrorMessage } from './backendErrorMessage';
import { isTimeoutError, uploadTimeoutMs } from './requestTimeouts';

const t = (key: string, params: Record<string, string> = {}) => i18n.global.t(key, params)

function localizeApiErrorMessage(message: string | undefined): string | undefined {
  return localizeBackendErrorMessage(message, t)
}

function isBinaryBody(data: unknown): boolean {
  return typeof Blob !== 'undefined' && data instanceof Blob
    || typeof ArrayBuffer !== 'undefined' && data instanceof ArrayBuffer
}

/** 把响应里直接展示的错误字段换成当前语言，嵌套 error.message 与顶层 message 保持一致。 */
function localizeErrorEnvelope<T>(data: T): T {
  if (!data || typeof data !== 'object' || Array.isArray(data) || isBinaryBody(data)) return data
  const record = data as Record<string, unknown>
  const next: Record<string, unknown> = { ...record }
  if (typeof next.message === 'string') {
    next.message = localizeApiErrorMessage(next.message) ?? next.message
  }
  if (typeof next.error_message === 'string') {
    next.error_message = localizeApiErrorMessage(next.error_message) ?? next.error_message
  }
  if (typeof next.error === 'string') {
    next.error = localizeApiErrorMessage(next.error) ?? next.error
  } else if (next.error && typeof next.error === 'object' && !Array.isArray(next.error)) {
    const err = { ...(next.error as Record<string, unknown>) }
    if (typeof err.message === 'string') {
      err.message = localizeApiErrorMessage(err.message) ?? err.message
    }
    next.error = err
  }
  return next as T
}

function skillDetailMessage(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const detail = (data as { detail?: unknown }).detail
  if (!detail || typeof detail !== 'object' || Array.isArray(detail)) return undefined
  const record = detail as { error_code?: unknown; params?: unknown }
  if (typeof record.error_code !== 'string') return undefined
  const params = record.params && typeof record.params === 'object' && !Array.isArray(record.params)
    ? record.params as Record<string, string>
    : {}
  return localizeApiErrorCode(record.error_code, params, t, (key) => i18n.global.te(key))
}

function localizedRejectMessage(data: unknown): string | undefined {
  const fromSkill = skillDetailMessage(data)
  if (fromSkill) return fromSkill
  if (typeof data === 'string') return localizeApiErrorMessage(data)
  if (!data || typeof data !== 'object') return undefined
  const record = data as Record<string, unknown>
  if (typeof record.message === 'string' && record.message) return record.message
  if (typeof record.error === 'string') return record.error
  const nested = record.error as { message?: unknown } | undefined
  if (typeof nested?.message === 'string') return nested.message
  return undefined
}

export type WithStatus<T> = T & {
  readonly $httpStatus: number
}

const HTTP_STATUS_KEY = '$httpStatus'

function withHttpStatus<T>(data: T, status: number): T {
  if (data !== null && typeof data === 'object') {
    Object.defineProperty(data, HTTP_STATUS_KEY, {
      value: status,
      enumerable: false,
      configurable: true,
      writable: false,
    })
  }
  return data
}

// API基础URL
const BASE_URL = getApiBaseUrl();


// 创建Axios实例
const instance = axios.create({
  baseURL: BASE_URL, // 使用配置的API基础URL
  timeout: 30000, // 请求超时时间
  headers: {
    "Content-Type": "application/json",
    "X-Request-ID": `${generateRandomString(12)}`,
  },
});

// 获取当前用户语言（用于 Accept-Language header）
export function getCurrentLanguage(): string {
  return i18n.global.locale?.value || localStorage.getItem('locale') || 'zh-CN'
}


instance.interceptors.request.use(
  (config) => {
    const existingAuth = config.headers?.Authorization ?? config.headers?.authorization;
    const isEmbedAuth = typeof existingAuth === 'string' && existingAuth.startsWith('Embed ');
    const isEmbedPath = typeof config.url === 'string' && config.url.includes('/api/v1/embed/');

    // 嵌入渠道使用 Embed token；勿用本地 JWT 覆盖（否则调试页会 401）
    if (!isEmbedAuth) {
      const token = localStorage.getItem('weknora_token');
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    }
    
    // 添加用户语言偏好
    config.headers["Accept-Language"] = getCurrentLanguage();
    
    // 添加跨空间访问请求头：只要 setSelectedTenant 写过激活空间，
    // 每个请求都要附 X-Tenant-ID。早期版本会 short-circuit
    // "selectedTenantId === defaultTenantId 时不附"以减少 header 体积，
    // 但这条优化会被任何把 weknora_tenant 写成激活空间的代码（OIDC
    // 回调、UserMenu loadUserInfo、router hydrate）触发，导致后续请求
    // 静默丢失 header，前端"切换了"但实际仍跑在 home 空间里——把"切
    // 换之后只有第一批请求带 X-Tenant-ID"调成永久状态。
    // 后端 IsTenantAccessible 已经允许 header 指向 home 空间（自家），
    // 所以无脑附不会引入新风险。
    if (!isEmbedAuth && !isEmbedPath) {
      const selectedTenantId = localStorage.getItem('weknora_selected_tenant_id');
      if (selectedTenantId) {
        config.headers["X-Tenant-ID"] = selectedTenantId;
      }
    }
    
    config.headers["X-Request-ID"] = `${generateRandomString(12)}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Token刷新标志，防止多个请求同时刷新token
let isRefreshing = false;
let failedQueue: Array<{ resolve: Function; reject: Function }> = [];

// Share-link endpoints (/auth/invitations/lookup, /auth/register-by-invite)
// are reachable by anonymous users opening an invite link. A 401 from these
// must surface to the page (e.g. expired token), not trigger the
// refresh-then-redirect-to-login flow (issue #1617). '/auth/register' already
// covers '/auth/register-by-invite' via substring match.
const PUBLIC_AUTH_PATHS = ['/auth/auto-setup', '/auth/login', '/auth/register', '/auth/oidc/', '/auth/invitations/lookup', '/api/v1/embed/'];

function isPublicAuthRequest(url?: string): boolean {
  if (!url) return false;
  return PUBLIC_AUTH_PATHS.some(p => url.includes(p));
}

// 处理队列中的请求
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

function isEmbedPage(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.startsWith('/embed/');
}

function redirectToLogin() {
  if (typeof window === 'undefined') return;
  if (window.location.pathname === '/login') return;
  // Embed 渠道用 Embed token 鉴权，匿名访问不应被踢到登录页
  if (isEmbedPage()) return;
  window.location.href = '/login';
}

instance.interceptors.response.use(
  (response) => {
    // 根据业务状态码处理逻辑
    const { status, data } = response;
    if (status >= 200 && status < 300) {
      return withHttpStatus(localizeErrorEnvelope(data), status);
    } else {
      return Promise.reject(withHttpStatus(localizeErrorEnvelope(data), status));
    }
  },
  async (error: any) => {
    const originalRequest = error.config;
    
    if (!error.response) {
      // 超时和连不上服务器都没有 response。上传超时若报成「检查网络」，会把人带去查错问题。
      return Promise.reject({
        message: t(isTimeoutError(error) ? 'error.requestTimeout' : 'error.networkError'),
      });
    }
    
    // 公开接口（auto-setup / login / register / oidc）的 401 不走 refresh 逻辑，直接返回错误
    if ((error.response.status === 401 || error.response.status === 403) && isPublicAuthRequest(originalRequest?.url)) {
      const { status, data } = error.response;
      const body = localizeErrorEnvelope(data);
      return Promise.reject({
        status,
        ...(typeof body === 'object' && body ? body : {}),
        message: localizedRejectMessage(body) || t('error.invalidCredentials'),
      });
    }

    // Embed 调试页/挂件：无 JWT 时直接拒绝，勿走 refresh → /login
    if (error.response.status === 401 && isEmbedPage()) {
      const { status, data } = error.response;
      const body = localizeErrorEnvelope(data);
      return Promise.reject({
        status,
        ...(typeof body === 'object' && body ? body : {}),
        message: localizedRejectMessage(body) || t('error.invalidCredentials'),
      });
    }

    // 如果是401错误且不是刷新token的请求，尝试刷新token
    if (error.response.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh')) {
      if (isRefreshing) {
        // 如果正在刷新token，将请求加入队列
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return instance(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      const refreshToken = localStorage.getItem('weknora_refresh_token');
      
      if (refreshToken) {
        try {
          // 动态导入refresh token API
          const { refreshToken: refreshTokenAPI } = await import('../api/auth/index');
          const response = await refreshTokenAPI(refreshToken);
          
          if (response.success && response.data) {
            const { token, refreshToken: newRefreshToken } = response.data;
            
            // 更新localStorage中的token
            localStorage.setItem('weknora_token', token);
            localStorage.setItem('weknora_refresh_token', newRefreshToken);
            
            // 更新请求头
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            
            // 处理队列中的请求
            processQueue(null, token);
            
            return instance(originalRequest);
          } else {
            throw new Error(response.message || t('error.tokenRefreshFailed'));
          }
        } catch (refreshError) {
          // 刷新失败，清除所有token并跳转到登录页
          localStorage.removeItem('weknora_token');
          localStorage.removeItem('weknora_refresh_token');
          localStorage.removeItem('weknora_user');
          localStorage.removeItem('weknora_tenant');
          
          processQueue(refreshError, null);
          
          redirectToLogin();
          
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        // 没有refresh token，直接跳转到登录页
        localStorage.removeItem('weknora_token');
        localStorage.removeItem('weknora_user');
        localStorage.removeItem('weknora_tenant');
        
        redirectToLogin();
        
        return Promise.reject({ message: t('error.pleaseRelogin') });
      }
    }
    
    // 处理 Nginx 413 Request Entity Too Large
    if (error.response.status === 413) {
      return Promise.reject({ 
        status: 413, 
        message: i18n.global.t('error.fileSizeExceeded', { size: MAX_FILE_SIZE_MB }),
        success: false
      });
    }

    const { status, data } = error.response;
    // 后端格式为 { success: false, error: { code, message } }，或 { error: "..." }。
    // 顶层 message 与嵌套 error.message 都换成当前语言，页面无论读哪一层都一致。
    const body = localizeErrorEnvelope(typeof data === 'object' && data ? data : {});
    const errorMessage = localizedRejectMessage(typeof data === 'string' ? data : body);
    return Promise.reject({ 
      status, 
      ...(typeof body === 'object' ? body : {}),
      message: errorMessage,
    });
  }
);

export function get<T = any>(url: string, config?: any): Promise<WithStatus<T>> {
  return instance.get<T>(url, config) as unknown as Promise<WithStatus<T>>;
}

export async function getDown(url: string): Promise<Blob> {
  const res = await instance.get<Blob>(url, {
    responseType: "blob",
  }) as unknown as Blob;
  return res
}

export function postUpload(
  url: string,
  data = {},
  onUploadProgress?: (progressEvent: any) => void,
  config: any = {},
): Promise<any> {
  return instance.post(url, data, {
    // 上传耗时取决于传输，不是 JSON 接口的 30 秒默认超时。按体积放宽，
    // 调用方显式传入的 config.timeout 仍然优先。
    timeout: uploadTimeoutMs(data),
    ...config,
    headers: {
      "Content-Type": "multipart/form-data",
      "X-Request-ID": `${generateRandomString(12)}`,
      ...(config.headers || {}),
    },
    onUploadProgress: onUploadProgress || config.onUploadProgress,
  }) as unknown as Promise<any>;
}

export function postChat<T = any>(url: string, data = {}): Promise<T> {
  return instance.post(url, data, {
    headers: {
      "Content-Type": "text/event-stream;charset=utf-8",
      "X-Request-ID": `${generateRandomString(12)}`,
    },
  }) as unknown as Promise<T>;
}

export function post<T = any>(url: string, data = {}, config?: any): Promise<WithStatus<T>> {
  return instance.post<T>(url, data, config) as unknown as Promise<WithStatus<T>>;
}

export function put<T = any>(url: string, data = {}, config?: any): Promise<WithStatus<T>> {
  return instance.put<T>(url, data, config) as unknown as Promise<WithStatus<T>>;
}

export function patch<T = any>(url: string, data = {}, config?: any): Promise<WithStatus<T>> {
  return instance.patch<T>(url, data, config) as unknown as Promise<WithStatus<T>>;
}

export function del<T = any>(url: string, data?: any): Promise<WithStatus<T>> {
  return instance.delete<T>(url, { data }) as unknown as Promise<WithStatus<T>>;
}
