import { useEffect } from 'react';
import { useAICoach } from '../../hooks/useAICoach.js';

export function AICoachWidget({ context }) {
  const { message, loading, refresh } = useAICoach();

  useEffect(() => {
    refresh(context);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context.safeToSpend, context.unpaidBillsTotal, context.savingsTarget]);

  return (
    <div className="ai">
      <small>AI COACH</small>
      <br />
      {loading ? 'Thinking…' : message}
    </div>
  );
}
