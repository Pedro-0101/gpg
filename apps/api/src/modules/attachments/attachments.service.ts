import { prisma } from '../../lib/prisma';
import { AppError } from '../../lib/app-error';

export async function findAll(subtopicId: string) {
  return prisma.subtopicAttachment.findMany({
    where: { subtopicId },
    orderBy: { uploadedAt: 'desc' },
  });
}

export async function create(
  subtopicId: string,
  data: { name: string; url: string; mimeType: string; size: number; isExternal?: boolean },
) {
  return prisma.subtopicAttachment.create({
    data: { ...data, subtopicId, isExternal: data.isExternal ?? true },
  });
}

export async function remove(id: string, subtopicId: string) {
  const att = await prisma.subtopicAttachment.findFirst({ where: { id, subtopicId } });
  if (!att) throw new AppError(404, 'Anexo não encontrado');
  return prisma.subtopicAttachment.delete({ where: { id } });
}
