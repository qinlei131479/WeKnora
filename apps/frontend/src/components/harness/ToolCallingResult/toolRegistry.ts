import {
  BookOpen,
  Bot,
  Calculator,
  CheckSquare,
  Database,
  FileEdit,
  FilePen,
  FileText,
  Folder,
  FolderOutput,
  FolderSearch,
  Globe,
  HelpCircle,
  Image,
  Network,
  RefreshCw,
  SquareTerminal
} from 'lucide-vue-next'

export const TOOL_ICON_MAP = {
  ask_user_question: HelpCircle,
  bash: SquareTerminal,
  calculator: Calculator,
  cmd: SquareTerminal,
  edit_file: FilePen,
  execute: SquareTerminal,
  find_kb_document: FolderSearch,
  get_mindmap: Network,
  glob: FolderSearch,
  grep: FolderSearch,
  list_directory: Folder,
  list_kbs: BookOpen,
  ls: Folder,
  mysql_describe_table: Database,
  mysql_list_tables: Database,
  mysql_query: Database,
  ocr_parse_file: FileText,
  open_kb_document: FileText,
  present_artifacts: FolderOutput,
  query_kb: BookOpen,
  read_file: FileText,
  replace: FilePen,
  run_shell_command: SquareTerminal,
  search_file: FolderSearch,
  search_file_content: FolderSearch,
  subagent_await: Bot,
  subagent_cancel: Bot,
  subagent_events: RefreshCw,
  subagent_start: Bot,
  subagent_status: RefreshCw,
  task: Bot,
  web_search: Globe,
  tavily_search: Globe,
  doubao_search: Globe,
  text_to_img_qwen_image: Image,
  write_file: FileEdit,
  write_todos: CheckSquare
}

// Keep intentionally hidden tool calls centralized so group summaries and renderers stay consistent.
export const HIDDEN_TOOL_CALL_IDS = ['present_artifacts']

interface ToolCallFunction {
  name?: string
  arguments?: string | Record<string, unknown>
}

interface ToolCall {
  id?: string | number
  name?: string
  function?: ToolCallFunction
  args?: string | Record<string, unknown>
  result?: unknown
  tool_call_result?: { content?: unknown }
}

interface SubagentRunLike {
  subagent_name?: string
  subagent_slug?: string
}

interface SubagentOptionLike {
  name?: string
}

interface EnrichOptions {
  subagentRunById?: Map<string, SubagentRunLike>
  subagentRunByThreadId?: Map<string, SubagentRunLike>
  subagentOptionBySlug?: Map<string, SubagentOptionLike>
}

interface NormalizeOptions {
  includeHidden?: boolean
  mapToolCall?: (toolCall: ToolCall) => ToolCall
}

export const getToolCallId = (toolCall: ToolCall | null | undefined): string =>
  toolCall?.name || toolCall?.function?.name || ''

export const isHiddenToolCall = (toolCall: ToolCall | null | undefined): boolean =>
  HIDDEN_TOOL_CALL_IDS.includes(getToolCallId(toolCall))

export const isValidToolCall = (toolCall: ToolCall | null | undefined): boolean => {
  return Boolean(
    toolCall &&
    (toolCall.id || toolCall.name || toolCall.function?.name) &&
    (toolCall.args !== undefined ||
      toolCall.function?.arguments !== undefined ||
      toolCall.tool_call_result !== undefined)
  )
}

export const parseToolCallArgs = (toolCall: ToolCall | null | undefined): Record<string, any> => {
  const args = toolCall?.args ?? toolCall?.function?.arguments
  if (!args) return {}
  if (typeof args === 'object') return args
  try {
    return JSON.parse(args)
  } catch {
    return {}
  }
}

export const SUBAGENT_TOOL_IDS = [
  'task',
  'subagent_start',
  'subagent_status',
  'subagent_events',
  'subagent_cancel',
  'subagent_await'
]

export const isSubagentToolCall = (toolCall: ToolCall | null | undefined): boolean =>
  SUBAGENT_TOOL_IDS.includes(getToolCallId(toolCall))

export const parseToolCallResult = (toolCall: ToolCall | null | undefined): Record<string, any> | null => {
  const content = toolCall?.tool_call_result?.content ?? toolCall?.result
  if (!content) return null
  if (typeof content === 'object') return content as Record<string, any>
  try {
    return JSON.parse(content as string)
  } catch {
    return null
  }
}

export const enrichSubagentToolCall = (
  toolCall: ToolCall,
  { subagentRunById, subagentRunByThreadId, subagentOptionBySlug }: EnrichOptions = {}
) => {
  if (!isSubagentToolCall(toolCall)) return toolCall

  const args = parseToolCallArgs(toolCall)
  const result = parseToolCallResult(toolCall)
  const subagentRun =
    (toolCall.id ? subagentRunById?.get?.(String(toolCall.id)) : null) ||
    (result?.run_id ? subagentRunById?.get?.(String(result.run_id)) : null) ||
    (args.thread_id ? subagentRunByThreadId?.get?.(String(args.thread_id)) : null) ||
    (result?.thread_id ? subagentRunByThreadId?.get?.(String(result.thread_id)) : null)
  const subagentOption = args.subagent_slug
    ? subagentOptionBySlug?.get?.(String(args.subagent_slug))
    : null
  const displayLabel =
    result?.subagent_name ||
    subagentRun?.subagent_name ||
    subagentOption?.name ||
    result?.subagent_slug ||
    subagentRun?.subagent_slug ||
    undefined

  return {
    ...toolCall,
    ...(subagentRun ? { subagent_run: subagentRun } : {}),
    ...(displayLabel ? { display_label: displayLabel } : {})
  }
}

export const normalizeToolCalls = (
  toolCalls: unknown,
  { includeHidden = false, mapToolCall }: NormalizeOptions = {}
): ToolCall[] => {
  if (!Array.isArray(toolCalls)) return []

  return toolCalls
    .filter((toolCall) => {
      if (!isValidToolCall(toolCall)) return false
      return includeHidden || !isHiddenToolCall(toolCall)
    })
    .map((toolCall) => (mapToolCall ? mapToolCall(toolCall) : toolCall))
}

export const enrichTaskToolCalls = (toolCalls: unknown, options: EnrichOptions = {}): ToolCall[] =>
  normalizeToolCalls(toolCalls, {
    mapToolCall: (toolCall) => enrichSubagentToolCall(toolCall, options)
  })

export const getToolIcon = (toolId: string | undefined) =>
  TOOL_ICON_MAP[toolId as keyof typeof TOOL_ICON_MAP] || null
