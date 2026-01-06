import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Image
          className={styles.logo}
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />

        <div className={styles.intro}>
          <h1>Welcome to fLexon</h1>
          <p>Track your water and weight in one place.</p>
        </div>

        <div className={styles.ctas}>
          {/* ✅ Register */}
          <Link href="/register" className={styles.primary}>
            Get Started
          </Link>

          {/* ✅ Login */}
          <Link href="/login" className={styles.secondary}>
            Login
          </Link>
        </div>
      </main>
    </div>
  );
}
