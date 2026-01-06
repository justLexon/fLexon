"use client";

import { useState } from "react";
import { apiFetch } from "../lib/api";

export default function RegisterPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);

    async function handleRegister(e) {
        e.preventDefault();
        setError(null);

        try {
            await apiFetch("/atuh/register", {
                method: "POST",
                body: JSON.stringify({ email, password }),
            });

            alert("Registerd!! NOW LOG IN!!");
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <div>
            <h1>Registerd</h1>

            <form onSubmit={handleRegister}>
                <input
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    type="passwored"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button type="submit">Registerd</button>
            </form>

            {error && <p style={{ color: "red" }}> {error}</p>}
        </div>
    )
}