const weightService = require("../services/weightService");

exports.addWeight = async (req, res) => {
    const { amount } = req.body;
    const userId = req.userId;

    const entry = await weightService.addWeight(userId, amount);

    res.status(201).json({ success: true, data: entry });
}