import pool from "../../config/db.js"

// Mark a card as "got it" (mastered) or "not yet" (learning)
export async function markProgress(req, res) {
    try {
        const { question_id, got_it } = req.body;
        if (!question_id) {
            return res.status(400).json({ message: "question_id is required" });
        }

        const status = got_it ? "mastered" : "learning";

        const result = await pool.query(
            `INSERT INTO user_progress (question_id, status, review_count, last_reviewed)
             VALUES ($1, $2, 1, NOW())
             ON CONFLICT (question_id) DO UPDATE
             SET status = $2,
                 review_count = user_progress.review_count + 1,
                 last_reviewed = NOW()
             RETURNING *`,
            [question_id, status]
        );
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.log("Error marking progress", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// Get progress summary for all questions in a topic
export async function getTopicProgress(req, res) {
    try {
        const { topicId } = req.params;
        const result = await pool.query(
            `SELECT
                COUNT(q.id)                                                    AS total,
                COUNT(p.id) FILTER (WHERE p.status = 'mastered')              AS mastered,
                COUNT(p.id) FILTER (WHERE p.status = 'learning')              AS learning,
                COUNT(q.id) FILTER (WHERE p.id IS NULL)                       AS not_started
             FROM questions q
             LEFT JOIN user_progress p ON p.question_id = q.id
             WHERE q.topic_id = $1`,
            [topicId]
        );
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.log("Error fetching progress", error);
        res.status(500).json({ message: "Internal server error" });
    }
}
