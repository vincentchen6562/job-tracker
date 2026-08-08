import { useState } from 'react';
import { Modal } from '../common/Modal.jsx';

/**
 * Safe simulations of real-world spending pressure (BNPL ads, flash sales,
 * countdown timers, subscription upsells, FOMO). Nothing here moves real money.
 */
const SCENARIOS = [
  { id: 'bnpl-ad', title: 'Sponsored: "Pay in 4" checkout', kind: 'bnpl' },
  { id: 'flash-sale', title: 'Flash sale ends in 10 minutes', kind: 'urgency' },
  { id: 'subscription-upsell', title: 'Upgrade to Premium for $2/week', kind: 'subscription' },
];

export function PracticeZone() {
  const [activeScenario, setActiveScenario] = useState(null);

  return (
    <div className="report">
      <h4>Practice zone</h4>
      <p className="sub">Safe simulations of the pressure tactics you'll meet in real checkouts.</p>
      <div className="chips">
        {SCENARIOS.map((s) => (
          <button key={s.id} className="chip" onClick={() => setActiveScenario(s)}>
            {s.title}
          </button>
        ))}
      </div>

      <Modal
        open={!!activeScenario}
        onClose={() => setActiveScenario(null)}
        title={activeScenario?.title}
        footer={
          <button className="btn primary" onClick={() => setActiveScenario(null)}>
            Done — this was a simulation
          </button>
        }
      >
        {/* TODO: render scenario-specific content per activeScenario.kind */}
        <p>This is a practice scenario. No real money moves here.</p>
      </Modal>
    </div>
  );
}
