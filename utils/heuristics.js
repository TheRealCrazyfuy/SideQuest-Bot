const { UserFlags } = require("discord.js");
const { logStandardMessage } = require('./logging');

function calculateHeuristicScore(user, client) {
    let score = 0;

    score += accountAgeHeuristic(user);
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

function accountAgeHeuristic(user) {
    const accountAgeInDays = (Date.now() - user.createdTimestamp) / (1000 * 60 * 60 * 24);
    if (accountAgeInDays < 1) {
        return 4;
    } else if (accountAgeInDays < 7) {
        return 3;
    } else if (accountAgeInDays < 30) {
        return 2;
    } else if (accountAgeInDays < 90) {
        return 1;
    } else {
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

module.exports = {
    calculateHeuristicScore,
};