const { logStandardMessage } = require('../../utils/logging');
const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('test commands')
        .addSubcommand(subcommand =>
            subcommand
                .setName('log')
                .setDescription('send a log message')
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('The message to log')
                        .setRequired(true)
                ),
        ),
    async execute(interaction) {
        if (!interaction.member.permissions.has('ManageRoles') && !interaction.member.roles.cache.some(role => whitelistedRoleIds.includes(role.id))) {
            return interaction.reply({ content: `Good try, but you can't use this command <a:myredmagicreaction:1313432136367472681> `, flags: MessageFlags.Ephemeral });
        }

        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'log':
                const message = interaction.options.getString('message');
                await logStandardMessage(message, interaction.client);
                await interaction.reply({ content: 'Test log sent!', flags: MessageFlags.Ephemeral });
                break;
            default:
                await interaction.reply({ content: 'Unknown subcommand.', flags: MessageFlags.Ephemeral });
        }
    }
};