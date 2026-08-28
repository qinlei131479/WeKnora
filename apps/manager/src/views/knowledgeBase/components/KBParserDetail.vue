<template>
  <div class="kb-parser-settings">
    <div v-if="loading" class="loading-inline">
      <div v-loading size="small" />
      <span>{{ $t('component.kbSettings.parser.loading') }}</span>
    </div>

    <div v-else-if="fileTypeGroups.length === 0" class="empty-hint">
      <p>{{ $t('component.kbSettings.parser.noEngineAvailable') }}</p>
    </div>

    <div v-else class="settings-group">
      <div v-for="group in fileTypeGroups" :key="group.key" class="setting-row">
        <div class="setting-info">
          <label class="group-label">
            <!-- <el-icon v-if="!embedded" :name="group.icon" class="group-icon" /> -->
            {{ group.label }}
          </label>
          <div class="ext-tags">
            <span v-for="ext in group.extensions" :key="ext" class="ext-tag">.{{ ext }}</span>
          </div>
        </div>
        <div class="setting-control">
          <div class="parser-control-stack">
            <!-- <el-select
              :value="getEngineForGroup(group.extensions) || undefined"
              @change="(val: string) => handleEngineChange(group.extensions, val)"
              :style="{ width: '280px' }"
              :placeholder="$t('component.kbSettings.parser.noEngine')"
              :popper-options="{ overlayInnerStyle: { maxHeight: '240px' } }"
            >
              <el-option v-for="opt in getEngineOptions(group.extensions)" :key="opt.value" :value="opt.value" :label="opt.selectLabel" />
            </el-select> -->
            <span> {{ getDefaultEngineLabel(group.extensions) }}</span>
            <!-- <el-checkbox
              v-if="group.extensions.includes('xlsx') && getEngineForGroup(group.extensions) === 'builtin'"
              class="xlsx-header-option"
              :checked="getXLSXFirstRowAsHeader(group.extensions)"
              disabled
            >
              {{ $t('component.kbSettings.parser.xlsxFirstRowAsHeader') }}
            </el-checkbox> -->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import { getParserEngineListApi } from '@/api/data/system';
import { ParserEngineEntity } from '@/types';
import { useI18n } from 'vue-i18n';
// import { type ParserEngineInfo } from '@/api/system'
// import { useEditorResourcesStore } from '@/stores/editorResources'
// import { useUIStore } from '@/stores/ui'
// import { storeToRefs } from 'pinia'

const { t } = useI18n();
// const editorResources = useEditorResourcesStore()

function getEngineDisplayName(engineName: string): string {
  const key = `component.kbSettings.parser.engines.${engineName}.name`;
  const translated = t(key);
  return translated !== key ? translated : engineName;
}

interface ParserEngineInfo {}
export interface ParserEngineRule {
  file_types: string[];
  engine: string;
  xlsx_first_row_as_header?: boolean;
}

interface EngineOption {
  value: string;
  selectLabel: string;
  isDefault: boolean;
}

function buildOptionLabel(name: string, isDefault: boolean): string {
  const label = getEngineDisplayName(name);
  return isDefault ? `${label} (${t('component.kbSettings.parser.default')})` : label;
}

interface Props {
  parserEngineRules?: ParserEngineRule[];
  /** Compact layout for upload-confirm dialog */
  embedded?: boolean;
  /** When set, only show file-type groups matching these extensions */
  relevantExtensions?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  parserEngineRules: () => [],
  embedded: false,
  relevantExtensions: () => []
});

const emit = defineEmits<{
  'update:parserEngineRules': [value: ParserEngineRule[]];
}>();

// const uiStore = useUIStore()
const localEngineRules = ref<ParserEngineRule[]>([...props.parserEngineRules]) as { value: ParserEngineRule[] };
const parserEngines = ref<ParserEngineEntity[]>([]) as { value: ParserEngineEntity[] };
const loading = ref(true);

const allFileTypes = computed(() => {
  const s = new Set<string>();
  for (const engine of parserEngines.value) {
    for (const ft of engine.fileTypes || []) {
      s.add(ft);
    }
  }
  return s;
});

