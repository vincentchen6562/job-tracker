/**
 * Family Financial Habits Score — rewards behaviour, not wealth.
 * Every factor is normalised 0-1 before weighting so richer households don't score higher.
 */

const WEIGHTS = {
  savingConsistency: 0.2,
  billsPaidOnTime: 0.25,
  goalProgress: 0.15,
  plannedVsUnplannedSpend: 0.15,
  impulsePurchasesReconsidered: 0.1,
  responsibleFutureMoneyUse: 0.15,
};

export function computeHabitsScore(factors) {
  const score = Object.entries(WEIGHTS).reduce((total, [key, weight]) => {
    const value = Math.min(1, Math.max(0, factors[key] ?? 0));
    return total + value * weight;
  }, 0);

  return {
    score: Math.round(score * 100),
    factors,
  };
}
