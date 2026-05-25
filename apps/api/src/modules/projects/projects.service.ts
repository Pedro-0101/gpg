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

export async function getSummaries() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      stages: {
        include: {
          topics: {
            include: {
              subtopics: {
                include: {
                  teams: {
                    include: {
                      team: {
                        include: {
                          professionals: { include: { professional: true } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  return projects.map((p) => {
    const subs = p.stages.flatMap((s) => s.topics.flatMap((t) => t.subtopics));
    const totalTasks = subs.length;
    const doneTasks = subs.filter((s) => s.status === 'done').length;
    const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    let plannedCost = 0;
    let doneCost = 0;
    for (const sub of subs) {
      const costPerHour = (sub as any).teams.reduce((sum: number, st: any) => {
        return sum + st.team.professionals.reduce((s2: number, tp: any) => {
          return s2 + Number(tp.professional.hourlyCost ?? 0);
        }, 0);
      }, 0);
      const cost = sub.durationHours * costPerHour;
      plannedCost += cost;
      if (sub.status === 'done') doneCost += cost;
    }

    const lastTaskDate = subs.reduce((max: Date | null, sub) => {
      const d = sub.endDate;
      if (!d) return max;
      return !max || d > max ? d : max;
    }, null as Date | null);

    return {
      id: p.id,
      name: p.name,
      status: p.status,
      color: p.color,
      client: p.client,
      description: p.description,
      startDate: p.startDate,
      endDate: p.endDate,
      lastTaskDate: lastTaskDate?.toISOString() ?? null,
      totalTasks,
      doneTasks,
      progress,
      plannedCost,
      doneCost,
    };
  });
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
