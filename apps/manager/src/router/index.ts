import { createWebHistory, createRouter } from 'vue-router';
/* Layout */
import Layout from '@/layout/index.vue';
/**
 * Note: 路由配置项
 *
 * hidden: true                     // 当设置 true 的时候该路由不会再侧边栏出现 如401，login等页面，或者如一些编辑页面/edit/1
 * alwaysShow: true                 // 当你一个路由下面的 children 声明的路由大于1个时，自动会变成嵌套的模式--如组件页面
 *                                  // 只有一个时，会将那个子路由当做根路由显示在侧边栏--如引导页面
 *                                  // 若你想不管路由下面的 children 声明的个数都显示你的根路由
 *                                  // 你可以设置 alwaysShow: true，这样它就会忽略之前定义的规则，一直显示根路由
 * redirect: noRedirect             // 当设置 noRedirect 的时候该路由在面包屑导航中不可被点击
 * name:'router-name'               // 设定路由的名字，一定要填写不然使用<keep-alive>时会出现各种问题
 * query: '{"id": 1, "name": "ry"}' // 访问路由的默认传递参数
 * roles: ['admin', 'common']       // 访问路由的角色权限
 * permissions: ['a:a:a', 'b:b:b']  // 访问路由的菜单权限
 * meta : {
    noCache: true                   // 如果设置为true，则不会被 <keep-alive> 缓存(默认 false)
    title: 'title'                  // 设置该路由在侧边栏和面包屑中展示的名字
    icon: 'svg-name'                // 设置该路由的图标，对应路径src/assets/icons/svg
    breadcrumb: false               // 如果设置为false，则不会在breadcrumb面包屑中显示
    activeMenu: '/system/user'      // 当路由设置了该属性，则会高亮相对应的侧边栏。
  }
 */

