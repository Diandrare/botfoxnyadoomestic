import {
  Client,
  GatewayIntentBits,
  Partials,
  ActivityType,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  Message,
  GuildMember,
  EmbedBuilder,
  ChannelType,
  MessageType,
} from "discord.js";
import OpenAI from "openai";
import { db } from "@workspace/db";
import {
  moderationActionsTable,
  aiConversationsTable,
  aiMessagesTable,
  botSettingsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger.js";

// ── Types ──────────────────────────────────────────────────────────────────────
export interface BotState {
  online: boolean;
  uptime: number | null;
  activityType: string | null;
  activityName: string | null;
  guildCount: number;
  memberCount: number;
}

export interface RotationItem {
  type: "playing" | "watching" | "listening" | "streaming";
  name: string;
  url?: string | null;
}

export interface RotationConfig {
  enabled: boolean;
  intervalSeconds: number;
  items: RotationItem[];
}

export interface BoostConfig {
  messages: string[];
  gifs: string[];
  footer: string;
}

const DEFAULT_BOOST_CONFIG: BoostConfig = {
  messages: [
    "SULTAN DETECTED! 👑 **{user}** baru aja ngebanting Nitro ke server kita. KERE HORE!",
    "YA AMPUN! 😱 **{user}** boost server?! Dia beneran sultan sih, gak ada yang bisa nyangkal.",
    "🚨 SULTAN ALERT 🚨 Ada yang boost nih! **{user}** udah masuk jajaran orang-orang pilihan. Salut!",
    "Halo? Iya ini beneran? **{user}** boost server kita?! GASKEUN TERUS BOS! 🔥",
    "**{user}** boost server, artinya dia lebih kaya dari kita semua yang ada di sini 💀💰",
    "🎊 JREEENG! **{user}** resmi jadi DEWA server kita! Hormati dia mulai sekarang!",
    "Plot twist: **{user}** ternyata sultan. Server kita makin sultan juga! 🥳",
    "Temen-temen! **{user}** baru boost! Kita doakan dia rejekinya semakin lancar! Aamiin 🤲✨",
    "**{user}** boost server = dia udah transcend jadi makhluk level dewa ⚡ Kita masih manusia biasa 😔",
    "Akhirnya ada yang boost! Dan orangnya adalah... **{user}**! Makasih bos, traktir bakso ya! 🍜",
  ],
  gifs: [
    "https://media.tenor.com/lhAyOeFLlfwAAAAC/spongebob-imagination.gif",
    "https://media.tenor.com/iiMHQHGVqFEAAAAC/money-cash.gif",
    "https://media.tenor.com/UWn1RNdSAyQAAAAC/crying-i-cant.gif",
    "https://media.tenor.com/pox8JxpRRakAAAAC/this-is-fine-fire.gif",
    "https://media.tenor.com/sNGDCnQoL8kAAAAC/best-day-ever-spongebob.gif",
    "https://media.tenor.com/G6iFZIkujeQAAAAC/cat-surprised.gif",
    "https://media.tenor.com/LlKHMT0k7BEAAAAC/minion-party.gif",
    "https://media.tenor.com/OlMBD1sMijcAAAAC/celebrate-yay.gif",
    "https://media.tenor.com/5suIAvpZXh4AAAAC/happy-dance.gif",
    "https://media.tenor.com/VdjUxVPEWzcAAAAC/cat-dancing.gif",
  ],
  footer: "Makasih udah boost! Semoga rejekinya nambah terus 🙏",
};

// ── OpenAI client ─────────────────────────────────────────────────────────────
function createOpenAIClient(): OpenAI | null {
  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) {
    logger.warn("OPENAI_API_KEY not set – AI chat disabled");
    return null;
  }
  return new OpenAI({ apiKey });
}

