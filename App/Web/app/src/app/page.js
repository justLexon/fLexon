"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function Home() {
  const router = useRouter();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const readResponse = async (res) => {
    const contentType = res.headers.get("content-type") || "";
    const text = await res.text();
    let json = null;

    if (contentType.includes("application/json")) {
      try {
        json = JSON.parse(text);
      } catch (parseError) {
        json = null;
      }
    }

    return { text, json };
  };

  const fetchWithTimeout = async (url, options, timeoutMs = 8000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("flexon_token");
    if (!token) return;

    const checkSession = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });

        if (res.ok) {
          router.push("/pages/dashboard");
        }
      } catch (err) {
        console.error(err);
      }
    };

    checkSession();
  }, [router]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    try {
      const res = await fetchWithTimeout(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({ email: loginEmail, password: loginPassword }),
        },
        8000
      );

      const { text, json } = await readResponse(res);
      const data = json || {};

      if (!res.ok) {
        setError(data.error || text || "Login failed");
        return;
      }

      if (data?.token) {
        localStorage.setItem("flexon_token", data.token);
      }

      setLoginEmail("");
      setLoginPassword("");
      router.push("/pages/dashboard");
    } catch (err) {
      console.error(err);
      if (err.name === "AbortError") {
        setError("Request timed out. Backend did not respond.");
        return;
      }
      setError("Network error");
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    try {
      const res = await fetchWithTimeout(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({
            email: registerEmail,
            password: registerPassword,
          }),
        },
        8000
      );

      const { text, json } = await readResponse(res);
      const data = json || {};

      if (!res.ok) {
        setError(data.error || text || "Registration failed");
        return;
      }

      setRegisterEmail("");
      setRegisterPassword("");
      setNotice("Account created. Please log in.");
    } catch (err) {
      console.error(err);
      if (err.name === "AbortError") {
        setError("Request timed out. Backend did not respond.");
        return;
      }
      setError("Network error");
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.hero}>
          <p className={styles.kicker}>Daily wellness, simplified</p>
          <h1>fLexon</h1>
          <p className={styles.subtitle}>
            Track water intake and weight in one clean, focused dashboard.
          </p>
        </header>

        <section className={styles.grid}>
          <div className={styles.card}>
            <h2>Login</h2>
            <form className={styles.form} onSubmit={handleLogin}>
              <label className={styles.label}>
                Email
                <input
                  className={styles.input}
                  type="email"
                  placeholder="you@flexon.com"
                  value={loginEmail}
                  onChange={(event) => setLoginEmail(event.target.value)}
                  required
                />
              </label>
              <label className={styles.label}>
                Password
                <input
                  className={styles.input}
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  required
                />
              </label>
              <button className={styles.primaryButton} type="submit">
                Login
              </button>
            </form>
          </div>

          <div className={styles.card}>
            <h2>Register</h2>
            <form className={styles.form} onSubmit={handleRegister}>
              <label className={styles.label}>
                Email
                <input
                  className={styles.input}
                  type="email"
                  placeholder="you@flexon.com"
                  value={registerEmail}
                  onChange={(event) => setRegisterEmail(event.target.value)}
                  required
                />
              </label>
              <label className={styles.label}>
                Password
                <input
                  className={styles.input}
                  type="password"
                  placeholder="Create a password"
                  value={registerPassword}
                  onChange={(event) => setRegisterPassword(event.target.value)}
                  required
                />
              </label>
              <button className={styles.secondaryButton} type="submit">
                Create Account
              </button>
            </form>
          </div>
        </section>

        {(error || notice) && (
          <section className={styles.notice}>
            {error && <p className={styles.error}>{error}</p>}
            {notice && <p className={styles.success}>{notice}</p>}
          </section>
        )}
      </main>
    </div>
  );
}
