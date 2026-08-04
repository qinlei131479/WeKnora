// Request DTO
export interface ProxyDTO {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  headers?: Record<string, string>;
  body?: string;
  extra?: {
    logType: string;
    content: string;
  };
}
