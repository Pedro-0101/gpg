import { z } from 'zod';

export const createTeamMemberSchema = z.object({
  name: z.string().min(1),
  initials: z.string().min(1).max(4),
  role: z.string().min(1),
  skills: z.array(z.string()).default([]),
  avatarColor: z.number().int().min(0).max(7).default(0),
});

export const updateTeamMemberSchema = createTeamMemberSchema.partial();

export type CreateTeamMemberDto = z.infer<typeof createTeamMemberSchema>;
export type UpdateTeamMemberDto = z.infer<typeof updateTeamMemberSchema>;
