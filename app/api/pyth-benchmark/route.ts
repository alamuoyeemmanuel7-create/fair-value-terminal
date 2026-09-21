import { NextResponse } from "next/server";
import { fetchPythEquityBenchmark } from "@/lib/pyth";

export const dynamic = "force-dynamic";

// A handful of public companies that have BOTH a real Pyth equity feed and
// tokenized-wrapper feeds (xStocks / Ondo). Used as a sanity-check panel:
// it shows how far a tokenized wrapper trades from ground truth even when
// ground truth is public and continuous - the gap only gets wider for
// pre-IPO names where no public ground truth exists at all.
const BENCHMARK_SYMBOLS = ["AAPL", "TSLA", "NVDA"];

export async function GET() {
  try {
    const results = await Promise.all(
      BENCHMARK_SYMBOLS.map((s) => fetchPythEquityBenchmark(s))
    );
    return NextResponse.json({ results, fetchedAt: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 502 }
    );
  }
}
