import { z } from 'zod';

export const createStageSchema = z.object({
  name: z.string().min(1).max(200),
  order: z.number().int().min(1),
});

export const updateStageSchema = createStageSchema.partial();
export const reorderStagesSchema = z.object({
  stages: z.array(z.object({ id: z.string(), order: z.number().int().min(1) })),
});

export type CreateStageDto = z.infer<typeof createStageSchema>;
export type UpdateStageDto = z.infer<typeof updateStageSchema>;
export type ReorderStagesDto = z.infer<typeof reorderStagesSchema>;
