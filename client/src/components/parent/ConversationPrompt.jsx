export function ConversationPrompt({ brief, prompt }) {
  return (
    <div className="report">
      <h4>Parent AI briefing</h4>
      <div className="sub">{brief}</div>
      <div className="notification">
        <strong>Conversation prompt</strong>
        <br />
        <span className="sub">"{prompt}"</span>
      </div>
    </div>
  );
}