// const devPath = '';
// const devRoute = {
//   path: devPath || '/',
//   component: Layout,
//   redirect: devPath + '/index',
//   meta: { title: '开发中心', icon: 'dashboard', affix: true },
//   children: [
//     {
//       path: 'index',
//       // component: () => import('@/views/index.vue'),
//       component: () => import('@/pages/Dashboard.vue'),
//       name: 'Index',
//       meta: { title: '首页', icon: 'dashboard', affix: true }
//     },
//     {
//       path: 'agents',
//       name: 'AgentList',
//       meta: { title: '智能体大脑' },
//       component: () => import('@/pages/AgentList.vue')
//     },
//     // { path: 'agents/new', name: 'AgentForm', hidden: true, meta:{activeMenu:devPath + '/agents'},  component: () => import('@/views/agentManager/AgentFormView.vue') },
//     // { path: 'agents/edit', name: 'AgentEdit', hidden: true, meta:{activeMenu:devPath + '/agents'}, component: () => import('@/views/agentManager/AgentFormView.vue') },
//     {
//       path: 'agents/new',
//       name: 'AgentForm1',
//       hidden: true,
//       meta: { activeMenu: devPath + '/agents' },
//       component: () => import('@/pages/AgentForm.vue')
//     },
//     {
//       path: 'agents/edit/:id',
//       name: 'AgentForm1',
//       hidden: true,
//       meta: { activeMenu: devPath + '/agents' },
//       component: () => import('@/pages/AgentForm.vue')
//     },
//     {
//       path: 'terminals',
//       name: 'InteractionTerminal',
//       meta: { title: '智能体交互终端' },
//       component: () => import('@/pages/InteractionTerminal.vue')
//     },
//     {
//       path: 'terminals/new',
//       name: 'TerminalForm',
//       hidden: true,
//       meta: { activeMenu: devPath + '/terminals' },
//       component: () => import('@/pages/TerminalForm.vue')
//     },
//     {
//       path: 'terminals/:id/edit',
//       name: 'TerminalEdit',
//       hidden: true,
//       meta: { activeMenu: devPath + '/terminals' },
//       component: () => import('@/pages/TerminalForm.vue')
//     },
//     {
//       path: 'interaction-monitor',
//       name: 'InteractionMonitor',
//       meta: { title: '人机交互监控' },
//       component: () => import('@/pages/InteractionMonitor.vue')
//     },
//     {
//       path: 'models',
//       name: 'ModelWarehouse',
//       meta: { title: '模型仓' },
//       component: () => import('@/pages/ModelWarehouse.vue')
//     },
//     {
//       path: 'models/new',
//       name: 'ModelForm',
//       hidden: true,
//       meta: { activeMenu: devPath + '/models' },
//       component: () => import('@/pages/ModelForm.vue')
//     },
//     {
//       path: 'models/:id/edit',
//       name: 'ModelEdit',
//       hidden: true,
//       meta: { activeMenu: devPath + '/models' },
//       component: () => import('@/pages/ModelForm.vue')
//     },
//     {
//       path: 'tools',
//       name: 'ToolWarehouse',
//       meta: { title: '工具仓' },
//       component: () => import('@/pages/ToolWarehouse.vue')
//     },
//     {
//       path: 'tools/new',
//       name: 'ToolForm',
//       hidden: true,
//       meta: { activeMenu: devPath + '/tools' },
//       component: () => import('@/pages/ToolForm.vue')
//     },
//     {
//       path: 'capabilities',
//       name: 'CapabilityWarehouse',
//       meta: { title: '能力仓' },
//       component: () => import('@/pages/CapabilityWarehouse.vue')
//     },
//     {
//       path: 'capabilities/new',
//       name: 'WorkflowEditor',
//       hidden: true,
//       meta: { activeMenu: devPath + '/capabilities' },
//       component: () => import('@/pages/WorkflowEditor.vue')
//     },
//     {
//       path: 'capabilities/skills/new',
//       name: 'SkillForm',
//       hidden: true,
//       meta: { activeMenu: devPath + '/capabilities' },
//       component: () => import('@/pages/SkillForm.vue')
//     },
//     {
//       path: 'devices',
//       name: 'DeviceWarehouse',
//       meta: { title: '设备仓' },
//       component: () => import('@/pages/DeviceWarehouse.vue')
//     },
//     {
//       path: 'devices/new',
//       name: 'DeviceForm',
//       hidden: true,
//       meta: { activeMenu: devPath + '/devices' },
//       component: () => import('@/pages/DeviceForm.vue')
//     },
//     {
//       path: 'data/access',
//       name: 'DataAccess',
//       meta: { title: '多源接入' },
//       component: () => import('@/pages/DataAccess.vue')
//     },
//     {
//       path: 'data/access/new',
//       name: 'DataSourceForm',
//       hidden: true,
//       meta: { activeMenu: devPath + '/data/access' },
//       component: () => import('@/pages/DataSourceForm.vue')
//     },
//     { path: 'data/map', name: 'DataMap', meta: { title: '资产地图' }, component: () => import('@/pages/DataMap.vue') },
//     {
//       path: 'data/security',
//       name: 'DataSecurity',
//       meta: { title: '数据质量与安全' },
//       component: () => import('@/pages/DataSecurity.vue')
//     },
//     {
//       path: 'kb',
//       name: 'KnowledgeBaseList',
//       meta: { title: '文档知识', query: { type: 'local' } },
//       component: () => import('@/pages/KnowledgeBaseList.vue')
//     },
//     {
//       path: 'kb/new',
//       name: 'KnowledgeBaseForm',
//       hidden: true,
//       meta: { activeMenu: devPath + '/kb' },
//       component: () => import('@/pages/KnowledgeBaseForm.vue')
//     },
//     {
//       path: 'kb/search',
//       name: 'KnowledgeBaseSearch',
//       meta: { title: '知识库搜索' },
//       component: () => import('@/pages/KnowledgeBaseSearch.vue')
//     },
//     {
//       path: 'kb-web',
//       name: 'KnowledgeBaseListWeb',
//       meta: { title: '网页知识接入', query: { type: 'web' } },
//       component: () => import('@/pages/KnowledgeBaseList.vue')
//     },
//     {
//       path: 'kb/permissions',
//       name: 'KnowledgeBasePermissions',
//       meta: { title: '知识库权限管理' },
//       component: () => import('@/pages/KnowledgeBasePermissions.vue')
//     },
//     {
//       path: 'kb/faq',
//       name: 'KnowledgeBaseFaq',
//       meta: { title: 'FAQ知识' },
//       component: () => import('@/pages/KnowledgeBaseFaq.vue')
//     },
//     {
//       path: 'kb/:id',
//       name: 'KnowledgeLocalBaseDetail',
//       // hidden: true,
//       meta: { title: '知识库详情', activeMenu: devPath + '/kb', query: { type: 'local' } },
//       component: () => import('@/pages/KnowledgeBaseDetail.vue')
//     },
//     {
//       path: 'kb/:id/files',
//       name: 'KnowledgeBaseFiles',
//       hidden: true,
//       meta: { activeMenu: devPath + '/kb' },
//       component: () => import('@/pages/KnowledgeBaseDetail.vue')
//     },
//     {
//       path: 'kb-web/:id',
//       name: 'KnowledgeBaseDetail',
//       hidden: true,
//       meta: { activeMenu: devPath + '/kb-web' },
//       component: () => import('@/pages/KnowledgeBaseDetail.vue')
//     },
//     {
//       path: 'kb-web/:id/files',
//       name: 'KnowledgeBaseFiles',
//       hidden: true,
//       meta: { activeMenu: devPath + '/kb-web' },
//       component: () => import('@/pages/KnowledgeBaseDetail.vue')
//     },
//     { path: 'suites', name: 'SuiteList', component: () => import('@/pages/SuiteList.vue') },
//     // { path: 'settings', name: 'Settings', component: () => import('@/pages/Settings.vue') },
//     // { path: 'settings/basic', name: 'BasicSettings', component: () => import('@/pages/settings/BasicSettings.vue') },
//     {
//       path: 'settings/domains',
//       name: 'DomainSettings',
//       component: () => import('@/pages/settings/DomainSettings.vue')
//     },
//     // { path: 'settings/departments', name: 'DepartmentSettings', component: () => import('@/pages/settings/DepartmentSettings.vue') },
//     // { path: 'settings/positions', name: 'PositionSettings', component: () => import('@/pages/settings/PositionSettings.vue') },
//     // { path: 'settings/users', name: 'UserSettings', component: () => import('@/pages/settings/UserSettings.vue') },
//     // { path: 'settings/api-keys', name: 'ApiSettings', component: () => import('@/pages/settings/ApiSettings.vue') },
//     {
//       path: 'settings/audit',
//       name: 'AuditSettings',
//       meta: { title: '系统审计日志' },
//       component: () => import('@/pages/settings/AuditSettings.vue')
//     }
//   ]
// };
// 公共路由
export const constantRoutes = [
  // devRoute,
  {
    path: '/redirect',
    component: Layout,
    hidden: true,
    children: [
      {
        path: '/redirect/:path(.*)',
        component: () => import('@/views/redirect/index.vue')
      }
    ]
  },
  {
    path: '/login_old',
    component: () => import('@/views/login.vue'),
    hidden: true
  },
  {
    path: '/login',
    component: () => import('@/views/login/login.vue'),
    hidden: true
  },
  {
    path: '/register',
    component: () => import('@/views/register.vue'),
    hidden: true
  },
  {
    path: '/text2sql',
    component: () => import('@/views/text2sql/index.vue'),
    hidden: true,
    meta: { title: '智能对话' }
  },
  {
    path: '/:pathMatch(.*)*',
    component: () => import('@/views/error/404.vue'),
    hidden: true
  },
  {
    path: '/401',
    component: () => import('@/views/error/401.vue'),
    hidden: true
  },
  {
    path: '/index',
    redirect: '/',
    hidden: true
  },
  {
    path: '',
    component: () => import('@/views/Root.vue'),
    // component: () => import('@/pages/Dashboard.vue'),
    hidden: true
  },
  {
    path: '/lock',
    component: () => import('@/views/lock.vue'),
    hidden: true,
    meta: { title: '锁定屏幕' }
  },
  {
    path: '/user',
    component: Layout,
    hidden: true,
    redirect: 'noredirect',
    children: [
      {
        path: 'profile/:activeTab?',
        component: () => import('@/views/system/user/profile/index.vue'),
        name: 'Profile',
        meta: { title: '个人中心', icon: 'user' }
      }
    ]
  }
];

