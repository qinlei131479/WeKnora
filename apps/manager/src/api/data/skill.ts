import { AjaxResult, SkillListResult } from '@/types';
import request from '@/utils/request';
const PATH = '/business/skills';

const list = (): Promise<AjaxResult<SkillListResult>> => request({ url: `${PATH}/list`, method: 'GET' });

export const Skills = { list };
