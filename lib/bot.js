// lib/bot.js
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const path = require('path');
const fs = require('fs');
const pathToRepoPaths = path.resolve(__dirname, '../public/user-repo.json');
const gitActionLog = path.resolve(__dirname, '../public/action-log.json');
const axios = require('axios');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,               // Required to access the guilds
        GatewayIntentBits.GuildMessages,        // Required to read messages in guilds
        GatewayIntentBits.MessageContent,       // Required to read the message content (e.g., for commands)
        GatewayIntentBits.GuildMessageReactions // Required to handle reactions if your bot will use them
    ],
});

// LOG SETUP
// const logsDir = path.resolve(__dirname, '../logs');
// if (!fs.existsSync(logsDir)) {
//     fs.mkdirSync(logsDir);
// }
// function getLogFileName() {
//     const now = new Date();
//     const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
//     return path.resolve(__dirname, `../logs/log-${dateStr}.txt`);
// }
// function logMessage(message) {
//     const logFileName = getLogFileName();
//     const logEntry = `[${new Date().toISOString()}] ${message}\n`;

//     // Append the log entry to the log file
//     fs.appendFileSync(logFileName, logEntry, 'utf8');
// }

// Load or initialize user paths configuration
let userRepoPaths = {};
if (fs.existsSync(pathToRepoPaths)) {
    userRepoPaths = JSON.parse(fs.readFileSync(pathToRepoPaths, 'utf8'));
}

// Function to save user paths configuration
function saveUserRepoPaths() {
    fs.writeFileSync(pathToRepoPaths, JSON.stringify(userRepoPaths, null, 2));
}


// Load action log
let action_log = {};
if (fs.existsSync(gitActionLog)) {
    action_log = JSON.parse(fs.readFileSync(gitActionLog, 'utf8'));
}

// Function to update action log
function updateActionLog() {
    fs.writeFileSync(gitActionLog, JSON.stringify(action_log, null, 2));
}

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    // Skip messages from the bot itself or if the message doesn't start with the prefix
    if (message.author.bot || !message.content.startsWith('$')) return;

    const userID = message.author.tag+'('+message.author.id+')';
    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const branch = args[0] || 'main'; // Default to 'main' branch
    
    // logMessage(`User ${message.author.tag} (${userID}) issued command: ${command} ${args.join(' ')}`);

    // Debugging response
    let debugInfo = `Raw message content: ${message.content}\n`;
    let ping_response = `Hello, it's me\n`;
    ping_response += `I was wondering if after all these years you'd like to meet\n`;

    // **************** //
    // **BOT COMMANDS** //
    // **************** //

    // SET REPOSITORY COMMAND
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

    // RESET LAST PULL AND PUSH LOG COMMAND
    else if (command === 'reset') {
        action_log['last_pull'] = '-';
        action_log['last_push'] = '-';
        updateActionLog();

        message.channel.send(`Last pull and last push log has been reset.`);
    }

    // SEE LATEST LOG COMMAND
    else if (command === 'last') {
        let last_pull_log = action_log.last_pull;
        let last_push_log = action_log.last_push;

        message.channel.send(`Last pull by: ${last_pull_log}\nLast push by: ${last_push_log}\n`);
    }

    // PULL AND PUSH COMMAND
    else if (command === 'pull' || command === 'push') {
        const repoPath = userRepoPaths[userID];
        
        if (!repoPath) {
            return message.channel.send('No repository path set. Use $setrepo to set your repository path.');
        }

        // Ensure the path is formatted correctly for the environment
        // Convert to Unix-style path if running in Termux
        const formattedPath = repoPath.replace(/\\+/g, '/'); // Convert backslashes to slashes

        try {
            // PULL COMMAND
            if (command === 'pull') {
                if (action_log.last_pull != action_log.last_push) {
                    if (action_log.last_pull != '-' && action_log.last_push != '-') {
                        return message.channel.send('Pull denied! Somebody already pulled the Valheim world files.');
                    }
                }
            
                const axios_path = `${formattedPath}trigger-pull`;
                debugInfo += `Client URL: ${axios_path}\n`;

                await axios.get(axios_path);

                // Set last pull to user ID
                action_log['last_pull'] = userID;
                updateActionLog();

                message.channel.send(`Git pull triggered at branch ${branch}, Last pull by: ${userID}`);
            }
            // PUSH COMMAND
            else if (command === 'push') {
                const axios_path = `${formattedPath}trigger-push`;
                debugInfo += `Client URL: ${axios_path}\n`;
                
                await axios.get(axios_path);
                
                // Set last pull to user ID
                action_log['last_push'] = userID;
                updateActionLog();

                message.channel.send(`Successfully pushed to branch ${branch}, Last push by: ${userID}`);
            }
        }
        catch (error) {
            message.channel.send(`${debugInfo}Failed to execute ${command} on branch ${branch}\n${error.message}`);
        }
    }
    
    // HELP COMMAND
    else if (command === 'help') {
        let return_data = `$help : Show all the available commands.\n`;
        return_data += `$ping : Check bot availability.\n`;
        return_data += `$setrepo + your_repo_url : Register your local git repository.\n`;
        return_data += `$pull : Execute git pull commands.\n`;
        return_data += `$push : Execute git push commands.\n`;
        return_data += `$last : See latest pull and push history.\n`;
        return_data += `$reset : Reset pull and push history to default.\n`;

        message.channel.send(`${return_data}`);
    }

    // PING COMMAND
    else if (command === 'ping') {
        message.channel.send(ping_response);
    }
});

client.login(process.env.DISCORD_TOKEN);
