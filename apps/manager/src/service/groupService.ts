import {
  listRole,
} from "@/api/knowledge/knowledgeRole.js";
import { BusinessRoleEntity, TableDataInfo } from "@/types"

export interface GroupEntity {
  id: string
  groupName: string
  roleName?: string
  remark?: string
  checked: boolean
}

const toThinItem = (item: BusinessRoleEntity): GroupEntity => {
  return {
    id: item.id+'',
    groupName: item.roleName,
    roleName: item.roleName,
    remark: item.remark,
    checked: false,
  }
}

const defaultOptions = {
  autoLoad: true,
  idKey: 'id',
};
export default function GroupService<T = GroupEntity>(options: any = defaultOptions) {
  if (!options) options = defaultOptions
  const toThin: (item: BusinessRoleEntity) => T = options.toThin || toThinItem
  const idKey: keyof T = options.idKey || defaultOptions.idKey
  const autoLoad = options.autoLoad
  const listData = ref<T[]>([])
  const dataMap = ref<Record<string, T>>({})
  const init = () => {
    listData.value = []
    dataMap.value = {}
    const params = {
      pageSize: 999,
      pageNum: 1,
    };
    return listRole({}, params).then((res: TableDataInfo<BusinessRoleEntity>) => {
      const rootItems: T[] = [];
      const _dataMap: Record<string, T> = {};
      (res.rows || []).forEach((item: BusinessRoleEntity)=>{
        if(item.status != "0"){
          return;
        }
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
    get listData(): T[] {
      return listData.value
    },
    get dataMap(): Record<string, T> {
      return dataMap.value
    },
    load: init,
  }
}
