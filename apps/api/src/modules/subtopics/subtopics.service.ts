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

export async function findAll(topicId: string) {
  return prisma.subtopic.findMany({
    where: { topicId },
    orderBy: { order: 'asc' },
    include: { 
      team: true,
      assignments: {
        include: {
          member: true
        }
      }
    },
  });
}

export async function findById(id: string, topicId: string) {
  const sub = await prisma.subtopic.findFirst({ 
    where: { id, topicId },
    include: { 
      team: true,
      assignments: {
        include: {
          member: true
        }
      }
    }
  });
  if (!sub) throw new AppError(404, 'Subtópico não encontrado');
  return sub;
}

export async function create(topicId: string, data: CreateSubtopicDto) {
  const projectId = await getProjectId(topicId);
  const sub = await prisma.subtopic.create({ 
    data: { ...data, topicId },
    include: { assignments: { include: { member: true } } }
  });
  await recalculateSchedule(projectId);
  return sub;
}

export async function assignMember(subtopicId: string, memberId: string) {
  return prisma.subtopicAssignment.create({
    data: {
      subtopicId,
      memberId,
    },
    include: {
      member: true,
    },
  });
}

export async function unassignMember(subtopicId: string, memberId: string) {
  return prisma.subtopicAssignment.delete({
    where: {
      subtopicId_memberId: {
        subtopicId,
        memberId,
      },
    },
  });
}

export async function update(id: string, topicId: string, data: UpdateSubtopicDto) {
  await findById(id, topicId);
  const projectId = await getProjectId(topicId);
  const sub = await prisma.subtopic.update({
    where: { id },
    data,
    include: { team: true, assignments: { include: { member: true } } },
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
