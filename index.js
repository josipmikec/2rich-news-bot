const { Client, GatewayIntentBits } = require('discord.js');

const DISCORD_TOKEN  = process.env.DISCORD_TOKEN;
const BOT_SECRET     = process.env.BOT_SECRET;
const INGEST_URL     = process.env.INGEST_URL;
const CHANNEL_ID     = '1251147993382391890';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log(`Bot online as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.channelId !== CHANNEL_ID) return;
    if (message.author.bot) return;

    const payload = {
        discord_id: message.id,
        message:    message.content,
        author:     message.author.username
    };

    try {
        const res = await fetch(INGEST_URL, {
            method:  'POST',
            headers: {
                'Content-Type':  'application/json',
                'X-Bot-Secret':  BOT_SECRET
            },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        console.log(`[${new Date().toISOString()}] Ingested:`, data);
    } catch (err) {
        console.error('Ingest error:', err.message);
    }
});

client.login(DISCORD_TOKEN);
