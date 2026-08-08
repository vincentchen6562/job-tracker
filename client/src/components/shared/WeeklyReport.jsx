export function WeeklyReport({ report }) {
  if (!report) return <p className="sub">No report for this week yet.</p>;
  return (
    <div className="report">
      <h4>
        Week of {new Date(report.weekStart).toLocaleDateString()} – {new Date(report.weekEnd).toLocaleDateString()}
      </h4>
      <p>{report.aiSummary}</p>
    </div>
  );
}
