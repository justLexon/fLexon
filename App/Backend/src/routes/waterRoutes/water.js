const router = require("express").Router();
const authMiddleware = require("../../middleware/authMiddleware.js");
const { addWater, getWater, updateWater, deleteWater } = require("../../controllers/waterController.js");

router.get("/", authMiddleware, getWater)
router.post("/", authMiddleware, addWater);
router.put("/:id", authMiddleware, updateWater);
router.delete("/:id", authMiddleware, deleteWater);

module.exports = router;
