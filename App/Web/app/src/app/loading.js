import styles from "./loading.module.css";

export default function Loading() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.orbit}>
          <span className={styles.orbitDot} />
          <span className={styles.orbitDot} />
          <span className={styles.orbitDot} />
        </div>
        <div className={styles.titleRow}>
          <span className={styles.titleMark}>f</span>
          <p className={styles.label}>Lexon is syncing your day</p>
        </div>
        <p className={styles.subLabel}>Gathering hydration and weight trends</p>
      </div>
    </div>
  );
}
