import dotenv from "dotenv"
import pg from "pg"

dotenv.config();
const { Pool } = pg;

const pool = new Pool({
    host: process.env.DB,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

pool.connect()
    .then((client) => {
        console.log("connected to the db");
        client.release();
    })
    .catch((err) => {
        console.log("error connecting to the db", err.message)
    });

export default pool;

export async function initDb(){
    try {
        // 1. Subjects Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS subjects (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                icon VARCHAR(50),
                icon_color VARCHAR(50),
                description TEXT,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 2. Topics Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS topics (
                id SERIAL PRIMARY KEY,
                subject_id INTEGER NOT NULL,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
            )
        `);

        // 3. Questions Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS questions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                topic_id INTEGER NOT NULL,
                question_text TEXT NOT NULL,
                question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer')),
                difficulty VARCHAR(10) CHECK (difficulty IN ('easy', 'medium', 'hard')),
                explanation TEXT,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
            )
        `);

        // 4. Answers Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS answers (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                question_id UUID NOT NULL,
                answer_text TEXT NOT NULL,
                is_correct BOOLEAN NOT NULL DEFAULT false,
                order_index INTEGER,
                FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
            )
        `);

        // 5. User Progress Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_progress (
                id SERIAL PRIMARY KEY,
                question_id UUID NOT NULL UNIQUE,
                status VARCHAR(20) NOT NULL DEFAULT 'new'
                    CHECK (status IN ('new', 'learning', 'mastered')),
                review_count INTEGER NOT NULL DEFAULT 0,
                last_reviewed TIMESTAMP,
                FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
            )
        `);

    } catch (error) {
        console.log("Error occurred initializing database:", error.message)
    }
}