import { z } from 'zod';

export const createSessionSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255),
  description: z.string().max(1000).optional(),
  maxPredictionsPerUser: z.number().int().min(1).max(20).default(5),
});

export const updateStateSchema = z.object({
  state: z.enum(['OPEN', 'ACTIVE', 'CLOSED']),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateStateInput = z.infer<typeof updateStateSchema>;