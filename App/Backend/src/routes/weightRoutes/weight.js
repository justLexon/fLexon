const router = require("express").Router();
const authMiddleware = require("../../middleware/authMiddleware");
const { addWeight } = require("../../controllers/weightController");
const { getWeightWithUser } = require("../../services/weightService.js");

router.get("/", authMiddleware, getWeightWithUser)
router.post("/", authMiddleware, addWeight);

module.exports = router;