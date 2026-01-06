// postgres connection
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "flexon",
  password: "postgres",
  port: 5432,
});