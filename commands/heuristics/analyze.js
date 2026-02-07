const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { calculateHeuristicScore } = require('../../utils/heuristics');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('analyze')
        .setDescription('Analyzes a users risk level')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to analyze')
                .setRequired(true)),
    async execute(interaction) {
        if (!interaction.member.permissions.has('ManageRoles') || !interaction.member.permissions.has('TimeoutMembers')) {
            return interaction.reply({ content: `Good try, but you can't use this bot <a:myredmagicreaction:1313432136367472681> `, flags: MessageFlags.Ephemeral });
        }
        const targetUser = interaction.options.getUser('target');
        const row = new EmbedBuilder()
            .setColor('#FF4500')
            .setTitle('Risk analysis in progress')
            .setDescription(`<a:loading:1469839628533109021> analyzing ${targetUser.tag}...`)
            .setFooter({ text: 'Powered by AbejAI analyzer engine (Beta)' })
            .setTimestamp();

        await interaction.reply({ embeds: [row] });

        const score = calculateHeuristicScore(targetUser, interaction.client);

        const row2 = new EmbedBuilder()
            .setColor('#FF4500')
            .setTitle('Risk analysis result')
            .setFields(
                { name: 'User name', value: targetUser.tag, inline: true },
                { name: 'User', value: `<@${targetUser.id}>`, inline: true },
                { name: 'User ID', value: targetUser.id, inline: true },
                { name: 'Risk Score', value: score.toString(), inline: true }
            )
            .setFooter({ text: 'Powered by AbejAI analyzer engine (Beta)' })
            .setThumbnail(targetUser.displayAvatarURL())
            .setTimestamp();

        await interaction.editReply({ embeds: [row2] });
    }
}