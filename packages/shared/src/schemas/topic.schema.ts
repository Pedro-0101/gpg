import { z } from 'zod';

export const createTopicSchema = z.object({
  name: z.string().min(1).max(200),
  order: z.number().int().min(1),
});

export const updateTopicSchema = createTopicSchema.partial();

export type CreateTopicDto = z.infer<typeof createTopicSchema>;
export type UpdateTopicDto = z.infer<typeof updateTopicSchema>;
