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
                    // find the solved tag in the parent channel from tag id
                    const solvedTag = interaction.channel.parent.availableTags.find(
                        t => t.id == solvedTagId
                    );

                    // get current tags and add the solved tag if it's not already there
                    let updatedTags = [...(interaction.channel.appliedTags || [])];
                    if (updatedTags.length >= 5) {
                        updatedTags = updatedTags.slice(0, 4); // remove the last tag if there are already 5 tags
                    }
                    if (!updatedTags.includes(solvedTag.id)) {
                        updatedTags.push(solvedTag.id);
                    }
                    await interaction.channel.setAppliedTags(updatedTags);

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