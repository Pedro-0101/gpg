import { api } from '../api.js';

export const tools = [
  {
    name: 'list_professionals',
    description: 'Lista todos os profissionais de um projeto',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'create_professional',
    description: 'Cadastra um novo profissional no projeto',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto' },
        name: { type: 'string', description: 'Nome completo' },
        initials: { type: 'string', description: 'Iniciais para avatar (1-4 caracteres, ex: JD)' },
        role: { type: 'string', description: 'Cargo ou função (ex: Dev Backend, Designer)' },
        hourlyCost: { type: 'number', description: 'Custo por hora em R$' },
        skills: {
          type: 'array',
          items: { type: 'string' },
          description: 'Lista de habilidades (ex: ["React", "TypeScript"])',
        },
        avatarColor: {
          type: 'number',
          description: 'Índice de cor do avatar de 0 a 7 (padrão: 0)',
        },
      },
      required: ['projectId', 'name', 'initials', 'role', 'hourlyCost'],
    },
  },
  {
    name: 'update_professional',
    description: 'Atualiza dados de um profissional (apenas os campos enviados são alterados)',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto' },
        id: { type: 'string', description: 'ID do profissional' },
        name: { type: 'string' },
        initials: { type: 'string' },
        role: { type: 'string' },
        hourlyCost: { type: 'number' },
        skills: { type: 'array', items: { type: 'string' } },
        avatarColor: { type: 'number' },
      },
      required: ['projectId', 'id'],
    },
  },
  {
    name: 'delete_professional',
    description: 'Remove um profissional do projeto (irreversível)',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID do projeto' },
        id: { type: 'string', description: 'ID do profissional' },
      },
      required: ['projectId', 'id'],
    },
  },
];

export async function handle(name: string, args: Record<string, unknown>) {
  const { projectId, id, ...body } = args;
  const base = `/projects/${projectId}/professionals`;

  switch (name) {
    case 'list_professionals':
      return api('GET', base);

    case 'create_professional':
      return api('POST', base, body);

    case 'update_professional':
      return api('PATCH', `${base}/${id}`, body);

    case 'delete_professional':
      return api('DELETE', `${base}/${id}`);
  }
}
