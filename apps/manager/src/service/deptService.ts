import { listDept } from "@/api/system/dept"
import { SysDept } from "@/types"

export interface TreeDept extends SysDept {
  checked: boolean
  children?: TreeDept[]
}
export const deptTreeProps = {
  // key: 'id',
  value: 'deptId',
  label: 'deptName',
  children: 'children',
}

const toThinItem = (item: SysDept): TreeDept => {
  return {
    deptId: item.deptId,
    parentId: item.parentId,
    deptName: item.deptName,
    checked: false,
  }
}

const defaultOptions = {
  autoLoad: true,
  idKey: 'deptId',
  parentIdKey: 'parentId',
  childrenKey: 'children',
};
export default function DeptService<T = TreeDept>(options: any = defaultOptions) {
  if (!options) options = defaultOptions
  const toThin: (item: SysDept) => T = options.toThin || toThinItem
  const idKey: keyof T = options.idKey || defaultOptions.idKey
  const childrenKey: keyof T = options.childrenKey || defaultOptions.childrenKey
  const parentIdKey: keyof T = options.parentIdKey || defaultOptions.parentIdKey
  const autoLoad = options.autoLoad
  const treeData = ref<T[]>([])
  const dataMap = ref<Record<string, T>>({})
  const init = () => {
    treeData.value = []
    dataMap.value = {}
    return listDept({status: "0"}).then(res => {
      const flatList: T[] = (res.data || []).map(toThin);
      const mapData = flatList.reduce((acc: Record<string, T>, cur: T) => {
        const id: any = cur[idKey]
        acc[id] = cur
        return acc
      }, {} as Record<string, T>)
      dataMap.value = mapData
      // console.log('mapData',mapData)
      const rootItems: T[] = [];
      flatList.forEach((item: T) => {
        if (item[parentIdKey]) {
          const parentId: any = item[parentIdKey]
          const parentItem: any = mapData[parentId] as T
          if (parentItem) {
            if (!parentItem[childrenKey]) parentItem[childrenKey] = []
            parentItem[childrenKey].push(item)
          } else {
            console.log('parentItem not found',item)
          }
        } else {
          rootItems.push(item)
        }
      })
      treeData.value = rootItems
    })
  }
  if (autoLoad) {
    init()
  }
  return {
    get treeData(): T[] {
      return treeData.value
    },
    get dataMap(): Record<string, T> {
      return dataMap.value
    },
    load: init,
  }
}
