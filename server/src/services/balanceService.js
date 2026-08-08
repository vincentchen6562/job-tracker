import Transaction from '../models/Transaction.js';

const SIGN_BY_TYPE = {
  deposit: 1,
  bill_payment: -1,
  spend: -1,
  bnpl_repayment: -1,
};

/**
 * The teen's real bank balance is a running ledger of every transaction ever
 * recorded for them — not something stored directly, so it can never drift
 * out of sync with the transaction history.
 */
export async function getBalance(userId) {
  const transactions = await Transaction.find({ user: userId }, 'type amount');
  return transactions.reduce((total, t) => total + SIGN_BY_TYPE[t.type] * t.amount, 0);
}
