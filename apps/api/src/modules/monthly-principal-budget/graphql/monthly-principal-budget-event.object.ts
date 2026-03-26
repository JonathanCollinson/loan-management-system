import { Field, Float, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class MonthlyPrincipalBudgetEventObject {
  @Field(() => ID)
  id: string;

  @Field()
  month: string;

  @Field(() => Float)
  delta: number;

  @Field(() => Float)
  previousTotal: number;

  @Field(() => Float)
  newTotal: number;

  @Field(() => ID)
  actorUserId: string;

  @Field({ nullable: true })
  note?: string;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class MonthlyPrincipalBudgetUtilization {
  @Field(() => Float)
  allocatedTotal: number;

  @Field(() => Float)
  principalLoanedTotal: number;

  @Field(() => Float)
  remainingVsLoans: number;

  @Field(() => Float)
  remainingVsAllocations: number;
}

@ObjectType()
export class MonthlyPrincipalBudgetDetail {
  @Field()
  month: string;

  @Field(() => Float)
  totalPrincipal: number;

  @Field({ nullable: true })
  note?: string;

  @Field({ nullable: true })
  budgetCreatedAt?: Date;

  @Field({ nullable: true })
  budgetUpdatedAt?: Date;

  @Field(() => [MonthlyPrincipalBudgetEventObject])
  events: MonthlyPrincipalBudgetEventObject[];

  @Field(() => MonthlyPrincipalBudgetUtilization)
  utilization: MonthlyPrincipalBudgetUtilization;
}
