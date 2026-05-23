import { CreateProfessionalDto, UpdateProfessionalDto } from '@gpg/shared';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../lib/app-error';

export async function findAll(projectId: string) {
  return prisma.professional.findMany({
    where: { projectId },
    orderBy: { role: 'asc' },
  });
}

export async function findById(id: string, projectId: string) {
  const p = await prisma.professional.findFirst({ where: { id, projectId } });
  if (!p) throw new AppError(404, 'Profissional não encontrado');
  return p;
}

export async function create(projectId: string, data: CreateProfessionalDto) {
  return prisma.professional.create({ data: { ...data, projectId } });
}

export async function update(id: string, projectId: string, data: UpdateProfessionalDto) {
  await findById(id, projectId);
  return prisma.professional.update({ where: { id }, data });
}

export async function remove(id: string, projectId: string) {
  await findById(id, projectId);
  return prisma.professional.delete({ where: { id } });
}
