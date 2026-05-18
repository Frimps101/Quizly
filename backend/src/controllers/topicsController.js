import pool from "../../config/db.js"

export async function getTopics(req, res) {
    try {
        const { subjectId } = req.params;
        const result = await pool.query(
            `SELECT * FROM topics WHERE subject_id = $1 ORDER BY name ASC`,
            [subjectId]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.log("Error occured while retrieving topics for subject", error);
        res.status(500).json({ message: "Internal server error", status: 500 });
    }
}

export async function createTopic(req, res) {
    try {
        const { subject_id, name, description } = req.body;

        if (!subject_id || !name?.trim()) {
            return res.status(400).json({ message: "subject_id and name are required" });
        }

        const result = await pool.query(
            `INSERT INTO topics (subject_id, name, description)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [subject_id, name.trim(), description ?? null]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.log("Error occured while creating topic", error);
        res.status(500).json({ message: "Internal server error", status: 500 });
    }
}