const { EmbedBuilder } = require("discord.js");
const config = require("../config.json");

function logStandardMessage(message, client) {
    console.log(`[INFO]: ${message}`);
    const row = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('Info')
        .setDescription(message)
        .setTimestamp();

    const channel = client.channels.cache.get(config.logChannelId);
    if (channel) {
        channel.send({ embeds: [row] });
    }
}

function logErrorMessage(error, client) {
    console.error(`[ERROR]: ${error}`);
    const row = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('Error')
        .setDescription(error)
        .setTimestamp();
    const channel = client.channels.cache.get(config.logChannelId);
    if (channel) {
        channel.send({ embeds: [row] });
    }
}

function logSetRoles(member, roles, client) {
    console.log(roles)
    const roleList = roles.map(role => `<@&${role}>`).join(', ') || 'No roles assigned';
    const row = new EmbedBuilder()
        .setColor('#0000FF')
        .setTitle('Set Roles for User')
        .setFields(
            { name: 'User', value: `<@${member.id}>`, inline: true },
            { name: 'User ID', value: member.id, inline: true },
            { name: 'Roles', value: roleList, inline: false }
        )
        .setThumbnail(member.displayAvatarURL())
        .setTimestamp();
    const channel = client.channels.cache.get(config.logChannelId);
    if (channel) {
        channel.send({ embeds: [row] });
    }
}

function logThreadCreation(thread, client) {
    const row = new EmbedBuilder()
        .setColor('#FFFF00')
        .setTitle('Thread Created')
        .setFields(
            { name: 'Thread Name', value: thread.name, inline: true },
            { name: 'Thread ID', value: thread.id, inline: true },
            { name: 'Created By', value: `<@${thread.ownerId}>`, inline: true },
            { name: 'link', value: thread.url, inline: true }
        )
        .setTimestamp();
    const channel = client.channels.cache.get(config.logChannelId);
    if (channel) {
        channel.send({ embeds: [row] });
    }
}

function logThreadClosure(thread, closer, client) {
    const row = new EmbedBuilder()
        .setColor('#FFA500')
        .setTitle('Thread Closed')
        .setFields(
            { name: 'Thread Name', value: thread.name, inline: true },
            { name: 'Thread ID', value: thread.id, inline: true },
            { name: 'Created By', value: `<@${thread.ownerId}>`, inline: true },
            { name: 'Closed By', value: `<@${closer.id}>`, inline: true },
            { name: 'link', value: thread.url, inline: true }
        )
        .setTimestamp();
    const channel = client.channels.cache.get(config.logChannelId);
    if (channel) {
        channel.send({ embeds: [row] });
    }
}

module.exports = {
    logStandardMessage,
    logErrorMessage,
    logSetRoles,
    logThreadCreation,
    logThreadClosure
};