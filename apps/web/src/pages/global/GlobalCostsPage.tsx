import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { projectsApi } from '../../api/projects';
import { KPI } from '../../components/ui/KPI';
import { StatusChip } from '../../components/ui/StatusChip';
import { formatCurrency, formatDate } from '../../lib/utils';
import type { ProjectSummary } from '../../types';

export const GlobalCostsPage: React.FC = () => {
  const { data: summaries = [], isLoading } = useQuery<ProjectSummary[]>({
    queryKey: ['projects', 'summaries'],
    queryFn: projectsApi.summaries,
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (summaries.length > 0 && selectedIds.length === 0) {
      setSelectedIds(summaries.map((p) => p.id));
    }
  }, [summaries]);

  const selected = summaries.filter((p) => selectedIds.includes(p.id));

  const totalPlanned = selected.reduce((n, p) => n + p.plannedCost, 0);
  const totalDone = selected.reduce((n, p) => n + p.doneCost, 0);
  const balance = totalPlanned - totalDone;
  const burnRate = totalPlanned > 0 ? Math.round((totalDone / totalPlanned) * 100) : 0;

  function toggleProject(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.length === 1 ? prev : prev.filter((x) => x !== id)
        : [...prev, id]
    );
  }

  if (isLoading) return <div className="faint" style={{ padding: 32, textAlign: 'center' }}>Carregando custos...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-head">
        <div>
          <div className="page-title">Custos</div>
          <div className="page-sub">Resumo financeiro consolidado do workspace</div>
        </div>
      </div>

      {/* Project selector */}
      {summaries.length > 0 && (
        <div className="card" style={{ padding: '12px 16px' }}>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="xs faint" style={{ flexShrink: 0 }}>Projetos:</span>
            {summaries.map((p) => {
              const isSelected = selectedIds.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => toggleProject(p.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '5px 10px', borderRadius: 'var(--radius)',
                    border: `1.5px solid ${isSelected ? p.color || 'var(--accent)' : 'var(--border)'}`,
                    background: isSelected ? `color-mix(in srgb, ${p.color || 'var(--accent)'} 12%, transparent)` : 'transparent',
                    color: isSelected ? 'var(--text)' : 'var(--text-3)',
                    cursor: 'pointer', fontSize: 13, fontWeight: isSelected ? 600 : 400,
                  }}
                >
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: isSelected ? (p.color || 'var(--accent)') : 'var(--border)',
                    flexShrink: 0,
                  }} />
                  {p.name}
                </button>
              );
            })}
            <button
              onClick={() => setSelectedIds(summaries.map((p) => p.id))}
              style={{ padding: '4px 8px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontSize: 12, color: 'var(--text-3)' }}
            >
              Todos
            </button>
          </div>
        </div>
      )}

      {/* KPI row */}
      <div className="kpi-grid">
        <KPI label="Orçamento previsto" value={formatCurrency(totalPlanned)} sub="calculado pelas tarefas" />
        <KPI
          label="Gastos realizados"
          value={formatCurrency(totalDone)}
          sub={totalPlanned > 0 ? `${burnRate}% do previsto` : 'tarefas concluídas'}
          delta={burnRate > 80 ? { dir: 'down', text: 'Atenção' } : burnRate > 50 ? { dir: 'flat', text: `${burnRate}%` } : undefined}
        />
        <KPI
          label="Saldo disponível"
          value={formatCurrency(balance)}
          sub={selected.length > 1 ? `${selected.length} projetos` : selected[0]?.name ?? ''}
          delta={balance < 0 ? { dir: 'down', text: 'Estourado' } : undefined}
        />
        <KPI label="Projetos" value={selected.length} sub={`de ${summaries.length} no workspace`} />
      </div>

      {/* Progress bar */}
      {totalPlanned > 0 && (
        <div className="card">
          <div className="card-body">
            <div className="row between" style={{ marginBottom: 8 }}>
              <span className="xs faint">Gastos realizados</span>
              <span className="b mono">{formatCurrency(totalDone)}</span>
            </div>
            <div className="bar thick" style={{ marginBottom: 8 }}>
              <span style={{
                width: `${Math.min(burnRate, 100)}%`,
                background: burnRate > 80 ? 'var(--warning)' : 'var(--accent)',
              }} />
            </div>
            <div className="row between">
              <span className="xs faint">Orçamento previsto</span>
              <span className="xs faint mono">{formatCurrency(totalPlanned)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Table per project */}
      <div className="card">
        <div className="card-head">
          <div className="card-title">Detalhamento por projeto</div>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Projeto</th>
              <th>Status</th>
              <th>Prazo</th>
              <th>Orçamento</th>
              <th>Realizado</th>
              <th>Saldo</th>
              <th style={{ width: 110 }}>Progresso financeiro</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {selected.map((p) => {
              const pBurn = p.plannedCost > 0 ? Math.round((p.doneCost / p.plannedCost) * 100) : 0;
              const pBalance = p.plannedCost - p.doneCost;
              return (
                <tr key={p.id}>
                  <td>
                    <div className="row" style={{ gap: 6 }}>
                      <span className="sb-project-dot" style={{ background: p.color || 'var(--accent)' }} />
                      <Link to={`/projects/${p.id}`} className="b">{p.name}</Link>
                    </div>
                  </td>
                  <td><StatusChip status={p.status || 'active'} /></td>
                  <td className="xs faint">{p.lastTaskDate ? formatDate(p.lastTaskDate) : (p.endDate ? formatDate(p.endDate) : '—')}</td>
                  <td className="mono xs">{formatCurrency(p.plannedCost)}</td>
                  <td className="mono xs">{formatCurrency(p.doneCost)}</td>
                  <td className="mono xs" style={{ color: pBalance < 0 ? 'var(--danger)' : 'inherit' }}>
                    {formatCurrency(pBalance)}
                  </td>
                  <td>
                    <div className="row" style={{ gap: 6 }}>
                      <div className="bar fill">
                        <span style={{
                          width: `${Math.min(pBurn, 100)}%`,
                          background: pBurn > 80 ? 'var(--warning)' : 'var(--accent)',
                        }} />
                      </div>
                      <span className="xs b" style={{ width: 32, textAlign: 'right' }}>{pBurn}%</span>
                    </div>
                  </td>
                  <td>
                    <Link to={`/projects/${p.id}/costs`} className="btn sm ghost">Ver</Link>
                  </td>
                </tr>
              );
            })}
            {selected.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 24, color: 'var(--text-3)' }}>
                  Selecione ao menos um projeto.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
