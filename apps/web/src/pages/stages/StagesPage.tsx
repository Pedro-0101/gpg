import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, Clock, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { createStageSchema, CreateStageDto } from '@gpg/shared';
import { stagesApi } from '@/api/stages';
import { Project, Stage, Topic, Subtopic } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatDate, cn } from '@/lib/utils';
import { TopicSection } from './TopicSection';

interface Props {
  project: Project;
}

const statusIcon = {
  pending: <Circle className="h-4 w-4 text-gray-400" />,
  in_progress: <AlertCircle className="h-4 w-4 text-blue-500" />,
  completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
};

export function StagesPage({ project }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Stage | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const { data: stages = [], isLoading } = useQuery({
    queryKey: ['stages', project.id],
    queryFn: () => stagesApi.list(project.id),
  });

  const form = useForm<CreateStageDto>({
    resolver: zodResolver(createStageSchema),
    defaultValues: { order: (stages.length || 0) + 1 },
  });

  const saveMutation = useMutation({
    mutationFn: (data: CreateStageDto) =>
      editing
        ? stagesApi.update(project.id, editing.id, data)
        : stagesApi.create(project.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stages', project.id] });
      handleClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => stagesApi.remove(project.id, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stages', project.id] }),
  });

  function handleOpen(stage?: Stage) {
    if (stage) {
      setEditing(stage);
      form.reset({ name: stage.name, order: stage.order });
    } else {
      setEditing(null);
      form.reset({ order: stages.length + 1 });
    }
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
    setEditing(null);
    form.reset();
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function countSubtopics(stage: Stage) {
    return stage.topics?.reduce((sum, t) => sum + (t.subtopics?.length ?? 0), 0) ?? 0;
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Etapas & Tarefas</h2>
          <p className="text-sm text-muted-foreground">Etapas são executadas em sequência. Tópicos e subtópicos dentro de uma etapa podem ser paralelos.</p>
        </div>
        <Button onClick={() => handleOpen()}>
          <Plus className="h-4 w-4" />
          Nova Etapa
        </Button>
      </div>

      {isLoading && <p className="text-muted-foreground">Carregando...</p>}

      <div className="space-y-4">
        {stages.map((stage, idx) => {
          const isExpanded = expanded.has(stage.id);
          const taskCount = countSubtopics(stage);
          return (
            <div key={stage.id} className="border rounded-lg bg-white overflow-hidden">
              <div
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 select-none"
                onClick={() => toggleExpand(stage.id)}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                  {stage.order}
                </div>
                {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                <div className="flex-1">
                  <span className="font-semibold">{stage.name}</span>
                  <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                    {stage.startDate && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(stage.startDate)} → {formatDate(stage.endDate)}</span>}
                    <span>{stage.topics?.length ?? 0} tópicos</span>
                    <span>{taskCount} tarefas</span>
                  </div>
                </div>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" onClick={() => handleOpen(stage)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm('Excluir etapa e todos os tópicos/subtópicos?')) {
                        deleteMutation.mutate(stage.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t bg-gray-50 p-4">
                  <TopicSection project={project} stage={stage} />
                </div>
              )}
            </div>
          );
        })}

        {!isLoading && stages.length === 0 && (
          <div className="text-center py-12 border border-dashed rounded-lg text-muted-foreground">
            <p>Nenhuma etapa criada.</p>
            <Button variant="outline" className="mt-3" onClick={() => handleOpen()}>Criar primeira etapa</Button>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Etapa' : 'Nova Etapa'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input {...form.register('name')} placeholder="Ex: Iniciação" />
            </div>
            <div className="space-y-1">
              <Label>Ordem (sequência)</Label>
              <Input type="number" min={1} {...form.register('order', { valueAsNumber: true })} />
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
