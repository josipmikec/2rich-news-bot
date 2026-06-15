const { Client, GatewayIntentBits } = require('discord.js');
const http = require('http');

const DISCORD_TOKEN  = process.env.DISCORD_TOKEN;
const BOT_SECRET     = process.env.BOT_SECRET;
const INGEST_URL     = process.env.INGEST_URL;
const CHANNEL_ID     = '1251147993382391890';
const PORT           = process.env.PORT || 3000;

// Filter out messages containing these domains
const BLOCKED_DOMAINS = [
    'financialjuice.com'
];

// Keep-alive HTTP server so Render doesn't complain about ports
http.createServer((req, res) => res.end('ok')).listen(PORT, () => {
    console.log(`Keep-alive server listening on port ${PORT}`);
});

// Ping self every 10 minutes to prevent Render free tier sleep
setInterval(() => {
    http.get(`http://localhost:${PORT}`, () => {}).on('error', () => {});
}, 10 * 60 * 1000);

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
    if (message.author.id === client.user.id) return;

    const content = message.content?.trim();

    if (!content) return;

    const isBlocked = BLOCKED_DOMAINS.some(domain =>
        content.toLowerCase().includes(domain)
    );
    if (isBlocked) {
        console.log(`[${new Date().toISOString()}] Skipped (blocked domain): ${content.substring(0, 80)}`);
        return;
    }

    const payload = {
        discord_id: message.id,
        message:    content,
        author:     message.author.username
    };

    try {
        const res = await fetch(INGEST_URL, {
            method:  'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Bot-Secret': BOT_SECRET
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
