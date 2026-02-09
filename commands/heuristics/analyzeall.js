const { SlashCommandBuilder, EmbedBuilder, MessageFlags, AttachmentBuilder } = require('discord.js');
const { calculateHeuristicScore, calculateHeuristicScoreDetailed } = require("../../utils/heuristics");
const fs = require('fs');
const path = require('path');
const { logErrorMessage } = require('../../utils/logging');
const { whitelistedRoleIds } = require('../../config.json');

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
            const memberData = [];

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
                    const scoreDetail = await calculateHeuristicScoreDetailed(member.user, interaction.client);
                    const score = scoreDetail.total;

                    if (score >= 7) {
                        highRiskCount++;
                    } else if (score >= 5) {
                        mediumRiskCount++;
                    }

                    memberData.push({
                        userId: member.user.id,
                        username: member.user.username,
                        tag: member.user.tag,
                        displayName: member.displayName || member.user.username,
                        riskScore: score,
                        riskLevel: score >= 7 ? 'HIGH' : score >= 5 ? 'MEDIUM' : 'LOW',
                        accountAge: scoreDetail.accountAge,
                        suspiciousUsername: scoreDetail.username,
                        noAvatar: scoreDetail.avatar,
                        noFlags: scoreDetail.flags,
                        raidWave: scoreDetail.raid,
                        noCosmetics: scoreDetail.cosmetics,
                        accountCreatedAt: member.user.createdAt.toISOString(),
                        joinedServerAt: member.joinedAt ? member.joinedAt.toISOString() : 'N/A',
                        roles: member.roles.cache.map(r => r.name).join('; ') || 'No roles'
                    });

                    console.log(`Calculated heuristic score for ${member.user.tag} (${member.user.id}): ${score}`);
                } catch (err) {
                    console.error(`Error scoring ${member.user.tag} (${member.user.id}):`, err);
                    memberData.push({
                        userId: member.user.id,
                        username: member.user.username,
                        tag: member.user.tag,
                        riskScore: 'ERROR',
                        riskLevel: 'ERROR',
                        error: err.message
                    });
                    failedCount++;
                }

                analyzed++;

                if (analyzed % 20 === 0 || analyzed === total) {
                    embed.setFields(
                        { name: 'Total', value: `${total}`, inline: true },
                        { name: ':white_check_mark: Analyzed', value: `${analyzed - failedCount}`, inline: true },
                        { name: ':hammer: Pending', value: `${Math.max(total - analyzed, 0)}`, inline: true },
                        { name: ':warning: Medium Risk', value: `${mediumRiskCount}`, inline: true },
                        { name: ':x: High Risk', value: `${highRiskCount}`, inline: true },
                        { name: ':no_entry: Failed', value: `${failedCount}`, inline: true }
                    );
                    try {
                        await interaction.editReply({ embeds: [embed] });
                    } catch (err) {
                        console.error("Error editing reply:", err);
                    }

                }
                // rate limit
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Generate CSV content
            const csvHeaders = ['User ID', 'Username', 'Tag', 'Display Name', 'Risk Score', 'Risk Level', 'Account Age Score', 'Suspicious Username', 'No Avatar', 'No Flags', 'Raid Wave Score', 'No Cosmetics', 'Account Created', 'Joined Server', 'Roles'];
            const csvRows = memberData.map(row => [
                row.userId,
                `"${row.username.replace(/"/g, '""')}"`,
                `"${row.tag.replace(/"/g, '""')}"`,
                `"${(row.displayName || '').replace(/"/g, '""')}"`,
                row.riskScore,
                row.riskLevel,
                row.accountAge || 0,
                row.suspiciousUsername || 0,
                row.noAvatar || 0,
                row.noFlags || 0,
                row.raidWave || 0,
                row.noCosmetics || 0,
                row.accountCreatedAt,
                row.joinedServerAt,
                `"${(row.roles || '').replace(/"/g, '""')}"`
            ]);

            const csvContent = [
                csvHeaders.join(','),
                ...csvRows.map(row => row.join(','))
            ].join('\n');

            // Save CSV to file
            const dataDir = path.join(__dirname, '../../data/csv');

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const csvFilePath = path.join(dataDir, `members-risk-${timestamp}.csv`);
            fs.writeFileSync(csvFilePath, csvContent);

            embed.setFields(
                { name: 'Total', value: `${total}`, inline: true },
                { name: ':white_check_mark: Analyzed', value: `${analyzed - failedCount}`, inline: true },
                { name: ':hammer: Pending', value: `0`, inline: true },
                { name: ':warning: Medium Risk', value: `${mediumRiskCount}`, inline: true },
                { name: ':x: High Risk', value: `${highRiskCount}`, inline: true },
                { name: ':no_entry: Failed', value: `${failedCount}`, inline: true },
                { name: 'CSV Export', value: `Saved to \`${path.basename(csvFilePath)}\``, inline: false }
            );
            embed.setTitle('Analysis complete');

            // Send CSV as attachment
            const attachment = new AttachmentBuilder(csvFilePath, { name: `members-risk-${timestamp}.csv` });
            await interaction.editReply({ embeds: [embed], files: [attachment] });

        } catch (err) {
            console.error("Error fetching members for heuristic scoring:", err);
            logErrorMessage(`Error fetching server members: ${err.message}`, interaction.client);
            interaction.editReply({ content: 'An error occurred while fetching members. Please check the logs for details.' });
        }


    }
}