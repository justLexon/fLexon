const router = require("express").Router();
const authMiddleware = require("../../middleware/authMiddleware.js");
const { addWater } = require("../../controllers/waterController.js");
const { getWaterWithUser } = require("../../services/waterService.js");

router.get("/", authMiddleware, getWaterWithUser)
router.post("/", authMiddleware, addWater);

module.exports = router;