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
  const professionals = await prisma.professional.findMany({
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
  });

  return professionals.map((prof) => {
    const subtopics = prof.teams.flatMap((tp) =>
      tp.team.subtopics.map((st) => st.subtopic),
    );
    const activeTasks = subtopics.filter((s) => s.status !== 'done').length;
    const completedTasks = subtopics.filter((s) => s.status === 'done').length;
    const spentHours = subtopics.reduce((acc, s) => acc + (s.spentHours || 0), 0);
    const estimatedHours = subtopics.reduce((acc, s) => acc + (s.durationHours || 0), 0);
    const total = subtopics.length;
    const performance = total > 0 ? Math.round((completedTasks / total) * 100) : 100;
    const loadPercent = Math.min(Math.round((activeTasks * 8 / 40) * 100), 120);

    return {
      memberId: prof.id,
      name: prof.name,
      role: prof.role,
      initials: prof.initials,
      avatarColor: prof.avatarColor,
      activeTasks,
      completedTasks,
      loadPercent,
      spentHours,
      estimatedHours,
      performance,
    };
  });
}
