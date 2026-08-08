import {
  generateTeenCoachMessage,
  generateParentConversationPrompt,
  answerHouseholdQuestion,
} from '../services/aiService.js';

// POST /api/ai/coach-message
export async function coachMessage(req, res, next) {
  try {
    const message = await generateTeenCoachMessage(req.body);
    res.json({ message });
  } catch (err) {
    next(err);
  }
}

// POST /api/ai/conversation-prompt
export async function conversationPrompt(req, res, next) {
  try {
    const prompt = await generateParentConversationPrompt(req.body);
    res.json({ prompt });
  } catch (err) {
    next(err);
  }
}

// POST /api/ai/ask — Q&A over household/report context
export async function ask(req, res, next) {
  try {
    const { question, context } = req.body;
    const answer = await answerHouseholdQuestion({ question, context });
    res.json({ answer });
  } catch (err) {
    next(err);
  }
}
