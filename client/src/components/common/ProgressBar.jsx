export function ProgressBar({ value, max }) {
  const pct = Math.max(4, Math.min(100, (value / Math.max(1, max)) * 100));
  return (
    <div className="bar">
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}
