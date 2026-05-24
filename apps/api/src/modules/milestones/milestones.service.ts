import { CreateMilestoneDto, UpdateMilestoneDto } from '@gpg/shared';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../lib/app-error';

export async function findAll(projectId: string) {
  return prisma.milestone.findMany({
    where: { projectId },
    include: { stage: true },
    orderBy: { date: 'asc' },
  });
}

export async function create(projectId: string, data: CreateMilestoneDto) {
  return prisma.milestone.create({
    data: {
      ...data,
      projectId,
    },
    include: { stage: true },
  });
}

export async function update(id: string, projectId: string, data: UpdateMilestoneDto) {
  const milestone = await prisma.milestone.findFirst({ where: { id, projectId } });
  if (!milestone) throw new AppError(404, 'Marco não encontrado');
  
  return prisma.milestone.update({
    where: { id },
    data,
    include: { stage: true },
  });
}

export async function remove(id: string, projectId: string) {
  const milestone = await prisma.milestone.findFirst({ where: { id, projectId } });
  if (!milestone) throw new AppError(404, 'Marco não encontrado');
  
  return prisma.milestone.delete({ where: { id } });
}
