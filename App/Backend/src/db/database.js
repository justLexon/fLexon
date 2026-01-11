const postgres = require("postgres");

// Allow mocking in tests
if (process.env.NODE_ENV === 'test' && global.mockSql) {
  module.exports = global.mockSql;
} else {
  const sql = postgres(process.env.DATABASE_URL, {
    ssl: "require",
    max: 1,
    idle_timeout: 20
  });
  
  module.exports = sql;
}