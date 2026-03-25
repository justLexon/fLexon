const waterService = require("../services/waterService.js");

const validateWaterAmount = (amount) => {
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount)) {
        return "Water amount must be a valid number";
    }

    if (numericAmount <= 0) {
        return "Water amount must be greater than 0 ml";
    }

    if (numericAmount < 50 || numericAmount > 5000) {
        return "Water amount must be between 50 ml and 5000 ml";
    }

    return null;
};

exports.addWater = async (req, res) => {
    const { amount } = req.body;
    const userId = req.userId;
    const validationError = validateWaterAmount(amount);

    if (validationError) {
        return res.status(400).json({ error: validationError });
    }

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

    const validationError = validateWaterAmount(amount);

    if (validationError) {
        return res.status(400).json({ error: validationError });
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

exports.deleteWater = async (req, res) => {
    const { id } = req.params;

    try {
        const deleted = await waterService.deleteWater(req.userId, id);

        if (!deleted) {
            return res.status(404).json({ error: "Water log not found" });
        }

        res.json({ success: true, data: deleted });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete water log" });
    }
};
