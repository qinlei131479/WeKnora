import { CustomAgents } from './agent/customAgents';
import { Messages } from './agent/messages';
import { Sessions } from './agent/sessions';
import { AmpParserEngines } from './data/ampParserEngines';
import { Storage } from './data/storage';
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
  Storage,
  Tenants,
  Users,
  VectorStores,
  Skills,
  WebSearchProviders
};
