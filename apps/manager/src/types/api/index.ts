/**
 * API 类型统一导出
 */
export * from './common';

// 登录模块
export * from './login';
export * from './menu';

// System 模块
export * from './system/user';
export * from './system/role';
export * from './system/menu';
export * from './system/dept';
export * from './system/post';
export * from './system/dict';
export * from './system/config';
export * from './system/notice';
export * from './system/logininfor';
export * from './system/operlog';

// monitor 模块
export * from './monitor/job';
export * from './monitor/jobLog';
export * from './monitor/online';

// 代码生成模块
export * from './tool/gen';

// 推荐模块
export * from './recommend/RecUser';
export * from './recommend/RecSpecial';

// 业务智能体模块
export * from './agentic';

// 系统资源管控模块
export * from './resources/model';
export * from './resources/tool';
export * from './resources/skill';

// 代理模块
export * from './dataservices/datasources';

// 系统设置模块
export * from './settings/knowledgeOptLog';
export * from './settings/category';

// 知识库模块
export * from './knowledge';

// 业务模块
export * from './business';

// 代理模块
export * from './proxy/proxy';

// 首页模块
export * from './home';
