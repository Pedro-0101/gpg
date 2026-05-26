import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import * as projects from './tools/projects.js';
import * as stages from './tools/stages.js';
import * as topics from './tools/topics.js';
import * as subtopics from './tools/subtopics.js';
import * as teams from './tools/teams.js';
import * as professionals from './tools/professionals.js';
import * as costs from './tools/costs.js';
import * as risks from './tools/risks.js';
import * as stakeholders from './tools/stakeholders.js';
import * as milestones from './tools/milestones.js';
import * as decisions from './tools/decisions.js';

const allTools = [
  ...projects.tools,
  ...stages.tools,
  ...topics.tools,
  ...subtopics.tools,
  ...teams.tools,
  ...professionals.tools,
  ...costs.tools,
  ...risks.tools,
  ...stakeholders.tools,
  ...milestones.tools,
  ...decisions.tools,
];

const modules = [projects, stages, topics, subtopics, teams, professionals, costs, risks, stakeholders, milestones, decisions];

const server = new Server(
  { name: 'gpg', version: '0.2.0' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: allTools }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;

  try {
    let result: unknown;

    for (const mod of modules) {
      if (mod.tools.some((t) => t.name === name)) {
        result = await mod.handle(name, (args ?? {}) as Record<string, unknown>);
        break;
      }
    }

    if (result === undefined && !allTools.some((t) => t.name === name)) {
      throw new Error(`Tool desconhecida: ${name}`);
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `Erro: ${(err as Error).message}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
