export const ALLOWED_PATHS_SALES_USER = [
  /^\/dashboard(\/.*)?$/,
  /^\/sales\/sale-invoice(\/.*)?$/,
  /^\/sales\/sale-return(\/.*)?$/,
  /^\/sales\/pos-counter-sale(\/.*)?$/,
  /^\/maintain\/customers(\/.*)?$/,
  /^\/maintain\/customer-balances(\/.*)?$/,
  /^\/reports\/sales\/customer-balances(\/.*)?$/,
  /^\/reports\/inventory\/balances(\/.*)?$/,
  /^\/reports(\/sales|\/inventory)?$/,
  /^\/whatsapp(\/.*)?$/,
];

export function isRouteAllowed(pathname: string, role: string): boolean {
  const normalizedRole = (role || "").toLowerCase().replace(/\s+/g, "");
  
  // Super admin / admin has access to everything
  if (normalizedRole === "superadmin" || normalizedRole === "admin") {
    return true;
  }

  if (normalizedRole === "salesuser" || normalizedRole === "sales_user") {
    return ALLOWED_PATHS_SALES_USER.some((regex) => regex.test(pathname));
  }

  // Fallback to true for legacy/other roles
  return true;
}
