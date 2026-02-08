const sql = require("../db/database");

const toNumber = (value) => {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
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

  return {
    water_daily_avg: toNumber(waterDaily?.avg),
    weight_daily_avg: toNumber(weightDaily?.avg),
    water_all_time_avg: toNumber(waterAll?.avg),
    weight_all_time_avg: toNumber(weightAll?.avg),
  };
};
