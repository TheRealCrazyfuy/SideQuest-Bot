const { UserFlags } = require("discord.js");
const { logStandardMessage } = require('./logging');
const { heuristicsGuildId } = require('../config.json');

async function calculateHeuristicScore(user, client) {
    let score = 0;

    score += await accountAgeHeuristic(user, client);
    score += usernameHeuristic(user);
    score += avatarHeuristic(user);
    score += flagsHeuristic(user);
    score += raidWaveHeuristic();
    score += cosmeticsHeuristic(user);

    /*     logStandardMessage(`Calculated heuristic score for ${user.tag} (${user.id}):
            Age Heuristic: ${accountAgeHeuristic(user)}
            Username Heuristic: ${usernameHeuristic(user)}
            Avatar Heuristic: ${avatarHeuristic(user)}
            Flags Heuristic: ${flagsHeuristic(user)}
            Raid Wave Heuristic: ${raidWaveHeuristic()}
            Cosmetics Heuristic: ${cosmeticsHeuristic(user)}
            Total Score: ${score}`, client);
         */

    return score;
}

async function accountAgeHeuristic(user, client) {
    try {
        const guild = client.guilds.cache.get(heuristicsGuildId);
        if (!guild) {
            console.log('Guild not found:', heuristicsGuildId);
            return 0;
        }

        const cachedMember = guild.members.cache.get(user.id);
        const member = cachedMember || await guild.members.fetch(user.id);

        if (!member || !member.joinedTimestamp) {
            console.log('Member not found or no join timestamp:', user.id);
            return 0;
        }

        const accountAgeInDaysWhenJoined =
            (member.joinedTimestamp - user.createdTimestamp) / (1000 * 60 * 60 * 24);

        if (accountAgeInDaysWhenJoined < 1) return 4;
        if (accountAgeInDaysWhenJoined < 7) return 3;
        if (accountAgeInDaysWhenJoined < 30) return 2;
        if (accountAgeInDaysWhenJoined < 90) return 1;
        return 0;
    } catch (error) {
        console.error('accountAgeHeuristic error:', error);
        return 0;
    }
}


function usernameHeuristic(user) {
    if (/\d{5,}$/.test(user.username)) {
        return 3;
    } else {
        return 0;
    }
}

function avatarHeuristic(user) {
    if (!user.avatar) {
        return 1;
    } else {
        return 0;
    }
}

function flagsHeuristic(user) {
    const flags = user.flags;

    if (!flags || flags.toArray().length === 0) {
        return 2;
    }

    return 0;
}

const recentJoins = [];

function raidWaveHeuristic() {
    const now = Date.now();

    while (recentJoins.length && now - recentJoins[0] > 60000) {
        recentJoins.shift();
    }

    if (recentJoins.length > 10) return 5;
    if (recentJoins.length > 5) return 3;

    return 0;
}

function cosmeticsHeuristic(user) {
    if (user.collectibles || user.avatarDecorationData) {
        return 0;
    }
    return 1;
}

async function calculateHeuristicScoreDetailed(user, client) {
    const accountAge = await accountAgeHeuristic(user, client);
    const username = usernameHeuristic(user);
    const avatar = avatarHeuristic(user);
    const flags = flagsHeuristic(user);
    const raid = raidWaveHeuristic();
    const cosmetics = cosmeticsHeuristic(user);
    const total = accountAge + username + avatar + flags + raid + cosmetics;

    return {
        total,
        accountAge,
        username,
        avatar,
        flags,
        raid,
        cosmetics,
        accountCreatedAt: user.createdAt,
        hasAvatar: !!user.avatar,
    };
}

module.exports = {
    calculateHeuristicScore,
    calculateHeuristicScoreDetailed
};