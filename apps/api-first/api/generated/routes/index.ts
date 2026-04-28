/* Individual route exports */
export { clientRoute as postUsersIsAdultClientRoute, serverRoute as postUsersIsAdultServerRoute } from "./postUsersIsAdult.js";

/* Route imports for routes object */
import { serverRoute as postUsersIsAdultRoute } from "./postUsersIsAdult.js";

/* Combined routes object */
export const routes = {
  postUsersIsAdult: postUsersIsAdultRoute,
} as const;
