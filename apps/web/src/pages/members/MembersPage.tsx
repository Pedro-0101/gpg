import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { KPI } from '../../components/ui/KPI';
import { Card, CardBody } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { membersApi } from '../../api/members';
import { Plus, Search, Filter, MoreHorizontal } from 'lucide-react';

interface MembersPageProps {
  project: any;
}

export const MembersPage: React.FC<MembersPageProps> = ({ project }) => {
  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ['members', project.id],
    queryFn: () => membersApi.list(project.id)
  });

  const { data: metrics = [], isLoading: loadingMetrics } = useQuery({
    queryKey: ['members', project.id, 'metrics'],
    queryFn: () => membersApi.metrics(project.id)
  });

  if (loadingMembers || loadingMetrics) return <div className="muted p-8 text-center">Carregando equipe...</div>;

  // KPIs calculados a partir das métricas
  const avgLoad = metrics.length > 0 
    ? Math.round(metrics.reduce((acc: number, m: any) => acc + m.loadPercent, 0) / metrics.length) 
    : 0;
  
  const totalTasks = metrics.reduce((acc: number, m: any) => acc + m.activeTasks + m.completedTasks, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Stats */}
      <div className="grid grid-cols-4 gap-4">
        <KPI label="Pessoas Ativas" value={members.length} sub="No projeto atual" />
        <KPI label="Carga Média" value={`${avgLoad}%`} sub="Ocupação da equipe" delta={{ value: 'Ideal', trend: 'flat' }} />
        <KPI label="Tarefas" value={totalTasks} sub="Atribuídas" />
        <KPI label="Performance" value="92%" sub="Média do time" delta={{ value: '↑ 4%', trend: 'up' }} />
      </div>

      {/* Toolbar */}
      <div className="row between">
         <div className="row gap-2">
            <div className="search-mini w-64">
               <Search size={14} />
               <span>Filtrar por nome ou skill...</span>
            </div>
            <button className="btn sm"><Filter size={14} /> Filtros</button>
         </div>
         <button className="btn primary sm"><Plus size={14} /> Convidar Membro</button>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-3 gap-6">
        {metrics.map((m: any) => {
          const member = members.find((mem: any) => mem.id === m.memberId);
          return (
            <Card key={m.memberId} className="hover:border-accent/50 transition-colors cursor-pointer group">
              <CardBody className="flex flex-col gap-4">
                <div className="row between">
                   <div className="row gap-3">
                      <Avatar initials={member?.initials || '??'} colorIndex={member?.avatarColor || 0} size="md" />
                      <div className="col">
                         <div className="b small group-hover:text-accent transition-colors">{m.name}</div>
                         <div className="xs muted">{member?.role || 'Membro'}</div>
                      </div>
                   </div>
                   <button className="icon-btn ghost sm muted"><MoreHorizontal size={14} /></button>
                </div>

                <div className="flex flex-wrap gap-1">
                   {member?.skills?.map((skill: string) => (
                      <span key={skill} className="chip xs outline">{skill}</span>
                   ))}
                   {(!member?.skills || member.skills.length === 0) && (
                      <span className="xs italic muted">Sem skills informadas</span>
                   )}
                </div>

                <div className="divider" />

                <div className="col gap-1.5">
                   <div className="row between xs font-bold uppercase tracking-wider muted">
                      <span>Carga de Trabalho</span>
                      <span className={m.loadPercent > 90 ? 'text-danger' : ''}>{m.loadPercent}%</span>
                   </div>
                   <ProgressBar 
                    progress={m.loadPercent} 
                    variant={m.loadPercent > 90 ? 'default' : 'default'} 
                    className={m.loadPercent > 90 ? '[&_.bar_span]:bg-danger' : ''}
                   />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2">
                   <div className="col">
                      <span className="xs muted uppercase">Tarefas</span>
                      <span className="small b">{m.activeTasks} ativas</span>
                   </div>
                   <div className="col">
                      <span className="xs muted uppercase">Concluídas</span>
                      <span className="small b">{m.completedTasks}</span>
                   </div>
                </div>

                <div className="row gap-2 mt-2 pt-2 border-t border-border/50">
                   <button className="btn sm fill ghost">Ver Perfil</button>
                   <button className="btn sm fill">Atribuir</button>
                </div>
              </CardBody>
            </Card>
          );
        })}

        {metrics.length === 0 && (
           <div className="col-span-3 card p-12 text-center muted italic border-dashed">
              Nenhum membro da equipe encontrado para este projeto.
           </div>
        )}
      </div>
    </div>
  );
};
