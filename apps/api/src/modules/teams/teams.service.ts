import { CreateTeamDto, UpdateTeamDto } from '@gpg/shared';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../lib/app-error';

export async function findAll(projectId: string) {
  const teams = await prisma.team.findMany({
    where: { projectId },
    orderBy: { name: 'asc' },
    include: {
      professionals: {
        include: { professional: true },
      },
    },
  });

  return teams.map((t: typeof teams[number]) => ({
    ...t,
    totalCost: t.professionals.reduce(
      (sum: number, tp: { professional: { hourlyCost: number | string | object }; quantity: number }) =>
        sum + Number(tp.professional.hourlyCost) * tp.quantity,
      0,
    ),
  }));
}

export async function findById(id: string, projectId: string) {
  const team = await prisma.team.findFirst({
    where: { id, projectId },
    include: { professionals: { include: { professional: true } } },
  });
  if (!team) throw new AppError(404, 'Equipe não encontrada');
  return {
    ...team,
    totalCost: team.professionals.reduce(
      (sum: number, tp: { professional: { hourlyCost: number | string | object }; quantity: number }) =>
        sum + Number(tp.professional.hourlyCost) * tp.quantity,
      0,
    ),
  };
}

export async function create(projectId: string, data: CreateTeamDto) {
  const { professionals, ...rest } = data;
  const team = await prisma.team.create({
    data: {
      ...rest,
      projectId,
      professionals: {
        create: professionals.map((p) => ({
          professionalId: p.professionalId,
          quantity: p.quantity,
        })),
      },
    },
    include: { professionals: { include: { professional: true } } },
  });
  return team;
}

export async function update(id: string, projectId: string, data: UpdateTeamDto) {
  await findById(id, projectId);
  const { professionals, ...rest } = data;

  if (professionals !== undefined) {
    await prisma.teamProfessional.deleteMany({ where: { teamId: id } });
  }

  return prisma.team.update({
    where: { id },
    data: {
      ...rest,
      ...(professionals !== undefined && {
        professionals: {
          create: professionals.map((p) => ({
            professionalId: p.professionalId,
            quantity: p.quantity,
          })),
        },
      }),
    },
    include: { professionals: { include: { professional: true } } },
  });
}

export async function remove(id: string, projectId: string) {
  await findById(id, projectId);
  return prisma.team.delete({ where: { id } });
}
