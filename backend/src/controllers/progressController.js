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

// Full progress summary: overall + per-subject + recent activity
export async function getProgressSummary(req, res) {
    try {
        const [overallRes, subjectsRes, recentRes] = await Promise.all([
            pool.query(`
                SELECT
                    COUNT(DISTINCT q.id)                                                        AS total_questions,
                    COUNT(DISTINCT p.question_id)                                               AS total_reviewed,
                    COUNT(DISTINCT p.question_id) FILTER (WHERE p.status = 'mastered')         AS total_mastered,
                    COUNT(DISTINCT s.id)                                                        AS total_subjects,
                    COUNT(DISTINCT t.id)                                                        AS total_topics
                FROM questions q
                LEFT JOIN user_progress p  ON p.question_id = q.id
                LEFT JOIN topics t         ON t.id = q.topic_id
                LEFT JOIN subjects s       ON s.id = t.subject_id
            `),
            pool.query(`
                SELECT
                    s.id,
                    s.name,
                    s.icon,
                    s.icon_color          AS "iconColor",
                    COUNT(DISTINCT q.id)  AS total_questions,
                    COUNT(DISTINCT p.question_id) FILTER (WHERE p.status = 'mastered')  AS mastered,
                    COUNT(DISTINCT p.question_id) FILTER (WHERE p.status = 'learning')  AS learning
                FROM subjects s
                LEFT JOIN topics t         ON t.subject_id = s.id
                LEFT JOIN questions q      ON q.topic_id   = t.id
                LEFT JOIN user_progress p  ON p.question_id = q.id
                GROUP BY s.id, s.name, s.icon, s.icon_color
                ORDER BY s.name
            `),
            pool.query(`
                SELECT
                    p.last_reviewed,
                    p.status,
                    p.review_count,
                    q.question_text,
                    t.name  AS topic_name,
                    s.name  AS subject_name,
                    s.icon,
                    s.icon_color AS "iconColor"
                FROM user_progress p
                JOIN questions q ON q.id = p.question_id
                JOIN topics t    ON t.id = q.topic_id
                JOIN subjects s  ON s.id = t.subject_id
                WHERE p.last_reviewed IS NOT NULL
                ORDER BY p.last_reviewed DESC
                LIMIT 8
            `),
        ]);

        res.status(200).json({
            overall: overallRes.rows[0],
            subjects: subjectsRes.rows,
            recentActivity: recentRes.rows,
        });
    } catch (error) {
        console.log("Error fetching progress summary", error);
        res.status(500).json({ message: "Internal server error" });
    }
}
