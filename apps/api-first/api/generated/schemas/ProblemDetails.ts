import * as z from 'zod';

export const ProblemDetails = z.object({"detail": z.string(), "status": z.number(), "title": z.string(), "type": z.string()});
export type ProblemDetails = z.infer<typeof ProblemDetails>;