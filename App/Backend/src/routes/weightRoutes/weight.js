const router = require("express").Router();
const authMiddleware = require("../../middleware/authMiddleware");
const { addWeight, getWeight, updateWeight, deleteWeight } = require("../../controllers/weightController");

router.get("/", authMiddleware, getWeight)
router.post("/", authMiddleware, addWeight);
router.put("/:id", authMiddleware, updateWeight);
router.delete("/:id", authMiddleware, deleteWeight);

module.exports = router;
