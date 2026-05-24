import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { KPI } from '../../components/ui/KPI';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { BurndownChart } from '../../components/ui/BurndownChart';
import { Avatar } from '../../components/ui/Avatar';
import { costsApi } from '../../api/costs';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Plus, Download, AlertTriangle, Trash2, X, Check } from 'lucide-react';
import type { Project, CostEntry, CostSummary } from '../../types';

interface CostsPageProps {
  project: Project;
}

const CATEGORIES = ['Pessoal', 'Ferramentas', 'Infraestrutura', 'Freelancers', 'Outros'];

export const CostsPage: React.FC<CostsPageProps> = ({ project }) => {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['costs', project.id],
    queryFn: () => costsApi.list(project.id),
  });

  const { data: summary } = useQuery<CostSummary>({
    queryKey: ['costs', project.id, 'summary'],
    queryFn: () => costsApi.summary(project.id),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => costsApi.create(project.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['costs', project.id] });
      setShowForm(false);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => costsApi.remove(project.id, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['costs', project.id] }),
  });

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { description: '', category: 'Pessoal', amount: 0, hours: '' },
  });

  if (isLoading) return <div className="muted p-8 text-center">Carregando finanças...</div>;

  const totalSpent = summary?.totalSpent ?? 0;
  const budget = Number(project.totalBudget) || 0;
  const balance = budget - totalSpent;
  const burnRate = budget > 0 ? (totalSpent / budget) * 100 : 0;

  // Burndown: acumular lançamentos por mês a partir da data de início
  const projectStart = new Date(project.startDate);
  const monthsMap: Record<string, number> = {};
  (entries as CostEntry[]).forEach((e) => {
    const d = new Date(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthsMap[key] = (monthsMap[key] ?? 0) + Number(e.amount);
  });
  const months = Object.keys(monthsMap).sort();
  let acc = 0;
  const chartData = months.length > 0
    ? [0, ...months.map((m) => { acc += monthsMap[m]; return acc; })]
    : [0, 0];

  // Ideal: orçamento dividido linearmente pelos meses totais do projeto
  const totalMonths = Math.max(months.length, 1);
  const idealStep = budget / totalMonths;
  const idealData = Array.from({ length: chartData.length }, (_, i) => idealStep * i);

  const avgHourlyRate = entries.length > 0
    ? entries
        .filter((e: CostEntry) => e.hours && e.hours > 0)
        .reduce((acc: number, e: CostEntry) => acc + Number(e.amount) / (e.hours!), 0) /
      Math.max(entries.filter((e: CostEntry) => e.hours && e.hours > 0).length, 1)
    : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-4 gap-4">
        <KPI
          label="Total Gasto"
          value={formatCurrency(totalSpent)}
          sub={budget > 0 ? `de ${formatCurrency(budget)}` : 'Sem orçamento definido'}
          delta={budget > 0 ? { value: `${Math.round(burnRate)}%`, trend: burnRate > 80 ? 'down' : 'flat' } : undefined}
        />
        <KPI
          label="Saldo Restante"
          value={formatCurrency(balance)}
          sub="Orçamento disponível"
          delta={balance < 0 ? { value: 'Negativo', trend: 'down' } : undefined}
        />
        <KPI
          label="Custo Médio/h"
          value={avgHourlyRate > 0 ? formatCurrency(avgHourlyRate) : '—'}
          sub="Baseado nos lançamentos com horas"
        />
        <KPI
          label="Lançamentos"
          value={String(entries.length)}
          sub={`${(summary?.count ?? 0)} registros`}
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader title="Burndown Financeiro" subtitle="Realizado acumulado vs Ideal">
            <div className="row gap-2">
              <span className="row gap-1 xs muted"><span className="w-2 h-2 rounded-full bg-accent inline-block" /> Real</span>
              <span className="row gap-1 xs muted"><span className="w-2 h-2 border border-dashed border-text-3 rounded-full inline-block" /> Ideal</span>
            </div>
          </CardHeader>
          <CardBody>
            {chartData.length > 1 ? (
              <>
                <BurndownChart data={chartData} ideal={idealData} height={240} />
                <div className="mt-4 row between xs muted uppercase tracking-widest font-bold px-4">
                  {months.map((m) => <span key={m}>{m.slice(5)}/{m.slice(2, 4)}</span>)}
                </div>
              </>
            ) : (
              <div className="muted italic text-center py-12">Registre lançamentos para ver o burndown.</div>
            )}
          </CardBody>
        </Card>

        <div className="flex flex-col gap-4">
          {burnRate > 80 && (
            <Card className="bg-warning-soft border-warning/20">
              <CardBody className="row gap-3">
                <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center text-warning flex-shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div className="fill">
                  <div className="small b text-warning">Atenção no Burn Rate</div>
                  <div className="xs text-warning/80">{Math.round(burnRate)}% do orçamento consumido.</div>
                </div>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader title="Gastos por Categoria" />
            <CardBody className="flex flex-col gap-3">
              {Object.entries(summary?.byCategory ?? {}).length > 0
                ? Object.entries(summary!.byCategory).map(([cat, val]) => (
                    <div key={cat} className="col gap-1">
                      <div className="row between xs muted">
                        <span className="b">{cat}</span>
                        <span>{formatCurrency(val as number)}</span>
                      </div>
                      <div className="bar fill" style={{ height: 6 }}>
                        <span style={{ width: `${((val as number) / (totalSpent || 1)) * 100}%` }} />
                      </div>
                    </div>
                  ))
                : <div className="xs muted italic">Nenhum lançamento ainda.</div>}
            </CardBody>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader title="Lançamentos" subtitle={`${entries.length} registros`}>
          <div className="row gap-2">
            <button className="btn sm"><Download size={14} /> Exportar</button>
            <button className="btn sm primary" onClick={() => setShowForm(true)}>
              <Plus size={14} /> Novo Lançamento
            </button>
          </div>
        </CardHeader>

        {showForm && (
          <div className="border-b border-border p-4 bg-surface-2">
            <form
              className="grid grid-cols-5 gap-3 items-end"
              onSubmit={handleSubmit((d) =>
                createMutation.mutate({ ...d, amount: Number(d.amount), hours: d.hours ? Number(d.hours) : null }),
              )}
            >
              <div className="col gap-1 col-span-2">
                <label className="xs muted font-bold uppercase">Descrição *</label>
                <input className="input" placeholder="Ex: Horas Lina · UI sistema" {...register('description', { required: true })} />
              </div>
              <div className="col gap-1">
                <label className="xs muted font-bold uppercase">Categoria</label>
                <select className="input" {...register('category')}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="col gap-1">
                <label className="xs muted font-bold uppercase">Valor (R$) *</label>
                <input type="number" min={0} step={0.01} className="input" {...register('amount', { required: true })} />
              </div>
              <div className="row gap-2">
                <button type="submit" disabled={createMutation.isPending} className="btn primary sm">
                  <Check size={14} /> {createMutation.isPending ? '...' : 'Salvar'}
                </button>
                <button type="button" className="btn sm ghost" onClick={() => { setShowForm(false); reset(); }}>
                  <X size={14} />
                </button>
              </div>
            </form>
          </div>
        )}

        <CardBody flush>
          <table className="tbl">
            <thead>
              <tr>
                <th>DATA</th>
                <th>DESCRIÇÃO</th>
                <th>CATEGORIA</th>
                <th>RESPONSÁVEL</th>
                <th className="right">VALOR</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(entries as CostEntry[]).map((entry) => (
                <tr key={entry.id}>
                  <td className="muted xs mono">{formatDate(entry.date)}</td>
                  <td>
                    <div className="b">{entry.description}</div>
                    {entry.stage && <div className="xs muted">{entry.stage.name}</div>}
                  </td>
                  <td><span className="chip outline xs">{entry.category}</span></td>
                  <td>
                    {entry.member && (
                      <div className="row gap-2">
                        <Avatar initials={entry.member.initials} colorIndex={entry.member.avatarColor} size="sm" />
                        <span className="xs b">{entry.member.name}</span>
                      </div>
                    )}
                  </td>
                  <td className="right b mono">{formatCurrency(Number(entry.amount))}</td>
                  <td className="right">
                    <button
                      className="icon-btn ghost"
                      onClick={() => confirm('Excluir lançamento?') && deleteMutation.mutate(entry.id)}
                    >
                      <Trash2 size={13} className="text-danger" />
                    </button>
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center muted italic">
                    Nenhum lançamento registrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
};
