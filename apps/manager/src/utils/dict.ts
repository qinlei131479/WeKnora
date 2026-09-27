import { t } from '@/i18n';
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

export const operationMessage = {
  get addMessage() { return t('common.dict.addedSuccessfully', '增加成功'); },
  get deleteMessage() { return t('page.normal.confirmInfo.removeSuccess', '删除成功'); },
  get editMessage() { return t('common.dict.updatedSuccessfully', '编辑成功'); },
  get startMessage() { return t('page.normal.confirmInfo.enableSuccess', '启用成功'); },
  get stopMessage() { return t('page.normal.confirmInfo.disableSuccess', '停用成功'); },
  get commonMessage() { return t('common.dict.operationSuccessful', '操作成功'); }
};

export const videoSelectorTabs = [
  { id: '1', get name() { return t('common.dict.myVideos', '我的视频'); } },
  { id: '0', get name() { return t('common.dict.publicVideos', '公共视频'); } },
  { id: '2', get name() { return t('common.dict.localVideos', '本地视频'); } }
];

export const aduitStatusData = [
  { id: '草稿', value: 0, get label() { return t('page.knowledgeBase.statuss.statusDraft', '草稿'); } },
  { id: '初审中', value: 1, get label() { return t('common.dict.initialReview', '初审中'); } },
  { id: '复审中', value: 2, get label() { return t('common.dict.secondaryReview', '复审中'); } },
  { id: '终审中', value: 3, get label() { return t('common.dict.finalReview', '终审中'); } },
  { id: '已审核', value: 4, get label() { return t('common.dict.reviewed', '已审核'); } },
  { id: '审核失败', value: 5, get label() { return t('common.dict.reviewFailed', '审核失败'); } }
];

// EPG审核状态
export const epgAduitStatusData = [
  { id: '未提交/草稿', value: 0, get label() { return t('common.dict.notSubmittedDraft', '未提交/草稿'); } },
  { id: '待审核', value: 1, get label() { return t('common.dict.pendingReview', '待审核'); } },
  { id: '审核通过', value: 4, get label() { return t('common.dict.approved', '审核通过'); } },
  { id: '审核失败', value: 5, get label() { return t('common.dict.reviewFailed', '审核失败'); } }
];

// 视频关联状态
export const videoStatusData = [
  // 0:未关联 1:已关联
  { id: '0', get name() { return t('common.dict.notLinked', '未关联'); } },
  { id: '1', get name() { return t('common.dict.linked', '已关联'); } }
];

// 视频审核状态
// 0:草稿 1:初审中 2:复审中 3:终审中 4:审核成功 5:初审失败 6:复审失败 7:终审失败
export const aduitStatusStepData = [
  { id: '0', get label() { return t('page.knowledgeBase.statuss.statusDraft', '草稿'); } },
  { id: '1', get label() { return t('common.dict.initialReview', '初审中'); } },
  { id: '2', get label() { return t('common.dict.secondaryReview', '复审中'); } },
  { id: '3', get label() { return t('common.dict.finalReview', '终审中'); } },
  { id: '4', get label() { return t('common.dict.reviewSuccessful', '审核成功'); } },
  { id: '5', get label() { return t('common.dict.reviewFailed', '审核失败'); } }
];

// 媒资状态-状态标志 0:启用 1:停用
export const meidiaStatusData = [
  // 0:未关联 1:已关联
  { id: '0', get label() { return t('page.normal.enable', '启用'); }, get label2() { return t('page.agent.sessions.status.normal', '正常'); } },
  { id: '1', get label() { return t('page.normal.disable', '停用'); }, get label2() { return t('common.dict.locked', '锁定'); } }
];


// 费用类型
export const chargeTypeData = [
  {
    key: 'FREE',
    get value() { return t('common.dict.free', '免费'); }
  },
  {
    key: 'CHARGE',
    get value() { return t('common.dict.paid', '付费'); }
  }
];

export const contentType_cherryPick = 1; // 精选
export const contentType_rec = 2; // 推荐
export const contentType_base = 3; // 底量
export const contentType_news = 4; // 上新
export const contentType_topic = 5; // 专题
export const contentTypeNames = {
  get [contentType_cherryPick]() { return t('common.dict.featured', '精选'); },
  get [contentType_rec]() { return t('component.knowledgeEditor.faq.recommended', '推荐'); },
  get [contentType_base]() { return t('common.dict.baseContent', '底量'); },
  get [contentType_news]() { return t('common.dict.newArrivals', '上新'); },
  get [contentType_topic]() { return t('common.dict.topics', '专题'); },
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
