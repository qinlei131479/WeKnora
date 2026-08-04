import { BaseEntity } from '../common';

// Request DTO
export interface CategoryDTO {
  id?: number;
  idPath?: string;
  parentId?: number;
  name?: string;
}

// Response VO
export interface CategoryVO extends CategoryDTO, BaseEntity {
  builtInFlag?: 0 | 1;
  delFlag?: 0 | 1;
  childrenList?: CategoryVO[];
}
