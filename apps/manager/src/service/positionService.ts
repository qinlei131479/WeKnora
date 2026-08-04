import { listPost } from "@/api/system/post"
import { SysPost } from "@/types"

export interface PositionEntity {
  checked: boolean
  postId?: number
  postName?: string
  remark?: string
}

export const toThinItem = (item: SysPost): PositionEntity => {
  return {
    postId: item.postId,
    postName: item.postName,
    remark: item.remark,
    checked: false,
  }
}

const defaultOptions = {
  autoLoad: true,
  idKey: 'postId',
};
export default function PositionService<T = PositionEntity>(options: any = defaultOptions) {
  const toThin: (item: SysPost) => T = options.toThin || toThinItem
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
      status: "0"
    };
    return listPost(params).then(res => {
      const rootItems: T[] = [];
      const _dataMap: Record<string, T> = {};
      (res.rows || []).forEach((item: SysPost)=>{
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
