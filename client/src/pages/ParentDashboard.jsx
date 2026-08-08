import { useCallback, useEffect, useState } from 'react';
import { useHousehold } from '../context/HouseholdContext.jsx';
import {
  getBillDefinitions,
  createBill,
  updateHousehold,
  updateIndependenceLevel,
  getHabitsScore,
  getBNPLPlans,
  approveBNPLPlan,
  declineBNPLPlan,
} from '../services/householdService.js';
import { inviteTeen } from '../services/authService.js';
import { getSummary, getCategoryBreakdown } from '../services/transactionsService.js';
import { getConversationPrompt } from '../services/aiService.js';
import { WeeklyOverview } from '../components/parent/WeeklyOverview.jsx';
import { SpendingByCategory } from '../components/parent/SpendingByCategory.jsx';
import { ConversationPrompt } from '../components/parent/ConversationPrompt.jsx';
import { IndependenceLevels } from '../components/parent/IndependenceLevels.jsx';
import { LearningSummary } from '../components/parent/LearningSummary.jsx';
import { HouseholdVisibilitySettings } from '../components/parent/HouseholdVisibilitySettings.jsx';
import { CreateBillForm } from '../components/parent/CreateBillForm.jsx';
import { InviteTeenForm } from '../components/parent/InviteTeenForm.jsx';
import { BNPLApprovals } from '../components/parent/BNPLApprovals.jsx';
import { FamilyHabitsScore } from '../components/shared/FamilyHabitsScore.jsx';
import { useWeeklyReport } from '../hooks/useWeeklyReport.js';

export function ParentDashboard() {
  const { household, refresh } = useHousehold();
  const { latest: latestReport } = useWeeklyReport();
  const [bills, setBills] = useState([]);
  const [summary, setSummary] = useState({ balance: 0, unpaidBills: 0, savingsTarget: 0, safeToSpend: 0 });
  const [categoryTotals, setCategoryTotals] = useState({});
  const [habitsScore, setHabitsScore] = useState(null);
  const [bnplPlans, setBnplPlans] = useState([]);
  const [conversationPrompt, setConversationPrompt] = useState('');

  const teen = household?.teens?.[0];

  const refreshAll = useCallback(async () => {
    const [billsData, summaryData, categoryData, plans] = await Promise.all([
      getBillDefinitions(),
      getSummary(),
      getCategoryBreakdown(),
      getBNPLPlans(),
    ]);
    setBills(billsData);
    setSummary(summaryData);
    setCategoryTotals(categoryData);
    setBnplPlans(plans);
  }, []);

  useEffect(() => {
    refreshAll();
    getHabitsScore().then(setHabitsScore);
  }, [refreshAll]);

  useEffect(() => {
    if (!household) return;
    getConversationPrompt({
      unpaidBillsTotal: summary.unpaidBills,
      spentBeforeBillsPaid: summary.unpaidBills > 0 && summary.balance < summary.unpaidBills,
    }).then(setConversationPrompt);
  }, [household, summary.unpaidBills, summary.balance]);

  async function toggleCategory(category) {
    const visibleCategories = household.visibleCategories.includes(category)
      ? household.visibleCategories.filter((c) => c !== category)
      : [...household.visibleCategories, category];
    await updateHousehold({ visibleCategories });
    refresh();
  }

  async function handleCreateBill(payload) {
    await createBill(payload);
    await refreshAll();
  }

  async function handleInviteTeen(payload) {
    await inviteTeen(payload);
    await refresh();
  }

  async function handleChangeLevel(level) {
    if (!teen) return;
    await updateIndependenceLevel(teen._id, level);
    await refresh();
  }

  async function handleApproveBNPL(planId) {
    await approveBNPLPlan(planId);
    await refreshAll();
  }

  async function handleDeclineBNPL(planId) {
    await declineBNPLPlan(planId);
    await refreshAll();
  }

  if (!household) return <p>Loading household…</p>;

  return (
    <div className="wrap">
      <h2>Parent dashboard</h2>
      <div className="grid2">
        <WeeklyOverview
          weeklyDeposit={household.weeklyDeposit}
          billsTotal={bills.reduce((sum, b) => sum + b.amount, 0)}
          savingsTarget={household.savingsTarget}
          safeToSpend={summary.safeToSpend}
          outstanding={summary.unpaidBills}
        />
        <ConversationPrompt
          brief={summary.unpaidBills === 0 ? 'Every obligation is covered this week.' : 'Worth checking in before the week gets away.'}
          prompt={conversationPrompt || 'What do you want to make sure is covered before you start spending this week?'}
        />
        <SpendingByCategory categoryTotals={categoryTotals} />
        <LearningSummary report={latestReport} />
        {teen && <IndependenceLevels currentLevel={teen.independenceLevel} onChangeLevel={handleChangeLevel} />}
        <HouseholdVisibilitySettings
          visibleCategories={household.visibleCategories}
          onToggle={toggleCategory}
        />
        <FamilyHabitsScore habitsScore={habitsScore} />
        <BNPLApprovals plans={bnplPlans} onApprove={handleApproveBNPL} onDecline={handleDeclineBNPL} />
        {teen ? (
          <CreateBillForm teens={[teen]} onCreate={handleCreateBill} />
        ) : (
          <InviteTeenForm onInvite={handleInviteTeen} />
        )}
      </div>

      {teen && (
        <div style={{ marginTop: 24 }}>
          <h4>Bills for {teen.name}</h4>
          <div className="pay-list">
            {bills.map((bill) => (
              <div className="pay-item" key={bill._id}>
                <div>
                  <strong>{bill.name}</strong>
                  <div className="sub">{bill.category} · {bill.frequency}</div>
                </div>
                <span>${bill.amount}</span>
                <span />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
