import { api } from '../api.js';

export const tools = [
  {
    name: 'list_subtopics',
    description: 'Lista todos os subtópicos (tarefas) de um tópico',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto' },
        stageId: { type: 'string', description: 'ID da etapa' },
        topicId: { type: 'string', description: 'ID do tópico' },
      },
      required: ['projectId', 'stageId', 'topicId'],
    },
  },
  {
    name: 'get_subtopic',
    description: 'Retorna um subtópico completo com comentários e anexos',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto' },
        stageId: { type: 'string', description: 'ID da etapa' },
        topicId: { type: 'string', description: 'ID do tópico' },
        id: { type: 'string', description: 'ID do subtópico' },
      },
      required: ['projectId', 'stageId', 'topicId', 'id'],
    },
  },
  {
    name: 'create_subtopic',
    description: 'Cria um novo subtópico (tarefa) dentro de um tópico',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto' },
        stageId: { type: 'string', description: 'ID da etapa' },
        topicId: { type: 'string', description: 'ID do tópico' },
        name: { type: 'string', description: 'Nome da tarefa' },
        description: { type: 'string' },
        durationHours: { type: 'number', description: 'Duração em horas (inteiro, mínimo 1)' },
        isConcurrent: {
          type: 'boolean',
          description: 'Se true, executa em paralelo com o subtópico anterior (padrão: false)',
        },
        order: { type: 'number', description: 'Posição dentro do tópico (padrão: 1)' },
        teamIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'IDs das equipes responsáveis',
        },
        professionalIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'IDs dos profissionais diretamente responsáveis pela tarefa',
        },
        status: {
          type: 'string',
          enum: ['todo', 'inprog', 'review', 'done', 'blocked'],
          description: 'Status da tarefa (padrão: todo)',
        },
        progress: { type: 'number', description: 'Percentual de conclusão 0-100 (padrão: 0)' },
        spentHours: { type: 'number', description: 'Horas já gastas (padrão: 0)' },
        deadline: { type: 'string', description: 'Prazo específico (ISO 8601)' },
        taskType: {
          type: 'string',
          enum: ['task', 'milestone', 'deliverable'],
          description: 'Tipo da tarefa (padrão: task)',
        },
        priority: {
          type: 'string',
          enum: ['high', 'med', 'low'],
          description: 'Prioridade (padrão: med)',
        },
      },
      required: ['projectId', 'stageId', 'topicId', 'name', 'durationHours'],
    },
  },
  {
    name: 'update_subtopic',
    description: 'Atualiza campos de um subtópico (apenas os campos enviados são alterados)',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto' },
        stageId: { type: 'string', description: 'ID da etapa' },
        topicId: { type: 'string', description: 'ID do tópico' },
        id: { type: 'string', description: 'ID do subtópico' },
        name: { type: 'string' },
        description: { type: 'string' },
        durationHours: { type: 'number' },
        isConcurrent: { type: 'boolean' },
        order: { type: 'number' },
        teamIds: { type: 'array', items: { type: 'string' } },
        professionalIds: { type: 'array', items: { type: 'string' } },
        status: { type: 'string', enum: ['todo', 'inprog', 'review', 'done', 'blocked'] },
        progress: { type: 'number' },
        spentHours: { type: 'number' },
        deadline: { type: 'string' },
        taskType: { type: 'string', enum: ['task', 'milestone', 'deliverable'] },
        priority: { type: 'string', enum: ['high', 'med', 'low'] },
      },
      required: ['projectId', 'stageId', 'topicId', 'id'],
    },
  },
  {
    name: 'delete_subtopic',
    description: 'Remove um subtópico permanentemente (irreversível)',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto' },
        stageId: { type: 'string', description: 'ID da etapa' },
        topicId: { type: 'string', description: 'ID do tópico' },
        id: { type: 'string', description: 'ID do subtópico' },
      },
      required: ['projectId', 'stageId', 'topicId', 'id'],
    },
  },
];

export async function handle(name: string, args: Record<string, unknown>) {
  const { projectId, stageId, topicId, id, ...body } = args;
  const base = `/projects/${projectId}/stages/${stageId}/topics/${topicId}/subtopics`;

  switch (name) {
    case 'list_subtopics':
      return api('GET', base);

    case 'get_subtopic':
      return api('GET', `${base}/${id}`);

    case 'create_subtopic':
      return api('POST', base, body);

    case 'update_subtopic':
      return api('PATCH', `${base}/${id}`, body);

    case 'delete_subtopic':
      return api('DELETE', `${base}/${id}`);
  }
}
