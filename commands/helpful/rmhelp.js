const { SlashCommandBuilder } = require("discord.js");
const helpReplies = require("../../data/helpreplies.json");
const Fuse = require("fuse.js");
const { logStandardMessage } = require("../../utils/logging");

const fuse = new Fuse(helpReplies, {
  keys: ["name", "keywords"],
  threshold: 0.4, // decrease threshold for more strict matching
});

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rmhelp")
    .setDescription("Search for a REDMAGIC help topic by name")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("The name of the help topic")
        .setRequired(true)
        .setAutocomplete(true),
    ),
  async execute(interaction) {
    const nameQuery = interaction.options.getString("name").toLowerCase();
    const entry = helpReplies.find(
      (e) => e.name && e.name.toLowerCase().includes(nameQuery),
    );

    if (entry) {
      await interaction.reply({ content: entry.reply });
      logStandardMessage(
        `Help topic "${entry.name}" provided to user <@${interaction.user.id}>.`,
        interaction.client,
      );
    } else {
      await interaction.reply({
        content:
          "No help topic found with that name <:Mora_crying:1226126158056132678>.",
      });
    }
  },
  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused().toLowerCase();
    let choices;
    if (!focusedValue) {
      // Show all help topics if nothing is typed
      choices = helpReplies
        .map((e) => e.name)
        .filter(Boolean)
        .slice(0, 25);
    } else {
      const result = fuse.search(focusedValue, { limit: 25 });
      choices = result.map((r) => r.item.name).filter(Boolean);
    }

    await interaction.respond(
      choices.map((choice) => ({ name: choice, value: choice })),
    );
  },
};
