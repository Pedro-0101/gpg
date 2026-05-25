import { CreateProfessionalDto, UpdateProfessionalDto } from '@gpg/shared';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../lib/app-error';

const professionalInclude = {
  teams: { include: { team: true } },
} as const;

export async function findAll(projectId: string) {
  return prisma.professional.findMany({
    where: { projectId },
    orderBy: { name: 'asc' },
    include: professionalInclude,
  });
}

export async function findById(id: string, projectId: string) {
  const p = await prisma.professional.findFirst({
    where: { id, projectId },
    include: professionalInclude,
  });
  if (!p) throw new AppError(404, 'Profissional não encontrado');
  return p;
}

export async function create(projectId: string, data: CreateProfessionalDto) {
  return prisma.professional.create({
    data: { ...data, projectId },
    include: professionalInclude,
  });
}

export async function update(id: string, projectId: string, data: UpdateProfessionalDto) {
  await findById(id, projectId);
  return prisma.professional.update({
    where: { id },
    data,
    include: professionalInclude,
  });
}

export async function remove(id: string, projectId: string) {
  await findById(id, projectId);
  return prisma.professional.delete({ where: { id } });
}

export async function getMetrics(projectId: string) {
  const [professionals, project] = await Promise.all([
    prisma.professional.findMany({
      where: { projectId },
      include: {
        teams: {
          include: {
            team: {
              include: {
                subtopics: { include: { subtopic: true } },
              },
            },
          },
        },
      },
    }),
    prisma.project.findUnique({ where: { id: projectId }, select: { dailyHours: true } }),
  ]);

  // Monthly capacity in hours: dailyHours × 22 working days
  const dailyHours = project?.dailyHours ?? 8;
  const capacityHours = dailyHours * 22;

  return professionals.map((prof) => {
    // Deduplicate subtopics — a professional may be in multiple teams assigned to the same subtopic
    const subtopicMap = new Map<string, typeof prof.teams[0]['team']['subtopics'][0]['subtopic']>();
    for (const tp of prof.teams) {
      for (const st of tp.team.subtopics) {
        subtopicMap.set(st.subtopic.id, st.subtopic);
      }
    }
    const subtopics = Array.from(subtopicMap.values());

    const activeTasks = subtopics.filter((s) => s.status !== 'done').length;
    const completedTasks = subtopics.filter((s) => s.status === 'done').length;
    const activeHours = subtopics
      .filter((s) => s.status !== 'done')
      .reduce((acc, s) => acc + (s.durationHours || 0), 0);
    const spentHours = subtopics.reduce((acc, s) => acc + Number(s.spentHours || 0), 0);
    const estimatedHours = subtopics.reduce((acc, s) => acc + (s.durationHours || 0), 0);
    const total = subtopics.length;
    const performance = total > 0 ? Math.round((completedTasks / total) * 100) : 100;
    // Cap at 200 so the UI can display meaningful overload
    const loadPercent = Math.min(Math.round((activeHours / capacityHours) * 100), 200);

    return {
      memberId: prof.id,
      name: prof.name,
      role: prof.role,
      initials: prof.initials,
      avatarColor: prof.avatarColor,
      activeTasks,
      completedTasks,
      activeHours,
      capacityHours,
      loadPercent,
      spentHours,
      estimatedHours,
      performance,
    };
  });
}
