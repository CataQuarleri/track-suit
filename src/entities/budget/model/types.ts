export interface BudgetBlueprint {
  /** 
   * ISO 8601 Date string for when the budget starts (e.g., '2026-03-01') 
   */
  startDate: string;
  
  /** 
   * ISO 8601 Date string for when the budget ends (e.g., '2026-03-31') 
   */
  endDate: string;
  
  /** 
   * How many days long each pacing period is (e.g., 7 for weekly, 14 for bi-weekly) 
   */
  cadenceDays: number;
}

export interface PacingState {
  currentPeriod: number;
  totalPeriods: number;
  remainingPeriods: number;
  
  /** 
   * The calculated allowance target for the current period 
   * Formula: (Remaining Total Budget / Remaining Periods)
   */
  targetForCurrentPeriod: number;
  
  isFinished: boolean;
  hasStarted: boolean;
  
  /** 
   * The exact start date of the current period 
   */
  periodStartDate: Date;
  
  /** 
   * The exact end date of the current period (capped at the blueprint's endDate) 
   */
  periodEndDate: Date;
}
