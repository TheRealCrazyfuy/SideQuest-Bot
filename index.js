const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, MessageFlags, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { token, clientId, forumChannelId, solvedTagId } = require('./config.json');
const Fuse = require('fuse.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent] });

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

const helpReplies = require('./data/helpreplies.json');
const { logStandardMessage, logSetRoles, logErrorMessage, logThreadCreation, logThreadClosure } = require('./utils/logging');
const fuse = new Fuse(helpReplies, {
    keys: ['keywords', 'name', 'reply'],
    threshold: 0.6 // decrease threshold for more strict matching
});

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        // Set a new item in the Collection with the key as the command name and the value as the exported module
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

function searchHelpTopics(fuse, content, threadName, limit = 4) {
    const text = (content + ' ' + threadName).toLowerCase();

    let results = fuse.search(text, { limit });
    let uniqueResults = [];
    const seen = new Set();

    for (const result of results) {
        if (!seen.has(result.item.name)) {
            seen.add(result.item.name);
            uniqueResults.push(result);
        }
        if (uniqueResults.length >= limit) break;
    }

    return uniqueResults.slice(0, limit).map(r => r.item);
}

client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    logStandardMessage(`${readyClient.user.tag} restarted and is now online.`, readyClient);
});

client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
            } else {
                logErrorMessage(`Error executing command ${interaction.commandName} for user ${interaction.user.id}: ${error}`, interaction.client);
                await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
            }
        }
    }
    else if (interaction.isStringSelectMenu()) {
        const rolesData = require('./data/roles.json');
        let options = [];

        // Check which menu was used
        if (interaction.customId === 'phoneDropdown') {
            options = rolesData.phones;
        } else if (interaction.customId === 'tabletDropdown') {
            options = rolesData.tablets;
        } else if (interaction.customId === 'accessoryDropdown') {
            options = rolesData.accessories;
        } else if (interaction.customId === 'pcDropdown') {
            options = rolesData.pcPeripherals;
        } else if (interaction.customId === 'gameNightDropdown') {
            options = rolesData.gameNightEvent;
        }

        const selected = interaction.values;
        const member = await interaction.guild.members.fetch(interaction.user.id);

        // All possible role IDs for this category
        const allCategoryRoleIds = options.map(opt => opt.roleId).filter(Boolean);

        // Remove all roles from this category
        for (const roleId of allCategoryRoleIds) {
            if (member.roles.cache.has(roleId)) {
                try {
                    await member.roles.remove(roleId);
                } catch (err) {
                    console.error(`Failed to remove role ${roleId}:`, err);
                }
            }
        }

        // Add the selected roles
        const roleIds = options
            .filter(opt => selected.includes(opt.value))
            .map(opt => opt.roleId)
            .filter(Boolean);
        for (const roleId of roleIds) {
            try {
                await member.roles.add(roleId);
            } catch (err) {
                console.error(`Failed to add role ${roleId}:`, err);
                logErrorMessage(`Failed to add role ${roleId} to user ${member.id}: ${err}`, interaction.client);
            }
        }
        logSetRoles(member, roleIds, interaction.client);
        await interaction.reply({ content: `Updated your roles <:mora_popcorn:1133350731357896744> `, ephemeral: true });
    } else if (interaction.isAutocomplete()) {
        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.autocomplete(interaction);
        } catch (error) {
            console.error(error);
        }
    } else if (interaction.isButton() && interaction.customId.startsWith('forum_help_')) {
        // Find the thread and the possibleHelpTopics again
        const idx = parseInt(interaction.customId.replace('forum_help_', ''), 10);

        // Fetch the thread's starter message to get the content
        let starterMessage;
        try {
            starterMessage = await interaction.channel.fetchStarterMessage();
        } catch (e) {
            console.error('Error fetching starter message:', e);
            await interaction.reply({ content: 'Sorry the initial thread message got deleted.', flags: MessageFlags.Ephemeral });
            return;
        }
        const content = starterMessage ? starterMessage.content.toLowerCase() : '';
        const threadName = interaction.channel.name.toLowerCase();

        // Use Fuse to get up to 4 best matches
        const possibleHelpTopics = searchHelpTopics(fuse, content, threadName, 4);

        const topic = possibleHelpTopics[idx];
        if (topic) {
            logStandardMessage(`Provided help topic "${topic.name}" to user <@${interaction.user.id}> in thread "${interaction.channel.url}".`, interaction.client);
            await interaction.reply({ content: topic.reply, flags: MessageFlags.Ephemeral });
        } else {
            await interaction.reply({ content: 'Help topic not found.', flags: MessageFlags.Ephemeral });
        }
        return;
    } else if (interaction.isButton() && interaction.customId === 'close_thread') {
        // Close the thread
        if (interaction.channel.isThread()) {
            try {
                if (interaction.user.id == interaction.channel.ownerId || interaction.member.permissions.has('ManageThreads')) {
                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('confirm_close_thread')
                            .setLabel('✅Confirm Close')
                            .setStyle(ButtonStyle.Danger),
                    );
                    await interaction.reply({ content: 'Do you want to close this thread?', components: [row], flags: MessageFlags.Ephemeral });
                } else {
                    await interaction.reply({ content: 'You do not have permission to close this thread <:MoraCabbage:1222196835142205471>.', flags: MessageFlags.Ephemeral });
                }
            } catch (err) {
                logErrorMessage(`Error sending closing confirmation on ${interaction.channel.url}: ${err}`, interaction.client);
                await interaction.reply({ content: 'There was an error closing the thread.', flags: MessageFlags.Ephemeral });
            }
        } else {
            await interaction.reply({ content: 'This command can only be used in a thread <:Mora_Scream:1388103624181158020>.', flags: MessageFlags.Ephemeral });
        }
    } else if (interaction.isButton() && interaction.customId === 'confirm_close_thread') {
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
                await interaction.channel.setArchived(true);
                logThreadClosure(interaction.channel, interaction.user, interaction.client);
            } else {
                await interaction.reply({ content: 'You do not have permission to close this thread <:MoraCabbage:1222196835142205471>.', flags: MessageFlags.Ephemeral });
            }
        } catch (err) {
            logErrorMessage(`Error closing thread ${interaction.channel.url}: ${err}`, interaction.client);
            console.error('Error closing thread:', err);
            await interaction.reply({ content: 'There was an error closing the thread.', flags: MessageFlags.Ephemeral });
        }
    }

});

