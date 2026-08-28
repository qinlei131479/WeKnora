import { deleteKnowledgeFileSingleApi, getKnowledgeFileListApi } from '@/api/data/knowledgeFile';
import { KnowledgeFileEntity, KnowledgeFileListReq, PageDomain } from '@/types';
import useTableData from '@/composables/useTableData';
import { useI18n } from 'vue-i18n';

export default function useFilesQuery(knowledgeBaseId?: number | string) {
  const { t } = useI18n();
  const tableData = useTableData<KnowledgeFileEntity>({
    searchApi: getKnowledgeFileListApi,
    queryParams: {
      knowledgeBaseId,
      parseStatus: '',
      fileName: '',
      fileType: '',
      channel: '',
      folderPath: '',
      keyword: ''
    } as KnowledgeFileListReq,
    deleteConfirmMessage: (row: KnowledgeFileEntity) => {
      return t('page.knowledgeBase.deleteConfirm', { fileName: row.fileName }, `是否确认删除知识库文件 ${row.fileName} 数据项？`);
    },
    deleteApi: deleteKnowledgeFileSingleApi,
    deleteSuccessMessage: t('page.normal.deleteSuccess')
  });
  tableData.resetQuerySearch = () => {
    const { folderPath } = tableData.queryParams.value;
    tableData.resetQueryParams();
    tableData.queryParams.value.folderPath = folderPath;
    tableData.loadTableData();
  };
  return tableData;
  // const pageParams = ref<PageDomain>({
  //   pageNum: 1,
  //   pageSize: 10
  // });
  // const queryParams = ref<KnowledgeFileListReq>({
  //   knowledgeBaseId,
  //   parseStatus: '',
  //   fileName: '',
  //   fileType: '',
  //   channel: '',
  //   folderPath: '',
  //   keyword: ''
  // });
  // const filesTableData = ref<KnowledgeFileEntity[]>([]);
  // const filesTableLoading = ref<boolean>(false);
  // const filesTableTotal = ref<number>(0);
  // const updateParams = (params: KnowledgeFileListReq, page?: PageDomain) => {
  //   queryParams.value = params;
  //   if (page) {
  //     pageParams.value = page;
  //   }
  // };
  // const resetFilesQuery = () => {
  //   queryParams.value = {};
  //   loadFilesTableData();
  // };
  // const loadFilesTableData = () => {
  //   filesTableLoading.value = true;
  //   const params: any = {};
  //   const queryParamsValue: any = queryParams.value;
  //   let value: any;
  //   for (const key in queryParamsValue) {
  //     if ((value = queryParamsValue[key])) {
  //       params[key] = value;
  //     }
  //   }
  //   getKnowledgeFileListApi(params, pageParams.value).then(
  //     (res) => {
  //       filesTableData.value = res.rows || [];
  //       filesTableTotal.value = +res.total || 0;
  //       filesTableLoading.value = false;
  //     },
  //     () => {
  //       filesTableLoading.value = false;
  //     }
  //   );
  // };
  // return {
  //   pageParams,
  //   queryParams,
  //   filesTableData,
  //   filesTableLoading,
  //   filesTableTotal,
  //   updateParams,
  //   resetFilesQuery,
  //   loadFilesTableData
  // };
}
