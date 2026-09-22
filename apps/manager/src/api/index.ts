import { CustomAgents } from './agent/customAgents';
import { Messages } from './agent/messages';
import { Sessions } from './agent/sessions';
import { Dashboard } from './dashboard';
import { AmpBuiltinTools } from './data/ampBuiltinTools';
import { AmpParserEngines } from './data/ampParserEngines';
import { McpServices } from './data/mcpServices';
import { Storage } from './data/storage';
import { EmbedChannels } from './integration/embedChannels';
import { ImChannels } from './integration/imChannels';
import { Models } from './model/models';
import { Tenants } from './space/tenants';
import { Users } from './space/users';
import { VectorStores } from './data/vectorStores';
import { Skills } from './data/skills';
import { WebSearchProviders } from './data/webSearchProviders';

export const API = {
  AmpBuiltinTools,
  CustomAgents,
  Dashboard,
  Messages,
  McpServices,
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
