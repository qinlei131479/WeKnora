import type { t } from '@/i18n';
import { getKnowledgeFileFoldersApi } from '@/api/data/knowledgeFile';
import { KnowledgeFileFoldersNode, KnowledgeFileFoldersResp } from '@/types';

export default function useFolder(i18n: { t: typeof t }, knowledgeBaseId?: number | string) {
  const folderTreeData = ref<KnowledgeFileFoldersNode[]>();
  const showFolderTree = ref<boolean>(false);
  const folderTreeLoading = ref<boolean>(false);
  const folderTreeIds = ref<string[]>([]);
  const knowledgeBaseIdRef = ref(knowledgeBaseId);
  const folderTreeProps = {
    children: 'children',
    label: 'name'
  };
  const updateKnowledgeBaseId = (id: number | string) => {
    knowledgeBaseIdRef.value = id;
  };
  const buildRootNode = (rootInfo?: KnowledgeFileFoldersResp) => {
    const rootNode: KnowledgeFileFoldersNode = {
      id: 'root',
      level: 0,
      name: i18n.t('page.normal.root', '根目录'),
      path: '',
      documentCount: rootInfo?.rootDocumentCount || 0,
      totalCount: rootInfo?.totalDocumentCount || 0
    };
    return rootNode;
  };
  let idSeed = 0;
  const updateInfo = (nodes: KnowledgeFileFoldersNode[], parent: KnowledgeFileFoldersNode, allIds: string[]) => {
    nodes.forEach((node) => {
      node.id = `${parent.id}-${idSeed++}`;
      node.level = parent.level! + 1;
      allIds.push(node.id);
      if (node.children) {
        if (node.children.length > 0) {
          updateInfo(node.children, node, allIds);
        } else {
          delete node.children;
        }
      }
      let childrenTotalCount = 0;
      if (node.children) {
        node.children.forEach((child) => {
          childrenTotalCount += child.totalCount || 0;
        });
      }
      node.totalCount = childrenTotalCount + (node.documentCount || 0);
    });
  };
  const loadFolderTreeData = () => {
    folderTreeLoading.value = true;
    getKnowledgeFileFoldersApi(knowledgeBaseIdRef.value ?? '').then((res) => {
      const rootNode = buildRootNode(res.data);
      const allIds: string[] = [rootNode.id!];
      rootNode.children = res.data?.folders || [];
      folderTreeData.value = [rootNode];
      folderTreeLoading.value = false;
      updateInfo(rootNode.children, rootNode, allIds);
      folderTreeIds.value = allIds;
    });
  };
  return {
    folderTreeData,
    folderTreeProps,
    folderTreeIds,
    showFolderTree,
    folderTreeLoading,
    updateKnowledgeBaseId,
    loadFolderTreeData
  };
}
