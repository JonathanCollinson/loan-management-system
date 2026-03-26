const DEFAULT_GRAPHQL = 'http://127.0.0.1:4000/graphql';

export function graphqlUrl(): string {
  return process.env.NEXT_PUBLIC_GRAPHQL_URL ?? DEFAULT_GRAPHQL;
}

export async function graphql<T>(
  query: string,
  variables?: Record<string, unknown>,
  token?: string,
): Promise<T> {
  const res = await fetch(graphqlUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = (await res.json()) as {
    data?: T;
    errors?: { message: string }[];
  };
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join('; '));
  }
  if (!json.data) {
    throw new Error('Empty GraphQL response');
  }
  return json.data;
}

export async function loginAccessToken(
  email: string,
  password: string,
): Promise<string> {
  const data = await graphql<{ login: { accessToken: string } }>(
    `mutation Login($input: LoginInput!) {
      login(input: $input) { accessToken }
    }`,
    { input: { email, password } },
  );
  return data.login.accessToken;
}

export async function seedE2EUsers(opts: {
  superAdminEmail: string;
  superAdminPassword: string;
  adminEmail: string;
  adminPassword: string;
  adminName: string;
  fieldUserEmail: string;
  fieldUserPassword: string;
  fieldUserName: string;
}): Promise<void> {
  const superToken = await loginAccessToken(
    opts.superAdminEmail,
    opts.superAdminPassword,
  );

  try {
    await graphql(
      `mutation CreateAdmin($input: CreateAdminInput!) {
        createAdmin(input: $input) { id email }
      }`,
      {
        input: {
          email: opts.adminEmail,
          password: opts.adminPassword,
          name: opts.adminName,
        },
      },
      superToken,
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!/already|registered|Conflict/i.test(msg)) throw e;
  }

  try {
    await graphql(
      `mutation CreateFieldUser($input: CreateFieldUserInput!) {
        createFieldUser(input: $input) { id email }
      }`,
      {
        input: {
          email: opts.fieldUserEmail,
          password: opts.fieldUserPassword,
          name: opts.fieldUserName,
        },
      },
      superToken,
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!/already|registered|Conflict/i.test(msg)) throw e;
  }
}
