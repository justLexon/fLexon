const sql = require("../db/database");

exports.addWater = async (userId, amount) => {
    const result = await sql`
        INSERT INTO water_logs (amount, user_id)
        VALUES (${amount}, ${userId})
        RETURNING *
        `;

        return result[0];
};


// GET water with User email
exports.getWaterWithUser = async (userId) => {
    const result = await sql`
        SELECT
            wl.id,
            wl.amount,
            wl.created_at,
            u.id AS user_id,
            u.email
        FROM water_logs wl
        JOIN users u ON u.id = wl.user_id
        WHERE wl.user_id = ${userId}
        ORDER BY wl.created_at DESC
        `;

    return result;
};