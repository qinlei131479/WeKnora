import { CustomAgents } from './agent/customAgents';
import { Messages } from './agent/messages';
import { Sessions } from './agent/sessions';
import { AmpParserEngines } from './data/ampParserEngines';
import { Storage } from './data/storage';
import { EmbedChannels } from './integration/embedChannels';
import { ImChannels } from './integration/imChannels';
import { Models } from './model/models';
import { Tenants } from './tenants/tenants';
import { Users } from './users/users';
import { VectorStores } from './data/vectorStores';
import { Skills } from './data/skill';
import { WebSearchProviders } from './data/webSearchProviders';

export const API = {
  CustomAgents,
  Messages,
  Models,
  Sessions,
  AmpParserEngines,
  EmbedChannels,
  ImChannels,
  Storage,
  Tenants,
  Users,
  VectorStores,
  Skills,
  WebSearchProviders
};
