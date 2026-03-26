import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { GraphqlRequestContext } from '../types/graphql-request-context';
import type { JwtUser } from '../types/jwt-user';

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext): JwtUser => {
    const ctx = GqlExecutionContext.create(context);
    const req = ctx.getContext<GraphqlRequestContext>().req;
    const user = req.user;
    if (!user) {
      throw new Error('CurrentUser used without authenticated user');
    }
    return user;
  },
);
