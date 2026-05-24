import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Pencil, Trash2, Users, UserPlus } from 'lucide-react';
import { createTeamSchema, CreateTeamDto } from '@gpg/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { teamsApi } from '@/api/teams';
import { professionalsApi } from '@/api/professionals';
import { Project, Team } from '@/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';

interface Props {
  project: Project;
}

const AVATAR_COLORS = ['#4f46e5','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6'];

export function TeamsPage({ project }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Team | null>(null);

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['teams', project.id],
    queryFn: () => teamsApi.list(project.id),
  });

  const { data: professionals = [] } = useQuery({
    queryKey: ['professionals', project.id],
    queryFn: () => professionalsApi.list(project.id),
  });

  const form = useForm<CreateTeamDto>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: { professionals: [] },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'professionals' });

  const saveMutation = useMutation({
    mutationFn: (data: CreateTeamDto) =>
      editing ? teamsApi.update(project.id, editing.id, data) : teamsApi.create(project.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams', project.id] });
      handleClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => teamsApi.remove(project.id, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teams', project.id] }),
  });

  function handleOpen(team?: Team) {
    if (team) {
      setEditing(team);
      form.reset({
        name: team.name,
        professionals: team.professionals.map((tp) => ({ professionalId: tp.professionalId })),
      });
    } else {
      setEditing(null);
      form.reset({ professionals: [] });
    }
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
    setEditing(null);
    form.reset();
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Equipes</h2>
          <p className="text-sm text-muted-foreground">Grupos de profissionais. O custo por hora é a soma dos membros.</p>
        </div>
        <Button onClick={() => handleOpen()}>
          <Plus className="h-4 w-4" />
          Nova Equipe
        </Button>
      </div>

      {professionals.length === 0 && (
        <div className="mb-4 border border-yellow-200 bg-yellow-50 rounded-lg p-3 text-sm text-yellow-800">
          Cadastre profissionais primeiro em <strong>Profissionais</strong> para poder montar equipes.
        </div>
      )}

      {isLoading && <p className="text-muted-foreground">Carregando...</p>}

      <div className="grid gap-4">
        {teams.map((team) => {
          const totalCostPerHour = team.professionals.reduce(
            (sum, tp) => sum + Number(tp.professional.hourlyCost), 0
          );
          return (
            <div key={team.id} className="border rounded-lg p-5 bg-white">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{team.name}</h3>
                  <span className="text-xs text-muted-foreground">({team.professionals.length} membro{team.professionals.length !== 1 ? 's' : ''})</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleOpen(team)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => {
                    if (confirm('Excluir equipe?')) deleteMutation.mutate(team.id);
                  }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              {team.professionals.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground text-xs border-b">
                      <th className="pb-1">Nome</th>
                      <th className="pb-1">Função</th>
                      <th className="pb-1 text-right">Custo/h</th>
                    </tr>
                  </thead>
                  <tbody>
                    {team.professionals.map((tp) => (
                      <tr key={tp.professionalId} className="border-b last:border-0">
                        <td className="py-1">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{
                              width: 24, height: 24, borderRadius: '50%',
                              background: AVATAR_COLORS[tp.professional.avatarColor ?? 0],
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#fff', fontWeight: 700, fontSize: 10, flexShrink: 0,
                            }}>{tp.professional.initials}</div>
                            <span className="font-medium">{tp.professional.name}</span>
                          </div>
                        </td>
                        <td className="py-1 text-muted-foreground">{tp.professional.role}</td>
                        <td className="py-1 text-right">{formatCurrency(Number(tp.professional.hourlyCost))}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-semibold text-sm border-t">
                      <td colSpan={2} className="pt-2">Total/hora</td>
                      <td className="pt-2 text-right">{formatCurrency(totalCostPerHour)}</td>
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <p className="text-sm text-muted-foreground italic">Sem membros.</p>
              )}
            </div>
          );
        })}

        {!isLoading && teams.length === 0 && (
          <div className="text-center py-12 border border-dashed rounded-lg text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>Nenhuma equipe criada.</p>
            <Button variant="outline" className="mt-3" onClick={() => handleOpen()}>Criar primeira equipe</Button>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Equipe' : 'Nova Equipe'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
            <div className="space-y-1">
              <Label>Nome da equipe *</Label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                {...form.register('name')}
                placeholder="Ex: Equipe de TI"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Membros</Label>
                <Button type="button" size="sm" variant="outline" onClick={() => append({ professionalId: '' })}>
                  <UserPlus className="h-3 w-3" />
                  Adicionar
                </Button>
              </div>
              {fields.length === 0 && <p className="text-xs text-muted-foreground italic">Nenhum membro adicionado.</p>}
              <div className="space-y-2">
                {fields.map((field, idx) => (
                  <div key={field.id} className="flex gap-2 items-center">
                    <Select
                      value={form.watch(`professionals.${idx}.professionalId`)}
                      onValueChange={(v) => form.setValue(`professionals.${idx}.professionalId`, v)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecionar profissional" />
                      </SelectTrigger>
                      <SelectContent>
                        {professionals.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} — {p.role} — {formatCurrency(Number(p.hourlyCost))}/h
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(idx)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
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
