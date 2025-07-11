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

// Connection status tracking
let connectionStatus = 'initializing';
let connectionAttempts = 0;
let lastConnectionError = null;

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.GuildMessageReactions
    ],
    // Enhanced configuration for cloud deployment connectivity
    ws: {
        version: 10,
        encoding: 'json',
        compress: false,
        properties: {
            browser: 'Discord.js',
            device: 'Discord.js',
            os: process.platform
        }
    },
    rest: {
        timeout: 60000, // 60 seconds timeout for REST requests
        retries: 5,
        restTimeOffset: 0
    },
    // Reduce memory usage for cloud deployment
    sweepers: {
        messages: {
            interval: 300,
            lifetime: 1800
        },
        users: {
            interval: 300,
            filter: () => user => user.bot && user.id !== client.user.id
        }
    },
    // Additional failover options
    failIfNotExists: false,
    allowedMentions: {
        parse: ['users', 'roles'],
        repliedUser: true
    }
});

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
            connection: {
                status: connectionStatus,
                bot_ready: client.readyAt ? 'connected' : 'connecting',
                login_attempts: loginAttempts,
                max_attempts: maxLoginAttempts,
                last_error: lastConnectionError,
                guilds: client.guilds ? client.guilds.cache.size : 0,
                ready_at: client.readyAt ? client.readyAt.toISOString() : null,
                user: client.user ? {
                    id: client.user.id,
                    username: client.user.username,
                    tag: client.user.tag
                } : null
            },
            environment: {
                node_version: process.version,
                discord_token_set: !!process.env.DISCORD_TOKEN,
                discord_token_length: process.env.DISCORD_TOKEN ? process.env.DISCORD_TOKEN.length : 0,
                discord_token_starts: process.env.DISCORD_TOKEN ? process.env.DISCORD_TOKEN.substring(0, 10) + '...' : 'N/A',
                discord_token_format_ok: process.env.DISCORD_TOKEN ? process.env.DISCORD_TOKEN.includes('.') : false,
                client_id_set: !!process.env.CLIENT_ID,
                guild_id_set: !!process.env.GUILD_ID,
                port: process.env.PORT || 3000
            },
            endpoints: {
                health: '/health',
                status: '/',
                debug: '/debug'
            }
        }));
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`HTTP server running on port ${PORT}`);
});

// Add connection event handlers before login
client.on('ready', () => {
    connectionStatus = 'connected';
    console.log(`✅ Discord bot ready! Logged in as ${client.user.tag}`);
    console.log(`📊 Connected to ${client.guilds.cache.size} guild(s)`);
});

client.on('error', (error) => {
    connectionStatus = 'error';
    lastConnectionError = error.message;
    console.error('❌ Discord client error:', error);
    
    // Log additional details for network-related errors
    if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
        console.error('🌐 Network error detected. This might be a connectivity issue with Discord API');
        console.error('Error details:', {
            code: error.code,
            errno: error.errno,
            syscall: error.syscall,
            hostname: error.hostname
        });
    }
});

client.on('disconnect', () => {
    connectionStatus = 'disconnected';
    console.log('⚠️ Discord client disconnected');
});

client.on('reconnecting', () => {
    connectionStatus = 'reconnecting';
    console.log('🔄 Discord client reconnecting...');
});

client.on('warn', (warning) => {
    console.warn('⚠️ Discord warning:', warning);
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
console.log('🔑 Token length:', process.env.DISCORD_TOKEN ? process.env.DISCORD_TOKEN.length : 0);
console.log('🔑 Token starts with:', process.env.DISCORD_TOKEN ? process.env.DISCORD_TOKEN.substring(0, 10) + '...' : 'N/A');

// Basic token validation
if (process.env.DISCORD_TOKEN && !process.env.DISCORD_TOKEN.includes('.')) {
    console.error('❌ Discord token appears to be malformed (missing dots)');
    console.error('Expected format: XXXXXXXXXXXXXXXXXXXXXXXXXX.XXXXXX.XXXXXXXXXXXXXXXXXXXXXXXXXXX');
}

// Enhanced login function with progressive retry strategy
let loginAttempts = 0;
const maxLoginAttempts = 10;
let loginInProgress = false;

async function attemptLogin() {
    if (loginInProgress) {
        console.log('🔄 Login already in progress, skipping...');
        return;
    }
    
    loginInProgress = true;
    loginAttempts++;
    
    console.log(`🔄 Discord login attempt ${loginAttempts}/${maxLoginAttempts}`);
    
    try {
        // Set connection status
        connectionStatus = 'connecting';
        
        // Create timeout for this specific attempt
        const timeoutDuration = Math.min(30000 + (loginAttempts * 10000), 120000); // 30s to 2min
        const loginTimeout = setTimeout(() => {
            console.log(`⏰ Login attempt ${loginAttempts} timed out after ${timeoutDuration/1000} seconds`);
            connectionStatus = 'timeout';
        }, timeoutDuration);
        
        // Attempt login
        await client.login(process.env.DISCORD_TOKEN);
        
        // Clear timeout
        clearTimeout(loginTimeout);
        
        // Wait for ready event
        await new Promise((resolve, reject) => {
            const readyTimeout = setTimeout(() => {
                reject(new Error('Ready event timeout'));
            }, 10000);
            
            if (client.readyAt) {
                clearTimeout(readyTimeout);
                resolve();
            } else {
                client.once('ready', () => {
                    clearTimeout(readyTimeout);
                    resolve();
                });
            }
        });
        
        console.log('✅ Discord login successful!');
        loginInProgress = false;
        loginAttempts = 0; // Reset counter on success
        
    } catch (error) {
        console.error(`❌ Login attempt ${loginAttempts} failed:`, error.message);
        console.error('Error details:', {
            code: error.code,
            name: error.name,
            stack: error.stack?.split('\n')[0] // Just first line of stack
        });
        
        lastConnectionError = error.message;
        loginInProgress = false;
        
        // Log network diagnostics
        if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
            console.error('🌐 Network connectivity issue detected');
            console.error('This suggests the problem is between Render and Discord API');
            console.error('Common causes: DNS resolution, firewall, or Discord API regional issues');
        }
        
        // Handle specific error codes
        if (error.code === 'TOKEN_INVALID') {
            console.error('🔑 The Discord token is invalid. Please check your token.');
            process.exit(1);
        } else if (error.code === 'DISALLOWED_INTENTS') {
            console.error('🔐 Bot intents are not allowed. Check your Discord application settings.');
            process.exit(1);
        }
        
        // Retry logic
        if (loginAttempts < maxLoginAttempts) {
            const retryDelay = Math.min(5000 + (loginAttempts * 5000), 60000); // 5s to 60s
            console.log(`🔄 Retrying in ${retryDelay/1000} seconds... (${loginAttempts}/${maxLoginAttempts})`);
            
            setTimeout(() => {
                attemptLogin();
            }, retryDelay);
        } else {
            console.error('� Maximum login attempts reached. Starting over...');
            loginAttempts = 0;
            setTimeout(() => {
                attemptLogin();
            }, 120000); // Wait 2 minutes before starting over
        }
    }
}

// Start the login process
console.log('🚀 Starting Discord connection process...');
attemptLogin();
