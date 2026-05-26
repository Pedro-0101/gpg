import { api } from '../api.js';

export const tools = [
  {
    name: 'list_topics',
    description: 'Lista todos os tópicos de uma etapa',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto' },
        stageId: { type: 'string', description: 'ID da etapa' },
      },
      required: ['projectId', 'stageId'],
    },
  },
  {
    name: 'create_topic',
    description: 'Cria um novo tópico dentro de uma etapa',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto' },
        stageId: { type: 'string', description: 'ID da etapa' },
        name: { type: 'string', description: 'Nome do tópico' },
        order: { type: 'number', description: 'Posição do tópico dentro da etapa (1, 2, 3...)' },
      },
      required: ['projectId', 'stageId', 'name', 'order'],
    },
  },
  {
    name: 'update_topic',
    description: 'Atualiza nome ou ordem de um tópico',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto' },
        stageId: { type: 'string', description: 'ID da etapa' },
        id: { type: 'string', description: 'ID do tópico' },
        name: { type: 'string' },
        order: { type: 'number' },
      },
      required: ['projectId', 'stageId', 'id'],
    },
  },
  {
    name: 'delete_topic',
    description: 'Remove um tópico e todos os seus subtópicos (irreversível)',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto' },
        stageId: { type: 'string', description: 'ID da etapa' },
        id: { type: 'string', description: 'ID do tópico' },
      },
      required: ['projectId', 'stageId', 'id'],
    },
  },
];

export async function handle(name: string, args: Record<string, unknown>) {
  const { projectId, stageId, id, ...body } = args;
  const base = `/projects/${projectId}/stages/${stageId}/topics`;

  switch (name) {
    case 'list_topics':
      return api('GET', base);

    case 'create_topic':
      return api('POST', base, body);

    case 'update_topic':
      return api('PATCH', `${base}/${id}`, body);

    case 'delete_topic':
      return api('DELETE', `${base}/${id}`);
  }
}