const agenticDynamicRoutes = [
  {
    path: '/agentic/brain',
    component: Layout,
    hidden: true,
    permissions: ['agentic:brain:add'],
    children: [
      {
        path: 'add',
        component: () => import('@/views/agentic/brain/AgentBrainAdd.vue'),
        name: 'AgentBrainNew',
        meta: { title: '新建智能体', activeMenu: '/agentic/brainlist' }
      }
    ]
  },
  {
    path: '/agentic/brain',
    component: Layout,
    hidden: true,
    permissions: ['agentic:brain:edit'],
    children: [
      {
        path: 'edit',
        component: () => import('@/views/agentic/brain/AgentBrainEdit.vue'),
        name: 'AgentBrainEdit',
        meta: { title: '智能体管理', activeMenu: '/agentic/brainlist' }
      }
    ]
  },
  {
    path: '/agentic/terminals',
    component: Layout,
    hidden: true,
    permissions: ['agentic:terminal:add'],
    children: [
      {
        path: 'add',
        component: () => import('@/views/agentic/terminal/TerminalAdd.vue'),
        name: 'AgenticTerminalAdd',
        meta: { title: '新建终端', activeMenu: '/agentic/terminalslist' }
      }
    ]
  },
  {
    path: '/agentic/terminals',
    component: Layout,
    hidden: true,
    permissions: ['agentic:terminal:edit'],
    children: [
      {
        path: 'edit',
        component: () => import('@/views/agentic/terminal/TerminalEdit.vue'),
        name: 'AgenticTerminalEdit',
        meta: { title: '编辑终端', activeMenu: '/agentic/terminalslist' }
      }
    ]
  }
];

