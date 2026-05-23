import { z } from 'zod';

export const createMilestoneSchema = z.object({
  stageId: z.string().optional().nullable(),
  name: z.string().min(1),
  date: z.coerce.date(),
  status: z.enum(['pending', 'reached', 'missed']).default('pending'),
});

export const updateMilestoneSchema = createMilestoneSchema.partial();

export type CreateMilestoneDto = z.infer<typeof createMilestoneSchema>;
export type UpdateMilestoneDto = z.infer<typeof updateMilestoneSchema>;
