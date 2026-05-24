import { z } from 'zod';

export const createProfessionalSchema = z.object({
  name: z.string().min(1).max(200),
  initials: z.string().min(1).max(4),
  role: z.string().min(1).max(200),
  hourlyCost: z.number().min(0),
  skills: z.array(z.string()).default([]),
  avatarColor: z.number().int().min(0).max(7).default(0),
});

export const updateProfessionalSchema = createProfessionalSchema.partial();

export type CreateProfessionalDto = z.infer<typeof createProfessionalSchema>;
export type UpdateProfessionalDto = z.infer<typeof updateProfessionalSchema>;
