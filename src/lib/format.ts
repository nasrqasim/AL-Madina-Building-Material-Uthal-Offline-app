export function formatDate(value: unknown) {
  if (!value) return "—";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString();
}

export function formatMoney(value: unknown) {
  const n = Number(value || 0);
  return `Rs. ${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}
