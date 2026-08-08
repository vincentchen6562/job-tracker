import { api } from './api.js';

export async function registerHousehold(payload) {
  const { data } = await api.post('/auth/register-household', payload);
  return data;
}

export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
}

export async function inviteTeen(payload) {
  const { data } = await api.post('/auth/invite-teen', payload);
  return data;
}
