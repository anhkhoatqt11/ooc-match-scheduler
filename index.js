require('dotenv').config();
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const http = require('http');

// Debug environment variables
console.log('Environment check:');
console.log('- DISCORD_TOKEN:', process.env.DISCORD_TOKEN ? 'Set' : 'Missing');
console.log('- CLIENT_ID:', process.env.CLIENT_ID ? 'Set' : 'Missing');
console.log('- GUILD_ID:', process.env.GUILD_ID ? 'Set' : 'Missing');
console.log('- PORT:', process.env.PORT || 'Not set (will use 3000)');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions] });

client.commands = new Collection();

// Load lệnh
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

// Load sự kiện
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

// Create HTTP server for Render/Railway deployment
const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    
    if (url.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'healthy',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            bot_status: client.readyAt ? 'connected' : 'connecting',
            guilds: client.guilds ? client.guilds.cache.size : 0,
            ready_at: client.readyAt ? client.readyAt.toISOString() : null
        }));
    } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'Bot is running!', 
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            bot_status: client.readyAt ? 'connected' : 'connecting',
            guilds: client.guilds ? client.guilds.cache.size : 0,
            ready_at: client.readyAt ? client.readyAt.toISOString() : null,
            user: client.user ? {
                id: client.user.id,
                username: client.user.username,
                tag: client.user.tag
            } : null,
            environment: {
                node_version: process.version,
                discord_token_set: !!process.env.DISCORD_TOKEN,
                client_id_set: !!process.env.CLIENT_ID,
                guild_id_set: !!process.env.GUILD_ID
            },
            endpoints: {
                health: '/health',
                status: '/'
            }
        }));
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`HTTP server running on port ${PORT}`);
});

// Add connection error handling
client.on('error', (error) => {
    console.error('Discord client error:', error);
});

client.on('disconnect', () => {
    console.log('Discord client disconnected');
});

client.on('reconnecting', () => {
    console.log('Discord client reconnecting...');
});

// Login to Discord
if (!process.env.DISCORD_TOKEN) {
    console.error('❌ DISCORD_TOKEN is not set in environment variables!');
    console.error('Please set the following environment variables in your Render dashboard:');
    console.error('- DISCORD_TOKEN: Your Discord bot token');
    console.error('- CLIENT_ID: Your Discord application client ID');
    console.error('- GUILD_ID: Your Discord guild ID');
    process.exit(1);
}

console.log('🔑 Attempting to login to Discord...');
client.login(process.env.DISCORD_TOKEN)
    .then(() => {
        console.log('✅ Discord login successful!');
    })
    .catch(error => {
        console.error('❌ Failed to login to Discord:', error);
        console.error('Check if your DISCORD_TOKEN is correct and the bot has proper permissions.');
        process.exit(1);
    });
