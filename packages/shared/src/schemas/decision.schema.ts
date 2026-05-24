import { z } from 'zod';

export const createDecisionSchema = z.object({
  professionalId: z.string().optional().nullable(),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
  status: z.enum(['pending', 'decided', 'cancelled']).default('pending'),
});

export const updateDecisionSchema = createDecisionSchema.partial();

export type CreateDecisionDto = z.infer<typeof createDecisionSchema>;
export type UpdateDecisionDto = z.infer<typeof updateDecisionSchema>;
