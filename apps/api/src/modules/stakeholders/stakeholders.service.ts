import { CreateStakeholderDto, UpdateStakeholderDto } from '@gpg/shared';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../lib/app-error';

export async function findAll(projectId: string) {
  return prisma.stakeholder.findMany({
    where: { projectId },
    orderBy: { name: 'asc' },
  });
}

export async function findById(id: string, projectId: string) {
  const s = await prisma.stakeholder.findFirst({ where: { id, projectId } });
  if (!s) throw new AppError(404, 'Stakeholder não encontrado');
  return s;
}

export async function create(projectId: string, data: CreateStakeholderDto) {
  return prisma.stakeholder.create({ data: { ...data, projectId } });
}

export async function update(id: string, projectId: string, data: UpdateStakeholderDto) {
  await findById(id, projectId);
  return prisma.stakeholder.update({ where: { id }, data });
}

export async function remove(id: string, projectId: string) {
  await findById(id, projectId);
  return prisma.stakeholder.delete({ where: { id } });
}
