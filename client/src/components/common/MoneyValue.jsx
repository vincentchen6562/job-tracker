import { money } from '../../utils/money.js';

export function MoneyValue({ amount, className = '' }) {
  const sign = amount < 0 ? 'danger' : '';
  return <strong className={`${sign} ${className}`}>{money(amount)}</strong>;
}
