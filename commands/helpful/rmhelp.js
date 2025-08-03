const { SlashCommandBuilder } = require('discord.js');
const helpReplies = require('../../data/helpreplies.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rmhelp')
        .setDescription('Search for a REDMAGIC help topic by name')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('The name of the help topic')
                .setRequired(true)
                .setAutocomplete(true)
        ),
    async execute(interaction) {
        const nameQuery = interaction.options.getString('name').toLowerCase();
        const entry = helpReplies.find(e => e.name && e.name.toLowerCase().includes(nameQuery));

        if (entry) {
            await interaction.reply({ content: entry.reply});
        } else {
            await interaction.reply({ content: 'No help topic found with that name <:Mora_crying:1226126158056132678>.'});
        }
    },
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused().toLowerCase();
        const choices = helpReplies
            .filter(e => e.name)
            .map(e => e.name)
            .filter(name => name.toLowerCase().includes(focusedValue))
            .slice(0, 25); // 25 choice limit

        await interaction.respond(
            choices.map(choice => ({ name: choice, value: choice }))
        );
    }
};