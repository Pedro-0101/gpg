import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, FolderKanban, Calendar } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProjectSchema, CreateProjectDto } from '@gpg/shared';
import { projectsApi } from '@/api/projects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { formatDate } from '@/lib/utils';
import { Project } from '@/types';

const statusLabel: Record<string, string> = {
  active: 'Ativo',
  paused: 'Pausado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};
const statusVariant: Record<string, 'default' | 'secondary' | 'success' | 'destructive'> = {
  active: 'default',
  paused: 'warning' as 'secondary',
  completed: 'success',
  cancelled: 'destructive',
};

export function ProjectsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.list,
  });

  const form = useForm<CreateProjectDto>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { dailyHours: 8, status: 'active' },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateProjectDto) =>
      editing ? projectsApi.update(editing.id, data) : projectsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      handleClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: projectsApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });

  function handleOpen(project?: Project) {
    if (project) {
      setEditing(project);
      form.reset({
        name: project.name,
        description: project.description ?? undefined,
        startDate: new Date(project.startDate),
        dailyHours: project.dailyHours,
        status: project.status as CreateProjectDto['status'],
      });
    } else {
      setEditing(null);
      form.reset({ dailyHours: 8, status: 'active' });
    }
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
    setEditing(null);
    form.reset();
  }

  return (
    <div className="flex-1 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Projetos</h1>
            <p className="text-muted-foreground text-sm mt-1">Gerencie todos os seus projetos</p>
          </div>
          <Button onClick={() => handleOpen()}>
            <Plus className="h-4 w-4" />
            Novo Projeto
          </Button>
        </div>

        {isLoading && <p className="text-muted-foreground">Carregando...</p>}

        <div className="grid gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="border rounded-lg p-5 bg-white hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <FolderKanban className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <h2 className="font-semibold">{project.name}</h2>
                    {project.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">{project.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Badge variant={statusVariant[project.status] ?? 'secondary'}>
                    {statusLabel[project.status] ?? project.status}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => handleOpen(project)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm('Excluir projeto e todos seus dados?')) {
                        deleteMutation.mutate(project.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Início: {formatDate(project.startDate)}
                </span>
                <span>{project.dailyHours}h/dia</span>
                {project._count && (
                  <>
                    <span>{project._count.stages} etapas</span>
                    <span>{project._count.teams} equipes</span>
                  </>
                )}
              </div>
            </div>
          ))}

          {!isLoading && projects.length === 0 && (
            <div className="text-center py-16 text-muted-foreground border rounded-lg border-dashed">
              <FolderKanban className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Nenhum projeto criado ainda.</p>
              <Button variant="outline" className="mt-4" onClick={() => handleOpen()}>
                Criar primeiro projeto
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Projeto' : 'Novo Projeto'}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit((d) => createMutation.mutate(d))}
            className="space-y-4"
          >
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input {...form.register('name')} placeholder="Nome do projeto" />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Descrição</Label>
              <Textarea {...form.register('description')} placeholder="Descrição opcional" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Data de início *</Label>
                <Input
                  type="date"
                  {...form.register('startDate', { valueAsDate: true })}
                />
              </div>
              <div className="space-y-1">
                <Label>Horas por dia</Label>
                <Input
                  type="number"
                  min={1}
                  max={24}
                  {...form.register('dailyHours', { valueAsNumber: true })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
