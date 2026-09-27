/**
 * API模块索引文件
 * 导出所有API模块，方便统一引入
 */

// 导出API模块
export * from './system_api' // 系统管理API
export * from '@/api/chat-work/agent' // 智能体API（含 thread SSE）
export { mcpApi } from '@/api/chat-work/mcp'
export { skillApi } from '@/api/chat-work/skill'
export { toolApi } from '@/api/chat-work/tool'
export * from './user_api' // 用户资源 API

// 导出基础工具函数
export {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  apiAdminGet,
  apiAdminPost,
  apiAdminPut,
  apiAdminDelete,
  apiSuperAdminGet,
  apiSuperAdminPost,
  apiSuperAdminPut,
  apiSuperAdminDelete
} from './base'

/**
 * API模块说明:
 *
 * 1. system_api.js: 读取 WeKnora 模型列表
 *
 * 2. 知识库 API 已统一改用原生 WeKnora 接口（@/api/knowledge-base）
 *    - 不再保留 harness /harness-api/api/knowledge 接口
 *
 *
 * 4. tools.js: 工具API
 *    - 工具信息获取
 *
 * 6. agent.js: 智能体API
 *    - 智能体管理、聊天、配置等功能
 *
 * 注意：API模块已处理权限验证和请求头，使用时无需再手动添加认证头
 */
