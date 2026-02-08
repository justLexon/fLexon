"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

export default function GlobalStatsPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("flexon_token");
    if (!token) {
      router.push("/");
      return;
    }

    const fetchStats = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stats/global`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });

        if (!res.ok) {
          setError("Could not load global stats.");
          setLoading(false);
          return;
        }

        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error(err);
        setError("Network error");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
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

  const buildSeries = (series) => {
    if (!Array.isArray(series)) return [];
    return series.map((point) => ({
      date: point.date,
      value: typeof point.avg === "number" ? point.avg : 0,
      hasValue: typeof point.avg === "number",
    }));
  };

  const waterSeries = buildSeries(stats.water_daily_series);
  const weightSeries = buildSeries(stats.weight_daily_series);

  const renderChart = (series, color, yLabel) => {
    if (!series.length || series.every((p) => !p.hasValue)) {
      return <p className={styles.muted}>No data yet</p>;
    }

    const values = series.map((p) => p.value);
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = Math.max(1, max - min);
    const width = 360;
    const height = 140;
    const padding = { top: 12, right: 16, bottom: 28, left: 40 };
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;
    const step = innerWidth / Math.max(1, series.length - 1);

    const points = series
      .map((p, index) => {
        const x = padding.left + index * step;
        const y =
          padding.top + innerHeight - ((p.value - min) / range) * innerHeight;
        return `${x},${y}`;
      })
      .join(" ");

    const firstDate = series[0]?.date;
    const lastDate = series[series.length - 1]?.date;
    const yMax = Math.round(max);
    const yMin = Math.round(min);

    return (
      <svg
        className={styles.chart}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + innerHeight}
          stroke="#c7dbcf"
        />
        <line
          x1={padding.left}
          y1={padding.top + innerHeight}
          x2={padding.left + innerWidth}
          y2={padding.top + innerHeight}
          stroke="#c7dbcf"
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
        <text
          x={padding.left}
          y={height - 8}
          textAnchor="start"
          className={styles.axisLabel}
        >
          {firstDate}
        </text>
        <text
          x={padding.left + innerWidth}
          y={height - 8}
          textAnchor="end"
          className={styles.axisLabel}
        >
          {lastDate}
        </text>
        <text
          x={12}
          y={padding.top + innerHeight / 2}
          textAnchor="middle"
          className={styles.axisLabel}
          transform={`rotate(-90 12 ${padding.top + innerHeight / 2})`}
        >
          {yLabel}
        </text>
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
        />
      </svg>
    );
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>fLexon Global Stats</p>
            <h1>All Users (UTC)</h1>
          </div>
          <Link className={styles.ghostButton} href="/pages/dashboard">
            Back to Dashboard
          </Link>
        </header>

        <section className={styles.rows}>
          <div className={styles.rowCard}>
            <div>
              <h2>Water Daily Avg</h2>
              <p className={styles.value}>{stats.water_daily_avg ?? "—"}</p>
              <p className={styles.caption}>Last 30 days (UTC)</p>
            </div>
            <div className={styles.chartPanel}>
              {renderChart(waterSeries, "#1f6b3f", "Avg")}
            </div>
          </div>
          <div className={styles.rowCard}>
            <div>
              <h2>Weight Daily Avg</h2>
              <p className={styles.value}>{stats.weight_daily_avg ?? "—"}</p>
              <p className={styles.caption}>Last 30 days (UTC)</p>
            </div>
            <div className={styles.chartPanel}>
              {renderChart(weightSeries, "#2f8751", "Avg")}
            </div>
          </div>
          <div className={styles.rowCard}>
            <div>
              <h2>Water All-Time Avg</h2>
              <p className={styles.value}>{stats.water_all_time_avg ?? "—"}</p>
            </div>
            <div className={styles.chartPlaceholder}>All-time</div>
          </div>
          <div className={styles.rowCard}>
            <div>
              <h2>Weight All-Time Avg</h2>
              <p className={styles.value}>{stats.weight_all_time_avg ?? "—"}</p>
            </div>
            <div className={styles.chartPlaceholder}>All-time</div>
          </div>
        </section>
      </main>
    </div>
  );
}
