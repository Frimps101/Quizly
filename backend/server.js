import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { initDb } from "./config/db.js";
import subjectsRoute from "./routes/subjectsRoute.js";
import topicsRoute from "./routes/topicsRoute.js";
import questionsRoute from "./routes/questionsRoute.js";
import progressRoute from "./routes/progressRoute.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;

app.use("/api/subjects", subjectsRoute);
app.use("/api/topics", topicsRoute);
app.use("/api/questions", questionsRoute);
app.use("/api/progress", progressRoute);

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

initDb();