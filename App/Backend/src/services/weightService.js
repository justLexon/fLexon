const sql = require("../db/database.js");

exports.addWeight = async (userId, amount) => {
    const result = await sql`
        INSERT INTO weight_logs (amount, user_id)
        VALUES (${amount}, ${userId})
        RETURNING *
        `

        return result[0];
}