import { useCallback, useState } from 'react';
import { getCoachMessage } from '../services/aiService.js';

export function useAICoach() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async (context) => {
    setLoading(true);
    try {
      setMessage(await getCoachMessage(context));
    } finally {
      setLoading(false);
    }
  }, []);

  return { message, loading, refresh };
}
