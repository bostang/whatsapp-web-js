const fs = require('fs');
const path = require('path');

const config = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../data/config.json'), 'utf8'));
const appAliases = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../data/aliases.json'), 'utf8'));

const log = (message, ...params) => {
    if (config.debug) console.log(message, ...params);
};

const resolveAppId = (input) => {
    const lowerInput = input.toLowerCase().trim();
    return appAliases[lowerInput] || input.toUpperCase();
};

module.exports = { config, log, resolveAppId };