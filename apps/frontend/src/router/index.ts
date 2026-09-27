import { createRouter, createWebHistory } from 'vue-router'
import type { RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { autoSetup, getCurrentUser, userInfoFromApi } from '@/api/auth'
import { getFeatureFlags, isHiddenMenuPath, weknoraKnowledgeBaseLocation } from '@/utils/weknoraFeatures'

/** Lite /桌面 WebView 硬刷新时可能只打开 `/`，用 session 记住上次页面以便恢复 */
const LITE_LAST_PATH_KEY = 'weknora_lite_last_path'
const AUTO_SETUP_FAILED_KEY = 'weknora_auto_setup_failed'

function shouldTryAutoSetup() {
  return localStorage.getItem(AUTO_SETUP_FAILED_KEY) !== 'true'
}

function markAutoSetupFailed() {
  localStorage.setItem(AUTO_SETUP_FAILED_KEY, 'true')
}

function isLiteEdition(authStore: ReturnType<typeof useAuthStore>) {
  return authStore.isLiteMode || localStorage.getItem('weknora_lite_mode') === 'true'
}

function isLiteSpaDefaultEntry(to: RouteLocationNormalized) {
  return (
    to.path === '/' ||
    to.path === '/platform' ||
    to.path === '/platform/knowledge-bases' ||
    to.path === '/platform/creatChat' ||
    to.name === 'knowledgeBaseList'
  )
}

function isSafeLiteRestoreTarget(path: string) {
  return path.startsWith('/platform/') && !path.startsWith('/platform/organizations')
}

function hasPendingOIDCCallback() {
  if (typeof window === 'undefined') return false
  const hash = window.location.hash || ''
  return hash.includes('oidc_result=') || hash.includes('oidc_error=')
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      redirect: "/platform/creatChat",
    },
    {
      path: "/login",
      name: "login",
      component: () => import("../views/auth/Login.vue"),
      meta: { requiresAuth: false, requiresInit: false }
    },
    // Embed chat is a separate entry (embed.html + embed-main.ts), not this SPA.
    {
      path: "/register",
      name: "registerByInvite",
      // Share-link landing page reuses the Login form: the same Vue
      // component renders both modes and detects ?token=xxx on mount
      // to switch into invite-register flow. Avoids a parallel page
      // that would duplicate the OIDC / language-switch / styling
      // surface for one extra field.
      component: () => import("../views/auth/Login.vue"),
      meta: { requiresAuth: false, requiresInit: false }
    },
    {
      path: "/onboarding/workspace",
      name: "workspaceOnboarding",
      component: () => import("../views/auth/WorkspaceOnboarding.vue"),
      meta: { requiresAuth: true, requiresInit: false, requiresTenant: false }
    },
    {
      path: "/join",
      name: "joinOrganization",
      // 重定向到组织列表页，并将 code 参数转换为 invite_code
      redirect: (to) => {
        const code = to.query.code as string
        return {
          path: '/platform/organizations',
          query: code ? { invite_code: code } : {}
        }
      },
      meta: { requiresInit: true, requiresAuth: true }
    },
    {
      path: "/knowledgeBase",
      name: "home",
      component: () => import("../views/knowledge/KnowledgeBase.vue"),
      meta: { requiresInit: true, requiresAuth: true }
    },
    {
      path: "/platform",
      name: "Platform",
      redirect: "/platform/creatChat",
      component: () => import("../views/platform/index.vue"),
      meta: { requiresInit: true, requiresAuth: true },
      children: [
        {
          path: "tenant",
          redirect: "/platform/settings"
        },
        {
          path: "settings",
          name: "settings",
          component: () => import("../views/settings/Settings.vue"),
          meta: { requiresInit: true, requiresAuth: true }
        },
        {
          path: "knowledge-bases",
          name: "knowledgeBaseList",
          component: () => import("../views/knowledge/KnowledgeBaseList.vue"),
          meta: { requiresInit: true, requiresAuth: true },
          beforeEnter: (to) => {
            const surface = String(to.query.surface || '')
            if (surface === 'skills' || surface === 'tools' || surface === 'mcp') {
              return { path: `/platform/${surface}` }
            }
          }
        },
        {
          path: "knowledge-bases/:kbId",
          name: "knowledgeBaseDetail",
          component: () => import("../views/knowledge/KnowledgeBase.vue"),
          meta: { requiresInit: true, requiresAuth: true }
        },
        {
          path: "knowledge-search",
          // 旧路径保留为重定向，打开全局命令面板（⌘K），带上可选的 q 参数
          redirect: (to) => {
            const q = to.query.q
            return {
              path: '/platform/knowledge-bases',
              query: typeof q === 'string' ? { cmdk: q } : { cmdk: '' },
            }
          },
        },
        {
          path: "agents",
          name: "agentList",
          component: () => import("../views/agent/AgentList.vue"),
          meta: { requiresInit: true, requiresAuth: true }
        },
        {
          path: "integrations",
          redirect: (to) => ({
            path: "/platform/settings",
            query: {
              ...to.query,
              section: "integrations",
            },
          }),
          meta: { requiresInit: true, requiresAuth: true }
        },
        {
          path: "chat-work",
          name: "chatWorkCreat",
          component: () => import("../views/chat-work/ChatWorkView.vue"),
          meta: { requiresInit: true, requiresAuth: true }
        },
        {
          path: "chat-work/:thread_id",
          name: "chatWork",
          component: () => import("../views/chat-work/ChatWorkView.vue"),
          meta: { requiresInit: true, requiresAuth: true }
        },
        {
          path: "work-chat",
          redirect: (to) => ({ path: "/platform/chat-work", query: to.query }),
          meta: { requiresInit: true, requiresAuth: true }
        },
        {
          path: "work-chat/:thread_id",
          redirect: (to) => ({
            path: `/platform/chat-work/${to.params.thread_id}`,
            query: to.query
          }),
          meta: { requiresInit: true, requiresAuth: true }
        },
        {
          path: "creatChat",
          name: "globalCreatChat",
          component: () => import("../views/creatChat/creatChat.vue"),
          meta: { requiresInit: true, requiresAuth: true }
        },
        {
          path: "knowledge-bases/:kbId/creatChat",
          name: "kbCreatChat",
          component: () => import("../views/creatChat/creatChat.vue"),
          meta: { requiresInit: true, requiresAuth: true }
        },
        {
          path: "chat/:chatid",
          name: "chat",
          component: () => import("../views/chat/index.vue"),
          meta: { requiresInit: true, requiresAuth: true }
        },
        {
          path: "dashboard",
          name: "dashboard",
          component: () => import("../views/dashboard/index.vue"),
          meta: { requiresInit: true, requiresAuth: true }
        },
        {
          path: "workspace",
          name: "workspace",
          component: () => import("../views/workspace/index.vue"),
          meta: { requiresInit: true, requiresAuth: true }
        },
        {
          path: "skills",
          name: "skills",
          component: () => import("../views/skills/index.vue"),
          meta: { requiresInit: true, requiresAuth: true }
        },
        {
          path: "skills/:slug",
          name: "skillDetail",
          component: () => import("../views/skills/detail.vue"),
          meta: { requiresInit: true, requiresAuth: true }
        },
        {
          path: "tools",
          name: "tools",
          component: () => import("../views/skills/index.vue"),
          meta: { requiresInit: true, requiresAuth: true }
        },
        {
          path: "mcp",
          name: "mcp",
          component: () => import("../views/skills/index.vue"),
          meta: { requiresInit: true, requiresAuth: true }
        },
        {
          path: "mcp/:slug",
          name: "mcpDetail",
          component: () => import("../views/mcp/detail.vue"),
          meta: { requiresInit: true, requiresAuth: true }
        },
        {
          path: "organizations",
          name: "organizationList",
          component: () => import("../views/organization/OrganizationList.vue"),
          meta: { requiresInit: true, requiresAuth: true }
        },
        // Compatibility redirects for /platform/system/* URLs. System
        // administration surfaces live as dedicated sections inside the
        // standard Settings modal; keep stable URLs for bookmarks and
        // external links.
        {
          path: "system",
          redirect: { path: "/platform/settings", query: { section: "system-global" } },
          meta: { requiresInit: true, requiresAuth: true, requiresSystemAdmin: true },
        },
        {
          path: "system/settings",
          name: "systemSettings",
          redirect: { path: "/platform/settings", query: { section: "system-global" } },
          meta: { requiresInit: true, requiresAuth: true, requiresSystemAdmin: true },
        },
        {
          path: "system/admins",
          name: "systemAdmins",
          redirect: { path: "/platform/settings", query: { section: "system-global" } },
          meta: { requiresInit: true, requiresAuth: true, requiresSystemAdmin: true },
        },
        {
          path: "system/queues",
          name: "systemQueues",
          redirect: { path: "/platform/settings", query: { section: "runtime-queues" } },
          meta: { requiresInit: true, requiresAuth: true, requiresSystemAdmin: true },
        },
        // Phase 1: new product pages mount under views/. /platform/harness/*
        // remains only as compatibility redirects; the harness island is gone.
        {
          path: "harness",
          redirect: () =>
            isHiddenMenuPath('harness/workspace') || isHiddenMenuPath('workspace')
              ? '/platform/creatChat'
              : '/platform/workspace',
          meta: { requiresInit: true, requiresAuth: true },
        },
        {
          path: "harness/chat",
          redirect: (to) => ({ path: "/platform/chat-work", query: to.query }),
          meta: { requiresInit: true, requiresAuth: true },
        },
        {
          path: "harness/chat/:thread_id",
          redirect: (to) => ({
            path: `/platform/chat-work/${to.params.thread_id}`,
            query: to.query,
          }),
          meta: { requiresInit: true, requiresAuth: true },
        },
        {
          path: "harness/agents",
          name: "harnessAgents",
          redirect: (to) => ({
            path: "/platform/agents",
            query: { surface: "work", ...(to.query.tab ? { tab: String(to.query.tab) } : {}) },
          }),
          meta: { requiresInit: true, requiresAuth: true },
        },
        {
          path: "harness/workspace",
          name: "harnessWorkspace",
          redirect: { path: "/platform/workspace" },
          meta: { requiresInit: true, requiresAuth: true },
        },
        {
          path: "harness/extensions",
          name: "harnessExtensions",
          redirect: (to) => {
            const tab = String(to.query.tab || 'skills')
            if (tab === 'tools') return { path: '/platform/tools' }
            if (tab === 'mcp') return { path: '/platform/mcp' }
            if (tab === 'knowledge') return { path: '/platform/knowledge-bases' }
            if (tab === 'platform') return { path: '/platform/knowledge-bases' }
            return { path: '/platform/skills' }
          },
          meta: { requiresInit: true, requiresAuth: true },
        },
        {
          path: "harness/extensions/mcp/:slug",
          name: "harnessExtensionMcp",
          redirect: (to) => ({ name: 'mcpDetail', params: { slug: to.params.slug } }),
          meta: { requiresInit: true, requiresAuth: true },
        },
        {
          path: "harness/extensions/skill/:slug",
          name: "harnessExtensionSkill",
          redirect: (to) => ({ name: 'skillDetail', params: { slug: to.params.slug } }),
          meta: { requiresInit: true, requiresAuth: true },
        },
        {
          path: "harness/dashboard",
          name: "harnessDashboard",
          redirect: { path: "/platform/dashboard" },
          meta: { requiresInit: true, requiresAuth: true },
        },
      ],
    },
    // Dev-only markdown rendering test page
    ...(import.meta.env.DEV ? [{
      path: '/platform/dev/markdown',
      name: 'markdownTest',
      component: () => import('../views/dev/MarkdownTestPage.vue'),
      meta: { requiresAuth: false, requiresInit: false }
    }] : []),
  ],
});

