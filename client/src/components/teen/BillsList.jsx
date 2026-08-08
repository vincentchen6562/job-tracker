import { MoneyValue } from '../common/MoneyValue.jsx';

export function BillsList({ bills, onPay }) {
  return (
    <div className="pay-list">
      {bills.map((bill) => (
        <div className="pay-item" key={bill._id}>
          <div>
            <strong>{bill.name}</strong>
            <div className="sub">{bill.paid ? 'Completed' : 'Due this week'}</div>
          </div>
          <MoneyValue amount={bill.amount} />
          <button
            className={bill.paid ? 'paid-btn' : 'pay-now'}
            disabled={bill.paid}
            onClick={() => onPay(bill._id)}
          >
            {bill.paid ? 'Paid' : 'Pay now'}
          </button>
        </div>
      ))}
    </div>
  );
}
