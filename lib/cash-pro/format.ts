const amountFormat = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** `1,23,456.00` */
export const formatAmount = (value: number) => amountFormat.format(Number(value || 0));

/** `₹ 1,23,456.00` */
export const formatINR = (value: number) => `₹ ${formatAmount(value)}`;

export const roundMoney = (value: number) => Math.round(value * 100) / 100;
