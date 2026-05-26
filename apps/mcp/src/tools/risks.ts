import { api } from '../api.js';

export const tools = [
  {
    name: 'list_risks',
    description: 'Lista todos os riscos de um projeto',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'create_risk',
    description: 'Registra um novo risco no projeto',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto' },
        title: { type: 'string', description: 'Título do risco' },
        description: { type: 'string', description: 'Descrição detalhada' },
        probability: {
          type: 'string',
          enum: ['high', 'med', 'low'],
          description: 'Probabilidade de ocorrer (padrão: med)',
        },
        impact: {
          type: 'string',
          enum: ['high', 'med', 'low'],
          description: 'Impacto se ocorrer (padrão: med)',
        },
        status: {
          type: 'string',
          enum: ['active', 'resolved', 'accepted'],
          description: 'Status do risco (padrão: active)',
        },
        responsePlan: { type: 'string', description: 'Plano de resposta / mitigação' },
        dueDate: { type: 'string', description: 'Prazo para mitigar (ISO 8601)' },
      },
      required: ['projectId', 'title'],
    },
  },
  {
    name: 'update_risk',
    description: 'Atualiza um risco existente (apenas os campos enviados são alterados)',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto' },
        id: { type: 'string', description: 'ID do risco' },
        title: { type: 'string' },
        description: { type: 'string' },
        probability: { type: 'string', enum: ['high', 'med', 'low'] },
        impact: { type: 'string', enum: ['high', 'med', 'low'] },
        status: { type: 'string', enum: ['active', 'resolved', 'accepted'] },
        responsePlan: { type: 'string' },
        dueDate: { type: 'string' },
      },
      required: ['projectId', 'id'],
    },
  },
  {
    name: 'delete_risk',
    description: 'Remove um risco do projeto (irreversível)',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto' },
        id: { type: 'string', description: 'ID do risco' },
      },
      required: ['projectId', 'id'],
    },
  },
];

export async function handle(name: string, args: Record<string, unknown>) {
  const { projectId, id, ...body } = args;
  const base = `/projects/${projectId}/risks`;

  switch (name) {
    case 'list_risks':
      return api('GET', base);

    case 'create_risk':
      return api('POST', base, body);

    case 'update_risk':
      return api('PUT', `${base}/${id}`, body);

    case 'delete_risk':
      return api('DELETE', `${base}/${id}`);
  }
}
