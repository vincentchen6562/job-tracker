import cron from 'node-cron';
import Household from '../models/Household.js';
// Registers the User schema so Household.find().populate('teens') can resolve
// it — needed even though User isn't referenced by name in this file.
import '../models/User.js';
import Bill from '../models/Bill.js';
import Transaction from '../models/Transaction.js';
import SavingsGoal from '../models/SavingsGoal.js';
import WeeklyReport from '../models/WeeklyReport.js';
import HabitsScore from '../models/HabitsScore.js';
import { generateWeeklySummary, generateParentConversationPrompt } from '../services/aiService.js';
import { computeHabitsScore } from '../services/scoringService.js';
import { startOfCurrentPeriod } from '../utils/period.js';

async function buildReportForTeen(teen, household, periodStart, periodEnd) {
  const bills = await Bill.find({ assignedTo: teen._id, active: true, createdAt: { $lt: periodEnd } });
  const paidBillIds = new Set(
    (
      await Transaction.find({
        user: teen._id,
        type: 'bill_payment',
        bill: { $in: bills.map((b) => b._id) },
        createdAt: { $gte: periodStart, $lt: periodEnd },
      }).distinct('bill')
    ).map(String)
  );
  const billsPaidOnTime = bills.filter((b) => paidBillIds.has(b._id.toString())).length;
  const billsMissed = bills.length - billsPaidOnTime;
  const debtCarriedForward = bills
    .filter((b) => !paidBillIds.has(b._id.toString()))
    .reduce((sum, b) => sum + b.amount, 0);

  const spendTransactions = await Transaction.find({
    user: teen._id,
    type: 'spend',
    createdAt: { $gte: periodStart, $lt: periodEnd },
  });
  const totalSpend = spendTransactions.reduce((sum, t) => sum + t.amount, 0);

  // Approximation: there's no direct ledger entry for "money set aside as
  // savings" yet, so a full week of bills covered is treated as the savings
  // target having been protected. Revisit once goal contributions are tracked
  // as their own transaction type.
  const savingsContribution = billsMissed === 0 ? household.savingsTarget : 0;

  const reportData = { billsPaidOnTime, billsMissed, totalSpend, savingsContribution, debtCarriedForward };
  const [aiSummary, conversationPrompt] = await Promise.all([
    generateWeeklySummary(reportData),
    generateParentConversationPrompt({
      unpaidBillsTotal: debtCarriedForward,
      spentBeforeBillsPaid: totalSpend > 0 && debtCarriedForward > 0,
    }),
  ]);

  await WeeklyReport.create({
    household: household._id,
    user: teen._id,
    weekStart: periodStart,
    weekEnd: periodEnd,
    ...reportData,
    aiSummary,
    conversationPrompt,
  });

  const goals = await SavingsGoal.find({ user: teen._id });
  const goalProgress = goals.length
    ? goals.reduce((sum, g) => sum + Math.min(1, g.currentAmount / Math.max(1, g.targetAmount)), 0) / goals.length
    : 0;

  return computeHabitsScore({
    savingConsistency: savingsContribution > 0 ? 1 : 0,
    billsPaidOnTime: bills.length ? billsPaidOnTime / bills.length : 1,
    goalProgress,
    // TODO: these need real instrumentation (e.g. Practice Zone outcomes,
    // planned-vs-impulse tagging on spend) — using a neutral placeholder
    // until that data exists rather than fabricating a signal.
    plannedVsUnplannedSpend: 0.5,
    impulsePurchasesReconsidered: 0.5,
    responsibleFutureMoneyUse: 1,
  });
}

/**
 * Runs weekly, shortly after payday: builds a WeeklyReport (with an AI
 * summary + conversation prompt) for every teen, then rolls per-teen habit
 * scores up into one HabitsScore per household.
 */
export async function runWeeklyReports() {
  const periodEnd = startOfCurrentPeriod();
  const periodStart = new Date(periodEnd);
  periodStart.setDate(periodStart.getDate() - 7);

  const households = await Household.find().populate('teens');

  for (const household of households) {
    if (household.teens.length === 0) continue;

    const scores = [];
    for (const teen of household.teens) {
      scores.push(await buildReportForTeen(teen, household, periodStart, periodEnd));
    }

    const avgFactors = {};
    for (const key of Object.keys(scores[0].factors)) {
      avgFactors[key] = scores.reduce((sum, s) => sum + s.factors[key], 0) / scores.length;
    }
    const { score } = computeHabitsScore(avgFactors);
    await HabitsScore.create({ household: household._id, weekOf: periodStart, score, factors: avgFactors });
  }
}

export function scheduleWeeklyReportJob() {
  // 10 minutes after payday (jobs/paydayJob.js runs at 00:05 Monday), so the
  // week being reported on has already had its carry-over debt applied.
  cron.schedule('15 0 * * 1', () => {
    runWeeklyReports().catch((err) => console.error('Weekly report job failed:', err));
  });
}
