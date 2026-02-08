const waterService = require("../services/waterService.js");

exports.addWater = async (req, res) => {
    const { amount } = req.body;
    const userId = req.userId;

    const entry = await waterService.addWater(userId, amount);

    res.status(201).json({ success: true, data: entry });
};

exports.getWater = async (req, res) => {
    try {
        const waterLogs = await waterService.getWaterWithUser(req.userId);
        res.json(waterLogs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch water logs" });
    }
};

exports.updateWater = async (req, res) => {
    const { amount } = req.body;
    const { id } = req.params;

    if (amount === undefined || amount === null) {
        return res.status(400).json({ error: "Amount required" });
    }

    try {
        const updated = await waterService.updateWater(req.userId, id, amount);
        if (!updated) {
            return res.status(404).json({ error: "Water log not found" });
        }
        res.json({ success: true, data: updated });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update water log" });
    }
};
