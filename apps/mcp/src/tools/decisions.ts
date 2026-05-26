import { api } from '../api.js';

export const tools = [
  {
    name: 'list_decisions',
    description: 'Lista todas as decisões registradas em um projeto',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'get_decision',
    description: 'Retorna uma decisão completa pelo ID',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto' },
        id: { type: 'string', description: 'ID da decisão' },
      },
      required: ['projectId', 'id'],
    },
  },
  {
    name: 'create_decision',
    description: 'Registra uma nova decisão no projeto',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto' },
        title: { type: 'string', description: 'Título da decisão' },
        description: { type: 'string', description: 'Descrição ou justificativa' },
        status: {
          type: 'string',
          enum: ['pending', 'decided', 'cancelled'],
          description: 'Status da decisão (padrão: pending)',
        },
        dueDate: { type: 'string', description: 'Prazo para decidir (ISO 8601)' },
        professionalId: { type: 'string', description: 'ID do profissional responsável (opcional)' },
      },
      required: ['projectId', 'title'],
    },
  },
  {
    name: 'update_decision',
    description: 'Atualiza uma decisão existente (apenas os campos enviados são alterados)',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto' },
        id: { type: 'string', description: 'ID da decisão' },
        title: { type: 'string' },
        description: { type: 'string' },
        status: { type: 'string', enum: ['pending', 'decided', 'cancelled'] },
        dueDate: { type: 'string' },
        professionalId: { type: 'string' },
      },
      required: ['projectId', 'id'],
    },
  },
  {
    name: 'delete_decision',
    description: 'Remove uma decisão do projeto (irreversível)',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto' },
        id: { type: 'string', description: 'ID da decisão' },
      },
      required: ['projectId', 'id'],
    },
  },
];

export async function handle(name: string, args: Record<string, unknown>) {
  const { projectId, id, ...body } = args;
  const base = `/projects/${projectId}/decisions`;

  switch (name) {
    case 'list_decisions':
      return api('GET', base);

    case 'get_decision':
      return api('GET', `${base}/${id}`);

    case 'create_decision':
      return api('POST', base, body);

    case 'update_decision':
      return api('PATCH', `${base}/${id}`, body);

    case 'delete_decision':
      return api('DELETE', `${base}/${id}`);
  }
}
