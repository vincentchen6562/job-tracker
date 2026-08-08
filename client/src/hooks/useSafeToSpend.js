import { useMemo } from 'react';
import { safeToSpend, unpaidBillsTotal } from '../utils/safeToSpend.js';

export function useSafeToSpend({ balance, bills, savingsTarget }) {
  return useMemo(() => {
    const unpaid = unpaidBillsTotal(bills);
    return {
      unpaid,
      safeToSpend: safeToSpend({ balance, unpaidBills: unpaid, savingsTarget }),
    };
  }, [balance, bills, savingsTarget]);
}
