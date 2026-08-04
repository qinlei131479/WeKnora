import { listUser } from "@/api/system/user"
import { SysUser, UserQueryParams } from "@/types"

export interface UserEntity {
  checked: boolean
  userId?: number
  userName?: string
  remark?: string
}

export const toThinItem = (item: SysUser): UserEntity => {
  return {
    userId: item.userId,
    userName: item.userName,
    remark: item.remark,
    checked: false,
  }
}

const defaultOptions = {
  autoLoad: true,
  idKey: 'userId',
};
export default function UserService<T=UserEntity>(options: any = defaultOptions) {
  if (!options) options = defaultOptions
  const toThin: (item: SysUser) => T = options.toThin || toThinItem
  const idKey: keyof T = options.idKey || defaultOptions.idKey
  const autoLoad = options.autoLoad
  const listData = ref<T[]>([])
  const dataMap = ref<Record<string, T>>({})
  const init = () => {
    listData.value = []
    dataMap.value = {}
    const params: UserQueryParams = {
      pageSize: 999,
      pageNum: 1,
      status: "0"
    };
    return listUser(params).then(res => {
      const rootItems: T[] = [];
      const _dataMap: Record<string, T> = {};
      (res.rows || []).forEach((item: SysUser)=>{
        const thinItem: any = toThin(item)
        rootItems.push(thinItem)
        _dataMap[thinItem[idKey]] = thinItem
      });
      dataMap.value = _dataMap
      listData.value = rootItems
    })
  }
  if (autoLoad) {
    init()
  }
  return {
    get listData() : T[]{
      return listData.value
    },
    get dataMap() : Record<string, T>{
      return dataMap.value
    },
    load: init,
  }
}
