import pool from "../../config/db.js"

export async function getSubjects(req, res) {
    try {
        const result = await pool.query(
            `SELECT id, name, icon, icon_color AS "iconColor", description, created_at FROM subjects`
        )
        res.status(200).json(result.rows)
    } catch (error) {
        console.log("Error occured while retrieving subjects", error);
        res.status(500).json({ message: "Internal server error", status: 500 })
    }
}

export async function createSubject(req, res) {
    try {
        const { name, icon, iconColor, description } = req.body

        if (!name?.trim()) {
            return res.status(400).json({ message: "Subject name is required" })
        }

        const result = await pool.query(
            `INSERT INTO subjects (name, icon, icon_color, description)
             VALUES ($1, $2, $3, $4)
             RETURNING id, name, icon, icon_color AS "iconColor", description, created_at`,
            [name.trim(), icon ?? null, iconColor ?? null, description ?? null]
        )

        res.status(201).json(result.rows[0])
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({ message: "A subject with that name already exists" })
        }
        console.log("Error occured while creating subject", error);
        res.status(500).json({ message: "Internal server error", status: 500 })
    }
}