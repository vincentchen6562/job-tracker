export function money(amount) {
  const rounded = Math.round(amount);
  return rounded < 0 ? `-$${Math.abs(rounded)}` : `$${rounded}`;
}
