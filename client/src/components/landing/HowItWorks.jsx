const STEPS = [
  { n: 1, title: 'Parent sets the world', text: 'Deposit $200 a week. Add rent, groceries, power, gas, phone or any custom household contribution.' },
  { n: 2, title: 'Teen pays their life', text: 'Bills become weekly or monthly tasks. The teenager chooses when to pay them from their real balance.' },
  { n: 3, title: 'Mistakes have consequences', text: 'If they spend the rent money, the unpaid amount rolls forward and comes out of the next allowance.' },
  { n: 4, title: 'AI turns behaviour into judgement', text: 'Teen gets context. Parent gets one useful conversation. Both see progress without turning the app into surveillance.' },
];

export function HowItWorks() {
  return (
    <section id="how">
      <div className="section-head">
        <h2>A real-money training ground for adulthood.</h2>
        <p>
          The parent creates a simplified version of adult life. The teen gets real money, real
          obligations and real consequences — without credit-card debt, late fees or financial
          disaster.
        </p>
      </div>
      <div className="steps">
        {STEPS.map((s) => (
          <div className="step" key={s.n}>
            <div className="n">{s.n}</div>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
