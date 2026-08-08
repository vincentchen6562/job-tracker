export function FamilyHabitsScore({ habitsScore }) {
  if (!habitsScore) return null;
  return (
    <div className="report">
      <h4>Family financial habits score</h4>
      <div className="num">{habitsScore.score}</div>
      <p className="sub">Based on behaviour — saving consistency, on-time bills, goal progress — never on wealth or income.</p>
    </div>
  );
}
