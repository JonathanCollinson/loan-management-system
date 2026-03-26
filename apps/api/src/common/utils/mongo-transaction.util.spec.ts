import {
  isTransactionUnsupportedError,
  withTransactionOrFallback,
} from './mongo-transaction.util';

describe('mongo-transaction.util', () => {
  describe('isTransactionUnsupportedError', () => {
    it('returns true for replica-set transaction message', () => {
      expect(
        isTransactionUnsupportedError(
          new Error(
            'Transaction numbers are only allowed on a replica set member or mongos',
          ),
        ),
      ).toBe(true);
    });

    it('returns false for unrelated errors', () => {
      expect(
        isTransactionUnsupportedError(new Error('not enough balance')),
      ).toBe(false);
    });
  });

  describe('withTransactionOrFallback', () => {
    it('runs fn without session when transaction path throws unsupported error before fn completes', async () => {
      const mockSession = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn().mockResolvedValue(undefined),
        endSession: jest.fn().mockResolvedValue(undefined),
      };
      const connection = {
        startSession: jest.fn().mockResolvedValue(mockSession),
      };

      const txnErr = new Error(
        'Transaction numbers are only allowed on a replica set member or mongos',
      );

      const fn = jest
        .fn()
        .mockImplementationOnce(() => Promise.reject(txnErr))
        .mockImplementationOnce(() => Promise.resolve('ok'));

      const result = await withTransactionOrFallback(
        connection as never,
        fn as never,
      );

      expect(result).toBe('ok');
      expect(fn).toHaveBeenCalledTimes(2);
      const calls = fn.mock.calls as [unknown, unknown][];
      expect(calls[0]?.[0]).toBe(mockSession);
      expect(calls[1]?.[0]).toBeNull();
    });
  });
});
