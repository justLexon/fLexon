const weightService = require("../services/weightService");

const validateWeightAmount = (amount) => {
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount)) {
        return "Weight amount must be a valid number";
    }

    if (numericAmount <= 0) {
        return "Weight amount must be greater than 0";
    }

    if (numericAmount < 50 || numericAmount > 700) {
        return "Weight amount must be between 50 and 700 lbs";
    }

    return null;
};

exports.addWeight = async (req, res) => {
    const { amount } = req.body;
    const userId = req.userId;
    const validationError = validateWeightAmount(amount);

    if (validationError) {
        return res.status(400).json({ error: validationError });
    }

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

exports.updateWeight = async (req, res) => {
    const { amount } = req.body;
    const { id } = req.params;

    if (amount === undefined || amount === null) {
        return res.status(400).json({ error: "Amount required" });
    }

    const validationError = validateWeightAmount(amount);

    if (validationError) {
        return res.status(400).json({ error: validationError });
    }

    try {
        const updated = await weightService.updateWeight(req.userId, id, amount);
        if (!updated) {
            return res.status(404).json({ error: "Weight log not found" });
        }
        res.json({ success: true, data: updated });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update weight log" });
    }
};

exports.deleteWeight = async (req, res) => {
    const { id } = req.params;

    try {
        const deleted = await weightService.deleteWeight(req.userId, id);

        if (!deleted) {
            return res.status(404).json({ error: "Weight log not found" });
        }

        res.json({ success: true, data: deleted });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete weight log" });
    }
};
