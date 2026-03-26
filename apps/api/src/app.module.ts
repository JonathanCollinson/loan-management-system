import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { MongooseModule } from '@nestjs/mongoose';
import { join } from 'path';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { HealthController } from './health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BorrowersModule } from './modules/borrowers/borrowers.module';
import { LoansModule } from './modules/loans/loans.module';
import { RepaymentsModule } from './modules/repayments/repayments.module';
import { FundingModule } from './modules/funding/funding.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SystemConfigModule } from './modules/system-config/system-config.module';

/** Nest runs with cwd = apps/api under npm workspaces; `.env` often lives at the monorepo root. */
const envFilePaths = [
  join(process.cwd(), '.env'),
  join(process.cwd(), '..', '..', '.env'),
];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: envFilePaths,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      context: ({ req }: { req: unknown }) => ({ req }),
    }),
    AuthModule,
    UsersModule,
    BorrowersModule,
    LoansModule,
    RepaymentsModule,
    FundingModule,
    DashboardModule,
    ReportsModule,
    SystemConfigModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