const knowledgeDynamicRoutes = [
  {
    path: '/knowledge',
    component: Layout,
    hidden: true,
    permissions: ['knowledge:lib:add'],
    // path: 'kb/new',
    // name: 'KnowledgeBaseForm',
    // hidden: true,
    // meta: { activeMenu: devPath + '/kb-local' },
    // component: () => import('@/pages/KnowledgeBaseForm.vue')
    children: [
      {
        path: 'add',
        component: () => import('@/views/knowledge/knowledgeLib/Add.vue'),
        name: 'KnowledgeLibAdd',
        meta: { title: '新建知识库', activeMenu: '/knowledge/square' }
      }
    ]
  },
  {
    path: '/knowledge',
    component: Layout,
    hidden: true,
    permissions: ['knowledge:lib:edit'],
    children: [
      {
        path: 'edit',
        component: () => import('@/views/knowledge/knowledgeLib/Edit.vue'),
        name: 'KnowledgeLibEdit',
        meta: { title: '编辑知识库', activeMenu: '/knowledge/square' }
      }
    ]
  },
  {
    path: '/knowledge',
    component: Layout,
    hidden: true,
    permissions: ['knowledge:lib:query'],
    children: [
      {
        path: 'detail',
        component: () => import('@/views/knowledge/knowledgeLib/Detail.vue'),
        name: 'KnowledgeLibDetail',
        meta: { title: '知识库详情', activeMenu: '/knowledge/square' }
      }
    ]
  }
];

