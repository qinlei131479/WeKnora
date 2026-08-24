import { useI18n } from 'vue-i18n';

export interface KBChunkStrategyOption {
  label: string;
  value: string;
  tooltip: string;
}

export function getKBChunkStrategyOptions(): KBChunkStrategyOption[] {
  const { t } = useI18n();
  return [
    {
      label: t('component.knowledgeEditor.chunking.strategies.auto.label'),
      value: 'auto',
      tooltip: t('component.knowledgeEditor.chunking.strategies.auto.tooltip')
    },
    {
      label: t('component.knowledgeEditor.chunking.strategies.heading.label'),
      value: 'heading',
      tooltip: t('component.knowledgeEditor.chunking.strategies.heading.tooltip')
    },
    {
      label: t('component.knowledgeEditor.chunking.strategies.heuristic.label'),
      value: 'heuristic',
      tooltip: t('component.knowledgeEditor.chunking.strategies.heuristic.tooltip')
    },
    {
      label: t('component.knowledgeEditor.chunking.strategies.legacy.label'),
      value: 'legacy',
      tooltip: t('component.knowledgeEditor.chunking.strategies.legacy.tooltip')
    }
  ];
}

export function getKBChunkStrategyOptionLabel(strategy: string): string {
  if (!strategy) {
    return '';
  }
  const { t } = useI18n();
  return t(`component.knowledgeEditor.chunking.strategies.${strategy}.label`);
}
