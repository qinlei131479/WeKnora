export function getShareConfigLabel(shareConfig, t) {
  const translate = typeof t === 'function' ? t : (key) => key
  const config = shareConfig || {}
  const readScope = config.version === 2 ? config.read_scope : config
  const manageScope = config.manage_scope
  if (config.version === 2 && !config.read_scope && !manageScope) {
    return translate('ext.share.ownerOnly')
  }
  const scopeLabel = (scope) => {
    if (!scope) return translate('ext.share.none')
    if (scope.access_level === 'global') return translate('ext.share.global')
    if (scope.access_level === 'department') {
      return translate('ext.share.department', {
        count: scope.department_ids?.length || 0
      })
    }
    return translate('ext.share.user', {
      count: scope.user_uids?.length || 0
    })
  }
  return manageScope
    ? translate('ext.share.readManage', {
        read: scopeLabel(readScope),
        manage: scopeLabel(manageScope)
      })
    : translate('ext.share.readonly', { scope: scopeLabel(readScope) })
}
