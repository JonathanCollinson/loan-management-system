import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginInput } from './dto/login.input';
import { AuthPayload } from './graphql/auth-payload.object';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Mutation(() => AuthPayload)
  async login(@Args('input') input: LoginInput): Promise<AuthPayload> {
    return this.authService.login(input);
  }
}
