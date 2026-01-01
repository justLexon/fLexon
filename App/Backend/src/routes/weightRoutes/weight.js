const router = require("express").Router();
const authMiddleware = require("../../middleware/authMiddleware");
const { addWeight } = require("../../controllers/weightController");

router.post("/", authMiddleware, addWeight);

module.exports = router;