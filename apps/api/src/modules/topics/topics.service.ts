import { CreateTopicDto, UpdateTopicDto } from '@gpg/shared';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../lib/app-error';
import { recalculateSchedule } from '../projects/projects.service';

async function getProjectId(stageId: string): Promise<string> {
  const stage = await prisma.stage.findUnique({ where: { id: stageId } });
  if (!stage) throw new AppError(404, 'Etapa não encontrada');
  return stage.projectId;
}

export async function findAll(stageId: string) {
  return prisma.topic.findMany({
    where: { stageId },
    orderBy: { order: 'asc' },
    include: {
      subtopics: {
        orderBy: { order: 'asc' },
        include: { teams: { include: { team: true } } },
      },
    },
  });
}

export async function findById(id: string, stageId: string) {
  const topic = await prisma.topic.findFirst({ where: { id, stageId } });
  if (!topic) throw new AppError(404, 'Tópico não encontrado');
  return topic;
}

export async function create(stageId: string, data: CreateTopicDto) {
  const projectId = await getProjectId(stageId);
  const topic = await prisma.topic.create({ data: { ...data, stageId } });
  await recalculateSchedule(projectId);
  return topic;
}

export async function update(id: string, stageId: string, data: UpdateTopicDto) {
  await findById(id, stageId);
  const projectId = await getProjectId(stageId);
  const topic = await prisma.topic.update({ where: { id }, data });
  await recalculateSchedule(projectId);
  return topic;
}

export async function remove(id: string, stageId: string) {
  await findById(id, stageId);
  const projectId = await getProjectId(stageId);
  await prisma.topic.delete({ where: { id } });
  const remaining = await prisma.topic.findMany({
    where: { stageId },
    orderBy: { order: 'asc' },
  });
  await prisma.$transaction(
    remaining.map((t: { id: string }, i: number) =>
      prisma.topic.update({ where: { id: t.id }, data: { order: i + 1 } }),
    ),
  );
  await recalculateSchedule(projectId);
}
