import { NextResponse } from "next/server";
import { fetchPythEquityBenchmark } from "@/lib/pyth";

export const dynamic = "force-dynamic";

// Pyth benchmark is optional - focus on PreStocks & Tessera data instead
// Pyth API may require authentication or have rate limiting
const BENCHMARK_SYMBOLS = ["AAPL", "TSLA", "NVDA"];

export async function GET() {
  try {
    const results = await Promise.all(
      BENCHMARK_SYMBOLS.map((s) => 
        fetchPythEquityBenchmark(s)
          .catch(() => null)
      )
    );
    
    // Filter out null values (failed requests)
    const validResults = results.filter((r) => r !== null);
    
    return NextResponse.json({ 
      results: validResults,
      fetchedAt: new Date().toISOString(),
      note: "Pyth benchmark data requires special access. Dashboard prioritizes real PreStocks & Tessera data."
    });
  } catch (err) {
    // Silently fail - Pyth is optional
    return NextResponse.json(
      { 
        results: [], 
        fetchedAt: new Date().toISOString(),
        note: "Pyth benchmark currently unavailable"
      },
      { status: 200 }
    );
  }
}
