// pages/api/bot.js
require('dotenv').config();
import { Client, GatewayIntentBits } from 'discord.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,               // Required to access the guilds
    GatewayIntentBits.GuildMessages,        // Required to read messages in guilds
    GatewayIntentBits.MessageContent,       // Required to read the message content (e.g., for commands)
    GatewayIntentBits.GuildMessageReactions // Required to handle reactions if your bot will use them
  ],
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', message => {
  if (message.content === '!pinggu') {
    message.channel.send('Pong!');
  }
});

client.login(process.env.DISCORD_TOKEN);

export default async function handler(req, res) {
  res.status(200).json({ message: 'Bot is running!' });
}
