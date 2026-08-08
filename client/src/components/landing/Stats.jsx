const STATS = [
  { num: '85%', text: 'of surveyed parents said they should have more conversations about good money habits.' },
  { num: '65%', text: 'found it difficult to step back and let their child make their own money mistakes.' },
  { num: '51%', text: 'struggled to explain money in a way their child could understand.' },
];

export function Stats() {
  return (
    <div className="stats">
      {STATS.map((s) => (
        <div className="stat" key={s.num}>
          <div className="num">{s.num}</div>
          <p>{s.text}</p>
        </div>
      ))}
    </div>
  );
}
