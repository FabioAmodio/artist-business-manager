/** Arrotonda una serie di importi al centesimo mantenendo la somma esatta sul totale (metodo del resto piu grande), senza generare importi negativi. */
export function distributeAmountsToCents(rawAmounts: readonly number[], total: number): number[] {
  if (!rawAmounts.length) return [];
  const totalCents = Math.round(total * 100);
  const floorCents = rawAmounts.map((value) => Math.floor(Math.max(0, value) * 100));
  const allocatedCents = floorCents.reduce((sum, value) => sum + value, 0);
  let remainingCents = totalCents - allocatedCents;
  const byFractionDesc = rawAmounts
    .map((value, index) => ({ index, fraction: Math.max(0, value) * 100 - floorCents[index] }))
    .sort((first, second) => second.fraction - first.fraction);
  const resultCents = [...floorCents];
  for (let i = 0; i < byFractionDesc.length && remainingCents > 0; i += 1) {
    resultCents[byFractionDesc[i].index] += 1;
    remainingCents -= 1;
  }
  let cursor = byFractionDesc.length - 1;
  while (remainingCents < 0 && cursor >= 0) {
    if (resultCents[byFractionDesc[cursor].index] > 0) {
      resultCents[byFractionDesc[cursor].index] -= 1;
      remainingCents += 1;
    }
    cursor -= 1;
  }
  return resultCents.map((cents) => cents / 100);
}

export function completeAmountsToTotal(amounts: readonly (number | null | undefined)[], total: number): number[] {
  const missingIndexes = amounts.flatMap((amount, index) => amount == null ? [index] : []);
  const assignedTotal = amounts.reduce<number>((sum, amount) => sum + (amount ?? 0), 0);
  const remaining = Math.round((total - assignedTotal) * 100) / 100;
  if (remaining < 0) throw new Error('Gli importi assegnati superano il prezzo del pacchetto.');
  if (!missingIndexes.length) return amounts.map((amount) => amount ?? 0);
  const allocations = distributeAmountsToCents(missingIndexes.map(() => remaining / missingIndexes.length), remaining);
  let allocationIndex = 0;
  return amounts.map((amount) => {
    if (amount != null) return amount;
    const allocation = allocations[allocationIndex];
    allocationIndex += 1;
    return allocation;
  });
}