// 持久化 auto-setup / login 返回的认证信息到 store
function persistLoginResponse(authStore: ReturnType<typeof useAuthStore>, response: any) {
  if (response.user && response.tenant && response.token) {
    authStore.setUser(userInfoFromApi(response.user, response.tenant.id))
    authStore.setToken(response.token)
    if (response.refresh_token) {
      authStore.setRefreshToken(response.refresh_token)
    }
    authStore.setTenant({
      id: String(response.tenant.id) || '',
      name: response.tenant.name || '',
      owner_id: response.user.id || '',
      created_at: response.tenant.created_at || new Date().toISOString(),
      updated_at: response.tenant.updated_at || new Date().toISOString()
    })
  }
}

async function hydrateSessionFromToken(authStore: ReturnType<typeof useAuthStore>) {
  const token = localStorage.getItem('weknora_token')
  if (!token) return false

  if (!authStore.token) {
    authStore.setToken(token)
  }

  const storedRefreshToken = localStorage.getItem('weknora_refresh_token')
  if (storedRefreshToken && !authStore.refreshToken) {
    authStore.setRefreshToken(storedRefreshToken)
  }

  try {
    const response = await getCurrentUser()
    const user = response.data?.user
    if (!response.success || !user) {
      return false
    }

    authStore.setUser(userInfoFromApi(user, response.data?.tenant?.id))

    const tenant = response.data?.tenant
    if (tenant) {
      authStore.setTenant({
        id: String(tenant.id) || '',
        name: tenant.name || '',
        owner_id: tenant.owner_id || user.id || '',
        description: tenant.description,
        status: tenant.status,
        business: tenant.business,
        storage_quota: tenant.storage_quota,
        storage_used: tenant.storage_used,
        created_at: tenant.created_at || new Date().toISOString(),
        updated_at: tenant.updated_at || new Date().toISOString(),
      })
    } else {
      authStore.setTenant(null)
    }

    // Refresh memberships on every page load — same reason as
    // App.vue's syncOIDCUserContext: without this the auth store
    // would only ever see the snapshot from the original /auth/login
    // call, so role changes (and tenant-switch role lookups) would
    // be silently stale until the user logged out and back in.
    const memberships = response.data?.memberships
    if (Array.isArray(memberships)) {
      authStore.setMemberships(memberships)
    }

    const canCreateTenant = response.data?.capabilities?.can_create_tenant
    if (typeof canCreateTenant === 'boolean') {
      authStore.setCanCreateTenant(canCreateTenant)
    }

    return true
  } catch {
    return false
  }
}

