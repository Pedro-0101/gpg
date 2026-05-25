import { z } from 'zod';

export const createSubtopicSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  durationHours: z.number().int().min(1),
  isConcurrent: z.boolean().default(false),
  order: z.number().int().min(1).default(1),
  teamIds: z.string().array().optional().default([]),
  status: z.enum(['todo', 'inprog', 'review', 'done', 'blocked']).default('todo'),
  progress: z.number().int().min(0).max(100).default(0),
  spentHours: z.number().min(0).default(0),
  deadline: z.coerce.date().optional().nullable(),
  taskType: z.enum(['task', 'milestone', 'deliverable']).default('task'),
  priority: z.enum(['high', 'med', 'low']).default('med'),
});

export const updateSubtopicSchema = createSubtopicSchema.partial();

export type CreateSubtopicDto = z.infer<typeof createSubtopicSchema>;
export type UpdateSubtopicDto = z.infer<typeof updateSubtopicSchema>;
