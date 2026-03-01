import { describe, it, expect } from 'vitest';
import { calculatePacing } from './pacing';
import { BudgetBlueprint } from './types';

describe('Fluid Budget Pacing Logic', () => {
  const blueprint: BudgetBlueprint = {
    startDate: '2026-03-01',
    endDate: '2026-03-31',
    cadenceDays: 7, // Weekly
  };

  it('calculates periods correctly before the budget starts', () => {
    const remainingBudget = 1000;
    const evalDate = new Date('2026-02-28T12:00:00Z');
    
    const state = calculatePacing(blueprint, remainingBudget, evalDate);
    
    expect(state.hasStarted).toBe(false);
    expect(state.isFinished).toBe(false);
    expect(state.currentPeriod).toBe(0);
    expect(state.targetForCurrentPeriod).toBe(0);
    expect(state.totalPeriods).toBe(5); // 31 days / 7 = ceil(4.42) = 5
  });

  it('calculates target correctly in the first period', () => {
    const remainingBudget = 1000;
    const evalDate = new Date('2026-03-03T12:00:00Z'); // Day 3
    
    const state = calculatePacing(blueprint, remainingBudget, evalDate);
    
    expect(state.hasStarted).toBe(true);
    expect(state.isFinished).toBe(false);
    expect(state.currentPeriod).toBe(1);
    expect(state.remainingPeriods).toBe(5);
    // Formula: 1000 / 5 = 200
    expect(state.targetForCurrentPeriod).toBe(200);
    
    // First period: Mar 1 to Mar 7
    expect(state.periodStartDate.toISOString().startsWith('2026-03-01')).toBe(true);
    expect(state.periodEndDate.toISOString().startsWith('2026-03-07')).toBe(true);
  });

  it('calculates target correctly in a middle period with reduced budget', () => {
    // Let's say we spent 300 in period 1, so entering period 2 we have 700 left.
    const remainingBudget = 700; 
    const evalDate = new Date('2026-03-10T12:00:00Z'); // Period 2
    
    const state = calculatePacing(blueprint, remainingBudget, evalDate);
    
    expect(state.currentPeriod).toBe(2);
    expect(state.remainingPeriods).toBe(4); // Periods 2, 3, 4, 5
    // Formula: 700 / 4 = 175
    expect(state.targetForCurrentPeriod).toBe(175);
    
    // Second period: Mar 8 to Mar 14
    expect(state.periodStartDate.toISOString().startsWith('2026-03-08')).toBe(true);
    expect(state.periodEndDate.toISOString().startsWith('2026-03-14')).toBe(true);
  });

  it('caps the final period to the blueprint end date', () => {
    const remainingBudget = 150; 
    const evalDate = new Date('2026-03-30T12:00:00Z'); // Final Period (5)
    
    const state = calculatePacing(blueprint, remainingBudget, evalDate);
    
    expect(state.currentPeriod).toBe(5);
    expect(state.remainingPeriods).toBe(1); 
    // Formula: 150 / 1 = 150
    expect(state.targetForCurrentPeriod).toBe(150);
    
    // Fifth period starts on Mar 29, cadence says it should be 7 days (ends Apr 4)
    // BUT the blueprint ends on Mar 31.
    expect(state.periodStartDate.toISOString().startsWith('2026-03-29')).toBe(true);
    expect(state.periodEndDate.toISOString().startsWith('2026-03-31')).toBe(true);
  });

  it('handles the state after the budget finishes', () => {
    const remainingBudget = 50;
    const evalDate = new Date('2026-04-05T12:00:00Z');
    
    const state = calculatePacing(blueprint, remainingBudget, evalDate);
    
    expect(state.hasStarted).toBe(true);
    expect(state.isFinished).toBe(true);
    expect(state.currentPeriod).toBeGreaterThan(state.totalPeriods);
    expect(state.remainingPeriods).toBe(0);
    expect(state.targetForCurrentPeriod).toBe(0);
  });
});
