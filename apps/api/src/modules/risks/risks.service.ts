import { CreateRiskDto, UpdateRiskDto } from '@gpg/shared';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../lib/app-error';

export async function findAll(projectId: string) {
  return prisma.risk.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function create(projectId: string, data: CreateRiskDto) {
  return prisma.risk.create({
    data: {
      ...data,
      projectId,
    },
  });
}

export async function update(id: string, projectId: string, data: UpdateRiskDto) {
  const risk = await prisma.risk.findFirst({ where: { id, projectId } });
  if (!risk) throw new AppError(404, 'Risco não encontrado');
  
  return prisma.risk.update({
    where: { id },
    data,
  });
}

export async function remove(id: string, projectId: string) {
  const risk = await prisma.risk.findFirst({ where: { id, projectId } });
  if (!risk) throw new AppError(404, 'Risco não encontrado');
  
  return prisma.risk.delete({ where: { id } });
}
