import { z } from 'zod';

export const createRiskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  probability: z.enum(['high', 'med', 'low']).default('med'),
  impact: z.enum(['high', 'med', 'low']).default('med'),
  status: z.enum(['active', 'resolved', 'accepted']).default('active'),
  responsePlan: z.string().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
});

export const updateRiskSchema = createRiskSchema.partial();

export type CreateRiskDto = z.infer<typeof createRiskSchema>;
export type UpdateRiskDto = z.infer<typeof updateRiskSchema>;
