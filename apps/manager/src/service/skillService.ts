import { agiSkill } from '@/api/resources/skill';
import { PageDomain, SkillPageDTO, SkillVO } from "@/types"

export interface SkillEntity {
  checked: boolean
  id?: number
  name?: string
}

export const toThinItem = (item: SkillVO): SkillEntity => {
  return {
    id: item.id,
    name: item.name,
    checked: false,
  }
}

const defaultOptions = {
  autoLoad: true,
  idKey: "id",
};
export default function SkillService<T = SkillEntity>(options: any = defaultOptions) {
  const toThin: (item: SkillVO) => T = options.toThin || toThinItem
  const idKey: keyof T = options.idKey || defaultOptions.idKey
  const autoLoad = options.autoLoad
  const listData = ref<T[]>([])
  const dataMap = ref<Record<string, T>>({})
  const total = ref<number>(0)
  const init = (searchParams?: SkillPageDTO, pageParams?: PageDomain) => {
    listData.value = []
    dataMap.value = {}
    const params: SkillPageDTO = {
      status: 1,
      ...searchParams
    };
    const page = {
      pageSize: 999,
      pageNum: 1,
      ...pageParams
    }
    return agiSkill.list(params, page).then(res => {
      const rootItems: T[] = [];
      const _dataMap: Record<string, T> = {};
      (res.rows || []).forEach((item: SkillVO)=>{
        const thinItem: any = toThin(item)
        rootItems.push(thinItem)
        _dataMap[thinItem[idKey]] = thinItem
      });
      total.value = +res.total || 0
      dataMap.value = _dataMap
      listData.value = rootItems
      return res
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
    get total(){
      return total.value
    },
    load: init,
  }
}

export type { SkillPageDTO }