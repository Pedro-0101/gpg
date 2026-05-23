import { CreateTeamMemberDto, UpdateTeamMemberDto } from '@gpg/shared';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../lib/app-error';

export async function findAll(projectId: string) {
  return prisma.teamMember.findMany({
    where: { projectId },
    orderBy: { name: 'asc' },
  });
}

export async function findById(id: string, projectId: string) {
  const member = await prisma.teamMember.findFirst({
    where: { id, projectId },
  });
  if (!member) throw new AppError(404, 'Membro da equipe não encontrado');
  return member;
}

export async function create(projectId: string, data: CreateTeamMemberDto) {
  return prisma.teamMember.create({
    data: {
      ...data,
      projectId,
    },
  });
}

export async function update(id: string, projectId: string, data: UpdateTeamMemberDto) {
  await findById(id, projectId);
  return prisma.teamMember.update({
    where: { id },
    data,
  });
}

export async function remove(id: string, projectId: string) {
  await findById(id, projectId);
  return prisma.teamMember.delete({
    where: { id },
  });
}

/**
 * Retorna métricas de carga e performance para os membros do projeto
 * Requisito 6.9 do DESIGN_PLAN.md
 */
export async function getMetrics(projectId: string) {
  const members = await prisma.teamMember.findMany({
    where: { projectId },
    include: {
      assignments: {
        include: {
          subtopic: true,
        },
      },
    },
  });

  return members.map((member) => {
    const activeTasks = member.assignments.filter(
      (a) => a.subtopic.status !== 'done'
    ).length;
    
    const completedTasks = member.assignments.filter(
      (a) => a.subtopic.status === 'done'
    ).length;

    const totalHoursSpent = member.assignments.reduce(
      (acc, a) => acc + (a.subtopic.spentHours || 0),
      0
    );

    const totalHoursEstimated = member.assignments.reduce(
      (acc, a) => acc + (a.subtopic.durationHours || 0),
      0
    );

    // Performance simplificada: concluídas / total (evita divisão por zero)
    const totalAssignments = member.assignments.length;
    const performance = totalAssignments > 0 
      ? Math.round((completedTasks / totalAssignments) * 100) 
      : 100;

    // Carga baseada em 40h/semana (simplificado para MVP)
    const loadPercent = Math.min(Math.round((activeTasks * 8 / 40) * 100), 120);

    return {
      memberId: member.id,
      name: member.name,
      activeTasks,
      completedTasks,
      loadPercent,
      spentHours: totalHoursSpent,
      estimatedHours: totalHoursEstimated,
      performance,
    };
  });
}
