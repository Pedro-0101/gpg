import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { KPI } from '../../components/ui/KPI';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { BurndownChart } from '../../components/ui/BurndownChart';
import { Avatar } from '../../components/ui/Avatar';
import { costsApi } from '../../api/costs';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Plus, Download, AlertTriangle, TrendingUp } from 'lucide-react';

interface CostsPageProps {
  project: any;
}

export const CostsPage: React.FC<CostsPageProps> = ({ project }) => {
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['costs', project.id],
    queryFn: () => costsApi.list(project.id)
  });

  const { data: summary } = useQuery({
    queryKey: ['costs', project.id, 'summary'],
    queryFn: () => costsApi.summary(project.id)
  });

  if (isLoading) return <div className="muted p-8 text-center">Carregando finanças...</div>;

  // Mock data para o gráfico (acumulado por mês)
  const chartData = [0, 15000, 35000, 48000, 62000, 75000];
  const idealData = [0, 20000, 40000, 60000, 80000, 100000];

  const totalSpent = summary?.totalSpent || 0;
  const budget = Number(project.totalBudget) || 1;
  const burnRate = (totalSpent / budget) * 100;

  return (
    <div className="flex flex-col gap-6">
      {/* Financial KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KPI 
          label="Total Gasto" 
          value={formatCurrency(totalSpent)} 
          sub={`de ${formatCurrency(budget)}`}
          delta={{ value: `${Math.round(burnRate)}%`, trend: burnRate > 80 ? 'down' : 'up' }}
        />
        <KPI 
          label="Saldo Restante" 
          value={formatCurrency(budget - totalSpent)} 
          sub="Orçamento disponível"
        />
        <KPI 
          label="Custo Médio/h" 
          value={formatCurrency(145.50)} 
          sub="Baseado na equipe"
        />
        <KPI 
          label="Projeção Final" 
          value={formatCurrency(budget * 1.05)} 
          sub="+5% acima do esperado"
          delta={{ value: 'Alerta', trend: 'down' }}
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Burndown Chart */}
        <Card className="col-span-2">
          <CardHeader title="Burndown Financeiro" subtitle="Realizado vs Planejado (Acumulado)">
             <div className="row gap-2">
                <span className="row gap-1 xs muted"><span className="w-2 h-2 rounded-full bg-accent" /> Real</span>
                <span className="row gap-1 xs muted"><span className="w-2 h-2 border border-dashed border-text-3 rounded-full" /> Ideal</span>
             </div>
          </CardHeader>
          <CardBody>
             <BurndownChart data={chartData} ideal={idealData} height={240} />
             <div className="mt-4 row between xs muted uppercase tracking-widest font-bold px-4">
                <span>Jan</span><span>Fev</span><span>Mar</span><span>Abr</span><span>Mai</span><span>Jun</span>
             </div>
          </CardBody>
        </Card>

        {/* Financial Alerts */}
        <div className="flex flex-col gap-4">
           <Card className="bg-warning-soft border-warning/20">
              <CardBody className="row gap-3">
                 <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center text-warning">
                    <AlertTriangle size={20} />
                 </div>
                 <div className="fill">
                    <div className="small b text-warning">Atenção no Burn Rate</div>
                    <div className="xs text-warning/80">O gasto desta semana superou em 15% o planejado.</div>
                 </div>
              </CardBody>
           </Card>
           
           <Card className="bg-info-soft border-info/20">
              <CardBody className="row gap-3">
                 <div className="w-10 h-10 rounded-full bg-info/20 flex items-center justify-center text-info">
                    <TrendingUp size={20} />
                 </div>
                 <div className="fill">
                    <div className="small b text-info">Otimização de Custos</div>
                    <div className="xs text-info/80">A substituição de infra reduziu o custo fixo mensal em R$ 1.2k.</div>
                 </div>
              </CardBody>
           </Card>

           <Card>
              <CardHeader title="Gastos por Categoria" />
              <CardBody className="flex flex-col gap-3">
                 {Object.entries(summary?.byCategory || {}).map(([cat, val]: any) => (
                    <div key={cat} className="col gap-1">
                       <div className="row between xs muted">
                          <span className="b">{cat}</span>
                          <span>{formatCurrency(val)}</span>
                       </div>
                       <div className="bar fill h-1.5">
                          <span style={{ width: `${(val / (totalSpent || 1)) * 100}%` }} />
                       </div>
                    </div>
                 ))}
              </CardBody>
           </Card>
        </div>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader title="Últimos Lançamentos" subtitle="Todas as despesas e custos de pessoal">
           <div className="row gap-2">
              <button className="btn sm"><Download size={14} /> Exportar</button>
              <button className="btn sm primary"><Plus size={14} /> Novo Lançamento</button>
           </div>
        </CardHeader>
        <CardBody flush>
          <table className="tbl">
            <thead>
              <tr>
                <th>DATA</th>
                <th>DESCRIÇÃO</th>
                <th>CATEGORIA</th>
                <th>RESPONSÁVEL</th>
                <th className="right">VALOR</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry: any) => (
                <tr key={entry.id}>
                  <td className="muted xs mono">{formatDate(entry.date)}</td>
                  <td>
                    <div className="b">{entry.description}</div>
                    <div className="xs muted">{entry.stage?.name || 'Projeto Geral'}</div>
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
                  <td className="right b">{formatCurrency(Number(entry.amount))}</td>
                  <td className="right">
                    <button className="icon-btn ghost sm muted"><MoreHorizontal size={14} /></button>
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center muted italic">Nenhum lançamento financeiro registrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
};

// Helper import fix
import { MoreHorizontal } from 'lucide-react';
