import * as z from 'zod';

/**
 * Response schema for PostUsersIsAdult200
 */
export const PostUsersIsAdult200Response = z.boolean();
export type PostUsersIsAdult200Response = z.infer<typeof PostUsersIsAdult200Response>;