import express from "express";
import { markProgress, getTopicProgress } from "../src/controllers/progressController.js";

const router = express.Router();

router.post("/", markProgress);
router.get("/topic/:topicId", getTopicProgress);

export default router;
