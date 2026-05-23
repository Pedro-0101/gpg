import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2, UserCheck } from 'lucide-react';
import { createStakeholderSchema, CreateStakeholderDto } from '@gpg/shared';
import { stakeholdersApi } from '@/api/stakeholders';
import { Project, Stakeholder } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface Props {
  project: Project;
}

const engagementLabel: Record<string, string> = {
  unaware: 'Desinformado',
  resistant: 'Resistente',
  neutral: 'Neutro',
  supportive: 'Apoiador',
  leading: 'Líder',
};

const engagementVariant: Record<string, string> = {
  unaware: 'secondary',
  resistant: 'destructive',
  neutral: 'outline',
  supportive: 'success',
  leading: 'default',
};

export function StakeholdersPage({ project }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Stakeholder | null>(null);

  const { data: stakeholders = [], isLoading } = useQuery({
    queryKey: ['stakeholders', project.id],
    queryFn: () => stakeholdersApi.list(project.id),
  });

  const form = useForm<CreateStakeholderDto>({
    resolver: zodResolver(createStakeholderSchema),
    defaultValues: { type: 'external', influence: 3, interest: 3, engagementLevel: 'neutral' },
  });

  const saveMutation = useMutation({
    mutationFn: (data: CreateStakeholderDto) =>
      editing
        ? stakeholdersApi.update(project.id, editing.id, data)
        : stakeholdersApi.create(project.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stakeholders', project.id] });
      handleClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => stakeholdersApi.remove(project.id, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stakeholders', project.id] }),
  });

  function handleOpen(s?: Stakeholder) {
    if (s) {
      setEditing(s);
      form.reset({
        name: s.name,
        role: s.role ?? undefined,
        organization: s.organization ?? undefined,
        type: s.type as 'internal' | 'external',
        influence: s.influence,
        interest: s.interest,
        engagementLevel: s.engagementLevel as CreateStakeholderDto['engagementLevel'],
        contactInfo: s.contactInfo ?? undefined,
      });
    } else {
      setEditing(null);
      form.reset({ type: 'external', influence: 3, interest: 3, engagementLevel: 'neutral' });
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
          <h2 className="text-xl font-bold">Stakeholders</h2>
          <p className="text-sm text-muted-foreground">Registro de partes interessadas com influência e interesse no projeto.</p>
        </div>
        <Button onClick={() => handleOpen()}>
          <Plus className="h-4 w-4" />
          Novo Stakeholder
        </Button>
      </div>

      {isLoading && <p className="text-muted-foreground">Carregando...</p>}

      <div className="border rounded-lg overflow-hidden bg-white">
        {stakeholders.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-xs text-muted-foreground">
                <th className="px-4 py-2">Nome</th>
                <th className="px-4 py-2">Função / Organização</th>
                <th className="px-4 py-2 text-center">Tipo</th>
                <th className="px-4 py-2 text-center">Influência</th>
                <th className="px-4 py-2 text-center">Interesse</th>
                <th className="px-4 py-2">Engajamento</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {stakeholders.map((s) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{s.name}</td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {[s.role, s.organization].filter(Boolean).join(' / ') || '—'}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <Badge variant={s.type === 'internal' ? 'default' : 'outline'}>
                      {s.type === 'internal' ? 'Interno' : 'Externo'}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <InfluenceBar value={s.influence} />
                  </td>
                  <td className="px-4 py-2 text-center">
                    <InfluenceBar value={s.interest} />
                  </td>
                  <td className="px-4 py-2">
                    <Badge variant={engagementVariant[s.engagementLevel] as 'default' | 'secondary' | 'destructive' | 'outline' | 'success'}>
                      {engagementLabel[s.engagementLevel] ?? s.engagementLevel}
                    </Badge>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpen(s)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                        if (confirm('Excluir stakeholder?')) deleteMutation.mutate(s.id);
                      }}>
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
              <UserCheck className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>Nenhum stakeholder cadastrado.</p>
              <Button variant="outline" className="mt-3" onClick={() => handleOpen()}>Adicionar stakeholder</Button>
            </div>
          )
        )}
      </div>

      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Stakeholder' : 'Novo Stakeholder'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 col-span-2">
                <Label>Nome *</Label>
                <Input {...form.register('name')} placeholder="Nome completo" />
              </div>
              <div className="space-y-1">
                <Label>Função / Cargo</Label>
                <Input {...form.register('role')} placeholder="Ex: Diretor de TI" />
              </div>
              <div className="space-y-1">
                <Label>Organização</Label>
                <Input {...form.register('organization')} placeholder="Ex: Empresa XYZ" />
              </div>
              <div className="space-y-1">
                <Label>Contato</Label>
                <Input {...form.register('contactInfo')} placeholder="Email ou telefone" />
              </div>
              <div className="space-y-1">
                <Label>Tipo</Label>
                <Select value={form.watch('type')} onValueChange={(v) => form.setValue('type', v as 'internal' | 'external')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Interno</SelectItem>
                    <SelectItem value="external">Externo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Engajamento</Label>
                <Select value={form.watch('engagementLevel')} onValueChange={(v) => form.setValue('engagementLevel', v as CreateStakeholderDto['engagementLevel'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(engagementLabel).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Influência (1–5)</Label>
                <Input type="number" min={1} max={5} {...form.register('influence', { valueAsNumber: true })} />
              </div>
              <div className="space-y-1">
                <Label>Interesse (1–5)</Label>
                <Input type="number" min={1} max={5} {...form.register('interest', { valueAsNumber: true })} />
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

function InfluenceBar({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5 justify-center">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={cn('w-2 h-2 rounded-full', i < value ? 'bg-primary' : 'bg-gray-200')} />
      ))}
    </div>
  );
}
