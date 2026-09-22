import { getKnowledgeFaqListApi, deleteKnowledgeFaqSingleApi } from '@/api/data/knowledgeFaq';
import { KnowledgeFaqEntity, KnowledgeFaqListReq, PageDomain } from '@/types';
import useTableData from '@/composables/useTableData';
import { t } from '@/i18n';

export default function useFaqTableData(knowledgeBaseId?: number | string) {
  const tableData = useTableData<KnowledgeFaqEntity>({
    searchApi: getKnowledgeFaqListApi,
    queryParams: {
      knowledgeBaseId,
      tagIds: [],
      // parseStatus: '',
      // fileName: '',
      // fileType: '',
      // channel: '',
      // folderPath: '',
      keyword: ''
    } as KnowledgeFaqListReq,
    deleteConfirmMessage: (row: KnowledgeFaqEntity) => {
      return t('page.knowledgeFaq.deleteConfirm', { name: row.standardQuestion }, `是否确认删除问题为 ${row.standardQuestion} 的数据项？`);
    },
    deleteApi: deleteKnowledgeFaqSingleApi,
    deleteSuccessMessage: t('page.normal.deleteSuccess')
  });
  return tableData;
}
