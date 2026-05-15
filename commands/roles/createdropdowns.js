const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, ModalBuilder, TextDisplayBuilder, MessageFlags, ButtonBuilder, LabelBuilder } = require('discord.js');
const config = require('../../config.json');
const roles = require('../../data/roles.json');
const { logStandardMessage, logSetRoles } = require('../../utils/logging');

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

        const button = new ButtonBuilder()
            .setCustomId('open_cosmetic_roles_modal')
            .setLabel('Select roles')
            .setStyle('Primary');

        const row = new ActionRowBuilder()
            .addComponents(button);

        await channel.send({
            content: 'Please take your cosmetic Roles here.\nIn case you own more devices, feel free to ask a Mod.', components: [row]
        });

        await interaction.reply({ content: 'Done!', flags: MessageFlags.Ephemeral });

        logStandardMessage(`Roles dropdowns created in <#${channel.id}> by <@${interaction.user.id}>.`, interaction.client);
    },

    async handleButtonInteraction(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('cosmetic_roles_modal')
            .setTitle('Select your roles');

        const infoText = new TextDisplayBuilder()
            .setContent('You can select your cosmetic roles below.\n:information_source: If you selected roles before, you will have to select them again or they will be cleared.\n\n:warning: Please only take the roles of devices you actually own <:Dreamy_Mora:1387802057309819010>');

        const phoneDropdown = new StringSelectMenuBuilder()
            .setRequired(false)
            .setCustomId('phoneDropdown')
            .setPlaceholder('Choose a phone')
            .setMinValues(0)
            .setMaxValues(3)
            .addOptions(roles.phones.map(opt => ({ label: opt.label, value: opt.value, description: opt.description || undefined })));

        const tabletDropdown = new StringSelectMenuBuilder()
            .setRequired(false)
            .setCustomId('tabletDropdown')
            .setPlaceholder('Choose a tablet')
            .setMinValues(0)
            .setMaxValues(2)
            .addOptions(roles.tablets.map(opt => ({ label: opt.label, value: opt.value, description: opt.description || undefined })));

        const accessoryDropdown = new StringSelectMenuBuilder()
            .setRequired(false)
            .setCustomId('accessoryDropdown')
            .setPlaceholder('Choose an accessory')
            .setMinValues(0)
            .setMaxValues(1)
            .addOptions(roles.accessories.map(opt => ({ label: opt.label, value: opt.value, description: opt.description || undefined })));

        const pcDropdown = new StringSelectMenuBuilder()
            .setRequired(false)
            .setCustomId('pcDropdown')
            .setPlaceholder('Choose a PC peripheral')
            .setMinValues(0)
            .setMaxValues(2)
            .addOptions(roles.pcPeripherals.map(opt => ({ label: opt.label, value: opt.value, description: opt.description || undefined })));

        modal.addTextDisplayComponents(infoText);
        modal.addLabelComponents(
            new LabelBuilder().setLabel('You can choose up to 3 Phone roles').setStringSelectMenuComponent(phoneDropdown),
            new LabelBuilder().setLabel('You can choose up to 2 Tablet roles').setStringSelectMenuComponent(tabletDropdown),
            new LabelBuilder().setLabel('You can choose 1 Accessory role').setStringSelectMenuComponent(accessoryDropdown),
            new LabelBuilder().setLabel('You can choose up to 2 PC Peripheral roles').setStringSelectMenuComponent(pcDropdown),
        );

        await interaction.showModal(modal);

    },

    async handleModalSubmit(interaction) {

        const rolesData = require('../../data/roles.json');

        const selectedPhoneRoles = interaction.fields.getStringSelectValues('phoneDropdown') || [];
        const selectedTabletRoles = interaction.fields.getStringSelectValues('tabletDropdown') || [];
        const selectedAccessoryRoles = interaction.fields.getStringSelectValues('accessoryDropdown') || [];
        const selectedPcRoles = interaction.fields.getStringSelectValues('pcDropdown') || [];

        const selectedValues = [
            ...selectedPhoneRoles,
            ...selectedTabletRoles,
            ...selectedAccessoryRoles,
            ...selectedPcRoles,
        ];

        const allRoles = [
            ...rolesData.phones,
            ...rolesData.tablets,
            ...rolesData.accessories,
            ...rolesData.pcPeripherals,
        ];

        const allRoleIds = allRoles.map(role => role.roleId).filter(Boolean);
        const member = interaction.member;

        for (const roleId of allRoleIds) {
            if (member.roles.cache.has(roleId)) {
                try {
                    await member.roles.remove(roleId);
                } catch (err) {
                    console.error(`Failed to remove role ${roleId}:`, err);
                }
            }
        }

        const roleIdsToAdd = allRoles
            .filter(role => selectedValues.includes(role.value))
            .map(role => role.roleId)
            .filter(Boolean);

        for (const roleId of roleIdsToAdd) {
            try {
                await member.roles.add(roleId);
            } catch (err) {
                console.error(`Failed to add role ${roleId}:`, err);
            }
        }
        logSetRoles(interaction.user, roleIdsToAdd, interaction.client);
        await interaction.reply({
            content: `Updated your roles <:mora_popcorn:1133350731357896744>\nNote: Please only take the roles of devices you actually own <:Dreamy_Mora:1387802057309819010>`,
            flags: MessageFlags.Ephemeral,
        });
    },
};