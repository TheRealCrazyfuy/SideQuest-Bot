const {
  SlashCommandBuilder,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("close")
    .setDescription("Closes the current thread"),
  async execute(interaction) {
    // Close the thread
    if (interaction.channel.isThread()) {
      try {
        if (
          interaction.user.id == interaction.channel.ownerId ||
          interaction.member.permissions.has("ManageThreads")
        ) {
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("confirm_close_thread")
              .setLabel("✅Confirm Close")
              .setStyle(ButtonStyle.Danger),
          );
          await interaction.reply({
            content: "Do you want to close this thread?",
            components: [row],
            flags: MessageFlags.Ephemeral,
          });
        } else {
          await interaction.reply({
            content:
              "You do not have permission to close this thread <:MoraCabbage:1222196835142205471>.",
            flags: MessageFlags.Ephemeral,
          });
        }
      } catch (err) {
        console.error("Error closing thread:", err);
        await interaction.reply({
          content: "There was an error closing the thread.",
          flags: MessageFlags.Ephemeral,
        });
      }
    } else {
      await interaction.reply({
        content:
          "This command can only be used in a thread <:Mora_Scream:1388103624181158020>.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
