const { logStandardMessage, logHeuristicWarning } = require('../../utils/logging');
const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require('discord.js');
const { whitelistedRoleIds } = require('../../config.json');

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
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('analyzenewmember')
                .setDescription('test analyze new member')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('selfroles')
                .setDescription('check that all selfroles exist and are valid')
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
            case 'analyzenewmember':
                const member = interaction.member;
                const { calculateHeuristicScore } = require('./../../utils/heuristics');
                const score = await calculateHeuristicScore(member.user, member.client);
                logHeuristicWarning(member.user, score, member.client);
                await interaction.reply({ content: 'Check the logs for the analysis.', flags: MessageFlags.Ephemeral });
                break;
            case 'selfroles':
                await this.checkselfroles(interaction);
                break;
            default:
                await interaction.reply({ content: 'Unknown subcommand.', flags: MessageFlags.Ephemeral });
        }
    },

    async checkselfroles(interaction) {
        await interaction.deferReply();

        const rolesData = require('./../../data/roles.json');
        const guild = interaction.guild;
        const phoneroles = [];
        const tabletroles = [];
        const accessorieroles = [];
        const pcroles = [];

        const categoryMap = {
            phones: phoneroles,
            tablets: tabletroles,
            accessories: accessorieroles,
            pcPeripherals: pcroles,
        };

        const roleCategories = {
            phones: rolesData.phones || [],
            tablets: rolesData.tablets || [],
            accessories: rolesData.accessories || [],
            pcPeripherals: rolesData.pcPeripherals || [],
        };

        for (const [categoryKey, roleList] of Object.entries(roleCategories)) {
            for (const roleData of roleList) {
                const role = guild.roles.cache.get(roleData.roleId);
                const status = role ? '✅' : '❌';
                const line = `${status} ${roleData.label || 'Unnamed role'} -> <@&${roleData.roleId}>\n`;
                categoryMap[categoryKey].push(line);
            }
        }

        const embed = new EmbedBuilder()
            .setTitle('Selfrole Test')
            .addFields(
                { name: 'Phone Roles', value: phoneroles.join('\n') || 'No roles found', inline: true },
                { name: 'Tablet Roles', value: tabletroles.join('\n') || 'No roles found', inline: true },
                { name: 'Accessory Roles', value: accessorieroles.join('\n') || 'No roles found', inline: true },
                { name: 'PC Roles', value: pcroles.join('\n') || 'No roles found', inline: true },
            )
            .setColor('#fff700');

        await interaction.editReply({ embeds: [embed] });
    }
};