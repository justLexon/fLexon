const router = require("express").Router();
const authMiddleware = require("../../middleware/authMiddleware");
const { addWeight, getWeight } = require("../../controllers/weightController");
const { getWeightWithUser } = require("../../controllers/weightController.js");

router.get("/", authMiddleware, getWeight)
router.post("/", authMiddleware, addWeight);

module.exports = router;