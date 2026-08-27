import { getKnowledgeFileListApi } from '@/api/data/knowledgeFile';
import { KnowledgeFileEntity, KnowledgeFileListReq, PageDomain } from '@/types';

export default function useFilesQuery(knowledgeBaseId?: number | string) {
  const pageParams = ref<PageDomain>({
    pageNum: 1,
    pageSize: 10
  });
  const queryParams = ref<KnowledgeFileListReq>({
    knowledgeBaseId,
    parseStatus: '',
    fileName: '',
    fileType: '',
    channel: '',
    folderPath: '',
    keyword: ''
  });
  const filesTableData = ref<KnowledgeFileEntity[]>([]);
  const filesTableLoading = ref<boolean>(false);
  const filesTableTotal = ref<number>(0);
  const updateParams = (params: KnowledgeFileListReq, page?: PageDomain) => {
    queryParams.value = params;
    if (page) {
      pageParams.value = page;
    }
  };
  const resetFilesQuery = () => {
    queryParams.value = {};
  };
  const loadFilesTableData = () => {
    filesTableLoading.value = true;
    const params: any = {};
    const queryParamsValue: any = queryParams.value;
    let value: any;
    for (const key in queryParamsValue) {
      if ((value = queryParamsValue[key])) {
        params[key] = value;
      }
    }
    getKnowledgeFileListApi(params, pageParams.value).then(
      (res) => {
        filesTableData.value = res.rows || [];
        filesTableTotal.value = +res.total || 0;
        filesTableLoading.value = false;
      },
      () => {
        filesTableLoading.value = false;
      }
    );
  };
  return {
    pageParams,
    queryParams,
    filesTableData,
    filesTableLoading,
    filesTableTotal,
    updateParams,
    resetFilesQuery,
    loadFilesTableData
  };
}
