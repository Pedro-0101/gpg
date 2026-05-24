import { CreateStageDto, UpdateStageDto } from '@gpg/shared';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../lib/app-error';
import { recalculateSchedule } from '../projects/projects.service';

export async function findAll(projectId: string) {
  return prisma.stage.findMany({
    where: { projectId },
    orderBy: { order: 'asc' },
    include: {
      topics: {
        orderBy: { order: 'asc' },
        include: {
            subtopics: {
              orderBy: { order: 'asc' },
              include: {
                team: true,
                assignments: { include: { member: true } },
              },
            },
          },
      },
      _count: { select: { topics: true } },
    },
  });
}

export async function findById(id: string, projectId: string) {
  const stage = await prisma.stage.findFirst({ where: { id, projectId } });
  if (!stage) throw new AppError(404, 'Etapa não encontrada');
  return stage;
}

export async function create(projectId: string, data: CreateStageDto) {
  const stage = await prisma.stage.create({ data: { ...data, projectId } });
  await recalculateSchedule(projectId);
  return stage;
}

export async function update(id: string, projectId: string, data: UpdateStageDto) {
  await findById(id, projectId);
  const stage = await prisma.stage.update({ where: { id }, data });
  await recalculateSchedule(projectId);
  return stage;
}

export async function remove(id: string, projectId: string) {
  await findById(id, projectId);
  await prisma.stage.delete({ where: { id } });
  // Re-sequence remaining stages
  const remaining = await prisma.stage.findMany({
    where: { projectId },
    orderBy: { order: 'asc' },
  });
  await prisma.$transaction(
    remaining.map((s: { id: string }, i: number) =>
      prisma.stage.update({ where: { id: s.id }, data: { order: i + 1 } }),
    ),
  );
  await recalculateSchedule(projectId);
}