let autoSetupAttempted = false
let liteDeepLinkRestoreDone = false

// 路由守卫：检查认证状态和系统初始化状态
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // OIDC 回跳登录结果依赖 App.vue 在挂载后消费 URL hash。
  // 如果这里先按“未登录”拦截到 /login，会导致回调结果没有机会落盘。
  if (hasPendingOIDCCallback()) {
    next()
    return
  }

  // Lite：硬刷新后若落在默认首页，恢复本次会话中最后访问的 /platform 子路径
  if (!liteDeepLinkRestoreDone) {
    liteDeepLinkRestoreDone = true
    if (isLiteEdition(authStore)) {
      const saved = sessionStorage.getItem(LITE_LAST_PATH_KEY)
      if (saved && isSafeLiteRestoreTarget(saved) && isLiteSpaDefaultEntry(to)) {
        if (saved !== to.fullPath) {
          next(saved)
          return
        }
      }
    }
  }

  // Tenantless onboarding still requires a valid user token even though it
  // deliberately skips the normal tenant/system-initialization gates.
  if (to.path === '/onboarding/workspace') {
    if (!authStore.isLoggedIn) {
      const restored = await hydrateSessionFromToken(authStore)
      if (!restored) {
        next('/login')
        return
      }
    }
    if (authStore.hasValidTenant) {
      next('/platform/creatChat')
    } else {
      next()
    }
    return
  }

  // 如果访问的是登录页面或初始化页面，直接放行
  if (to.meta.requiresAuth === false || to.meta.requiresInit === false) {
    // 如果已登录用户访问登录页面，重定向到新建对话页
    if (to.path === '/login' && authStore.isLoggedIn) {
      next(authStore.hasValidTenant ? '/platform/creatChat' : '/onboarding/workspace')
      return
    }
    next()
    return
  }

  // 检查用户认证状态
  if (to.meta.requiresAuth !== false) {
    if (!authStore.isLoggedIn) {
      const restored = await hydrateSessionFromToken(authStore)
      if (restored) {
        next(
          !authStore.hasValidTenant && to.meta.requiresTenant !== false
            ? '/onboarding/workspace'
            : to.fullPath,
        )
        return
      }

      if (!autoSetupAttempted && shouldTryAutoSetup()) {
        autoSetupAttempted = true
        try {
          const response = await autoSetup()
          if (response.success) {
            persistLoginResponse(authStore, response)
            authStore.setLiteMode(true)
            next(to.fullPath)
            return
          } else {
            markAutoSetupFailed()
          }
        } catch {
          markAutoSetupFailed()
        }
      }
      next('/login')
      return
    }
  }

  if (to.meta.requiresTenant !== false && !authStore.hasValidTenant) {
    next('/onboarding/workspace')
    return
  }

  // SystemAdmin gate — checked AFTER auth so a non-admin who's logged
  // out gets redirected to /login first (consistent with how the rest
  // of the auth flow works), and only an authenticated non-admin sees
  // the bounce. This is UI-only; the server enforces the real check.
  if (to.meta.requiresSystemAdmin === true) {
    if (!authStore.isSystemAdmin) {
      next('/platform/knowledge-bases')
      return
    }
  }

  // 二开隐藏「共享空间」时，拦截侧栏外的深链 / 邀请落地 / 命令面板残留。
  if (getFeatureFlags().hideOrganizations) {
    const path = to.path
    if (
      path === '/platform/organizations' ||
      path.startsWith('/platform/organizations/') ||
      path === '/join'
    ) {
      next('/platform/knowledge-bases')
      return
    }
  }

  if (
    (isHiddenMenuPath('harness/workspace') || isHiddenMenuPath('workspace')) &&
    (to.path.startsWith('/platform/harness/workspace') || to.path === '/platform/workspace')
  ) {
    next('/platform/creatChat')
    return
  }
  if (
    (isHiddenMenuPath('harness/dashboard') || isHiddenMenuPath('dashboard')) &&
    (to.path.startsWith('/platform/harness/dashboard') || to.path === '/platform/dashboard')
  ) {
    next('/platform/creatChat')
    return
  }
  if (
    (to.path === '/platform/dashboard' || to.path.startsWith('/platform/harness/dashboard')) &&
    !authStore.hasRole('admin') &&
    !authStore.isSystemAdmin
  ) {
    next('/platform/creatChat')
    return
  }
  if (to.path === '/platform/knowledge-bases' && String(to.query.surface || '') === 'runtime') {
    const query = { ...to.query }
    delete query.surface
    next({ path: '/platform/knowledge-bases', query, replace: true })
    return
  }
  if (to.path.startsWith('/platform/harness/extensions/knowledgebase/')) {
    const kbId = String(to.params.kbId || to.path.split('/').pop() || '')
    next({ ...weknoraKnowledgeBaseLocation(kbId), replace: true })
    return
  }

  next()
})

router.afterEach((to) => {
  if (!isLiteEdition(useAuthStore())) return
  if (to.path === '/login') return
  if (!to.path.startsWith('/platform')) return
  sessionStorage.setItem(LITE_LAST_PATH_KEY, to.fullPath)
})

export default router