const fileTypeGroups = computed(() => {
  const ft = allFileTypes.value;
  const groups: { key: string; label: string; icon: string; extensions: string[] }[] = [];

  const pdfExts = ['pdf'].filter((e) => ft.has(e));
  const officeExts = ['docx', 'doc'].filter((e) => ft.has(e));
  const pptExts = ['pptx', 'ppt'].filter((e) => ft.has(e));
  const excelExts = ['xlsx', 'xls'].filter((e) => ft.has(e));
  const ebookExts = ['epub'].filter((e) => ft.has(e));
  const webArchiveExts = ['mhtml'].filter((e) => ft.has(e));
  const csvExts = ['csv'].filter((e) => ft.has(e));
  const mdExts = ['md', 'markdown'].filter((e) => ft.has(e));
  const txtExts = ['txt'].filter((e) => ft.has(e));
  const jsonExts = ['json'].filter((e) => ft.has(e));
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp'].filter((e) => ft.has(e));
  const audioExts = ['mp3', 'wav', 'm4a', 'flac', 'ogg'].filter((e) => ft.has(e));
  const audiovisualExts = [...audioExts];

  if (pdfExts.length) groups.push({ key: 'pdf', label: t('component.kbSettings.parser.fileTypePdf'), icon: 'file-pdf', extensions: pdfExts });
  if (officeExts.length)
    groups.push({ key: 'office', label: t('component.kbSettings.parser.fileTypeWord'), icon: 'file-word', extensions: officeExts });
  if (pptExts.length) groups.push({ key: 'ppt', label: t('component.kbSettings.parser.fileTypePpt'), icon: 'file-powerpoint', extensions: pptExts });
  if (excelExts.length)
    groups.push({ key: 'excel', label: t('component.kbSettings.parser.fileTypeExcel'), icon: 'file-excel', extensions: excelExts });
  if (ebookExts.length) groups.push({ key: 'ebook', label: t('component.kbSettings.parser.fileTypeEbook'), icon: 'file', extensions: ebookExts });
  if (webArchiveExts.length)
    groups.push({ key: 'webarchive', label: t('component.kbSettings.parser.fileTypeWebArchive'), icon: 'file', extensions: webArchiveExts });
  if (csvExts.length) groups.push({ key: 'csv', label: t('component.kbSettings.parser.fileTypeCsv'), icon: 'file-excel', extensions: csvExts });
  if (mdExts.length) groups.push({ key: 'markdown', label: 'Markdown', icon: 'file-code', extensions: mdExts });
  if (txtExts.length) groups.push({ key: 'text', label: t('component.kbSettings.parser.fileTypeText'), icon: 'file', extensions: txtExts });
  if (jsonExts.length) groups.push({ key: 'json', label: t('component.kbSettings.parser.fileTypeJson'), icon: 'file-code', extensions: jsonExts });
  if (imageExts.length) groups.push({ key: 'image', label: t('component.kbSettings.parser.fileTypeImage'), icon: 'image', extensions: imageExts });
  if (audiovisualExts.length) {
    groups.push({
      key: 'audiovisual',
      label: t('component.kbSettings.parser.fileTypeAudiovisual'),
      icon: 'sound',
      extensions: audiovisualExts
    });
  }

  // Keep the UI driven by the backend registry. New parser plugins can expose
  // file types without requiring another frontend release; known families get
  // friendly labels above and everything else gets a compact dynamic row.
  const grouped = new Set(groups.flatMap((group) => group.extensions));
  for (const ext of [...ft].filter((ext) => !grouped.has(ext) && ext !== 'url').sort()) {
    groups.push({ key: `dynamic-${ext}`, label: ext.toUpperCase(), icon: 'file-code', extensions: [ext] });
  }

  const rel = props.relevantExtensions;
  if (!rel?.length) return groups;
  const relSet = new Set(rel);
  const filtered = groups.filter((g) => g.extensions.some((e) => relSet.has(e)));
  return filtered.length > 0 ? filtered : groups;
});

function getEngineOptions(extensions: string[]): EngineOption[] {
  const raw: { name: string; desc: string; fileTypes: string[]; available: boolean; reason: string }[] = [];
  for (const engine of parserEngines.value) {
    const supports = extensions.some((ext) => (engine.fileTypes || []).includes(ext));
    if (supports) {
      raw.push({
        name: engine.name,
        desc: engine.description || engine.name,
        fileTypes: engine.fileTypes || [],
        available: engine.available !== false,
        reason: engine.unavailableReason || ''
      });
    }
  }
  const defaultName = raw.find((e) => e.available)?.name ?? '';
  return raw
    .filter((e) => e.available)
    .map((e) => ({
      value: e.name,
      selectLabel: buildOptionLabel(e.name, defaultName !== '' && e.name === defaultName),
      isDefault: defaultName !== '' && e.name === defaultName
    }));
}

function hasAvailableEngine(extensions: string[]): boolean {
  return getEngineOptions(extensions).length > 0;
}

function getDefaultEngineLabel(extensions: string[]): string {
  const opts = getEngineOptions(extensions);
  return opts.find((o) => o.isDefault)?.selectLabel ?? '';
}

function getDefaultEngine(extensions: string[]): string {
  const opts = getEngineOptions(extensions);
  return opts.find((o) => o.isDefault)?.value ?? '';
}

function getEngineForGroup(extensions: string[]): string {
  for (const rule of localEngineRules.value) {
    if (rule.file_types.some((ft: string) => extensions.includes(ft))) {
      return rule.engine;
    }
  }
  return getDefaultEngine(extensions);
}

function handleEngineChange(extensions: string[], engine: string) {
  const currentRule = getRuleForGroup(extensions);
  const otherRules = localEngineRules.value.filter((r: ParserEngineRule) => !r.file_types.some((ft) => extensions.includes(ft)));
  if (engine) {
    otherRules.push({
      file_types: [...extensions],
      engine,
      ...(currentRule?.xlsx_first_row_as_header !== undefined ? { xlsx_first_row_as_header: currentRule.xlsx_first_row_as_header } : {})
    });
  }
  localEngineRules.value = otherRules;
  emit('update:parserEngineRules', buildCompleteRules());
}

