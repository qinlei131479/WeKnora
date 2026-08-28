import { AjaxResult, PageDomain, TableDataInfo } from '@/types';
import modal from '@/plugins/modal';
export interface TableDataOptions<T> {
  pageParams?: PageDomain;
  initPageParams?: PageDomain;
  queryParams?: Record<string, any>;
  initQueryParams?: Record<string, any>;
  searchApi: (params: any, page: PageDomain) => Promise<TableDataInfo<T>>;
  skipEmptyParam?: boolean;
  parseRowData?: (row: T) => T;
  deleteConfirmMessage?: string | ((row: T) => string);
  deleteSuccessMessage?: string | ((row: T) => string);
  deleteApi?: (id: number | string) => Promise<AjaxResult>;
}

export default function useTableData<T>(options: TableDataOptions<T>) {
  if (!options || !options.searchApi) {
    throw new Error('options.searchApi is required');
  }
  const skipEmptyParam = options.skipEmptyParam ?? true;
  const pageParamsValue = options.pageParams || {
    pageNum: 1,
    pageSize: 10
  };
  const initPageParamsValue = options.initPageParams || { ...pageParamsValue };
  const queryParamsValue = options.queryParams || {};
  const initQueryParamsValue = options.initQueryParams || { ...queryParamsValue };
  const searchApi = options.searchApi;
  const parseRowData = options.parseRowData;

  const pageParams = ref({ ...pageParamsValue });
  const queryParams = ref({ ...queryParamsValue });
  const tableData = ref<T[]>([]);
  const loading = ref(false);
  const total = ref(0);

  const loadTableData = () => {
    loading.value = true;
    const queryParamsValue: any = {};
    const pageParamsValue = { ...pageParams.value };
    if (skipEmptyParam) {
      const qv = queryParams.value;
      Object.keys(qv).forEach((key) => {
        if (qv[key] !== undefined && qv[key] !== '' && qv[key] !== null) {
          queryParamsValue[key] = qv[key];
        }
      });
    } else {
      Object.assign(queryParamsValue, queryParams.value);
    }
    searchApi(queryParamsValue, pageParamsValue).then(
      (res) => {
        let rows = res?.rows || [];
        if (parseRowData) {
          rows = rows.map(parseRowData);
        }
        tableData.value = rows;
        total.value = +res.total || 0;
        loading.value = false;
      },
      () => {
        loading.value = false;
      }
    );
  };

  const resetPageSearch = () => {
    pageParams.value = { ...initPageParamsValue };
    loadTableData();
  };
  const resetQuerySearch = () => {
    queryParams.value = { ...initQueryParamsValue };
    loadTableData();
  };
  const resetPageParams = () => {
    pageParams.value = { ...initPageParamsValue };
  };
  const resetQueryParams = () => {
    queryParams.value = { ...initQueryParamsValue };
  };
  const resetParams = () => {
    resetPageParams();
    resetQueryParams();
  };

  const deleteApi = options.deleteApi;
  const deleteConfirmMessage = options.deleteConfirmMessage;
  const deleteSuccessMessage = options.deleteSuccessMessage;
  const handleDelete = (id: number | string, row: T) => {
    if (!deleteApi) {
      throw new Error('options.deleteApi is required');
    }
    const message = typeof deleteConfirmMessage === 'function' ? deleteConfirmMessage(row) : deleteConfirmMessage;
    if (!message) {
      doDelete(id, row);
      return;
    }
    modal.confirm(message).then(
      function () {
        return doDelete(id, row);
      },
      () => {}
    );
  };
  const doDelete = (id: number | string, row: T) => {
    deleteApi!(id).then((res) => {
      if (res.code === 200) {
        const successMessage = typeof deleteSuccessMessage === 'function' ? deleteSuccessMessage(row) : deleteSuccessMessage;
        if (successMessage) {
          modal.msgSuccess(successMessage);
        }
        if (tableData.value.length === 1 && pageParams.value.pageNum > 1) {
          pageParams.value.pageNum--;
        }
        loadTableData();
      }
    });
  };
  return {
    pageParams,
    queryParams,
    tableData,
    loading,
    total,
    loadTableData,
    resetPageSearch,
    resetQuerySearch,
    resetParams,
    resetPageParams,
    resetQueryParams,
    handleDelete
  };
}