const resourcesDynamicRoutes = [
  {
    path: '/resources/models/add',
    component: Layout,
    hidden: true,
    permissions: ['resources:models:add'],
    children: [
      {
        path: '',
        component: () => import('@/views/resources/models_edit/index.vue'),
        name: 'ResourcesModelsAdd',
        meta: { title: '注册新模型', activeMenu: '/resources/models' }
      }
    ]
  },
  {
    path: '/resources/models/edit',
    component: Layout,
    hidden: true,
    permissions: ['resources:models:edit'],
    children: [
      {
        path: '',
        component: () => import('@/views/resources/models_edit/index.vue'),
        name: 'ResourcesModelsEdit',
        meta: { title: '编辑模型', activeMenu: '/resources/models' }
      }
    ]
  },
  {
    path: '/resources/tools/add',
    component: Layout,
    hidden: true,
    permissions: ['resources:tools:add'],
    children: [
      {
        path: '',
        component: () => import('@/views/resources/tools_edit/index.vue'),
        name: 'ResourcesToolsAdd',
        meta: { title: '注册新工具', activeMenu: '/resources/tools' }
      }
    ]
  },
  {
    path: '/resources/tools/edit',
    component: Layout,
    hidden: true,
    permissions: ['resources:tools:edit'],
    children: [
      {
        path: '',
        component: () => import('@/views/resources/tools_edit/index.vue'),
        name: 'ResourcesToolsEdit',
        meta: { title: '编辑工具', activeMenu: '/resources/tools' }
      }
    ]
  },
  {
    path: '/resources/skills/add',
    component: Layout,
    hidden: true,
    permissions: ['resources:skills:add'],
    children: [
      {
        path: '',
        component: () => import('@/views/resources/skills_edit/index.vue'),
        name: 'ResourcesSkillsAdd',
        meta: { title: '导入 Agent Skill', activeMenu: '/resources/skills' }
      }
    ]
  },
  {
    path: '/dataservices/datasources/add',
    component: Layout,
    hidden: true,
    permissions: ['dataservices:datasources:add'],
    children: [
      {
        path: '',
        component: () => import('@/views/dataservices/datasources_edit/index.vue'),
        name: 'DataservicesDatasourcesAdd',
        meta: { title: '绑定物理数据源', activeMenu: '/dataservices/datasources' }
      }
    ]
  }
];
const dataservicesDynamicRoutes = [
  {
    path: '/dataservices/datasources/edit',
    component: Layout,
    hidden: true,
    permissions: ['dataservices:datasources:edit'],
    children: [
      {
        path: '',
        component: () => import('@/views/dataservices/datasources_edit/index.vue'),
        name: 'DataservicesDatasourcesEdit',
        meta: { title: '编辑数据源', activeMenu: '/dataservices/datasources' }
      }
    ]
  }
];

// 动态路由，基于用户权限动态去加载
export const dynamicRoutes = [
  {
    path: '/system/user-auth',
    component: Layout,
    hidden: true,
    permissions: ['system:user:edit'],
    children: [
      {
        path: 'role/:userId(\\d+)',
        component: () => import('@/views/system/user/authRole.vue'),
        name: 'AuthRole',
        meta: { title: '分配角色', activeMenu: '/system/user' }
      }
    ]
  },
  {
    path: '/system/role-auth',
    component: Layout,
    hidden: true,
    permissions: ['system:role:edit'],
    children: [
      {
        path: 'user/:roleId(\\d+)',
        component: () => import('@/views/system/role/authUser.vue'),
        name: 'AuthUser',
        meta: { title: '分配用户', activeMenu: '/system/role' }
      }
    ]
  },
  {
    path: '/system/dict-data',
    component: Layout,
    hidden: true,
    permissions: ['system:dict:list'],
    children: [
      {
        path: 'index/:dictId(\\d+)',
        component: () => import('@/views/system/dict/data.vue'),
        name: 'Data',
        meta: { title: '字典数据', activeMenu: '/system/dict' }
      }
    ]
  },
  {
    path: '/monitor/job-log',
    component: Layout,
    hidden: true,
    permissions: ['monitor:job:list'],
    children: [
      {
        path: 'index/:jobId(\\d+)',
        component: () => import('@/views/monitor/job/log.vue'),
        name: 'JobLog',
        meta: { title: '调度日志', activeMenu: '/monitor/job' }
      }
    ]
  },
  {
    path: '/tool/gen-edit',
    component: Layout,
    hidden: true,
    permissions: ['tool:gen:edit'],
    children: [
      {
        path: 'index/:tableId(\\d+)',
        component: () => import('@/views/tool/gen/editTable.vue'),
        name: 'GenEdit',
        meta: { title: '修改生成配置', activeMenu: '/tool/gen' }
      }
    ]
  },
  ...agenticDynamicRoutes,
  ...knowledgeDynamicRoutes,
  ...resourcesDynamicRoutes,
  ...dataservicesDynamicRoutes
];

const router = createRouter({
  history: createWebHistory(),
  routes: constantRoutes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    return { top: 0 };
  }
});

export default router;
