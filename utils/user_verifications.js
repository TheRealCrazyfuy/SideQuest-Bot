module.exports = {
    createVerificationModal,
    handleVerificationResponse
};

const { ModalBuilder, LabelBuilder, TextInputStyle, MessageFlags, TextInputBuilder } = require('discord.js');
const { generateRandomInteger } = require('./random_generators');
const config = require('../config.json');

async function createVerificationModal(interaction) {
    try {
        const integer1 = generateRandomInteger(1, 10);
        const integer2 = generateRandomInteger(1, 10);
        const correctAnswer = integer1 + integer2;

        const modal = new ModalBuilder().setCustomId(`verification_modal_${correctAnswer}`).setTitle('Let\'s get verified!');

        const user_input = new TextInputBuilder()
            .setCustomId('verification_user_response')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('');

        const label_modal = new LabelBuilder()
            .setLabel(`Verification Question: What is ${integer1} + ${integer2}?`)
            .setDescription('This helps us verify you are not a bot.')
            .setTextInputComponent(user_input);

        modal.addLabelComponents(label_modal);

        await interaction.showModal(modal);
    } catch (error) {
        console.error('Error during verification:', error);
        await interaction.reply({ content: 'There was an error during verification.', flags: MessageFlags.Ephemeral });
    }
}

async function handleVerificationResponse(interaction) {
    try {
        const userResponse = interaction.fields.getTextInputValue('verification_user_response');
        if (userResponse.trim() === interaction.customId.split('_').pop()) {
            const member = await interaction.guild.members.fetch(interaction.user.id);
            await member.roles.add(config.verificationRoleId);
            await interaction.reply({ content: 'Verification successful! You have access to the server.', flags: MessageFlags.Ephemeral });
        } else {
            await interaction.reply({ content: 'Verification failed. Please try again.', flags: MessageFlags.Ephemeral });
        }
    } catch (error) {
        console.error('Error processing verification modal:', error);
        await interaction.reply({ content: 'There was an error processing your verification.', flags: MessageFlags.Ephemeral });
    }
}

