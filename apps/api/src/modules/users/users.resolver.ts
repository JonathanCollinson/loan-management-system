import { NotFoundException } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserRole } from '../../common/enums/user-role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtUser } from '../../common/types/jwt-user';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateAdminInput } from './dto/create-admin.input';
import { CreateFieldUserInput } from './dto/create-field-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { UserObject } from './graphql/user.object';
import { UsersService } from './users.service';

@Resolver(() => UserObject)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => UserObject)
  async me(@CurrentUser() user: JwtUser): Promise<UserObject> {
    const u = await this.usersService.findById(user.id);
    if (!u) throw new NotFoundException();
    return this.usersService.toObject(u);
  }

  @Query(() => [UserObject])
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async listFieldUsers(): Promise<UserObject[]> {
    return this.usersService.listFieldUsers();
  }

  @Query(() => [UserObject])
  @Roles(UserRole.SUPER_ADMIN)
  async listAdmins(): Promise<UserObject[]> {
    return this.usersService.listAdmins();
  }

  @Mutation(() => UserObject)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async createFieldUser(
    @Args('input') input: CreateFieldUserInput,
    @CurrentUser() actor: JwtUser,
  ): Promise<UserObject> {
    return this.usersService.createFieldUser(input, actor.id);
  }

  @Mutation(() => UserObject)
  @Roles(UserRole.SUPER_ADMIN)
  async createAdmin(@Args('input') input: CreateAdminInput): Promise<UserObject> {
    return this.usersService.createAdmin(input);
  }

  @Mutation(() => UserObject)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updateUser(
    @Args('input') input: UpdateUserInput,
    @CurrentUser() actor: JwtUser,
  ): Promise<UserObject> {
    return this.usersService.updateUser(input, actor.role as UserRole);
  }
}
