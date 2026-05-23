import { z } from 'zod';

export const createProfessionalSchema = z.object({
  role: z.string().min(1).max(200),
  hourlyCost: z.number().min(0),
});

export const updateProfessionalSchema = createProfessionalSchema.partial();

export type CreateProfessionalDto = z.infer<typeof createProfessionalSchema>;
export type UpdateProfessionalDto = z.infer<typeof updateProfessionalSchema>;
