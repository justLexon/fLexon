const router = require("express").Router();
const authMiddleware = require("../../middleware/authMiddleware.js");
const { addWater } = require("../../controllers/waterController.js");
const { getWater } = require("../../controllers/waterController.js");

router.get("/", authMiddleware, getWater)
router.post("/", authMiddleware, addWater);

module.exports = router;