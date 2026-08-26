import { KnowledgeBaseEntity, KnowledgeBaseExtends } from '@/types';
import parseProperty from './useParseProperty';

export function parseEntity(entity: KnowledgeBaseEntity) {
  parseProperty(entity, 'asrConfig');
  parseProperty(entity, 'autoTagConfig');
  parseProperty(entity, 'chunkingConfig');
  parseProperty(entity, 'cosConfig');
  parseProperty(entity, 'imageProcessingConfig');
  parseProperty(entity, 'indexingStrategy');
  parseProperty(entity, 'questionGenerationConfig');
  parseProperty(entity, 'storageProviderConfig');
  parseProperty(entity, 'vlmConfig');
  parseProperty(entity, 'wikiConfig');
  parseProperty(entity, 'extractConfig');
  // console.log('entity', entity);
  return entity as KnowledgeBaseExtends;
}
