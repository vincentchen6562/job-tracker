import { useEffect, useState } from 'react';
import { getWeeklyReports } from '../services/householdService.js';

export function useWeeklyReport() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWeeklyReports()
      .then(setReports)
      .finally(() => setLoading(false));
  }, []);

  return { reports, latest: reports[0] ?? null, loading };
}
