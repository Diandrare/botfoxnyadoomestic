import app from "./app.js";
import { logger } from "./lib/logger.js";
import { discordBot } from "./lib/discord-bot.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Start the Discord bot (non-blocking — logs a warning if token is missing)
  discordBot.start().catch((err) => {
    logger.error({ err }, "Discord bot startup error");
  });
});
