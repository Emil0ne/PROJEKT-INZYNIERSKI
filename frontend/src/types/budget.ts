export const BUDGET_CATEGORIES = [
  'Loty',
  'Hotel',
  'Wynajem auta',
  'Ubezpieczenie',
  'Transport',
  'Jedzenie',
  'Atrakcje',
  'Inne',
] as const;

export type BudgetCategory = (typeof BUDGET_CATEGORIES)[number];

/** Koszt stały / wydatek dodany ręcznie do budżetu wyjazdu. */
export interface BudgetItem {
  id: string;
  title: string;
  category: BudgetCategory;
  cost: number;
  /** Kod waluty ISO 4217, np. 'PLN'. */
  currency: string;
}
