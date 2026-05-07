import * as z from 'zod';

export type PostUsersIsAdult200Response = z.infer<typeof PostUsersIsAdult200Response>;
/**
 * Response schema for PostUsersIsAdult200
 */
export const PostUsersIsAdult200Response = z.boolean();