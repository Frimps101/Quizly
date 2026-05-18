import pool from "../../config/db.js"

export async function getQuestionsByTopic(req, res) {
    try {
        const { topicId } = req.params;
        const result = await pool.query(
            `SELECT q.*, 
                json_agg(
                    json_build_object(
                        'id', a.id,
                        'answer_text', a.answer_text,
                        'is_correct', a.is_correct,
                        'order_index', a.order_index
                    ) ORDER BY a.order_index
                ) FILTER (WHERE a.id IS NOT NULL) AS answers
             FROM questions q
             LEFT JOIN answers a ON a.question_id = q.id
             WHERE q.topic_id = $1
             GROUP BY q.id
             ORDER BY q.created_at ASC`,
            [topicId]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.log("Error fetching questions", error);
        res.status(500).json({ message: "Internal server error", status: 500 });
    }
}

export async function createQuestion(req, res) {
    const client = await pool.connect();
    try {
        const { topic_id, question_text, question_type, difficulty, explanation, answers } = req.body;

        if (!topic_id || !question_text?.trim() || !question_type) {
            return res.status(400).json({ message: "topic_id, question_text and question_type are required" });
        }

        await client.query("BEGIN");

        const qResult = await client.query(
            `INSERT INTO questions (topic_id, question_text, question_type, difficulty, explanation)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [topic_id, question_text.trim(), question_type, difficulty ?? "medium", explanation ?? null]
        );
        const question = qResult.rows[0];

        if (answers?.length) {
            for (const ans of answers) {
                await client.query(
                    `INSERT INTO answers (question_id, answer_text, is_correct, order_index)
                     VALUES ($1, $2, $3, $4)`,
                    [question.id, ans.answer_text, ans.is_correct ?? false, ans.order_index ?? 0]
                );
            }
        }

        await client.query("COMMIT");
        res.status(201).json(question);
    } catch (error) {
        await client.query("ROLLBACK");
        console.log("Error creating question", error);
        res.status(500).json({ message: "Internal server error", status: 500 });
    } finally {
        client.release();
    }
}
