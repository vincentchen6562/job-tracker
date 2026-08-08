/**
 * Central place for all LLM calls (coach messages, conversation prompts, report
 * summaries, household Q&A) so prompts/context never leak into the client.
 *
 * TODO: wire up to a real model (e.g. the Claude API) using env.aiApiKey.
 * Every function currently returns a deterministic placeholder so the rest of
 * the app can be built and tested without a live API key.
 */

export async function generateTeenCoachMessage({ safeToSpend, unpaidBillsTotal, savingsTarget }) {
  if (safeToSpend < 0) {
    return `Your balance doesn't cover everything yet — you're $${Math.abs(safeToSpend)} short once bills and savings are counted. Want help deciding what to prioritise?`;
  }
  if (unpaidBillsTotal === 0) {
    return `All bills are covered. You have $${safeToSpend} genuinely free to spend after your $${savingsTarget} savings target.`;
  }
  return `You still have $${unpaidBillsTotal} committed to bills this week. That leaves $${safeToSpend} safe to spend.`;
}

export async function generateParentConversationPrompt({ unpaidBillsTotal, spentBeforeBillsPaid }) {
  if (spentBeforeBillsPaid) {
    return 'You knew these bills were coming. What could you do differently next payday so that money is protected first?';
  }
  if (unpaidBillsTotal === 0) {
    return 'You handled everything you needed to. What helped you stay on top of it?';
  }
  return 'What do you want to make sure is covered before you start spending this week?';
}

export async function generateWeeklySummary(reportData) {
  return `This week: ${reportData.billsPaidOnTime} bills paid on time, ${reportData.billsMissed} missed, $${reportData.savingsContribution} saved.`;
}

export async function answerHouseholdQuestion({ question, context }) {
  return `(placeholder) Based on this household's data, here's what I'd say about: "${question}"`;
}
