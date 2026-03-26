import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Types } from 'mongoose';
import { UserRole } from '../../common/enums/user-role.enum';
import { CreateAdminInput } from './dto/create-admin.input';
import { CreateFieldUserInput } from './dto/create-field-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { UserObject } from './graphql/user.object';
import { UserDocument } from './schemas/user.schema';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly repo: UsersRepository,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const count = await this.repo.count();
    if (count > 0) return;

    const email = this.config.get<string>('SEED_SUPER_ADMIN_EMAIL');
    const password = this.config.get<string>('SEED_SUPER_ADMIN_PASSWORD');
    if (!email || !password) {
      this.logger.warn(
        'No users in DB; set SEED_SUPER_ADMIN_EMAIL and SEED_SUPER_ADMIN_PASSWORD to seed SuperAdmin.',
      );
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await this.repo.create({
      email: email.toLowerCase(),
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      name: 'Super Admin',
      isActive: true,
      walletBalance: 0,
    });
    this.logger.log(`Seeded SuperAdmin: ${email}`);
  }

  toObject(doc: UserDocument): UserObject {
    return {
      id: doc._id.toString(),
      email: doc.email,
      name: doc.name,
      role: doc.role,
      isActive: doc.isActive,
      walletBalance: doc.walletBalance ?? 0,
    };
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.repo.findById(id);
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.repo.findByEmail(email);
  }

  async validateCredentials(
    email: string,
    password: string,
  ): Promise<UserDocument | null> {
    const user = await this.repo.findByEmail(email);
    if (!user || !user.isActive) return null;
    const ok = await bcrypt.compare(password, user.passwordHash);
    return ok ? user : null;
  }

  async createFieldUser(
    input: CreateFieldUserInput,
    createdById: string,
  ): Promise<UserObject> {
    const existing = await this.repo.findByEmail(input.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await bcrypt.hash(input.password, 10);
    const doc = await this.repo.create({
      email: input.email.toLowerCase(),
      passwordHash,
      role: UserRole.USER,
      name: input.name,
      isActive: true,
      walletBalance: 0,
      createdByUserId: new Types.ObjectId(createdById),
    });
    return this.toObject(doc);
  }

  async createAdmin(input: CreateAdminInput): Promise<UserObject> {
    const existing = await this.repo.findByEmail(input.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await bcrypt.hash(input.password, 10);
    const doc = await this.repo.create({
      email: input.email.toLowerCase(),
      passwordHash,
      role: UserRole.ADMIN,
      name: input.name,
      isActive: true,
      walletBalance: 0,
    });
    return this.toObject(doc);
  }

  async updateUser(
    input: UpdateUserInput,
    actorRole: UserRole,
  ): Promise<UserObject> {
    const user = await this.repo.findById(input.userId);
    if (!user) throw new NotFoundException('User not found');

    if (actorRole === UserRole.ADMIN) {
      if (user.role !== UserRole.USER) {
        throw new BadRequestException('Admins may only update field users');
      }
    }

    const data: Record<string, unknown> = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.isActive !== undefined) data.isActive = input.isActive;
    if (input.password) {
      data.passwordHash = await bcrypt.hash(input.password, 10);
    }

    const updated = await this.repo.updateById(input.userId, data);
    if (!updated) throw new NotFoundException('User not found');
    return this.toObject(updated);
  }

  async listFieldUsers(): Promise<UserObject[]> {
    const docs = await this.repo.findByRole(UserRole.USER);
    return docs.map((d) => this.toObject(d));
  }

  async listAdmins(): Promise<UserObject[]> {
    const docs = await this.repo.findByRole(UserRole.ADMIN);
    return docs.map((d) => this.toObject(d));
  }

  /** Field users, admins, and super admins (valid funding recipients). */
  async listFundingRecipients(): Promise<UserObject[]> {
    const docs = await this.repo.findByRoles([
      UserRole.USER,
      UserRole.ADMIN,
      UserRole.SUPER_ADMIN,
    ]);
    return docs.map((d) => this.toObject(d));
  }

  async assertUserIsFieldAgent(userId: string): Promise<UserDocument> {
    const u = await this.repo.findById(userId);
    if (!u || u.role !== UserRole.USER) {
      throw new BadRequestException('Target must be a field user');
    }
    return u;
  }
}
