import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { BorrowerAudience } from '../../common/enums/borrower-audience.enum';
import { LoanStatus } from '../../common/enums/loan-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import type { JwtUser } from '../../common/types/jwt-user';
import { Loan } from '../loans/schemas/loan.schema';
import { CapitalFundsService } from '../capital-funds/capital-funds.service';
import { UsersRepository } from '../users/users.repository';
import { BorrowersService } from './borrowers.service';
import { BorrowersRepository } from './borrowers.repository';

describe('BorrowersService', () => {
  let service: BorrowersService;
  const borrowersRepo = {
    findByOwner: jest.fn(),
    findAccessibleForFieldUser: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    updateById: jest.fn(),
  };
  const usersRepo = {
    findById: jest.fn(),
  };
  const capitalFundsService = {
    assertCanUsePrincipalFundForFilter: jest.fn().mockResolvedValue(undefined),
  };
  const loanFindExec = jest.fn().mockResolvedValue([]);
  const loanModel = {
    find: jest.fn().mockReturnValue({ exec: loanFindExec }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    loanFindExec.mockResolvedValue([]);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BorrowersService,
        { provide: BorrowersRepository, useValue: borrowersRepo },
        { provide: UsersRepository, useValue: usersRepo },
        { provide: CapitalFundsService, useValue: capitalFundsService },
        { provide: getModelToken(Loan.name), useValue: loanModel },
      ],
    }).compile();
    service = module.get(BorrowersService);
  });

  const fieldUser = (id: string): JwtUser => ({
    id,
    email: 'u@test',
    role: UserRole.USER,
  });

  it('createBorrower rejects ownerUserId for USER actor', async () => {
    await expect(
      service.createBorrower(
        {
          name: 'B',
          ownerUserId: new Types.ObjectId().toString(),
        } as never,
        fieldUser('u1'),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('createBorrower requires ownerUserId for ADMIN', async () => {
    const admin: JwtUser = {
      id: 'a1',
      email: 'a@test',
      role: UserRole.ADMIN,
    };
    await expect(
      service.createBorrower({ name: 'B' } as never, admin),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('listBorrowers uses findAccessibleForFieldUser for USER', async () => {
    borrowersRepo.findAccessibleForFieldUser.mockResolvedValue([]);
    await service.listBorrowers(fieldUser('u1'));
    expect(borrowersRepo.findAccessibleForFieldUser).toHaveBeenCalledWith('u1');
    expect(borrowersRepo.findAll).not.toHaveBeenCalled();
  });

  it('listBorrowers uses findAll for ADMIN', async () => {
    borrowersRepo.findAll.mockResolvedValue([]);
    await service.listBorrowers({
      id: 'a1',
      email: 'a@test',
      role: UserRole.ADMIN,
    });
    expect(borrowersRepo.findAll).toHaveBeenCalled();
  });

  it('getBorrowerLoanSummary rejects when assertCanUsePrincipalFundForFilter fails', async () => {
    capitalFundsService.assertCanUsePrincipalFundForFilter.mockRejectedValueOnce(
      new ForbiddenException(),
    );
    await expect(
      service.getBorrowerLoanSummary(
        fieldUser('u1'),
        null,
        new Types.ObjectId().toString(),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('getBorrowerLoanSummary omits borrowers with no loans in scope', async () => {
    const withLoan = new Types.ObjectId();
    const noLoan = new Types.ObjectId();
    borrowersRepo.findAll.mockResolvedValue([
      { _id: withLoan, name: 'A', phone: null, address: '' },
      { _id: noLoan, name: 'B', phone: null, address: '' },
    ]);
    loanFindExec.mockResolvedValue([
      {
        borrowerId: withLoan,
        principalAmount: 100,
        interestAmount: 10,
        totalAmount: 110,
        outstandingAmount: 50,
        status: LoanStatus.ACTIVE,
        paidAt: null,
      },
    ]);
    const out = await service.getBorrowerLoanSummary(
      { id: 'a1', email: 'a@test', role: UserRole.ADMIN },
      null,
      null,
    );
    expect(out.rows).toHaveLength(1);
    expect(out.rows[0].borrowerId).toBe(withLoan.toString());
    expect(out.totals).toEqual({
      totalPrincipal: 100,
      totalInterest: 10,
      totalRepayable: 110,
    });
  });

  it('getBorrowerLoanSummary passes principalFundId into loan query when set', async () => {
    const bid = new Types.ObjectId();
    borrowersRepo.findAll.mockResolvedValue([{ _id: bid, name: 'B' }]);
    const fundId = new Types.ObjectId();
    await service.getBorrowerLoanSummary(
      { id: 'a1', email: 'a@test', role: UserRole.ADMIN },
      null,
      fundId.toString(),
    );
    expect(
      capitalFundsService.assertCanUsePrincipalFundForFilter,
    ).toHaveBeenCalledWith(expect.any(Object), fundId.toString());
    expect(loanModel.find).toHaveBeenCalledWith(
      expect.objectContaining({
        principalFundId: fundId,
      }),
    );
  });

  it('assertCanAccessBorrower forbids USER accessing other owner', () => {
    const doc = {
      createdByUserId: new Types.ObjectId(),
      audience: BorrowerAudience.OWNER_ONLY,
    };
    expect(() =>
      service.assertCanAccessBorrower(doc as never, fieldUser('other')),
    ).toThrow(ForbiddenException);
  });
});
