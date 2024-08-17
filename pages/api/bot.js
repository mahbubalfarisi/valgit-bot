// pages/api/bot.js
import { Client } from 'discord.js';

const client = new Client({
  intents: [
    'GUILDS',
    'GUILD_MESSAGES',
    'MESSAGE_CONTENT',
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
