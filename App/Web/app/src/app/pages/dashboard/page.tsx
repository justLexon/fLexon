"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

const MOLECULE_BASE_SIZE = 180;
const MAX_SPEED = 0.18;
const MOLECULE_PAD_TOP = -50;
const MOLECULE_PAD_RIGHT = 70;
const MOLECULE_PAD_BOTTOM = 50;
const MOLECULE_PAD_LEFT = -50;
const REPULSION_DISTANCE = 100;
const REPULSION_FORCE = 3;
const MIN_MOLECULE_SCALE = 0.22;
const MAX_MOLECULE_SCALE = 0.62;
const MAX_SCALE_ML = 2000;
const WATER_MIN_ML = 50;
const WATER_MAX_ML = 5000;
const WEIGHT_MIN_LBS = 50;
const WEIGHT_MAX_LBS = 700;

const getFieldBounds = () => {
  if (typeof document === "undefined") {
    return { width: 0, height: 0 };
  }

  const doc = document.documentElement;
  const body = document.body;

  return {
    width: window.innerWidth,
    height: Math.max(
      window.innerHeight,
      doc?.scrollHeight || 0,
      body?.scrollHeight || 0
    ),
  };
};

const getScaleFromAmount = (amount) => {
  const numericAmount = Math.max(0, Number(amount) || 0);
  const normalized = Math.min(1, numericAmount / MAX_SCALE_ML);
  return (
    MIN_MOLECULE_SCALE +
    Math.sqrt(normalized) * (MAX_MOLECULE_SCALE - MIN_MOLECULE_SCALE)
  );
};

const createMolecule = (id, width, height, amount) => {
  const scale = getScaleFromAmount(amount);
  const renderedSize = MOLECULE_BASE_SIZE * scale;
  const safeWidth = Math.max(
    renderedSize + MOLECULE_PAD_LEFT + MOLECULE_PAD_RIGHT,
    width || 0
  );
  const safeHeight = Math.max(
    renderedSize + MOLECULE_PAD_TOP + MOLECULE_PAD_BOTTOM,
    height || 0
  );

  return {
    id,
    x:
      MOLECULE_PAD_LEFT +
      Math.random() *
        Math.max(1, safeWidth - renderedSize - MOLECULE_PAD_LEFT - MOLECULE_PAD_RIGHT),
    y:
      MOLECULE_PAD_TOP +
      Math.random() *
        Math.max(1, safeHeight - renderedSize - MOLECULE_PAD_TOP - MOLECULE_PAD_BOTTOM),
    vx: (Math.random() - 0.5) * MAX_SPEED * 2,
    vy: (Math.random() - 0.5) * MAX_SPEED * 2,
    scale,
    rotation: -18 + Math.random() * 36,
  };
};

const validateWaterAmount = (amount) => {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) {
    return "Water amount must be a valid number";
  }

  if (numericAmount < WATER_MIN_ML || numericAmount > WATER_MAX_ML) {
    return `Water amount must be between ${WATER_MIN_ML} ml and ${WATER_MAX_ML} ml`;
  }

  return null;
};

