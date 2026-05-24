import { CreateCostEntryDto, UpdateCostEntryDto } from '@gpg/shared';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../lib/app-error';

export async function findAll(projectId: string) {
  return prisma.costEntry.findMany({
    where: { projectId },
    include: {
      stage: true,
      professional: true,
    },
    orderBy: { date: 'desc' },
  });
}

export async function create(projectId: string, data: CreateCostEntryDto) {
  return prisma.costEntry.create({
    data: {
      ...data,
      projectId,
    },
    include: {
      stage: true,
      professional: true,
    },
  });
}

export async function remove(id: string, projectId: string) {
  const entry = await prisma.costEntry.findFirst({ where: { id, projectId } });
  if (!entry) throw new AppError(404, 'Lançamento não encontrado');
  
  return prisma.costEntry.delete({ where: { id } });
}

export async function getSummary(projectId: string) {
  const [entries, project] = await Promise.all([
    prisma.costEntry.findMany({ where: { projectId } }),
    prisma.project.findUnique({
      where: { id: projectId },
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
    }),
  ]);

  const totalSpent = entries.reduce((acc, curr) => acc + Number(curr.amount), 0);

  const byCategory = entries.reduce((acc: any, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + Number(curr.amount);
    return acc;
  }, {});

  // plannedCost: all subtopics — durationHours × sum of team professional hourlyCosts
  // doneCost: only completed subtopics — represents actual spend from finished work
  let plannedCost = 0;
  let doneCost = 0;
  for (const stage of project?.stages ?? []) {
    for (const topic of stage.topics) {
      for (const sub of topic.subtopics) {
        const costPerHour = (sub as any).teams.reduce((sum: number, st: any) => {
          return sum + st.team.professionals.reduce((s2: number, tp: any) => {
            return s2 + Number(tp.professional.hourlyCost ?? 0);
          }, 0);
        }, 0);
        const subtopicCost = sub.durationHours * costPerHour;
        plannedCost += subtopicCost;
        if (sub.status === 'done') doneCost += subtopicCost;
      }
    }
  }

  return {
    totalSpent,
    byCategory,
    count: entries.length,
    plannedCost,
    doneCost,
  };
}
