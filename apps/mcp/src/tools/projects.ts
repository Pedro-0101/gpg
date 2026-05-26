import { api } from '../api.js';

export const tools = [
  {
    name: 'list_projects',
    description: 'Lista todos os projetos com resumo de progresso e custos',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_project',
    description:
      'Retorna um projeto completo com etapas, tópicos, subtópicos, equipes, stakeholders, custos e riscos',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID do projeto' },
      },
      required: ['id'],
    },
  },
  {
    name: 'create_project',
    description: 'Cria um novo projeto',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nome do projeto' },
        description: { type: 'string' },
        startDate: { type: 'string', description: 'Data de início (ISO 8601, ex: 2026-06-01)' },
        endDate: { type: 'string', description: 'Data de término prevista' },
        dailyHours: { type: 'number', description: 'Horas de trabalho por dia (padrão: 8)' },
        status: {
          type: 'string',
          enum: ['active', 'paused', 'completed', 'cancelled'],
        },
        totalBudget: { type: 'number', description: 'Orçamento total (R$)' },
        client: { type: 'string', description: 'Nome do cliente' },
        color: { type: 'string', description: 'Cor em hex (padrão: #4F46E5)' },
      },
      required: ['name', 'startDate'],
    },
  },
  {
    name: 'update_project',
    description: 'Atualiza campos de um projeto (apenas os campos enviados são alterados)',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID do projeto' },
        name: { type: 'string' },
        description: { type: 'string' },
        startDate: { type: 'string' },
        endDate: { type: 'string' },
        dailyHours: { type: 'number' },
        status: { type: 'string', enum: ['active', 'paused', 'completed', 'cancelled'] },
        totalBudget: { type: 'number' },
        client: { type: 'string' },
        color: { type: 'string' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_project',
    description: 'Remove um projeto permanentemente (irreversível, cascata em todas as entidades)',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID do projeto' },
      },
      required: ['id'],
    },
  },
];

export async function handle(name: string, args: Record<string, unknown>) {
  switch (name) {
    case 'list_projects':
      return api('GET', '/projects/summaries');

    case 'get_project':
      return api('GET', `/projects/${args.id}`);

    case 'create_project':
      return api('POST', '/projects', args);

    case 'update_project': {
      const { id, ...body } = args;
      return api('PATCH', `/projects/${id}`, body);
    }

    case 'delete_project':
      return api('DELETE', `/projects/${args.id}`);
  }
}
