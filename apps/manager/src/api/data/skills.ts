import type {
  AjaxResult,
  PageDomain,
  SkillCatalogFileSaveDTO,
  SkillCatalogPageDTO,
  SkillCatalogSourceDTO,
  SkillCatalogVO,
  TableDataInfo
} from '@/types';
import request from '@/utils/request';

const PATH = '/business/skills';

/** 跨租户分页查询技能目录，支持关键字、租户、使用侧及启用状态过滤 */
const list = (dto: SkillCatalogPageDTO, page: PageDomain): Promise<TableDataInfo<SkillCatalogVO>> => {
  return request({
    url: `${PATH}/list`,
    method: 'GET',
    params: { ...dto, ...page }
  });
};

/** 按 ID 查询技能详情及文件树 */
const single = (id: string): Promise<AjaxResult<SkillCatalogVO>> => {
  return request({
    url: `${PATH}/single`,
    method: 'GET',
    params: { id }
  });
};

/** 上传 .zip 或 SKILL.md，使用文件表单传输并写入内置技能目录（租户 ID 为 1） */
const upload = (file: File): Promise<AjaxResult<SkillCatalogVO>> => {
  const data = new FormData();
  data.append('file', file);
  return request({
    url: `${PATH}/upload`,
    method: 'POST',
    data,
    headers: { 'Content-Type': 'multipart/form-data', repeatSubmit: false },
    timeout: 120000
  });
};

/** 从远程来源拉取技能并写入内置技能目录（租户 ID 为 1） */
const pull = (data: SkillCatalogSourceDTO): Promise<AjaxResult<SkillCatalogVO>> => {
  return request({
    url: `${PATH}/remote/pull`,
    method: 'POST',
    data,
    timeout: 120000
  });
};

/** 读取技能包内文本文件，文档返回结构为键值对象 */
const file = (id: string, path: string): Promise<AjaxResult<Record<string, unknown>>> => {
  return request({
    url: `${PATH}/file`,
    method: 'GET',
    params: { id, path }
  });
};

/** 保存根级 SKILL.md 并同步技能元数据 */
const saveFile = (data: SkillCatalogFileSaveDTO): Promise<AjaxResult<void>> => {
  return request({
    url: `${PATH}/file/save`,
    method: 'POST',
    data
  });
};

/** 软删除技能目录定义；存在沙箱安装引用时由后端拒绝删除 */
const _delete = (id: string): Promise<AjaxResult<void>> => {
  return request({
    url: `${PATH}/delete/single`,
    method: 'GET',
    params: { id }
  });
};

export const Skills = {
  list,
  single,
  upload,
  pull,
  file,
  saveFile,
  delete: _delete
};
