import { api } from './api.js';

export async function getCoachMessage(payload) {
  const { data } = await api.post('/ai/coach-message', payload);
  return data.message;
}

export async function getConversationPrompt(payload) {
  const { data } = await api.post('/ai/conversation-prompt', payload);
  return data.prompt;
}

export async function askAboutReport(question, context) {
  const { data } = await api.post('/ai/ask', { question, context });
  return data.answer;
}
