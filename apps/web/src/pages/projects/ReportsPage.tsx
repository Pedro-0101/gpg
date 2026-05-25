import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Avatar } from '../../components/ui/Avatar';
import { costsApi } from '../../api/costs';
import { membersApi } from '../../api/members';
import { decisionsApi } from '../../api/decisions';
import { stagesApi } from '../../api/stages';
import { formatCurrency, formatDate } from '../../lib/utils';
import type { Project, Decision, MemberMetrics, CostEntry } from '../../types';

interface ReportsPageProps { project: Project; }

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

  const allSubtopics = (stages as any[]).flatMap((s: any) =>
    (s.topics ?? []).flatMap((t: any) => t.subtopics ?? []),
  );
  const doneThisWeek = allSubtopics.filter(
    (sub: any) => sub.status === 'done' && new Date(sub.updatedAt) >= weekAgo,
  ).length;
  const delayed = allSubtopics.filter(
    (sub: any) => sub.deadline && new Date(sub.deadline) < today && sub.status !== 'done',
  ).length;
  const inProgress = allSubtopics.filter((sub: any) => sub.status === 'inprog').length;

  const budget = Number(project.totalBudget) || 0;
  const totalSpent = costsSummary?.totalSpent ?? 0;
  const burnRate = budget > 0 ? Math.round((totalSpent / budget) * 100) : 0;
  const pendingDecisions = (decisions as Decision[]).filter((d) => d.status === 'pending');
  const overloadedMembers = (memberMetrics as MemberMetrics[]).filter((m) => m.loadPercent > 85);

  const headline = overloadedMembers.length > 0
    ? `${overloadedMembers.length} membro(s) com carga acima de 85% — atenção.`
    : doneThisWeek > 0
    ? `${doneThisWeek} tarefa(s) concluída(s) esta semana.`
    : `Acompanhamento semanal do projeto ${project.name}.`;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 24 }}>
        <div className="row" style={{ gap: 8, marginBottom: 12 }}>
          <span className="chip accent">SEMANA {weekNumber}</span>
          <span className="chip accent xs">{formatDate(today.toISOString())}</span>
          <span className="xs faint b" style={{ marginLeft: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Status Report</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <button className="btn ghost sm">Compartilhar</button>
            <button className="btn ghost sm">Imprimir</button>
            <button className="btn primary sm">↓ Exportar PDF</button>
          </div>
        </div>
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>{headline}</div>
        <div style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.6 }}>
          Resumo executivo gerado a partir das tarefas concluídas, gastos lançados e carga atual da equipe — <strong>{project.name}</strong>.
        </div>
      </div>

      {/* Section 01 */}
      <Section n="01" title="O que aconteceu esta semana">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          <StatBox n={doneThisWeek} label="Tasks Concluídas" color="var(--success)" note={doneThisWeek > 0 ? 'Esta semana' : 'Nenhuma conclusão'} />
          <StatBox n={inProgress} label="Em Progresso" color="var(--accent)" note="Subtarefas em andamento" />
          <StatBox n={delayed} label="Atrasadas" color="var(--danger)" note={delayed > 0 ? 'Com prazo vencido' : 'Nenhuma atrasada'} />
        </div>
      </Section>

      {/* Section 02 */}
      <Section n="02" title="Como está o orçamento">
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div className="xs faint" style={{ marginBottom: 4 }}>TOTAL CONSUMIDO</div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{formatCurrency(totalSpent)}</div>
                {budget > 0 && <div className="xs faint" style={{ marginTop: 2 }}>de {formatCurrency(budget)} orçados</div>}
              </div>
              {budget > 0 && (
                <div>
                  <div className="row" style={{ marginBottom: 4 }}>
                    <span className="xs faint">Budget utilizado</span>
                    <span className="xs b" style={{ marginLeft: 'auto', color: burnRate > 80 ? 'var(--danger)' : 'inherit' }}>{burnRate}%</span>
                  </div>
                  <div className="bar thick">
                    <span style={{ width: `${Math.min(burnRate, 100)}%`, background: burnRate > 80 ? 'var(--warning)' : 'var(--accent)' }} />
                  </div>
                </div>
              )}
              {budget === 0 && <div className="xs faint" style={{ fontStyle: 'italic' }}>Orçamento não definido.</div>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
              <div className="row" style={{ gap: 16 }}>
                <div className="col" style={{ gap: 2 }}>
                  <div className="xs faint">Realizado</div>
                  <div className="b mono" style={{ fontSize: 15 }}>{formatCurrency(totalSpent)}</div>
                </div>
                <div className="col" style={{ gap: 2 }}>
                  <div className="xs faint">Saldo</div>
                  <div className="b mono" style={{ fontSize: 15 }}>{formatCurrency(budget - totalSpent)}</div>
                </div>
              </div>
              {(costEntries as CostEntry[]).length === 0 && (
                <div className="xs faint" style={{ fontStyle: 'italic' }}>Sem lançamentos registrados.</div>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* Section 03 */}
      <Section n="03" title="Quem está sobrecarregado">
        {(memberMetrics as MemberMetrics[]).length === 0 ? (
          <div className="xs faint" style={{ fontStyle: 'italic' }}>Nenhum membro cadastrado.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {(memberMetrics as MemberMetrics[])
              .sort((a, b) => b.loadPercent - a.loadPercent)
              .slice(0, 6)
              .map((m, i) => (
                <div key={m.memberId} className="row" style={{ gap: 12 }}>
                  <Avatar initials={m.name.slice(0, 2).toUpperCase()} colorIndex={i + 1} size="sm" />
                  <div className="fill col" style={{ gap: 4 }}>
                    <div className="row">
                      <span className="b small">{m.name}</span>
                      <span className="xs b" style={{ marginLeft: 'auto', color: m.loadPercent > 85 ? 'var(--danger)' : 'var(--text-2)' }}>{m.loadPercent}%</span>
                    </div>
                    <div className="bar fill">
                      <span style={{ width: `${Math.min(m.loadPercent, 100)}%`, background: m.loadPercent > 85 ? 'var(--danger)' : 'var(--accent)' }} />
                    </div>
                    <div className="xs faint">{m.activeTasks} ativas · {m.completedTasks} concluídas</div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </Section>

      {/* Section 04 */}
      <Section n="04" title="Decisões pendentes">
        {pendingDecisions.length === 0 ? (
          <div className="card" style={{ padding: '12px 16px', background: 'color-mix(in srgb, var(--success) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--success) 20%, transparent)' }}>
            <span style={{ color: 'var(--success)', fontSize: 13 }}>✓ Nenhuma decisão pendente. Ótimo!</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pendingDecisions.map((d) => (
              <div key={d.id} className="list-item" style={{ padding: '12px 16px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--warning)', flexShrink: 0 }} />
                <div className="fill">
                  <div className="b small">{d.title}</div>
                  {d.description && <div className="xs faint">{d.description}</div>}
                </div>
                {d.professional && <span className="xs faint">Resp: <strong>{d.professional.name}</strong></span>}
                {d.dueDate && <span className="chip accent xs">{formatDate(d.dueDate)}</span>}

              </div>
            ))}
          </div>
        )}
      </Section>

      <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <div className="xs faint" style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}>Gerado automaticamente pelo GPG System</div>
      </div>
    </div>
  );
};

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: 16, alignItems: 'flex-start' }}>
      <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--accent)', lineHeight: 1, fontFamily: 'Geist Mono, ui-monospace, monospace' }}>{n}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', textTransform: 'uppercase', margin: 0 }}>{title}</h2>
        {children}
      </div>
    </section>
  );
}

function StatBox({ n, label, color, note }: { n: number; label: string; color: string; note: string }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ fontSize: 36, fontWeight: 700, color, marginBottom: 2 }}>{n}</div>
      <div className="small b" style={{ textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-2)' }}>{label}</div>
      <div className="xs faint" style={{ marginTop: 4 }}>{note}</div>
    </div>
  );
}
