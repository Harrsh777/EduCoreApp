/**
 * Finance / Expense-Income APIs. Same as web.
 */

import { api } from '@/lib/api';

const p = (school_code: string, extra?: Record<string, unknown>) => ({ params: { school_code, ...extra } });

/** GET /api/finance/expense-income or /api/expense-income */
export function getExpenseIncome(school_code: string, params?: Record<string, unknown>) {
  return api.get('/api/expense-income', p(school_code, params)).catch(() =>
    api.get('/api/finance/expense-income', p(school_code, params))
  );
}

/** POST /api/expense-income or /api/finance/expense-income */
export function createExpenseIncome(school_code: string, body: Record<string, unknown>) {
  return api.post('/api/expense-income', body, p(school_code)).catch(() =>
    api.post('/api/finance/expense-income', body, p(school_code))
  );
}

/** GET /api/finance/expenses */
export function getExpenses(school_code: string, params?: Record<string, unknown>) {
  return api.get('/api/finance/expenses', p(school_code, params)).catch(() =>
    api.get('/api/expense-income/expenses', p(school_code, params))
  );
}

/** GET /api/finance/income */
export function getIncome(school_code: string, params?: Record<string, unknown>) {
  return api.get('/api/finance/income', p(school_code, params)).catch(() =>
    api.get('/api/expense-income/income', p(school_code, params))
  );
}

export const financeService = {
  getExpenseIncome,
  createExpenseIncome,
  getExpenses,
  getIncome,
};
