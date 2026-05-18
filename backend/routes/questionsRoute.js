import express from "express";
import { getQuestionsByTopic, createQuestion } from "../src/controllers/questionsController.js";

const router = express.Router();

router.get("/:topicId", getQuestionsByTopic);
router.post("/", createQuestion);

export default router;
