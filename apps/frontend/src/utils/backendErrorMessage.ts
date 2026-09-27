/** 后端原文错误按当前界面语言显示。文案在 i18n/locales_backend，键为 error.kb.*。 */
export const BACKEND_ERROR_I18N_KEYS: Record<string, string> = {
  'No permission to operate on this knowledge base': 'error.kb.noPermissionOperate',
  'No permission to operate': 'error.kb.noPermissionOperate',
  'No permission to delete knowledge': 'error.kb.noPermissionDelete',
  'No permission to modify knowledge': 'error.kb.noPermissionModify',
  'No permission to update knowledge base': 'error.kb.noPermissionUpdate',
  'No permission to create knowledge': 'error.kb.noPermissionCreate',
  'No permission to update knowledge tags': 'error.kb.noPermissionUpdateTags',
  'Source and target knowledge bases must be the same type': 'error.kb.moveTypeMismatch',
  'source and target knowledge bases must have the same type': 'error.kb.moveTypeMismatch',
  'Source and target must use the same embedding model': 'error.kb.moveEmbeddingMismatch',
  'source and target knowledge bases use different embedding models': 'error.kb.moveEmbeddingMismatch',
  'reuse_vectors move across different vector stores is not supported; use reparse mode to move into a different store':
    'error.kb.moveReuseAcrossStores',
  'source and target knowledge bases use different vector stores; use reparse mode for moves':
    'error.kb.moveReuseAcrossStores',
  'Forbidden: must own the resource or have the required role': 'error.kb.forbiddenOwnerOrRole',
  'Service Unavailable: cannot verify resource ownership': 'error.kb.ownershipUnverified',
  'cannot verify knowledge base ownership': 'error.kb.cannotVerifyKbOwnership',
  'knowledge base not found': 'error.kb.kbNotFound',
  'Knowledge not found': 'error.kb.knowledgeNotFound',
  'knowledge not found': 'error.kb.knowledgeNotFound',
  'Permission denied to access this knowledge': 'error.kb.permissionDeniedKnowledge',
  'Only knowledge base owner can clear contents': 'error.kb.ownerClearOnly',
  'Only knowledge base owner can delete': 'error.kb.ownerDeleteOnly',
  'Knowledge base not accessible through this agent': 'error.kb.kbNotAccessibleViaAgent',
  'no permission to reparse knowledge in this kb': 'error.kb.noPermissionReparse',
  'No permission to access source knowledge base': 'error.kb.noPermissionSourceKb',
  'No permission to access target knowledge base': 'error.kb.noPermissionTargetKb',
  'No permission to access this knowledge base': 'error.kb.noPermissionAccessKb',
  'No permission to copy this knowledge base': 'error.kb.noPermissionCopyKb',
  'No permission to copy to this knowledge base': 'error.kb.noPermissionCopyToKb',
  'No permission to replace this knowledge base\'s contents': 'error.kb.noPermissionReplaceContents',
  'No permission to duplicate this knowledge base': 'error.kb.noPermissionDuplicateKb',
  'Source and target knowledge base cannot be the same': 'error.kb.sourceTargetSame',
  'source and target knowledge bases must differ': 'error.kb.sourceTargetSame',
  'Source knowledge base not found': 'error.kb.sourceKbNotFound',
  'Target knowledge base not found': 'error.kb.targetKbNotFound',
  'Knowledge ID cannot be empty': 'error.kb.knowledgeIdEmpty',
  'ids cannot be empty': 'error.kb.idsEmpty',
  'knowledge_ids cannot be empty': 'error.kb.idsEmpty',
  'One or more knowledge entries not found': 'error.kb.entriesNotFound',
  'some knowledge entries were not found': 'error.kb.entriesNotFound',
  'no knowledge IDs provided for batch reparse': 'error.kb.noIdsForReparse',
  'invalid batch reparse knowledge request parameters': 'error.kb.invalidRequest',
  'Invalid reparse request body': 'error.kb.invalidRequest',
  'Invalid request parameters': 'error.kb.invalidRequest',
  '请求参数不合法': 'error.kb.invalidRequest',
  'File upload failed': 'error.kb.fileUploadFailed',
  'Task ID cannot be empty': 'error.kb.taskIdEmpty',
  'Chunk ID cannot be empty': 'error.kb.chunkIdEmpty',
  'knowledge base ID is required': 'error.kb.kbIdRequired',
  'Knowledge base ID cannot be empty': 'error.kb.kbIdRequired',
  'Knowledge base ID is required': 'error.kb.kbIdRequired',
  'query_text is required': 'error.kb.queryTextRequired',
  'Storage provider is not allowed by STORAGE_ALLOW_LIST': 'error.kb.storageNotAllowed',
  'text cannot be empty': 'error.kb.textEmpty',
  'tags cannot be empty': 'error.kb.tagsEmpty',
  'nodes cannot be empty': 'error.kb.nodesEmpty',
  'relations cannot be empty': 'error.kb.relationsEmpty',
  'Knowledge has no parseable content': 'error.kb.noParseableContent',
  'source and target knowledge bases use different storage instances': 'error.kb.differentStorage',
  'Invalid metadata format': 'error.kb.invalidMetadata',
  'Invalid enable_multimodel format': 'error.kb.invalidMultimodel',
  'Invalid process_config format': 'error.kb.invalidProcessConfig',
  'missing search keyword: pass ?keyword=... or ?query=...': 'error.kb.missingKeyword',
  'No textual content was extractable from this document.': 'error.kb.noTextualContent',
  'No textual content was extractable from this document': 'error.kb.noTextualContent',
  'SUMMARY: No textual content was extractable from this document.': 'error.kb.noTextualContent',
  'SUMMARY: No textual content was extractable from this document': 'error.kb.noTextualContent',
  'failed to get knowledge batch': 'error.kb.fetchBatchFailed',
  'Failed to enqueue batch reparse task': 'error.kb.enqueueReparseFailed',
  'Failed to enqueue batch delete task': 'error.kb.enqueueDeleteFailed',
  'knowledge has an unfinished move; retry the move first': 'error.kb.unfinishedMove',
  'Internal server error': 'error.kb.serverError',
  '无权访问该知识库': 'error.kb.noPermissionAccessKb',
  '无权修改该知识库': 'error.kb.noPermissionModifyKb',
  '无权操作该 FAQ 条目': 'error.kb.faqNoPermission',
  'FAQ 知识库不支持文件上传，请使用 FAQ 导入功能': 'error.kb.faqUploadUnsupported',
  'FAQ 条目不属于当前知识库': 'error.kb.faqEntryNotInKb',
  'FAQ 文档不属于当前知识库': 'error.kb.faqDocNotInKb',
  '标签不属于当前知识库': 'error.kb.tagNotInKb',
  'FAQ 条目不能为空': 'error.kb.faqEntryEmpty',
  'invalid display status, must be \'open\' or \'close\'': 'error.kb.invalidDisplayStatus',
  'chunk does not belong to its knowledge document': 'error.kb.chunkNotInDocument',
  'image child does not belong to its document': 'error.kb.chunkNotInDocument',
  'knowledge does not belong to its knowledge base': 'error.kb.knowledgeNotInKb',
  'knowledge outside target KB': 'error.kb.knowledgeNotInKb',
  'some knowledge IDs are not accessible in the authorized scope': 'error.kb.permissionDeniedKnowledge',
}

