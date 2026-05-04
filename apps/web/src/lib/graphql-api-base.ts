/** Strip `/graphql` from the configured GraphQL URL so REST routes can be called on the same host. */
export function apiBaseUrlFromEnv(
  graphqlUrl: string = process.env.NEXT_PUBLIC_GRAPHQL_URL ??
    'http://localhost:4000/graphql',
): string {
  try {
    const u = new URL(graphqlUrl);
    let path = u.pathname.replace(/\/?graphql\/?$/i, '');
    if (path.endsWith('/')) path = path.slice(0, -1);
    return `${u.origin}${path}`;
  } catch {
    return graphqlUrl.replace(/\/?graphql\/?$/i, '').replace(/\/$/, '');
  }
}
