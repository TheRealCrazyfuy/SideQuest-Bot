const { EmbedBuilder } = require("discord.js");
const config = require("../config.json");

async function sendLogEmbed(client, embed) {
    const channel = client.channels.cache.get(config.logChannelId);
    try {
        if (channel) {
            await channel.send({ embeds: [embed] });
        } else {
            console.error('Log channel not found');
        }
    } catch (error) {
        console.error('Failed to send log message:', error);
    }
}

async function logStandardMessage(message, client) {
    console.log(`[INFO]: ${message}`);
    const row = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('Info')
        .setDescription(message)
        .setTimestamp();

    await sendLogEmbed(client, row);
}

async function logErrorMessage(error, client) {
    console.error(`[ERROR]: ${error}`);
    const row = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('Error')
        .setDescription(error)
        .setTimestamp();
    await sendLogEmbed(client, row);
}

async function logSetRoles(member, roles, client) {
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

    await sendLogEmbed(client, row);
}

async function logThreadCreation(thread, client) {
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

    await sendLogEmbed(client, row);
}

async function logThreadClosure(thread, closer, client) {
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

    await sendLogEmbed(client, row);
}

async function logHeuristicWarning(user, score, client) {
    let scoreString;
    if (score >= 7) {
        scoreString = `**:x: ${score}**`;
    } else if (score >= 5) {
        scoreString = `**:warning: ${score}**`;
    } else {
        scoreString = `**${score}**`;
    }
    const row = new EmbedBuilder()
        .setColor('#FF4500')
        .setTitle('Risk user detected')
        .setFields(
            { name: 'User name', value: user.tag, inline: true },
            { name: 'User', value: `<@${user.id}>`, inline: true },
            { name: 'User ID', value: user.id, inline: true },
            { name: 'Account age (days)', value: `${Math.floor((Date.now() - user.createdTimestamp) / (1000 * 60 * 60 * 24))}`, inline: true },
            { name: 'Risk Score', value: scoreString, inline: true }
        )
        .setFooter({ text: 'Powered by AbejAI analyzer engine (Beta)' })
        .setThumbnail(user.displayAvatarURL())
        .setTimestamp();

    await sendLogEmbed(client, row);
}

module.exports = {
    logStandardMessage,
    logErrorMessage,
    logSetRoles,
    logThreadCreation,
    logThreadClosure,
    logHeuristicWarning
};