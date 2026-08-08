import { api } from './api.js';

export async function getHousehold() {
  const { data } = await api.get('/household');
  return data;
}

export async function updateHousehold(payload) {
  const { data } = await api.patch('/household', payload);
  return data;
}

export async function getBills() {
  const { data } = await api.get('/bills');
  return data;
}

export async function createBill(payload) {
  const { data } = await api.post('/bills', payload);
  return data;
}

export async function payBill(billId) {
  const { data } = await api.post(`/bills/${billId}/pay`);
  return data;
}

export async function getGoals() {
  const { data } = await api.get('/goals');
  return data;
}

export async function createGoal(payload) {
  const { data } = await api.post('/goals', payload);
  return data;
}

export async function simulatePurchase(payload) {
  const { data } = await api.post('/simulate/purchase', payload);
  return data;
}

export async function requestBNPLPlan(payload) {
  const { data } = await api.post('/simulate/bnpl', payload);
  return data;
}

export async function getWeeklyReports() {
  const { data } = await api.get('/reports/weekly');
  return data;
}

export async function getHabitsScore() {
  const { data } = await api.get('/reports/habits-score');
  return data;
}
