import express from "express";
import { getTopics, createTopic } from "../src/controllers/topicsController.js";

const router = express.Router();

router.get("/:subjectId", getTopics);
router.post("/", createTopic);

export default router;