import { NextResponse } from "next/server";
import { fetchPythEquityBenchmark } from "@/lib/pyth";

export const dynamic = "force-dynamic";

// Pyth benchmark is optional - focus on PreStocks & Tessera data instead
// If Pyth API is unavailable (401, rate-limited, etc), gracefully skip it
const BENCHMARK_SYMBOLS = ["AAPL", "TSLA", "NVDA"];

export async function GET() {
  try {
    const results = await Promise.all(
      BENCHMARK_SYMBOLS.map((s) => 
        fetchPythEquityBenchmark(s).catch(() => null)
      )
    );
    
    // Filter out null values (failed requests)
    const validResults = results.filter((r) => r !== null);
    
    return NextResponse.json({ 
      results: validResults,
      fetchedAt: new Date().toISOString(),
      note: "Pyth benchmark data may be unavailable. Dashboard focuses on PreStocks & Tessera data."
    });
  } catch (err) {
    // Silently fail - Pyth is optional
    return NextResponse.json(
      { results: [], fetchedAt: new Date().toISOString() },
      { status: 200 }
    );
  }
}
