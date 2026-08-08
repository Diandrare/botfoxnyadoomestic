import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import botRouter from "./bot.js";
import moderationRouter from "./moderation.js";
import aiRouter from "./ai.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(botRouter);
router.use(moderationRouter);
router.use(aiRouter);

export default router;
