import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserRole } from '../../common/enums/user-role.enum';
import type { JwtUser } from '../../common/types/jwt-user';
import { parseMonth } from '../../common/utils/month-range.util';
import { Loan, LoanDocument } from '../loans/schemas/loan.schema';
import { UsersRepository } from '../users/users.repository';
import { summarizeBorrowerLoans } from './borrower-loan-summary.util';
import { CreateBorrowerInput } from './dto/create-borrower.input';
import { UpdateBorrowerInput } from './dto/update-borrower.input';
import { BorrowerObject } from './graphql/borrower.object';
import {
  BorrowerLoanSummaryPayload,
  BorrowerLoanSummaryRow,
} from './graphql/borrower-loan-summary.object';
import { BorrowerDocument } from './schemas/borrower.schema';
import { BorrowersRepository } from './borrowers.repository';

@Injectable()
export class BorrowersService {
  constructor(
    private readonly repo: BorrowersRepository,
    private readonly usersRepo: UsersRepository,
    @InjectModel(Loan.name) private readonly loanModel: Model<LoanDocument>,
  ) {}

  toObject(doc: BorrowerDocument): BorrowerObject {
    return {
      id: doc._id.toString(),
      name: doc.name,
      phone: doc.phone,
      email: doc.email,
      idDocument: doc.idDocument,
      createdByUserId: doc.createdByUserId.toString(),
    };
  }

  private resolveOwnerId(actor: JwtUser, input: CreateBorrowerInput): string {
    if (actor.role === UserRole.USER) {
      if (input.ownerUserId) {
        throw new BadRequestException('ownerUserId is not allowed for field users');
      }
      return actor.id;
    }

    if (
      actor.role === UserRole.ADMIN ||
      actor.role === UserRole.SUPER_ADMIN
    ) {
      if (!input.ownerUserId) {
        throw new BadRequestException('ownerUserId is required for admins');
      }
      return input.ownerUserId;
    }

    throw new ForbiddenException();
  }

  async createBorrower(
    input: CreateBorrowerInput,
    actor: JwtUser,
  ): Promise<BorrowerObject> {
    const ownerId = this.resolveOwnerId(actor, input);
    const owner = await this.usersRepo.findById(ownerId);
    if (!owner || owner.role !== UserRole.USER) {
      throw new BadRequestException('ownerUserId must be a field user');
    }

    const doc = await this.repo.create({
      name: input.name,
      phone: input.phone,
      email: input.email,
      idDocument: input.idDocument,
      createdByUserId: new Types.ObjectId(ownerId),
    });
    return this.toObject(doc);
  }

  async listBorrowers(actor: JwtUser): Promise<BorrowerObject[]> {
    if (actor.role === UserRole.USER) {
      const docs = await this.repo.findByOwner(actor.id);
      return docs.map((d) => this.toObject(d));
    }
    const docs = await this.repo.findAll();
    return docs.map((d) => this.toObject(d));
  }

  async getBorrower(id: string, actor: JwtUser): Promise<BorrowerObject> {
    const doc = await this.repo.findById(id);
    if (!doc) throw new NotFoundException('Borrower not found');
    this.assertCanAccessBorrower(doc, actor);
    return this.toObject(doc);
  }

  assertCanAccessBorrower(doc: BorrowerDocument, actor: JwtUser): void {
    if (actor.role === UserRole.USER) {
      if (doc.createdByUserId.toString() !== actor.id) {
        throw new ForbiddenException();
      }
    }
  }

  async updateBorrower(
    input: UpdateBorrowerInput,
    actor: JwtUser,
  ): Promise<BorrowerObject> {
    const doc = await this.repo.findById(input.borrowerId);
    if (!doc) throw new NotFoundException('Borrower not found');
    this.assertCanAccessBorrower(doc, actor);

    const data: Record<string, unknown> = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.phone !== undefined) data.phone = input.phone;
    if (input.email !== undefined) data.email = input.email;
    if (input.idDocument !== undefined) data.idDocument = input.idDocument;

    const updated = await this.repo.updateById(input.borrowerId, data);
    if (!updated) throw new NotFoundException('Borrower not found');
    return this.toObject(updated);
  }

  async getBorrowerLoanSummary(
    actor: JwtUser,
    month?: string | null,
  ): Promise<BorrowerLoanSummaryPayload> {
    const borrowerDocs =
      actor.role === UserRole.USER
        ? await this.repo.findByOwner(actor.id)
        : await this.repo.findAll();

    const borrowerIds = borrowerDocs.map((b) => b._id);
    const loanFilter: Record<string, unknown> = {
      borrowerId: { $in: borrowerIds },
    };
    if (month) {
      const { start, end } = parseMonth(month);
      loanFilter.createdAt = { $gte: start, $lte: end };
    }

    const loans =
      borrowerIds.length === 0
        ? []
        : await this.loanModel.find(loanFilter).exec();

    const loansByBorrower = new Map<string, LoanDocument[]>();
    for (const loan of loans) {
      const bid = loan.borrowerId.toString();
      if (!loansByBorrower.has(bid)) loansByBorrower.set(bid, []);
      loansByBorrower.get(bid)!.push(loan);
    }

    const rows: BorrowerLoanSummaryRow[] = [];
    let totalPrincipal = 0;
    let totalInterest = 0;
    let totalRepayable = 0;

    for (const doc of borrowerDocs) {
      const forBorrower = loansByBorrower.get(doc._id.toString()) ?? [];
      const summary = summarizeBorrowerLoans(
        forBorrower.map((l) => ({
          principalAmount: l.principalAmount,
          interestAmount: l.interestAmount,
          totalAmount: l.totalAmount,
          outstandingAmount: l.outstandingAmount,
          status: l.status,
          paidAt: l.paidAt,
        })),
      );

      totalPrincipal += summary.totalPrincipal;
      totalInterest += summary.totalInterest;
      totalRepayable += summary.totalRepayable;

      rows.push({
        borrowerId: doc._id.toString(),
        name: doc.name,
        phone: doc.phone,
        email: doc.email,
        totalPrincipal: summary.totalPrincipal,
        totalInterest: summary.totalInterest,
        totalRepayable: summary.totalRepayable,
        totalOutstanding: summary.totalOutstanding,
        borrowerStatus: summary.borrowerStatus,
        paidAt: summary.paidAt,
      });
    }

    return {
      rows,
      totals: {
        totalPrincipal,
        totalInterest,
        totalRepayable,
      },
    };
  }
}
