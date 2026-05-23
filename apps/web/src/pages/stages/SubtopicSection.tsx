import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2, GitBranch, ArrowRight } from 'lucide-react';
import { createSubtopicSchema, CreateSubtopicDto } from '@gpg/shared';
import { subtopicsApi } from '@/api/subtopics';
import { teamsApi } from '@/api/teams';
import { Project, Stage, Topic, Subtopic } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatDate, cn } from '@/lib/utils';

interface Props {
  project: Project;
  stage: Stage;
  topic: Topic;
}

const statusLabel = { pending: 'Pendente', in_progress: 'Em andamento', completed: 'Concluído' };
const statusVariant = { pending: 'secondary', in_progress: 'default', completed: 'success' } as const;

export function SubtopicSection({ project, stage, topic }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Subtopic | null>(null);
  const subtopics = topic.subtopics ?? [];

  const { data: teams = [] } = useQuery({
    queryKey: ['teams', project.id],
    queryFn: () => teamsApi.list(project.id),
  });

  const form = useForm<CreateSubtopicDto>({
    resolver: zodResolver(createSubtopicSchema),
    defaultValues: { isConcurrent: false, order: subtopics.length + 1, status: 'pending', progress: 0 },
  });

  const saveMutation = useMutation({
    mutationFn: (data: CreateSubtopicDto) =>
      editing
        ? subtopicsApi.update(project.id, stage.id, topic.id, editing.id, data)
        : subtopicsApi.create(project.id, stage.id, topic.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stages', project.id] });
      handleClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => subtopicsApi.remove(project.id, stage.id, topic.id, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stages', project.id] }),
  });

  function handleOpen(sub?: Subtopic) {
    if (sub) {
      setEditing(sub);
      form.reset({
        name: sub.name,
        description: sub.description ?? undefined,
        durationHours: sub.durationHours,
        isConcurrent: sub.isConcurrent,
        order: sub.order,
        teamId: sub.teamId ?? undefined,
        status: sub.status,
        progress: sub.progress,
      });
    } else {
      setEditing(null);
      form.reset({ isConcurrent: false, order: subtopics.length + 1, status: 'pending', progress: 0 });
    }
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
    setEditing(null);
    form.reset();
  }

  const isConcurrent = form.watch('isConcurrent');

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Subtópicos / Tarefas</p>
        <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => handleOpen()}>
          <Plus className="h-3 w-3" />
          Tarefa
        </Button>
      </div>

      {subtopics.length === 0 && (
        <p className="text-xs text-muted-foreground italic px-1">Nenhuma tarefa. Tarefas podem ser sequenciais ou concomitantes.</p>
      )}

      <div className="space-y-1">
        {subtopics.map((sub) => (
          <div key={sub.id} className={cn('flex items-center gap-2 rounded px-2 py-1.5 text-sm', sub.isConcurrent ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50 border border-gray-100')}>
            {sub.isConcurrent ? (
              <span title="Concomitante"><GitBranch className="h-3 w-3 text-blue-500 shrink-0" /></span>
            ) : (
              <span title="Sequencial"><ArrowRight className="h-3 w-3 text-gray-400 shrink-0" /></span>
            )}
            <span className="flex-1 font-medium truncate">{sub.name}</span>
            <span className="text-xs text-muted-foreground shrink-0">{sub.durationHours}h</span>
            {sub.startDate && (
              <span className="text-xs text-muted-foreground shrink-0 hidden md:block">
                {formatDate(sub.startDate)} → {formatDate(sub.endDate)}
              </span>
            )}
            {sub.team && <Badge variant="outline" className="text-xs shrink-0">{sub.team.name}</Badge>}
            <Badge variant={statusVariant[sub.status] as 'secondary' | 'default' | 'success'} className="text-xs shrink-0">
              {statusLabel[sub.status]}
            </Badge>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleOpen(sub)}>
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => { if (confirm('Excluir tarefa?')) deleteMutation.mutate(sub.id); }}
            >
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input {...form.register('name')} placeholder="Nome da tarefa" />
            </div>
            <div className="space-y-1">
              <Label>Descrição</Label>
              <Textarea {...form.register('description')} rows={2} placeholder="Opcional" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Duração (horas) *</Label>
                <Input type="number" min={1} {...form.register('durationHours', { valueAsNumber: true })} />
              </div>
              <div className="space-y-1">
                <Label>Ordem</Label>
                <Input type="number" min={1} {...form.register('order', { valueAsNumber: true })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Execução</Label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" {...form.register('isConcurrent')} value="false" defaultChecked={!form.getValues('isConcurrent')}
                    onChange={() => form.setValue('isConcurrent', false)} checked={!isConcurrent} />
                  <ArrowRight className="h-3 w-3" />
                  Sequencial
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" {...form.register('isConcurrent')} value="true"
                    onChange={() => form.setValue('isConcurrent', true)} checked={!!isConcurrent} />
                  <GitBranch className="h-3 w-3 text-blue-500" />
                  Concomitante
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                {isConcurrent ? 'Executada em paralelo com outras tarefas concomitantes do tópico.' : 'Executada após todas as tarefas concomitantes terminarem.'}
              </p>
            </div>
            <div className="space-y-1">
              <Label>Equipe responsável</Label>
              <Select
                value={form.watch('teamId') ?? ''}
                onValueChange={(v) => form.setValue('teamId', v === '__none__' ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sem equipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sem equipe</SelectItem>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={form.watch('status')} onValueChange={(v) => form.setValue('status', v as CreateSubtopicDto['status'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="in_progress">Em andamento</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Progresso (%)</Label>
                <Input type="number" min={0} max={100} {...form.register('progress', { valueAsNumber: true })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
