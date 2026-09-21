/**
 * Sparkline component for quick trend visualization
 */

interface SparklineProps {
  data: number[]; // Array of normalized values (0-1)
  width?: number;
  height?: number;
  color?: string;
  trend?: "up" | "down" | "stable";
}

export function Sparkline({
  data,
  width = 60,
  height = 20,
  color = "#3b82f6",
  trend,
}: SparklineProps) {
  if (data.length === 0) {
    return <span className="sparkline-empty">—</span>;
  }

  // Calculate SVG path
  const padding = 2;
  const effectiveWidth = width - padding * 2;
  const effectiveHeight = height - padding * 2;

  const points = data
    .map((value, i) => {
      const x = padding + (i / (data.length - 1)) * effectiveWidth;
      const y = padding + effectiveHeight - value * effectiveHeight;
      return `${x},${y}`;
    })
    .join(" ");

  const trendColor =
    trend === "up"
      ? "#ef4444"
      : trend === "down"
        ? "#22c55e"
        : trend === "stable"
          ? "#6b7280"
          : color;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="sparkline"
      style={{ display: "inline-block" }}
    >
      <polyline
        points={points}
        fill="none"
        stroke={trendColor}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
