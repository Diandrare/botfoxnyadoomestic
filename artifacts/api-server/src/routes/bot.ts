import { Router, type IRouter } from "express";
import { discordBot } from "../lib/discord-bot.js";
import {
  GetBotStatusResponse,
  SetBotActivityBody,
  ListBotGuildsResponse,
  SetBotRotationBody,
  GetBotRotationResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/bot/status", async (_req, res): Promise<void> => {
  const status = discordBot.getStatus();
  res.json(GetBotStatusResponse.parse(status));
});

router.post("/bot/activity", async (req, res): Promise<void> => {
  const parsed = SetBotActivityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { type, name, url } = parsed.data;
  discordBot.setActivity(
    type as "playing" | "watching" | "listening" | "streaming",
    name,
    url ?? undefined,
  );

  const status = discordBot.getStatus();
  // Patch activityType/Name since the bot sets it synchronously
  const updated = { ...status, activityType: type, activityName: name };
  res.json(updated);
});

router.get("/bot/rotation", async (_req, res): Promise<void> => {
  const config = discordBot.getRotation();
  res.json(GetBotRotationResponse.parse(config));
});

router.post("/bot/rotation", async (req, res): Promise<void> => {
  const parsed = SetBotRotationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  discordBot.setRotation(parsed.data);
  res.json(GetBotRotationResponse.parse(discordBot.getRotation()));
});

router.get("/bot/guilds", async (_req, res): Promise<void> => {
  const guilds = discordBot.getGuilds();
  res.json(ListBotGuildsResponse.parse(guilds));
});

export default router;
