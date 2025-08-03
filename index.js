const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, MessageFlags, ChannelType } = require('discord.js');
const { token, clientId, forumChannelId } = require('./config.json');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent] });

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

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

client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
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
        } else if (interaction.customId === 'accessoryDropdown') {
            options = rolesData.accessories;
        } else if (interaction.customId === 'pcDropdown') {
            options = rolesData.pcPeripherals;
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
            }
        }
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
    }
});

const forumReplies = require('./data/helpreplies.json');

client.on('threadCreate', async thread => {
    // make sure the thread is a forum post
    if (thread.parent && thread.parent.type === ChannelType.GuildForum && thread.parentId == forumChannelId) {
        console.log(`New forum post created: ${thread.name} in ${thread.parent.name}`);

        try {
            await new Promise(resolve => setTimeout(resolve, 5000)); // delay because discord dont know how to make a proper api
            const starterMessage = await thread.fetchStarterMessage();
            if (!starterMessage) return;

            console.log(`Starter message content: ${starterMessage.content}`);
            const content = starterMessage.content.toLowerCase();
            let reply = forumReplies[forumReplies.length - 1].reply; // Default reply
            let afterReply = "\n\nPlease add the solved tag to your post and close it afterwards, when your issue has been resolved.";

            for (const entry of forumReplies) {
                for (const keyword of entry.keywords) {
                    if (keyword && (content.includes(keyword.toLowerCase()) || thread.name.toLowerCase().includes(keyword.toLowerCase()))) {
                        reply = entry.reply;
                        break;
                    }
                }
                //if (reply !== forumReplies[forumReplies.length - 1].reply) break; // stop searching if we found a match
            }

            thread.send(reply + afterReply);
        } catch (err) {
            console.error('Error fetching starter message or replying to a thread:', err);
        }
    }
});


client.login(token);