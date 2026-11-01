const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, EmbedBuilder, TextInputBuilder, TextInputStyle, LabelBuilder, MessageFlags } = require('discord.js');

const { logStandardMessage, logErrorMessage } = require('../../utils/logging');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('createverificationmessage')
        .setDescription('Create a verification message for new users')
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('The channel to create the message in')
                .setRequired(true)
        ),
    async execute(interaction) {
        if (!interaction.member.permissions.has('ManageRoles')) {
            return interaction.reply({ content: `Good try, but you cannot use this command <a:myredmagicreaction:1313432136367472681> `, flags: MessageFlags.Ephemeral });
        }

        try {
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('verification_button')
                        .setLabel('Verify')
                        .setEmoji('1387802040629203087')
                        .setStyle('Primary'),
                );

            const embed = new EmbedBuilder()
                .setTitle('<:Redmagic:1061836445255483412> To unlock access to the chat channels you must verify.')
                .setDescription('There\'s a secret code hidden in the <#897394944656945162> channel that you must find, then you can click the button below and input the code to become verified.')
                .setFooter({ text: '<:Mora_OH_BOY:1387802040629203087> Protected by Mora' })
                .setColor('#FFA500');

            await interaction.channel.send({
                embeds: [embed],
                components: [row],
            });
            logStandardMessage(`Verification message created in channel ${interaction.channel.name} <#${interaction.channel.id}> by ${interaction.user.tag} <@${interaction.user.id}>`, interaction.client);
            await interaction.reply({ content: 'Verification message created successfully!', flags: MessageFlags.Ephemeral });
        } catch (error) {
            console.error('Error creating verification message:', error);
            await interaction.reply({ content: 'There was an error creating the verification message.', flags: MessageFlags.Ephemeral });
        }
    },
};