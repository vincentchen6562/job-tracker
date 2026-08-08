export function LearningSummary({ report }) {
  if (!report) return null;
  return (
    <div className="report">
      <h4>Weekly learning summary</h4>
      <ul>
        <li>{report.billsPaidOnTime} bills paid on time.</li>
        <li>{report.billsMissed} bills missed.</li>
        <li>${report.savingsContribution} contributed to savings.</li>
        <li>${report.debtCarriedForward} carried forward as debt.</li>
      </ul>
    </div>
  );
}
