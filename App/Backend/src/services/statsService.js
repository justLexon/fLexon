const sql = require("../db/database");

const toNumber = (value) => {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};

const roundNullable = (value) => {
  if (value === null || value === undefined) return null;
  return Math.round(value);
};

exports.getGlobalStats = async () => {
  const [waterDaily] = await sql`
    SELECT AVG(amount) AS avg
    FROM water_logs
    WHERE (created_at AT TIME ZONE 'UTC')::date = (now() AT TIME ZONE 'UTC')::date
  `;

  const [weightDaily] = await sql`
    SELECT AVG(amount) AS avg
    FROM weight_logs
    WHERE (created_at AT TIME ZONE 'UTC')::date = (now() AT TIME ZONE 'UTC')::date
  `;

  const [waterAll] = await sql`
    SELECT AVG(amount) AS avg
    FROM water_logs
  `;

  const [weightAll] = await sql`
    SELECT AVG(amount) AS avg
    FROM weight_logs
  `;

  const waterSeries = await sql`
    SELECT
      d::date AS date,
      AVG(w.amount) AS avg
    FROM generate_series(
      (now() AT TIME ZONE 'UTC')::date - interval '29 days',
      (now() AT TIME ZONE 'UTC')::date,
      interval '1 day'
    ) AS d
    LEFT JOIN water_logs w
      ON (w.created_at AT TIME ZONE 'UTC')::date = d::date
    GROUP BY d
    ORDER BY d ASC
  `;

  const weightSeries = await sql`
    SELECT
      d::date AS date,
      AVG(w.amount) AS avg
    FROM generate_series(
      (now() AT TIME ZONE 'UTC')::date - interval '29 days',
      (now() AT TIME ZONE 'UTC')::date,
      interval '1 day'
    ) AS d
    LEFT JOIN weight_logs w
      ON (w.created_at AT TIME ZONE 'UTC')::date = d::date
    GROUP BY d
    ORDER BY d ASC
  `;

  return {
    water_daily_avg: roundNullable(toNumber(waterDaily?.avg)),
    weight_daily_avg: roundNullable(toNumber(weightDaily?.avg)),
    water_all_time_avg: roundNullable(toNumber(waterAll?.avg)),
    weight_all_time_avg: roundNullable(toNumber(weightAll?.avg)),
    water_daily_series: waterSeries.map((row) => ({
      date: row.date,
      avg: roundNullable(toNumber(row.avg)),
    })),
    weight_daily_series: weightSeries.map((row) => ({
      date: row.date,
      avg: roundNullable(toNumber(row.avg)),
    })),
  };
};
