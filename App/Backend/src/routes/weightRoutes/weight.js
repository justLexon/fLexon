const router = require("express").Router();
const authMiddleware = require("../../middleware/authMiddleware");
const { addWeight, getWeight, updateWeight } = require("../../controllers/weightController");
const { getWeightWithUser } = require("../../controllers/weightController.js");

router.get("/", authMiddleware, getWeight)
router.post("/", authMiddleware, addWeight);
router.put("/:id", authMiddleware, updateWeight);

module.exports = router;
