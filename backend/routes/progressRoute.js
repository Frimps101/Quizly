import express from "express";
import { markProgress, getTopicProgress, getProgressSummary } from "../src/controllers/progressController.js";

const router = express.Router();

router.post("/", markProgress);
router.get("/summary", getProgressSummary);
router.get("/topic/:topicId", getTopicProgress);

export default router;
