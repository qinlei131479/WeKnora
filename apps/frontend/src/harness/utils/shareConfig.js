export function getShareConfigLabel(shareConfig, t) {
  const translate = typeof t === 'function' ? t : (key) => key
  const config = shareConfig || {}
  const readScope = config.version === 2 ? config.read_scope : config
  const manageScope = config.manage_scope
  if (config.version === 2 && !config.read_scope && !manageScope) {
    return translate('knowledgeList.extensions.share.ownerOnly')
  }
  const scopeLabel = (scope) => {
    if (!scope) return translate('knowledgeList.extensions.share.none')
    if (scope.access_level === 'global') return translate('knowledgeList.extensions.share.global')
    if (scope.access_level === 'department') {
      return translate('knowledgeList.extensions.share.department', {
        count: scope.department_ids?.length || 0
      })
    }
    return translate('knowledgeList.extensions.share.user', {
      count: scope.user_uids?.length || 0
    })
  }
  return manageScope
    ? translate('knowledgeList.extensions.share.readManage', {
        read: scopeLabel(readScope),
        manage: scopeLabel(manageScope)
      })
    : translate('knowledgeList.extensions.share.readonly', { scope: scopeLabel(readScope) })
}