function getRuleForGroup(extensions: string[]): ParserEngineRule | undefined {
  return localEngineRules.value.find((rule: ParserEngineRule) => rule.file_types.some((fileType) => extensions.includes(fileType)));
}

function getXLSXFirstRowAsHeader(extensions: string[]): boolean {
  return getRuleForGroup(extensions)?.xlsx_first_row_as_header === true;
}

function handleXLSXFirstRowAsHeaderChange(extensions: string[], checked: boolean) {
  const rules = buildCompleteRules();
  const rule = rules.find((item) => item.file_types.some((fileType) => extensions.includes(fileType)));
  if (!rule) return;

  rule.xlsx_first_row_as_header = checked;
  localEngineRules.value = rules;
  emit('update:parserEngineRules', rules);
}

function buildCompleteRules(): ParserEngineRule[] {
  const rules: ParserEngineRule[] = [];
  for (const group of fileTypeGroups.value) {
    const engine = getEngineForGroup(group.extensions);
    if (engine) {
      const currentRule = getRuleForGroup(group.extensions);
      rules.push({
        file_types: [...group.extensions],
        engine,
        ...(currentRule?.xlsx_first_row_as_header !== undefined ? { xlsx_first_row_as_header: currentRule.xlsx_first_row_as_header } : {})
      });
    }
  }
  return rules;
}

function goToParserSettings() {
  // uiStore.openSettings('parser');
}

async function loadEngines(force = false) {
  loading.value = true;
  try {
    // await editorResources.ensureParserEngines(force);
    // parserEngines.value = editorResources.parserEngines as ParserEngineInfo[];
    const res = await getParserEngineListApi();
    parserEngines.value = res.data?.engines || [];
  } catch {
    parserEngines.value = [];
  } finally {
    loading.value = false;
    ensureCompleteRules();
  }
}

function ensureCompleteRules() {
  // console.log('ensureCompleteRules');
  if (!parserEngines.value.length) return;
  const complete = buildCompleteRules();
  if (complete.length && complete.length > localEngineRules.value.length) {
    localEngineRules.value = complete;
    emit('update:parserEngineRules', complete);
  }
}

onMounted(loadEngines);

// const { showSettingsModal } = storeToRefs(uiStore);
// watch(showSettingsModal, (open, wasOpen) => {
//   if (wasOpen && !open) {
//     loadEngines(true);
//   }
// });

watch(
  () => props.parserEngineRules,
  (v: any[]) => {
    localEngineRules.value = v?.length ? [...v] : [];
  },
  { deep: true }
);
</script>

<style scoped lang="scss">
.kb-parser-settings {
  width: 100%;
}

.section-header {
  margin-bottom: 20px;

  h2 {
    font-size: 20px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin: 0 0 6px 0;
  }

  .section-description {
    font-size: 14px;
    color: var(--el-text-color-regular);
    margin: 0;
    line-height: 1.5;
  }
}

.loading-inline {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 0;
}

.empty-hint {
  padding: 24px 0;
  color: var(--el-text-color-regular);
}

.settings-group {
  display: flex;
  flex-direction: column;
  gap: 0;

  border: 1px solid #e3d6d6;
  border-radius: 12px;
  padding: 0 20px;
}

.setting-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid var(--el-border-color);

  &:last-child {
    border-bottom: none;
  }
}

.setting-info {
  flex: 0 0 65%;
  max-width: 65%;
  padding-right: 24px;

  display: flex;
  align-items: center;
  gap: 20px;

  .group-label {
    // display: flex;
    // align-items: center;
    // gap: 6px;
    width: 100px;
    text-align: center;
  }

  .group-icon {
    font-size: 18px;
    color: var(--el-text-color-regular);
    flex-shrink: 0;
  }

  label {
    font-size: 15px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    display: block;
    margin-bottom: 4px;
  }

  .ext-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    // margin-top: 6px;
  }

  .ext-tag {
    display: inline-block;
    font-size: 12px;
    line-height: 1;
    color: var(--el-text-color-regular);
    background: var(--el-fill-color-lighter);
    padding: 3px 8px;
    border-radius: 4px;
    font-family: var(Consolas, Monaco, monospace);
  }

  .desc {
    font-size: 13px;
    color: var(--el-text-color-regular);
    margin: 0;
    line-height: 1.5;
  }
}

.setting-control {
  flex: 0 0 30%;
  max-width: 30%;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.parser-control-stack {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
  width: 280px;
}

.xlsx-header-option {
  align-self: stretch;

  :deep(.t-checkbox) {
    align-items: flex-start;
  }

  :deep(.t-checkbox__label) {
    font-size: 12px;
    line-height: 1.5;
    text-align: left;
    white-space: normal;
  }
}

.no-engine-warning {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-color-warning);
  line-height: 1.4;

  .go-settings {
    color: var(--el-color-primary);
    cursor: pointer;
    white-space: nowrap;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
