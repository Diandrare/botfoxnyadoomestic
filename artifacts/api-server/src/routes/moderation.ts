import { Router, type IRouter } from "express";
import { eq, desc, and, sql } from "drizzle-orm";
import { db, moderationActionsTable } from "@workspace/db";
import {
  ListModerationActionsQueryParams,
  CreateModerationActionBody,
  CreateModerationActionResponse,
  ListModerationActionsResponse,
  GetModerationStatsQueryParams,
  GetModerationStatsResponse,
  DeleteModerationActionParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/moderation/actions", async (req, res): Promise<void> => {
  const params = ListModerationActionsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { guildId, action, limit } = params.data;

  const conditions = [];
  if (guildId) conditions.push(eq(moderationActionsTable.guildId, guildId));
  if (action)
    conditions.push(
      eq(moderationActionsTable.action, action as "kick" | "ban" | "warn" | "mute"),
    );

  const query = db
    .select()
    .from(moderationActionsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(moderationActionsTable.createdAt))
    .limit(limit ?? 100);

  const actions = await query;
  res.json(ListModerationActionsResponse.parse(actions));
});

router.post("/moderation/actions", async (req, res): Promise<void> => {
  const parsed = CreateModerationActionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [action] = await db
    .insert(moderationActionsTable)
    .values({
      guildId: parsed.data.guildId,
      userId: parsed.data.userId,
      username: parsed.data.username,
      moderatorId: parsed.data.moderatorId,
      moderatorName: parsed.data.moderatorName,
      action: parsed.data.action as "kick" | "ban" | "warn" | "mute",
      reason: parsed.data.reason ?? null,
      duration: parsed.data.duration ?? null,
    })
    .returning();

  if (!action) {
    res.status(500).json({ error: "Failed to create action" });
    return;
  }

  res.status(201).json(CreateModerationActionResponse.parse(action));
});

router.delete("/moderation/actions/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params["id"])
    ? req.params["id"][0]
    : req.params["id"];
  const params = DeleteModerationActionParams.safeParse({ id: Number(rawId) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(moderationActionsTable)
    .where(eq(moderationActionsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Action not found" });
    return;
  }

  res.status(204).send();
});

router.get("/moderation/stats", async (req, res): Promise<void> => {
  const params = GetModerationStatsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { guildId } = params.data;
  const condition = guildId
    ? eq(moderationActionsTable.guildId, guildId)
    : undefined;

  const rows = await db
    .select({
      action: moderationActionsTable.action,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(moderationActionsTable)
    .where(condition)
    .groupBy(moderationActionsTable.action);

  const stats = { total: 0, kicks: 0, bans: 0, warns: 0, mutes: 0 };
  for (const row of rows) {
    const n = Number(row.count);
    stats.total += n;
    if (row.action === "kick") stats.kicks = n;
    else if (row.action === "ban") stats.bans = n;
    else if (row.action === "warn") stats.warns = n;
    else if (row.action === "mute") stats.mutes = n;
  }

  res.json(GetModerationStatsResponse.parse(stats));
});

export default router;
