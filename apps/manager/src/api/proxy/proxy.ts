import type { ProxyDTO } from '@/types';
import request from '@/utils/request';

const path = '/business/proxy';

const requestNonStream = (dto: ProxyDTO): Promise<any> => {
  return request({
    url: `${path}/request/non-stream`,
    method: 'POST',
    data: dto,
    timeout: 600000
  });
};

export const agiProxy = {
  requestNonStream
};
