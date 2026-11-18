import type { BudgetItem } from '../types/budget';
import type { ScheduleItem } from '../types/trip';

export interface BudgetSummary {
  /** Suma kosztów z harmonogramu dni. */
  scheduleTotal: number;
  /** Suma kosztów stałych (loty, hotel itd.). */
  customTotal: number;
  totalSpent: number;
  /** Może być ujemne, gdy budżet został przekroczony. */
  remaining: number;
  /** Procent wykorzystania budżetu, 0–100. */
  percentage: number;
}

export const sumCosts = (items: ReadonlyArray<{ cost?: number }>): number =>
  items.reduce((acc, item) => acc + (item.cost || 0), 0);

export const calculateBudgetSummary = (
  totalBudget: number,
  customItems: BudgetItem[],
  scheduleItems: ScheduleItem[],
): BudgetSummary => {
  const scheduleTotal = sumCosts(scheduleItems);
  const customTotal = sumCosts(customItems);
  const totalSpent = scheduleTotal + customTotal;
  const percentage = totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0;
  return { scheduleTotal, customTotal, totalSpent, remaining: totalBudget - totalSpent, percentage };
};