const validateWeightAmount = (amount) => {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) {
    return "Weight amount must be a valid number";
  }

  if (numericAmount < WEIGHT_MIN_LBS || numericAmount > WEIGHT_MAX_LBS) {
    return `Weight amount must be between ${WEIGHT_MIN_LBS} and ${WEIGHT_MAX_LBS} lbs`;
  }

  return null;
};

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [waterLogs, setWaterLogs] = useState([]);
  const [weightLogs, setWeightLogs] = useState([]);
  const [newWaterAmount, setNewWaterAmount] = useState("");
  const [newWeightAmount, setNewWeightAmount] = useState("");
  const [error, setError] = useState("");
  const [pageError, setPageError] = useState("");
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
  const [waterStartDate, setWaterStartDate] = useState("");
  const [waterEndDate, setWaterEndDate] = useState("");
  const [weightStartDate, setWeightStartDate] = useState("");
  const [weightEndDate, setWeightEndDate] = useState("");
  const [molecules, setMolecules] = useState([]);
  const loadingTimeoutRef = useRef(null);
  const requestIdRef = useRef(0);
  const controllerRef = useRef(null);
  const moleculesRef = useRef([]);

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

  const fetchWithTimeout = async (url, options) => {
    return await fetch(url, options);
  };

  const fetchData = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }
    setError("");
    setPageError("");
    setNeedsLogin(false);
    if (!silent) {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      loadingTimeoutRef.current = setTimeout(() => {
        setLoading(false);
        setPageError("Dashboard took too long to load. Try again.");
      }, 12000);
    }

    try {
      const requestId = ++requestIdRef.current;
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
      const controller = new AbortController();
      controllerRef.current = controller;

      const resDash = await fetchWithTimeout("/api/dashboard", {
        cache: "no-store",
        signal: controller.signal,
      });

      if (!resDash) {
        return;
      }

      if (requestId !== requestIdRef.current) {
        return;
      }

      if (resDash.status === 401) {
        setNeedsLogin(true);
        if (!silent) {
          setLoading(false);
        }
        return;
      }

      const dashData = await resDash.json();
      if (requestId === requestIdRef.current) {
        setUser(dashData.user);
        setWaterLogs(dashData.waterLogs || []);
        setWeightLogs(dashData.weightLogs || []);
        if (dashData.waterError) {
          setError(dashData.waterError);
        }
        if (dashData.weightError) {
          setError(dashData.weightError);
        }
      }
    } catch (err) {
      if (err?.name === "AbortError") {
        return;
      }
      console.error(err);
      setPageError("Could not load dashboard data.");
    } finally {
      if (!silent) {
        setLoading(false);
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
      }
    }
  };

  useEffect(() => {
    fetchData();
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!error) return;
    const timeoutId = setTimeout(() => setError(""), 2000);
    return () => clearTimeout(timeoutId);
  }, [error]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const { width, height } = getFieldBounds();
    const existingById = new Map(
      moleculesRef.current.map((molecule) => [String(molecule.id), molecule])
    );

    const next = waterLogs.map((log) => {
      const key = String(log.id ?? `${log.created_at}-${log.amount}`);
      const existing = existingById.get(key);
      const scale = getScaleFromAmount(log.amount);

      if (existing) {
        return {
          ...existing,
          id: key,
          scale,
        };
      }

      return createMolecule(key, width, height, log.amount);
    });

    moleculesRef.current = next;
    setMolecules(next);
  }, [waterLogs]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let animationFrameId = 0;
    let lastTime = performance.now();

    const keepInBounds = (molecule, width, height) => {
      const renderedSize = MOLECULE_BASE_SIZE * molecule.scale;
      const maxX = Math.max(
        MOLECULE_PAD_LEFT,
        width - renderedSize - MOLECULE_PAD_RIGHT
      );
      const maxY = Math.max(
        MOLECULE_PAD_TOP,
        height - renderedSize - MOLECULE_PAD_BOTTOM
      );

      if (molecule.x <= MOLECULE_PAD_LEFT) {
        molecule.x = MOLECULE_PAD_LEFT;
        molecule.vx = Math.abs(molecule.vx) || MAX_SPEED * 0.5;
      } else if (molecule.x >= maxX) {
        molecule.x = maxX;
        molecule.vx = -Math.abs(molecule.vx) || -MAX_SPEED * 0.5;
      }

      if (molecule.y <= MOLECULE_PAD_TOP) {
        molecule.y = MOLECULE_PAD_TOP;
        molecule.vy = Math.abs(molecule.vy) || MAX_SPEED * 0.5;
      } else if (molecule.y >= maxY) {
        molecule.y = maxY;
        molecule.vy = -Math.abs(molecule.vy) || -MAX_SPEED * 0.5;
      }
    };

    const tick = (now) => {
      const delta = Math.min(32, now - lastTime);
      lastTime = now;
      const { width, height } = getFieldBounds();
      const next = moleculesRef.current.map((molecule) => ({ ...molecule }));

      for (let i = 0; i < next.length; i += 1) {
        for (let j = i + 1; j < next.length; j += 1) {
          const current = next[i];
          const other = next[j];
          const currentCenterX = current.x + (MOLECULE_BASE_SIZE * current.scale) / 2;
          const currentCenterY = current.y + (MOLECULE_BASE_SIZE * current.scale) / 2;
          const otherCenterX = other.x + (MOLECULE_BASE_SIZE * other.scale) / 2;
          const otherCenterY = other.y + (MOLECULE_BASE_SIZE * other.scale) / 2;
          const dx = otherCenterX - currentCenterX;
          const dy = otherCenterY - currentCenterY;
          const distance = Math.hypot(dx, dy) || 1;

          if (distance < REPULSION_DISTANCE) {
            const force = ((REPULSION_DISTANCE - distance) / REPULSION_DISTANCE) * REPULSION_FORCE;
            const offsetX = (dx / distance) * force * delta;
            const offsetY = (dy / distance) * force * delta;
            current.vx -= offsetX;
            current.vy -= offsetY;
            other.vx += offsetX;
            other.vy += offsetY;
          }
        }
      }

      for (const molecule of next) {
        molecule.vx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, molecule.vx + (Math.random() - 0.5) * 0.002));
        molecule.vy = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, molecule.vy + (Math.random() - 0.5) * 0.002));
        molecule.x += molecule.vx * delta;
        molecule.y += molecule.vy * delta;
        molecule.rotation += molecule.vx * 0.9;
        keepInBounds(molecule, width, height);
      }

      moleculesRef.current = next;
      setMolecules(next);
      animationFrameId = window.requestAnimationFrame(tick);
    };

    animationFrameId = window.requestAnimationFrame(tick);

    const handleResize = () => {
      const { width, height } = getFieldBounds();
      moleculesRef.current = moleculesRef.current.map((molecule, index) => {
        const next = moleculesRef.current[index] || createMolecule(index, width, height, 0);
        const renderedSize = MOLECULE_BASE_SIZE * next.scale;
        const maxX = Math.max(
          MOLECULE_PAD_LEFT,
          width - renderedSize - MOLECULE_PAD_RIGHT
        );
        const maxY = Math.max(
          MOLECULE_PAD_TOP,
          height - renderedSize - MOLECULE_PAD_BOTTOM
        );
        return {
          ...next,
          x: Math.min(Math.max(MOLECULE_PAD_LEFT, next.x), maxX),
          y: Math.min(Math.max(MOLECULE_PAD_TOP, next.y), maxY),
        };
      });
      setMolecules([...moleculesRef.current]);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleAddWater = async (event) => {
    event?.preventDefault();
    event?.stopPropagation();
    if (!newWaterAmount) return setError("Enter a water amount");
    const validationError = validateWaterAmount(newWaterAmount);
    if (validationError) return setError(validationError);

    try {
      const res = await fetch("/api/water", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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

  const handleDeleteLog = async () => {
    if (!selectedLog || !modalType) return;

    const endpoint =
      modalType === "water"
        ? `/api/water/${selectedLog.id}`
        : `/api/weight/${selectedLog.id}`;

    try {
      setIsSaving(true);

      const res = await fetch(endpoint, {
        method: "DELETE",
        cache: "no-store",
      });
      
      const { text, json } = await readResponse(res);
      const data = json || {};
      if (!res.ok) {
        setError(data.error || text || "Failed to delete log");
        setIsSaving(false);
        return;
      }

      if (modalType === "water") {
        setWaterLogs((prev) => prev.filter((log) => log.id !== selectedLog.id));
      } else {
        setWeightLogs((prev) => prev.filter((log) => log.id !== selectedLog.id));
      }

      closeEditModal();
    } catch (err) {
      console.error(err);
      setError("Network error");
      setIsSaving(false);
    }
  };

  const handleAddWeight = async (event) => {
    event?.preventDefault();
    event?.stopPropagation();
    if (!newWeightAmount) return setError("Enter a weight amount");
    const validationError = validateWeightAmount(newWeightAmount);
    if (validationError) return setError(validationError);

    try {
      const res = await fetch("/api/weight", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
      copy.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      return copy;
    }
    if (sort === "newest") {
      copy.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
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

  const filterLogsByDate = (logs, startDate, endDate) => {
    if (!startDate && !endDate) return logs;
    const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const end = endDate ? new Date(`${endDate}T23:59:59`) : null;

    return logs.filter((log) => {
      const created = new Date(log.created_at);
      if (start && created < start) return false;
      if (end && created > end) return false;
      return true;
    });
  };

  const paginateLogs = (logs, page, pageSize) => {
    const start = (page - 1) * pageSize;
    return logs.slice(start, start + pageSize);
  };

  const filteredWaterLogs = filterLogsByDate(waterLogs, waterStartDate, waterEndDate);
  const filteredWeightLogs = filterLogsByDate(weightLogs, weightStartDate, weightEndDate);
  const sortedWaterLogs = sortLogs(filteredWaterLogs, waterSort);
  const sortedWeightLogs = sortLogs(filteredWeightLogs, weightSort);
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

  const resetWaterFilters = () => {
    setWaterStartDate("");
    setWaterEndDate("");
    setWaterSort("newest");
    setPageSize(5);
    setWaterPage(1);
  };

  const resetWeightFilters = () => {
    setWeightStartDate("");
    setWeightEndDate("");
    setWeightSort("newest");
    setPageSize(5);
    setWeightPage(1);
  };

  const handleSaveEdit = async () => {
    if (!selectedLog || !modalType) return;
    if (!editAmount) return setError("Enter a valid amount");
    const validationError =
      modalType === "water"
        ? validateWaterAmount(editAmount)
        : validateWeightAmount(editAmount);

    if (validationError) return setError(validationError);

    const endpoint =
      modalType === "water"
        ? `/api/water/${selectedLog.id}`
        : `/api/weight/${selectedLog.id}`;

    try {
      setIsSaving(true);
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
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
      await fetch("/api/auth/logout", {
        method: "POST",
        cache: "no-store",
      });
    } catch (err) {
      console.error("Logout error:", err);
    }

    router.push("/");
  };

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
  if (!user && !loading) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <div className={styles.error}>{pageError && <span>{pageError}</span>}</div>
        </main>
      </div>
    );
  }

  if (loading && !user) {
    return (
      <div className={styles.page}>
        <div className={styles.moleculeLayer} aria-hidden="true">
          <span className={`${styles.molecule} ${styles.moleculeOne}`} />
          <span className={`${styles.molecule} ${styles.moleculeTwo}`} />
          <span className={`${styles.molecule} ${styles.moleculeThree}`} />
          <span className={`${styles.molecule} ${styles.moleculeFour}`} />
          <span className={`${styles.molecule} ${styles.moleculeFive}`} />
          <span className={`${styles.molecule} ${styles.moleculeSix}`} />
          <span className={`${styles.molecule} ${styles.moleculeSeven}`} />
          <span className={`${styles.molecule} ${styles.moleculeEight}`} />
        </div>
        <main className={styles.main}>
          <div className={styles.loadingWrap}>
            <div className={styles.loadingCard}>
              <span className={styles.loadingDot} />
              <span className={styles.loadingDot} />
              <span className={styles.loadingDot} />
              <p className={styles.loadingText}>Loading dashboard...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const userEmail = user?.email ?? "Loading…";

  return (
    <div className={styles.page}>
      <div className={styles.moleculeLayer} aria-hidden="true">
        {molecules.map((molecule) => (
          <div
            key={molecule.id}
            className={styles.waterMolecule}
            style={{
              transform: `translate3d(${molecule.x}px, ${molecule.y}px, 0) rotate(${molecule.rotation}deg) scale(${molecule.scale})`,
            }}
          >
            <span className={`${styles.atom} ${styles.atomHydrogen} ${styles.atomHydrogenLeft}`} />
            <span className={`${styles.bond} ${styles.bondLeft}`} />
            <span className={`${styles.atom} ${styles.atomOxygen}`} />
            <span className={`${styles.bond} ${styles.bondRight}`} />
            <span className={`${styles.atom} ${styles.atomHydrogen} ${styles.atomHydrogenRight}`} />
          </div>
        ))}
      </div>
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>fLexon Dashboard</p>
            <h1>Welcome back, {userEmail}</h1>
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

        {pageError ? (
          <div className={styles.error}>
            <span>{pageError}</span>
          </div>
        ) : (
          error && <p className={styles.error}>{error}</p>
        )}

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
            <h3>Water Logs</h3>
            <div className={styles.logControls}>
              <label className={styles.control}>
                From
                <input
                  className={styles.dateInput}
                  type="date"
                  value={waterStartDate}
                  onChange={(event) => {
                    setWaterStartDate(event.target.value);
                    setWaterPage(1);
                  }}
                />
              </label>
              <label className={styles.control}>
                To
                <input
                  className={styles.dateInput}
                  type="date"
                  value={waterEndDate}
                  onChange={(event) => {
                    setWaterEndDate(event.target.value);
                    setWaterPage(1);
                  }}
                />
              </label>
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
                  className={`${styles.select} ${styles.selectSmall}`}
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
              <button
                className={styles.ghostButton}
                type="button"
                onClick={resetWaterFilters}
              >
                Reset
              </button>
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
                      <span className={styles.logLead}>
                        <span className={styles.logIcon} aria-hidden="true">
                          W
                        </span>
                        <span className={styles.logContent}>
                          <span className={styles.logAmount}>{log.amount}</span>
                          <span className={styles.logMeta}>Water entry</span>
                        </span>
                      </span>
                      <span className={styles.logSide}>
                        <span className={styles.logBadge}>ml</span>
                        <span className={styles.logDate}>
                          {new Date(log.created_at).toLocaleString()}
                        </span>
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
            <h3>Weight Logs</h3>
            <div className={styles.logControls}>
              <label className={styles.control}>
                From
                <input
                  className={styles.dateInput}
                  type="date"
                  value={weightStartDate}
                  onChange={(event) => {
                    setWeightStartDate(event.target.value);
                    setWeightPage(1);
                  }}
                />
              </label>
              <label className={styles.control}>
                To
                <input
                  className={styles.dateInput}
                  type="date"
                  value={weightEndDate}
                  onChange={(event) => {
                    setWeightEndDate(event.target.value);
                    setWeightPage(1);
                  }}
                />
              </label>
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
                  className={`${styles.select} ${styles.selectSmall}`}
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
              <button
                className={styles.ghostButton}
                type="button"
                onClick={resetWeightFilters}
              >
                Reset
              </button>
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
                      <span className={styles.logLead}>
                        <span className={styles.logIcon} aria-hidden="true">
                          G
                        </span>
                        <span className={styles.logContent}>
                          <span className={styles.logAmount}>{log.amount}</span>
                          <span className={styles.logMeta}>Weight entry</span>
                        </span>
                      </span>
                      <span className={styles.logSide}>
                        <span className={styles.logBadge}>lbs</span>
                        <span className={styles.logDate}>
                          {new Date(log.created_at).toLocaleString()}
                        </span>
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
                <button
                  className={styles.ghostButton}
                  type="button"
                  onClick={handleDeleteLog}
                  disabled={isSaving}
                >
                  {isSaving ? "Working..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
