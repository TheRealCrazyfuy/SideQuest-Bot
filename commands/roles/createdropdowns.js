const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");
const config = require("../../config.json");
const roles = require("../../data/roles.json");
const { logStandardMessage } = require("../../utils/logging");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("createdropdowns")
    .setDescription("Create the dropdowns for cosmetic roles")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The channel to create the roles dropdowns in")
        .setRequired(true),
    ),
  async execute(interaction) {
    if (!interaction.member.permissions.has("ManageRoles")) {
      return interaction.reply({
        content: `Good try, but you can't use this bot <a:myredmagicreaction:1313432136367472681> `,
        ephemeral: true,
      });
    }

    const targetChannelId = config.reactRolesChannelId;

    const channel =
      interaction.options.getChannel("channel") ||
      interaction.guild.channels.cache.get(targetChannelId);
    if (!channel || !channel.isTextBased()) {
      return interaction.reply({
        content: "Can not find the channel smh.",
        ephemeral: true,
      });
    }

    const phoneDropdown = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("phoneDropdown")
        .setPlaceholder("Choose a phone")
        .setMinValues(1)
        .setMaxValues(3)
        .addOptions(
          roles.phones.map((opt) => ({
            label: opt.label,
            value: opt.value,
            description: opt.description || undefined,
          })),
        ),
    );

    const tabletDropdown = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("tabletDropdown")
        .setPlaceholder("Choose a tablet")
        .setMinValues(1)
        .setMaxValues(2)
        .addOptions(
          roles.tablets.map((opt) => ({
            label: opt.label,
            value: opt.value,
            description: opt.description || undefined,
          })),
        ),
    );

    const accessoryDropdown = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("accessoryDropdown")
        .setPlaceholder("Choose an accesory")
        .setMinValues(1)
        .setMaxValues(1)
        .addOptions(
          roles.accessories.map((opt) => ({
            label: opt.label,
            value: opt.value,
            description: opt.description || undefined,
          })),
        ),
    );

    const pcDropdown = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("pcDropdown")
        .setPlaceholder("Choose a PC peripheral")
        .setMinValues(1)
        .setMaxValues(2)
        .addOptions(
          roles.pcPeripherals.map((opt) => ({
            label: opt.label,
            value: opt.value,
            description: opt.description || undefined,
          })),
        ),
    );

    const gameNightDropdowns = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("gameNightDropdown")
        .setPlaceholder("Choose an event role")
        .setMinValues(1)
        .setMaxValues(2)
        .addOptions(
          roles.gameNightEvent.map((opt) => ({
            label: opt.label,
            value: opt.value,
            description: opt.description || undefined,
          })),
        ),
    );

    await channel.send({
      content: `Please take your cosmetic Roles here.
In case you own more devices, feel free to ask a Mod.

To remove all your roles choose the "Remove all" option in the dropdown.
`,
    });
    await channel.send({
      content: "-# You can choose up to 3 Phone roles",
      components: [phoneDropdown],
    });
    await channel.send({
      content: "-# You can choose up to 2 Tablet roles",
      components: [tabletDropdown],
    });
    await channel.send({
      content: "-# You can choose up to 1 Accessory roles",
      components: [accessoryDropdown],
    });
    await channel.send({
      content: "-# You can choose up to 2 PC peripheral roles",
      components: [pcDropdown],
    });
    await channel.send({
      content: "-# You can choose up to 2 event roles",
      components: [gameNightDropdowns],
    });

    await interaction.reply({ content: "Done!", ephemeral: true });

    logStandardMessage(
      `Roles dropdowns created in <#${channel.id}> by <@${interaction.user.id}>.`,
      interaction.client,
    );
  },
};
