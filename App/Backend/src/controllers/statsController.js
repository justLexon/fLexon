const statsService = require("../services/statsService");

exports.getGlobalStats = async (req, res) => {
  try {
    const stats = await statsService.getGlobalStats();
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch global stats" });
  }
};
