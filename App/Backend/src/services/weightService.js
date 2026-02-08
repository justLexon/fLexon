const sql = require("../db/database.js");

exports.addWeight = async (userId, amount) => {
    const result = await sql`
        INSERT INTO weight_logs (amount, user_id)
        VALUES (${amount}, ${userId})
        RETURNING *
        `

        return result[0];
}

exports.getWeightWithUser = async (userId) => {
    const result = await sql`
        SELECT
            wl.id,
            wl.amount,
            wl.created_at,
            u.id AS user_id,
            u.email
        FROM weight_logs wl
        JOIN users u ON u.id = wl.user_id
        WHERE wl.user_id = ${userId}
        ORDER BY wl.created_at DESC
        `;

    return result;
};

exports.updateWeight = async (userId, id, amount) => {
    const result = await sql`
        UPDATE weight_logs
        SET amount = ${amount}
        WHERE id = ${id} AND user_id = ${userId}
        RETURNING *
    `;

    return result[0];
};
