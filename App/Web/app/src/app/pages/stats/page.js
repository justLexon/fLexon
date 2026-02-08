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

        <section className={styles.grid}>
          <div className={styles.card}>
            <h2>Water Daily Avg</h2>
            <p className={styles.value}>
              {stats.water_daily_avg ?? "—"}
            </p>
          </div>
          <div className={styles.card}>
            <h2>Weight Daily Avg</h2>
            <p className={styles.value}>
              {stats.weight_daily_avg ?? "—"}
            </p>
          </div>
          <div className={styles.card}>
            <h2>Water All-Time Avg</h2>
            <p className={styles.value}>
              {stats.water_all_time_avg ?? "—"}
            </p>
          </div>
          <div className={styles.card}>
            <h2>Weight All-Time Avg</h2>
            <p className={styles.value}>
              {stats.weight_all_time_avg ?? "—"}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
