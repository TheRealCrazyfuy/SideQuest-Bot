const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('createverification')
        .setDescription('Create a verification message in a specified channel')
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('The channel to create the verification message in')
                .setRequired(true)
        ),
    async execute(interaction) {
        try {
            if (!interaction.member.permissions.has('ManageGuild')) {
                return interaction.reply({ content: `You don't have permission to use this command <a:myredmagicreaction:1313432136367472681>`, flags: MessageFlags.Ephemeral });
            }

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('verify_button')
                    .setLabel('✅ Start Verification')
                    .setStyle('Success'),
            );

            const channel = interaction.options.getChannel('channel')

            await channel.send({ content: 'Please click the button below to start the verification process.', components: [row] });
        } catch (error) {
            console.error('Error creating verification message:', error);
            await interaction.reply({ content: 'There was an error creating the verification message.', flags: MessageFlags.Ephemeral });
        }
    }
}