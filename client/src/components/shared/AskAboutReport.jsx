import { useState } from 'react';
import { askAboutReport } from '../../services/aiService.js';

export function AskAboutReport({ context }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  async function ask() {
    setAnswer(await askAboutReport(question, context));
  }

  return (
    <div className="report">
      <h4>Ask about this report</h4>
      <input
        type="text"
        placeholder="Why did our food spending increase this week?"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />
      <button className="btn secondary" style={{ marginTop: 10 }} onClick={ask}>
        Ask
      </button>
      {answer && <p className="sub" style={{ marginTop: 10 }}>{answer}</p>}
    </div>
  );
}
