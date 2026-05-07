import * as z from 'zod';
import { ProblemDetails } from "./ProblemDetails.js";

export type ValidationError = z.infer<typeof ValidationError>;
export const ValidationError = z.object({...ProblemDetails.shape, ...z.object({"errors": z.array(z.object({"code": z.string(), "message": z.string(), "path": z.array(z.union([z.string(), z.number()]))}))}).shape});