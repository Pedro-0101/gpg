import { api } from '../api.js';

export const tools = [
  {
    name: 'list_costs',
    description: 'Lista todos os lançamentos de custo de um projeto',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'get_costs_summary',
    description: 'Retorna o resumo de custos do projeto: custo planejado, custo realizado e entradas por categoria',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'create_cost_entry',
    description: 'Lança uma entrada de custo no projeto',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto' },
        description: { type: 'string', description: 'Descrição do custo' },
        category: {
          type: 'string',
          enum: ['Pessoal', 'Ferramentas', 'Infraestrutura', 'Freelancers'],
          description: 'Categoria do custo',
        },
        amount: { type: 'number', description: 'Valor em R$' },
        stageId: { type: 'string', description: 'ID da etapa relacionada (opcional)' },
        professionalId: { type: 'string', description: 'ID do profissional relacionado (opcional)' },
        hours: { type: 'number', description: 'Horas trabalhadas relacionadas (opcional)' },
        date: { type: 'string', description: 'Data do custo em ISO 8601 (padrão: hoje)' },
      },
      required: ['projectId', 'description', 'category', 'amount'],
    },
  },
  {
    name: 'delete_cost_entry',
    description: 'Remove um lançamento de custo (irreversível)',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto' },
        id: { type: 'string', description: 'ID do lançamento' },
      },
      required: ['projectId', 'id'],
    },
  },
];

export async function handle(name: string, args: Record<string, unknown>) {
  const { projectId, id, ...body } = args;
  const base = `/projects/${projectId}/costs`;

  switch (name) {
    case 'list_costs':
      return api('GET', base);

    case 'get_costs_summary':
      return api('GET', `${base}/summary`);

    case 'create_cost_entry':
      return api('POST', base, body);

    case 'delete_cost_entry':
      return api('DELETE', `${base}/${id}`);
  }
}
