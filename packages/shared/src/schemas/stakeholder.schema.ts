import { z } from 'zod';

export const createStakeholderSchema = z.object({
  name: z.string().min(1).max(200),
  role: z.string().optional(),
  organization: z.string().optional(),
  type: z.enum(['internal', 'external']).default('external'),
  influence: z.number().int().min(1).max(5).default(3),
  interest: z.number().int().min(1).max(5).default(3),
  engagementLevel: z
    .enum(['unaware', 'resistant', 'neutral', 'supportive', 'leading'])
    .default('neutral'),
  contactInfo: z.string().optional(),
});

export const updateStakeholderSchema = createStakeholderSchema.partial();

export type CreateStakeholderDto = z.infer<typeof createStakeholderSchema>;
export type UpdateStakeholderDto = z.infer<typeof updateStakeholderSchema>;
