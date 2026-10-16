// Dollar <-> integer-cents conversion for service prices.

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function centsToDollars(cents: number): number {
  return cents / 100;
}

/** "Rs 3,500" / "$25" — whole amounts drop the decimals. */
export function formatMoney(cents: number, currency: string): string {
  const amount = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}
