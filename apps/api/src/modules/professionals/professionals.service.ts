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

/** Pro-rated hours of a task that fall within [rangeStart, rangeEnd] */
function proRatedHours(
  taskStart: Date | null,
  taskEnd: Date | null,
  durationHours: number,
  rangeStart: Date,
  rangeEnd: Date,
): number {
  if (!taskStart || !taskEnd) return 0;
  const overlapStart = taskStart > rangeStart ? taskStart : rangeStart;
  const overlapEnd = taskEnd < rangeEnd ? taskEnd : rangeEnd;
  if (overlapEnd <= overlapStart) return 0;
  const overlapMs = overlapEnd.getTime() - overlapStart.getTime();
  const spanMs = taskEnd.getTime() - taskStart.getTime();
  if (spanMs <= 0) return 0;
  return (overlapMs / spanMs) * durationHours;
}

/** Monday 00:00 of the week containing `date` */
function weekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Friday 23:59:59 of the same week */
function weekEnd(date: Date): Date {
  const d = weekStart(date);
  d.setDate(d.getDate() + 4);
  d.setHours(23, 59, 59, 999);
  return d;
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

  const dailyHours = project?.dailyHours ?? 8;
  const weekCapacity = dailyHours * 5; // Mon–Fri

  const now = new Date();
  const wStart = weekStart(now);
  const wEnd = weekEnd(now);

  return professionals.map((prof) => {
    // Deduplicate subtopics — professional may be in multiple teams on the same task
    const subtopicMap = new Map<string, typeof prof.teams[0]['team']['subtopics'][0]['subtopic']>();
    for (const tp of prof.teams) {
      for (const st of tp.team.subtopics) {
        subtopicMap.set(st.subtopic.id, st.subtopic);
      }
    }
    const subtopics = Array.from(subtopicMap.values());

    const activeTasks = subtopics.filter((s) => s.status !== 'done').length;
    const completedTasks = subtopics.filter((s) => s.status === 'done').length;
    const spentHours = subtopics.reduce((acc, s) => acc + Number(s.spentHours || 0), 0);
    const estimatedHours = subtopics.reduce((acc, s) => acc + (s.durationHours || 0), 0);
    const total = subtopics.length;
    const performance = total > 0 ? Math.round((completedTasks / total) * 100) : 100;

    // Hours scheduled for this professional during the current week (Mon–Fri)
    const activeHours = subtopics
      .filter((s) => s.status !== 'done')
      .reduce((acc, s) => acc + proRatedHours(s.startDate, s.endDate, s.durationHours, wStart, wEnd), 0);

    const loadPercent = weekCapacity > 0
      ? Math.min(Math.round((activeHours / weekCapacity) * 100), 200)
      : 0;

    return {
      memberId: prof.id,
      name: prof.name,
      role: prof.role,
      initials: prof.initials,
      avatarColor: prof.avatarColor,
      activeTasks,
      completedTasks,
      activeHours: Math.round(activeHours * 10) / 10,
      capacityHours: weekCapacity,
      loadPercent,
      spentHours,
      estimatedHours,
      performance,
    };
  });
}
