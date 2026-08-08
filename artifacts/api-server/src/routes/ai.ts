import { Router, type IRouter } from "express";
import { eq, asc, desc } from "drizzle-orm";
import OpenAI from "openai";
import { db, aiConversationsTable, aiMessagesTable } from "@workspace/db";
import {
  CreateAiConversationBody,
  CreateAiConversationResponse,
  ListAiConversationsResponse,
  GetAiConversationParams,
  GetAiConversationResponse,
  DeleteAiConversationParams,
  ListAiMessagesParams,
  ListAiMessagesResponse,
  SendAiMessageParams,
  SendAiMessageBody,
} from "@workspace/api-zod";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

function getOpenAI(): OpenAI | null {
  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

// List conversations
router.get("/ai/conversations", async (_req, res): Promise<void> => {
  const conversations = await db
    .select()
    .from(aiConversationsTable)
    .orderBy(desc(aiConversationsTable.createdAt))
    .limit(100);
  res.json(ListAiConversationsResponse.parse(conversations));
});

// Create conversation
router.post("/ai/conversations", async (req, res): Promise<void> => {
  const parsed = CreateAiConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [conv] = await db
    .insert(aiConversationsTable)
    .values({
      title: parsed.data.title,
      discordUserId: parsed.data.discordUserId ?? null,
      discordUsername: parsed.data.discordUsername ?? null,
    })
    .returning();

  if (!conv) {
    res.status(500).json({ error: "Failed to create conversation" });
    return;
  }

  res.status(201).json(CreateAiConversationResponse.parse(conv));
});

// Get conversation with messages
router.get("/ai/conversations/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params["id"])
    ? req.params["id"][0]
    : req.params["id"];
  const params = GetAiConversationParams.safeParse({ id: Number(rawId) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [conv] = await db
    .select()
    .from(aiConversationsTable)
    .where(eq(aiConversationsTable.id, params.data.id));

  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const messages = await db
    .select()
    .from(aiMessagesTable)
    .where(eq(aiMessagesTable.conversationId, conv.id))
    .orderBy(asc(aiMessagesTable.createdAt));

  res.json(GetAiConversationResponse.parse({ ...conv, messages }));
});

// Delete conversation
router.delete("/ai/conversations/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params["id"])
    ? req.params["id"][0]
    : req.params["id"];
  const params = DeleteAiConversationParams.safeParse({ id: Number(rawId) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  // Delete messages first
  await db
    .delete(aiMessagesTable)
    .where(eq(aiMessagesTable.conversationId, params.data.id));

  const [deleted] = await db
    .delete(aiConversationsTable)
    .where(eq(aiConversationsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  res.status(204).send();
});

// List messages
router.get("/ai/conversations/:id/messages", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params["id"])
    ? req.params["id"][0]
    : req.params["id"];
  const params = ListAiMessagesParams.safeParse({ id: Number(rawId) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const messages = await db
    .select()
    .from(aiMessagesTable)
    .where(eq(aiMessagesTable.conversationId, params.data.id))
    .orderBy(asc(aiMessagesTable.createdAt));

  res.json(ListAiMessagesResponse.parse(messages));
});

// Send message — SSE streaming response
router.post("/ai/conversations/:id/messages", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params["id"])
    ? req.params["id"][0]
    : req.params["id"];
  const params = SendAiMessageParams.safeParse({ id: Number(rawId) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = SendAiMessageBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const openai = getOpenAI();
  if (!openai) {
    res.status(503).json({ error: "AI not configured. Set OPENAI_API_KEY." });
    return;
  }

  // Load conversation + history
  const [conv] = await db
    .select()
    .from(aiConversationsTable)
    .where(eq(aiConversationsTable.id, params.data.id));

  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const history = await db
    .select()
    .from(aiMessagesTable)
    .where(eq(aiMessagesTable.conversationId, conv.id))
    .orderBy(asc(aiMessagesTable.createdAt));

  // Save user message
  await db.insert(aiMessagesTable).values({
    conversationId: conv.id,
    role: "user",
    content: body.data.content,
  });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullResponse = "";

  try {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content:
          "You are a friendly and helpful Discord bot assistant. Keep responses conversational and natural.",
      },
      ...history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: body.data.content },
    ];

    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 2048,
      messages,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    // Persist assistant response
    await db.insert(aiMessagesTable).values({
      conversationId: conv.id,
      role: "assistant",
      content: fullResponse,
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    logger.error({ err }, "AI streaming error");
    res.write(`data: ${JSON.stringify({ error: "AI request failed" })}\n\n`);
    res.end();
  }
});

export default router;
