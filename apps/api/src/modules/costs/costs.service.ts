import { CreateCostEntryDto, UpdateCostEntryDto } from '@gpg/shared';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../lib/app-error';

export async function findAll(projectId: string) {
  return prisma.costEntry.findMany({
    where: { projectId },
    include: {
      stage: true,
      member: true,
    },
    orderBy: { date: 'desc' },
  });
}

export async function create(projectId: string, data: CreateCostEntryDto) {
  return prisma.costEntry.create({
    data: {
      ...data,
      projectId,
    },
    include: {
      stage: true,
      member: true,
    },
  });
}

export async function remove(id: string, projectId: string) {
  const entry = await prisma.costEntry.findFirst({ where: { id, projectId } });
  if (!entry) throw new AppError(404, 'Lançamento não encontrado');
  
  return prisma.costEntry.delete({ where: { id } });
}

export async function getSummary(projectId: string) {
  const entries = await prisma.costEntry.findMany({
    where: { projectId },
  });

  const totalSpent = entries.reduce((acc, curr) => acc + Number(curr.amount), 0);
  
  const byCategory = entries.reduce((acc: any, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + Number(curr.amount);
    return acc;
  }, {});

  return {
    totalSpent,
    byCategory,
    count: entries.length,
  };
}
