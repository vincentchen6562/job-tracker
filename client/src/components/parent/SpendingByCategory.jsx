import { Card } from '../common/Card.jsx';
import { MoneyValue } from '../common/MoneyValue.jsx';

/**
 * Privacy-aware view: shows spend by category (e.g. "Food"), never the
 * underlying merchant/product ("McDonald's"), per the household's
 * visibleCategories setting.
 */
export function SpendingByCategory({ categoryTotals }) {
  return (
    <Card>
      <h4>Spending by category</h4>
      {Object.entries(categoryTotals).map(([category, amount]) => (
        <div className="summary-row" key={category}>
          <span style={{ textTransform: 'capitalize' }}>{category}</span>
          <MoneyValue amount={amount} />
        </div>
      ))}
    </Card>
  );
}
