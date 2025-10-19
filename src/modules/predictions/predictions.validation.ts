import { z } from 'zod';

export const createPredictionsSchema = z.object({
  eventIds: z
    .array(z.string().uuid('Invalid event ID'))
    .min(1, 'You must select at least one event')
    .max(20, 'Too many events selected'),
});

export type CreatePredictionsInput = z.infer<typeof createPredictionsSchema>;
