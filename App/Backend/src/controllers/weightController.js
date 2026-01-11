const weightService = require("../services/weightService");

exports.addWeight = async (req, res) => {
    const { amount } = req.body;
    const userId = req.userId;

    const entry = await weightService.addWeight(userId, amount);

    res.status(201).json({ success: true, data: entry });
}

exports.getWeight = async (req, res) => {
    try {
        const weightLogs = await weightService.getWeightWithUser(req.userId);
        res.json(weightLogs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch weight logs" });
    }
};