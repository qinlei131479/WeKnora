// Tenant-switch navigation helper.
//
// Switching the active tenant always lands the user on the platform's KB
// list. 之前是「在当前路径 reload」+ 个别敏感路径回退到 KB 列表，但即便不带
// resource id 的页面（设置、Agent 列表等）reload 后也常常因为新空间下没有
// 对应数据出现空状态，体验跟跳到固定首页其实差不多——干脆统一跳到 KB 列表，
// 用一次 full navigation 把所有 store / SSE / 请求都重置一遍。

import { switchTenant, updateMyPreferences, userInfoFromApi } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'
import { MessagePlugin } from 'tdesign-vue-next'

const SAFE_FALLBACK_PATH = '/platform/knowledge-bases'

/**
 * Return the URL to navigate to after a tenant switch. 目前始终返回 KB 列表
 * 作为登录页，保留函数签名是为了未来需要按路由做特殊处理时留个口子。
 */
export function tenantSwitchTargetPath(_currentPath: string): string {
  return SAFE_FALLBACK_PATH
}

/**
 * Perform the post-switch navigation. 统一跳到 KB 列表。
 */
export function navigateAfterTenantSwitch(): void {
  window.location.href = tenantSwitchTargetPath(window.location.pathname)
}

// 切换成功后的 toast 跨 hard reload 传递：调用方在 reload 前把信息塞进
// sessionStorage，App.vue 启动时 consume 一次再弹出。直接在 reload 前调
// NotifyPlugin 会被刷掉，根本来不及看清。
const PENDING_TOAST_KEY = 'weknora_pending_tenant_switch_toast'

export interface PendingTenantSwitchToast {
  name: string
  /** Human-readable role label, e.g. "所有者" / "Owner". Drives the role chip text. */
  role?: string
  /** Raw role enum, e.g. "owner". Drives the role chip color + icon. */
  roleEnum?: string
}

export function stashTenantSwitchToast(payload: PendingTenantSwitchToast): void {
  try {
    sessionStorage.setItem(PENDING_TOAST_KEY, JSON.stringify(payload))
  } catch {
    // sessionStorage 写失败（隐私模式等）就静默放弃，toast 是锦上添花
  }
}

export function consumePendingTenantSwitchToast(): PendingTenantSwitchToast | null {
  try {
    const raw = sessionStorage.getItem(PENDING_TOAST_KEY)
    if (!raw) return null
    sessionStorage.removeItem(PENDING_TOAST_KEY)
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed.name === 'string') {
      return {
        name: parsed.name,
        role: typeof parsed.role === 'string' ? parsed.role : undefined,
        roleEnum: typeof parsed.roleEnum === 'string' ? parsed.roleEnum : undefined,
      }
    }
    return null
  } catch {
    return null
  }
}

/**
 * Persist the user's "last active tenant" preference server-side so a
 * fresh login (new device, new refresh token, cleared browser) drops
 * them back into this workspace instead of always bouncing to their
 * home tenant.
 *
 * Conventions:
 *   - Pass the target tenant id when switching to a peer tenant.
 *   - Pass `null` (which sends `0`) when switching back to the home
 *     tenant — that clears the preference and reverts the user to the
 *     "always start at home" default.
 *
 * Fire-and-forget: callers usually trigger a full-page reload right
 * after; this returns the in-flight promise so callers can race it
 * against a small budget if they want best-effort completion before
 * navigation. Failures are logged but never thrown — losing one
 * persist is recoverable on the next switch.
 */
export function persistLastActiveTenantPreference(
  tenantId: number | null,
): Promise<void> {
  const payload = { last_active_tenant_id: tenantId == null ? 0 : tenantId }
  return updateMyPreferences(payload)
    .then((res) => {
      if (!res.success) {
        console.warn('persistLastActiveTenantPreference: server rejected update', res.message)
      }
    })
    .catch((err) => {
      console.warn('persistLastActiveTenantPreference: network/serialization error', err)
    })
}

const LEGACY_HARNESS_TOKEN_KEY = 'harness_user_token'

/**
 * 切空间必须走 /auth/switch-tenant 换签：Harness 只认 JWT 里的 tenant_id。
 * 失败时不 reload，避免带着旧 token 进新空间。
 */
export async function switchWorkspaceAndReload(params: {
  tenantId: number
  tenantName: string
  role?: string
  roleEnum?: string
  isHome?: boolean
}): Promise<boolean> {
  const authStore = useAuthStore()
  const result = await switchTenant({
    tenant_id: params.tenantId,
    refresh_token: authStore.refreshToken || undefined,
  })
  if (!result.success || !result.token) {
    MessagePlugin.error(result.message || '切换空间失败')
    return false
  }

  const activeTenant = result.active_tenant || result.tenant
  // user.tenant_id 必须保持 HOME；激活空间走 setTenant / setSelectedTenant。
  const homeTenantIdRaw = result.user?.tenant_id ?? activeTenant?.id ?? ''
  if (result.user) {
    authStore.setUser(userInfoFromApi(result.user, homeTenantIdRaw))
  }
  authStore.setToken(result.token)
  if (result.refresh_token) {
    authStore.setRefreshToken(result.refresh_token)
  }
  if (activeTenant) {
    authStore.setTenant({
      id: String(activeTenant.id) || '',
      name: activeTenant.name || '',
      owner_id: result.user?.id || '',
      created_at: activeTenant.created_at || new Date().toISOString(),
      updated_at: activeTenant.updated_at || new Date().toISOString(),
    })
  }
  if (Array.isArray(result.memberships)) {
    authStore.setMemberships(result.memberships)
  }
  try {
    localStorage.removeItem(LEGACY_HARNESS_TOKEN_KEY)
  } catch {
    // ignore
  }
  authStore.setSelectedTenant(params.tenantId, params.tenantName)
  stashTenantSwitchToast({
    name: params.tenantName,
    role: params.role,
    roleEnum: params.roleEnum,
  })
  persistLastActiveTenantPreference(params.isHome ? null : params.tenantId)
  navigateAfterTenantSwitch()
  return true
}
