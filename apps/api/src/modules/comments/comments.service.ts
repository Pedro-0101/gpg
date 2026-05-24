import { prisma } from '../../lib/prisma';

export async function findAll(subtopicId: string) {
  return prisma.subtopicComment.findMany({
    where: { subtopicId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function create(subtopicId: string, data: { authorName: string, content: string }) {
  return prisma.subtopicComment.create({
    data: {
      ...data,
      subtopicId,
    },
  });
}

export async function remove(id: string) {
  return prisma.subtopicComment.delete({ where: { id } });
}
