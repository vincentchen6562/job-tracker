import { useRef, useState } from 'react';

/**
 * Safe simulations of real-world spending pressure (BNPL ads, flash sales,
 * subscription upsells). Nothing here moves real money. The 'bnpl' scenario
 * ports the scroll-gated warning modal from the original 18_before_18.html
 * prototype — the Continue button only unlocks once you've read to the end.
 */
const SCENARIOS = {
  'bnpl-ad': {
    title: 'Sponsored: "Pay in 4" checkout',
    flag: 'This is a loan, not a discount.',
    body: (
      <>
        <h4>What "Pay in 4" actually means</h4>
        <div className="line"><span>Item price</span><strong>$120.00</strong></div>
        <div className="line"><span>Due today</span><strong>$30.00</strong></div>
        <div className="line"><span>Due in 2 weeks</span><strong>$30.00</strong></div>
        <div className="line"><span>Due in 4 weeks</span><strong>$30.00</strong></div>
        <div className="line"><span>Due in 6 weeks</span><strong>$30.00</strong></div>

        <h4>What happens if a payment is missed</h4>
        <p>
          A late fee is usually added, and it can be reported to a credit file that follows you
          into adulthood. Missing more than one payment on a "0% interest" plan is one of the
          most common ways short-term debt turns into long-term debt.
        </p>

        <h4>What this really is</h4>
        <p>
          It is not a discount. It is not free money. It is a loan, split into four pieces, from
          a company whose entire business model depends on you agreeing to owe money you don't
          currently have.
        </p>

        <h4>Ask before you tap Continue</h4>
        <p>
          Do you have all $120 available right now, without touching bill money or savings? If
          the honest answer is no, this purchase is being financed — by you, for a fee, four
          payments from now.
        </p>

        <div className="warn-box">
          <strong>1 in 4 teens</strong> who use "buy now, pay later" style checkouts miss at
          least one payment in their first year. This warning exists so that doesn't become you.
        </div>
      </>
    ),
    continueLabel: 'I understand — continue to checkout',
  },
  'flash-sale': {
    title: 'Flash sale ends in 10 minutes',
    flag: 'The urgency is the product.',
    body: (
      <>
        <h4>What a countdown timer is designed to do</h4>
        <p>
          It's built to make you decide fast, before you've had time to ask whether you actually
          want this — only whether you might miss out.
        </p>
        <h4>What usually happens after it hits zero</h4>
        <p>
          A new "sale" often starts again shortly after. The urgency is rarely as real as the
          timer makes it feel.
        </p>
        <h4>Ask before you tap Continue</h4>
        <p>
          If this item had no timer on it at all, would you still want it at this price, today?
        </p>
      </>
    ),
    continueLabel: 'I understand — continue',
  },
  'subscription-upsell': {
    title: 'Upgrade to Premium for $2/week',
    flag: 'Small numbers add up.',
    body: (
      <>
        <h4>What $2/week actually costs</h4>
        <div className="line"><span>Per week</span><strong>$2.00</strong></div>
        <div className="line"><span>Per year</span><strong>$104.00</strong></div>
        <h4>How subscriptions are designed</h4>
        <p>
          They're priced small enough that cancelling never feels urgent — which is exactly why
          people end up paying for things they stopped using months ago.
        </p>
        <h4>Ask before you tap Continue</h4>
        <p>Will you remember to check whether you're still using this in three months?</p>
      </>
    ),
    continueLabel: 'I understand — subscribe',
  },
};

export function PracticeZone() {
  const [activeId, setActiveId] = useState(null);
  const [canContinue, setCanContinue] = useState(false);
  const bodyRef = useRef(null);
  const active = activeId ? SCENARIOS[activeId] : null;

  function open(id) {
    setActiveId(id);
    setCanContinue(false);
  }

  function close() {
    setActiveId(null);
  }

  function handleScroll() {
    const el = bodyRef.current;
    if (!el) return;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 6;
    if (atBottom) setCanContinue(true);
  }

  return (
    <div className="report">
      <h4>Practice zone</h4>
      <p className="sub">Safe simulations of the pressure tactics you'll meet in real checkouts.</p>
      <div className="chips">
        {Object.entries(SCENARIOS).map(([id, s]) => (
          <button key={id} className="chip" onClick={() => open(id)}>
            {s.title}
          </button>
        ))}
      </div>

      <div className={`modal-overlay${active ? ' open' : ''}`} onClick={(e) => e.target === e.currentTarget && close()}>
        {active && (
          <div className="modal">
            <div className="modal-head">
              <span className="flag">{active.flag}</span>
              <h3>{active.title}</h3>
              <p>This is a Practice Zone simulation — read the whole thing below before continuing.</p>
            </div>
            <div className="modal-body" ref={bodyRef} onScroll={handleScroll}>
              {active.body}
            </div>
            <div className="modal-foot">
              {!canContinue && <div className="scroll-hint">↓ Scroll to read the rest before continuing</div>}
              <button className="btn primary" disabled={!canContinue} onClick={close}>
                {active.continueLabel}
              </button>
              <button className="btn btn-cancel" type="button" onClick={close}>
                Never mind, go back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
