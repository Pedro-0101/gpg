import { api } from '../api.js';

export const tools = [
  {
    name: 'list_stakeholders',
    description: 'Lista todos os stakeholders de um projeto',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'create_stakeholder',
    description: 'Registra um novo stakeholder no projeto',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto' },
        name: { type: 'string', description: 'Nome do stakeholder' },
        role: { type: 'string', description: 'Papel ou função' },
        organization: { type: 'string', description: 'Organização ou empresa' },
        type: {
          type: 'string',
          enum: ['internal', 'external'],
          description: 'Tipo: interno ou externo (padrão: external)',
        },
        influence: {
          type: 'number',
          description: 'Nível de influência de 1 a 5 (padrão: 3)',
        },
        interest: {
          type: 'number',
          description: 'Nível de interesse de 1 a 5 (padrão: 3)',
        },
        engagementLevel: {
          type: 'string',
          enum: ['unaware', 'resistant', 'neutral', 'supportive', 'leading'],
          description: 'Nível de engajamento (padrão: neutral)',
        },
        contactInfo: { type: 'string', description: 'Informações de contato' },
      },
      required: ['projectId', 'name'],
    },
  },
  {
    name: 'update_stakeholder',
    description: 'Atualiza dados de um stakeholder (apenas os campos enviados são alterados)',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto' },
        id: { type: 'string', description: 'ID do stakeholder' },
        name: { type: 'string' },
        role: { type: 'string' },
        organization: { type: 'string' },
        type: { type: 'string', enum: ['internal', 'external'] },
        influence: { type: 'number' },
        interest: { type: 'number' },
        engagementLevel: {
          type: 'string',
          enum: ['unaware', 'resistant', 'neutral', 'supportive', 'leading'],
        },
        contactInfo: { type: 'string' },
      },
      required: ['projectId', 'id'],
    },
  },
  {
    name: 'delete_stakeholder',
    description: 'Remove um stakeholder do projeto (irreversível)',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto' },
        id: { type: 'string', description: 'ID do stakeholder' },
      },
      required: ['projectId', 'id'],
    },
  },
];

export async function handle(name: string, args: Record<string, unknown>) {
  const { projectId, id, ...body } = args;
  const base = `/projects/${projectId}/stakeholders`;

  switch (name) {
    case 'list_stakeholders':
      return api('GET', base);

    case 'create_stakeholder':
      return api('POST', base, body);

    case 'update_stakeholder':
      return api('PATCH', `${base}/${id}`, body);

    case 'delete_stakeholder':
      return api('DELETE', `${base}/${id}`);
  }
}
