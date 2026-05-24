import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardBody } from '../../components/ui/Card';
import { KPI } from '../../components/ui/KPI';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { BurndownChart } from '../../components/ui/BurndownChart';
import { Avatar } from '../../components/ui/Avatar';
import { costsApi } from '../../api/costs';
import { membersApi } from '../../api/members';
import { formatCurrency, formatDate } from '../../lib/utils';
import { FileDown, Share2, Printer, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface ReportsPageProps {
  project: any;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ project }) => {
  const { data: costsSummary } = useQuery({
    queryKey: ['costs', project.id, 'summary'],
    queryFn: () => costsApi.summary(project.id)
  });

  const { data: memberMetrics = [] } = useQuery({
    queryKey: ['members', project.id, 'metrics'],
    queryFn: () => membersApi.metrics(project.id)
  });

  const today = new Date();
  const weekNumber = Math.ceil(today.getDate() / 7);

  // Mock de dados para o mini burndown do relatório
  const chartData = [0, 15000, 35000, 48000];
  const idealData = [0, 20000, 40000, 60000];

  return (
    <div className="max-w-[880px] mx-auto flex flex-col gap-10 py-8">
      {/* Report Header */}
      <header className="flex flex-col gap-4 border-b border-border pb-8">
        <div className="row between">
           <div className="row gap-2">
              <span className="chip accent">SEMANA {weekNumber}</span>
              <span className="chip outline xs">{formatDate(today)}</span>
              <span className="xs muted b uppercase tracking-widest ml-2">Status Report</span>
           </div>
           <div className="row gap-2">
              <button className="btn sm ghost"><Share2 size={14} /></button>
              <button className="btn sm ghost"><Printer size={14} /></button>
              <button className="btn sm primary"><FileDown size={14} /> Exportar PDF</button>
           </div>
        </div>
        
        <h1 className="text-4xl font-bold tracking-tight text-text">
          O projeto segue em ritmo acelerado com 57% de conclusão.
        </h1>
        <p className="text-xl text-muted leading-relaxed">
          Este relatório executivo resume o progresso da última semana, a saúde financeira e a alocação da equipe para o projeto <strong>{project.name}</strong>.
        </p>
      </header>

      {/* Section 01: What Happened */}
      <section className="flex flex-col gap-6">
        <div className="row gap-4">
           <span className="w-8 h-8 rounded-full bg-text text-white flex items-center justify-center font-bold">01</span>
           <h2 className="text-2xl font-bold uppercase tracking-tight">O que aconteceu esta semana</h2>
        </div>
        
        <div className="grid grid-cols-3 gap-6">
           <div className="card p-6 bg-surface-2 border-none">
              <div className="text-4xl font-bold text-success mb-1">12</div>
              <div className="small b uppercase muted">Tasks Concluídas</div>
              <p className="xs muted mt-2">Um aumento de 20% em relação à semana anterior.</p>
           </div>
           <div className="card p-6 bg-surface-2 border-none">
              <div className="text-4xl font-bold text-accent mb-1">08</div>
              <div className="small b uppercase muted">Novas Demandas</div>
              <p className="xs muted mt-2">Mapeadas durante a fase de revisão de requisitos.</p>
           </div>
           <div className="card p-6 bg-surface-2 border-none">
              <div className="text-4xl font-bold text-danger mb-1">02</div>
              <div className="small b uppercase muted">Atrasadas</div>
              <p className="xs muted mt-2">Aguardando definição do cliente sobre o fluxo de checkout.</p>
           </div>
        </div>
      </section>

      {/* Section 02: Financial Health */}
      <section className="flex flex-col gap-6">
        <div className="row gap-4">
           <span className="w-8 h-8 rounded-full bg-text text-white flex items-center justify-center font-bold">02</span>
           <h2 className="text-2xl font-bold uppercase tracking-tight">Como está o orçamento</h2>
        </div>
        
        <Card className="border-none shadow-none bg-surface p-6">
           <div className="grid grid-cols-2 gap-10">
              <div className="col gap-4">
                 <div className="col">
                    <span className="xs muted b uppercase tracking-widest">Total Consumido</span>
                    <span className="text-3xl font-bold">{formatCurrency(costsSummary?.totalSpent || 0)}</span>
                 </div>
                 <div className="col gap-1.5">
                    <div className="row between xs b muted">
                       <span>Budget Utilizado</span>
                       <span>32%</span>
                    </div>
                    <ProgressBar progress={32} className="thick" />
                 </div>
                 <p className="text-sm text-muted">
                    O projeto permanece dentro da margem de segurança. O maior gasto continua sendo o custo de pessoal (85% do total).
                 </p>
              </div>
              <div className="col justify-center">
                 <BurndownChart data={chartData} ideal={idealData} height={120} />
                 <div className="row between xs muted mt-2 px-2">
                    <span>Início</span>
                    <span>Hoje</span>
                    <span>Fim</span>
                 </div>
              </div>
           </div>
        </Card>
      </section>

      {/* Section 03: Team Overload */}
      <section className="flex flex-col gap-6">
        <div className="row gap-4">
           <span className="w-8 h-8 rounded-full bg-text text-white flex items-center justify-center font-bold">03</span>
           <h2 className="text-2xl font-bold uppercase tracking-tight">Quem está sobrecarregado</h2>
        </div>
        
        <div className="grid grid-cols-2 gap-8">
           {memberMetrics.slice(0, 4).map((m: any) => (
              <div key={m.memberId} className="row gap-4">
                 <Avatar initials={m.name.charAt(0)} colorIndex={1} size="md" />
                 <div className="fill col gap-1">
                    <div className="row between">
                       <span className="b small">{m.name}</span>
                       <span className={m.loadPercent > 90 ? 'text-danger b xs' : 'xs muted b'}>{m.loadPercent}% Carga</span>
                    </div>
                    <div className="bar fill h-2"><span style={{ width: `${m.loadPercent}%` }} className={m.loadPercent > 90 ? 'bg-danger' : ''} /></div>
                 </div>
              </div>
           ))}
        </div>
      </section>

      {/* Section 04: Pending Decisions */}
      <section className="flex flex-col gap-6">
        <div className="row gap-4">
           <span className="w-8 h-8 rounded-full bg-text text-white flex items-center justify-center font-bold">04</span>
           <h2 className="text-2xl font-bold uppercase tracking-tight">Decisões pendentes</h2>
        </div>
        
        <div className="flex flex-col gap-3">
           <DecisionItem title="Aprovação do layout da Home" responsible="Lina Kerry" deadline="Amanhã" />
           <DecisionItem title="Definição do provedor de Cloud" responsible="Wesley Ray" deadline="18 de Jun" />
           <DecisionItem title="Assinatura do contrato de Freelancer" responsible="John Doe" deadline="22 de Jun" />
        </div>
      </section>

      {/* Footer Info */}
      <footer className="mt-10 pt-10 border-t border-border flex flex-col items-center gap-2 text-center">
         <div className="sb-logo">A</div>
         <div className="xs muted b uppercase tracking-widest">Gerado automaticamente pelo GPG System</div>
         <div className="xs muted">© 2026 Acme Studio. Todos os direitos reservados.</div>
      </footer>
    </div>
  );
};

const DecisionItem: React.FC<{ title: string, responsible: string, deadline: string }> = ({ title, responsible, deadline }) => (
  <div className="row between p-4 bg-surface rounded-lg border border-border/50 hover:border-accent/30 transition-colors">
     <div className="row gap-3">
        <div className="w-2 h-2 rounded-full bg-warning" />
        <span className="b small">{title}</span>
     </div>
     <div className="row gap-4">
        <span className="xs muted">Resp: <strong>{responsible}</strong></span>
        <span className="chip outline xs">{deadline}</span>
        <ArrowRight size={14} className="muted" />
     </div>
  </div>
);
