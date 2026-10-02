const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const BRL_CENTS = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

export function money(value: number, cents = false): string {
  return (cents ? BRL_CENTS : BRL).format(value);
}

export function installments(price: number, max = 10): string {
  const n = price >= 2000 ? max : price >= 600 ? 8 : price >= 150 ? 5 : 1;
  if (n <= 1) return "à vista";
  return `${n}x ${BRL_CENTS.format(price / n)}`;
}

export function watts(n: number): string {
  return `${n} W`;
}
