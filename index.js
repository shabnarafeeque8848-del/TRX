// ==========================
// index.js (Discord.js v14)
// Apply Panel -> Pending -> Whitelist
// ==========================

const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  InteractionType,
  PermissionsBitField
} = require("discord.js");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// ===== CONFIG (PUT IDS HERE) =====
const APPLY_LOG_CHANNEL = "APPLY_LOG_CHANNEL_ID";
const PENDING_LOG_CHANNEL = "PENDING_LOG_CHANNEL_ID";
const WHITELIST_LOG_CHANNEL = "WHITELIST_LOG_CHANNEL_ID";

const PENDING_ROLE = "PENDING_ROLE_ID";
const WHITELIST_ROLE = "WHITELIST_ROLE_ID";

// ===== READY =====
client.once("ready", async () => {
  const commands = [
    new SlashCommandBuilder().setName("apply").setDescription("Apply for whitelist"),
    new SlashCommandBuilder().setName("sendpanels").setDescription("Send whitelist panels")
  ];

  await client.application.commands.set(commands);
  console.log("Whitelist bot ready");
});

// ===== INTERACTIONS =====
client.on("interactionCreate", async interaction => {

  // ---- SEND PANELS ----
  if (interaction.isChatInputCommand() && interaction.commandName === "sendpanels") {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: "Admins only", ephemeral: true });
    }

    const applyEmbed = new EmbedBuilder()
      .setTitle("Whitelist Apply")
      .setDescription("Click **Apply** to submit whitelist application")
      .setColor("Green");

    const applyRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("open_apply")
        .setLabel("Apply")
        .setStyle(ButtonStyle.Primary)
    );

    const pendingEmbed = new EmbedBuilder()
      .setTitle("Pending Whitelist")
      .setDescription("Staff: whitelist pending users")
      .setColor("Orange");

    const pendingRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("final_whitelist")
        .setLabel("Whitelist User")
        .setStyle(ButtonStyle.Success)
    );

    await interaction.channel.send({ embeds: [applyEmbed], components: [applyRow] });
    await interaction.channel.send({ embeds: [pendingEmbed], components: [pendingRow] });

    return interaction.reply({ content: "Panels sent", ephemeral: true });
  }

  // ---- APPLY BUTTON ----
  if (interaction.isButton() && interaction.customId === "open_apply") {
    const modal = new ModalBuilder()
      .setCustomId("apply_modal")
      .setTitle("Whitelist Application");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("game_id")
          .setLabel("Game ID")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("age")
          .setLabel("Age")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("experience")
          .setLabel("Game Experience")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
      )
    );

    return interaction.showModal(modal);
  }

  // ---- MODAL SUBMIT ----
  if (interaction.type === InteractionType.ModalSubmit && interaction.customId === "apply_modal") {
    const gameId = interaction.fields.getTextInputValue("game_id");
    const age = interaction.fields.getTextInputValue("age");
    const exp = interaction.fields.getTextInputValue("experience");

    const embed = new EmbedBuilder()
      .setTitle("New Whitelist Application")
      .addFields(
        { name: "User", value: `${interaction.user} (${interaction.user.id})` },
        { name: "Game ID", value: gameId },
        { name: "Age", value: age },
        { name: "Experience", value: exp }
      )
      .setColor("Blue");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`accept_${interaction.user.id}`)
        .setLabel("Accept")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`reject_${interaction.user.id}`)
        .setLabel("Reject")
        .setStyle(ButtonStyle.Danger)
    );

    const log = interaction.guild.channels.cache.get(APPLY_LOG_CHANNEL);
    await log.send({ embeds: [embed], components: [row] });

    return interaction.reply({ content: "Application submitted!", ephemeral: true });
  }

  // ---- ACCEPT / REJECT ----
  if (interaction.isButton()) {
    const [action, userId] = interaction.customId.split("_");
    if (!userId) return;

    const member = await interaction.guild.members.fetch(userId).catch(() => null);
    if (!member) return interaction.reply({ content: "User not found", ephemeral: true });

    if (action === "accept") {
      await member.roles.add(PENDING_ROLE);
      const pendingLog = interaction.guild.channels.cache.get(PENDING_LOG_CHANNEL);
      await pendingLog.send(`${member} is now **Pending** ⏳`);
      return interaction.reply({ content: "Moved to Pending", ephemeral: true });
    }

    if (action === "reject") {
      return interaction.reply({ content: "Application rejected", ephemeral: true });
    }

    if (interaction.customId === "final_whitelist") {
      await member.roles.remove(PENDING_ROLE);
      await member.roles.add(WHITELIST_ROLE);
      const wlLog = interaction.guild.channels.cache.get(WHITELIST_LOG_CHANNEL);
      await wlLog.send(`${member} has been **Whitelisted** ✅`);
      return interaction.reply({ content: "User whitelisted", ephemeral: true });
    }
  }
});

client.login(process.env.TOKEN);

/* ==========================
package.json
==========================
{
  "name": "whitelist-bot",
  "version": "1.0.0",
  "main": "index.js",
  "type": "commonjs",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "discord.js": "^14.14.1"
  }
}
*/
