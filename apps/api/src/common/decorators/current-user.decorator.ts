import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { JwtUser } from '../types/jwt-user';

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext): JwtUser => {
    const ctx = GqlExecutionContext.create(context);
    const req = ctx.getContext().req;
    return req.user;
  },
);
