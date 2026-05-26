import { CreateSubtopicDto, UpdateSubtopicDto } from '@gpg/shared';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../lib/app-error';
import { recalculateSchedule } from '../projects/projects.service';

async function getProjectId(topicId: string): Promise<string> {
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: { stage: true },
  });
  if (!topic) throw new AppError(404, 'Tópico não encontrado');
  return topic.stage.projectId;
}

const subtopicInclude = {
  teams: { include: { team: { include: { professionals: { include: { professional: true } } } } } },
  professionals: { include: { professional: true } },
} as const;

export async function findAll(topicId: string) {
  return prisma.subtopic.findMany({
    where: { topicId },
    orderBy: { order: 'asc' },
    include: subtopicInclude,
  });
}

export async function findById(id: string, topicId: string) {
  const sub = await prisma.subtopic.findFirst({
    where: { id, topicId },
    include: subtopicInclude,
  });
  if (!sub) throw new AppError(404, 'Subtópico não encontrado');
  return sub;
}

export async function create(topicId: string, data: CreateSubtopicDto) {
  const projectId = await getProjectId(topicId);
  const { teamIds = [], professionalIds = [], ...rest } = data;
  const sub = await prisma.subtopic.create({
    data: {
      ...rest,
      topicId,
      teams: { create: teamIds.map((teamId) => ({ teamId })) },
      professionals: { create: professionalIds.map((professionalId) => ({ professionalId })) },
    },
    include: subtopicInclude,
  });
  await recalculateSchedule(projectId);
  return sub;
}


export async function update(id: string, topicId: string, data: UpdateSubtopicDto) {
  await findById(id, topicId);
  const projectId = await getProjectId(topicId);
  const { teamIds, professionalIds, ...rest } = data;
  if (teamIds !== undefined) {
    await prisma.subtopicTeam.deleteMany({ where: { subtopicId: id } });
  }
  if (professionalIds !== undefined) {
    await prisma.subtopicProfessional.deleteMany({ where: { subtopicId: id } });
  }
  const sub = await prisma.subtopic.update({
    where: { id },
    data: {
      ...rest,
      ...(teamIds !== undefined && {
        teams: { create: teamIds.map((teamId) => ({ teamId })) },
      }),
      ...(professionalIds !== undefined && {
        professionals: { create: professionalIds.map((professionalId) => ({ professionalId })) },
      }),
    },
    include: subtopicInclude,
  });
  await recalculateSchedule(projectId);
  return sub;
}

export async function remove(id: string, topicId: string) {
  await findById(id, topicId);
  const projectId = await getProjectId(topicId);
  await prisma.subtopic.delete({ where: { id } });
  const remaining = await prisma.subtopic.findMany({
    where: { topicId },
    orderBy: { order: 'asc' },
  });
  await prisma.$transaction(
    remaining.map((s: { id: string }, i: number) =>
      prisma.subtopic.update({ where: { id: s.id }, data: { order: i + 1 } }),
    ),
  );
  await recalculateSchedule(projectId);
}
