import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { KPI } from '../../components/ui/KPI';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Avatar, AvatarStack } from '../../components/ui/Avatar';
import { StatusChip } from '../../components/ui/StatusChip';
import { costsApi } from '../../api/costs';
import { milestonesApi } from '../../api/risks-milestones';
import { formatCurrency, formatDate } from '../../lib/utils';
import { differenceInCalendarDays } from 'date-fns';
import { Settings, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

interface ProjectOverviewPageProps {
  project: any;
}

export const ProjectOverviewPage: React.FC<ProjectOverviewPageProps> = ({ project }) => {
  const { data: costsSummary } = useQuery({
    queryKey: ['costs', project.id, 'summary'],
    queryFn: () => costsApi.summary(project.id),
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones', project.id],
    queryFn: () => milestonesApi.list(project.id),
  });

  // Calcula progresso real a partir dos subtópicos já incluídos no projeto
  const allSubtopics = (project.stages ?? []).flatMap((s: any) =>
    (s.topics ?? []).flatMap((t: any) => t.subtopics ?? []),
  );
  const totalTasks = allSubtopics.length;
  const completedTasks = allSubtopics.filter((s: any) => s.status === 'done').length;
  const pendingTasks = allSubtopics.filter((s: any) => s.status !== 'done').length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Orçamento
  const budget = Number(project.totalBudget) || 0;
  const totalSpent = costsSummary?.totalSpent ?? 0;
  const burnRate = budget > 0 ? Math.round((totalSpent / budget) * 100) : 0;

  // Prazo
  const today = new Date();
  const daysLeft = project.endDate
    ? differenceInCalendarDays(new Date(project.endDate), today)
    : null;

  // Próximos milestones
  const upcomingMilestones = (milestones as any[])
    .filter((m) => m.status === 'pending')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  // Status real das etapas
  function stageProgress(stage: any) {
    const subs = (stage.topics ?? []).flatMap((t: any) => t.subtopics ?? []);
    if (subs.length === 0) return 0;
    return Math.round((subs.filter((s: any) => s.status === 'done').length / subs.length) * 100);
  }

  function stageStatus(stage: any): string {
    const subs = (stage.topics ?? []).flatMap((t: any) => t.subtopics ?? []);
    if (subs.length === 0) return 'todo';
    const done = subs.filter((s: any) => s.status === 'done').length;
    const inprog = subs.filter((s: any) => s.status === 'inprog').length;
    if (done === subs.length) return 'done';
    if (inprog > 0 || done > 0) return 'inprog';
    return 'todo';
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Hero Section */}
      <section className="card p-6">
        <div className="flex items-start justify-between">
          <div className="flex gap-5">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${project.color || '#4F46E5'}, #7C3AED)` }}
            >
              {project.name.charAt(0)}
            </div>
            <div>
              <div className="row gap-2 mb-1">
                <h2 className="text-2xl font-bold">{project.name}</h2>
                {project.client && <div className="chip accent">{project.client}</div>}
              </div>
              <div className="row gap-2 muted text-sm">
                <StatusChip status={project.status || 'inprog'} />
                {project.manager && <span>PM: <strong>{project.manager.name}</strong></span>}
                <span>·</span>
                <span>Início: {formatDate(project.startDate)}</span>
                {project.endDate && <><span>·</span><span>Fim: {formatDate(project.endDate)}</span></>}
              </div>
            </div>
          </div>
          <button className="btn"><Settings size={14} /> Configurar</button>
        </div>

        <div className="mt-6 col gap-2">
          <div className="row between xs muted font-bold uppercase tracking-wider">
            <span>Progresso Geral — {completedTasks} de {totalTasks} tarefas concluídas</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <ProgressBar progress={progress} className="thick" variant={progress === 100 ? 'success' : 'default'} />
        </div>
      </section>

      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-4">
        <KPI
          label="Orçamento"
          value={formatCurrency(budget)}
          sub={budget > 0 ? `${burnRate}% consumido (${formatCurrency(totalSpent)})` : 'Não definido'}
          delta={budget > 0 ? { value: `${burnRate}%`, trend: burnRate > 80 ? 'down' : 'flat' } : undefined}
        />
        <KPI
          label="Tarefas"
          value={`${completedTasks}/${totalTasks}`}
          sub={`${pendingTasks} pendentes`}
          delta={pendingTasks === 0 && totalTasks > 0 ? { value: 'Concluído', trend: 'up' } : undefined}
        />
        <KPI
          label="Equipe"
          value={project.members?.length ?? 0}
          sub="Pessoas alocadas"
        />
        <KPI
          label="Prazo"
          value={daysLeft !== null ? `${Math.abs(daysLeft)} dias` : '—'}
          sub={daysLeft !== null ? (daysLeft < 0 ? 'Atrasado' : 'Restantes') : 'Sem data fim'}
          delta={daysLeft !== null && daysLeft < 0 ? { value: 'Atrasado', trend: 'down' } : undefined}
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Etapas */}
        <Card className="col-span-2">
          <CardHeader title="Etapas do Projeto" subtitle={`${(project.stages ?? []).length} etapas definidas`}>
            <Link to="stages" className="btn sm ghost">Ver tarefas</Link>
          </CardHeader>
          <CardBody flush>
            <table className="tbl">
              <thead>
                <tr>
                  <th>ETAPA</th>
                  <th>STATUS</th>
                  <th>PRAZO</th>
                  <th>RESPONSÁVEIS</th>
                  <th className="right">PROGRESSO</th>
                </tr>
              </thead>
              <tbody>
                {(project.stages ?? []).map((stage: any) => {
                  const pct = stageProgress(stage);
                  const assignees = (stage.topics ?? [])
                    .flatMap((t: any) => (t.subtopics ?? []).flatMap((s: any) => s.assignments ?? []))
                    .reduce((acc: any[], a: any) => {
                      if (!acc.find((x: any) => x.member.id === a.member.id)) acc.push(a);
                      return acc;
                    }, [])
                    .slice(0, 3);
                  return (
                    <tr key={stage.id}>
                      <td className="b">{stage.name}</td>
                      <td><StatusChip status={stageStatus(stage)} /></td>
                      <td className="muted xs">{stage.endDate ? formatDate(stage.endDate) : '—'}</td>
                      <td>
                        <AvatarStack>
                          {assignees.length > 0
                            ? assignees.map((a: any) => (
                                <Avatar key={a.member.id} initials={a.member.initials} colorIndex={a.member.avatarColor} size="sm" />
                              ))
                            : <Avatar initials="?" colorIndex={8} size="sm" />
                          }
                        </AvatarStack>
                      </td>
                      <td className="right">
                        <div className="row gap-2 justify-end">
                          <span className="xs mono muted">{pct}%</span>
                          <ProgressBar progress={pct} className="w-16" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {(project.stages ?? []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center muted italic">
                      Nenhuma etapa cadastrada. <Link to="stages" className="text-accent underline">Adicionar.</Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardBody>
        </Card>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          {/* Equipe */}
          <Card>
            <CardHeader title="Equipe Alocada" />
            <CardBody className="flex flex-col gap-3">
              {(project.members ?? []).length > 0 ? (project.members as any[]).map((member: any) => (
                <div key={member.id} className="row gap-3">
                  <Avatar initials={member.initials} colorIndex={member.avatarColor} size="sm" />
                  <div className="fill">
                    <div className="small b">{member.name}</div>
                    <div className="xs muted">{member.role}</div>
                  </div>
                </div>
              )) : (
                <div className="muted xs italic text-center py-4">Nenhum membro alocado.</div>
              )}
              <Link to="team" className="btn sm fill mt-2">Gerenciar Equipe</Link>
            </CardBody>
          </Card>

          {/* Próximas Entregas */}
          <Card>
            <CardHeader title="Próximas Entregas" />
            <CardBody className="flex flex-col gap-3">
              {upcomingMilestones.length > 0 ? upcomingMilestones.map((m: any) => {
                const isPast = new Date(m.date) < today;
                return (
                  <div key={m.id} className="row gap-3">
                    <div className={`w-1 h-8 rounded-full flex-shrink-0 ${isPast ? 'bg-danger' : 'bg-success'}`} />
                    <div className="fill">
                      <div className="small b">{m.name}</div>
                      <div className="xs muted row gap-1">
                        {isPast ? <AlertCircle size={10} className="text-danger" /> : <CheckCircle2 size={10} className="text-success" />}
                        {formatDate(m.date)} · Marco
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="xs muted italic text-center py-4">
                  Nenhum marco pendente.<br />
                  <Link to="gantt" className="text-accent underline">Adicionar no Gantt.</Link>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
