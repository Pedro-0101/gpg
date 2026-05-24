import { z } from 'zod';

export const createCostEntrySchema = z.object({
  stageId: z.string().optional().nullable(),
  professionalId: z.string().optional().nullable(),
  description: z.string().min(1),
  category: z.enum(['Pessoal', 'Ferramentas', 'Infraestrutura', 'Freelancers']),
  amount: z.number().min(0),
  hours: z.number().min(0).optional().nullable(),
  date: z.coerce.date().default(() => new Date()),
});

export const updateCostEntrySchema = createCostEntrySchema.partial();

export type CreateCostEntryDto = z.infer<typeof createCostEntrySchema>;
export type UpdateCostEntryDto = z.infer<typeof updateCostEntrySchema>;
