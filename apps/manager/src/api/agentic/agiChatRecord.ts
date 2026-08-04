import { AgiChatRecordHistoryDTO, AgiChatRecordPageDTO, AgiChatRecordVO, PageDomain, TableDataInfo } from '@/types';
import request, { getDownload } from '@/utils/request';
import dayjs from 'dayjs';
import qs from 'qs';

const path = '/business/agiChatRecord';

// 列表
const list = (dto: AgiChatRecordPageDTO, pg: PageDomain): Promise<TableDataInfo<AgiChatRecordVO>> => {
  return request({
    url: `${path}/list`,
    method: 'GET',
    params: { ...dto, ...pg }
  });
};

// 查询用户的历史对话记录
const listByHistory = (data: AgiChatRecordHistoryDTO): Promise<AgiChatRecordVO> => {
  return request({
    url: `${path}/listByHistory`,
    method: 'POST',
    data
  });
};

// 批量删除
const batchDelete = (dataList: number[]): Promise<AgiChatRecordVO> => {
  return request({
    url: `${path}/batchDelete`,
    method: 'POST',
    data: { dataList }
  });
};

// 导出数据
const excel = (dto: AgiChatRecordPageDTO, pg: PageDomain) => {
  let url = `${path}/excel`;
  const params = qs
    .stringify(
      {
        ...dto,
        sessionIdList: dto.sessionIdList?.join(','),
        ...pg
      },
      { skipNulls: true }
    )
    .replace(/%2C/gi, ',');
  if (params) {
    url += `?${params}`;
  }
  getDownload(url, `对话记录表数据_${dayjs().format('YYYYMMDDHHmmss_SSS')}.xlsx`);
};

export const agiChatRecord = {
  list,
  listByHistory,
  batchDelete,
  excel
};
