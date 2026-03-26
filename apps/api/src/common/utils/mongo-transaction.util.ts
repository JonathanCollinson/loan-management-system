import type { ClientSession, Connection } from 'mongoose';

/** MongoDB multi-document transactions require a replica set or mongos. */
export function isTransactionUnsupportedError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const message =
    'message' in err && typeof (err as Error).message === 'string'
      ? (err as Error).message
      : '';
  if (
    message.includes('Transaction numbers are only allowed') ||
    message.includes('replica set member or mongos')
  ) {
    return true;
  }
  const name =
    'name' in err && typeof (err as { name?: string }).name === 'string'
      ? (err as { name: string }).name
      : '';
  const code =
    'code' in err && typeof (err as { code?: number }).code === 'number'
      ? (err as { code: number }).code
      : undefined;
  return (name === 'MongoServerError' || name === 'MongoError') && code === 20;
}

/**
 * Runs `fn` inside a transaction when the server supports it; otherwise runs
 * `fn(null)` without a session (no atomicity across writes — fine for dev
 * standalone Mongo; production should use a replica set).
 *
 * Retries without a session only if the transaction failed before `fn` finished;
 * if `fn` completed but commit failed, the error is rethrown (no duplicate `fn`).
 */
export async function withTransactionOrFallback<T>(
  connection: Connection,
  fn: (session: ClientSession | null) => Promise<T>,
): Promise<T> {
  const session = await connection.startSession();
  let fnFinished = false;
  try {
    session.startTransaction();
    const result = await fn(session);
    fnFinished = true;
    await session.commitTransaction();
    return result;
  } catch (e) {
    try {
      await session.abortTransaction();
    } catch {
      /* ignore abort errors */
    }
    if (!fnFinished && isTransactionUnsupportedError(e)) {
      return fn(null);
    }
    throw e;
  } finally {
    await session.endSession();
  }
}
