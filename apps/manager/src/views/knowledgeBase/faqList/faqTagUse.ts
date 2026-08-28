import { KnowledgeTag } from '@/types';
import { getKnowledgeTagsApi } from '@/api/data/knowledgeFaq';

export default function useFaqTag() {
  const tagList = ref<KnowledgeTag[]>([]) as { value: KnowledgeTag[] };

  const tagMap = computed<Record<string, KnowledgeTag>>(() => {
    const map: Record<string, KnowledgeTag> = {};
    tagList.value.forEach((tag) => {
      map[tag.id] = tag;
    });
    return map;
  }) as { value: Record<string, KnowledgeTag> };

  // tagMapBySeqId uses seq_id as key for looking up by entry.tag_id
  const tagMapBySeqId = computed<Record<string, KnowledgeTag>>(() => {
    const map: Record<string, KnowledgeTag> = {};
    tagList.value.forEach((tag) => {
      map[tag.seqId] = tag;
    });
    return map;
  }) as { value: Record<string, KnowledgeTag> };

  const getTagName = (tagId?: number | string, defaultValue?: string) => {
    if (!tagId) return defaultValue;
    return tagMap.value[tagId]?.name || defaultValue;
  };
  const getTagNameBySeqId = (tagId?: number | string, defaultValue?: string) => {
    if (!tagId) return defaultValue;
    return tagMapBySeqId.value[tagId]?.name || defaultValue;
  };
  const tagOptionsWithId = computed(() => tagList.value.map((tag) => ({ label: tag.name, value: tag.id })));
  const loadTags = (knowledgeBaseId: number | string) => {
    return getKnowledgeTagsApi(knowledgeBaseId).then((res) => {
      tagList.value = res?.data || [];
      return tagList.value;
    });
  };
  return {
    loadTags,
    getTagName,
    getTagNameBySeqId,
    tagMap,
    tagMapBySeqId,
    tagOptionsWithId
  };
}
