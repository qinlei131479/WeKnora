import { t } from '@/i18n';
const errorCode: Record<string, string> = {
  get '401'() { return t('common.errorCode.authenticationFailedUnableToAccessSystemResources', '认证失败，无法访问系统资源'); },
  get '403'() { return t('common.errorCode.youDoNotHavePermissionToPerformThisAction', '当前操作没有权限'); },
  get '404'() { return t('common.errorCode.theRequestedResourceDoesNotExist', '访问资源不存在'); },
  get 'default'() { return t('common.errorCode.anUnknownSystemErrorOccurredContactYourAdministrator', '系统未知错误，请反馈给管理员'); }
}

export default errorCode
