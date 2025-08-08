const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { solvedTagId } = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('close')
        .setDescription('Closes the current thread'),
    async execute(interaction) {
        // Close the thread
        if (interaction.channel.isThread()) {
            try {
                if (interaction.user.id == interaction.channel.ownerId || interaction.member.permissions.has('ManageThreads')) {
                    // add tag to the thread while keeping the already applied tags
                    const currentTags = interaction.channel.appliedTags || [];
                    // make sure we dont have 5 tags already
                    if (currentTags.length >= 5) {
                        await interaction.channel.setAppliedTags(currentTags.slice(0, 4)); // keep only the first 4 tags
                    }
                    await interaction.channel.setAppliedTags([...currentTags, solvedTagId]);

                    await interaction.channel.setLocked(true);
                    await interaction.reply({ content: 'Thread has been closed successfully <:Mora_Agree:1380160309771374624>.' });
                } else {
                    await interaction.reply({ content: 'You do not have permission to close this thread <:MoraCabbage:1222196835142205471>.', flags: MessageFlags.Ephemeral });
                }
            } catch (err) {
                console.error('Error closing thread:', err);
                await interaction.reply({ content: 'There was an error closing the thread.', flags: MessageFlags.Ephemeral });
            }
        } else {
            await interaction.reply({ content: 'This command can only be used in a thread <:Mora_Scream:1388103624181158020>.', flags: MessageFlags.Ephemeral });
        }
    },
}