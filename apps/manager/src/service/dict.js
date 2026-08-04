import api from '@/utils/api';
import { ref } from 'vue';
export { getDictLabel } from '@/utils/dict';
export default function getDictListByName(dictName) {
  const data = ref([]);
  api.dict.getDicByType(dictName).then(
    (res) => {
      data.value = res.data || [];
    },
    () => []
  );
  return data;
}

export function getMessageSourceList() {
  console.log('getMessageSourceList');
  return getDictListByName('message_source');
}

export function getMessageTypeList() {
  return getDictListByName('message_type');
}
export function getMessageTypeSystemCustomList() {
  return getDictListByName('message_type_system_custon');
}

export function getCustomMessageTypeList() {
  return getDictListByName('message_type_custom');
}

export function getSystemMessageTypeList() {
  return getDictListByName('message_type_system');
}

export function getMessagePutStatusList() {
  return getDictListByName('space_plan_put_status');
}
export function getMessageFrequencyList() {
  return getDictListByName('message_frequency');
}
export function getPublishStatusList() {
  return getDictListByName('publish_status');
}
export function getOriginalCountryList() {
  return getDictListByName('originalCountry');
}
export function getPgmCategoryList() {
  return getDictListByName('pgmCategory');
}
export function getLanguageList() {
  return getDictListByName('language');
}

// 演员性别
export function getGenderTypeList() {
  return getDictListByName('sex');
}

// 演员上下线
export function getCastStatusList() {
  return getDictListByName('cast_status');
}
// 订购渠道
export function getOrderChannelList() {
  return getDictListByName('order_channel');
}
// 订购渠道
export function getUnsubscribeChannelList() {
  return getDictListByName('unsubscribe_channel');
}
// 支付方式
export function getProductPayTypeList() {
  return getDictListByName('product_pay_type');
}

export function getAuditStatusList() {
  return getDictListByName('epg_audit_status');
}
export function getEpgPublishStatusList() {
  return getDictListByName('epg_publish_status');
}
export function getCategoryFilterFieldList() {
  return getDictListByName('category_filter_field');
}
export function getMediaSourceTypeList() {
  return getDictListByName('media_source_type');
}

export function getProgramTypeList() {
  // return getDictListByName('program_type');
  return [];
}
