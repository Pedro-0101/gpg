import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../../api/projects';
import { KPI } from '../../components/ui/KPI';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { Avatar, AvatarStack } from '../../components/ui/Avatar';
import { StatusChip } from '../../components/ui/StatusChip';
import { formatCurrency, formatDate } from '../../lib/utils';
import { AlertCircle, Clock, CheckCircle2, TrendingUp, ArrowRight, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.list
  });

  if (isLoading) return <div className="muted p-8 text-center">Carregando painel executivo...</div>;

  const mainProject = projects[0]; // Pegar o primeiro como destaque para o Hero
  const totalBudget = projects.reduce((acc: number, p: any) => acc + (Number(p.totalBudget) || 0), 0);
  const activeMembers = 24; // Mock consolidado

  return (
    <div className="flex flex-col gap-8">
      {/* Hero: Main Project Overview */}
      {mainProject && (
        <section className="card p-8 bg-gradient-to-br from-white to-surface-2 overflow-hidden relative border-l-8" style={{ borderLeftColor: mainProject.color }}>
           <div className="flex items-center justify-between">
              <div className="flex flex-col gap-2 max-w-xl">
                 <div className="row gap-2">
                    <span className="chip accent">PROJETO DESTAQUE</span>
                    <span className="chip outline xs mono">#{mainProject.id.slice(-4)}</span>
                 </div>
                 <h1 className="text-3xl font-bold tracking-tight">{mainProject.name}</h1>
                 <p className="text-muted text-lg leading-relaxed">
                    {mainProject.description || 'Gestão estratégica em andamento. Foco na entrega dos marcos críticos desta semana.'}
                 </p>
                 <div className="row gap-6 mt-4">
                    <div className="col">
                       <span className="xs muted font-bold uppercase">Cliente</span>
                       <span className="b">{mainProject.client || 'Acme Studio'}</span>
                    </div>
                    <div className="col">
                       <span className="xs muted font-bold uppercase">Budget Alocado</span>
                       <span className="b">{formatCurrency(mainProject.totalBudget || 0)}</span>
                    </div>
                    <div className="col">
                       <span className="xs muted font-bold uppercase">Responsável</span>
                       <div className="row gap-2">
                          <Avatar initials="JD" colorIndex={2} size="sm" />
                          <span className="b small">John Doe</span>
                       </div>
                    </div>
                 </div>
                 <div className="mt-6">
                    <Link to={`/projects/${mainProject.id}`} className="btn primary">
                       Ir para Projeto <ArrowRight size={14} className="ml-1" />
                    </Link>
                 </div>
              </div>

              <div className="hidden lg:block pr-8">
                 <ProgressRing progress={57} size={180} strokeWidth={15} />
              </div>
           </div>
        </section>
      )}

      {/* Global KPIs */}
      <div className="grid grid-cols-4 gap-4">
         <KPI label="Projetos Ativos" value={projects.length} sub="3 em fase crítica" delta={{ value: '12%', trend: 'up' }} />
         <KPI label="Budget Consolidado" value={formatCurrency(totalBudget)} sub="Valor total aprovado" />
         <KPI label="Equipe Global" value={activeMembers} sub="Pessoas alocadas" />
         <KPI label="Tasks Concluídas" value="142" sub="Últimos 30 dias" delta={{ value: '↑ 8%', trend: 'up' }} />
      </div>

      <div className="grid grid-cols-3 gap-8">
         {/* Column 1 & 2: Recent Activity & Project Status */}
         <div className="col-span-2 flex flex-col gap-6">
            <Card>
               <CardHeader title="Status dos Projetos" subtitle="Visão rápida do progresso e saúde">
                  <button className="btn sm ghost">Ver todos</button>
               </CardHeader>
               <CardBody flush>
                  <table className="tbl">
                     <thead>
                        <tr>
                           <th>PROJETO</th>
                           <th>PM</th>
                           <th>ORÇAMENTO</th>
                           <th>PRAZO</th>
                           <th className="right">PROGRESSO</th>
                        </tr>
                     </thead>
                     <tbody>
                        {projects.map((p: any) => (
                           <tr key={p.id}>
                              <td className="b row gap-3">
                                 <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                                 <Link to={`/projects/${p.id}`} className="hover:text-accent">{p.name}</Link>
                              </td>
                              <td>
                                 <div className="row gap-2">
                                    <Avatar initials="LK" colorIndex={3} size="sm" />
                                    <span className="xs">Lina Kerry</span>
                                 </div>
                              </td>
                              <td className="muted xs mono">{formatCurrency(p.totalBudget || 0)}</td>
                              <td><StatusChip status="inprog" /></td>
                              <td className="right">
                                 <div className="row gap-2 justify-end">
                                    <span className="xs mono muted">45%</span>
                                    <div className="bar w-16"><span style={{ width: '45%' }} /></div>
                                 </div>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </CardBody>
            </Card>

            <div className="grid grid-cols-2 gap-6">
               <Card>
                  <CardHeader title="Atividade Recente" />
                  <CardBody className="flex flex-col gap-4">
                     <ActivityItem icon={<CheckCircle2 className="text-success" size={14} />} text="Wesley Ray concluiu 'Implementação API'" time="há 12 min" />
                     <ActivityItem icon={<Clock className="text-warning" size={14} />} text="Lina Kerry atrasou 'Revisão Layout'" time="há 2h" />
                     <ActivityItem icon={<Plus className="text-accent" size={14} />} text="Novo lançamento de R$ 1.500,00 em Infra" time="há 4h" />
                  </CardBody>
               </Card>
               <Card>
                  <CardHeader title="Gargalos de Equipe" />
                  <CardBody className="flex flex-col gap-4">
                     <div className="col gap-1">
                        <div className="row between xs b uppercase muted tracking-tighter"><span>Lina Kerry</span> <span className="text-danger">98%</span></div>
                        <div className="bar fill [&_span]:bg-danger"><span style={{ width: '98%' }} /></div>
                     </div>
                     <div className="col gap-1">
                        <div className="row between xs b uppercase muted tracking-tighter"><span>Wesley Ray</span> <span>85%</span></div>
                        <div className="bar fill"><span style={{ width: '85%' }} /></div>
                     </div>
                  </CardBody>
               </Card>
            </div>
         </div>

         {/* Column 3: Alertas e Riscos */}
         <div className="flex flex-col gap-6">
            <Card className="bg-danger-soft border-danger/20">
               <CardHeader title="Alertas Críticos" className="border-danger/10">
                  <AlertCircle size={16} className="text-danger" />
               </CardHeader>
               <CardBody className="flex flex-col gap-4">
                  <div className="row gap-3">
                     <div className="w-1 h-8 bg-danger rounded-full" />
                     <div className="col">
                        <div className="small b text-danger">Atraso em Zeeker App</div>
                        <div className="xs text-danger/80">Etapa de Discovery 4 dias atrasada.</div>
                     </div>
                  </div>
                  <div className="row gap-3">
                     <div className="w-1 h-8 bg-danger rounded-full" />
                     <div className="col">
                        <div className="small b text-danger">Budget Limite</div>
                        <span className="xs text-danger/80">Projeto Slash Motion atingiu 92% do budget.</span>
                     </div>
                  </div>
               </CardBody>
            </Card>

            <Card>
               <CardHeader title="Próximos Marcos" />
               <CardBody className="flex flex-col gap-4">
                  <div className="row gap-3">
                     <div className="xs b mono muted w-10">12 JUN</div>
                     <div className="fill">
                        <div className="small b">Aprovação Protótipo</div>
                        <div className="xs muted">Zeeker App</div>
                     </div>
                  </div>
                  <div className="row gap-3">
                     <div className="xs b mono muted w-10">18 JUN</div>
                     <div className="fill">
                        <div className="small b">Entrega Banco de Dados</div>
                        <div className="xs muted">Nova API GPG</div>
                     </div>
                  </div>
               </CardBody>
            </Card>
         </div>
      </div>
    </div>
  );
};

const ActivityItem: React.FC<{ icon: React.ReactNode, text: string, time: string }> = ({ icon, text, time }) => (
  <div className="row gap-3">
     <div className="shrink-0">{icon}</div>
     <div className="fill text-xs b">{text}</div>
     <div className="shrink-0 xs muted">{time}</div>
  </div>
);
