"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [waterLogs, setWaterLogs] = useState([]);
  const [weightLogs, setWeightLogs] = useState([]);
  const [newWaterAmount, setNewWaterAmount] = useState("");
  const [newWeightAmount, setNewWeightAmount] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [editAmount, setEditAmount] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [waterSort, setWaterSort] = useState("newest");
  const [weightSort, setWeightSort] = useState("newest");
  const [pageSize, setPageSize] = useState(5);
  const [waterPage, setWaterPage] = useState(1);
  const [weightPage, setWeightPage] = useState(1);

  const getAuthHeaders = () => {
    if (typeof window === "undefined") return {};
    const token = localStorage.getItem("flexon_token");
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  };

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

  const fetchData = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }
    setError("");
    setNeedsLogin(false);

    try {
      const authHeaders = getAuthHeaders();
      if (!authHeaders.Authorization) {
        setNeedsLogin(true);
        if (!silent) {
          setLoading(false);
        }
        return;
      }

      const resUser = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          ...authHeaders,
        },
      });

      if (!resUser.ok) {
        setNeedsLogin(true);
        if (!silent) {
          setLoading(false);
        }
        return;
      }

      const userData = await resUser.json();
      setUser(userData);

      const [resWater, resWeight] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/water`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
            ...authHeaders,
          },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/weight`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
            ...authHeaders,
          },
        }),
      ]);

      if (resWater.ok) {
        const waterData = await resWater.json();
        setWaterLogs(waterData);
      } else {
        setWaterLogs([]);
      }

      if (resWeight.ok) {
        const weightData = await resWeight.json();
        setWeightLogs(weightData);
      } else {
        setWeightLogs([]);
      }
    } catch (err) {
      console.error(err);
      setError("Could not load dashboard data.");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!error) return;
    const timeoutId = setTimeout(() => setError(""), 2000);
    return () => clearTimeout(timeoutId);
  }, [error]);

  const handleAddWater = async (event) => {
    event?.preventDefault();
    event?.stopPropagation();
    if (!newWaterAmount) return setError("Enter a water amount");

    try {
      const authHeaders = getAuthHeaders();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/water`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        cache: "no-store",
        body: JSON.stringify({ amount: Number(newWaterAmount) }),
      });

      const { text, json } = await readResponse(res);
      const data = json || {};
      if (!res.ok) {
        setError(data.error || text || "Failed to add water");
        return;
      }

      setNewWaterAmount("");
      setError("");
      fetchData({ silent: true });
    } catch (err) {
      console.error(err);
      setError("Network error");
    }
  };

  const handleAddWeight = async (event) => {
    event?.preventDefault();
    event?.stopPropagation();
    if (!newWeightAmount) return setError("Enter a weight amount");

    try {
      const authHeaders = getAuthHeaders();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/weight`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        cache: "no-store",
        body: JSON.stringify({ amount: Number(newWeightAmount) }),
      });

      const { text, json } = await readResponse(res);
      const data = json || {};
      if (!res.ok) {
        setError(data.error || text || "Failed to add weight");
        return;
      }

      setNewWeightAmount("");
      setError("");
      fetchData({ silent: true });
    } catch (err) {
      console.error(err);
      setError("Network error");
    }
  };

  const openEditModal = (type, log) => {
    setModalType(type);
    setSelectedLog(log);
    setEditAmount(String(log.amount ?? ""));
    setIsModalOpen(true);
  };

  const sortLogs = (logs, sort) => {
    const copy = [...logs];
    if (sort === "oldest") {
      copy.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      return copy;
    }
    if (sort === "newest") {
      copy.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return copy;
    }
    if (sort === "highest") {
      copy.sort((a, b) => Number(b.amount) - Number(a.amount));
      return copy;
    }
    if (sort === "lowest") {
      copy.sort((a, b) => Number(a.amount) - Number(b.amount));
      return copy;
    }
    return copy;
  };

  const paginateLogs = (logs, page, pageSize) => {
    const start = (page - 1) * pageSize;
    return logs.slice(start, start + pageSize);
  };

  const sortedWaterLogs = sortLogs(waterLogs, waterSort);
  const sortedWeightLogs = sortLogs(weightLogs, weightSort);
  const pagedWaterLogs = paginateLogs(sortedWaterLogs, waterPage, pageSize);
  const pagedWeightLogs = paginateLogs(sortedWeightLogs, weightPage, pageSize);
  const waterTotalPages = Math.max(
    1,
    Math.ceil(sortedWaterLogs.length / pageSize)
  );
  const weightTotalPages = Math.max(
    1,
    Math.ceil(sortedWeightLogs.length / pageSize)
  );

  const closeEditModal = () => {
    setIsModalOpen(false);
    setSelectedLog(null);
    setModalType(null);
    setEditAmount("");
    setIsSaving(false);
  };

  const handleSaveEdit = async () => {
    if (!selectedLog || !modalType) return;
    if (!editAmount) return setError("Enter a valid amount");

    const authHeaders = getAuthHeaders();
    if (!authHeaders.Authorization) {
      setNeedsLogin(true);
      return;
    }

    const endpoint =
      modalType === "water"
        ? `${process.env.NEXT_PUBLIC_API_URL}/water/${selectedLog.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/weight/${selectedLog.id}`;

    try {
      setIsSaving(true);
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        cache: "no-store",
        body: JSON.stringify({ amount: Number(editAmount) }),
      });

      const { text, json } = await readResponse(res);
      const data = json || {};

      if (!res.ok) {
        setError(data.error || text || "Failed to update log");
        setIsSaving(false);
        return;
      }

      const updated = data.data;
      if (modalType === "water") {
        setWaterLogs((prev) =>
          prev.map((log) => (log.id === updated.id ? updated : log))
        );
      } else {
        setWeightLogs((prev) =>
          prev.map((log) => (log.id === updated.id ? updated : log))
        );
      }

      closeEditModal();
    } catch (err) {
      console.error(err);
      setError("Network error");
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    setUser(null);
    setWaterLogs([]);
    setWeightLogs([]);
    setNewWaterAmount("");
    setNewWeightAmount("");
    setError("");

    try {
      const authHeaders = getAuthHeaders();
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: "POST",
        headers: {
          ...authHeaders,
        },
        cache: "no-store",
      });
    } catch (err) {
      console.error("Logout error:", err);
    }

    if (typeof window !== "undefined") {
      localStorage.removeItem("flexon_token");
    }

    router.push("/");
  };

  if (loading) return <p className={styles.loading}>Loading...</p>;
  if (needsLogin) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <p className={styles.error}>Session missing. Please log in again.</p>
          <button className={styles.primaryButton} onClick={() => router.push("/")}>
            Go to Login
          </button>
        </main>
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>fLexon Dashboard</p>
            <h1>Welcome back, {user.email}</h1>
          </div>
          <div className={styles.headerActions}>
            <Link className={styles.ghostButton} href="/pages/stats">
              Global Stats
            </Link>
            <button className={styles.logoutButton} onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        {error && <p className={styles.error}>{error}</p>}

        <section className={styles.cards}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Water</h2>
            </div>
            <p className={styles.cardCopy}>
              Add new water logs or review recent entries.
            </p>
            <div className={styles.actionRow}>
              <input
                className={styles.input}
                type="number"
                placeholder="Amount in ml"
                value={newWaterAmount}
                onChange={(event) => setNewWaterAmount(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleAddWater(event);
                  }
                }}
              />
              <button
                className={styles.primaryButton}
                type="button"
                onClick={handleAddWater}
              >
                Add Water
              </button>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Weight</h2>
            </div>
            <p className={styles.cardCopy}>
              Log weight updates and keep progress moving.
            </p>
            <div className={styles.actionRow}>
              <input
                className={styles.input}
                type="number"
                placeholder="Weight amount"
                value={newWeightAmount}
                onChange={(event) => setNewWeightAmount(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleAddWeight(event);
                  }
                }}
              />
              <button
                className={styles.primaryButton}
                type="button"
                onClick={handleAddWeight}
              >
                Add Weight
              </button>
            </div>
          </div>
        </section>

        <section className={styles.logs}>
          <div className={styles.logCard}>
            <h3>Recent Water Logs</h3>
            <div className={styles.logControls}>
              <label className={styles.control}>
                Sort
                <select
                  className={styles.select}
                  value={waterSort}
                  onChange={(event) => {
                    setWaterSort(event.target.value);
                    setWaterPage(1);
                  }}
                >
                  <option value="oldest">Oldest → Newest</option>
                  <option value="newest">Newest → Oldest</option>
                  <option value="highest">Highest → Lowest</option>
                  <option value="lowest">Lowest → Highest</option>
                </select>
              </label>
              <label className={styles.control}>
                Show
                <select
                  className={styles.select}
                  value={pageSize}
                  onChange={(event) => {
                    const nextSize = Number(event.target.value);
                    setPageSize(nextSize);
                    setWaterPage(1);
                    setWeightPage(1);
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </label>
            </div>
            {sortedWaterLogs.length === 0 ? (
              <p className={styles.muted}>No water logs yet.</p>
            ) : (
              <ul className={styles.logList}>
                {pagedWaterLogs.map((log) => (
                  <li key={log.id || log.created_at} className={styles.logItem}>
                    <button
                      type="button"
                      className={styles.logButton}
                      onClick={() => openEditModal("water", log)}
                    >
                      <span className={styles.logAmount}>{log.amount} ml</span>
                      <span className={styles.logDate}>
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {sortedWaterLogs.length > 0 && (
              <div className={styles.pagination}>
                <button
                  className={styles.ghostButton}
                  type="button"
                  onClick={() =>
                    setWaterPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={waterPage <= 1}
                >
                  Prev
                </button>
                <span className={styles.pageInfo}>
                  Page {waterPage} of {waterTotalPages}
                </span>
                <button
                  className={styles.ghostButton}
                  type="button"
                  onClick={() =>
                    setWaterPage((prev) => Math.min(waterTotalPages, prev + 1))
                  }
                  disabled={waterPage >= waterTotalPages}
                >
                  Next
                </button>
              </div>
            )}
          </div>

          <div className={styles.logCard}>
            <h3>Recent Weight Logs</h3>
            <div className={styles.logControls}>
              <label className={styles.control}>
                Sort
                <select
                  className={styles.select}
                  value={weightSort}
                  onChange={(event) => {
                    setWeightSort(event.target.value);
                    setWeightPage(1);
                  }}
                >
                  <option value="oldest">Oldest → Newest</option>
                  <option value="newest">Newest → Oldest</option>
                  <option value="highest">Highest → Lowest</option>
                  <option value="lowest">Lowest → Highest</option>
                </select>
              </label>
              <label className={styles.control}>
                Show
                <select
                  className={styles.select}
                  value={pageSize}
                  onChange={(event) => {
                    const nextSize = Number(event.target.value);
                    setPageSize(nextSize);
                    setWeightPage(1);
                    setWaterPage(1);
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </label>
            </div>
            {sortedWeightLogs.length === 0 ? (
              <p className={styles.muted}>No weight logs yet.</p>
            ) : (
              <ul className={styles.logList}>
                {pagedWeightLogs.map((log) => (
                  <li key={log.id || log.created_at} className={styles.logItem}>
                    <button
                      type="button"
                      className={styles.logButton}
                      onClick={() => openEditModal("weight", log)}
                    >
                      <span className={styles.logAmount}>{log.amount} lbs</span>
                      <span className={styles.logDate}>
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {sortedWeightLogs.length > 0 && (
              <div className={styles.pagination}>
                <button
                  className={styles.ghostButton}
                  type="button"
                  onClick={() =>
                    setWeightPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={weightPage <= 1}
                >
                  Prev
                </button>
                <span className={styles.pageInfo}>
                  Page {weightPage} of {weightTotalPages}
                </span>
                <button
                  className={styles.ghostButton}
                  type="button"
                  onClick={() =>
                    setWeightPage((prev) => Math.min(weightTotalPages, prev + 1))
                  }
                  disabled={weightPage >= weightTotalPages}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </section>

        {isModalOpen && selectedLog && (
          <div className={styles.modalOverlay} onClick={closeEditModal}>
            <div
              className={styles.modal}
              role="dialog"
              aria-modal="true"
              onClick={(event) => event.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h3>
                  Edit {modalType === "water" ? "Water" : "Weight"} Entry
                </h3>
                <button
                  className={styles.modalClose}
                  type="button"
                  onClick={closeEditModal}
                >
                  Close
                </button>
              </div>
              <p className={styles.modalMeta}>
                Logged {new Date(selectedLog.created_at).toLocaleString()}
              </p>
              <label className={styles.modalLabel}>
                Amount
                <input
                  className={styles.input}
                  type="number"
                  value={editAmount}
                  onChange={(event) => setEditAmount(event.target.value)}
                />
              </label>
              <div className={styles.modalActions}>
                <button
                  className={styles.ghostButton}
                  type="button"
                  onClick={closeEditModal}
                >
                  Cancel
                </button>
                <button
                  className={styles.primaryButton}
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
