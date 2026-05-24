import { z } from 'zod';

export const teamProfessionalSchema = z.object({
  professionalId: z.string(),
});

export const createTeamSchema = z.object({
  name: z.string().min(1).max(200),
  professionals: z.array(teamProfessionalSchema).default([]),
});

export const updateTeamSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  professionals: z.array(teamProfessionalSchema).optional(),
});

export type TeamProfessionalDto = z.infer<typeof teamProfessionalSchema>;
export type CreateTeamDto = z.infer<typeof createTeamSchema>;
export type UpdateTeamDto = z.infer<typeof updateTeamSchema>;
