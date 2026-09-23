export interface Balance { id: string; name: string; amount: number; }
export interface Transfer { from: string; to: string; amount: number; }

/** Matches debtors to creditors so the fewest practical cash transfers settle all balances. */
export function suggestTransfers(balances: Balance[]): Transfer[] {
  const debtors = balances.filter(balance => balance.amount < -0.004).map(balance => ({ ...balance, amount: -balance.amount }));
  const creditors = balances.filter(balance => balance.amount > 0.004).map(balance => ({ ...balance }));
  const transfers: Transfer[] = [];
  let debtor = 0; let creditor = 0;
  while (debtor < debtors.length && creditor < creditors.length) {
    const amount = Math.round(Math.min(debtors[debtor].amount, creditors[creditor].amount) * 100) / 100;
    if (amount > 0) transfers.push({ from: debtors[debtor].name, to: creditors[creditor].name, amount });
    debtors[debtor].amount = Math.round((debtors[debtor].amount - amount) * 100) / 100;
    creditors[creditor].amount = Math.round((creditors[creditor].amount - amount) * 100) / 100;
    if (debtors[debtor].amount < 0.005) debtor++;
    if (creditors[creditor].amount < 0.005) creditor++;
  }
  return transfers;
}
