import { useI18n } from 'vue-i18n'
// import { useI18n } from '@/composables/i18nMock'
export function getStatusTheme(status: string | undefined): string {
  switch (status) {
    case 'active':
      return 'success'
    case 'inactive':
      return 'warning'
    case 'suspended':
      return 'danger'
    default:
      return 'default'
  }
}

export function getStatusText(status: string | undefined): string {
  const { t } = useI18n()
  switch (status) {
    case 'active':
      return t('tenant.statusActive', '活跃')
    case 'inactive':
      return t('tenant.statusInactive', '未激活')
    case 'suspended':
      return t('tenant.statusSuspended', '已暂停')
    default:
      return t('tenant.statusUnknown', '未知')
  }
}