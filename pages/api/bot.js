// pages/api/bot.js
require('dotenv').config();
import { Client, GatewayIntentBits } from 'discord.js';
const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs');
const pathToRepoPaths = path.resolve(__dirname, '../public/user-repo.json');

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

  if (command === 'setrepo') {
    const repoPath = args.slice(1).join(' ');
    if (!repoPath) {
      return message.channel.send('Please provide the path to the repository.');
    }

    // Save the repository path for the user
    userRepoPaths[userID] = repoPath;
    saveUserRepoPaths();
    message.channel.send(`Repository path set to: ${repoPath}`);
  } else if (command === 'pull' || command === 'push') {
    const repoPath = userRepoPaths[userID];
    if (!repoPath) {
      return message.channel.send('No repository path set. Use $setrepo to set your repository path.');
    }

    const git = simpleGit({ baseDir: repoPath });

    try {
      if (command === 'pull') {
        await git.pull('origin', branch);
        message.channel.send(`Successfully pulled branch ${branch}`);
      } else if (command === 'push') {
        await git.add('./*');
        await git.commit('Automated commit');
        await git.push('origin', branch);
        message.channel.send(`Successfully pushed to branch ${branch}`);
      }
    } catch (error) {
      message.channel.send(`Failed to execute ${command} on branch ${branch}: ${error.message}`);
    }
  } else if (command === 'ping') {
    message.channel.send('Pong!');
  }
});

client.login(process.env.DISCORD_TOKEN);

export default async function handler(req, res) {
  res.status(200).json({ message: 'Bot is running!' });
}
