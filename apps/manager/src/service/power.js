import useUserStore from '@/store/modules/user'
// 权限验证
export default function power(powerValue) {
  if (!powerValue) return false;
  const all_permission = "*:*:*"
  const permissions = useUserStore().permissions;
  if (!permissions || !permissions.length) return false;
  const permissionFlag = typeof powerValue === 'string' ? (powerValue || '').split(',') : powerValue;
  const flag = permissions.some((permission: string) => {
    return all_permission === permission || permissionFlag.includes(permission)
  })
  return flag;
}
