"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

export default function GlobalStatsPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30d");
  const [chartType, setChartType] = useState("line");
  const [hover, setHover] = useState({ chart: null, index: null });
  const requestIdRef = useRef(0);
  const controllerRef = useRef(null);

  useEffect(() => {
    const fetchStats = async () => {
      const requestId = ++requestIdRef.current;
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
      const controller = new AbortController();
      controllerRef.current = controller;

      try {
        const res = await fetch("/api/stats/global", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (requestId !== requestIdRef.current) return;

        if (res.status === 401) {
          router.push("/");
          return;
        }

        if (!res.ok) {
          setError("Could not load global stats.");
          setLoading(false);
          return;
        }

        const data = await res.json();
        setStats(data);
      } catch (err) {
        if (err?.name === "AbortError") return;
        console.error(err);
        setError("Network error");
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    };

    fetchStats();
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, [router]);

  if (loading) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <div className={styles.loadingWrap}>
            <div className={styles.loadingCard}>
              <span className={styles.loadingDot} />
              <span className={styles.loadingDot} />
              <span className={styles.loadingDot} />
              <p className={styles.loadingText}>Loading stats…</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <p className={styles.error}>{error}</p>
          <Link className={styles.ghostButton} href="/pages/dashboard">
            Back to Dashboard
          </Link>
        </main>
      </div>
    );
  }

  if (!stats) return null;

  const parseDateOnly = (value) => {
    if (!value) return null;
    const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]) - 1;
      const day = Number(match[3]);
      return new Date(Date.UTC(year, month, day));
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const formatDateShort = (value) => {
    const date = parseDateOnly(value);
    if (!date) return "";
    return date.toLocaleDateString(undefined, {
      month: "numeric",
      day: "numeric",
      timeZone: "UTC",
    });
  };

  const filterSeries = (series) => {
    if (!Array.isArray(series)) return [];
    if (range === "30d") {
      return series.slice(-30);
    }
    if (range === "month") {
      const now = new Date();
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      return series.filter((point) => {
        const date = parseDateOnly(point.date);
        return date && date >= start;
      });
    }
    return series;
  };

  const buildSeries = (series) => {
    if (!Array.isArray(series)) return [];
    return filterSeries(series).map((point) => ({
      date: point.date,
      value: typeof point.avg === "number" ? point.avg : 0,
      hasValue: typeof point.avg === "number",
    }));
  };

  const waterSeries = buildSeries(stats.water_daily_series);
  const weightSeries = buildSeries(stats.weight_daily_series);

  const renderChart = (series, color, yLabel, chartId, unit) => {
    if (!series.length || series.every((p) => !p.hasValue)) {
      return <p className={styles.muted}>No data yet</p>;
    }

    const values = series.map((p) => p.value);
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = Math.max(1, max - min);
    const width = 900;
    const height = 280;
    const padding = { top: 18, right: 24, bottom: 44, left: 56 };
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;
    const barInset = 10;
    const usableWidth = innerWidth - barInset * 2;
    const step = usableWidth / Math.max(1, series.length - 1);

    const coordinates = series.map((p, index) => {
      const x = padding.left + barInset + index * step;
      const y =
        padding.top + innerHeight - ((p.value - min) / range) * innerHeight;
      return { x, y, date: p.date, value: p.value };
    });
    const points = coordinates.map((p) => `${p.x},${p.y}`).join(" ");

    const firstDate = series[0]?.date;
    const lastDate = series[series.length - 1]?.date;
    const formatDate = (value) => {
      if (!value) return "";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return String(value);
      return date.toLocaleDateString();
    };
    const yMax = Math.round(max);
    const yMin = Math.round(min);
    const hoveredIndex = hover.chart === chartId ? hover.index : null;
    const hoveredPoint =
      hoveredIndex !== null && hoveredIndex >= 0 && hoveredIndex < coordinates.length
        ? coordinates[hoveredIndex]
        : null;
    const valueLabel =
      hoveredPoint && Number.isFinite(hoveredPoint.value)
        ? `${hoveredPoint.value.toFixed(1)} ${unit}`
        : "—";
    const dateLabel = hoveredPoint ? formatDateShort(hoveredPoint.date) : "";
    const tooltipWidth = Math.min(
      60,
      Math.max(64, Math.max(dateLabel.length, valueLabel.length) * 6 + 22)
    );
    const tooltipHeight = 40;
    const tooltipX = hoveredPoint
      ? Math.min(
          Math.max(hoveredPoint.x + 18, padding.left),
          padding.left + innerWidth - tooltipWidth
        )
      : 0;
    const tooltipY = hoveredPoint
      ? Math.min(
          Math.max(hoveredPoint.y - tooltipHeight - 14, padding.top),
          padding.top + innerHeight - tooltipHeight
        )
      : 0;

    return (
      <svg
        className={styles.chart}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        onMouseLeave={() => setHover({ chart: null, index: null })}
      >
        <defs>
          <linearGradient id="chartGlow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0.04" />
          </linearGradient>
        </defs>
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + innerHeight}
          stroke="rgba(190, 230, 210, 0.4)"
        />
        <line
          x1={padding.left}
          y1={padding.top + innerHeight}
          x2={padding.left + innerWidth}
          y2={padding.top + innerHeight}
          stroke="rgba(190, 230, 210, 0.4)"
        />
        <text
          x={padding.left - 8}
          y={padding.top + 10}
          textAnchor="end"
          className={styles.axisLabel}
        >
          {yMax}
        </text>
        <text
          x={padding.left - 8}
          y={padding.top + innerHeight}
          textAnchor="end"
          className={styles.axisLabel}
        >
          {yMin}
        </text>
        {/* Per-day labels render below; omit axis start/end labels to avoid duplicates. */}
        <text
          x={12}
          y={padding.top + innerHeight / 2}
          textAnchor="middle"
          className={styles.axisLabel}
          transform={`rotate(-90 12 ${padding.top + innerHeight / 2})`}
        >
          {yLabel}
        </text>
        {chartType === "line" ? (
          <>
            <polyline
              points={points}
              fill="none"
              stroke={color}
              strokeWidth="3.5"
            />
            {coordinates.map((point, index) => (
              <g key={`${point.date}-${index}`}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={10}
                  fill="transparent"
                  onMouseEnter={() => setHover({ chart: chartId, index })}
                />
                {hoveredIndex === index && (
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={5}
                    fill={color}
                  />
                )}
              </g>
            ))}
          </>
        ) : (
          coordinates.map((point, index) => {
            const barWidth = Math.max(4, step * 0.45);
            const minX = padding.left + barInset;
            const maxX = padding.left + barInset + usableWidth - barWidth;
            let x = point.x - barWidth / 2;
            if (index === 0) x = minX;
            if (index === coordinates.length - 1) x = maxX;
            x = Math.min(Math.max(x, minX), maxX);
            const y = point.y;
            const height = padding.top + innerHeight - point.y;
            return (
              <rect
                key={`${point.date}-${index}`}
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(1, height)}
                rx="6"
                fill={color}
                opacity="0.85"
                onMouseEnter={() => setHover({ chart: chartId, index })}
              />
            );
          })
        )}
        {hoveredPoint && (
          <g pointerEvents="none">
            <rect
              x={tooltipX}
              y={tooltipY}
              width={tooltipWidth}
              height={tooltipHeight}
              rx="8"
              fill="rgba(8, 24, 17, 0.9)"
              stroke="rgba(210, 255, 235, 0.35)"
            />
            <text
              x={tooltipX + 10}
              y={tooltipY + 16}
              className={styles.axisLabel}
            >
              {dateLabel}
            </text>
            <text
              x={tooltipX + 10}
              y={tooltipY + 32}
              className={styles.axisLabel}
            >
              {valueLabel}
            </text>
          </g>
        )}
        {coordinates.map((point, index) => {
          if (chartType === "bar") {
            const barWidth = Math.max(4, step * 0.45);
            const minX = padding.left + barInset;
            const maxX = padding.left + barInset + usableWidth - barWidth;
            let x = point.x - barWidth / 2;
            if (index === 0) x = minX;
            if (index === coordinates.length - 1) x = maxX;
            x = Math.min(Math.max(x, minX), maxX);
            const labelX = x + barWidth / 2;
            return (
              <text
                key={`${point.date}-label-${index}`}
                x={labelX}
                y={height - 6}
                textAnchor="middle"
                className={styles.axisLabel}
              >
                {formatDateShort(point.date)}
              </text>
            );
          }
          return (
            <text
              key={`${point.date}-label-${index}`}
              x={point.x}
              y={height - 6}
              textAnchor="middle"
              className={styles.axisLabel}
            >
              {formatDateShort(point.date)}
            </text>
          );
        })}
      </svg>
    );
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>fLexon Global Atlas</p>
            <h1>Worldwide Hydration & Weight Signals</h1>
            <p className={styles.subhead}>Unified averages across every active account (UTC).</p>
          </div>
          <div className={styles.headerActions}>
            <Link className={styles.ghostButton} href="/pages/dashboard">
              Back to Dashboard
            </Link>
          </div>
        </header>

        <section className={styles.metrics}>
          <div className={styles.metricCard}>
            <p className={styles.metricLabel}>Water Daily Avg</p>
            <p className={styles.metricValue}>{stats.water_daily_avg ?? "—"}</p>
            <p className={styles.metricCaption}>Last 30 days</p>
          </div>
          <div className={styles.metricCard}>
            <p className={styles.metricLabel}>Weight Daily Avg</p>
            <p className={styles.metricValue}>{stats.weight_daily_avg ?? "—"}</p>
            <p className={styles.metricCaption}>Last 30 days</p>
          </div>
          <div className={styles.metricCard}>
            <p className={styles.metricLabel}>Water All-Time Avg</p>
            <p className={styles.metricValue}>{stats.water_all_time_avg ?? "—"}</p>
            <p className={styles.metricCaption}>All-time</p>
          </div>
          <div className={styles.metricCard}>
            <p className={styles.metricLabel}>Weight All-Time Avg</p>
            <p className={styles.metricValue}>{stats.weight_all_time_avg ?? "—"}</p>
            <p className={styles.metricCaption}>All-time</p>
          </div>
        </section>

        <section className={styles.chartsSection}>
          <div className={styles.chartToolbar}>
            <div className={styles.toggleGroup}>
              <button
                className={`${styles.toggleButton} ${range === "30d" ? styles.activeToggle : ""}`}
                type="button"
                onClick={() => setRange("30d")}
              >
                Last 30 Days
              </button>
              <button
                className={`${styles.toggleButton} ${range === "month" ? styles.activeToggle : ""}`}
                type="button"
                onClick={() => setRange("month")}
              >
                Current Month
              </button>
            </div>
            <div className={styles.toggleGroup}>
              <button
                className={`${styles.toggleButton} ${chartType === "line" ? styles.activeToggle : ""}`}
                type="button"
                onClick={() => setChartType("line")}
              >
                Line
              </button>
              <button
                className={`${styles.toggleButton} ${chartType === "bar" ? styles.activeToggle : ""}`}
                type="button"
                onClick={() => setChartType("bar")}
              >
                Bars
              </button>
            </div>
          </div>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitleWrap}>
              <p className={styles.chartKicker}>
                {chartType === "line" ? "Global Flow" : "Global Bars"}
              </p>
              <h2>Daily Water Average</h2>
              <p className={styles.chartSubtitle}>
                {range === "30d" ? "Last 30 days" : "Current month"}
              </p>
            </div>
          </div>
          <div className={styles.chartShell}>
            {renderChart(waterSeries, "#7fe3ff", "Avg", "water", "ml")}
          </div>

          <div className={styles.chartHeader}>
            <div className={styles.chartTitleWrap}>
              <p className={styles.chartKicker}>
                {chartType === "line" ? "Global Curve" : "Global Bars"}
              </p>
              <h2>Daily Weight Average</h2>
              <p className={styles.chartSubtitle}>
                {range === "30d" ? "Last 30 days" : "Current month"}
              </p>
            </div>
          </div>
          <div className={styles.chartShell}>
            {renderChart(weightSeries, "#74f0b0", "Avg", "weight", "lbs")}
          </div>
        </section>
      </main>
    </div>
  );
}

