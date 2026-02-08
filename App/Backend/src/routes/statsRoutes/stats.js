const router = require("express").Router();
const authMiddleware = require("../../middleware/authMiddleware");
const statsController = require("../../controllers/statsController");

router.get("/global", authMiddleware, statsController.getGlobalStats);

module.exports = router;
