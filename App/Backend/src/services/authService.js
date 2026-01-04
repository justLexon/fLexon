// encryption
const bcrypt = require("bcrypt");
// authorization
const jwt = require("jsonwebtoken");
// database
const sql = require("../db/database");


exports.register = async (email, password) => {
    if (!email || !password) {
        throw new Error("Email and password required");
    }
    
    if (password.length < 6) {
        throw new Error("Password must be at least 6 characters");
    }

    try {
            const passwordHash = await bcrypt.hash(password, 10);

            const result = await sql`
            INSERT INTO users (email, password_hash) 
            VALUES (${email}, ${passwordHash}) 
            RETURNING id, email, created_at
        `;

        return result[0];
    } catch (err) {
        if (err.code === "23505") {
            throw err;
        }
        throw err;
    }

    if (existing.length > 0) {
       throw new Error("User already exists");
    }

    // const passwordHash = await bcrypt.hash(password, 10);

    // const result = await sql`
    //     INSERT INTO users (email, password_hash) 
    //     VALUES (${email}, ${passwordHash}) 
    //     RETURNING id, email, created_at
    // `;

    // return result[0];
};


exports.login = async (email, password) => {
    if(!email || !password) {
        throw new Error("Email and password required");
    }
    const result = await sql`
        SELECT id, email, password_hash 
        FROM users 
        WHERE email = ${email}
    `;

    if (result.length === 0) {
        throw new Error("Invalid credentials");
    }

    const user = result[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
        throw new Error("Invalid credentials");
    }

    const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    return { token, user: { id: user.id, email: user.email }};
};

exports.getUserById = async (id) => {
    const user = await sql`
        SELECT id, email
        FROM users
        WHERE id = ${id}
    `;

    return user[0];
}