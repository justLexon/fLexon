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
    return <p className={styles.loading}>Loading...</p>;
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

  const renderSparkline = (series, color) => {
    if (!series.length || series.every((p) => !p.hasValue)) {
      return <p className={styles.muted}>No data yet</p>;
    }

    const values = series.map((p) => p.value);
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = Math.max(1, max - min);
    const width = 240;
    const height = 64;
    const step = width / Math.max(1, series.length - 1);

    const points = series
      .map((p, index) => {
        const x = index * step;
        const y = height - ((p.value - min) / range) * height;
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <svg
        className={styles.sparkline}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
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
              {renderSparkline(waterSeries, "#1f6b3f")}
            </div>
          </div>
          <div className={styles.rowCard}>
            <div>
              <h2>Weight Daily Avg</h2>
              <p className={styles.value}>{stats.weight_daily_avg ?? "—"}</p>
              <p className={styles.caption}>Last 30 days (UTC)</p>
            </div>
            <div className={styles.chartPanel}>
              {renderSparkline(weightSeries, "#2f8751")}
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
