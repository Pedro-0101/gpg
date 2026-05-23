import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { createTopicSchema, CreateTopicDto } from '@gpg/shared';
import { topicsApi } from '@/api/topics';
import { Project, Stage, Topic } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { SubtopicSection } from './SubtopicSection';
import { formatDate } from '@/lib/utils';

interface Props {
  project: Project;
  stage: Stage;
}

export function TopicSection({ project, stage }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Topic | null>(null);
  const topics = stage.topics ?? [];

  const form = useForm<CreateTopicDto>({
    resolver: zodResolver(createTopicSchema),
    defaultValues: { order: topics.length + 1 },
  });

  const saveMutation = useMutation({
    mutationFn: (data: CreateTopicDto) =>
      editing
        ? topicsApi.update(project.id, stage.id, editing.id, data)
        : topicsApi.create(project.id, stage.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stages', project.id] });
      handleClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => topicsApi.remove(project.id, stage.id, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stages', project.id] }),
  });

  function handleOpen(topic?: Topic) {
    if (topic) {
      setEditing(topic);
      form.reset({ name: topic.name, order: topic.order });
    } else {
      setEditing(null);
      form.reset({ order: topics.length + 1 });
    }
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
    setEditing(null);
    form.reset();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Tópicos</p>
        <Button size="sm" variant="outline" onClick={() => handleOpen()}>
          <Plus className="h-3 w-3" />
          Tópico
        </Button>
      </div>

      {topics.length === 0 && (
        <p className="text-sm text-muted-foreground italic">Nenhum tópico. Tópicos dentro de uma etapa são executados em paralelo.</p>
      )}

      <div className="space-y-3">
        {topics.map((topic) => (
          <div key={topic.id} className="border rounded-md bg-white">
            <div className="flex items-center gap-2 px-3 py-2 border-b">
              <span className="w-5 h-5 rounded bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">{topic.order}</span>
              <span className="font-medium text-sm flex-1">{topic.name}</span>
              {topic.startDate && (
                <span className="text-xs text-muted-foreground">{formatDate(topic.startDate)} → {formatDate(topic.endDate)}</span>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpen(topic)}>
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                  if (confirm('Excluir tópico e subtópicos?')) deleteMutation.mutate(topic.id);
                }}
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
            <div className="p-2">
              <SubtopicSection project={project} stage={stage} topic={topic} />
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Tópico' : 'Novo Tópico'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input {...form.register('name')} placeholder="Ex: Levantamento de requisitos" />
            </div>
            <div className="space-y-1">
              <Label>Ordem</Label>
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
