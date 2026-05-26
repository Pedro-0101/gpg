import { api } from '../api.js';

export const tools = [
  {
    name: 'list_stages',
    description: 'Lista todas as etapas de um projeto',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'create_stage',
    description: 'Cria uma nova etapa dentro de um projeto',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto' },
        name: { type: 'string', description: 'Nome da etapa' },
        order: { type: 'number', description: 'Posição da etapa (1, 2, 3...)' },
      },
      required: ['projectId', 'name', 'order'],
    },
  },
  {
    name: 'update_stage',
    description: 'Atualiza nome ou ordem de uma etapa',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto' },
        id: { type: 'string', description: 'ID da etapa' },
        name: { type: 'string' },
        order: { type: 'number' },
      },
      required: ['projectId', 'id'],
    },
  },
  {
    name: 'delete_stage',
    description: 'Remove uma etapa e todos os seus tópicos e subtópicos (irreversível)',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto' },
        id: { type: 'string', description: 'ID da etapa' },
      },
      required: ['projectId', 'id'],
    },
  },
];

export async function handle(name: string, args: Record<string, unknown>) {
  const { projectId, id, ...body } = args;
  const base = `/projects/${projectId}/stages`;

  switch (name) {
    case 'list_stages':
      return api('GET', base);

    case 'create_stage':
      return api('POST', base, body);

    case 'update_stage':
      return api('PATCH', `${base}/${id}`, body);

    case 'delete_stage':
      return api('DELETE', `${base}/${id}`);
  }
}
