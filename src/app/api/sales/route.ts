import { fail, ok } from "@/lib/api";

export const dynamic = 'force-dynamic';

export async function GET() {
  // This endpoint is handled by the mock API (IndexedDB) on the client side
  // Return empty response since mock API intercepts all fetch calls
  return ok([]);
}
