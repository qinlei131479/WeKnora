import { KnowledgeFaqTag } from '@/types';
import { getKnowledgeFaqTagsApi } from '@/api/data/knowledgeFaq';

export default function useFaqTag() {
  const tagList = ref<KnowledgeFaqTag[]>([]) as { value: KnowledgeFaqTag[] };

  const tagMap = computed<Record<string, KnowledgeFaqTag>>(() => {
    const map: Record<string, KnowledgeFaqTag> = {};
    tagList.value.forEach((tag) => {
      map[tag.id] = tag;
    });
    return map;
  }) as { value: Record<string, KnowledgeFaqTag> };

  // tagMapBySeqId uses seq_id as key for looking up by entry.tag_id
  const tagMapBySeqId = computed<Record<string, KnowledgeFaqTag>>(() => {
    const map: Record<string, KnowledgeFaqTag> = {};
    tagList.value.forEach((tag) => {
      map[tag.seqId] = tag;
    });
    return map;
  }) as { value: Record<string, KnowledgeFaqTag> };

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
    return getKnowledgeFaqTagsApi(knowledgeBaseId).then((res) => {
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
