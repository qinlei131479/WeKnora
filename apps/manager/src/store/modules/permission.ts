import auth from '@/plugins/auth'
import router, { constantRoutes, dynamicRoutes } from '@/router'
import { getRouters } from '@/api/menu'
import Layout from '@/layout/index.vue'
import ParentView from '@/components/ParentView/index.vue'
import InnerLink from '@/layout/components/InnerLink/index.vue'

// 匹配views里面所有的.vue文件
const modules = import.meta.glob('./../../views/**/*.vue')

const usePermissionStore = defineStore(
  'permission',
  {
    state: () => ({
      routes: [] as any[],
      addRoutes: [] as any[],
      defaultRoutes: [] as any[],
      topbarRouters: [] as any[],
      sidebarRouters: [] as any[]
    }),
    actions: {
      setRoutes(routes: any[]) {
        this.addRoutes = routes
        this.routes = constantRoutes.concat(routes)
      },
      setDefaultRoutes(routes: any[]) {
        this.defaultRoutes = constantRoutes.concat(routes)
      },
      setTopbarRoutes(routes: any[]) {
        this.topbarRouters = routes
      },
      setSidebarRouters(routes: any[]) {
        this.sidebarRouters = routes
      },
      generateRoutes(roles?: any[]): Promise<any[]> {
        return new Promise(resolve => {
          // 向后端请求路由数据，仅保留系统管理与租户管理页面
          getRouters().then(res => {
            const keptMenus = filterKeptAdminMenus((res.data || []) as any[])
            const sdata = JSON.parse(JSON.stringify(keptMenus))
            const rdata = JSON.parse(JSON.stringify(keptMenus))
            const defaultData = JSON.parse(JSON.stringify(keptMenus))
            const sidebarRoutes = filterAsyncRouter(sdata)
            const rewriteRoutes = filterAsyncRouter(rdata, false, true)
            const defaultRoutes = filterAsyncRouter(defaultData)
            const asyncRoutes = filterDynamicRoutes(dynamicRoutes)
            asyncRoutes.forEach(route => { router.addRoute(route) })
            this.setRoutes(rewriteRoutes)
            this.setSidebarRouters(constantRoutes.concat(sidebarRoutes))
            this.setDefaultRoutes(sidebarRoutes)
            this.setTopbarRoutes(defaultRoutes)
            resolve(rewriteRoutes)
          })
        })
      }
    }
  })

const KEPT_VIEW_PREFIXES = ['system/', 'platformManager/tenantManager', 'model/', 'agent/', 'data/', 'space/', 'knowledgeBase/']

function isDirectoryComponent(component: unknown): boolean {
  return component === 'Layout' || component === 'ParentView' || component === 'InnerLink'
}

function isKeptAdminView(route: any): boolean {
  const component = typeof route?.component === 'string' ? route.component : ''
  if (!component || isDirectoryComponent(component)) {
    return false
  }
  return KEPT_VIEW_PREFIXES.some(prefix => component.startsWith(prefix))
}

function joinRoutePath(parentPath = '', childPath = ''): string {
  if (!childPath) {
    return parentPath
  }
  if (childPath.startsWith('/')) {
    return childPath
  }
  const normalizedParent = parentPath.endsWith('/') ? parentPath.slice(0, -1) : parentPath
  return `${normalizedParent}/${childPath}`
}

// 后端菜单仍可能返回已下线业务模块，前端只放行系统管理与租户管理
function filterKeptAdminMenus(routes: any[] = []): any[] {
  const result: any[] = []
  routes.forEach(route => {
    const children = filterKeptAdminMenus(route.children || [])
    if (!isKeptAdminView(route) && children.length === 0) {
      return
    }
    const next = { ...route }
    if (children.length > 0) {
      next.children = children
      if (typeof next.redirect === 'string' && next.redirect.toLowerCase() !== 'noredirect') {
        next.redirect = joinRoutePath(next.path, children[0].path)
      }
    } else {
      delete next.children
    }
    result.push(next)
  })
  return result
}

// 遍历后台传来的路由字符串，转换为组件对象
function filterAsyncRouter(asyncRouterMap: any[], lastRouter = false, type = false) {
  return asyncRouterMap.filter(route => {
    if (type && route.children) {
      route.children = filterChildren(route.children)
    }
    if (route.component) {
      // Layout ParentView 组件特殊处理
      if (route.component === 'Layout') {
        route.component = Layout
      } else if (route.component === 'ParentView') {
        route.component = ParentView
      } else if (route.component === 'InnerLink') {
        route.component = InnerLink
      } else {
        route.component = loadView(route.component)
      }
    }
    if (route.children != null && route.children && route.children.length) {
      route.children = filterAsyncRouter(route.children, route, type)
    } else {
      delete route['children']
      delete route['redirect']
    }
    return true
  })
}

function filterChildren(childrenMap: any[], lastRouter: any = false) {
  var children: any[] = []
  childrenMap.forEach(el => {
    el.path = lastRouter ? lastRouter.path + '/' + el.path : el.path
    if (el.children && el.children.length && el.component === 'ParentView') {
      children = children.concat(filterChildren(el.children, el))
    } else {
      children.push(el)
    }
  })
  return children
}

// 动态路由遍历，验证是否具备权限
export function filterDynamicRoutes(routes: any[]): any[] {
  const res: any[] = []
  routes.forEach(route => {
    if (route.permissions) {
      if (auth.hasPermiOr(route.permissions)) {
        res.push(route)
      }
    } else if (route.roles) {
      if (auth.hasRoleOr(route.roles)) {
        res.push(route)
      }
    }
  })
  return res
}

export const loadView = (view: string): any => {
  let res
  for (const path in modules) {
    const dir = path.split('views/')[1].split('.vue')[0]
    if (dir === view) {
      res = () => modules[path]()
    }
  }
  return res
}

export default usePermissionStore
