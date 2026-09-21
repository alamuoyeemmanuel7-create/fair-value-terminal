import { NextResponse } from "next/server";
import { fetchPreStocks } from "@/lib/prestocks";
import { fetchTessera } from "@/lib/tessera";
import { buildComparisons } from "@/lib/mispricing";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [preStocks, tessera] = await Promise.all([
      fetchPreStocks(),
      fetchTessera(),
    ]);
    const assets = [...preStocks, ...tessera];
    const comparisons = buildComparisons(assets);

    return NextResponse.json({
      assets,
      comparisons,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 502 }
    );
  }
}
