const router = require("express").Router();
const authMiddleware = require("../../middleware/authMiddleware");
const authController = require("../../controllers/authController");

// Public Routes
router.post("/register", authController.register);
router.post("/login", authController.login);

// Protected Routes
router.get("/me", authMiddleware, authController.me);
router.post("/logout", authMiddleware, authController.logout);

module.exports = router;