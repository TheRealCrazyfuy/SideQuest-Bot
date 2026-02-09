const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { calculateHeuristicScore } = require("../../utils/heuristics");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('analyzeall')
        .setDescription('Analyzes all users in the server and logs their risk levels'),
    async execute(interaction) {
        if (!interaction.member.permissions.has('ManageRoles') && !interaction.member.roles.cache.some(role => whitelistedRoleIds.includes(role.id))) {
            return interaction.reply({ content: `Good try, but you can't use this bot <a:myredmagicreaction:1313432136367472681> `, flags: MessageFlags.Ephemeral });
        }

        const guild = interaction.guild;

        if (!guild) {
            return interaction.reply({ content: 'Guild not found. Please check the logs for details.' });
        }

        try {
            const total = guild.memberCount || 0;

            if (total === 0) {
                return interaction.reply({ content: 'No members found in the guild.' });
            }

            let analyzed = 0;
            let mediumRiskCount = 0;
            let highRiskCount = 0;
            let failedCount = 0;

            const embed = new EmbedBuilder()
                .setTitle('<a:loading:1469839628533109021> Analyzing server members')
                .setColor(0xFF4500)
                .setFields(
                    { name: 'Total', value: `${total}`, inline: true },
                    { name: ':white_check_mark: Analyzed', value: `${analyzed - failedCount}`, inline: true },
                    { name: ':hammer: Pending', value: `${total - analyzed}`, inline: true },
                    { name: ':warning: Medium Risk', value: `${mediumRiskCount}`, inline: true },
                    { name: ':x: High Risk', value: `${highRiskCount}`, inline: true },
                    { name: ':no_entry: Failed', value: `${failedCount}`, inline: true }
                )
                .setFooter({ text: 'Powered by AbejAI analyzer engine (Beta)' })
                .setTimestamp();
                

            await interaction.reply({ embeds: [embed] });

            const fetched = await guild.members.fetch();

            for (const member of fetched.values()) {
                try {
                    const score = await calculateHeuristicScore(member.user, interaction.client);
                    if (score >= 7) {
                        highRiskCount++;
                    } else if (score >= 5) {
                        mediumRiskCount++;
                    }
                    console.log(`Calculated heuristic score for ${member.user.tag} (${member.user.id}): ${score}`);
                } catch (err) {
                    console.error(`Error scoring ${member.user.tag} (${member.user.id}):`, err);
                    failedCount++;
                }

                analyzed++;

                if (analyzed % 5 === 0 || analyzed === total) {
                    embed.setFields(
                        { name: 'Total', value: `${total}`, inline: true },
                        { name: ':white_check_mark: Analyzed', value: `${analyzed - failedCount}`, inline: true },
                        { name: ':hammer: Pending', value: `${Math.max(total - analyzed, 0)}`, inline: true },
                        { name: ':warning: Medium Risk', value: `${mediumRiskCount}`, inline: true },
                        { name: ':x: High Risk', value: `${highRiskCount}`, inline: true },
                        { name: ':no_entry: Failed', value: `${failedCount}`, inline: true }
                    );
                    await interaction.editReply({ embeds: [embed] });
                }

                // rate limit
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            embed.setFields(
                { name: 'Total', value: `${total}`, inline: true },
                { name: ':white_check_mark: Analyzed', value: `${analyzed - failedCount}`, inline: true },
                { name: ':hammer: Pending', value: `0`, inline: true },
                { name: ':warning: Medium Risk', value: `${mediumRiskCount}`, inline: true },
                { name: ':x: High Risk', value: `${highRiskCount}`, inline: true },
                { name: ':no_entry: Failed', value: `${failedCount}`, inline: true }
            );
            embed.setTitle('Analysis complete');
            await interaction.editReply({ embeds: [embed] });

        } catch (err) {
            console.error("Error fetching members for heuristic scoring:", err);
            interaction.editReply({ content: 'An error occurred while fetching members. Please check the logs for details.' });
        }


    }
}