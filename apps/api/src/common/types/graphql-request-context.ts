import type { JwtUser } from './jwt-user';

/** GraphQL HTTP context (`req` is Express request with Passport user). */
export type GraphqlRequestContext = {
  req: {
    user?: JwtUser;
  };
};
