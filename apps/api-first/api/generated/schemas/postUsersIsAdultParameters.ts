import * as z from "zod";

/* Parameter schemas for type-safe inputs */
const postUsersIsAdultHeadersSchema = z.object({ "Authorization": z.string().optional() });

/* Server parameter schemas with coercion and lowercase headers */
const postUsersIsAdultServerHeadersSchema = z.object({ "authorization": z.string() });

/* Export schemas for external use */
export { postUsersIsAdultHeadersSchema };

/* Export server schemas */
export { postUsersIsAdultServerHeadersSchema };

/* Export types for external use */
export type postUsersIsAdultHeadersSchema = z.infer<typeof postUsersIsAdultHeadersSchema>;

/* Combined parsed parameters object */
export const postUsersIsAdultParsedParams = z.object({
  headers: postUsersIsAdultHeadersSchema.optional()
});

/* Combined parsed parameters type */
export type postUsersIsAdultParsedParamsType = z.infer<typeof postUsersIsAdultParsedParams>;

/* Combined server parsed parameters object */
export const postUsersIsAdultServerParsedParams = z.object({
  headers: postUsersIsAdultServerHeadersSchema
});

/* Combined server parsed parameters type */
export type postUsersIsAdultServerParsedParamsType = z.infer<typeof postUsersIsAdultServerParsedParams>;