// ── Slash command definitions ─────────────────────────────────────────────────
const commands = [
  new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a member from the server")
    .addUserOption((o) =>
      o.setName("user").setDescription("User to kick").setRequired(true),
    )
    .addStringOption((o) =>
      o.setName("reason").setDescription("Reason for kick"),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a member from the server")
    .addUserOption((o) =>
      o.setName("user").setDescription("User to ban").setRequired(true),
    )
    .addStringOption((o) => o.setName("reason").setDescription("Reason for ban"))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warn a member")
    .addUserOption((o) =>
      o.setName("user").setDescription("User to warn").setRequired(true),
    )
    .addStringOption((o) =>
      o.setName("reason").setDescription("Reason for warning"),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Timeout (mute) a member")
    .addUserOption((o) =>
      o.setName("user").setDescription("User to mute").setRequired(true),
    )
    .addIntegerOption((o) =>
      o
        .setName("duration")
        .setDescription("Duration in minutes (max 40320)")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(40320),
    )
    .addStringOption((o) => o.setName("reason").setDescription("Reason for mute"))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName("join")
    .setDescription("Join your current voice channel"),

  new SlashCommandBuilder()
    .setName("leave")
    .setDescription("Leave the current voice channel"),

  new SlashCommandBuilder()
    .setName("chat")
    .setDescription("Chat with the AI assistant")
    .addStringOption((o) =>
      o.setName("message").setDescription("Your message").setRequired(true),
    ),

  new SlashCommandBuilder()
    .setName("embed")
    .setDescription("Kirim embed message ke channel tertentu")
    .addChannelOption((o) =>
      o
        .setName("channel")
        .setDescription("Channel tujuan pengiriman embed")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true),
    )
    .addStringOption((o) =>
      o
        .setName("description")
        .setDescription("Isi teks utama embed")
        .setRequired(true),
    )
    .addStringOption((o) =>
      o.setName("title").setDescription("Judul embed (opsional)"),
    )
    .addStringOption((o) =>
      o
        .setName("image")
        .setDescription("URL gambar/banner besar di bawah embed (opsional)"),
    )
    .addStringOption((o) =>
      o
        .setName("thumbnail")
        .setDescription("URL gambar kecil di pojok kanan atas (opsional)"),
    )
    .addStringOption((o) =>
      o
        .setName("color")
        .setDescription("Warna garis kiri embed, format hex contoh: #ff0000 (opsional)"),
    )
    .addStringOption((o) =>
      o.setName("footer").setDescription("Teks footer di bawah embed (opsional)"),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
].map((c) => c.toJSON());

// ── Bot class ─────────────────────────────────────────────────────────────────
class DiscordBot {
  private client: Client;
  private openai: OpenAI | null;
  private startedAt: Date | null = null;

  // Status rotation
  private rotationItems: RotationItem[] = [];
  private rotationIntervalSec: number = 5;
  private rotationEnabled: boolean = false;
  private rotationTimer: ReturnType<typeof setInterval> | null = null;
  private rotationIndex: number = 0;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages,
      ],
      partials: [Partials.Message, Partials.Channel, Partials.User],
    });
    this.openai = createOpenAIClient();
    this.registerEvents();
  }

  // ── Events ─────────────────────────────────────────────────────────────────
  private registerEvents(): void {
    this.client.once("ready", () => {
      this.startedAt = new Date();
      logger.info({ tag: this.client.user?.tag }, "Discord bot ready");
      // Load persisted rotation config from DB, fall back to default activity
      this.loadRotationFromDb().catch((err) => {
        logger.error({ err }, "Failed to load rotation config from DB");
        this.setActivity("playing", "with slash commands");
      });
    });

    this.client.on("interactionCreate", (interaction) => {
      if (interaction.isChatInputCommand()) {
        this.handleCommand(interaction).catch((err) =>
          logger.error({ err }, "Error handling command"),
        );
      }
    });

    this.client.on("messageCreate", (message) => {
      if (message.author.bot) return;

      // Image rating: auto-react 1–10 on any message with attachments in the target channel
      const ratingChannelId = "1533432659533889587";
      if (message.channel.id === ratingChannelId && message.attachments.size > 0) {
        this.handleImageRating(message).catch((err) =>
          logger.error({ err }, "Error handling image rating"),
        );
      }

      // Boost notification (type 8 = GuildBoost in discord.js v14)
      if (message.type === MessageType.GuildBoost) {
        this.handleBoostNotification(message).catch((err) =>
          logger.error({ err }, "Error handling boost notification"),
        );
      }

      // AI mention reply
      if (this.client.user && message.mentions.has(this.client.user)) {
        this.handleAiMention(message).catch((err) =>
          logger.error({ err }, "Error handling AI mention"),
        );
      }
    });
  }

  // ── Slash command handler ──────────────────────────────────────────────────
  private async handleCommand(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    const { commandName } = interaction;

    switch (commandName) {
      case "kick":
        await this.handleKick(interaction);
        break;
      case "ban":
        await this.handleBan(interaction);
        break;
      case "warn":
        await this.handleWarn(interaction);
        break;
      case "mute":
        await this.handleMute(interaction);
        break;
      case "join":
        await this.handleJoin(interaction);
        break;
      case "leave":
        await this.handleLeave(interaction);
        break;
      case "chat":
        await this.handleChat(interaction);
        break;
      case "embed":
        await this.handleEmbed(interaction);
        break;
      default:
        await interaction.reply({ content: "Unknown command.", ephemeral: true });
    }
  }

  // ── Moderation commands ────────────────────────────────────────────────────
  private async handleKick(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    await interaction.deferReply({ ephemeral: true });
    const target = interaction.options.getMember("user") as GuildMember | null;
    const reason =
      interaction.options.getString("reason") ?? "No reason provided";

    if (!target) {
      await interaction.editReply("User not found in this server.");
      return;
    }

    try {
      await target.kick(reason);
      await this.logAction(
        interaction,
        target.id,
        target.user.username,
        "kick",
        reason,
      );
      await interaction.editReply(
        `Kicked **${target.user.username}** — reason: ${reason}`,
      );
    } catch {
      await interaction.editReply("Failed to kick user. Check bot permissions.");
    }
  }

  private async handleBan(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    await interaction.deferReply({ ephemeral: true });
    const target = interaction.options.getUser("user");
    const reason =
      interaction.options.getString("reason") ?? "No reason provided";

    if (!target) {
      await interaction.editReply("User not found.");
      return;
    }

    try {
      await interaction.guild?.bans.create(target.id, { reason });
      await this.logAction(
        interaction,
        target.id,
        target.username,
        "ban",
        reason,
      );
      await interaction.editReply(
        `Banned **${target.username}** — reason: ${reason}`,
      );
    } catch {
      await interaction.editReply("Failed to ban user. Check bot permissions.");
    }
  }

  private async handleWarn(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    await interaction.deferReply({ ephemeral: true });
    const target = interaction.options.getUser("user");
    const reason =
      interaction.options.getString("reason") ?? "No reason provided";

    if (!target) {
      await interaction.editReply("User not found.");
      return;
    }

    await this.logAction(
      interaction,
      target.id,
      target.username,
      "warn",
      reason,
    );

    try {
      const dm = await target.createDM();
      await dm.send(
        `You have been warned in **${interaction.guild?.name}** — reason: ${reason}`,
      );
    } catch {
      // DMs disabled — that's fine
    }

    await interaction.editReply(
      `Warned **${target.username}** — reason: ${reason}`,
    );
  }

  private async handleMute(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    await interaction.deferReply({ ephemeral: true });
    const target = interaction.options.getMember("user") as GuildMember | null;
    const duration = interaction.options.getInteger("duration") ?? 10;
    const reason =
      interaction.options.getString("reason") ?? "No reason provided";

    if (!target) {
      await interaction.editReply("User not found in this server.");
      return;
    }

    try {
      await target.timeout(duration * 60 * 1000, reason);
      await this.logAction(
        interaction,
        target.id,
        target.user.username,
        "mute",
        reason,
        duration,
      );
      await interaction.editReply(
        `Muted **${target.user.username}** for ${duration} minute(s) — reason: ${reason}`,
      );
    } catch {
      await interaction.editReply("Failed to mute user. Check bot permissions.");
    }
  }

  // ── Voice commands ─────────────────────────────────────────────────────────
  private async handleJoin(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    const member = interaction.member as GuildMember | null;
    const voiceChannel = member?.voice.channel;

    if (!voiceChannel) {
      await interaction.reply({
        content: "You need to be in a voice channel first.",
        ephemeral: true,
      });
      return;
    }

    try {
      const {
        joinVoiceChannel,
        createAudioPlayer,
        createAudioResource,
        NoSubscriberBehavior,
        AudioPlayerStatus,
        VoiceConnectionStatus,
        entersState,
        StreamType,
      } = await import("@discordjs/voice");
      const { Readable } = await import("node:stream");

      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: true,
      });

      // Play an infinite silence stream so Discord never kicks the bot for being idle
      const SILENCE_FRAME = Buffer.from([0xf8, 0xff, 0xfe]);
      const makeSilence = () =>
        new Readable({ read() { this.push(SILENCE_FRAME); } });

      const player = createAudioPlayer({
        behaviors: { noSubscriber: NoSubscriberBehavior.Play },
      });

      const startSilence = () => {
        const resource = createAudioResource(makeSilence(), {
          inputType: StreamType.Opus,
        });
        player.play(resource);
      };

      startSilence();
      connection.subscribe(player);

      // Loop silence — restart whenever the resource finishes
      player.on(AudioPlayerStatus.Idle, startSilence);

      // Auto-reconnect on network drops
      connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
          await Promise.race([
            entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
            entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
          ]);
          // Successfully reconnecting — do nothing
        } catch {
          // Could not reconnect — destroy cleanly
          connection.destroy();
        }
      });

      await interaction.reply({
        content: `Joined **${voiceChannel.name}** 🔇 — staying connected indefinitely`,
        ephemeral: true,
      });
    } catch (err) {
      logger.error({ err }, "Failed to join voice channel");
      await interaction.reply({
        content: "Could not join voice channel.",
        ephemeral: true,
      });
    }
  }

  private async handleLeave(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    try {
      const { getVoiceConnection } = await import("@discordjs/voice");
      if (!interaction.guildId) {
        await interaction.reply({
          content: "This command can only be used in a server.",
          ephemeral: true,
        });
        return;
      }
      const connection = getVoiceConnection(interaction.guildId);
      if (!connection) {
        await interaction.reply({
          content: "Not currently in a voice channel.",
          ephemeral: true,
        });
        return;
      }
      connection.destroy();
      await interaction.reply({ content: "Left the voice channel.", ephemeral: true });
    } catch {
      await interaction.reply({
        content: "Could not leave voice channel.",
        ephemeral: true,
      });
    }
  }

  // ── AI chat (/chat command) ────────────────────────────────────────────────
  private async handleChat(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    if (!this.openai) {
      await interaction.reply({
        content: "AI chat is not configured. Set OPENAI_API_KEY.",
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply();
    const userMessage = interaction.options.getString("message", true);

    try {
      const [conversation] = await db
        .insert(aiConversationsTable)
        .values({
          title: userMessage.slice(0, 80),
          discordUserId: interaction.user.id,
          discordUsername: interaction.user.username,
        })
        .returning();

      if (!conversation) throw new Error("Failed to create conversation");

      await db.insert(aiMessagesTable).values({
        conversationId: conversation.id,
        role: "user",
        content: userMessage,
      });

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 1000,
        messages: [
          {
            role: "system",
            content:
              "You are a friendly and helpful Discord bot assistant. Keep responses concise and conversational. Be natural and engaging.",
          },
          { role: "user", content: userMessage },
        ],
      });

      const reply =
        completion.choices[0]?.message?.content ?? "I couldn't generate a response.";

      await db.insert(aiMessagesTable).values({
        conversationId: conversation.id,
        role: "assistant",
        content: reply,
      });

      const truncated =
        reply.length > 2000 ? reply.slice(0, 1997) + "..." : reply;
      await interaction.editReply(truncated);
    } catch (err) {
      logger.error({ err }, "AI chat error");
      await interaction.editReply("Something went wrong with the AI response.");
    }
  }

  // ── Image rating (auto-react 1–10) ────────────────────────────────────────
  private async handleImageRating(message: Message): Promise<void> {
    const emojis = ["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"];
    logger.info({ author: message.author.tag }, "Adding image rating reactions");
    for (const emoji of emojis) {
      try {
        await message.react(emoji);
      } catch (err) {
        logger.error({ err, emoji }, "Failed to add reaction");
        break;
      }
    }
  }

  // ── Boost notification ────────────────────────────────────────────────────
  private async handleBoostNotification(message: Message): Promise<void> {
    const BOOST_MESSAGES = [
      "SULTAN DETECTED! 👑 **{user}** baru aja ngebanting Nitro ke server kita. KERE HORE!",
      "YA AMPUN! 😱 **{user}** boost server?! Dia beneran sultan sih, gak ada yang bisa nyangkal.",
      "🚨 SULTAN ALERT 🚨 Ada yang boost nih! **{user}** udah masuk jajaran orang-orang pilihan. Salut!",
      "Halo? Iya ini beneran? **{user}** boost server kita?! GASKEUN TERUS BOS! 🔥",
      "**{user}** boost server, artinya dia lebih kaya dari kita semua yang ada di sini 💀💰",
      "🎊 JREEENG! **{user}** resmi jadi DEWA server kita! Hormati dia mulai sekarang!",
      "Plot twist: **{user}** ternyata sultan. Server kita makin sultan juga! 🥳",
      "Temen-temen! **{user}** baru boost! Kita doakan dia rejekinya semakin lancar! Aamiin 🤲✨",
      "**{user}** boost server = dia udah transcend jadi makhluk level dewa ⚡ Kita masih manusia biasa 😔",
      "Akhirnya ada yang boost! Dan orangnya adalah... **{user}**! Makasih bos, traktir bakso ya! 🍜",
    ];

    const BOOST_GIFS = [
      "https://media.tenor.com/lhAyOeFLlfwAAAAC/spongebob-imagination.gif",
      "https://media.tenor.com/iiMHQHGVqFEAAAAC/money-cash.gif",
      "https://media.tenor.com/UWn1RNdSAyQAAAAC/crying-i-cant.gif",
      "https://media.tenor.com/pox8JxpRRakAAAAC/this-is-fine-fire.gif",
      "https://media.tenor.com/sNGDCnQoL8kAAAAC/best-day-ever-spongebob.gif",
      "https://media.tenor.com/G6iFZIkujeQAAAAC/cat-surprised.gif",
      "https://media.tenor.com/LlKHMT0k7BEAAAAC/minion-party.gif",
      "https://media.tenor.com/OlMBD1sMijcAAAAC/celebrate-yay.gif",
      "https://media.tenor.com/5suIAvpZXh4AAAAC/happy-dance.gif",
      "https://media.tenor.com/VdjUxVPEWzcAAAAC/cat-dancing.gif",
    ];

    const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]!;

    const user = message.author;
    const guild = message.guild;
    const boostCount = guild?.premiumSubscriptionCount ?? 0;
    const level = guild?.premiumTier ?? 0;

    const levelLabel = ["Belum ada level", "Level 1", "Level 2", "Level 3"][level] ?? `Level ${level}`;

    const msgText = pick(BOOST_MESSAGES).replace("{user}", user.displayName ?? user.username);

    const embed = new EmbedBuilder()
      .setTitle("🚀 SERVER BARU KENA BOOST!")
      .setDescription(msgText)
      .setColor(0xff73fa)
      .setThumbnail(user.displayAvatarURL({ size: 256 }))
      .setImage(pick(BOOST_GIFS))
      .addFields(
        { name: "👤 Booster", value: `<@${user.id}>`, inline: true },
        { name: "💎 Total Boost", value: `${boostCount} boost`, inline: true },
        { name: "🏆 Server Level", value: levelLabel, inline: true },
      )
      .setFooter({ text: "Makasih udah boost! Semoga rejekinya nambah terus 🙏" })
      .setTimestamp();

    if (message.channel.isTextBased() && "send" in message.channel) {
      await (message.channel as import("discord.js").TextChannel).send({ embeds: [embed] });
    }
    logger.info({ userId: user.id, username: user.username, boostCount }, "Boost notification sent");
  }

  // ── Embed sender ──────────────────────────────────────────────────────────
  private async handleEmbed(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    const channel = interaction.options.getChannel("channel", true);
    const description = interaction.options.getString("description", true);
    const title = interaction.options.getString("title");
    const imageUrl = interaction.options.getString("image");
    const thumbnailUrl = interaction.options.getString("thumbnail");
    const colorHex = interaction.options.getString("color");
    const footer = interaction.options.getString("footer");

    // Parse color — default to bot's theme blue
    let color: number = 0x5865f2;
    if (colorHex) {
      const parsed = parseInt(colorHex.replace("#", ""), 16);
      if (!isNaN(parsed)) color = parsed;
    }

    const embed = new EmbedBuilder()
      .setDescription(description)
      .setColor(color);

    if (title) embed.setTitle(title);
    if (imageUrl) embed.setImage(imageUrl);
    if (thumbnailUrl) embed.setThumbnail(thumbnailUrl);
    if (footer) embed.setFooter({ text: footer });

    try {
      const target = await interaction.client.channels.fetch(channel.id);
      if (!target || !target.isTextBased() || !("send" in target)) {
        await interaction.editReply("Channel tidak ditemukan atau bukan text channel.");
        return;
      }
      await (target as import("discord.js").TextChannel).send({ embeds: [embed] });
      await interaction.editReply(`✅ Embed berhasil dikirim ke <#${channel.id}>`);
    } catch (err) {
      logger.error({ err }, "Failed to send embed");
      await interaction.editReply("Gagal mengirim embed. Pastikan bot punya permission **Send Messages** di channel tersebut.");
    }
  }

  // ── AI chat (@mention) ─────────────────────────────────────────────────────
  private async handleAiMention(message: Message): Promise<void> {
    if (!this.openai) return;

    const userText = message.content
      .replace(/<@!?\d+>/g, "")
      .trim();

    if (!userText) return;

    try {
      if ("sendTyping" in message.channel) {
        await (message.channel as { sendTyping: () => Promise<void> }).sendTyping();
      }

      const [conversation] = await db
        .insert(aiConversationsTable)
        .values({
          title: userText.slice(0, 80),
          discordUserId: message.author.id,
          discordUsername: message.author.username,
        })
        .returning();

      if (!conversation) return;

      await db.insert(aiMessagesTable).values({
        conversationId: conversation.id,
        role: "user",
        content: userText,
      });

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 1000,
        messages: [
          {
            role: "system",
            content:
              "You are a friendly and helpful Discord bot assistant. Keep responses concise and conversational. Be natural and engaging.",
          },
          { role: "user", content: userText },
        ],
      });

      const reply =
        completion.choices[0]?.message?.content ?? "I couldn't generate a response.";

      await db.insert(aiMessagesTable).values({
        conversationId: conversation.id,
        role: "assistant",
        content: reply,
      });

      const truncated =
        reply.length > 2000 ? reply.slice(0, 1997) + "..." : reply;
      await message.reply(truncated);
    } catch (err) {
      logger.error({ err }, "AI mention error");
    }
  }

  // ── Moderation log helper ──────────────────────────────────────────────────
  private async logAction(
    interaction: ChatInputCommandInteraction,
    userId: string,
    username: string,
    action: "kick" | "ban" | "warn" | "mute",
    reason: string,
    duration?: number,
  ): Promise<void> {
    try {
      await db.insert(moderationActionsTable).values({
        guildId: interaction.guildId ?? "unknown",
        userId,
        username,
        moderatorId: interaction.user.id,
        moderatorName: interaction.user.username,
        action,
        reason,
        duration: duration ?? null,
      });
    } catch (err) {
      logger.error({ err }, "Failed to log moderation action");
    }
  }

  // ── Status rotation ───────────────────────────────────────────────────────
  private async loadRotationFromDb(): Promise<void> {
    const rows = await db
      .select()
      .from(botSettingsTable)
      .where(eq(botSettingsTable.key, "rotation_config"));

    if (rows.length > 0 && rows[0]) {
      try {
        const config: RotationConfig = JSON.parse(rows[0].value);
        logger.info("Loaded rotation config from DB");
        this.applyRotation(config);
        return;
      } catch {
        logger.warn("Failed to parse rotation config from DB, using defaults");
      }
    }
    // No saved config — just set default activity
    this.setActivity("playing", "with slash commands");
  }

  private async saveRotationToDb(config: RotationConfig): Promise<void> {
    await db
      .insert(botSettingsTable)
      .values({ key: "rotation_config", value: JSON.stringify(config) })
      .onConflictDoUpdate({
        target: botSettingsTable.key,
        set: { value: JSON.stringify(config), updatedAt: new Date() },
      });
  }

  getRotation(): RotationConfig {
    return {
      enabled: this.rotationEnabled,
      intervalSeconds: this.rotationIntervalSec,
      items: this.rotationItems,
    };
  }

  setRotation(config: RotationConfig): void {
    this.applyRotation(config);
    // Persist asynchronously — don't block the API response
    this.saveRotationToDb(config).catch((err) =>
      logger.error({ err }, "Failed to persist rotation config"),
    );
  }

  private applyRotation(config: RotationConfig): void {
    this.rotationEnabled = config.enabled;
    this.rotationIntervalSec = Math.max(1, config.intervalSeconds);
    this.rotationItems = config.items;
    this.rotationIndex = 0;

    // Clear existing timer
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = null;
    }

    if (this.rotationEnabled && this.rotationItems.length > 0) {
      // Apply first item immediately
      const first = this.rotationItems[0]!;
      this.setActivity(first.type, first.name, first.url ?? undefined);

      this.rotationTimer = setInterval(() => {
        if (this.rotationItems.length === 0) return;
        this.rotationIndex = (this.rotationIndex + 1) % this.rotationItems.length;
        const item = this.rotationItems[this.rotationIndex]!;
        this.setActivity(item.type, item.name, item.url ?? undefined);
      }, this.rotationIntervalSec * 1000);

      logger.info(
        { count: this.rotationItems.length, intervalSeconds: this.rotationIntervalSec },
        "Status rotation started",
      );
    } else if (!this.rotationEnabled) {
      logger.info("Status rotation stopped");
    }
  }

  // ── Activity control (called from API) ────────────────────────────────────
  setActivity(
    type: "playing" | "watching" | "listening" | "streaming",
    name: string,
    url?: string,
  ): void {
    if (!this.client.user) return;

    const typeMap: Record<typeof type, ActivityType> = {
      playing: ActivityType.Playing,
      watching: ActivityType.Watching,
      listening: ActivityType.Listening,
      streaming: ActivityType.Streaming,
    };

    this.client.user.setActivity({
      name,
      type: typeMap[type],
      ...(type === "streaming" && url ? { url } : {}),
    });

    logger.info({ type, name }, "Bot activity updated");
  }

  // ── Status (called from API) ───────────────────────────────────────────────
  getStatus(): BotState {
    const presence = this.client.user?.presence;
    const activity = presence?.activities?.[0];

    const activityTypeMap: Record<number, string> = {
      [ActivityType.Playing]: "playing",
      [ActivityType.Watching]: "watching",
      [ActivityType.Listening]: "listening",
      [ActivityType.Streaming]: "streaming",
      [ActivityType.Competing]: "competing",
      [ActivityType.Custom]: "custom",
    };

    let memberCount = 0;
    this.client.guilds.cache.forEach((g) => {
      memberCount += g.memberCount;
    });

    return {
      online: this.client.user !== null,
      uptime: this.client.uptime ?? null,
      activityType:
        activity?.type !== undefined
          ? (activityTypeMap[activity.type] ?? null)
          : null,
      activityName: activity?.name ?? null,
      guildCount: this.client.guilds.cache.size,
      memberCount,
    };
  }

  // ── Guild list (called from API) ───────────────────────────────────────────
  getGuilds(): Array<{
    id: string;
    name: string;
    memberCount: number;
    iconUrl: string | null;
  }> {
    return this.client.guilds.cache.map((g) => ({
      id: g.id,
      name: g.name,
      memberCount: g.memberCount,
      iconUrl: g.iconURL() ?? null,
    }));
  }

  // ── Start bot ──────────────────────────────────────────────────────────────
  async start(): Promise<void> {
    const token = process.env["DISCORD_TOKEN"];
    if (!token) {
      logger.warn("DISCORD_TOKEN not set – Discord bot disabled");
      return;
    }

    const clientId = process.env["DISCORD_CLIENT_ID"];
    if (!clientId) {
      logger.warn("DISCORD_CLIENT_ID not set – skipping slash command registration");
    } else {
      // Register slash commands globally
      try {
        const rest = new REST({ version: "10" }).setToken(token);
        await rest.put(Routes.applicationCommands(clientId), { body: commands });
        logger.info("Slash commands registered globally");
      } catch (err) {
        logger.error({ err }, "Failed to register slash commands");
      }
    }

    await this.client.login(token);
  }
}

// ── Singleton ──────────────────────────────────────────────────────────────────
export const discordBot = new DiscordBot();
