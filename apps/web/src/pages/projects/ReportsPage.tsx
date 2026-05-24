import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardBody } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { BurndownChart } from '../../components/ui/BurndownChart';
import { Avatar } from '../../components/ui/Avatar';
import { costsApi } from '../../api/costs';
import { membersApi } from '../../api/members';
import { decisionsApi } from '../../api/decisions';
import { stagesApi } from '../../api/stages';
import { formatCurrency, formatDate } from '../../lib/utils';
import { FileDown, Share2, Printer, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { Project, Decision, MemberMetrics, CostEntry } from '../../types';

interface ReportsPageProps {
  project: Project;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const ReportsPage: React.FC<ReportsPageProps> = ({ project }) => {
  const { data: costsSummary } = useQuery({
    queryKey: ['costs', project.id, 'summary'],
    queryFn: () => costsApi.summary(project.id),
  });

  const { data: costEntries = [] } = useQuery<CostEntry[]>({
    queryKey: ['costs', project.id],
    queryFn: () => costsApi.list(project.id),
  });

  const { data: memberMetrics = [] } = useQuery<MemberMetrics[]>({
    queryKey: ['members', project.id, 'metrics'],
    queryFn: () => membersApi.metrics(project.id),
  });

  const { data: decisions = [] } = useQuery<Decision[]>({
    queryKey: ['decisions', project.id],
    queryFn: () => decisionsApi.list(project.id),
  });

  const { data: stages = [] } = useQuery({
    queryKey: ['stages', project.id],
    queryFn: () => stagesApi.list(project.id),
  });

  const today = new Date();
  const weekAgo = new Date(today.getTime() - WEEK_MS);
  const weekNumber = Math.ceil(today.getDate() / 7);

  // Tasks concluídas esta semana — subtopics com status 'done' e updatedAt na semana
  const allSubtopics = (stages as any[]).flatMap((s: any) =>
    s.topics?.flatMap((t: any) => t.subtopics ?? []) ?? [],
  );
  const doneThisWeek = allSubtopics.filter(
    (sub: any) => sub.status === 'done' && new Date(sub.updatedAt) >= weekAgo,
  ).length;
  const delayed = allSubtopics.filter(
    (sub: any) =>
      sub.deadline && new Date(sub.deadline) < today && sub.status !== 'done',
  ).length;
  const inProgress = allSubtopics.filter((sub: any) => sub.status === 'inprog').length;

  // Burndown a partir dos lançamentos reais
  const monthsMap: Record<string, number> = {};
  costEntries.forEach((e) => {
    const d = new Date(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthsMap[key] = (monthsMap[key] ?? 0) + Number(e.amount);
  });
  const months = Object.keys(monthsMap).sort();
  let acc = 0;
  const chartData = months.length > 0
    ? [0, ...months.map((m) => { acc += monthsMap[m]; return acc; })]
    : [0, 0];
  const budget = Number(project.totalBudget) || 0;
  const totalMonths = Math.max(months.length, 1);
  const idealData = Array.from({ length: chartData.length }, (_, i) => (budget / totalMonths) * i);

  const totalSpent = costsSummary?.totalSpent ?? 0;
  const burnRate = budget > 0 ? Math.round((totalSpent / budget) * 100) : 0;

  const pendingDecisions = decisions.filter((d) => d.status === 'pending');
  const overloadedMembers = memberMetrics.filter((m) => m.loadPercent > 85);

  return (
    <div className="max-w-[880px] mx-auto flex flex-col gap-10 py-8">
      {/* Header */}
      <header className="flex flex-col gap-4 border-b border-border pb-8">
        <div className="row between">
          <div className="row gap-2">
            <span className="chip accent">SEMANA {weekNumber}</span>
            <span className="chip outline xs">{formatDate(today.toISOString())}</span>
            <span className="xs muted b uppercase tracking-widest ml-2">Status Report</span>
          </div>
          <div className="row gap-2">
            <button className="btn sm ghost"><Share2 size={14} /></button>
            <button className="btn sm ghost"><Printer size={14} /></button>
            <button className="btn sm primary"><FileDown size={14} /> Exportar PDF</button>
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-text" style={{ letterSpacing: '-0.02em' }}>
          {overloadedMembers.length > 0
            ? `${overloadedMembers.length} membro(s) com carga acima de 85% — atenção na alocação.`
            : doneThisWeek > 0
            ? `${doneThisWeek} tarefa(s) concluída(s) esta semana.`
            : `Acompanhamento semanal do projeto ${project.name}.`}
        </h1>
        <p className="text-lg text-muted leading-relaxed">
          Resumo executivo gerado a partir das tarefas concluídas, gastos lançados e carga atual da equipe —{' '}
          <strong>{project.name}</strong>.
        </p>
      </header>

      {/* Seção 01 */}
      <Section n="01" title="O que aconteceu esta semana">
        <div className="grid grid-cols-3 gap-6">
          <StatBox n={doneThisWeek} label="Tasks Concluídas" color="success"
            note={doneThisWeek > 0 ? 'Esta semana' : 'Nenhuma conclusão esta semana'} />
          <StatBox n={inProgress} label="Em Progresso" color="accent"
            note="Subtarefas em andamento" />
          <StatBox n={delayed} label="Atrasadas" color="danger"
            note={delayed > 0 ? 'Com prazo vencido' : 'Nenhuma tarefa atrasada'} />
        </div>
      </Section>

      {/* Seção 02 */}
      <Section n="02" title="Como está o orçamento">
        <Card className="border-none shadow-none bg-surface p-6">
          <div className="grid grid-cols-2 gap-10">
            <div className="col gap-4">
              <div className="col">
                <span className="xs muted b uppercase tracking-widest">Total Consumido</span>
                <span className="text-3xl font-bold">{formatCurrency(totalSpent)}</span>
                {budget > 0 && (
                  <span className="xs muted mt-1">de {formatCurrency(budget)} orçados</span>
                )}
              </div>
              {budget > 0 && (
                <div className="col gap-1.5">
                  <div className="row between xs b muted">
                    <span>Budget Utilizado</span>
                    <span style={{ color: burnRate > 80 ? 'var(--danger)' : 'inherit' }}>{burnRate}%</span>
                  </div>
                  <ProgressBar progress={burnRate} />
                </div>
              )}
              {budget === 0 && (
                <p className="text-sm text-muted italic">Orçamento total não definido. Configure em Visão Geral.</p>
              )}
            </div>
            <div className="col justify-center">
              {chartData.length > 1 ? (
                <>
                  <BurndownChart data={chartData} ideal={idealData} height={120} />
                  <div className="row between xs muted mt-2 px-2">
                    <span>Início</span>
                    <span>Hoje</span>
                    <span>Fim</span>
                  </div>
                </>
              ) : (
                <div className="muted italic text-sm text-center">Sem lançamentos para o gráfico.</div>
              )}
            </div>
          </div>
        </Card>
      </Section>

      {/* Seção 03 */}
      <Section n="03" title="Quem está sobrecarregado">
        {memberMetrics.length === 0 ? (
          <p className="text-muted italic text-sm">Nenhum membro da equipe cadastrado.</p>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {memberMetrics
              .sort((a, b) => b.loadPercent - a.loadPercent)
              .slice(0, 6)
              .map((m) => (
                <div key={m.memberId} className="row gap-4">
                  <Avatar initials={m.name.slice(0, 2).toUpperCase()} colorIndex={1} size="md" />
                  <div className="fill col gap-1">
                    <div className="row between">
                      <span className="b small">{m.name}</span>
                      <span className={`xs b ${m.loadPercent > 85 ? 'text-danger' : 'muted'}`}>
                        {m.loadPercent}%
                      </span>
                    </div>
                    <div className="bar fill" style={{ height: 6 }}>
                      <span
                        style={{
                          width: `${Math.min(m.loadPercent, 100)}%`,
                          background: m.loadPercent > 85 ? 'var(--danger)' : 'var(--accent)',
                        }}
                      />
                    </div>
                    <div className="xs muted">{m.activeTasks} ativas · {m.completedTasks} concluídas</div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </Section>

      {/* Seção 04 */}
      <Section n="04" title="Decisões pendentes">
        {pendingDecisions.length === 0 ? (
          <div className="row gap-3 p-4 bg-success-soft rounded-lg border border-success/20">
            <CheckCircle2 size={18} className="text-success flex-shrink-0" />
            <span className="small text-success">Nenhuma decisão pendente. Ótimo!</span>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {pendingDecisions.map((d) => (
              <div
                key={d.id}
                className="row between p-4 bg-surface rounded-lg border border-border/50 hover:border-accent/30 transition-colors"
              >
                <div className="row gap-3">
                  <div className="w-2 h-2 rounded-full bg-warning flex-shrink-0 mt-1" />
                  <div className="col">
                    <span className="b small">{d.title}</span>
                    {d.description && <span className="xs muted">{d.description}</span>}
                  </div>
                </div>
                <div className="row gap-4 flex-shrink-0">
                  {d.member && (
                    <span className="xs muted">Resp: <strong>{d.member.name}</strong></span>
                  )}
                  {d.dueDate && (
                    <span className="chip outline xs">{formatDate(d.dueDate)}</span>
                  )}
                  <ArrowRight size={14} className="muted" />
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <footer className="mt-10 pt-10 border-t border-border flex flex-col items-center gap-2 text-center">
        <div className="xs muted b uppercase tracking-widest">Gerado automaticamente pelo GPG System</div>
      </footer>
    </div>
  );
};

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-6">
      <div className="row gap-4">
        <span
          className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-sm flex-shrink-0"
          style={{ background: 'var(--text)' }}
        >
          {n}
        </span>
        <h2 className="text-2xl font-bold uppercase tracking-tight">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function StatBox({ n, label, color, note }: { n: number; label: string; color: string; note: string }) {
  return (
    <div className="card p-6 bg-surface-2 border-none">
      <div className={`text-4xl font-bold mb-1`} style={{ color: `var(--${color})` }}>{n}</div>
      <div className="small b uppercase muted">{label}</div>
      <p className="xs muted mt-2">{note}</p>
    </div>
  );
}
