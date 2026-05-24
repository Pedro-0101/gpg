import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../../api/projects';
import { membersApi } from '../../api/members';
import { costsApi } from '../../api/costs';
import { milestonesApi } from '../../api/risks-milestones';
import { KPI } from '../../components/ui/KPI';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Avatar, AvatarStack } from '../../components/ui/Avatar';
import { StatusChip } from '../../components/ui/StatusChip';
import { formatCurrency, formatDate } from '../../lib/utils';
import { AlertCircle, ArrowRight, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Project, MemberMetrics, Milestone } from '../../types';

export const DashboardPage: React.FC = () => {
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: projectsApi.list,
  });

  const mainProject = projects[0];

  const { data: mainProjectMembers = [] } = useQuery({
    queryKey: ['members', mainProject?.id],
    queryFn: () => membersApi.list(mainProject!.id),
    enabled: !!mainProject?.id,
  });

  const { data: memberMetrics = [] } = useQuery<MemberMetrics[]>({
    queryKey: ['members', mainProject?.id, 'metrics'],
    queryFn: () => membersApi.metrics(mainProject!.id),
    enabled: !!mainProject?.id,
  });

  const { data: costsSummary } = useQuery({
    queryKey: ['costs', mainProject?.id, 'summary'],
    queryFn: () => costsApi.summary(mainProject!.id),
    enabled: !!mainProject?.id,
  });

  const { data: milestones = [] } = useQuery<Milestone[]>({
    queryKey: ['milestones', mainProject?.id],
    queryFn: () => milestonesApi.list(mainProject!.id),
    enabled: !!mainProject?.id,
  });

  if (isLoading) return <div className="muted p-8 text-center">Carregando painel executivo...</div>;

  const totalBudget = projects.reduce((acc, p) => acc + (Number(p.totalBudget) || 0), 0);
  const activeProjects = projects.filter((p) => p.status === 'active').length;

  // Progresso real do projeto principal
  const allSubtopics = (mainProject as any)?.stages?.flatMap((s: any) =>
    s.topics?.flatMap((t: any) => t.subtopics ?? []) ?? [],
  ) ?? [];
  const totalTasks = allSubtopics.length;
  const doneTasks = allSubtopics.filter((s: any) => s.status === 'done').length;
  const mainProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Membros sobrecarregados (load > 85%)
  const overloadedMembers = (memberMetrics as MemberMetrics[])
    .filter((m) => m.loadPercent > 85)
    .sort((a, b) => b.loadPercent - a.loadPercent);

  // Orçamento
  const budget = Number(mainProject?.totalBudget) || 0;
  const totalSpent = costsSummary?.totalSpent ?? 0;
  const burnRate = budget > 0 ? Math.round((totalSpent / budget) * 100) : 0;

  // Próximos milestones
  const upcomingMilestones = (milestones as Milestone[])
    .filter((m) => m.status === 'pending')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  // Progresso por projeto para a tabela
  function projectProgress(p: any) {
    const subs = (p.stages ?? []).flatMap((s: any) =>
      (s.topics ?? []).flatMap((t: any) => t.subtopics ?? []),
    );
    if (subs.length === 0) return 0;
    return Math.round((subs.filter((s: any) => s.status === 'done').length / subs.length) * 100);
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Hero */}
      {mainProject && (
        <section
          className="card p-8 overflow-hidden relative border-l-8"
          style={{ borderLeftColor: mainProject.color || 'var(--accent)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-2 max-w-xl">
              <div className="row gap-2">
                <span className="chip accent">PROJETO DESTAQUE</span>
                <span className="chip outline xs mono">#{mainProject.id.slice(-4)}</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">{mainProject.name}</h1>
              <p className="text-muted text-lg leading-relaxed">
                {mainProject.description || 'Gestão estratégica em andamento.'}
              </p>
              <div className="row gap-6 mt-4">
                {mainProject.client && (
                  <div className="col">
                    <span className="xs muted font-bold uppercase">Cliente</span>
                    <span className="b">{mainProject.client}</span>
                  </div>
                )}
                <div className="col">
                  <span className="xs muted font-bold uppercase">Budget</span>
                  <span className="b">{formatCurrency(Number(mainProject.totalBudget) || 0)}</span>
                </div>
                <div className="col">
                  <span className="xs muted font-bold uppercase">Equipe</span>
                  <span className="b">{mainProjectMembers.length} pessoa(s)</span>
                </div>
                <div className="col">
                  <span className="xs muted font-bold uppercase">Progresso</span>
                  <span className="b">{mainProgress}%</span>
                </div>
              </div>
              <div className="mt-6">
                <Link to={`/projects/${mainProject.id}`} className="btn primary">
                  Ir para Projeto <ArrowRight size={14} className="ml-1" />
                </Link>
              </div>
            </div>
            <div className="hidden lg:block pr-8">
              <ProgressRing progress={mainProgress} size={180} strokeWidth={15} />
            </div>
          </div>
        </section>
      )}

      {/* Global KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KPI label="Projetos Ativos" value={activeProjects} sub={`de ${projects.length} total`} />
        <KPI label="Budget Consolidado" value={formatCurrency(totalBudget)} sub="Valor total aprovado" />
        <KPI label="Equipe no Projeto" value={mainProjectMembers.length} sub={mainProject?.name ?? '—'} />
        <KPI
          label="Consumido"
          value={budget > 0 ? `${burnRate}%` : '—'}
          sub={budget > 0 ? `${formatCurrency(totalSpent)} de ${formatCurrency(budget)}` : 'Sem orçamento'}
          delta={budget > 0 && burnRate > 80 ? { value: 'Atenção', trend: 'down' } : undefined}
        />
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Col 1 & 2 */}
        <div className="col-span-2 flex flex-col gap-6">
          <Card>
            <CardHeader title="Status dos Projetos" subtitle="Visão rápida do progresso e saúde">
              <Link to="/projects" className="btn sm ghost">Ver todos</Link>
            </CardHeader>
            <CardBody flush>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>PROJETO</th>
                    <th>ORÇAMENTO</th>
                    <th>STATUS</th>
                    <th className="right">PROGRESSO</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p: any) => {
                    const pct = projectProgress(p);
                    return (
                      <tr key={p.id}>
                        <td className="b row gap-3">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
                          <Link to={`/projects/${p.id}`} className="hover:text-accent">{p.name}</Link>
                        </td>
                        <td className="muted xs mono">{formatCurrency(p.totalBudget || 0)}</td>
                        <td><StatusChip status={p.status || 'todo'} /></td>
                        <td className="right">
                          <div className="row gap-2 justify-end">
                            <span className="xs mono muted">{pct}%</span>
                            <ProgressBar progress={pct} className="w-16" />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {projects.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center muted italic">
                        Nenhum projeto cadastrado.{' '}
                        <Link to="/projects" className="text-accent underline">Criar projeto.</Link>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardBody>
          </Card>

          {/* Gargalos de Equipe */}
          {overloadedMembers.length > 0 && (
            <Card>
              <CardHeader title="Gargalos de Equipe" subtitle="Membros com carga acima de 85%">
                <AlertCircle size={14} className="text-warning" />
              </CardHeader>
              <CardBody className="flex flex-col gap-4">
                {overloadedMembers.slice(0, 4).map((m) => (
                  <div key={m.memberId} className="col gap-1">
                    <div className="row between xs b uppercase muted tracking-tighter">
                      <div className="row gap-2">
                        <Avatar initials={m.name.slice(0, 2).toUpperCase()} colorIndex={1} size="sm" />
                        <span>{m.name}</span>
                      </div>
                      <span className="text-danger">{m.loadPercent}%</span>
                    </div>
                    <ProgressBar progress={m.loadPercent} style={{ '--bar-color': 'var(--danger)' } as React.CSSProperties} />
                  </div>
                ))}
              </CardBody>
            </Card>
          )}
        </div>

        {/* Col 3 */}
        <div className="flex flex-col gap-6">
          {/* Alertas Críticos */}
          {(burnRate > 80 || overloadedMembers.length > 0) && (
            <Card className="bg-danger-soft border-danger/20">
              <CardHeader title="Alertas Críticos" className="border-danger/10">
                <AlertCircle size={16} className="text-danger" />
              </CardHeader>
              <CardBody className="flex flex-col gap-4">
                {burnRate > 80 && (
                  <div className="row gap-3">
                    <div className="w-1 h-8 bg-danger rounded-full flex-shrink-0" />
                    <div className="col">
                      <div className="small b text-danger">Budget Crítico</div>
                      <div className="xs text-danger/80">{burnRate}% do orçamento consumido em {mainProject?.name}.</div>
                    </div>
                  </div>
                )}
                {overloadedMembers.length > 0 && (
                  <div className="row gap-3">
                    <div className="w-1 h-8 bg-danger rounded-full flex-shrink-0" />
                    <div className="col">
                      <div className="small b text-danger">{overloadedMembers.length} membro(s) sobrecarregado(s)</div>
                      <div className="xs text-danger/80">
                        {overloadedMembers.slice(0, 2).map(m => m.name).join(', ')} acima de 85%.
                      </div>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {/* Próximos Marcos */}
          <Card>
            <CardHeader title="Próximos Marcos" />
            <CardBody className="flex flex-col gap-4">
              {upcomingMilestones.length > 0 ? upcomingMilestones.map((m) => (
                <div key={m.id} className="row gap-3">
                  <div className="xs b mono muted w-16 shrink-0 uppercase">{formatDate(m.date).slice(0, 6)}</div>
                  <div className="fill">
                    <div className="small b">{m.name}</div>
                    <div className="xs muted">{mainProject?.name}</div>
                  </div>
                </div>
              )) : (
                <div className="xs muted italic text-center py-4">
                  Nenhum marco pendente.
                </div>
              )}
              {mainProject && (
                <Link to={`/projects/${mainProject.id}/gantt`} className="btn sm fill ghost mt-1">
                  <Plus size={13} /> Adicionar marco
                </Link>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
