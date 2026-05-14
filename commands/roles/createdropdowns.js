const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, MessageFlags } = require('discord.js');
const config = require('../../config.json');
const roles = require('../../data/roles.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('createdropdowns')
        .setDescription('Create the dropdowns for cosmetic roles')
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('The channel to create the roles dropdowns in')
                .setRequired(true)
        ),
    async execute(interaction) {

        if (!interaction.member.permissions.has('ManageRoles')) {
            return interaction.reply({ content: `Good try, but you can't use this bot <a:myredmagicreaction:1313432136367472681> `, flags: MessageFlags.Ephemeral });
        }

        const targetChannelId = config.reactRolesChannelId;

        const channel = interaction.options.getChannel('channel') || interaction.guild.channels.cache.get(targetChannelId);
        if (!channel || !channel.isTextBased()) {
            return interaction.reply({ content: 'Can not find the channel smh.', flags: MessageFlags.Ephemeral });
        }

        const phoneDropdown = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('phoneDropdown')
                .setPlaceholder('اختر هاتفك')
                .setMinValues(1)
                .setMaxValues(3)
                .addOptions(roles.phones.map(opt => ({ label: opt.label, value: opt.value, description: opt.description || undefined })))
        );

        const tabletDropdown = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('tabletDropdown')
                .setPlaceholder('اختر تابلتك')
                .setMinValues(1)
                .setMaxValues(2)
                .addOptions(roles.tablets.map(opt => ({ label: opt.label, value: opt.value, description: opt.description || undefined })))
        );

        const accessoryDropdown = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('accessoryDropdown')
                .setPlaceholder('اختر إكسسوارك')
                .setMinValues(1)
                .setMaxValues(1)
                .addOptions(roles.accessories.map(opt => ({ label: opt.label, value: opt.value, description: opt.description || undefined })))
        );

        const pcDropdown = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('pcDropdown')
                .setPlaceholder('اختر ملحق الكمبيوتر الخاص بك')
                .setMinValues(1)
                .setMaxValues(2)
                .addOptions(roles.pcPeripherals.map(opt => ({ label: opt.label, value: opt.value, description: opt.description || undefined })))
        );

        await channel.send({
            content: `هنا يمكنك اختيار أدوارك الشخصية.
إذا كنت تمتلك أكثر من جهاز، لا تتردد في التواصل مع أحد المشرفين.

لإزالة جميع أدوارك، اختر خيار "إزالة الكل" من القائمة.
` });
        await channel.send({ content: '-# يمكنك اختيار ما يصل إلى 3 أدوار للهواتف', components: [phoneDropdown] });
        await channel.send({ content: '-# يمكنك اختيار ما يصل إلى 2 أدوار للتابلت', components: [tabletDropdown] });
        await channel.send({ content: '-# يمكنك اختيار ما يصل إلى 1 دور للإكسسوارات', components: [accessoryDropdown] });
        await channel.send({ content: '-# يمكنك اختيار ما يصل إلى 2 أدوار لملحقات الكمبيوتر', components: [pcDropdown] });

        await interaction.reply({ content: 'Done!', flags: MessageFlags.Ephemeral });
    },
};