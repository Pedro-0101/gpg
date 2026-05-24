import { CreateDecisionDto, UpdateDecisionDto } from '@gpg/shared';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../lib/app-error';

export async function findAll(projectId: string) {
  return prisma.decision.findMany({
    where: { projectId },
    include: { member: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function findById(id: string, projectId: string) {
  const d = await prisma.decision.findFirst({
    where: { id, projectId },
    include: { member: true },
  });
  if (!d) throw new AppError(404, 'Decisão não encontrada');
  return d;
}

export async function create(projectId: string, data: CreateDecisionDto) {
  return prisma.decision.create({
    data: { ...data, projectId },
    include: { member: true },
  });
}

export async function update(id: string, projectId: string, data: UpdateDecisionDto) {
  await findById(id, projectId);
  return prisma.decision.update({
    where: { id },
    data,
    include: { member: true },
  });
}

export async function remove(id: string, projectId: string) {
  await findById(id, projectId);
  return prisma.decision.delete({ where: { id } });
}
