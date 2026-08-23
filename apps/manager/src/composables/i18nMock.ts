const mockDatas = {
  'form.button.reset': '重置',
  'form.button.edit': '编辑',
  'form.button.delete': '删除',
  'form.button.enable': '启用',
  'form.button.disable': '禁用',
  'tenantMember.role.owner': '所有者',
  'tenantMember.role.admin': '管理员',
  'tenantMember.role.contributor': '编辑',
  'tenantMember.role.viewer': '查看',
  tenant: {
    statusActive: '活跃',
    statusInactive: '未激活',
  }
}
const flatDatas: Record<string, string> = {};
const flat = (obj: Record<string, any>, prefix: string = '') => {
  prefix = prefix ? `${prefix}.` : '';
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      if (typeof value === 'object' && value !== null) {
        flat(value, `${prefix}${key}`);
      } else {
        flatDatas[`${prefix}${key}`] = value;
      }
    }
  }
}
flat(mockDatas);
console.log('flatDatas', flatDatas)
export function useI18n() {
  return {
    t: (key: string, params?: Record<string, string> | string, defaultValue?: string) => {
      let label = flatDatas[key];
      if (label) {
        if (!params) {
          return label;
        }
        if (typeof params === 'object') {
          Object.keys(params).forEach((p) => {
            label = label.replace(new RegExp(`\\${p}`, 'g'), params[p]);
          })
        }
        return label;
      }
      if (typeof params === 'object') {
        return defaultValue || key;
      }
      return params || key;
    }
  };
}