const PARSE_STATUS_I18N: Record<string, string> = {
  failed: 'knowledgeBase.statusFailed',
  pending: 'knowledgeBase.statusProcessing',
  processing: 'knowledgeBase.statusProcessing',
  finalizing: 'knowledgeBase.statusFinalizing',
  completed: 'knowledgeBase.statusCompleted',
  cancelled: 'knowledgeBase.statusCancelled',
  draft: 'knowledgeBase.statusDraft',
}

type Translate = (key: string, params?: Record<string, string>) => string

type PatternRule = {
  test: RegExp
  key: string
  params?: (match: RegExpExecArray, translate: Translate) => Record<string, string>
}

const BACKEND_ERROR_PATTERNS: PatternRule[] = [
  {
    test: /^(?:Knowledge item|knowledge) .+ is not in completed status \(current: ([^)]+)\)$/,
    key: 'error.kb.moveNotCompleted',
    params: (match, translate) => ({
      status: localizeParseStatus(match[1], translate),
    }),
  },
  {
    test: /^reuse_vectors move across different vector stores is not supported/,
    key: 'error.kb.moveReuseAcrossStores',
  },
  {
    test: /^source and target knowledge bases use different vector stores/,
    key: 'error.kb.moveReuseAcrossStores',
  },
  {
    test: /^Knowledge item .+ not found$/,
    key: 'error.kb.knowledgeItemNotFound',
  },
  {
    test: /^Knowledge item .+ does not belong to the source knowledge base$/,
    key: 'error.kb.knowledgeNotInSource',
  },
  {
    test: /^Knowledge .+ does not belong to knowledge base .+$/,
    key: 'error.kb.knowledgeNotInKb',
  },
  {
    test: /^too many ids \(max (\d+) per batch\)$/,
    key: 'error.kb.tooManyIds',
    params: (match) => ({ max: match[1] }),
  },
  {
    test: /^文件大小不能超过(\d+)MB$/,
    key: 'error.kb.fileTooLarge',
    params: (match) => ({ size: match[1] }),
  },
  {
    test: /^unknown move mode: .+$/,
    key: 'error.kb.unknownMoveMode',
  },
  {
    test: /^Invalid request parameters(?:: .+)?$/,
    key: 'error.kb.invalidRequest',
  },
  {
    test: /^invalid (?:start|end)_time: .+$/,
    key: 'error.kb.invalidTimeRange',
  },
  {
    test: /^(?:tag|node name|relation node1|relation node2|relation type) cannot be empty at index \d+$/,
    key: 'error.kb.graphInvalid',
  },
  {
    test: /^duplicate node name: .+$/,
    key: 'error.kb.graphInvalid',
  },
  {
    test: /^relation references non-existent node[12]: .+$/,
    key: 'error.kb.graphInvalid',
  },
  {
    test: /^(?:SUMMARY:\s*)?No textual content was extractable from this document\.?$/,
    key: 'error.kb.noTextualContent',
  },
]

function localizeParseStatus(status: string, translate: Translate): string {
  const key = PARSE_STATUS_I18N[status.trim().toLowerCase()]
  if (!key) return status
  const localized = translate(key)
  return !localized || localized === key ? status : localized
}

function translateKnown(message: string, translate: Translate): string | undefined {
  const exactKey = BACKEND_ERROR_I18N_KEYS[message]
  if (exactKey) {
    const localized = translate(exactKey)
    if (localized && localized !== exactKey) return localized
  }

  for (const rule of BACKEND_ERROR_PATTERNS) {
    const match = rule.test.exec(message)
    if (!match) continue
    const localized = translate(rule.key, rule.params?.(match, translate))
    if (localized && localized !== rule.key) return localized
  }
  return undefined
}

export function localizeBackendErrorMessage(
  message: string | undefined,
  translate: Translate,
): string | undefined {
  if (!message) return message
  const trimmed = message.trim()
  return translateKnown(trimmed, translate) ?? message
}
