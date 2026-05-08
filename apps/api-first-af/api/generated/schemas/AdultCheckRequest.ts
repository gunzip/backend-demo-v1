import * as z from 'zod';

export type AdultCheckRequest = z.infer<typeof AdultCheckRequest>;
export const AdultCheckRequest = z.object({"birth_date": z.string().regex(new RegExp("^\\d{4}-\\d{2}-\\d{2}$")), "fiscal_code": z.string().regex(new RegExp("^[A-Z]{6}\\d{2}[ABCDEHLMPRST]\\d{2}[A-Z]\\d{3}[A-Z]$"))});