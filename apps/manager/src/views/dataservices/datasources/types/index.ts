export type TTable = {
  name: string;
  description?: string;
  columns?: TField[];
};

export type TField = {
  name: string;
  type: string;
  nullable?: 'YES' | 'NO' | '';
  index?: 'PRI' | 'UNI' | 'MUL' | '';
  description?: string;
};

export type TTerm = {
  term: string;
  keywords?: string;
  description?: string;
};

export type TSql = {
  title: string;
  description?: string;
  sql?: string;
};
