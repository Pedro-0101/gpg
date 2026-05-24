import { CreateProjectDto, UpdateProjectDto } from '@gpg/shared';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../lib/app-error';
import { calculateSchedule } from '../../lib/schedule';

export async function findAll() {
  return prisma.project.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { stages: true, teams: true, stakeholders: true } } },
  });
}

export async function findById(id: string) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      stages: {
        orderBy: { order: 'asc' },
        include: {
          topics: {
            orderBy: { order: 'asc' },
            include: {
              subtopics: {
                orderBy: { order: 'asc' },
                include: {
                  teams: { include: { team: { include: { professionals: { include: { professional: true } } } } } }
                },
              },
            },
          },
        },
      },
      teams: {
        include: {
          professionals: { include: { professional: true } },
        },
      },
      stakeholders: true,
      professionals: true,
      costs: true,
      risks: true,
      milestones: true,
    },
  });

  if (!project) throw new AppError(404, 'Projeto não encontrado');
  return project;
}

export async function create(data: CreateProjectDto) {
  return prisma.project.create({ data });
}

export async function update(id: string, data: UpdateProjectDto) {
  await findById(id);
  const project = await prisma.project.update({ where: { id }, data });

  if (data.startDate || data.dailyHours) {
    await recalculateSchedule(id);
  }

  return project;
}

export async function remove(id: string) {
  await findById(id);
  return prisma.project.delete({ where: { id } });
}

export async function recalculateSchedule(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      stages: {
        orderBy: { order: 'asc' },
        include: {
          topics: {
            include: {
              subtopics: { orderBy: { order: 'asc' } },
            },
          },
        },
      },
    },
  });

  if (!project) return;

  const scheduled = calculateSchedule(project.startDate, project.dailyHours, project.stages);

  await prisma.$transaction(
    scheduled.flatMap((stage) => [
      prisma.stage.update({
        where: { id: stage.id },
        data: { startDate: stage.startDate, endDate: stage.endDate },
      }),
      ...stage.topics.flatMap((topic) => [
        prisma.topic.update({
          where: { id: topic.id },
          data: { startDate: topic.startDate, endDate: topic.endDate },
        }),
        ...topic.subtopics.map((sub) =>
          prisma.subtopic.update({
            where: { id: sub.id },
            data: { startDate: sub.startDate, endDate: sub.endDate },
          }),
        ),
      ]),
    ]),
  );
}
