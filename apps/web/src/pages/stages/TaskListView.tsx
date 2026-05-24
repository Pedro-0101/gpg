import React from 'react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { StatusChip } from '../../components/ui/StatusChip';
import { Avatar, AvatarStack } from '../../components/ui/Avatar';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { formatDate, cn } from '../../lib/utils';
import { ChevronRight } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

interface TaskListViewProps {
  project: any;
  stages: any[];
}

export const TaskListView: React.FC<TaskListViewProps> = ({ project, stages }) => {
  const { projectId } = useParams();

  return (
    <div className="flex flex-col gap-6">
      {stages.map((stage) => (
        <Card key={stage.id} className="border-l-4" style={{ borderLeftColor: project.color }}>
          <CardHeader title={stage.name} subtitle={`${stage.topics?.length || 0} tópicos`}>
             <div className="row gap-4">
                <div className="xs muted mono">{formatDate(stage.startDate)} → {formatDate(stage.endDate)}</div>
                <ProgressBar progress={0} className="w-24" />
             </div>
          </CardHeader>
          <CardBody flush>
            <table className="tbl">
              <thead>
                <tr>
                  <th className="w-8"></th>
                  <th>TAREFA</th>
                  <th>RESPONSÁVEL</th>
                  <th>PRAZO</th>
                  <th>STATUS</th>
                  <th>PRIO</th>
                  <th className="right">PROGRESSO</th>
                </tr>
              </thead>
              <tbody>
                {stage.topics?.map((topic: any) => (
                  <React.Fragment key={topic.id}>
                    {/* Topic Row */}
                    <tr className="bg-surface-2/50">
                      <td className="center"><ChevronRight size={14} className="muted" /></td>
                      <td colSpan={6} className="b small uppercase tracking-wider text-xs muted">{topic.name}</td>
                    </tr>
                    {/* Subtopics */}
                    {topic.subtopics?.map((sub: any) => (
                      <tr key={sub.id}>
                        <td></td>
                        <td className="fill">
                           <Link to={`/projects/${projectId}/stages/${stage.id}/topics/${topic.id}/subtopics/${sub.id}`} className="col hover:text-accent cursor-pointer group">
                              <span className="b group-hover:underline">{sub.name}</span>
                              {sub.description && <span className="xs muted truncate max-w-xs">{sub.description}</span>}
                           </Link>
                        </td>
                        <td>
                          <AvatarStack>
                            {sub.assignments?.map((a: any) => (
                              <Avatar 
                                key={a.member.id} 
                                initials={a.member.initials} 
                                colorIndex={a.member.avatarColor} 
                                size="sm" 
                              />
                            ))}
                            {(!sub.assignments || sub.assignments.length === 0) && (
                              <Avatar initials="?" colorIndex={8} size="sm" />
                            )}
                          </AvatarStack>
                        </td>
                        <td className="muted xs mono">{sub.deadline ? formatDate(sub.deadline) : '-'}</td>
                        <td><StatusChip status={sub.status} /></td>
                        <td>
                           <span className={cn(
                             'chip xs outline',
                             sub.priority === 'high' && 'blocked',
                             sub.priority === 'med' && 'review'
                           )}>
                             {sub.priority?.toUpperCase() || 'MED'}
                           </span>
                        </td>
                        <td className="right">
                           <div className="row gap-2 justify-end">
                              <span className="xs mono muted">{sub.progress}%</span>
                              <ProgressBar progress={sub.progress} className="w-16" />
                           </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      ))}
    </div>
  );
};
