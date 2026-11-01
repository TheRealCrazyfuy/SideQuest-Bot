const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, LabelBuilder, MessageFlags } = require('discord.js');

const { logStandardMessage, logErrorMessage } = require('../../utils/logging');
const { verificationRoleId, verificationCode } = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verify')
        .setDescription('Verify yourself to unlock full access to the server'),
    async execute(interaction) {
        try {

            const modal = new ModalBuilder()
                .setCustomId('verification_modal')
                .setTitle('Let\'s get verified!');

            const user_input = new TextInputBuilder()
                .setCustomId('verification_user_response')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('');

            const label_modal = new LabelBuilder()
                .setLabel('Input the verification code')
                .setDescription('The code is hidden in the rules channel. ')
                .setTextInputComponent(user_input);

            modal.addLabelComponents(label_modal);


            await interaction.showModal(modal);
        } catch (error) {
            console.error('Error creating verification message:', error);
            await interaction.reply({ content: 'There was an error creating the verification message.', flags: MessageFlags.Ephemeral });
        }
    },

    async handleVerificationResponse(interaction) {
        try {
            const userResponse = interaction.fields.getTextInputValue('verification_user_response');
            const correctAnswer = verificationCode;
            const member = await interaction.guild.members.fetch(interaction.user.id);

            if (userResponse.trim() == correctAnswer) {
                if (member.roles.cache.has(verificationRoleId)) {
                    await interaction.reply({ content: 'You found a secret! Take a cookie :cookie:', flags: MessageFlags.Ephemeral });
                    return;
                } else {
                    await member.roles.add(verificationRoleId);
                    logStandardMessage(`User ${interaction.user.tag} <@${interaction.user.id}> successfully verified into the server.`, interaction.client);
                    await interaction.reply({ content: '<a:Mora_Cheeks:1563093928583106641> Verification successful! You now have full access to the server.', flags: MessageFlags.Ephemeral });
                }
            } else {
                if (!member.roles.cache.has(verificationRoleId)) { // Do not log if the user is already verified
                    logErrorMessage(`User ${interaction.user.tag} <@${interaction.user.id}> failed verification with response: ${userResponse}`, interaction.client);
                }
                await interaction.reply({ content: '<:morahmmm:1491635519115886593> Wrong code. You\'re such a bad boy!', flags: MessageFlags.Ephemeral });
            }
        } catch (error) {
            logErrorMessage(`Error processing verification modal for user ${interaction.user.tag} <@${interaction.user.id}>: ${error}`, interaction.client);
            console.error('Error processing verification modal:', error);
            await interaction.reply({ content: 'There was an error processing your verification.', flags: MessageFlags.Ephemeral });
        }
    }
}