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

exports.updateWeight = async (req, res) => {
    const { amount } = req.body;
    const { id } = req.params;

    if (amount === undefined || amount === null) {
        return res.status(400).json({ error: "Amount required" });
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
