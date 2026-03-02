import type { BudgetBlueprint, PacingState } from './types';

/**
 * Calculates the fluid pacing target for a budget.
 * 
 * "Allowances recalculate only at the start of a defined period to provide stable targets."
 * Because of this rule, `remainingBudgetAtPeriodStart` should be the balance 
 * as of `periodStartDate`, not the real-time balance.
 *
 * @param blueprint The budget's behavioral blueprint configuration
 * @param remainingBudgetAtPeriodStart The amount of money left in the total budget at the moment this period started
 * @param evaluationDate The date to evaluate the pacing on (defaults to today)
 * @returns The PacingState including the target for the current period
 */
export function calculatePacing(
  blueprint: BudgetBlueprint,
  remainingBudgetAtPeriodStart: number,
  evaluationDate: Date = new Date()
): PacingState {
  const start = new Date(blueprint.startDate);
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(blueprint.endDate);
  end.setUTCHours(0, 0, 0, 0);

  const evalDate = new Date(evaluationDate);
  evalDate.setUTCHours(0, 0, 0, 0);

  const msPerDay = 1000 * 60 * 60 * 24;
  
  // Total days includes both start and end dates
  const totalDays = Math.max(0, Math.floor((end.getTime() - start.getTime()) / msPerDay)) + 1;
  const totalPeriods = Math.ceil(totalDays / blueprint.cadenceDays);

  // 1. Budget hasn't started yet
  if (evalDate < start) {
    return {
      currentPeriod: 0,
      totalPeriods,
      remainingPeriods: totalPeriods,
      targetForCurrentPeriod: 0,
      isFinished: false,
      hasStarted: false,
      periodStartDate: start,
      periodEndDate: new Date(start.getTime() + (blueprint.cadenceDays - 1) * msPerDay),
    };
  }

  // 2. Budget has finished
  if (evalDate > end) {
    return {
      currentPeriod: totalPeriods + 1,
      totalPeriods,
      remainingPeriods: 0,
      targetForCurrentPeriod: 0,
      isFinished: true,
      hasStarted: true,
      periodStartDate: end,
      periodEndDate: end,
    };
  }

  // 3. Budget is active
  const daysSinceStart = Math.floor((evalDate.getTime() - start.getTime()) / msPerDay);
  
  // 1-indexed current period
  const currentPeriod = Math.floor(daysSinceStart / blueprint.cadenceDays) + 1;
  
  // We include the current period in the remaining periods
  const remainingPeriods = Math.max(1, totalPeriods - currentPeriod + 1);
  
  // Fluid Formula: Target for current period = (Remaining Total Budget / Remaining Periods)
  // To avoid divide-by-zero or weird floating point math, we round to 2 decimals if needed, 
  // but we return the raw number here.
  const targetForCurrentPeriod = remainingPeriods > 0 
    ? remainingBudgetAtPeriodStart / remainingPeriods 
    : 0;

  // Calculate the dates for the current period
  const periodStartMs = start.getTime() + (currentPeriod - 1) * blueprint.cadenceDays * msPerDay;
  const periodStartDate = new Date(periodStartMs);
  
  let periodEndMs = periodStartMs + (blueprint.cadenceDays - 1) * msPerDay;
  if (periodEndMs > end.getTime()) {
    periodEndMs = end.getTime(); // Cap the last period's end date to the blueprint's end date
  }
  const periodEndDate = new Date(periodEndMs);

  return {
    currentPeriod,
    totalPeriods,
    remainingPeriods,
    targetForCurrentPeriod,
    isFinished: false,
    hasStarted: true,
    periodStartDate,
    periodEndDate,
  };
}
