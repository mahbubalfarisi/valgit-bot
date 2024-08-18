// lib/bot.js
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs');
const pathToRepoPaths = path.resolve(__dirname, '../public/user-repo.json');
const axios = require('axios');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,               // Required to access the guilds
        GatewayIntentBits.GuildMessages,        // Required to read messages in guilds
        GatewayIntentBits.MessageContent,       // Required to read the message content (e.g., for commands)
        GatewayIntentBits.GuildMessageReactions // Required to handle reactions if your bot will use them
    ],
});

// Load or initialize user paths configuration
let userRepoPaths = {};
if (fs.existsSync(pathToRepoPaths)) {
    userRepoPaths = JSON.parse(fs.readFileSync(pathToRepoPaths, 'utf8'));
}

// Function to save user paths configuration
function saveUserRepoPaths() {
    fs.writeFileSync(pathToRepoPaths, JSON.stringify(userRepoPaths, null, 2));
}

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    // Skip messages from the bot itself or if the message doesn't start with the prefix
    if (message.author.bot || !message.content.startsWith('$')) return;

    const userID = message.author.id;
    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const branch = args[0] || 'main'; // Default to 'main' branch

    // Debugging response
    let debugInfo = `Raw message content: ${message.content}\n`;
    debugInfo += `Parsed arguments: ${args.join(', ')}\n`;
    debugInfo += `Command: ${command}\n`;
    debugInfo += `Branch: ${branch}\n`;

    if (command === 'setrepo') {
        const repoPath = args.join(', ');
        debugInfo += `Repository Path: ${repoPath}\n`;

        if (!repoPath) {
            return message.channel.send(`Debug Info:\n${debugInfo}\nPlease provide the path to the repository.`);
        }

        // Save the repository path for the user
        userRepoPaths[userID] = repoPath;
        saveUserRepoPaths();
        message.channel.send(`Repository path set to: ${repoPath}`);
    }
    else if (command === 'pull' || command === 'push') {
        const repoPath = userRepoPaths[userID];
        debugInfo += `Repository Path: ${repoPath}\n`;
        if (!repoPath) {
            return message.channel.send('No repository path set. Use $setrepo to set your repository path.');
        }

        // Ensure the path is formatted correctly for the environment
        // Convert to Unix-style path if running in Termux
        const formattedPath = repoPath.replace(/\\+/g, '/'); // Convert backslashes to slashes

        try {
            // const git = simpleGit(formattedPath, { binary: 'git' });

            if (command === 'pull') {
                const axios_path = `${formattedPath}trigger-pull`;
                debugInfo += `Axios Path: ${axios_path}\n`;

                await axios.get(axios_path);
                message.channel.send(`Git pull operation triggered at branch ${branch}`);
            }
            else if (command === 'push') {
                const axios_path = `${formattedPath}trigger-push`;
                debugInfo += `Axios Path: ${axios_path}\n`;
                
                await axios.get(axios_path);
                message.channel.send(`Successfully pushed to branch ${branch}`);
            }
        }
        catch (error) {
            message.channel.send(`Debug Info:\n${debugInfo}\nFailed to execute ${command} on branch ${branch}: ${error.message}`);
        }
    }
    else if (command === 'ping') {
        message.channel.send('Pong!');
    }
});

client.login(process.env.DISCORD_TOKEN);
