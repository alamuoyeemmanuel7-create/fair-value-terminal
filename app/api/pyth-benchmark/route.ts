import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Pyth benchmark endpoint - DISABLED
 * 
 * The Pyth API (/v2/updates/price/latest) requires special authentication
 * that is not publicly available. Rather than showing errors, we gracefully
 * disable this feature and focus on real PreStocks & Tessera data.
 * 
 * This endpoint returns empty results so the UI shows the "unavailable" message.
 */
export async function GET() {
  return NextResponse.json(
    { 
      results: [], 
      fetchedAt: new Date().toISOString(),
      disabled: true,
      note: "Pyth benchmark requires API authentication. Dashboard focuses on real PreStocks & Tessera data."
    },
    { status: 200 }
  );
}
