import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  dailyHours: z.number().int().min(1).max(24).default(8),
  status: z.enum(['active', 'paused', 'completed', 'cancelled']).default('active'),
  totalBudget: z.number().optional().nullable(),
  client: z.string().optional().nullable(),
  managerId: z.string().optional().nullable(),
  color: z.string().default('#4F46E5'),
});

export const updateProjectSchema = createProjectSchema.partial();

export type CreateProjectDto = z.infer<typeof createProjectSchema>;
export type UpdateProjectDto = z.infer<typeof updateProjectSchema>;
