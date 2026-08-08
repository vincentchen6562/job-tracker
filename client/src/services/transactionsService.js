import { api } from './api.js';

export async function getTransactions() {
  const { data } = await api.get('/transactions');
  return data;
}

// { balance, unpaidBills, savingsTarget, safeToSpend }
export async function getSummary() {
  const { data } = await api.get('/transactions/summary');
  return data;
}

export async function getCategoryBreakdown() {
  const { data } = await api.get('/transactions/category-breakdown');
  return data;
}

export async function createSpend(payload) {
  const { data } = await api.post('/transactions/spend', payload);
  return data;
}
