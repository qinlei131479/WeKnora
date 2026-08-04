import { BaseEntity } from '../common';

// Request DTO
export interface DatasourcePageDTO {
  categoryId?: number;
  categoryIdPath?: string;
  dsType?: number;
  status?: number;
  keyword?: string;
}

export interface DatasourceDTO {
  id?: number;
  name?: string;
  tableSchema?: string;
  categoryId?: number;
  description?: string;
  username?: string;
  password?: string;
  dsType?: number;
  dsName?: string;
  port?: number;
  host?: string;
  status?: number;
  healthyTime?: string;
}

export interface DatasourceTableDTO {
  id?: number;
  dsId: number;
  checkedFlag?: number;
  tableName?: string;
  tableComment?: string;
  customComment?: string;
  fields?: DatasourceTableFieldDTO[];
}

export interface DatasourceTableFieldDTO {
  id?: number;
  dsId: number;
  tableId?: number;
  fieldName?: string;
  fieldType?: string;
  fieldComment?: string;
  customComment?: string;
  keyType?: 'PRI' | 'UNI' | 'MUL' | '';
  weight?: number;
}

export interface TerminologyDTO {
  id?: number;
  dsId: number;
  name: string;
  keywords?: string;
  description?: string;
}

export interface SqlTrainDTO {
  id?: number;
  dsId: number;
  title?: string;
  description?: string;
  sql: string;
}

// Response VO
export interface DatasourceVO extends DatasourceDTO, BaseEntity {
  tableCount?: number;
  tables?: DatasourceTableVO[];
  terminologies?: TerminologyVO[];
  sqlTrains?: SqlTrainVO[];
}

export interface DatasourceCallLogVO {
  /** 数据源 ID */
  id: number;
  /** 上个自然月访问次数 */
  count: number;
}

export interface DatasourceTableVO extends DatasourceTableDTO, BaseEntity {}

export interface DatasourceTableFieldVO extends DatasourceTableFieldDTO, BaseEntity {}

export interface TerminologyVO extends TerminologyDTO, BaseEntity {}

export interface SqlTrainVO extends SqlTrainDTO, BaseEntity {}

export interface DatasourceSyncTableVO {
  tableName: string;
  tableComment?: string;
  fields?: DatasourceSyncTableFieldVO[];
}

export interface DatasourceSyncTableFieldVO {
  fieldName: string;
  dataType: string;
  notNull: number;
  keyType?: string;
  fieldComment?: string;
}
