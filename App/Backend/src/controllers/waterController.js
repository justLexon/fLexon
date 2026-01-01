const waterService = require("../services/waterService.js");

exports.addWater = async (req, res) => {
    const { amount } = req.body;
    const userId = req.userId;

    const entry = await waterService.addWater(userId, amount);

    res.status(201).json({ success: true, data: entry });
};