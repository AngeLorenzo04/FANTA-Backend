import { z } from 'zod';

export const createEventSchema = z.object({
  description: z.string().min(3, 'Description must be at least 3 characters').max(500),
  points: z.number().int().min(1, 'Points must be at least 1').max(100),
});

export const updateEventSchema = z.object({
  description: z.string().min(3).max(500).optional(),
  points: z.number().int().min(1).max(100).optional(),
});

export const verifyEventSchema = z.object({
  happened: z.boolean(),
});

export const verifyBatchSchema = z.object({
  events: z.array(
    z.object({
      id: z.string().uuid(),
      happened: z.boolean(),
    })
  ),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type VerifyEventInput = z.infer<typeof verifyEventSchema>;
export type VerifyBatchInput = z.infer<typeof verifyBatchSchema>;