client.on('threadCreate', async thread => {
    // make sure the thread is a forum post
    if (thread.parent && thread.parent.type === ChannelType.GuildForum && thread.parentId == forumChannelId) {
        console.log(`New forum post created: ${thread.name} in ${thread.parent.name}`);
        logThreadCreation(thread, thread.client);

        try {
            await new Promise(resolve => setTimeout(resolve, 5000)); // delay because discord dont know how to make a proper api
            const starterMessage = await thread.fetchStarterMessage();
            if (!starterMessage) return;

            console.log(`Starter message content: ${starterMessage.content}`);
            const content = starterMessage.content.toLowerCase();
            const threadName = thread.name.toLowerCase();

            const possibleHelpTopics = searchHelpTopics(fuse, content, threadName, 4);

            let reply = ""
            let preReply = "Hey there thank you for making a post in the forum! A User or member of our team will respond to your post as soon as possible.\n\n";
            let afterReply = "When your issue is resolved, please remember to close the thread by clicking the 'Close Thread' button below or doing `/close` command, thank you <:mora_cheer:925660965448609842>.\n\n";

            if (possibleHelpTopics.length > 0) {
                preReply += `**Looking through your post I found some help topics that could be helpful for you:**\n`;
                for (let i = 0; i < possibleHelpTopics.length; i++) {
                    preReply += `**${i + 1}.** ${possibleHelpTopics[i].name}\n`;
                }

                // Create buttons for each topic
                const row = new ActionRowBuilder().addComponents(
                    possibleHelpTopics.map((topic, idx) =>
                        new ButtonBuilder()
                            .setCustomId(`forum_help_${idx}`)
                            .setLabel(`📝View help ${idx + 1}`)
                            .setStyle(ButtonStyle.Primary)
                    )
                        .concat(
                            new ButtonBuilder()
                                .setCustomId('close_thread')
                                .setLabel('✅Close Thread')
                                .setStyle(ButtonStyle.Success)
                        )
                );

                reply = preReply + "\n" + afterReply;
                await thread.send({ content: reply, components: [row] });
            } else {
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('close_thread')
                        .setLabel('✅Close Thread')
                        .setStyle(ButtonStyle.Success)
                );
                // No matches, just send the default reply
                await thread.send({ content: preReply + afterReply, components: [row] });
            }
        } catch (err) {
            logErrorMessage(`Error replying to thread ${thread.url}: ${err}`, thread.client);
            console.error('Error fetching starter message or replying to a thread:', err);
        }
    }
});


client.login(token);