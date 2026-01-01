const router = require("express").Router();
const authMiddleware = require("../../middleware/authMiddleware.js");
const { addWater } = require("../../controllers/waterController.js");

router.post("/", authMiddleware, addWater);

module.exports = router;