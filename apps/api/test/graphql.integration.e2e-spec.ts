import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

type GraphqlBody = {
  errors?: unknown;
  data?: {
    login?: {
      accessToken: string;
      user?: { role: string; email?: string };
    };
    monthlyPrincipalBudget?: { month: string };
  };
};

describe('GraphQL integration (MongoMemoryServer or INTEGRATION_MONGODB_URI)', () => {
  let app: INestApplication<App> | undefined;
  let mongod: MongoMemoryServer | undefined;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'integration-jwt-secret';
    process.env.SEED_SUPER_ADMIN_EMAIL = 'super.integration@test.com';
    process.env.SEED_SUPER_ADMIN_PASSWORD = 'Integration123!';

    const existingUri = process.env.INTEGRATION_MONGODB_URI;
    if (existingUri) {
      process.env.MONGODB_URI = existingUri;
    } else {
      const downloadDir = join(__dirname, '.mongodb-ms');
      mkdirSync(downloadDir, { recursive: true });
      mongod = await MongoMemoryServer.create({
        binary: { downloadDir },
      });
      process.env.MONGODB_URI = mongod.getUri();
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  }, 120000);

  afterAll(async () => {
    if (app) await app.close();
    if (mongod) await mongod.stop();
  });

  it('login returns token for seeded Super Admin', async () => {
    const res = await request(app!.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation Login($input: LoginInput!) {
            login(input: $input) {
              accessToken
              user { role email }
            }
          }
        `,
        variables: {
          input: {
            email: 'super.integration@test.com',
            password: 'Integration123!',
          },
        },
      })
      .expect(200);

    const body = res.body as GraphqlBody;
    expect(body.errors).toBeUndefined();
    expect(body.data?.login?.accessToken).toBeDefined();
    expect(body.data?.login?.user?.role).toBe('SUPER_ADMIN');
  });

  it('monthlyPrincipalBudget requires auth', async () => {
    const res = await request(app!.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          query Budget($month: String!) {
            monthlyPrincipalBudget(month: $month) {
              month
              totalPrincipal
            }
          }
        `,
        variables: { month: '2026-03' },
      })
      .expect(200);

    const body = res.body as GraphqlBody;
    expect(body.errors).toBeDefined();
  });

  it('monthlyPrincipalBudget works for Super Admin', async () => {
    const loginRes = await request(app!.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation Login($input: LoginInput!) {
            login(input: $input) { accessToken }
          }
        `,
        variables: {
          input: {
            email: 'super.integration@test.com',
            password: 'Integration123!',
          },
        },
      })
      .expect(200);

    const loginBody = loginRes.body as GraphqlBody;
    const token = loginBody.data?.login?.accessToken;
    expect(token).toBeDefined();

    const res = await request(app!.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${token!}`)
      .send({
        query: `
          query Budget($month: String!) {
            monthlyPrincipalBudget(month: $month) {
              month
              totalPrincipal
              utilization {
                allocatedTotal
                principalLoanedTotal
              }
            }
          }
        `,
        variables: { month: '2026-03' },
      })
      .expect(200);

    const budgetBody = res.body as GraphqlBody;
    expect(budgetBody.errors).toBeUndefined();
    expect(budgetBody.data?.monthlyPrincipalBudget?.month).toBe('2026-03');
  });
});
