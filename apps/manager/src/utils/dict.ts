import useDictStore from '@/store/modules/dict'
import { getDicts } from '@/api/system/dict/data'

/**
 * 获取字典数据
 */
export function useDict(...args: string[]) {
  const res = ref<Record<string, any[]>>({})
  return (() => {
    args.forEach((dictType) => {
      res.value[dictType] = []
      const dicts = useDictStore().getDict(dictType)
      if (dicts) {
        res.value[dictType] = dicts
      } else {
        getDicts(dictType).then(resp => {
          res.value[dictType] = (resp.data || []).map((p: any) => ({ label: p.dictLabel, value: p.dictValue, elTagType: p.listClass, elTagClass: p.cssClass }))
          useDictStore().setDict(dictType, res.value[dictType])
        })
      }
    })
    return toRefs(res.value)
  })()
}

const addMessage = '增加成功';
const deleteMessage = '删除成功';
const editMessage = '编辑成功';
const startMessage = '启用成功';
const stopMessage = '停用成功';
const commonMessage = '操作成功';
export const operationMessage = {
  addMessage,
  deleteMessage,
  editMessage,
  startMessage,
  stopMessage,
  commonMessage
};

export const videoSelectorTabs = [
  { id: '1', name: '我的视频' },
  { id: '0', name: '公共视频' },
  { id: '2', name: '本地视频' }
];

export const aduitStatusData = [
  { id: '草稿', value: 0, label: '草稿' },
  { id: '初审中', value: 1, label: '初审中' },
  { id: '复审中', value: 2, label: '复审中' },
  { id: '终审中', value: 3, label: '终审中' },
  { id: '已审核', value: 4, label: '已审核' },
  { id: '审核失败', value: 5, label: '审核失败' }
];

// EPG审核状态
export const epgAduitStatusData = [
  { id: '未提交/草稿', value: 0, label: '未提交/草稿' },
  { id: '待审核', value: 1, label: '待审核' },
  { id: '审核通过', value: 4, label: '审核通过' },
  { id: '审核失败', value: 5, label: '审核失败' }
];

// 视频关联状态
export const videoStatusData = [
  // 0:未关联 1:已关联
  { id: '0', name: '未关联' },
  { id: '1', name: '已关联' }
];

// 视频审核状态
// 0:草稿 1:初审中 2:复审中 3:终审中 4:审核成功 5:初审失败 6:复审失败 7:终审失败
export const aduitStatusStepData = [
  { id: '0', label: '草稿' },
  { id: '1', label: '初审中' },
  { id: '2', label: '复审中' },
  { id: '3', label: '终审中' },
  { id: '4', label: '审核成功' },
  { id: '5', label: '审核失败' }
];

// 媒资状态-状态标志 0:启用 1:停用
export const meidiaStatusData = [
  // 0:未关联 1:已关联
  { id: '0', label: '启用', label2: '正常' },
  { id: '1', label: '停用', label2: '锁定' }
];


// 费用类型
export const chargeTypeData = [
  {
    key: 'FREE',
    value: '免费'
  },
  {
    key: 'CHARGE',
    value: '付费'
  }
];

export const contentType_cherryPick = 1; // 精选
export const contentType_rec = 2; // 推荐
export const contentType_base = 3; // 底量
export const contentType_news = 4; // 上新
export const contentType_topic = 5; // 专题
export const contentTypeNames = {
  [contentType_cherryPick]: '精选',
  [contentType_rec]: '推荐',
  [contentType_base]: '底量',
  [contentType_news]: '上新',
  [contentType_topic]: '专题',
}
export const contentTypes = {
  cherryPick: contentType_cherryPick,
  rec: contentType_rec,
  base: contentType_base,
  news: contentType_news,
  topic: contentType_topic,
}

export function getDictLabel(dictDataList: any[], dictValue: string|number, isNum: boolean, defaultLabel = '') {
  if (!dictDataList) return defaultLabel;
  console.log('getDictLabel', dictValue, dictDataList);
  if (isNum) {
    return dictDataList.find((item) => Number(item.dictValue) === Number(dictValue))?.dictLabel || defaultLabel;
  } else {
    return dictDataList.find((item) => item.dictValue === dictValue)?.dictLabel || defaultLabel;
  }
}