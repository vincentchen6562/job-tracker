import { useEffect, useState } from 'react';
import { useHousehold } from '../context/HouseholdContext.jsx';
import { getBills, updateHousehold, getHabitsScore } from '../services/householdService.js';
import { WeeklyOverview } from '../components/parent/WeeklyOverview.jsx';
import { SpendingByCategory } from '../components/parent/SpendingByCategory.jsx';
import { ConversationPrompt } from '../components/parent/ConversationPrompt.jsx';
import { IndependenceLevels } from '../components/parent/IndependenceLevels.jsx';
import { LearningSummary } from '../components/parent/LearningSummary.jsx';
import { HouseholdVisibilitySettings } from '../components/parent/HouseholdVisibilitySettings.jsx';
import { useWeeklyReport } from '../hooks/useWeeklyReport.js';
import { unpaidBillsTotal } from '../utils/safeToSpend.js';

export function ParentDashboard() {
  const { household, refresh } = useHousehold();
  const { latest: latestReport } = useWeeklyReport();
  const [bills, setBills] = useState([]);
  const [habitsScore, setHabitsScore] = useState(null);

  useEffect(() => {
    getBills().then(setBills);
    getHabitsScore().then(setHabitsScore);
  }, []);

  async function toggleCategory(category) {
    const visibleCategories = household.visibleCategories.includes(category)
      ? household.visibleCategories.filter((c) => c !== category)
      : [...household.visibleCategories, category];
    await updateHousehold({ visibleCategories });
    refresh();
  }

  if (!household) return <p>Loading household…</p>;

  const outstanding = unpaidBillsTotal(bills);

  return (
    <div className="wrap">
      <h2>Parent dashboard</h2>
      <div className="grid2">
        <WeeklyOverview
          weeklyDeposit={household.weeklyDeposit}
          billsTotal={bills.reduce((sum, b) => sum + b.amount, 0)}
          savingsTarget={household.savingsTarget}
          safeToSpend={household.weeklyDeposit - outstanding - household.savingsTarget}
          outstanding={outstanding}
        />
        <ConversationPrompt
          brief="No intervention yet. Let them manage the week."
          prompt="What do you want to make sure is covered before you start spending this week?"
        />
        <SpendingByCategory categoryTotals={{ food: 0, transport: 0, subscriptions: 0 }} />
        <LearningSummary report={latestReport} />
        <IndependenceLevels currentLevel={1} />
        <HouseholdVisibilitySettings
          visibleCategories={household.visibleCategories}
          onToggle={toggleCategory}
        />
        {habitsScore && (
          <div className="report">
            <h4>Family habits score</h4>
            <div className="num">{habitsScore.score}</div>
          </div>
        )}
      </div>
    </div>
  );
}
