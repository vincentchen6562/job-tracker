import WeeklyReport from '../models/WeeklyReport.js';
import HabitsScore from '../models/HabitsScore.js';

// GET /api/reports/weekly — most recent reports for the logged-in user
export async function listWeeklyReports(req, res, next) {
  try {
    const filter = { household: req.user.household };
    if (req.user.role === 'teen') filter.user = req.user.id;
    const reports = await WeeklyReport.find(filter).sort({ weekStart: -1 }).limit(12);
    res.json(reports);
  } catch (err) {
    next(err);
  }
}

// GET /api/reports/habits-score
export async function getHabitsScore(req, res, next) {
  try {
    const latest = await HabitsScore.findOne({ household: req.user.household }).sort({ weekOf: -1 });
    res.json(latest);
  } catch (err) {
    next(err);
  }
}
