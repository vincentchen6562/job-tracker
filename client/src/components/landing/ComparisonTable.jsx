export function ComparisonTable() {
  return (
    <section>
      <div className="section-head">
        <h2>Not a budgeting app. A responsibility engine.</h2>
        <p>The product teaches a sequence most adults only learn after leaving home.</p>
      </div>
      <div className="compare">
        <div className="compare-card">
          <h3>Typical teen banking</h3>
          <div className="compare-row">Parent sees transactions</div>
          <div className="compare-row">Parent blocks categories</div>
          <div className="compare-row">Teen gets a card</div>
          <div className="compare-row">Generic financial education</div>
        </div>
        <div className="compare-card">
          <h3>18 Before 18</h3>
          <div className="compare-row">Teen has obligations before discretionary spend</div>
          <div className="compare-row">Missed bills carry into the next payday</div>
          <div className="compare-row">Saving competes with real spending decisions</div>
          <div className="compare-row">AI interprets behaviour and guides the next conversation</div>
        </div>
      </div>
    </section>
  );
}
