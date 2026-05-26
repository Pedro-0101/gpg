import { api } from '../api.js';

export const tools = [
  {
    name: 'list_milestones',
    description: 'Lista todos os marcos de um projeto',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'create_milestone',
    description: 'Cria um novo marco no projeto',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto' },
        name: { type: 'string', description: 'Nome do marco' },
        date: { type: 'string', description: 'Data do marco (ISO 8601)' },
        status: {
          type: 'string',
          enum: ['pending', 'reached', 'missed'],
          description: 'Status do marco (padrão: pending)',
        },
        stageId: { type: 'string', description: 'ID da etapa relacionada (opcional)' },
      },
      required: ['projectId', 'name', 'date'],
    },
  },
  {
    name: 'update_milestone',
    description: 'Atualiza um marco existente (apenas os campos enviados são alterados)',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto' },
        id: { type: 'string', description: 'ID do marco' },
        name: { type: 'string' },
        date: { type: 'string' },
        status: { type: 'string', enum: ['pending', 'reached', 'missed'] },
        stageId: { type: 'string' },
      },
      required: ['projectId', 'id'],
    },
  },
  {
    name: 'delete_milestone',
    description: 'Remove um marco do projeto (irreversível)',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto' },
        id: { type: 'string', description: 'ID do marco' },
      },
      required: ['projectId', 'id'],
    },
  },
];

export async function handle(name: string, args: Record<string, unknown>) {
  const { projectId, id, ...body } = args;
  const base = `/projects/${projectId}/milestones`;

  switch (name) {
    case 'list_milestones':
      return api('GET', base);

    case 'create_milestone':
      return api('POST', base, body);

    case 'update_milestone':
      return api('PUT', `${base}/${id}`, body);

    case 'delete_milestone':
      return api('DELETE', `${base}/${id}`);
  }
}
