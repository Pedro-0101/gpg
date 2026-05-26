import { api } from '../api.js';

export const tools = [
  {
    name: 'list_teams',
    description: 'Lista todas as equipes de um projeto com seus profissionais',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'get_team',
    description: 'Retorna uma equipe com seus profissionais',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto' },
        id: { type: 'string', description: 'ID da equipe' },
      },
      required: ['projectId', 'id'],
    },
  },
  {
    name: 'create_team',
    description: 'Cria uma nova equipe no projeto, opcionalmente já com profissionais',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto' },
        name: { type: 'string', description: 'Nome da equipe' },
        professionals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              professionalId: { type: 'string', description: 'ID do profissional' },
            },
            required: ['professionalId'],
          },
          description: 'Profissionais a incluir na equipe (opcional)',
        },
      },
      required: ['projectId', 'name'],
    },
  },
  {
    name: 'update_team',
    description: 'Atualiza nome ou lista de profissionais de uma equipe (professionals substitui a lista completa)',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto' },
        id: { type: 'string', description: 'ID da equipe' },
        name: { type: 'string' },
        professionals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              professionalId: { type: 'string' },
            },
            required: ['professionalId'],
          },
          description: 'Nova lista completa de profissionais da equipe',
        },
      },
      required: ['projectId', 'id'],
    },
  },
  {
    name: 'delete_team',
    description: 'Remove uma equipe do projeto (irreversível)',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto' },
        id: { type: 'string', description: 'ID da equipe' },
      },
      required: ['projectId', 'id'],
    },
  },
];

export async function handle(name: string, args: Record<string, unknown>) {
  const { projectId, id, ...body } = args;
  const base = `/projects/${projectId}/teams`;

  switch (name) {
    case 'list_teams':
      return api('GET', base);

    case 'get_team':
      return api('GET', `${base}/${id}`);

    case 'create_team':
      return api('POST', base, body);

    case 'update_team':
      return api('PATCH', `${base}/${id}`, body);

    case 'delete_team':
      return api('DELETE', `${base}/${id}`);
  }
}
