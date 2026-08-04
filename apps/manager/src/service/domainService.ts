import { agiCategory as agiCategoryApi } from '@/api/settings/category'
import type { CategoryVO } from '@/types'

export const baseCategoryId = 1; // 基础领域分类ID
export const businessCategoryId = 2; // 业务领域分类ID
export const allCategoryId = null; // 所有领域分类ID
export const allCategoryName = '全部分类'; // 所有领域分类名称

export default function DomainService() {
  const allData = ref<CategoryVO[]>([])
  const dataMap = ref<Record<number, CategoryVO>>({})
  const init = () => {
    agiCategoryApi.tree().then((res) => {
      if (res.code === 200) {
        let data: CategoryVO[] = res.data || []
        // console.log(data)
        const _dataMap: Record<number, CategoryVO> = {}
        const addToMap = (data: CategoryVO[]) => {
          data.forEach((d) => {
            _dataMap[d.id!] = d
            if (d.childrenList) {
              addToMap(d.childrenList)
            }
          });
        }
        addToMap(data)
        allData.value = data
        dataMap.value = _dataMap
      }
    })
  }
  init()
  const computedRoot = (rootId: number|null = allCategoryId)=>{
    // if(rootId === allCategoryId){
    //   return allData.value
    // }
    return computed(()=>{
      if(rootId === allCategoryId){
        return allData.value
      }
      return dataMap.value[rootId]?.childrenList || []
    })
  }
  return {
    get allData(){
      return allData.value
    },
    get dataMap(){
      return dataMap.value
    },
    computedRoot,
  }
}

export type {
  CategoryVO
}
