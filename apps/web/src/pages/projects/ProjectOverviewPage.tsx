import React from 'react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { KPI } from '../../components/ui/KPI';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Avatar, AvatarStack } from '../../components/ui/Avatar';
import { StatusChip } from '../../components/ui/StatusChip';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Settings, ExternalLink, Calendar } from 'lucide-react';

interface ProjectOverviewPageProps {
  project: any;
}

export const ProjectOverviewPage: React.FC<ProjectOverviewPageProps> = ({ project }) => {
  // Cálculos simplificados para demonstração visual
  const totalTasks = project.stages.reduce((acc: number, stage: any) => 
    acc + stage.topics.reduce((accT: number, topic: any) => accT + topic.subtopics.length, 0), 0
  );
  
  const completedTasks = project.stages.reduce((acc: number, stage: any) => 
    acc + stage.topics.reduce((accT: number, topic: any) => 
      accT + topic.subtopics.filter((s: any) => s.status === 'done').length, 0
    ), 0
  );

  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Hero Section */}
      <section className="card p-6 bg-gradient-to-br from-white to-gray-50">
        <div className="flex items-start justify-between">
          <div className="flex gap-5">
            <div 
              className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold"
              style={{ background: `linear-gradient(135deg, ${project.color || '#4F46E5'}, #7C3AED)` }}
            >
              {project.name.charAt(0)}
            </div>
            <div>
              <div className="row mb-1">
                <h2 className="text-2xl font-bold">{project.name}</h2>
                <div className="chip accent ml-2">{project.client || 'Cliente não informado'}</div>
              </div>
              <div className="row muted text-sm">
                <span>Status: <StatusChip status="inprog" className="inline-flex ml-1" /></span>
                <span className="mx-2">·</span>
                <span>PM: {project.manager?.name || 'Não atribuído'}</span>
                <span className="mx-2">·</span>
                <span>Início: {formatDate(project.startDate)}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn"><Settings size={14} /> Configurar</button>
            <button className="btn primary"><ExternalLink size={14} /> Compartilhar</button>
          </div>
        </div>

        <div className="mt-8 row gap-8">
          <div className="fill">
            <div className="row between mb-2">
              <span className="xs muted font-bold uppercase tracking-wider">Progresso Geral</span>
              <span className="small b">{Math.round(progress)}%</span>
            </div>
            <ProgressBar progress={progress} className="thick" variant={progress === 100 ? 'success' : 'default'} />
          </div>
          <div className="w-1/3 row gap-4">
             <div className="col">
                <span className="xs muted font-bold uppercase tracking-wider">Prazo Final</span>
                <span className="small b row gap-1"><Calendar size={12} /> {project.endDate ? formatDate(project.endDate) : 'Não definido'}</span>
             </div>
          </div>
        </div>
      </section>

      {/* KPI Grid */}
      <div className="grid-4 grid grid-cols-4 gap-4">
        <KPI 
          label="Orçamento" 
          value={formatCurrency(project.totalBudget || 0)} 
          sub="32% consumido"
          delta={{ value: '2.4%', trend: 'up' }}
        />
        <KPI 
          label="Tarefas" 
          value={`${completedTasks}/${totalTasks}`} 
          sub="Pendentes: 12"
        />
        <KPI 
          label="Equipe" 
          value={project.members?.length || 0} 
          sub="Pessoas alocadas"
        />
        <KPI 
          label="Prazo" 
          value="45 dias" 
          sub="Restantes"
          delta={{ value: 'No prazo', trend: 'flat' }}
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Etapas card (span 2) */}
        <Card className="col-span-2">
          <CardHeader title="Etapas do Projeto" subtitle={`${project.stages.length} etapas definidas`}>
            <button className="btn sm ghost">Ver Gantt</button>
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
                {project.stages.map((stage: any) => (
                  <tr key={stage.id}>
                    <td className="b">{stage.name}</td>
                    <td><StatusChip status="todo" /></td>
                    <td className="muted">{stage.startDate ? formatDate(stage.startDate) : '-'}</td>
                    <td>
                      <AvatarStack>
                        <Avatar initials="JD" colorIndex={1} size="sm" />
                        <Avatar initials="LK" colorIndex={2} size="sm" />
                      </AvatarStack>
                    </td>
                    <td className="right">
                      <div className="row gap-2 justify-end">
                        <span className="xs mono muted">0%</span>
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-accent" style={{ width: '0%' }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>

        {/* Sidebar cards */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Equipe Alocada" />
            <CardBody className="flex flex-col gap-3">
              {project.members?.length > 0 ? project.members.map((member: any) => (
                <div key={member.id} className="row">
                  <Avatar initials={member.initials} colorIndex={member.avatarColor} size="sm" />
                  <div className="fill">
                    <div className="small b">{member.name}</div>
                    <div className="xs muted">{member.role}</div>
                  </div>
                  <div className="xs mono muted">40h/s</div>
                </div>
              )) : <div className="muted xs italic text-center py-4">Nenhum membro alocado.</div>}
              <button className="btn sm fill mt-2">Gerenciar Equipe</button>
            </CardBody>
          </Card>

          <Card>
             <CardHeader title="Próximas Entregas" />
             <CardBody className="flex flex-col gap-3">
                <div className="row gap-3">
                   <div className="w-1 h-8 rounded-full bg-success" />
                   <div className="fill">
                      <div className="small b">Aprovação Protótipo</div>
                      <div className="xs muted">12 de Junho · Milestone</div>
                   </div>
                </div>
                <div className="row gap-3">
                   <div className="w-1 h-8 rounded-full bg-warning" />
                   <div className="fill">
                      <div className="small b">Entrega v1.0</div>
                      <div className="xs muted">25 de Julho · Entrega Final</div>
                   </div>
                </div>
             </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
