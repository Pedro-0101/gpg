import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2, Briefcase } from 'lucide-react';
import { createProfessionalSchema, CreateProfessionalDto } from '@gpg/shared';
import { professionalsApi } from '@/api/professionals';
import { Project, Professional } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';

interface Props {
  project: Project;
}

export function ProfessionalsPage({ project }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Professional | null>(null);

  const { data: professionals = [], isLoading } = useQuery({
    queryKey: ['professionals', project.id],
    queryFn: () => professionalsApi.list(project.id),
  });

  const form = useForm<CreateProfessionalDto>({
    resolver: zodResolver(createProfessionalSchema),
    defaultValues: { hourlyCost: 0 },
  });

  const saveMutation = useMutation({
    mutationFn: (data: CreateProfessionalDto) =>
      editing
        ? professionalsApi.update(project.id, editing.id, data)
        : professionalsApi.create(project.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['professionals', project.id] });
      handleClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => professionalsApi.remove(project.id, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['professionals', project.id] }),
  });

  function handleOpen(p?: Professional) {
    if (p) {
      setEditing(p);
      form.reset({ role: p.role, hourlyCost: Number(p.hourlyCost) });
    } else {
      setEditing(null);
      form.reset({ hourlyCost: 0 });
    }
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
    setEditing(null);
    form.reset();
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Profissionais</h2>
          <p className="text-sm text-muted-foreground">
            Funções e seus custos por hora. Ex: "Desenvolvedor Backend — R$50/h". Usados para compor equipes.
          </p>
        </div>
        <Button onClick={() => handleOpen()}>
          <Plus className="h-4 w-4" />
          Nova Função
        </Button>
      </div>

      {isLoading && <p className="text-muted-foreground">Carregando...</p>}

      <div className="border rounded-lg overflow-hidden bg-white">
        {professionals.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-xs text-muted-foreground">
                <th className="px-4 py-2">Função / Cargo</th>
                <th className="px-4 py-2 text-right">Custo/hora</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {professionals.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{p.role}</td>
                  <td className="px-4 py-2 text-right font-mono">{formatCurrency(Number(p.hourlyCost))}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpen(p)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          if (confirm('Excluir esta função?')) deleteMutation.mutate(p.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          !isLoading && (
            <div className="text-center py-12 text-muted-foreground">
              <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>Nenhuma função cadastrada.</p>
              <Button variant="outline" className="mt-3" onClick={() => handleOpen()}>
                Cadastrar função
              </Button>
            </div>
          )
        )}
      </div>

      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Função' : 'Nova Função'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
            <div className="space-y-1">
              <Label>Função / Cargo *</Label>
              <Input
                {...form.register('role')}
                placeholder="Ex: Desenvolvedor Backend, Analista de RH, Designer UX"
              />
              {form.formState.errors.role && (
                <p className="text-xs text-destructive">{form.formState.errors.role.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Custo por hora (R$) *</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                {...form.register('hourlyCost', { valueAsNumber: true })}
              />
              {form.formState.errors.hourlyCost && (
                <p className="text-xs text-destructive">{form.formState.errors.hourlyCost.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
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
