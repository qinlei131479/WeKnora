import request from '@/utils/request'
const api = {};
const API = '/work-order';

// 按类型获取数据字典
api.getDicByType = (dictType) => {
  return request.get(`${API}/sys-dict-data/list-by-dic-type?dictType=${dictType}`);
};

// 媒资分类-->pgmCategory
// 节目语种-->language
// 所属地区-->originalCountry
// 清晰度---->definitionFlag
// 图片类型-->picture_type
// 跳过审核：skip_audit
// 渠道： channel
// 操作员类型：user_operator_type
// 审核状态： auth_media_audit_status
// 资源分发配置平台类型：sys_distribution_plat_type
// 资源分发配置接口类型：sys_distribution_url_type
// 媒资注入-处理状态：receive_resource_download_status
// 接收工单-处理状态：receive_work_order_status
// 分发工单-操作类型：work_order_action
// 分发工单-对象类型：work_order_element_type
// 分发工单-处理类型：work_order_status
// 视频关联状态： exist_movie
// 发布状态：publish_status
// 信号来源： channel_sub_type
// 锁定状态： lock_statu

// 内容提供商
api.getContentProvider = () => {
  return request.get(`${API}/sysContentProvider/select`);
};
// 内容提供商
api.getContentProviderDict = () => {
  const dictType = 'content_provider';
  return request.get(`${API}/sys-dict-data/list-by-dic-type?dictType=${dictType}`);
  // return this.getDicByType(dictType);
};

export default { ...api };
